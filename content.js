// Content script: watches YouTube's comment section and hides comments that
// match the configured patterns. YouTube is a single-page app that renders
// comments lazily, so everything is driven by a MutationObserver.
(function () {
  'use strict';

  const COMMENT_SELECTOR = 'ytd-comment-view-model, ytd-comment-renderer';
  const THREAD_SELECTOR = 'ytd-comment-thread-renderer';
  const REPLIES_SELECTOR = 'ytd-comment-replies-renderer';

  const state = {
    enabled: true,
    mode: 'collapse', // 'collapse' shows a one-line placeholder; 'hide' removes entirely
    autoDislike: false, // click the dislike button on matched comments (signed-in only)
    patterns: [],
    dislikeQueue: [],
    dislikeTimer: null,
    hiddenCount: 0,
    scanScheduled: false,
  };

  // --- settings ---------------------------------------------------------------

  function loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(
        { enabled: true, mode: 'collapse', autoDislike: false, customPatterns: [], disabledDefaults: [] },
        (items) => {
          state.enabled = items.enabled !== false;
          state.mode = items.mode === 'hide' ? 'hide' : 'collapse';
          state.autoDislike = items.autoDislike === true;
          state.patterns = self
            .YTCF_compileDefaults(items.disabledDefaults)
            .concat(self.YTCF_compileCustom(items.customPatterns));
          resolve();
        }
      );
    });
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    loadSettings().then(() => {
      // Settings changed: undo everything and re-evaluate from scratch.
      revealAll(false);
      scheduleScan();
    });
  });

  // --- matching ---------------------------------------------------------------

  function findMatch(text) {
    const norm = self.YTCF_normalize(text);
    if (!norm) return null;
    for (const p of state.patterns) {
      if (p.re.test(norm)) return p.name;
    }
    return null;
  }

  // The element to hide: whole thread for a top-level comment, just the reply otherwise.
  function containerFor(commentEl) {
    if (commentEl.closest(REPLIES_SELECTOR)) return commentEl;
    return commentEl.closest(THREAD_SELECTOR) || commentEl;
  }

  function commentText(commentEl) {
    const el = commentEl.querySelector('#content-text');
    return el ? el.textContent : '';
  }

  // --- hiding / revealing ---------------------------------------------------------

  function hide(container, text, reason) {
    if (container.classList.contains('ytcf-hidden')) return;
    container.classList.add('ytcf-hidden');
    container.dataset.ytcfReason = reason;

    if (state.mode === 'collapse') {
      const ph = document.createElement('div');
      ph.className = 'ytcf-placeholder';
      ph.title = `Hidden by YouTube Comment Declutter (${reason})`;
      const label = document.createElement('span');
      label.textContent = 'Hidden comment:';
      const quote = document.createElement('span');
      quote.className = 'ytcf-quote';
      quote.textContent = `“${text.trim()}”`;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = 'Show';
      btn.addEventListener('click', () => {
        container.dataset.ytcfRevealed = '1';
        container.classList.remove('ytcf-hidden');
        ph.remove();
        updateCount();
      });
      ph.append(label, quote, btn);
      container.insertAdjacentElement('beforebegin', ph);
      container.ytcfPlaceholder = ph;
    }
  }

  function unhide(container) {
    container.classList.remove('ytcf-hidden');
    delete container.dataset.ytcfReason;
    if (container.ytcfPlaceholder) {
      container.ytcfPlaceholder.remove();
      container.ytcfPlaceholder = null;
    }
  }

  function revealAll(keepRevealMarks) {
    document.querySelectorAll('.ytcf-hidden').forEach(unhide);
    document.querySelectorAll('.ytcf-placeholder').forEach((el) => el.remove());
    document.querySelectorAll('[data-ytcf-text]').forEach((el) => {
      delete el.dataset.ytcfText;
      if (!keepRevealMarks) delete el.dataset.ytcfRevealed;
    });
    updateCount();
  }

  // --- auto-dislike ---------------------------------------------------------------
  // Only acts when the user can vote: YouTube renders a real <button aria-pressed>
  // inside #dislike-button for signed-in accounts that have a channel, and a plain
  // link (sign-in or create-channel) otherwise.
  // Clicks are spaced out and each comment is only ever clicked once, so an
  // already-disliked comment is never toggled back.

  const DISLIKE_INTERVAL_MS = 1500;

  function queueDislike(commentEl) {
    if (!state.autoDislike || commentEl.dataset.ytcfDisliked) return;
    commentEl.dataset.ytcfDisliked = 'queued';
    state.dislikeQueue.push(commentEl);
    if (!state.dislikeTimer) state.dislikeTimer = setTimeout(drainDislikeQueue, 300);
  }

  function drainDislikeQueue() {
    state.dislikeTimer = null;
    const el = state.dislikeQueue.shift();
    if (!el) return;
    if (state.autoDislike && el.isConnected) {
      // Never click an <a>: without a channel YouTube renders a /create_channel
      // (or sign-in) link here instead of a toggle button.
      const btn = el.querySelector('#dislike-button button[aria-pressed], #dislike-button [role="button"][aria-pressed]');
      if (btn && btn.getAttribute('aria-pressed') !== 'true') {
        btn.click();
        el.dataset.ytcfDisliked = 'clicked';
        report({ type: 'ytcf:event', kind: 'disliked', reason: containerFor(el).dataset.ytcfReason || '' });
      } else {
        el.dataset.ytcfDisliked = btn ? 'already' : 'unavailable';
      }
    }
    if (state.dislikeQueue.length) state.dislikeTimer = setTimeout(drainDislikeQueue, DISLIKE_INTERVAL_MS);
  }

  // --- scoreboard ---------------------------------------------------------------
  // Hidden comments are batched; dislikes are reported one at a time (they are
  // already rate-limited). The background replies with any newly unlocked
  // achievements or rank-ups, which we show as a toast on the page.

  let pendingHidden = 0;
  let hiddenFlushTimer = null;

  function flushHidden() {
    hiddenFlushTimer = null;
    if (!pendingHidden) return;
    const n = pendingHidden;
    pendingHidden = 0;
    report({ type: 'ytcf:event', kind: 'hidden', count: n });
  }

  function report(msg) {
    try {
      chrome.runtime.sendMessage(msg, (resp) => {
        if (chrome.runtime.lastError || !resp) return;
        if (resp.rankUp) toast(`${resp.rankUp.emoji} Rank up: ${resp.rankUp.title}`, `${resp.stats.disliked} dislikes delivered`);
        for (const a of resp.unlocked || []) toast(`${a.emoji} Achievement unlocked: ${a.title}`, a.desc);
      });
    } catch (e) {
      /* extension context may be gone during reload */
    }
  }

  function toast(title, body) {
    let host = document.getElementById('ytcf-toasts');
    if (!host) {
      host = document.createElement('div');
      host.id = 'ytcf-toasts';
      document.body.appendChild(host);
    }
    const el = document.createElement('div');
    el.className = 'ytcf-toast';
    const t = document.createElement('div');
    t.className = 'ytcf-toast-title';
    t.textContent = title;
    const b = document.createElement('div');
    b.className = 'ytcf-toast-body';
    b.textContent = body;
    el.append(t, b);
    host.appendChild(el);
    requestAnimationFrame(() => el.classList.add('ytcf-toast-in'));
    setTimeout(() => {
      el.classList.remove('ytcf-toast-in');
      setTimeout(() => el.remove(), 400);
    }, 5000);
  }

  // --- scanning ---------------------------------------------------------------

  function scan() {
    state.scanScheduled = false;
    if (!state.enabled) return;

    const comments = document.querySelectorAll(COMMENT_SELECTOR);
    for (const el of comments) {
      const text = commentText(el);
      // YouTube recycles nodes, so re-check whenever the text changes.
      if (el.dataset.ytcfText === text) continue;
      el.dataset.ytcfText = text;

      const container = containerFor(el);
      if (container.dataset.ytcfRevealed === '1') continue;

      const reason = findMatch(text);
      if (reason) {
        hide(container, text, reason);
        queueDislike(el);
        if (!el.dataset.ytcfCounted) {
          el.dataset.ytcfCounted = '1';
          pendingHidden++;
          if (!hiddenFlushTimer) hiddenFlushTimer = setTimeout(flushHidden, 2000);
        }
      } else if (container.classList.contains('ytcf-hidden') && container === el) {
        // A recycled node that now holds a benign reply.
        unhide(container);
      }
    }
    updateCount();
  }

  function scheduleScan() {
    if (state.scanScheduled) return;
    state.scanScheduled = true;
    setTimeout(scan, 120);
  }

  function updateCount() {
    const n = document.querySelectorAll('.ytcf-hidden').length;
    if (n === state.hiddenCount) return;
    state.hiddenCount = n;
    try {
      chrome.runtime.sendMessage({ type: 'ytcf:count', count: n });
    } catch (e) {
      /* extension context may be gone during reload */
    }
  }

  // --- messaging with popup ---------------------------------------------------------

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg && msg.type === 'ytcf:getStats') {
      const reasons = {};
      document.querySelectorAll('.ytcf-hidden').forEach((el) => {
        const r = el.dataset.ytcfReason || 'unknown';
        reasons[r] = (reasons[r] || 0) + 1;
      });
      const disliked = document.querySelectorAll('[data-ytcf-disliked="clicked"]').length;
      const unavailable = document.querySelectorAll('[data-ytcf-disliked="unavailable"]').length;
      sendResponse({ count: state.hiddenCount, reasons, enabled: state.enabled, disliked, unavailable });
    }
    return false;
  });

  // --- boot ---------------------------------------------------------------

  loadSettings().then(() => {
    const observer = new MutationObserver(scheduleScan);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    // YouTube fires this on in-app navigation between videos.
    document.addEventListener('yt-navigate-finish', () => {
      state.hiddenCount = -1;
      updateCount();
      scheduleScan();
    });
    scan();
  });
})();

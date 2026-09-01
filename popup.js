(function () {
  const $ = (s) => document.querySelector(s);
  const DEFAULTS = { enabled: true, mode: 'collapse', autoDislike: false, showBadge: true, customPatterns: [], disabledDefaults: [] };
  let saveTimer = null;

  function flashSaved() {
    const el = $('#saved');
    el.classList.add('show');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => el.classList.remove('show'), 1200);
  }

  function save(partial) {
    chrome.storage.sync.set(partial, flashSaved);
  }

  function renderDefaults(disabled) {
    const list = $('#defaults');
    list.innerHTML = '';
    const off = new Set(disabled);
    for (const p of self.YTCF_DEFAULT_PATTERNS) {
      const li = document.createElement('li');
      const label = document.createElement('label');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = !off.has(p.name);
      cb.addEventListener('change', () => {
        // --- trophy room ---
  function currentStreak(days) {
    const p = (n) => String(n).padStart(2, '0');
    const key = (d) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    const d = new Date();
    if (!days[key(d)]) d.setDate(d.getDate() - 1); // streak still alive if you disliked yesterday
    let n = 0;
    while (days[key(d)] > 0) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  function renderStats(stats) {
    stats = Object.assign(self.YTCF_EMPTY_STATS(), stats || {});
    const { rank, next } = self.YTCF_rankFor(stats.disliked);
    $('#rankEmoji').textContent = rank.emoji;
    $('#rankTitle').textContent = rank.title;
    if (next) {
      const span = next.min - rank.min;
      const pct = Math.min(100, Math.round(((stats.disliked - rank.min) / span) * 100));
      $('#rankNext').textContent = `${next.min - stats.disliked} more victims until ${next.emoji} ${next.title}`;
      $('#rankBar').style.width = pct + '%';
    } else {
      $('#rankNext').textContent = 'Max rank. The comment section speaks your name in whispers.';
      $('#rankBar').style.width = '100%';
    }
    $('#totalDisliked').textContent = stats.disliked.toLocaleString();
    $('#totalHidden').textContent = stats.hidden.toLocaleString();
    $('#streak').textContent = String(currentStreak(stats.days));
    $('#bestDay').textContent = String(stats.bestDay);

    const ul = $('#achievements');
    ul.innerHTML = '';
    for (const a of self.YTCF_ACHIEVEMENTS) {
      const li = document.createElement('li');
      const when = stats.achievements[a.id];
      li.textContent = a.emoji;
      li.className = when ? 'unlocked' : 'locked';
      li.title = `${a.title}\n${a.desc}` + (when ? `\nUnlocked ${new Date(when).toLocaleDateString()}` : '\nLocked');
      ul.append(li);
    }
  }

  chrome.storage.local.get({ stats: null }, (items) => renderStats(items.stats));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.stats) renderStats(changes.stats.newValue);
  });

  let resetArmed = false;
  $('#reset').addEventListener('click', () => {
    if (!resetArmed) {
      resetArmed = true;
      $('#reset').textContent = 'Really reset? Click again';
      setTimeout(() => { resetArmed = false; $('#reset').textContent = 'Reset stats'; }, 3000);
      return;
    }
    resetArmed = false;
    $('#reset').textContent = 'Reset stats';
    chrome.runtime.sendMessage({ type: 'ytcf:resetStats' });
  });

  chrome.storage.sync.get(DEFAULTS, (items) => {
          const set = new Set(items.disabledDefaults);
          cb.checked ? set.delete(p.name) : set.add(p.name);
          save({ disabledDefaults: [...set] });
        });
      });
      label.append(cb, document.createTextNode(p.name));
      li.append(label);
      list.append(li);
    }
  }

  function refreshStats() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab || !/^https:\/\/(www|m)\.youtube\.com\//.test(tab.url || '')) {
        $('#count').textContent = '0';
        $('#reasons').innerHTML = '<li>Open a YouTube video to see stats.</li>';
        return;
      }
      chrome.tabs.sendMessage(tab.id, { type: 'ytcf:getStats' }, (resp) => {
        if (chrome.runtime.lastError || !resp) {
          $('#reasons').innerHTML = '<li>Reload the YouTube tab to activate.</li>';
          return;
        }
        $('#count').textContent = String(resp.count);
        $('#disliked').textContent = resp.disliked
          ? ` · ${resp.disliked} disliked`
          : resp.unavailable
            ? ' · can\'t dislike: sign in with an account that has a channel'
            : '';
        const ul = $('#reasons');
        ul.innerHTML = '';
        Object.entries(resp.reasons)
          .sort((a, b) => b[1] - a[1])
          .forEach(([name, n]) => {
            const li = document.createElement('li');
            li.innerHTML = `<span></span><span></span>`;
            li.children[0].textContent = name;
            li.children[1].textContent = String(n);
            ul.append(li);
          });
      });
    });
  }

  // --- trophy room ---
  function currentStreak(days) {
    const p = (n) => String(n).padStart(2, '0');
    const key = (d) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    const d = new Date();
    if (!days[key(d)]) d.setDate(d.getDate() - 1); // streak still alive if you disliked yesterday
    let n = 0;
    while (days[key(d)] > 0) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  function renderStats(stats) {
    stats = Object.assign(self.YTCF_EMPTY_STATS(), stats || {});
    const { rank, next } = self.YTCF_rankFor(stats.disliked);
    $('#rankEmoji').textContent = rank.emoji;
    $('#rankTitle').textContent = rank.title;
    if (next) {
      const span = next.min - rank.min;
      const pct = Math.min(100, Math.round(((stats.disliked - rank.min) / span) * 100));
      $('#rankNext').textContent = `${next.min - stats.disliked} more victims until ${next.emoji} ${next.title}`;
      $('#rankBar').style.width = pct + '%';
    } else {
      $('#rankNext').textContent = 'Max rank. The comment section speaks your name in whispers.';
      $('#rankBar').style.width = '100%';
    }
    $('#totalDisliked').textContent = stats.disliked.toLocaleString();
    $('#totalHidden').textContent = stats.hidden.toLocaleString();
    $('#streak').textContent = String(currentStreak(stats.days));
    $('#bestDay').textContent = String(stats.bestDay);

    const ul = $('#achievements');
    ul.innerHTML = '';
    for (const a of self.YTCF_ACHIEVEMENTS) {
      const li = document.createElement('li');
      const when = stats.achievements[a.id];
      li.textContent = a.emoji;
      li.className = when ? 'unlocked' : 'locked';
      li.title = `${a.title}\n${a.desc}` + (when ? `\nUnlocked ${new Date(when).toLocaleDateString()}` : '\nLocked');
      ul.append(li);
    }
  }

  chrome.storage.local.get({ stats: null }, (items) => renderStats(items.stats));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.stats) renderStats(changes.stats.newValue);
  });

  let resetArmed = false;
  $('#reset').addEventListener('click', () => {
    if (!resetArmed) {
      resetArmed = true;
      $('#reset').textContent = 'Really reset? Click again';
      setTimeout(() => { resetArmed = false; $('#reset').textContent = 'Reset stats'; }, 3000);
      return;
    }
    resetArmed = false;
    $('#reset').textContent = 'Reset stats';
    chrome.runtime.sendMessage({ type: 'ytcf:resetStats' });
  });

  chrome.storage.sync.get(DEFAULTS, (items) => {
    $('#enabled').checked = items.enabled !== false;
    document.querySelector(`input[name=mode][value=${items.mode === 'hide' ? 'hide' : 'collapse'}]`).checked = true;
    $('#autoDislike').checked = items.autoDislike === true;
    $('#showBadge').checked = items.showBadge !== false;
    $('#custom').value = (items.customPatterns || []).join('\n');
    renderDefaults(items.disabledDefaults || []);
  });

  $('#enabled').addEventListener('change', (e) => save({ enabled: e.target.checked }));
  $('#autoDislike').addEventListener('change', (e) => save({ autoDislike: e.target.checked }));
  $('#showBadge').addEventListener('change', (e) => save({ showBadge: e.target.checked }));
  document.querySelectorAll('input[name=mode]').forEach((r) =>
    r.addEventListener('change', (e) => save({ mode: e.target.value }))
  );
  let customTimer = null;
  $('#custom').addEventListener('input', (e) => {
    clearTimeout(customTimer);
    customTimer = setTimeout(() => {
      const lines = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean);
      save({ customPatterns: lines });
    }, 400);
  });

  refreshStats();
  setInterval(refreshStats, 1500);
})();

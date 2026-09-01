// Service worker: badge count per tab, plus the lifetime scoreboard.
// All stat writes go through here so multiple YouTube tabs never race.
importScripts('awards.js');

const SETTINGS_DEFAULTS = { enabled: true, mode: 'collapse', autoDislike: false, customPatterns: [], disabledDefaults: [] };

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(SETTINGS_DEFAULTS, (items) => chrome.storage.sync.set(items));
  chrome.storage.local.get({ stats: null }, (items) => {
    if (!items.stats) chrome.storage.local.set({ stats: self.YTCF_EMPTY_STATS() });
  });
});

// --- stats ---------------------------------------------------------------

function localDateKey(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function streakEndingOn(days, key) {
  let n = 0;
  const d = new Date(key + 'T12:00:00');
  while (days[localDateKey(d)] > 0) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

// Applies one event to stats. Returns the list of newly unlocked achievements.
function applyEvent(stats, ev) {
  const now = new Date();
  const iso = now.toISOString();
  stats.firstAt = stats.firstAt || iso;
  stats.lastAt = iso;

  if (ev.kind === 'hidden') {
    stats.hidden += ev.count || 1;
  } else if (ev.kind === 'disliked') {
    stats.disliked += 1;
    if (ev.reason) stats.byReason[ev.reason] = (stats.byReason[ev.reason] || 0) + 1;
    const key = localDateKey(now);
    stats.days[key] = (stats.days[key] || 0) + 1;
    stats.bestDay = Math.max(stats.bestDay, stats.days[key]);
    stats.bestStreak = Math.max(stats.bestStreak, streakEndingOn(stats.days, key));
    if (now.getHours() < 4) stats.nightOwl = true;
    // Keep the per-day map from growing forever.
    const keys = Object.keys(stats.days).sort();
    while (keys.length > 400) delete stats.days[keys.shift()];
  }

  const unlocked = [];
  for (const a of self.YTCF_ACHIEVEMENTS) {
    if (stats.achievements[a.id]) continue;
    let ok = false;
    try { ok = a.test(stats); } catch (e) { ok = false; }
    if (ok) {
      stats.achievements[a.id] = iso;
      unlocked.push({ id: a.id, emoji: a.emoji, title: a.title, desc: a.desc });
    }
  }
  return unlocked;
}

// Serialize read-modify-write cycles.
let chain = Promise.resolve();
function recordEvent(ev) {
  const run = () =>
    new Promise((resolve) => {
      chrome.storage.local.get({ stats: null }, (items) => {
        const stats = Object.assign(self.YTCF_EMPTY_STATS(), items.stats || {});
        const before = self.YTCF_rankFor(stats.disliked).rank;
        const unlocked = applyEvent(stats, ev);
        const after = self.YTCF_rankFor(stats.disliked).rank;
        chrome.storage.local.set({ stats }, () => {
          resolve({
            stats,
            unlocked,
            rankUp: after !== before ? after : null,
          });
        });
      });
    });
  const p = chain.then(run, run);
  chain = p.catch(() => {});
  return p;
}

// --- messages ---------------------------------------------------------------

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg) return false;

  if (msg.type === 'ytcf:count' && sender.tab) {
    const tabId = sender.tab.id;
    const count = Math.max(0, msg.count | 0);
    chrome.action.setBadgeText({ tabId, text: count ? String(count) : '' });
    chrome.action.setBadgeBackgroundColor({ tabId, color: '#cc0000' });
    return false;
  }

  if (msg.type === 'ytcf:event') {
    recordEvent(msg).then(sendResponse);
    return true; // async response
  }

  if (msg.type === 'ytcf:resetStats') {
    chrome.storage.local.set({ stats: self.YTCF_EMPTY_STATS() }, () => sendResponse({ ok: true }));
    return true;
  }
  return false;
});

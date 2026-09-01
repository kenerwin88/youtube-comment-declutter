// Ranks and achievements. Shared by background.js (evaluation) and popup.js (display).
(function (root) {
  // Ranks are based on lifetime dislikes.
  root.YTCF_RANKS = [
    { min: 0, title: 'Silently Judging', emoji: '👀' },
    { min: 1, title: 'Touched the Button. Felt Nothing.', emoji: '👎' },
    { min: 10, title: 'Taking Out the Trash', emoji: '🗑️' },
    { min: 25, title: 'Ban Hammer Apprentice', emoji: '🔨' },
    { min: 50, title: 'Puts Out "First!" Fires For a Living', emoji: '🧯' },
    { min: 100, title: 'Serial Ratio-er', emoji: '💀' },
    { min: 250, title: 'Undertaker of "Anyone 2026?"', emoji: '⚰️' },
    { min: 500, title: 'Comment Section Demolition Crew', emoji: '🧨' },
    { min: 1000, title: 'Cold-Blooded Dislike Machine', emoji: '🥶' },
    { min: 2500, title: 'Timeline Enforcer. Nobody Is Watching In 2026. Not On My Watch.', emoji: '🩸' },
    { min: 5000, title: 'The Reason YouTube Hid the Dislike Count', emoji: '☠️' },
    { min: 10000, title: 'Yes, I\'m Still Here In 2026. Disliking You Specifically.', emoji: '🔥' },
  ];

  // Each achievement gets the stats object and returns true when unlocked.
  root.YTCF_ACHIEVEMENTS = [
    { id: 'first_dislike', emoji: '👎', title: 'Not Anyone, Actually', desc: 'Dislike your first "anyone 2026?"-style comment', test: (s) => s.disliked >= 1 },
    { id: 'dislike_10', emoji: '🔟', title: 'Like If You Disliked 10', desc: 'Dislike 10 comments', test: (s) => s.disliked >= 10 },
    { id: 'dislike_50', emoji: '🎯', title: 'Who\'s Disliking In September?', desc: 'Dislike 50 comments', test: (s) => s.disliked >= 50 },
    { id: 'dislike_100', emoji: '💯', title: 'This Still Slaps (Them)', desc: 'Dislike 100 comments', test: (s) => s.disliked >= 100 },
    { id: 'dislike_500', emoji: '🌪️', title: 'Ratio\'d Half a Thousand Strangers', desc: 'Dislike 500 comments', test: (s) => s.disliked >= 500 },
    { id: 'dislike_1000', emoji: '🏛️', title: 'If You\'re Reading This In 2030, I\'m Still Disliking', desc: 'Dislike 1,000 comments', test: (s) => s.disliked >= 1000 },
    { id: 'hidden_100', emoji: '🧼', title: 'Anyone Else Not Seeing These?', desc: 'Hide 100 comments', test: (s) => s.hidden >= 100 },
    { id: 'hidden_1000', emoji: '🌊', title: 'Comments Turned Off (By Me)', desc: 'Hide 1,000 comments', test: (s) => s.hidden >= 1000 },
    { id: 'hidden_10000', emoji: '🗿', title: 'Have You Considered Going Outside', desc: 'Hide 10,000 comments', test: (s) => s.hidden >= 10000 },
    { id: 'day_25', emoji: '☕', title: 'Who\'s Here After Their Morning Coffee?', desc: '25 dislikes in a single day', test: (s) => s.bestDay >= 25 },
    { id: 'day_100', emoji: '🔥', title: 'Anyone Else Doing This Instead of Working?', desc: '100 dislikes in a single day', test: (s) => s.bestDay >= 100 },
    { id: 'streak_3', emoji: '🚔', title: 'Time Police Academy', desc: 'Dislike on 3 days in a row', test: (s) => s.bestStreak >= 3 },
    { id: 'streak_7', emoji: '📅', title: 'Who\'s Watching In... Every Day This Week', desc: 'Dislike on 7 days in a row', test: (s) => s.bestStreak >= 7 },
    { id: 'streak_30', emoji: '🗓️', title: 'Still Here In 30 Days? Yes, Unfortunately', desc: 'Dislike on 30 days in a row', test: (s) => s.bestStreak >= 30 },
    { id: 'night_owl', emoji: '🦉', title: 'Who\'s Disliking at 3AM?', desc: 'Dislike a comment between midnight and 4am', test: (s) => s.nightOwl === true },
    { id: 'year_hunter', emoji: '🕰️', title: 'Anyone 2026? No.', desc: 'Dislike 50 "anyone <year>?" comments', test: (s) => (s.byReason['anyone + date'] || 0) >= 50 },
    { id: 'first_responder', emoji: '🥈', title: 'Second!', desc: 'Dislike 25 "first!" comments', test: (s) => (s.byReason['first!'] || 0) >= 25 },
    { id: 'like_beggar', emoji: '🙏', title: 'Thumbs Down If You Beg For Thumbs Up', desc: 'Dislike 25 "like if..." comments', test: (s) => (s.byReason['like if ...'] || 0) >= 25 },
    { id: 'nobody_asked', emoji: '🤐', title: 'Nobody: Literally Nobody:', desc: 'Dislike 25 "nobody: / me:" comments', test: (s) => (s.byReason['nobody: / me:'] || 0) >= 25 },
  ];

  root.YTCF_rankFor = function (disliked) {
    let rank = root.YTCF_RANKS[0];
    let next = null;
    for (let i = 0; i < root.YTCF_RANKS.length; i++) {
      if (disliked >= root.YTCF_RANKS[i].min) {
        rank = root.YTCF_RANKS[i];
        next = root.YTCF_RANKS[i + 1] || null;
      }
    }
    return { rank, next };
  };

  root.YTCF_EMPTY_STATS = function () {
    return {
      disliked: 0,
      hidden: 0,
      byReason: {},
      days: {}, // 'YYYY-MM-DD' -> dislikes that day
      bestDay: 0,
      bestStreak: 0,
      nightOwl: false,
      firstAt: null,
      lastAt: null,
      achievements: {}, // id -> ISO timestamp unlocked
    };
  };
})(typeof self !== 'undefined' ? self : globalThis);

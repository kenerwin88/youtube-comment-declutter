// Default patterns for repetitive YouTube comments.
// Shared by the content script and the popup (loaded as a plain script in both).
// Each entry is { name, source } and is compiled with the "i" flag against a
// normalized (lowercased, whitespace-collapsed) copy of the comment text.
(function (root) {
  const MONTH =
    '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
  const YEAR = '(?:19|20)\\d\\d';
  const DATE = `(?:${MONTH}(?:\\W+${YEAR})?|${YEAR})`;
  // Same as DATE but also relative phrasings: "anyone today?", "who's here rn"
  const WHEN = `(?:${DATE}|today|tonight|right\\s+now|rn|this\\s+(?:year|month|week))`;
  const WHO = "(?:any\\s*(?:one|body)(?:\\s+else)?|who(?:'?s|\\s+is|\\s+else(?:\\s+is)?)?)";
  const HERE = '(?:here|watching|listening|still\\s+here|still\\s+watching|still\\s+listening|vibing|around|alive)';

  root.YTCF_DEFAULT_PATTERNS = [
    // "anyone 2026?", "anybody september 2026??", "anyone in 2026", "who is here august 2026?", "anyone today????"
    { name: 'anyone + date', source: `^\\W*${WHO}\\W*(?:still\\s+)?(?:${HERE}\\s*)?(?:in|from|since)?\\W*${WHEN}\\W*$` },
    // "anyone still here in 2026?", "who's watching in september 2026", "who else is listening in 2026"
    { name: 'who is watching in <date>', source: `\\b${WHO}\\b[^.!?\\n]{0,40}\\b${HERE}\\b[^.!?\\n]{0,30}\\b(?:in|from|during)\\s+${DATE}\\b` },
    // "2026 anyone?", "september 2026 anyone??", "2026 and still here"
    { name: '<date> anyone', source: `^\\W*${DATE}\\W*(?:and\\s+)?(?:${WHO}|still\\s+here|still\\s+watching|gang|squad|crew|club|check|checking\\s+in)\\W*$` },
    // "June 2026! Who's listening to this I AM!", "2026 and who's still here?"
    { name: '<date>! who is listening', source: `^\\W*${DATE}\\W+(?:and\\s+)?${WHO}\\b[^\\n]{0,40}\\b${HERE}\\b` },
    // "2026 gang", "2026 squad rise up"
    { name: '<year> gang', source: `\\b${YEAR}\\s+(?:gang|squad|crew|club)\\b` },
    // "still here in 2026", "still watching this in september 2026", "still a banger in 2026"
    { name: 'still ... in <date>', source: `\\bstill\\s+(?:${HERE}|a\\s+\\w+|\\w+ing)(?:\\s+(?:to\\s+)?this)?\\s+in\\s+${DATE}\\b` },
    // "watching this in 2026", "if you're reading this in 2030", "listening to this in 2026"
    { name: 'watching this in <date>', source: `\\b(?:watch|listen|read|see|hear|view)(?:ing)?(?:\\s+to)?\\s+(?:this|it)\\s+(?:in|from)\\s+${DATE}\\b` },
    // "like if you're still here", "like if you are watching in 2026", "thumbs up if ..."
    { name: 'like if ...', source: "\\b(?:like|thumbs\\s*up|upvote)\\s+(?:this\\s+)?if\\s+(?:you|u|ur|you're|youre)\\b" },
    // "who's here after ...", "who's watching because of ...", "who came here from tiktok"
    { name: 'who is here after/from', source: `\\b(?:who(?:'?s|\\s+is|\\s+else(?:\\s+is)?)?|anyone)\\s+(?:still\\s+)?(?:here|watching|came\\s+here|listening)\\s+(?:after|because\\s+of|bc\\s+of|from|cuz\\s+of|cause\\s+of)\\b` },
    // "first!", "1st", "second", "early"
    { name: 'first!', source: "^\\W*(?:first|1st|second|2nd|third|3rd|early|im\\s+early|i'?m\\s+early)\\W*$" },
    // "who's here in 2026" without "watching"
    { name: 'who is here in <date>', source: `\\b${WHO}\\s+(?:still\\s+)?(?:here|there)\\s+in\\s+${DATE}\\b` },
    // "anyone else here from ...", "anyone here after ..."
    { name: 'anyone here from', source: `\\bany\\s*(?:one|body)\\s+(?:else\\s+)?(?:still\\s+)?(?:here|watching|listening)\\s+(?:after|from|because|bc|cuz)\\b` },
    // "<date> and this still hits", "<date> and still a banger"
    { name: '<date> and still', source: `^\\W*${DATE}\\W+and\\s+(?:this\\s+)?still\\b` },
    // "who's still here", "anyone still here?" (no date)
    { name: 'who is still here', source: `^\\W*${WHO}\\s+still\\s+(?:here|watching|listening)(?:\\s+(?:to\\s+)?this)?\\W*$` },
    // "nobody: ... me:" / "nobody: absolutely nobody:"
    { name: 'nobody: / me:', source: '^\\W*(?:nobody|no\\s*one)\\s*:\\s*(?:absolutely\\s+(?:nobody|no\\s*one)\\s*:\\s*)?' },
    // "who's watching in 2026 👇" / "like if you're watching in 2026"
    { name: 'raise your hand / drop a like if', source: "\\b(?:raise\\s+(?:your|ur)\\s+hand|drop\\s+a\\s+like|hit\\s+(?:the\\s+)?like)\\s+if\\b" },
  ];

  // Normalize comment text before matching.
  root.YTCF_normalize = function (text) {
    return String(text || '')
      .normalize('NFKC')
      .replace(/[​-‍﻿]/g, '')
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Compile a list of user-supplied lines. Each line is tried as a regex; if it
  // is not a valid regex it is treated as a literal, case-insensitive substring.
  root.YTCF_compileCustom = function (lines) {
    const out = [];
    for (const raw of lines || []) {
      const line = String(raw).trim();
      if (!line || line.startsWith('#')) continue;
      try {
        out.push({ name: `custom: ${line}`, re: new RegExp(line, 'i') });
      } catch (e) {
        const escaped = line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        out.push({ name: `custom: ${line}`, re: new RegExp(escaped, 'i') });
      }
    }
    return out;
  };

  root.YTCF_compileDefaults = function (disabledNames) {
    const disabled = new Set(disabledNames || []);
    return root.YTCF_DEFAULT_PATTERNS.filter((p) => !disabled.has(p.name)).map((p) => ({
      name: p.name,
      re: new RegExp(p.source, 'i'),
    }));
  };
})(typeof self !== 'undefined' ? self : globalThis);

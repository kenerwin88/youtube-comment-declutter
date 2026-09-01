# YouTube Comment Declutter

A small Chrome extension (Manifest V3) that hides repetitive, low-effort YouTube
comments such as:

- "anyone 2026?", "September 2026 anyone??"
- "who's still watching in 2026", "who else is here after ..."
- "still a banger in 2026", "if you're reading this in 2030"
- "like if you're still here", "thumbs up if ..."
- "first!", "2026 gang", "nobody: ... me:"

Matched comments are collapsed to a one-line placeholder with a **Show** button
(or hidden completely, your choice). The toolbar badge shows how many comments
are hidden on the current tab.

## Trophy room

If auto-dislike is on, the extension keeps a lifetime scoreboard in the popup:
total dislikes, total hidden comments, daily streak, best day, a rank that
climbs from "Silently Judging" to "Yes, I'm Still Here In 2026. Disliking You Specifically." as your
dislike count grows, and 19 achievements (e.g. "Who's Disliking at 3AM?" for a
dislike between midnight and 4am, "Second!" for 25 disliked "first!" comments). Rank-ups and unlocks show a toast on the YouTube page.
Stats live in `chrome.storage.local` and never leave your browser.

## Install (unpacked)

Clone or download this repo, then:

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and pick this folder.
4. Reload any open YouTube tabs.

## Configure

Click the toolbar icon to:

- turn filtering on or off
- show or hide the hidden-comment count on the toolbar icon
- choose collapse vs. hide
- toggle individual built-in filters
- optionally auto-dislike matched comments (off by default; needs an account with a YouTube channel;
  automated voting is against YouTube's terms, so use at your own risk). Clicks are spaced a random
  1.5–6 seconds apart, and the extension remembers every comment id it has disliked so nothing is
  ever disliked twice or toggled back.
- add your own filters, one per line. Lines are tried as regular expressions
  (case-insensitive); invalid regexes are matched as plain substrings.

Settings sync with your Chrome profile.

## Files

- `manifest.json` – extension manifest
- `patterns.js` – built-in patterns and text normalization (shared)
- `content.js` / `content.css` – runs on youtube.com and hides matching comments
- `awards.js` – rank and achievement definitions (shared)
- `background.js` – badge count and the scoreboard (single writer for stats)
- `popup.html` / `popup.js` / `popup.css` – settings popup

## License

MIT

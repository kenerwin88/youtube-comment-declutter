# 🔇 YouTube Comment Declutter

A Chrome extension that hides the repetitive, low-effort comments that clog up
every YouTube video:

- "anyone 2026?", "September 2026 anyone??", "who is here august 2026?"
- "who's still watching in 2026", "who else is here after ..."
- "still a banger in 2026", "if you're reading this in 2030"
- "like if you're still here", "thumbs up if ..."
- "first!", "2026 gang", "nobody: ... me:"

Matched comments collapse to a one-line placeholder with a **Show** button (or
disappear entirely, your choice). Optionally it can also dislike them for you,
and it keeps a scoreboard with ranks and achievements so you can feel something.

---

## Installing

This extension is not in the Chrome Web Store, so you load it from a folder on
your computer. It takes about a minute.

### Step 1: Get the files

**Option A, no git required**

1. Click the green **Code** button at the top of this GitHub page.
2. Click **Download ZIP**.
3. Unzip it. You'll get a folder called `youtube-comment-declutter-main`.
   Put it somewhere permanent (not Downloads), because Chrome loads the
   extension from that folder every time it starts. If you delete or move the
   folder later, the extension stops working.

**Option B, with git**

```
git clone https://github.com/kenerwin88/youtube-comment-declutter.git
```

### Step 2: Load it into Chrome

1. Open Chrome and type `chrome://extensions` into the address bar, then press Enter.
2. In the top-right corner, turn on the **Developer mode** switch.
3. Three new buttons appear in the top-left. Click **Load unpacked**.
4. In the file picker, select the folder from Step 1 (the one that contains
   `manifest.json`) and click **Select** / **Open**.
5. "YouTube Comment Declutter" now appears in your extensions list with a 🔇 icon.

### Step 3: Pin it and try it

1. Click the puzzle-piece icon 🧩 to the right of Chrome's address bar.
2. Find **YouTube Comment Declutter** and click the pin 📌 next to it so the
   🔇 icon stays visible in your toolbar.
3. Open any YouTube video and scroll to the comments. Any YouTube tabs that
   were already open need a reload first.
4. Click the 🔇 icon to open the settings.

Works in Chrome, Edge, Brave, Arc, and other Chromium browsers. The steps are
the same; the extensions page is `edge://extensions` in Edge and
`brave://extensions` in Brave.

### Updating

If you downloaded the ZIP: download it again, replace the folder contents, then
go to `chrome://extensions` and click the circular **reload** arrow on the
extension's card.

If you cloned with git: run `git pull` in the folder, then click the reload
arrow on the extension's card.

---

## Settings (click the 🔇 icon)

- **On/off switch** in the top-right corner.
- **Collapse vs. hide**: collapse leaves a one-line placeholder with a Show
  button; hide removes the comment completely.
- **Show hidden count on the toolbar icon**: turn off if the red number bothers you.
- **Built-in filters**: untick any you don't want.
- **Your own filters**: one per line. Each line is tried as a regular
  expression (case-insensitive); anything that isn't a valid regex is matched
  as plain text. Example lines:
  ```
  who else is here from tiktok
  ^\W*bro\W*$
  ```
- **Also click 👎 on matched comments**: see below.

Settings sync with your Chrome profile.

## Auto-dislike (optional, off by default)

When enabled, the extension clicks the dislike button on every comment it
hides. Things to know:

- It only works when you're signed in to an account that has a YouTube
  channel. Without a channel YouTube doesn't show vote buttons on comments.
- Clicks are spaced a random 1.5 to 6 seconds apart.
- It remembers every comment id it has disliked (stored locally in your
  browser), so nothing is ever disliked twice or toggled back, even if you
  come back to the same video weeks later.
- Automated voting is against YouTube's terms of service and could get your
  account flagged. Use at your own risk.

## Trophy room

The popup keeps a lifetime scoreboard: total dislikes, total hidden comments,
current day streak, best day, a rank that climbs from "Silently Judging" to
"Yes, I'm Still Here In 2026. Disliking You Specifically." as your dislike
count grows, and 19 achievements. Rank-ups and unlocks show a toast in the
corner of the YouTube page. Everything is stored in your browser and never
leaves it. There's a two-click **Reset stats** link at the bottom.

## Privacy

The extension has no server, makes no network requests, and only runs on
youtube.com. It asks for one permission, `storage`, to save your settings and
scoreboard.

## Files

- `manifest.json` – extension manifest
- `patterns.js` – built-in patterns and text normalization (shared)
- `awards.js` – rank and achievement definitions (shared)
- `content.js` / `content.css` – runs on youtube.com, hides matching comments, shows toasts
- `background.js` – badge count, dislike memory, and the scoreboard (single writer for stats)
- `popup.html` / `popup.js` / `popup.css` – settings popup

## License

MIT

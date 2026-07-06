# ad blocker - manifest v3

a lightweight, high-performance Chrome extension that blocks network advertisements, applies cosmetic filters to hide blank ad slots, and automatically fast-forwards/skips YouTube video ads.

---

## project structure

*   `manifest.json`: registers permissions (`declarativeNetRequest`, `storage`, `activeTab`), background worker, popup action, and content script.
*   `rules.json`: lists static declarative net rules to block requests to major advertisement domains natively.
*   `content.js`: injects css cosmetic rules to hide ad elements and automates YouTube players to instantly skip pre-roll/mid-roll video ads.
*   `background.js`: manages extension state changes to dynamically toggle rulesets.
*   `popup.html` / `popup.js`: a clean monospace control popup.
*   `icon.png`: extension logo.

---

## how it works

1.  **native blocking:** standard ads are blocked at the browser level using `declarativeNetRequest` rules to intercept requests before they load.
2.  **cosmetic cleanup:** a content script automatically injects css to set `display: none !important` on standard ad containers, preventing empty white spaces on pages.
3.  **youtube ad skipping:** when a YouTube video ad is detected, the content script:
    *   mutes the player.
    *   increases playback speed to `16x`.
    *   clicks the "Skip Ad" button instantly.
    *   advances playhead to the end of unskippable bumper ads.

---

## setup instructions

1.  clone or download this repository.
2.  open Google Chrome and go to `chrome://extensions/`.
3.  enable **Developer mode** (top-right corner toggle).
4.  click **Load unpacked** (top-left button).
5.  select this project directory (`ad-blocker`).

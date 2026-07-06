# Ad Blocker - Manifest V3 Privacy Shield

A high-performance, local-first browser extension designed to block advertisements, telemetry tracking, popups, cryptominers, and malicious phishing domains. Natively built on Manifest V3 using Google Chrome's `declarativeNetRequest` engine for zero memory bloat and C++ execution speed.

---

## Directory Structure

```
ad-blocker/
├── _metadata/                   # Chrome extension metadata
├── rules/                       # Declarative Net Request ruleset JSON files
│   ├── ads.json                 # Display and video ad blocking rules
│   ├── trackers.json            # Analytics and telemetry blocking rules
│   ├── annoyances.json          # Cookie consents and anti-adblock bypasses
│   └── malware.json             # Phishing, cryptomining, and scam blocks
├── site/                        # Minimalist text-based product website
│   ├── index.html               # Website landing page
│   ├── features.html            # Detailed 18 star features showcase
│   ├── privacy.html             # Zero-data privacy policy document
│   ├── support.html             # FAQ and community support portal
│   └── site.css                 # Shared minimalist text layout stylesheet
├── stubs/                       # Secure analytics redirection mock scripts
│   └── ga.js                    # Google Analytics tracker override stub
├── background.js                # Extension installation, update, and ruleset sync worker
├── content.js                   # Client-side smartlink sanitizers, anti-fingerprints, and popups block
├── cosmetic.css                 # Initial static ad element layout hiding rules
├── manifest.json                # Extension permission, resources, and configurations
├── options.html                 # Settings Options Dashboard markup
├── options.js                   # Options settings dashboard actions and custom rules storage
├── picker.js                    # Interactive DOM click-to-block element picker
├── welcome.html                 # First-install onboarding guide
└── LICENSE                      # MIT license agreement
```

---

## 18 Star Features

1. **Static Display Ad Blocking:** DNR-based filtering of standard display banners, native placements, and sponsor widgets.
2. **Popunder & Redirect Protection:** Hooks `window.open` calls on page contexts to block background tab-under ads.
3. **Path-Based Ad Script Blocks:** Target specific ad scripts (`/invoke.js`) regardless of first-party domain cloaking.
4. **Google Analytics Redirection:** Intercepts Google Analytics tracking scripts and redirects them securely to local empty mocks (`ga.js`), preventing page layout crashes.
5. **Telemetry & Tracking Blocks:** Disables background event logging libraries (Hotjar, Mixpanel, CrazyEgg).
6. **Social Pixel Mitigation:** Prevents social platform pixels (Facebook, TikTok, Snapchat) from tracking users across pages.
7. **Anti-Adblock Defeater:** Blocks scripts (like BlockAdBlock.js) from spawning anti-adblock blocking modals.
8. **Cryptominer Blocker:** Blocks Coinhive and other CPU-draining browser-level mining endpoints.
9. **Phishing & Scam Shield:** Active ruleset layer blocking over 70 known malicious phishing domains, lottery scams, and tech-support scams.
10. **HTTP-to-HTTPS Upgrades:** DNR upgrades unencrypted HTTP requests to secure HTTPS automatically.
11. **Real-Time Badge Counters:** Keeps tab-specific statistics of blocked network elements directly on the extension icon badge.
12. **Deterministic Whitelist Hashes:** Hashes site domains to deterministic rule IDs, avoiding ruleset ID collisions.
13. **DOM Element Picker:** Crosshair selector tool to highlight any element on page hover and hide it permanently.
14. **Settings Options Dashboard:** Complete control center to write custom CSS hides, custom URL blocking rules, and whitelist sites.
15. **WebAccessible Resource Stubs:** Securely registers redirection stubs to prevent cross-origin scripting errors.
16. **WebRTC IP Leak Protection:** Prevents websites from leaking LAN/local IP addresses via WebRTC protocols.
17. **O(1) Smartlink Sanitizer:** Capture-phase link click interception that instantly strips query parameter trackers.
18. **JS Cookie Guard:** Restricts scripts from writing tracking cookies (like `_ga` and `_fbp`) while preserving session integrity.

---

## Onboarding & Site Details

- **Onboarding Page (`welcome.html`):** Opens automatically inside a new browser tab upon extension installation, helping users start quickly.
- **Product Website (`site/`):** A minimalist, fast-loading, emoji-free, dark-themed website detailing documentation, features, privacy policies, and support answers.

---

## Installation

1. Clone this repository locally.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Toggle **Developer mode** (top right).
4. Click **Load unpacked** (top left) and select the `ad-blocker` directory.
5. Protection is active immediately!

---

## Privacy Policy
This extension does not collect, log, or transmit any user data. All configuration settings, whitelisted domains, and cosmetic hiding overrides are stored and processed entirely on your local machine.

---

## License
Distributed under the MIT License. See [LICENSE](LICENSE) for more details.

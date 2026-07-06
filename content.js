// Cosmetic styling is loaded declaratively via cosmetic.css in the manifest.

// ----------------------------------------------------
// Self-Healing Scriptlet Mocking Injection
// ----------------------------------------------------
(function injectSelfHealingStubs() {
  try {
    const stubsScript = document.createElement('script');
    stubsScript.textContent = `
      (function() {
        // 1. Eager Mocking of Tracker Globals
        const commonGlobals = [
          'fbq', 'ym', 'yaCounter', 'mixpanel', 'amplitude', 
          'hj', '_hjApi', 'optimizely', 'clarity', 'bugsnag', 
          'SaActive', 'sa_event', 'Treasure', '_hmt', 'pintrk'
        ];
        
        commonGlobals.forEach(name => {
          if (typeof window[name] === 'undefined') {
            const mock = function() { return mock; };
            window[name] = new Proxy(mock, {
              get: function(target, prop) {
                if (prop === 'push') {
                  return function(...args) {
                    if (Array.isArray(target)) target.push(...args);
                    return mock;
                  };
                }
                return mock;
              }
            });
          }
        });

        // 2. JS Cookie Guard (Block Tracking Cookies Write)
        const blockedCookies = [
          '_ga', '_gid', '_fbp', '_fbc', '_hj', '_uetsid', '_uetvid', 
          '__utm', '_clck', '_clsk', 'amplitude_id', 'mixpanel'
        ];
        
        try {
          const originalDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
          if (originalDescriptor) {
            Object.defineProperty(document, 'cookie', {
              get: function() {
                return originalDescriptor.get.call(document);
              },
              set: function(val) {
                const cookieName = val.split('=')[0].trim();
                const shouldBlock = blockedCookies.some(pattern => cookieName.startsWith(pattern));
                if (shouldBlock) {
                  console.log('[Ad Blocker CookieGuard] Blocked writing tracker cookie:', cookieName);
                  return;
                }
                originalDescriptor.set.call(document, val);
              },
              configurable: true
            });
          }
        } catch (e) {}

        // 3. Canvas Anti-Fingerprinting (Canvas Noise)
        try {
          const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
          HTMLCanvasElement.prototype.toDataURL = function(...args) {
            const ctx = this.getContext('2d');
            if (ctx) {
              const imgData = ctx.getImageData(0, 0, 1, 1);
              if (imgData) {
                imgData.data[0] = (imgData.data[0] + 1) % 256;
                ctx.putImageData(imgData, 0, 0);
              }
            }
            return originalToDataURL.apply(this, args);
          };
        } catch (e) {}

        // 4. Audio Anti-Fingerprinting (Audio Noise)
        try {
          const originalGetChannelData = AudioBuffer.prototype.getChannelData;
          AudioBuffer.prototype.getChannelData = function(channel) {
            const data = originalGetChannelData.call(this, channel);
            for (let i = 0; i < Math.min(data.length, 10); i++) {
              data[i] += (Math.random() - 0.5) * 0.000001;
            }
            return data;
          };
        } catch (e) {}

        // 5. Tab-Under & Popup Blocker (Block Script-driven window.open)
        try {
          const originalOpen = window.open;
          window.open = function(url, name, specs, replace) {
            if (window.event && (window.event.type === 'click' || window.event.type === 'mousedown')) {
              return originalOpen.call(window, url, name, specs, replace);
            } else {
              console.warn('[Ad Blocker PopupBlocker] Blocked background window.open request for:', url);
              return null;
            }
          };
        } catch (e) {}
      })();
    `;
    (document.head || document.documentElement).appendChild(stubsScript);
    stubsScript.remove();
  } catch (e) {}
})();

// Load custom element hiding selectors from Element Picker / Options Page
chrome.storage.local.get(['customSelectors'], ({ customSelectors = [] }) => {
  if (customSelectors && customSelectors.length > 0) {
    const style = document.createElement('style');
    style.id = 'ad-blocker-custom-cosmetics';
    style.textContent = `${customSelectors.join(', ')} { position: absolute !important; left: -99999px !important; opacity: 0 !important; pointer-events: none !important; height: 1px !important; width: 1px !important; }`;
    (document.head || document.documentElement).appendChild(style);
  }
});


// YouTube Ad Skipping & Warning Dismissal Logic
function handleYoutubeAds() {
  if (!window.location.hostname.includes('youtube.com')) return;

  const video = document.querySelector('video');
  
  // Attach listeners to the video element for instant frame-perfect ad-skipping
  if (video && !video.dataset.adblockListenersAdded) {
    video.dataset.adblockListenersAdded = 'true';
    
    // Skip ad instantly when time updates or playing begins
    video.addEventListener('timeupdate', () => skipYoutubeAd(video));
    video.addEventListener('play', () => skipYoutubeAd(video));
    video.addEventListener('playing', () => skipYoutubeAd(video));
  }
  
  if (video) {
    skipYoutubeAd(video);
  }
  
  handleYoutubeAntiAdblock();
}

function skipYoutubeAd(video) {
  const adShowing = document.querySelector('.ad-showing, .ad-interrupting, .ytp-ad-player-overlay');
  
  if (adShowing) {
    // 1. Speed up the ad to 16x and mute it
    video.playbackRate = 16;
    video.muted = true;

    // 2. Click the Skip button if it exists
    const skipBtn = document.querySelector('.ytp-skip-ad-button, .ytp-ad-skip-button, .ytp-ad-skip-button-modern');
    if (skipBtn) {
      skipBtn.click();
    }

    // 3. Move playhead to end to skip unskippable bumper ads
    if (video.duration && !isNaN(video.duration) && video.currentTime < video.duration - 0.1) {
      video.currentTime = video.duration;
    }
  }
  
  // 4. Close video overlay banner ads
  const closeBtn = document.querySelector('.ytp-ad-overlay-close-button');
  if (closeBtn) {
    closeBtn.click();
  }
}

function handleYoutubeAntiAdblock() {
  // 1. Target the enforcement dialog elements
  const popup = document.querySelector('ytd-enforcement-message-handler-carausel, tp-yt-paper-dialog, ytd-popup-container');
  if (popup) {
    popup.remove();
    console.log('[Ad Blocker] Removed YouTube ad blocker warning dialog.');
  }
  
  // 2. Target playability error overlay
  const playabilityError = document.querySelector('yt-playability-error-supported-renderers');
  if (playabilityError) {
    playabilityError.remove();
    console.log('[Ad Blocker] Removed YouTube playability error overlay.');
  }

  // 3. Resume the video if it got paused by popup dialog
  const video = document.querySelector('video');
  const playButton = document.querySelector('.ytp-play-button');
  if (video && video.paused) {
    try {
      video.play();
      if (playButton && playButton.getAttribute('title') === 'Play (k)') {
        playButton.click();
      }
    } catch(e) {}
  }
  
  // 4. Remove overlay backdrops
  const backdrops = document.querySelectorAll('tp-yt-iron-overlay-backdrop');
  backdrops.forEach(backdrop => backdrop.remove());
}

// Hide iframes loading Adsterra ads (via srcDoc analysis)
function cleanAdsterraIframes() {
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach(iframe => {
    try {
      const srcDoc = iframe.srcdoc || '';
      if (srcDoc.includes('invoke.js') || srcDoc.includes('atOptions')) {
        iframe.style.setProperty('display', 'none', 'important');
        iframe.style.setProperty('height', '0', 'important');
        
        // Collapse the parent container if it only contains this iframe
        const parent = iframe.parentElement;
        if (parent && parent.children.length === 1) {
          parent.style.setProperty('display', 'none', 'important');
          parent.style.setProperty('height', '0', 'important');
        }
      }
    } catch (e) {
      // Ignore cross-origin errors
    }
  });
}

// Observe page changes to detect dynamic ads (especially on YouTube & dynamic iframes)
const observer = new MutationObserver(() => {
  handleYoutubeAds();
  cleanAdsterraIframes();
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});

// Run backup check periodically
setInterval(() => {
  handleYoutubeAds();
  cleanAdsterraIframes();
}, 200);

// ----------------------------------------------------
// Smartlink URL Cleaner & Parameter Stripper
// ----------------------------------------------------
const redirectTrackers = [
  { host: 'viglink.com', param: ['u', 'url'] },
  { host: 'linksynergy.com', param: ['murl'] },
  { host: 'doubleclick.net', param: ['adurl'] },
  { host: 'googleadservices.com', param: ['adurl', 'q'] },
  { host: 'rover.ebay.com', param: ['mpre'] },
  { host: 'awin1.com', param: ['ued'] },
  { host: 'awin.com', param: ['ued'] },
  { host: 'shareasale.com', param: ['urllink'] },
  { host: 'admitad.com', param: ['ulp'] },
  { host: 'tradedoubler.com', param: ['url'] },
  { host: 'anrdoezrs.net', param: ['url'] },
  { host: 'tkqlhce.com', param: ['url'] },
  { host: 'jdoqocy.com', param: ['url'] },
  { host: 'dpbolvw.net', param: ['url'] },
  { host: 'kqzyfj.com', param: ['url'] },
  { host: 'pjatr.com', param: ['url'] },
  { host: 'pjtra.com', param: ['url'] },
  { host: 'g2afse.com', param: ['url'] },
  { host: 'pntrac.com', param: ['url'] },
  { host: 'pntrs.com', param: ['url'] },
  { host: 'skimlinks.com', param: ['url'] },
  { host: 'skimresources.com', param: ['url'] },
  { host: 'clickbank.net', param: ['url'] },
  { host: 'clickbank.com', param: ['url'] },
  { host: 'an.yandex.ru', param: ['page'] },
  { host: 'linkshare.com', param: ['murl'] },
  { host: 'zenaps.com', param: ['ued'] },
  { host: 'commission-junction.com', param: ['url'] },
  { host: 'rakuten.com', param: ['url', 'murl'] },
  { host: 'geni.us', param: ['url'] },
  { host: 'georiot.com', param: ['url'] },
  { host: 'rdrct.cc', param: ['url'] },
  { host: 'smarterclick.com', param: ['url'] },
  { host: 'impactradius.com', param: ['u'] },
  { host: 'impact.com', param: ['u'] },
  { host: 'sjv.io', param: ['u'] },
  { host: 'adsrvr.org', param: ['url'] },
  { host: 'slickdeals.net', param: ['u2'] },
  { host: 'redirectingat.com', param: ['url'] },
  { host: 'belboon.com', param: ['url'] },
  { host: 'belboon.de', param: ['url'] },
  { host: 'webgains.com', param: ['wgtarget'] },
  { host: 'zanox.com', param: ['ulp'] },
  { host: 'affili.net', param: ['url'] },
  { host: 'effiliation.com', param: ['url'] },
  { host: 'pnsrv.com', param: ['url'] },
  { host: 'adform.net', param: ['murl'] },
  { host: 'click.alibaba.com', param: ['url'] },
  { host: 'facebook.com', param: ['u'] },
  { host: 'vk.com', param: ['to'] }
];

const trackingParams = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'fbclid', 'gclid', 'msclkid', 'yclid', 'ttclid',
  'ref', 'referral', 'affiliate_id', 'clickid', 'subid'
];

document.addEventListener('click', (e) => {
  const anchor = e.target.closest('a');
  if (anchor && anchor.href) {
    // 1. Resolve redirect trackers
    let cleanUrl = getCleanUrl(anchor.href);
    
    // 2. Strip tracking query parameters
    const targetUrl = cleanUrl || anchor.href;
    const strippedUrl = cleanTrackingParameters(targetUrl);
    
    if (strippedUrl || cleanUrl) {
      const finalUrl = strippedUrl || cleanUrl;
      anchor.href = finalUrl;
      console.log(`[Ad Blocker] Cleaned link url to: ${finalUrl}`);
    }
  }
}, true); // Capture phase matches before page navigation takes action

function getCleanUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    const matchedTracker = redirectTrackers.find(t => url.hostname.includes(t.host));
    if (matchedTracker) {
      const params = new URLSearchParams(url.search);
      for (const param of matchedTracker.param) {
        const target = params.get(param);
        if (target) {
          const decoded = decodeURIComponent(target);
          if (decoded.startsWith('http') || decoded.startsWith('https')) {
            return decoded;
          }
        }
      }
    }
  } catch (e) {
    // Ignore invalid URLs
  }
  return null;
}

function cleanTrackingParameters(rawUrl) {
  try {
    const url = new URL(rawUrl);
    let changed = false;
    
    // Strip standard tracking parameters
    trackingParams.forEach(param => {
      if (url.searchParams.has(param)) {
        url.searchParams.delete(param);
        changed = true;
      }
    });
    
    // Handle Amazon tag parameter stripping
    if (url.hostname.includes('amazon.')) {
      if (url.searchParams.has('tag')) {
        url.searchParams.delete('tag');
        changed = true;
      }
      if (url.searchParams.has('ascsubtag')) {
        url.searchParams.delete('ascsubtag');
        changed = true;
      }
    }
    
    return changed ? url.toString() : null;
  } catch (e) {
    return null;
  }
}

// ----------------------------------------------------
// Self-Healing Layout Scroll Restorer
// ----------------------------------------------------
window.addEventListener('load', () => {
  setTimeout(() => {
    try {
      const bodyStyle = window.getComputedStyle(document.body);
      const htmlStyle = window.getComputedStyle(document.documentElement);
      if (bodyStyle.overflow === 'hidden' || htmlStyle.overflow === 'hidden') {
        document.body.style.setProperty('overflow', 'auto', 'important');
        document.documentElement.style.setProperty('overflow', 'auto', 'important');
        console.log('[Ad Blocker Self-Heal] Restored page scrollbar overflow.');
      }
    } catch (e) {}
  }, 1500);
});

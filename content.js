// Inject CSS to hide common ad slots cosmetically
const style = document.createElement('style');
style.textContent = `
  .ad-banner, .adsbygoogle, [id*="google_ads_iframe"], iframe[src*="ads"], 
  .ytp-ad-overlay-container, .ytp-ad-message-container, .video-ads, .ytp-ad-player-overlay {
    display: none !important;
    height: 0 !important;
    width: 0 !important;
    opacity: 0 !important;
    pointer-events: none !important;
  }
`;
(document.head || document.documentElement).appendChild(style);

// YouTube Ad Skipping Logic
function handleYoutubeAds() {
  if (!window.location.hostname.includes('youtube.com')) return;

  const video = document.querySelector('video');
  const adShowing = document.querySelector('.ad-showing, .ad-interrupting, .ytp-ad-player-overlay');

  if (video && adShowing) {
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

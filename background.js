// Enable action badge count and rulesets on install
chrome.runtime.onInstalled.addListener((details) => {
  chrome.storage.local.set({
    enabled: true,
    blockAds: true,
    blockTrackers: true,
    blockAnnoyances: true,
    blockMalware: true
  }, () => {
    syncStaticRulesets();
  });
  chrome.declarativeNetRequest.setExtensionActionOptions({ displayActionCountAsBadgeText: true });
  
  // Enable WebRTC IP leak protection (disables local IP disclosure via WebRTC)
  chrome.privacy.network.webRTCIPHandlingPolicy.set({
    value: 'disable_non_proxied_udp'
  }, () => {
    if (chrome.runtime.lastError) {
      console.warn('WebRTC policy setup warning:', chrome.runtime.lastError.message);
    } else {
      console.log('[Ad Blocker] WebRTC IP leak protection successfully configured.');
    }
  });

  // Launch onboarding welcome page on first install
  if (details && details.reason === 'install') {
    chrome.tabs.create({ url: 'welcome.html' });
  }
});

// Watch for storage changes to update static rulesets dynamically
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.enabled || changes.blockAds || changes.blockTrackers || changes.blockAnnoyances || changes.blockMalware) {
    syncStaticRulesets();
  }
});

function syncStaticRulesets() {
  chrome.storage.local.get(['enabled', 'blockAds', 'blockTrackers', 'blockAnnoyances', 'blockMalware'], (data) => {
    const isGlobalEnabled = data.enabled !== false;
    const blockAds = data.blockAds !== false;
    const blockTrackers = data.blockTrackers !== false;
    const blockAnnoyances = data.blockAnnoyances !== false;
    const blockMalware = data.blockMalware !== false;

    const enableRulesetIds = [];
    const disableRulesetIds = [];

    // Toggles for individual rulesets
    if (isGlobalEnabled && blockAds) {
      enableRulesetIds.push('ruleset_ads');
    } else {
      disableRulesetIds.push('ruleset_ads');
    }

    if (isGlobalEnabled && blockTrackers) {
      enableRulesetIds.push('ruleset_trackers');
    } else {
      disableRulesetIds.push('ruleset_trackers');
    }

    if (isGlobalEnabled && blockAnnoyances) {
      enableRulesetIds.push('ruleset_annoyances');
    } else {
      disableRulesetIds.push('ruleset_annoyances');
    }

    if (isGlobalEnabled && blockMalware) {
      enableRulesetIds.push('ruleset_malware');
    } else {
      disableRulesetIds.push('ruleset_malware');
    }

    chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: enableRulesetIds,
      disableRulesetIds: disableRulesetIds
    });
  });
}

// Keep track of counts per tab during navigation to accumulate all-time stats
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  // Only process top-level frames (frameId === 0)
  if (details.frameId !== 0) return;
  
  const tabId = details.tabId;
  // Get matched rules for the current tab before navigation clears them
  chrome.declarativeNetRequest.getMatchedRules({ tabId: tabId }, (rulesMatchedDetails) => {
    if (chrome.runtime.lastError || !rulesMatchedDetails) return;
    
    const matchedRules = rulesMatchedDetails.rulesMatchedInfo;
    if (matchedRules.length === 0) return;
    
    updateStatistics(matchedRules);
  });
});

function updateStatistics(matchedRules) {
  chrome.storage.local.get(['totalBlocked', 'blockedAdNetworks', 'blockedSites'], (data) => {
    let totalBlocked = data.totalBlocked || 0;
    let blockedAdNetworks = data.blockedAdNetworks || {};
    let blockedSites = data.blockedSites || {};
    
    matchedRules.forEach(info => {
      // 1. Increment total
      totalBlocked++;
      
      // 2. Tally blocked ad network/tracker domain from URL
      try {
        const url = new URL(info.request.url);
        const trackerDomain = getBaseDomain(url.hostname);
        blockedAdNetworks[trackerDomain] = (blockedAdNetworks[trackerDomain] || 0) + 1;
      } catch (e) {}
      
      // 3. Tally ad-heavy host site from initiator
      try {
        const initiatorUrl = info.request.initiator ? new URL(info.request.initiator) : null;
        if (initiatorUrl) {
          const hostSite = initiatorUrl.hostname;
          blockedSites[hostSite] = (blockedSites[hostSite] || 0) + 1;
        }
      } catch (e) {}
    });
    
    chrome.storage.local.set({
      totalBlocked: totalBlocked,
      blockedAdNetworks: blockedAdNetworks,
      blockedSites: blockedSites
    });
  });
}

function getBaseDomain(hostname) {
  const parts = hostname.split('.');
  if (parts.length <= 2) return hostname;
  // Simple check for second level domains (e.g. co.uk, com.au)
  const isSecondLevel = parts[parts.length - 2].match(/^(com|co|net|org|gov|edu|mil|net)$/);
  return parts.slice(isSecondLevel ? -3 : -2).join('.');
}

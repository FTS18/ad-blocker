const toggleBlocker = document.getElementById('toggleBlocker');
const toggleSiteBlocker = document.getElementById('toggleSiteBlocker');
const statusVal = document.getElementById('statusVal');
const siteRow = document.getElementById('siteRow');
const siteDomain = document.getElementById('siteDomain');
const infoMessage = document.getElementById('infoMessage');

// Categories DOM Element Extension
const blockMalwareCheckbox = document.getElementById('blockMalwareCheckbox');

// Statistics DOM Elements
const pageBlockedCount = document.getElementById('pageBlockedCount');
const totalBlockedCount = document.getElementById('totalBlockedCount');
const topTrackerItem = document.getElementById('topTrackerItem');
const topTracker = document.getElementById('topTracker');
const topSiteItem = document.getElementById('topSiteItem');
const topSite = document.getElementById('topSite');

// Categories DOM Elements
const blockAdsCheckbox = document.getElementById('blockAdsCheckbox');
const blockTrackersCheckbox = document.getElementById('blockTrackersCheckbox');
const blockAnnoyancesCheckbox = document.getElementById('blockAnnoyancesCheckbox');
const categoriesPanel = document.getElementById('categoriesPanel');

// Toolbar DOM Elements
const pickerBtn = document.getElementById('pickerBtn');
const settingsBtn = document.getElementById('settingsBtn');

let currentDomain = '';
let activeTabId = null;

// Get active tab info
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs.length === 0) return;
  const activeTab = tabs[0];
  activeTabId = activeTab.id;
  
  try {
    const url = new URL(activeTab.url);
    // Only show whitelisting row for HTTP/HTTPS web pages
    if (url.protocol.startsWith('http')) {
      currentDomain = url.hostname;
      siteDomain.textContent = currentDomain;
      siteRow.style.display = 'flex';
      initUI();
      loadLivePageStatistics();
    }
  } catch (e) {
    // Ignore invalid/internal URLs (like chrome://)
  }
});

function initUI() {
  chrome.storage.local.get([
    'enabled',
    'whitelistedDomains',
    'blockAds',
    'blockTrackers',
    'blockAnnoyances',
    'blockMalware'
  ], (data) => {
    const isGlobalEnabled = data.enabled !== false;
    const whitelistedDomains = data.whitelistedDomains || [];
    const isSiteWhitelisted = whitelistedDomains.includes(currentDomain);

    toggleBlocker.checked = isGlobalEnabled;
    toggleSiteBlocker.checked = !isSiteWhitelisted;

    // Set category checkboxes state
    blockAdsCheckbox.checked = data.blockAds !== false;
    blockTrackersCheckbox.checked = data.blockTrackers !== false;
    blockAnnoyancesCheckbox.checked = data.blockAnnoyances !== false;
    blockMalwareCheckbox.checked = data.blockMalware !== false;

    updateUIStates(isGlobalEnabled, isSiteWhitelisted);
  });
  
  loadAllTimeStatistics();
}

// Loads live matching rules for the current tab
function loadLivePageStatistics() {
  if (!activeTabId) return;
  
  chrome.declarativeNetRequest.getMatchedRules({ tabId: activeTabId }, (details) => {
    if (chrome.runtime.lastError || !details) return;
    const count = details.rulesMatchedInfo.length;
    pageBlockedCount.textContent = count.toString();
  });
}

// Loads accumulated global stats from storage
function loadAllTimeStatistics() {
  chrome.storage.local.get(['totalBlocked', 'blockedAdNetworks', 'blockedSites'], (data) => {
    const totalBlocked = data.totalBlocked || 0;
    totalBlockedCount.textContent = totalBlocked.toString();
    
    // Top blocked ad network tracker
    const topNetwork = getTopEntry(data.blockedAdNetworks || {});
    if (topNetwork) {
      topTracker.textContent = `${topNetwork.name} (${topNetwork.count})`;
      topTrackerItem.style.display = 'flex';
    } else {
      topTrackerItem.style.display = 'none';
    }
    
    // Top ad-heavy site visited
    const topVisitedSite = getTopEntry(data.blockedSites || {});
    if (topVisitedSite) {
      topSite.textContent = `${topVisitedSite.name} (${topVisitedSite.count})`;
      topSiteItem.style.display = 'flex';
    } else {
      topSiteItem.style.display = 'none';
    }
  });
}

function getTopEntry(obj) {
  let topKey = '';
  let topVal = 0;
  for (const [key, val] of Object.entries(obj)) {
    if (val > topVal) {
      topVal = val;
      topKey = key;
    }
  }
  return topVal > 0 ? { name: topKey, count: topVal } : null;
}

// Global Protection Toggle
toggleBlocker.addEventListener('change', () => {
  const isGlobalEnabled = toggleBlocker.checked;
  chrome.storage.local.set({ enabled: isGlobalEnabled });
  
  chrome.storage.local.get(['whitelistedDomains'], ({ whitelistedDomains = [] }) => {
    const isSiteWhitelisted = whitelistedDomains.includes(currentDomain);
    updateUIStates(isGlobalEnabled, isSiteWhitelisted);
  });
});

// Category Checkbox Listeners
blockAdsCheckbox.addEventListener('change', () => {
  chrome.storage.local.set({ blockAds: blockAdsCheckbox.checked });
});
blockTrackersCheckbox.addEventListener('change', () => {
  chrome.storage.local.set({ blockTrackers: blockTrackersCheckbox.checked });
});
blockAnnoyancesCheckbox.addEventListener('change', () => {
  chrome.storage.local.set({ blockAnnoyances: blockAnnoyancesCheckbox.checked });
});
blockMalwareCheckbox.addEventListener('change', () => {
  chrome.storage.local.set({ blockMalware: blockMalwareCheckbox.checked });
});

// Site Protection Toggle (unchecking whitelists the domain)
toggleSiteBlocker.addEventListener('change', () => {
  const isSiteProtected = toggleSiteBlocker.checked;
  const isSiteWhitelisted = !isSiteProtected;
  const ruleId = getDomainRuleId(currentDomain);

  chrome.storage.local.get(['whitelistedDomains'], ({ whitelistedDomains = [] }) => {
    let updatedWhitelist = [...whitelistedDomains];

    if (isSiteWhitelisted) {
      if (!updatedWhitelist.includes(currentDomain)) {
        updatedWhitelist.push(currentDomain);
      }
      
      // Dynamic whitelist rule using allowAllRequests
      const whitelistRule = {
        "id": ruleId,
        "priority": 3,
        "action": { "type": "allowAllRequests" },
        "condition": {
          "requestDomains": [currentDomain],
          "resourceTypes": ["main_frame", "sub_frame"]
        }
      };

      chrome.declarativeNetRequest.updateDynamicRules({
        addRules: [whitelistRule]
      });
    } else {
      updatedWhitelist = updatedWhitelist.filter(d => d !== currentDomain);
      
      chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [ruleId]
      });
    }

    chrome.storage.local.set({ whitelistedDomains: updatedWhitelist }, () => {
      chrome.storage.local.get(['enabled'], ({ enabled }) => {
        const isGlobalEnabled = enabled !== false;
        updateUIStates(isGlobalEnabled, isSiteWhitelisted);
      });
    });
  });
});

function updateUIStates(isGlobalEnabled, isSiteWhitelisted) {
  if (!isGlobalEnabled) {
    statusVal.textContent = 'disabled';
    statusVal.className = 'status-val';
    toggleSiteBlocker.disabled = true;
    siteRow.style.opacity = '0.5';
    infoMessage.textContent = 'ad blocker is disabled globally.';
    
    // Disable categories
    blockAdsCheckbox.disabled = true;
    blockTrackersCheckbox.disabled = true;
    blockAnnoyancesCheckbox.disabled = true;
    blockMalwareCheckbox.disabled = true;
    categoriesPanel.style.opacity = '0.5';
    pickerBtn.disabled = true;
    pickerBtn.style.opacity = '0.5';
  } else {
    toggleSiteBlocker.disabled = false;
    siteRow.style.opacity = '1.0';
    
    // Enable categories
    blockAdsCheckbox.disabled = false;
    blockTrackersCheckbox.disabled = false;
    blockAnnoyancesCheckbox.disabled = false;
    blockMalwareCheckbox.disabled = false;
    categoriesPanel.style.opacity = '1.0';
    pickerBtn.disabled = false;
    pickerBtn.style.opacity = '1.0';

    if (isSiteWhitelisted) {
      statusVal.textContent = 'whitelisted';
      statusVal.className = 'status-val whitelisted';
      infoMessage.textContent = `protection disabled on ${currentDomain}`;
    } else {
      statusVal.textContent = 'active';
      statusVal.className = 'status-val active';
      infoMessage.textContent = 'blocking ads and tracking scripts.';
    }
  }
}

// Generates a stable unique rule ID >= 10000 for any given domain
function getDomainRuleId(domain) {
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = (hash << 5) - hash + domain.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash) + 10000;
}

// Toolbar: Open Options Dashboard
settingsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Toolbar: Inject click-to-block Element Picker
pickerBtn.addEventListener('click', () => {
  if (!activeTabId) return;
  chrome.scripting.executeScript({
    target: { tabId: activeTabId },
    files: ['picker.js']
  });
  window.close(); // Close popup so user can pick
});



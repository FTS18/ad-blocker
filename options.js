// DOM Elements
const whitelistInput = document.getElementById('whitelistInput');
const addWhitelistBtn = document.getElementById('addWhitelistBtn');
const whitelistContainer = document.getElementById('whitelistContainer');

const blockInput = document.getElementById('blockInput');
const addBlockBtn = document.getElementById('addBlockBtn');
const blockContainer = document.getElementById('blockContainer');

const cssInput = document.getElementById('cssInput');
const saveCssBtn = document.getElementById('saveCssBtn');
const toast = document.getElementById('toast');

// Initialize Option Page data
document.addEventListener('DOMContentLoaded', () => {
  loadWhitelist();
  loadCustomBlocked();
  loadCustomCSS();
});

// Toast notification helper
function showToast(message) {
  toast.textContent = message;
  toast.style.opacity = '1';
  setTimeout(() => {
    toast.style.opacity = '0';
  }, 2000);
}

// ----------------------------------------------------
// Whitelist Manager
// ----------------------------------------------------
function loadWhitelist() {
  chrome.storage.local.get(['whitelistedDomains'], ({ whitelistedDomains = [] }) => {
    whitelistContainer.innerHTML = '';
    
    if (whitelistedDomains.length === 0) {
      whitelistContainer.innerHTML = '<div class="empty-msg">No whitelisted websites yet.</div>';
      return;
    }
    
    whitelistedDomains.forEach(domain => {
      const item = document.createElement('div');
      item.className = 'list-item';
      item.innerHTML = `
        <span class="list-item-name">${domain}</span>
        <button class="delete-btn" data-domain="${domain}">Remove</button>
      `;
      whitelistContainer.appendChild(item);
    });
    
    // Add delete listeners
    whitelistContainer.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const domain = e.target.getAttribute('data-domain');
        removeDomainFromWhitelist(domain);
      });
    });
  });
}

addWhitelistBtn.addEventListener('click', () => {
  const domain = whitelistInput.value.trim().toLowerCase();
  if (!domain) return;
  
  chrome.storage.local.get(['whitelistedDomains'], ({ whitelistedDomains = [] }) => {
    if (whitelistedDomains.includes(domain)) {
      showToast('Website is already whitelisted.');
      return;
    }
    
    const updated = [...whitelistedDomains, domain];
    const ruleId = getDomainRuleId(domain, 'whitelist');
    
    // Register allowance rule in DNR
    const whitelistRule = {
      "id": ruleId,
      "priority": 3,
      "action": { "type": "allowAllRequests" },
      "condition": {
        "requestDomains": [domain],
        "resourceTypes": ["main_frame", "sub_frame"]
      }
    };
    
    chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [whitelistRule]
    }, () => {
      chrome.storage.local.set({ whitelistedDomains: updated }, () => {
        whitelistInput.value = '';
        loadWhitelist();
        showToast('Site added to whitelist.');
      });
    });
  });
});

function removeDomainFromWhitelist(domain) {
  chrome.storage.local.get(['whitelistedDomains'], ({ whitelistedDomains = [] }) => {
    const updated = whitelistedDomains.filter(d => d !== domain);
    const ruleId = getDomainRuleId(domain, 'whitelist');
    
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [ruleId]
    }, () => {
      chrome.storage.local.set({ whitelistedDomains: updated }, () => {
        loadWhitelist();
        showToast('Site removed from whitelist.');
      });
    });
  });
}

// ----------------------------------------------------
// Custom Blocked Domains Manager
// ----------------------------------------------------
function loadCustomBlocked() {
  chrome.storage.local.get(['customBlockedDomains'], ({ customBlockedDomains = [] }) => {
    blockContainer.innerHTML = '';
    
    if (customBlockedDomains.length === 0) {
      blockContainer.innerHTML = '<div class="empty-msg">No custom blocked domains yet.</div>';
      return;
    }
    
    customBlockedDomains.forEach(domain => {
      const item = document.createElement('div');
      item.className = 'list-item';
      item.innerHTML = `
        <span class="list-item-name">${domain}</span>
        <button class="delete-btn" data-domain="${domain}">Unblock</button>
      `;
      blockContainer.appendChild(item);
    });
    
    // Add delete listeners
    blockContainer.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const domain = e.target.getAttribute('data-domain');
        removeDomainFromBlocked(domain);
      });
    });
  });
}

addBlockBtn.addEventListener('click', () => {
  const domain = blockInput.value.trim().toLowerCase();
  if (!domain) return;
  
  chrome.storage.local.get(['customBlockedDomains'], ({ customBlockedDomains = [] }) => {
    if (customBlockedDomains.includes(domain)) {
      showToast('Domain is already blocked.');
      return;
    }
    
    const updated = [...customBlockedDomains, domain];
    const ruleId = getDomainRuleId(domain, 'block');
    
    // Register custom blocking rule in DNR
    const blockRule = {
      "id": ruleId,
      "priority": 2,
      "action": { "type": "block" },
      "condition": {
        "requestDomains": [domain],
        "resourceTypes": ["main_frame", "sub_frame", "script", "image", "xmlhttprequest"]
      }
    };
    
    chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [blockRule]
    }, () => {
      chrome.storage.local.set({ customBlockedDomains: updated }, () => {
        blockInput.value = '';
        loadCustomBlocked();
        showToast('Domain blocked.');
      });
    });
  });
});

function removeDomainFromBlocked(domain) {
  chrome.storage.local.get(['customBlockedDomains'], ({ customBlockedDomains = [] }) => {
    const updated = customBlockedDomains.filter(d => d !== domain);
    const ruleId = getDomainRuleId(domain, 'block');
    
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [ruleId]
    }, () => {
      chrome.storage.local.set({ customBlockedDomains: updated }, () => {
        loadCustomBlocked();
        showToast('Domain unblocked.');
      });
    });
  });
}

// ----------------------------------------------------
// Custom Cosmetic CSS Manager
// ----------------------------------------------------
function loadCustomCSS() {
  chrome.storage.local.get(['customSelectors'], ({ customSelectors = [] }) => {
    cssInput.value = customSelectors.join(', ');
  });
}

saveCssBtn.addEventListener('click', () => {
  const rawValue = cssInput.value;
  // Parse comma-separated string into trimmed array
  const selectors = rawValue
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);
    
  chrome.storage.local.set({ customSelectors: selectors }, () => {
    showToast('Cosmetic CSS Filters Saved.');
  });
});

// ----------------------------------------------------
// ID Hash Helper
// ----------------------------------------------------
function getDomainRuleId(domain, type) {
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = (hash << 5) - hash + domain.charCodeAt(i);
    hash |= 0;
  }
  const baseId = Math.abs(hash);
  
  if (type === 'whitelist') {
    return baseId + 10000;      // Whitelist range: 10000+
  } else {
    return baseId + 500000;     // Block range: 500000+
  }
}

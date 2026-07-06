chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ enabled: true });
});

// Watch for storage changes to enable/disable the adblocking ruleset dynamically
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.enabled) {
    const isEnabled = changes.enabled.newValue;
    chrome.declarativeNetRequest.updateEnabledRulesets({
      [isEnabled ? 'enableRulesetIds' : 'disableRulesetIds']: ['ruleset_1']
    });
  }
});

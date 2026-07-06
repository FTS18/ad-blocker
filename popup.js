const toggleBlocker = document.getElementById('toggleBlocker');
const statusVal = document.getElementById('statusVal');

// Load initial status from storage
chrome.storage.local.get('enabled', ({ enabled }) => {
  const isEnabled = enabled !== false; // default to true
  toggleBlocker.checked = isEnabled;
  updateStatusUI(isEnabled);
});

// Update status on toggle switch
toggleBlocker.addEventListener('change', () => {
  const isEnabled = toggleBlocker.checked;
  chrome.storage.local.set({ enabled: isEnabled });
  updateStatusUI(isEnabled);
});

function updateStatusUI(isEnabled) {
  if (isEnabled) {
    statusVal.textContent = 'active';
    statusVal.className = 'status-val active';
  } else {
    statusVal.textContent = 'disabled';
    statusVal.className = 'status-val';
  }
}

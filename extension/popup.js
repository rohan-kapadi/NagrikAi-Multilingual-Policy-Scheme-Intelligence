// popup.js — Reads synced profile and sends autofill command to active tab
document.addEventListener('DOMContentLoaded', async () => {
  let profile = {
    name: 'Rohan Kapadnis',
    occupation: 'farmer',
    district: 'Pune',
    state: 'Maharashtra',
    land_holding_hectares: 1.2,
    annual_family_income: 180000,
    caste_category: 'general',
    residence: 'rural'
  };

  // 1. Try to read from chrome.storage.local if available
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    try {
      const stored = await chrome.storage.local.get('nagrik_profile');
      if (stored && stored.nagrik_profile) {
        profile = { ...profile, ...stored.nagrik_profile };
      }
    } catch (e) {
      console.warn('Could not read from chrome.storage:', e);
    }
  }

  // Populate UI
  const occEl = document.getElementById('val-occupation');
  if (occEl) occEl.textContent = profile.occupation || 'Farmer';

  const locEl = document.getElementById('val-location');
  if (locEl) locEl.textContent = `${profile.district || 'Pune'}, ${profile.state || 'MH'}`;

  const landEl = document.getElementById('val-land');
  if (landEl) landEl.textContent = profile.land_holding_hectares ? `${profile.land_holding_hectares} ha` : '1.2 ha';

  const incEl = document.getElementById('val-income');
  if (incEl) incEl.textContent = profile.annual_family_income ? `₹${profile.annual_family_income.toLocaleString('en-IN')}` : '₹1,80,000';

  // 2. Autofill Button click
  const autofillBtn = document.getElementById('autofillBtn');
  if (autofillBtn) {
    autofillBtn.addEventListener('click', async () => {
      autofillBtn.textContent = 'Filling Form...';

      if (typeof chrome !== 'undefined' && chrome.tabs) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          try {
            await chrome.tabs.sendMessage(tab.id, {
              type: 'NAGRIK_COPILOT_AUTOFILL',
              profile: profile
            });
            autofillBtn.textContent = '✓ Form Autofilled!';
            autofillBtn.style.background = '#059669';
          } catch (err) {
            // If content script not injected yet, execute directly
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: (data) => {
                window.postMessage({ type: 'NAGRIK_COPILOT_AUTOFILL', profile: data }, '*');
              },
              args: [profile]
            });
            autofillBtn.textContent = '✓ Autofill Signal Sent!';
            autofillBtn.style.background = '#059669';
          }
        }
      }
    });
  }
});

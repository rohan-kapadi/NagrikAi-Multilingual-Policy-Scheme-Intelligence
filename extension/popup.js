// popup.js — Reads synced profile and sends autofill command to active tab
document.addEventListener('DOMContentLoaded', async () => {
  let profile = {
    name: 'Rohan Kapadi',
    occupation: 'farmer',
    district: 'Pune',
    state: 'Maharashtra',
    land_holding_hectares: 1.2,
    annual_family_income: 180000,
    caste_category: 'general',
    residence: 'rural'
  };

  function updateUI(prof) {
    if (!prof) return;
    const nameEl = document.getElementById('val-name');
    if (nameEl) nameEl.textContent = prof.name || 'Rohan Kapadi';

    const occEl = document.getElementById('val-occupation');
    if (occEl) occEl.textContent = prof.occupation || 'Farmer';

    const locEl = document.getElementById('val-location');
    if (locEl) locEl.textContent = `${prof.district || 'Pune'}, ${prof.state || 'MH'}`;

    const landEl = document.getElementById('val-land');
    if (landEl) landEl.textContent = prof.land_holding_hectares ? `${prof.land_holding_hectares} ha` : '1.2 ha';

    const incEl = document.getElementById('val-income');
    if (incEl) incEl.textContent = prof.annual_family_income ? `₹${Number(prof.annual_family_income).toLocaleString('en-IN')}` : '₹1,80,000';

    const catEl = document.getElementById('val-category');
    if (catEl) catEl.textContent = (prof.caste_category || 'General').toUpperCase();
  }

  // 1. Try to read from chrome.storage.local
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    try {
      const stored = await chrome.storage.local.get(['nagrik_profile', 'nagrik_copilot_profile']);
      const synced = stored.nagrik_profile || stored.nagrik_copilot_profile?.profile;
      if (synced && Object.keys(synced).length > 0) {
        profile = { ...profile, ...synced };
        updateUI(profile);
      }
    } catch (e) {
      console.warn('Could not read from chrome.storage:', e);
    }
  }

  // 2. Also query active tab for active localStorage profile fallback
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'NAGRIK_GET_PROFILE' }, (res) => {
          if (res?.profile && Object.keys(res.profile).length > 0) {
            profile = { ...profile, ...res.profile };
            updateUI(profile);
            if (chrome.storage && chrome.storage.local) {
              chrome.storage.local.set({ nagrik_profile: profile });
            }
          }
        });
      }
    } catch (e) {}
  }

  updateUI(profile);

  // 3. Autofill Button click
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

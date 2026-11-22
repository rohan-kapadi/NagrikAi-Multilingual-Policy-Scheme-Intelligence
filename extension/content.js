// content.js — Injected into target government portals & demo pages to auto-fill fields
console.log('Nagrik Copilot Content Script Loaded.');

// Intelligent field selector matcher
function autofillForm(profile) {
  if (!profile) return 0;

  const fieldMatchers = [
    { keys: ['applicant_name', 'fullname', 'name', 'farmer_name', 'student_name'], val: profile.name || 'Rohan Kapadi' },
    { keys: ['occupation', 'profession', 'livelihood'], val: profile.occupation || 'farmer' },
    { keys: ['state', 'state_name'], val: profile.state || 'Maharashtra' },
    { keys: ['district', 'district_name'], val: profile.district || 'Pune' },
    { keys: ['land_holding_hectares', 'land_area', 'land', 'hectares', 'holding'], val: profile.land_holding_hectares || 1.2 },
    { keys: ['annual_family_income', 'family_income', 'income', 'annual_income'], val: profile.annual_family_income || 180000 },
    { keys: ['caste_category', 'category', 'caste', 'social_category'], val: profile.caste_category || 'general' },
    { keys: ['residence', 'area_type', 'residential_area'], val: profile.residence || 'rural' },
    { keys: ['education_level', 'education', 'qualification'], val: profile.education_level || '12th Pass' },
  ];

  let count = 0;

  fieldMatchers.forEach(matcher => {
    matcher.keys.forEach(key => {
      // Look for id, name, or data-field match
      const elements = document.querySelectorAll(
        `input[id*="${key}" i], input[name*="${key}" i], input[placeholder*="${key}" i], ` +
        `select[id*="${key}" i], select[name*="${key}" i], textarea[id*="${key}" i], textarea[name*="${key}" i]`
      );

      elements.forEach(el => {
        if (el && matcher.val !== undefined && matcher.val !== null) {
          el.value = matcher.val;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));

          // Visual feedback style
          el.style.backgroundColor = '#ecfdf5';
          el.style.borderColor = '#059669';
          el.style.boxShadow = '0 0 0 3px rgba(5, 150, 105, 0.2)';
          count++;
        }
      });
    });
  });

  // Display floating notification banner
  showConfirmationBanner(`✓ Nagrik Copilot: ${count} fields autofilled from verified vault!`);
  return count;
}

function showConfirmationBanner(message) {
  const existing = document.getElementById('nagrik-copilot-banner');
  if (existing) existing.remove();

  const banner = document.createElement('div');
  banner.id = 'nagrik-copilot-banner';
  banner.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #047857;
    color: white;
    padding: 12px 18px;
    border-radius: 12px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 13px;
    font-weight: 600;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
    z-index: 999999;
    display: flex;
    align-items: center;
    gap: 8px;
    animation: slideDown 0.3s ease-out;
  `;
  banner.innerHTML = `<span>${message}</span>`;

  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 4000);
}

// ── Profile Sync Bridge ───────────────────────────────────────
// Listen for postMessage from NagrikAI web portal
window.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'NAGRIK_PROFILE_SYNC') {
    const payload = event.data.data;
    const profile = payload?.profile || payload;
    if (profile && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({
        nagrik_profile: profile,
        nagrik_copilot_profile: payload,
      }, () => {
        console.log('Nagrik Copilot: Synced profile to extension storage!', profile);
        showConfirmationBanner('✓ Nagrik Copilot: Profile synced to extension!');
      });
    }
  }

  if (event.data.type === 'NAGRIK_COPILOT_AUTOFILL') {
    autofillForm(event.data.profile);
  }
});

// Auto-sync from localStorage if running on NagrikAI domain
try {
  const localSync = localStorage.getItem('nagrik_copilot_profile') || localStorage.getItem('nagrik_citizen_profile');
  if (localSync) {
    const parsed = JSON.parse(localSync);
    const prof = parsed.profile || parsed;
    if (prof && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({
        nagrik_profile: prof,
        nagrik_copilot_profile: parsed,
      });
    }
  }
} catch (e) {}

// Listen for message from popup
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'NAGRIK_COPILOT_AUTOFILL') {
      const filled = autofillForm(request.profile);
      sendResponse({ status: 'success', filledCount: filled });
    } else if (request.type === 'NAGRIK_GET_PROFILE') {
      try {
        const stored = localStorage.getItem('nagrik_copilot_profile') || localStorage.getItem('nagrik_citizen_profile');
        if (stored) {
          const parsed = JSON.parse(stored);
          sendResponse({ profile: parsed.profile || parsed });
          return;
        }
      } catch (e) {}
      sendResponse({ profile: null });
    }
  });
}

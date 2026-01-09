/**
 * Options page logic for Chat Save extension
 */

const API_KEY_HINTS = {
  openai: {
    text: 'Get your API key from',
    url: 'https://platform.openai.com/api-keys',
    label: 'OpenAI Dashboard'
  },
  anthropic: {
    text: 'Get your API key from',
    url: 'https://console.anthropic.com/settings/keys',
    label: 'Anthropic Console'
  },
  gemini: {
    text: 'Get your API key from',
    url: 'https://aistudio.google.com/app/apikey',
    label: 'Google AI Studio'
  }
};

const DEFAULT_SETTINGS = {
  enableSummary: false,
  aiProvider: 'openai',
  apiKey: '',
  summaryLanguage: 'auto',
  includeModel: true,
  includeTimestamps: false
};

// DOM Elements
const enableSummaryEl = document.getElementById('enableSummary');
const summarySettingsEl = document.getElementById('summarySettings');
const aiProviderEl = document.getElementById('aiProvider');
const apiKeyEl = document.getElementById('apiKey');
const apiKeyHintEl = document.getElementById('apiKeyHint');
const toggleApiKeyEl = document.getElementById('toggleApiKey');
const summaryLanguageEl = document.getElementById('summaryLanguage');
const includeModelEl = document.getElementById('includeModel');
const includeTimestampsEl = document.getElementById('includeTimestamps');
const saveBtnEl = document.getElementById('saveBtn');
const statusEl = document.getElementById('status');

// Load saved settings
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    
    enableSummaryEl.checked = result.enableSummary;
    aiProviderEl.value = result.aiProvider;
    apiKeyEl.value = result.apiKey;
    summaryLanguageEl.value = result.summaryLanguage;
    includeModelEl.checked = result.includeModel;
    includeTimestampsEl.checked = result.includeTimestamps;
    
    updateSummarySettingsVisibility();
    updateApiKeyHint();
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
}

// Save settings
async function saveSettings() {
  saveBtnEl.disabled = true;
  statusEl.textContent = '';
  statusEl.className = 'status';

  const settings = {
    enableSummary: enableSummaryEl.checked,
    aiProvider: aiProviderEl.value,
    apiKey: apiKeyEl.value.trim(),
    summaryLanguage: summaryLanguageEl.value,
    includeModel: includeModelEl.checked,
    includeTimestamps: includeTimestampsEl.checked
  };

  // Validate API key if summary is enabled
  if (settings.enableSummary && !settings.apiKey) {
    statusEl.textContent = 'API key is required when AI Summary is enabled';
    statusEl.className = 'status error';
    saveBtnEl.disabled = false;
    return;
  }

  try {
    await chrome.storage.sync.set(settings);
    statusEl.textContent = '✓ Settings saved successfully';
    statusEl.className = 'status success';
  } catch (err) {
    statusEl.textContent = 'Failed to save settings: ' + err.message;
    statusEl.className = 'status error';
  } finally {
    saveBtnEl.disabled = false;
    setTimeout(() => {
      statusEl.textContent = '';
    }, 3000);
  }
}

// Toggle summary settings visibility
function updateSummarySettingsVisibility() {
  if (enableSummaryEl.checked) {
    summarySettingsEl.classList.add('active');
  } else {
    summarySettingsEl.classList.remove('active');
  }
}

// Update API key hint based on provider
function updateApiKeyHint() {
  const provider = aiProviderEl.value;
  const hint = API_KEY_HINTS[provider];
  if (hint) {
    apiKeyHintEl.innerHTML = `${hint.text} <a href="${hint.url}" target="_blank">${hint.label}</a>`;
  }
}

// Toggle API key visibility
function toggleApiKeyVisibility() {
  if (apiKeyEl.type === 'password') {
    apiKeyEl.type = 'text';
    toggleApiKeyEl.textContent = 'Hide';
  } else {
    apiKeyEl.type = 'password';
    toggleApiKeyEl.textContent = 'Show';
  }
}

// Event listeners
enableSummaryEl.addEventListener('change', updateSummarySettingsVisibility);
aiProviderEl.addEventListener('change', updateApiKeyHint);
toggleApiKeyEl.addEventListener('click', toggleApiKeyVisibility);
saveBtnEl.addEventListener('click', saveSettings);

// Initialize
loadSettings();

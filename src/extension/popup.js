const downloadBtn = document.getElementById('downloadBtn');
const selectionBtn = document.getElementById('selectionBtn');
const statusEl = document.getElementById('status');

const MESSAGE_TYPES = globalThis.ChatSave?.MESSAGE_TYPES || {
  EXTRACT: 'CHAT_SAVE_EXTRACT',
  EXTRACT_SELECTION: 'CHAT_SAVE_EXTRACT_SELECTION',
  DOWNLOAD: 'CHAT_SAVE_DOWNLOAD'
};

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? '#b42318' : '#2f5f2f';
}

function setBusy(isBusy) {
  downloadBtn.disabled = isBusy;
  if (isBusy) {
    selectionBtn.disabled = true;
  }
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) throw new Error('No active tab found.');
  return tab;
}

function sendMessageToTab(tabId, payload) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, payload, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

async function ensureContentScript(tabId) {
  const files = [
    'lib/contracts.js',
    'lib/providers.js',
    'lib/normalize.js',
    'lib/filenames.js',
    'lib/ai-summary.js',
    'lib/markdown.js',
    'lib/extractors/index.js',
    'lib/extractors/selection.js',
    'lib/extractors/chatgpt.js',
    'lib/extractors/claude.js',
    'lib/extractors/grok.js',
    'lib/extractors/deepseek.js',
    'lib/extractors/doubao.js',
    'content-script.js'
  ];

  await chrome.scripting.executeScript({
    target: { tabId },
    files
  });
}

async function requestExtract(type) {
  const tab = await getActiveTab();
  try {
    return await sendMessageToTab(tab.id, { type });
  } catch (err) {
    if (!String(err.message).includes('Receiving end does not exist')) {
      throw err;
    }
    await ensureContentScript(tab.id);
    return sendMessageToTab(tab.id, { type });
  }
}

async function triggerDownload(capture) {
  // Try to use AI summary if available
  let markdown;
  if (globalThis.ChatSave.renderMarkdownWithSummary) {
    setStatus('Generating summary...');
    markdown = await globalThis.ChatSave.renderMarkdownWithSummary(capture);
  } else {
    markdown = globalThis.ChatSave.renderMarkdown(capture);
  }
  
  const filename = globalThis.ChatSave.buildFilename({
    provider: capture.provider,
    title: capture.pageTitle,
    capturedAt: capture.capturedAt
  });

  if (!markdown || markdown.trim().length === 0) {
    throw new Error('Markdown content is empty.');
  }

  const response = await chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.DOWNLOAD,
    filename,
    markdown
  });

  if (!response || !response.ok) {
    throw new Error(response?.error || 'Save failed.');
  }
}

async function handlePrimaryDownload() {
  setBusy(true);
  setStatus('Preparing save...');
  selectionBtn.hidden = true;

  try {
    const response = await requestExtract(MESSAGE_TYPES.EXTRACT);
    if (!response || !response.ok) {
      if (response?.canFallbackSelection) {
        selectionBtn.hidden = false;
      }
      throw new Error(response?.error || 'Unable to extract chat content.');
    }

    await triggerDownload(response.capture);
    setStatus('Save started.');
  } catch (err) {
    setStatus(err.message, true);
  } finally {
    setBusy(false);
  }
}

async function handleSelectionDownload() {
  setBusy(true);
  setStatus('Preparing selected text...');

  try {
    const response = await requestExtract(MESSAGE_TYPES.EXTRACT_SELECTION);
    if (!response || !response.ok) {
      throw new Error(response?.error || 'No selected text to save.');
    }

    await triggerDownload(response.capture);
    setStatus('Save started.');
  } catch (err) {
    setStatus(err.message, true);
  } finally {
    setBusy(false);
  }
}

downloadBtn.addEventListener('click', handlePrimaryDownload);
selectionBtn.addEventListener('click', handleSelectionDownload);

// Settings link
const settingsLink = document.getElementById('settingsLink');
if (settingsLink) {
  settingsLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
}

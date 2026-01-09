const MESSAGE_TYPES = globalThis.ChatSave?.MESSAGE_TYPES || {
  EXTRACT: 'CHAT_SAVE_EXTRACT',
  EXTRACT_SELECTION: 'CHAT_SAVE_EXTRACT_SELECTION',
  DOWNLOAD: 'CHAT_SAVE_DOWNLOAD'
};

function buildCapture({ provider, messages, sourceUrl, pageTitle }) {
  const normalized = globalThis.ChatSave.normalizeMessages(messages);
  return {
    sourceUrl,
    capturedAt: new Date().toISOString(),
    pageTitle: pageTitle || document.title || '',
    provider,
    messages: normalized,
    partial: true,
    notes: 'Only currently loaded messages were captured.'
  };
}

function downloadInPage(filename, markdown) {
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    link.remove();
  }, 0);
}

async function requestDownload(filename, markdown) {
  if (!chrome?.runtime?.id) {
    downloadInPage(filename, markdown);
    return { ok: true, fallback: true };
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.DOWNLOAD,
      filename,
      markdown
    });

    if (!response || !response.ok) {
      throw new Error(response?.error || 'Save failed.');
    }

    return { ok: true };
  } catch (err) {
    downloadInPage(filename, markdown);
    return { ok: true, fallback: true, error: String(err?.message || err) };
  }
}

function extractFromPage() {
  const sourceUrl = window.location.href;
  const provider = globalThis.ChatSave.detectProvider(sourceUrl);
  const result = globalThis.ChatSave.extractFromProvider(provider, { document });
  if (!result || !result.messages || result.messages.length === 0) {
    return { ok: false, error: 'No chat content detected.', canFallbackSelection: true };
  }

  const capture = buildCapture({
    provider,
    messages: result.messages,
    sourceUrl,
    pageTitle: result.pageTitle
  });
  if (!capture.messages || capture.messages.length === 0) {
    return { ok: false, error: 'No chat content detected.', canFallbackSelection: true };
  }

  return { ok: true, capture };
}

function extractSelection() {
  const sourceUrl = window.location.href;
  const provider = globalThis.ChatSave.detectProvider(sourceUrl);
  const result = globalThis.ChatSave.extractors.selection();
  if (!result || !result.messages || result.messages.length === 0) {
    return { ok: false, error: 'No selected text found.' };
  }

  const capture = buildCapture({ provider, messages: result.messages, sourceUrl });
  if (!capture.messages || capture.messages.length === 0) {
    return { ok: false, error: 'No selected text found.' };
  }

  return { ok: true, capture };
}

function ensureHeaderButton() {
  const provider = globalThis.ChatSave.detectProvider(window.location.href);
  if (provider !== 'chatgpt') return;

  const existing = document.getElementById('chat-save-header-download');
  if (existing) return;

  const container = document.querySelector('#conversation-header-actions');
  if (!container) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'chat-save-header-download';
  button.className =
    'btn relative btn-ghost text-token-text-primary hover:bg-token-surface-hover keyboard-focused:bg-token-surface-hover rounded-lg max-sm:hidden';
  button.setAttribute('aria-label', 'Save chat');

  const label = document.createElement('span');
  label.className = 'max-md:hidden';
  label.textContent = 'Save';

  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  icon.setAttribute('width', '20');
  icon.setAttribute('height', '20');
  icon.setAttribute('aria-hidden', 'true');
  icon.setAttribute('class', '-ms-0.5 icon');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.innerHTML =
    '<path fill="currentColor" d="M12 3a1 1 0 0 1 1 1v9.59l2.3-2.3a1 1 0 1 1 1.4 1.42l-4.01 4a1 1 0 0 1-1.38 0l-4.01-4a1 1 0 1 1 1.4-1.42l2.3 2.3V4a1 1 0 0 1 1-1zm-7 14a1 1 0 0 1 1 1v1h12v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z"/>';

  const content = document.createElement('div');
  content.className = 'flex w-full items-center justify-center gap-1.5';
  content.appendChild(icon);
  content.appendChild(label);
  button.appendChild(content);

  async function handleHeaderDownload() {
    button.disabled = true;
    label.textContent = 'Saving...';

    try {
      const response = extractFromPage();
      if (!response.ok) {
        throw new Error(response.error || 'No chat content detected.');
      }

      const capture = response.capture;
      const markdown = globalThis.ChatSave.renderMarkdown(capture);
      const filename = globalThis.ChatSave.buildFilename({
        provider: capture.provider,
        title: capture.pageTitle,
        capturedAt: capture.capturedAt
      });

      if (!markdown || markdown.trim().length === 0) {
        throw new Error('Markdown content is empty.');
      }

      await requestDownload(filename, markdown);

      label.textContent = 'Saved';
      setTimeout(() => {
        label.textContent = 'Save';
      }, 1500);
    } catch (err) {
      label.textContent = 'Failed';
      setTimeout(() => {
        label.textContent = 'Save';
      }, 1500);
      console.warn('[ChatSave] Save failed', err);
    } finally {
      button.disabled = false;
    }
  }

  button.addEventListener('click', handleHeaderDownload);
  container.prepend(button);
}

function ensureGeminiHeaderButton() {
  const provider = globalThis.ChatSave.detectProvider(window.location.href);
  if (provider !== 'gemini') return false;

  if (document.getElementById('chat-save-gemini-download')) return true;

  const actions =
    document.querySelector('top-bar-actions .right-section .buttons-container:not(.adv-upsell)') ||
    document.querySelector('top-bar-actions .right-section');
  if (!actions) return false;

  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'chat-save-gemini-download';
  button.style.cssText = [
    'display: inline-flex',
    'align-items: center',
    'gap: 6px',
    'height: 32px',
    'padding: 0 12px',
    'border-radius: 999px',
    'border: 1px solid rgba(0,0,0,0.12)',
    'background: #fff',
    'color: #1f1f1f',
    'font: 500 12px/32px "Google Sans", "Roboto", system-ui, sans-serif',
    'cursor: pointer'
  ].join(';');
  button.setAttribute('aria-label', 'Save chat');

  const label = document.createElement('span');
  label.textContent = 'Save';
  button.appendChild(label);

  async function handleGeminiDownload() {
    button.disabled = true;
    label.textContent = 'Saving...';

    try {
      const response = extractFromPage();
      if (!response.ok) {
        throw new Error(response.error || 'No chat content detected.');
      }

      const capture = response.capture;
      const markdown = globalThis.ChatSave.renderMarkdown(capture);
      const filename = globalThis.ChatSave.buildFilename({
        provider: capture.provider,
        title: capture.pageTitle,
        capturedAt: capture.capturedAt
      });

      if (!markdown || markdown.trim().length === 0) {
        throw new Error('Markdown content is empty.');
      }

      await requestDownload(filename, markdown);

      label.textContent = 'Saved';
      setTimeout(() => {
        label.textContent = 'Save';
      }, 1500);
    } catch (err) {
      label.textContent = 'Failed';
      setTimeout(() => {
        label.textContent = 'Save';
      }, 1500);
      console.warn('[ChatSave] Save failed', err);
    } finally {
      button.disabled = false;
    }
  }

  button.addEventListener('click', handleGeminiDownload);
  actions.prepend(button);
  return true;
}

function ensureClaudeHeaderButton() {
  const provider = globalThis.ChatSave.detectProvider(window.location.href);
  if (provider !== 'claude') return false;

  if (document.getElementById('chat-save-claude-save')) return true;

  const actions = document.querySelector('[data-testid="chat-actions"]');
  if (!actions) return false;

  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'chat-save-claude-save';
  button.className = [
    'inline-flex',
    'items-center',
    'justify-center',
    'relative',
    'shrink-0',
    'can-focus',
    'select-none',
    'disabled:pointer-events-none',
    'disabled:opacity-50',
    'disabled:shadow-none',
    'disabled:drop-shadow-none',
    'font-base-bold',
    'border-0.5',
    'relative',
    'overflow-hidden',
    'transition',
    'duration-100',
    'backface-hidden',
    'h-8',
    'rounded-md',
    'px-3',
    'min-w-[4rem]',
    'active:scale-[0.985]',
    'whitespace-nowrap',
    '!text-xs',
    'Button_secondary__Teecd'
  ].join(' ');
  button.setAttribute('aria-label', 'Save chat');
  button.textContent = 'Save';

  async function handleClaudeSave() {
    button.disabled = true;
    button.textContent = 'Saving...';

    try {
      const response = extractFromPage();
      if (!response.ok) {
        throw new Error(response.error || 'No chat content detected.');
      }

      const capture = response.capture;
      const markdown = globalThis.ChatSave.renderMarkdown(capture);
      const filename = globalThis.ChatSave.buildFilename({
        provider: capture.provider,
        title: capture.pageTitle,
        capturedAt: capture.capturedAt
      });

      if (!markdown || markdown.trim().length === 0) {
        throw new Error('Markdown content is empty.');
      }

      await requestDownload(filename, markdown);

      button.textContent = 'Saved';
      setTimeout(() => {
        button.textContent = 'Save';
      }, 1500);
    } catch (err) {
      button.textContent = 'Failed';
      setTimeout(() => {
        button.textContent = 'Save';
      }, 1500);
      console.warn('[ChatSave] Save failed', err);
    } finally {
      button.disabled = false;
    }
  }

  button.addEventListener('click', handleClaudeSave);
  actions.prepend(button);
  return true;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === MESSAGE_TYPES.EXTRACT) {
    sendResponse(extractFromPage());
    return true;
  }

  if (message?.type === MESSAGE_TYPES.EXTRACT_SELECTION) {
    sendResponse(extractSelection());
    return true;
  }

  return false;
});

function startButtonObservers() {
  ensureHeaderButton();
  ensureGeminiHeaderButton();
  ensureClaudeHeaderButton();

  const observer = new MutationObserver(() => {
    ensureHeaderButton();
    ensureGeminiHeaderButton();
    ensureClaudeHeaderButton();
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
}

ensureGeminiHeaderButton();
ensureClaudeHeaderButton();
startButtonObservers();

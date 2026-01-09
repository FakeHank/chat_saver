chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'CHAT_SAVE_DOWNLOAD') {
    const markdown = String(message.markdown || '');
    const filename = String(message.filename || '');

    if (!markdown.trim() || !filename.trim()) {
      sendResponse({ ok: false, error: 'Missing markdown or filename.' });
      return true;
    }

    function toBase64(text) {
      const bytes = new TextEncoder().encode(text);
      let binary = '';
      bytes.forEach((b) => {
        binary += String.fromCharCode(b);
      });
      return btoa(binary);
    }

    const base64 = toBase64(markdown);
    const url = `data:text/markdown;base64,${base64}`;

    chrome.downloads.download(
      { url, filename, saveAs: true },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          sendResponse({ ok: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ ok: true, downloadId });
        }
      }
    );

    return true;
  }

  return false;
});

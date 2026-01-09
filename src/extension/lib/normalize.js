(function () {
  const root = globalThis.ChatSave || (globalThis.ChatSave = {});

  function normalizeMessages(messages) {
    const cleaned = [];
    (messages || []).forEach((msg, index) => {
      const role = msg?.role || 'unknown';
      const content = String(msg?.content || '').trim();
      if (!content) return;
      cleaned.push({ role, content, index: cleaned.length });
    });
    return cleaned;
  }

  root.normalizeMessages = normalizeMessages;
})();

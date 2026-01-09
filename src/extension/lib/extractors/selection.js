(function () {
  const root = globalThis.ChatSave || (globalThis.ChatSave = {});
  root.extractors = root.extractors || {};

  function extractSelection() {
    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : '';
    if (!text) return null;
    return {
      messages: [{ role: 'user', content: text }]
    };
  }

  root.extractors.selection = extractSelection;
})();

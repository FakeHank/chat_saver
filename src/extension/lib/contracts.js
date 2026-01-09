(function () {
  const root = globalThis.ChatSave || (globalThis.ChatSave = {});

  root.MESSAGE_TYPES = {
    EXTRACT: 'CHAT_SAVE_EXTRACT',
    EXTRACT_SELECTION: 'CHAT_SAVE_EXTRACT_SELECTION',
    DOWNLOAD: 'CHAT_SAVE_DOWNLOAD'
  };
})();

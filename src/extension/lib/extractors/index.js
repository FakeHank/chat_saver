(function () {
  const root = globalThis.ChatSave || (globalThis.ChatSave = {});
  root.extractors = root.extractors || {};

  function extractFromProvider(provider, context) {
    const extractor = root.extractors[provider];
    if (!extractor) return null;
    return extractor(context);
  }

  root.extractFromProvider = extractFromProvider;
})();

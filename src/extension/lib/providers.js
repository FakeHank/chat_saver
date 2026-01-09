(function () {
  const root = globalThis.ChatSave || (globalThis.ChatSave = {});

  function detectProvider(sourceUrl) {
    if (!sourceUrl) return 'unknown';
    try {
      const url = new URL(sourceUrl);
      const host = url.hostname;
      if (host === 'chatgpt.com' || host.endsWith('.chatgpt.com')) return 'chatgpt';
      if (host === 'gemini.google.com') return 'gemini';
      if (host === 'claude.ai' || host.endsWith('.claude.ai')) return 'claude';
      if (host === 'grok.com' || host.endsWith('.grok.com')) return 'grok';
      if (host === 'chat.deepseek.com' || host.endsWith('.deepseek.com')) return 'deepseek';
      if (host === 'www.doubao.com' || host.endsWith('.doubao.com')) return 'doubao';
    } catch {
      return 'unknown';
    }
    return 'unknown';
  }

  root.detectProvider = detectProvider;
})();

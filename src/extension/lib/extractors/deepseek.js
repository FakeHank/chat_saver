(function () {
  const root = globalThis.ChatSave || (globalThis.ChatSave = {});
  root.extractors = root.extractors || {};

  function inferRole(node) {
    const role = node.getAttribute('data-message-author-role') || node.dataset.role;
    if (role) return role;
    const className = node.className || '';
    if (className.includes('assistant')) return 'assistant';
    if (className.includes('user')) return 'user';
    return 'unknown';
  }

  function getContent(node) {
    const rich = node.querySelector('.markdown, .prose');
    return (rich || node).innerText.trim();
  }

  function extractDeepSeek() {
    const selectors = ['[data-testid="message"]', 'main [data-message-id]'];
    let nodes = [];
    for (const sel of selectors) {
      nodes = Array.from(document.querySelectorAll(sel));
      if (nodes.length) break;
    }
    if (nodes.length === 0) return null;
    const messages = nodes
      .map((node) => ({ role: inferRole(node), content: getContent(node) }))
      .filter((msg) => msg.content);
    return { messages };
  }

  root.extractors.deepseek = extractDeepSeek;
})();

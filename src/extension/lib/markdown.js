(function () {
  const root = globalThis.ChatSave || (globalThis.ChatSave = {});

  function formatHeader(capture) {
    const title = capture.pageTitle || 'Chat Transcript';
    const lines = [
      `# ${title}`,
      '',
      `- Source: ${capture.sourceUrl}`,
      `- Captured: ${capture.capturedAt}`
    ];
    if (capture.partial) {
      lines.push(`- Notice: ${capture.notes || 'Only currently loaded messages were captured.'}`);
    }
    lines.push('');
    return lines.join('\n');
  }

  function renderMessages(messages) {
    return messages
      .map((msg) => {
        const roleTitle = msg.role ? msg.role.toUpperCase() : 'UNKNOWN';
        return `# ${roleTitle}\n\n${msg.content}`;
      })
      .join('\n\n');
  }

  function renderMarkdown(capture) {
    const header = formatHeader(capture);
    const body = renderMessages(capture.messages || []);
    return `${header}\n${body}\n`;
  }

  root.renderMarkdown = renderMarkdown;
})();

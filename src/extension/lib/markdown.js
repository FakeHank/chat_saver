(function () {
  const root = globalThis.ChatSave || (globalThis.ChatSave = {});

  function formatHeader(capture, options = {}) {
    const title = capture.pageTitle || 'Chat Transcript';
    const lines = [
      `# ${title}`,
      '',
      `- Source: ${capture.sourceUrl}`,
      `- Captured: ${capture.capturedAt}`
    ];
    
    // Add provider/model info if available and enabled
    if (options.includeModel && capture.provider) {
      lines.push(`- Provider: ${capture.provider}`);
    }
    
    if (capture.partial) {
      lines.push(`- Notice: ${capture.notes || 'Only currently loaded messages were captured.'}`);
    }
    lines.push('');
    return lines.join('\n');
  }

  function formatSummary(summary) {
    if (!summary) return '';
    
    // The summary already has proper markdown formatting from the AI
    // Just wrap it in a clear section
    return `---

${summary}

---

`;
  }

  function renderMessages(messages) {
    return messages
      .map((msg) => {
        const roleTitle = msg.role ? msg.role.toUpperCase() : 'UNKNOWN';
        return `# ${roleTitle}\n\n${msg.content}`;
      })
      .join('\n\n');
  }

  function renderMarkdown(capture, options = {}) {
    const header = formatHeader(capture, options);
    const summary = formatSummary(options.summary);
    const body = renderMessages(capture.messages || []);
    return `${header}${summary}\n${body}\n`;
  }

  // Render markdown with AI summary (async version)
  async function renderMarkdownWithSummary(capture) {
    let summary = '';
    let options = { includeModel: true };
    
    try {
      const settings = await root.getSummarySettings();
      options.includeModel = settings.includeModel !== false;
      
      if (settings.enableSummary && settings.apiKey) {
        summary = await root.generateSummary(capture.messages, settings);
      }
    } catch (err) {
      console.warn('[ChatSave] Failed to generate summary:', err);
      // Continue without summary
    }
    
    options.summary = summary;
    return renderMarkdown(capture, options);
  }

  root.renderMarkdown = renderMarkdown;
  root.renderMarkdownWithSummary = renderMarkdownWithSummary;
})();

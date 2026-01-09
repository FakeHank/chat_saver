(function () {
  const root = globalThis.ChatSave || (globalThis.ChatSave = {});
  root.extractors = root.extractors || {};

  function readText(node) {
    if (!node) return '';
    const text = node.innerText && node.innerText.trim();
    if (text) return text;
    const raw = node.textContent || '';
    return raw.trim();
  }

  function htmlToMarkdown(rootNode) {
    if (!rootNode) return '';

    function extractCanvasAttachment(node) {
      if (!node.classList || !node.classList.contains('attachment-container')) return null;
      const titleNode = node.querySelector('[data-test-id="artifact-text"]');
      if (!titleNode) return null;

      const title = readText(titleNode) || 'Untitled';
      const timestamp = readText(node.querySelector('[data-test-id="creation-timestamp"]'));
      const actionLabel = readText(node.querySelector('[data-test-id="view-report-button"]'));

      const lines = ['**Canvas**', `- Title: ${title}`];
      if (timestamp) lines.push(`- Created: ${timestamp}`);
      if (actionLabel) lines.push(`- Action: ${actionLabel}`);

      return `\n\n${lines.join('\n')}\n\n`;
    }

    function serialize(nodes, context) {
      let out = '';
      nodes.forEach((node) => {
        out += serializeNode(node, context);
      });
      return out;
    }

    function serializeNode(node, context) {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || '';
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return '';
      }

      const canvasBlock = extractCanvasAttachment(node);
      if (canvasBlock) return canvasBlock;

      const tag = node.tagName.toLowerCase();
      const children = Array.from(node.childNodes);

      if (tag === 'br') return '\n';
      if (tag === 'hr') return '\n---\n\n';

      if (tag === 'strong' || tag === 'b') {
        const content = serialize(children, context);
        const lines = content.split('\n');
        const wrapped = lines
          .map((line) => (line.trim() ? `**${line.trim()}**` : ''))
          .join('\n');
        return wrapped;
      }

      if (tag === 'em' || tag === 'i') {
        return `*${serialize(children, context)}*`;
      }

      if (tag === 'code') {
        const text = node.textContent || '';
        if (node.parentElement && node.parentElement.tagName.toLowerCase() === 'pre') {
          return text;
        }
        return `\`${text}\``;
      }

      if (tag === 'pre') {
        const text = node.textContent || '';
        return `\n\`\`\`\n${text.trim()}\n\`\`\`\n\n`;
      }

      if (tag === 'a') {
        const href = node.getAttribute('href') || '';
        const label = serialize(children, context).trim() || href;
        return href ? `[${label}](${href})` : label;
      }

      if (tag === 'p') {
        const content = serialize(children, context).trim();
        return content ? `${content}\n\n` : '';
      }

      if (tag === 'blockquote') {
        const content = serialize(children, context).trim();
        if (!content) return '';
        return content
          .split('\n')
          .map((line) => `> ${line}`)
          .join('\n') + '\n\n';
      }

      if (tag === 'ul' || tag === 'ol') {
        const isOrdered = tag === 'ol';
        const depth = context.listDepth || 0;
        let index = 1;
        let buffer = '';

        children.forEach((child) => {
          if (!child.tagName || child.tagName.toLowerCase() !== 'li') return;
          const prefix = isOrdered ? `${index}. ` : '- ';
          const indent = '  '.repeat(depth);
          const item = renderListItem(child, { ...context, listDepth: depth });
          if (item) {
            buffer += `${indent}${prefix}${item}\n`;
          }
          index += 1;
        });

        return buffer ? `${buffer}\n` : '';
      }

      if (tag === 'li') {
        return serialize(children, context);
      }

      if (tag.match(/^h[1-6]$/)) {
        const level = Number(tag.slice(1));
        const heading = serialize(children, context).trim();
        return heading ? `\n${'#'.repeat(level)} ${heading}\n\n` : '';
      }

      return serialize(children, context);
    }

    function renderListItem(liNode, context) {
      const childNodes = Array.from(liNode.childNodes);
      const parts = [];
      const nestedLists = [];

      childNodes.forEach((child) => {
        if (child.tagName && ['ul', 'ol'].includes(child.tagName.toLowerCase())) {
          nestedLists.push(child);
        } else {
          parts.push(child);
        }
      });

      const text = serialize(parts, context).replace(/\n{2,}/g, '\n').trim();
      let output = text;

      if (nestedLists.length) {
        const nested = nestedLists
          .map((listNode) =>
            serialize([listNode], { ...context, listDepth: (context.listDepth || 0) + 1 }).trimEnd()
          )
          .join('\n');
        if (nested) {
          output += `\n${nested}`;
        }
      }

      return output.trim();
    }

    const markdown = serialize(Array.from(rootNode.childNodes), { listDepth: 0 });
    return markdown.replace(/\n{3,}/g, '\n\n').trim();
  }

  function extractUserQuery(node) {
    if (!node) return '';
    const lines = Array.from(node.querySelectorAll('.query-text-line'))
      .map((line) => line.innerText.trim())
      .filter(Boolean);
    if (lines.length) return lines.join('\n');
    const textNode = node.querySelector('.query-text') || node;
    return readText(textNode);
  }

  function extractModelResponse(node) {
    if (!node) return '';
    const markdownRoot =
      node.querySelector('message-content .markdown') ||
      node.querySelector('message-content') ||
      node.querySelector('.markdown');
    if (markdownRoot) {
      const rendered = htmlToMarkdown(markdownRoot);
      if (rendered) return rendered;
    }
    return readText(node);
  }

  function extractTurns(rootDocument) {
    const rootNode =
      rootDocument.querySelector('chat-window-content') ||
      rootDocument.querySelector('chat-window') ||
      rootDocument.querySelector('chat-app') ||
      rootDocument.body;
    if (!rootNode) return null;

    const nodes = Array.from(rootNode.querySelectorAll('user-query, model-response'));
    if (nodes.length === 0) return null;

    const messages = [];
    nodes.forEach((node) => {
      const tag = node.tagName.toLowerCase();
      if (tag === 'user-query') {
        const content = extractUserQuery(node);
        if (content) messages.push({ role: 'user', content });
      } else if (tag === 'model-response') {
        const content = extractModelResponse(node);
        if (content) messages.push({ role: 'assistant', content });
      }
    });

    return messages.length ? { messages, pageTitle: readPageTitle(rootDocument) } : null;
  }

  function readPageTitle(rootDocument) {
    const titleEl =
      rootDocument.querySelector('.conversation-title') ||
      rootDocument.querySelector('[data-test-id="actions-menu-button"] .conversation-title');
    return readText(titleEl);
  }

  root.extractors.gemini = (context) => {
    const rootDocument = context?.document || document;
    return extractTurns(rootDocument);
  };
})();

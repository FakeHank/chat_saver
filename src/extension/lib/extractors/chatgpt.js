(function () {
  const root = globalThis.ChatSave || (globalThis.ChatSave = {});
  root.extractors = root.extractors || {};

  function inferRole(node) {
    const role = node.getAttribute('data-message-author-role');
    if (role) return role;
    const className = node.className || '';
    if (className.includes('assistant')) return 'assistant';
    if (className.includes('user')) return 'user';
    return 'unknown';
  }

  function readText(node) {
    if (!node) return '';
    const text = node.innerText && node.innerText.trim();
    if (text) return text;
    const raw = node.textContent || '';
    return raw.trim();
  }

  function htmlToMarkdown(root) {
    if (!root) return '';

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

    const markdown = serialize(Array.from(root.childNodes), { listDepth: 0 });
    return markdown.replace(/\n{3,}/g, '\n\n').trim();
  }

  function resolveRichNode(node) {
    if (!node) return null;
    if (node.matches && node.matches('.markdown, .prose')) return node;
    return node.querySelector ? node.querySelector('.markdown, .prose') : null;
  }

  function getContent(node) {
    const rich = resolveRichNode(node);
    if (rich) {
      const rendered = htmlToMarkdown(rich);
      if (rendered) return rendered;
    }
    return readText(node);
  }

  function extractFromArticles() {
    const articles = Array.from(
      document.querySelectorAll('article[data-turn-id], article[data-testid^=\"conversation-turn\"]')
    );
    if (articles.length === 0) return null;

    const messages = articles
      .map((article) => {
        const roleAttr = article.getAttribute('data-turn');
        const role = roleAttr || findRoleLabel(article);
        const textNode =
          article.querySelector('[data-message-author-role] .markdown') ||
          article.querySelector('[data-message-author-role] .prose') ||
          article.querySelector('[data-message-author-role] .whitespace-pre-wrap') ||
          article.querySelector('[data-message-author-role]') ||
          article;
        const rich = resolveRichNode(textNode);
        let content = rich ? htmlToMarkdown(rich) : '';
        if (!content) content = readText(textNode);
        return { role, content };
      })
      .filter((msg) => msg.content);

    return { messages };
  }

  function inferRoleFromLabel(text) {
    const normalized = String(text || '').trim().toLowerCase();
    if (!normalized) return 'unknown';
    if (normalized === 'user' || normalized === 'you') return 'user';
    if (normalized === 'assistant' || normalized === 'chatgpt' || normalized === 'gpt') return 'assistant';
    if (normalized === 'system') return 'system';
    return 'unknown';
  }

  function findRoleLabel(node) {
    const candidates = Array.from(
      node.querySelectorAll('h1, h2, h3, h4, h5, h6, strong, span, div')
    );
    for (const el of candidates) {
      const role = inferRoleFromLabel(el.textContent);
      if (role !== 'unknown') return role;
    }
    return inferRole(node);
  }

  function extractFromConversationTurns() {
    const nodes = Array.from(document.querySelectorAll('[data-testid=\"conversation-turn\"]'));
    if (nodes.length === 0) return null;
    const messages = nodes
      .map((node) => {
        const role = findRoleLabel(node);
        const contentNode = node.querySelector('.markdown, .prose') || node;
        let content = contentNode.innerText.trim();
        const roleLabel = role === 'assistant' ? 'ChatGPT' : role.toUpperCase();
        if (content.startsWith(roleLabel)) {
          content = content.slice(roleLabel.length).trim();
        }
        return { role, content };
      })
      .filter((msg) => msg.content);
    return { messages };
  }

  function extractFromNextData() {
    const script = document.getElementById('__NEXT_DATA__');
    if (!script) return null;

    try {
      const data = JSON.parse(script.textContent || '{}');
      const mapping = findConversationMapping(data);
      if (!mapping) return null;

      const messages = Object.values(mapping)
        .map((entry) => entry?.message)
        .filter(Boolean)
        .map((message) => {
          const role = message?.author?.role || 'unknown';
          const parts = message?.content?.parts;
          const content =
            Array.isArray(parts) ? parts.filter(Boolean).join('\n') : String(message?.content?.text || '');
          return { role, content: content.trim(), createTime: message?.create_time || 0 };
        })
        .filter((msg) => msg.content);

      messages.sort((a, b) => a.createTime - b.createTime);
      return { messages: messages.map(({ role, content }) => ({ role, content })) };
    } catch {
      return null;
    }
  }

  function findConversationMapping(root) {
    const queue = [root];
    while (queue.length) {
      const current = queue.shift();
      if (!current || typeof current !== 'object') continue;

      if (current.mapping && typeof current.mapping === 'object') {
        const entries = Object.values(current.mapping);
        if (entries.some((entry) => entry?.message?.author?.role && entry?.message?.content)) {
          return current.mapping;
        }
      }

      for (const value of Object.values(current)) {
        if (value && typeof value === 'object') {
          queue.push(value);
        }
      }
    }
    return null;
  }

  function extractChatGPT() {
    const fromArticles = extractFromArticles();
    if (fromArticles) return fromArticles;

    const nodes = Array.from(document.querySelectorAll('[data-message-author-role]'));
    if (nodes.length === 0) {
      const fromTurns = extractFromConversationTurns();
      if (fromTurns) return fromTurns;
      const fromData = extractFromNextData();
      return fromData || null;
    }
    const messages = nodes
      .map((node) => ({ role: inferRole(node), content: getContent(node) }))
      .filter((msg) => msg.content);
    return { messages };
  }

  root.extractors.chatgpt = extractChatGPT;
})();

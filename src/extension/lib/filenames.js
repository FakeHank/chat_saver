(function () {
  const root = globalThis.ChatSave || (globalThis.ChatSave = {});

  function slugify(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
  }

  function formatTimestamp(date) {
    const pad = (num) => String(num).padStart(2, '0');
    return (
      date.getFullYear() +
      pad(date.getMonth() + 1) +
      pad(date.getDate()) +
      '-' +
      pad(date.getHours()) +
      pad(date.getMinutes()) +
      pad(date.getSeconds())
    );
  }

  function buildFilename({ provider, title, capturedAt }) {
    const safeProvider = provider && provider !== 'unknown' ? provider : 'chat';
    const titleSlug = slugify(title) || 'untitled';
    const date = capturedAt ? new Date(capturedAt) : new Date();
    const stamp = formatTimestamp(date);
    return `${safeProvider}-${titleSlug}-${stamp}.md`;
  }

  root.buildFilename = buildFilename;
})();

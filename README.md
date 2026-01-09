# Chat Saver (Chrome Extension)

Save AI chat conversations from popular websites (ChatGPT, Gemini, Claude, etc.) as local Markdown files.

Chinese README: [README.zh.md](README.zh.md)

## Overview
Chat Saver is a Chrome extension that lets you save the current chat page into a local Markdown file with one click, making it easy to archive and revisit important conversations.

## Features
- One-click save to Markdown
- Inline Save buttons that match each site’s UI
- Multi-site support (expanding)
- Preserves basic Markdown structure (headings, lists, bold, code blocks)
- Local download only (no uploads)

## Supported Sites
- ChatGPT
- Google Gemini (Canvas metadata supported)
- Claude
- Grok
- DeepSeek
- Doubao

## Installation (Load Unpacked)
1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select this project folder

## Usage
1. Open a supported chat page
2. Find the `Save` button in the page header actions
3. Click to download the Markdown file

## Export Format
The exported `.md` file includes:
- Conversation title (if available)
- `# USER` / `# ASSISTANT` as top-level headings
- Lists, bold text, code blocks, and other common Markdown structures
- Canvas entries include title/time metadata when only the chip is available

## Privacy
All processing is local. The extension does not upload or sync your chats.

## Known Limitations
- Only currently loaded messages are saved
- Some rich formatting may be lost depending on site markup
- Gemini Canvas content may be unavailable if the page only exposes a chip/card

## Development
No build step yet. Use `src/extension` directly as the extension source.

## Project Structure
```
src/extension/
  manifest.json
  content-script.js
  service-worker.js
  popup.html
  popup.js
  lib/
    extractors/
```

## Roadmap
- Add more site support
- Improve rich content and attachments export
- Optional cloud sync (future)

## License
Add a LICENSE file before open-sourcing (e.g., MIT).

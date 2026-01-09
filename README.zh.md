# Chat Saver（Chrome 插件）

Chat Saver 是一个 Chrome 浏览器插件，用于一键保存当前聊天页面的对话内容，并以 Markdown 文件的形式下载到本地，便于整理、归档与二次阅读。

## 功能特性
- 一键保存当前页面对话为 Markdown
- 内嵌按钮，融入各站点原生操作区
- 支持多站点（持续扩展）
- 保留基础 Markdown 结构（标题、列表、加粗、代码块等）
- 本地下载，不上传任何内容

## 已支持站点
- ChatGPT
- Google Gemini
- Claude
- Grok（待支持）
- DeepSeek（待支持）
- 豆包（待支持）

## 安装方式（本地加载）
1. 克隆仓库到本地
2. 打开 Chrome，进入 `chrome://extensions/`
3. 开启右上角「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择本项目目录

## 使用方式
1. 打开支持的网站并进入对话页面
2. 在页面右上角操作区找到 `Save` 按钮
3. 点击后会自动下载 Markdown 文件

## 导出格式说明
导出文件为 `.md` 格式，包含：
- 对话标题（如站点提供）
- `# USER` / `# ASSISTANT` 作为一级标题
- 列表、加粗、代码块等常见 Markdown 结构
- Canvas 对话会包含 Canvas 标题与时间等信息（若页面仅提供卡片信息）

## 隐私说明
所有操作均在本地完成，插件不会上传或同步任何对话内容。

## 已知限制
- 仅保存当前页面已加载的对话内容
- 部分站点的富文本结构可能仍有格式损失
- Gemini Canvas 如果页面未渲染正文，仅能保存卡片信息

## 本地开发
暂无构建流程，直接使用 `src/extension` 作为扩展源码。

## 项目结构
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

## Roadmap（规划中）
- 增加更多网站支持
- 更完整的富文本与附件导出
- 云端同步（后续版本）

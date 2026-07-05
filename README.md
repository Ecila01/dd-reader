<a id="top"></a>

<div align="center">

[中文文档](#cn) &nbsp;|&nbsp; [English](#en)

</div>

---

<a id="cn"></a>

<div align="center">

**一款面向 Windows 的现代 Markdown 阅读器，搭载 TeX 级排版引擎**

[![Rust](https://img.shields.io/badge/Rust-1.77+-orange.svg)](https://www.rust-lang.org)
[![Tauri](https://img.shields.io/badge/Tauri-2.x-blue.svg)](https://tauri.app)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## 概览

DD Reader 是一款 **Windows 桌面 Markdown 阅读器**，将 TeX 级排版带入日常文档阅读。核心引擎实现了 **Knuth-Plass (K-P) 段落断行算法** — 与 TeX 相同的算法，能够产生视觉均衡、字间距均匀的段落。同时支持分屏编辑、实时预览、数学公式渲染和多标签页工作区管理。

> 灵感来源于 [Telari](https://github.com/sachinchoolur/telari)（macOS）和 Typora 的阅读体验。

---

## 功能特性

### 排版引擎
- **Knuth-Plass 两端对齐** — Rust 驱动的 K-P 算法为每个段落计算最优断行位置
- **CJK 优先设计** — 原生支持中日韩文本，正确识别 CJK 字符相邻的强调标记（`**加粗**`）
- **可调排版参数** — 通过滑杆或数值输入调整字号、行高、最大宽度和页边距

### 阅读与编辑
- **阅读模式** — 沉浸式阅读视图，状态栏显示字数/字符数统计
- **分屏编辑器** — 左侧 CodeMirror 6 源码编辑，右侧 K-P 实时预览
- **同步滚动** — 可选源码与预览联动滚动
- **可调分屏比例** — 拖拽分隔线调整编辑/预览区大小

### 数学与代码
- **KaTeX 集成** — 渲染行内 `$...$` 和块级 `$$...$$` LaTeX 公式
- **代码高亮** — 通过 CodeMirror 为 30+ 种语言自动语法高亮

### 文件管理
- **多标签页工作区** — 同时打开多个文件，保留滚动和解析状态
- **文件树侧边栏** — 可折叠的文件浏览器，自动刷新文件变更
- **拖拽打开** — 将文件或文件夹直接拖入窗口打开
- **会话恢复** — 启动时恢复上次打开的标签页，支持懒加载

### 主题与交互
- **明暗主题** — 阅读友好的浅色模式和编码友好的深色模式
- **Ctrl+滚轮缩放** — 随时调整字号大小
- **设置面板** — 滑杆调节字号、行高、最大宽度、页边距

---

## 架构

```
┌───────────────────────────────────────────────┐
│           前端界面 (React 19 + TS)             │
│  ┌──────────┐ ┌──────────┐ ┌────────────────┐ │
│  │  编辑器  │ │  阅读器   │ │ 文件树/标签栏   │ │
│  │CodeMirror│ │KaTeX+K-P │ │  设置面板       │ │
│  └──────────┘ └──────────┘ └────────────────┘ │
├───────────────────────────────────────────────┤
│              Tauri IPC 桥接层                  │
├───────────────────────────────────────────────┤
│           Rust 后端 (Tauri Core)              │
│  ┌──────────┐ ┌──────────┐ ┌────────────────┐ │
│  │ K-P 引擎 │ │ MD 解析器 │ │ 文件系统服务   │  │
│  │ DP 算法  │ │pulldown  │ │notify/watcher  │ │
│  └──────────┘ └──────────┘ └────────────────┘ │
└───────────────────────────────────────────────┘
```

| 层级 | 技术 | 用途 |
|------|------|------|
| 桌面框架 | [Tauri 2.x](https://tauri.app) | 轻量级 (~5MB) Rust 桌面壳 |
| 前端 | React 19 + TypeScript 6 | 组件化 UI，类型安全开发 |
| 状态管理 | [Zustand](https://zustand-demo.pmnd.rs) | 极简 Hook 风格全局状态 |
| Markdown 解析 | [pulldown-cmark](https://crates.io/crates/pulldown-cmark) (Rust) | CommonMark 兼容，高性能 |
| 编辑器 | [CodeMirror 6](https://codemirror.net) | 模块化可扩展 |
| 数学渲染 | [KaTeX](https://katex.org) | 快速 LaTeX 公式渲染 |
| K-P 算法 | 纯 Rust 实现 | 动态规划最优断行 |
| 样式 | CSS Modules | 组件级作用域样式 |

---

## 快速开始

### 环境要求

- **Windows 10/11** (x64)
- [Node.js](https://nodejs.org) 18+
- [Rust](https://www.rust-lang.org/tools/install) 1.77+
- [Microsoft Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)（勾选 C++ 工作负载）

### 开发调试

```bash
git clone https://github.com/Ecila01/dd-reader.git
cd dd-reader
npm install
npx tauri dev
```

或双击 `debug.bat` 一键启动调试环境。

### 构建发布

```bash
npx tauri build
```

产物在 `src-tauri/target/release/bundle/`：
- **NSIS 安装包** — `DD Reader_{version}_x64-setup.exe`
- **MSI 安装包** — `DD Reader_{version}_x64_en-US.msi`
- **便携版** — `dd-reader.exe`（免安装，双击即用）

---

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+O` | 打开文件 |
| `Ctrl+Shift+O` | 打开文件夹作为工作区 |
| `Ctrl+E` | 切换阅读/编辑模式 |
| `Ctrl+B` | 切换侧边栏 |
| `Ctrl+N` | 新建标签页 |
| `Ctrl+滚轮` | 缩放字体大小 |

---

## 项目结构

```
dd-reader/
├── src/                          # React 前端
│   ├── components/               # UI 组件
│   │   ├── Editor.tsx            # 分屏编辑器
│   │   ├── CodeMirrorEditor.tsx  # CodeMirror 6 封装
│   │   ├── Reader.tsx            # 阅读模式（K-P 排版）
│   │   ├── Layout.tsx            # 主布局框架
│   │   ├── TabBar.tsx            # 多标签页管理
│   │   ├── Sidebar.tsx           # 文件树侧边栏
│   │   ├── TitleBar.tsx          # 标题栏
│   │   ├── StatusBar.tsx         # 状态栏
│   │   └── Settings.tsx          # 设置面板
│   ├── hooks/                    # 自定义 Hooks
│   │   ├── useKaTeX.ts           # KaTeX 公式渲染
│   │   ├── useKeyboardShortcuts.ts
│   │   ├── useOpenFile.ts        # 文件打开 + 异步解析
│   │   ├── useWorkspace.ts       # 工作区管理
│   │   ├── useDragDrop.ts        # 拖拽打开
│   │   ├── useZoom.ts            # Ctrl+滚轮缩放
│   │   └── useSession.ts         # 会话持久化
│   ├── store/                    # Zustand 状态
│   ├── types/                    # TypeScript 类型定义
│   ├── App.tsx
│   └── main.tsx
├── src-tauri/                    # Rust 后端
│   ├── src/
│   │   ├── kp.rs                 # Knuth-Plass 算法实现
│   │   ├── md.rs                 # Markdown 解析 + CJK 强调修复
│   │   ├── commands.rs           # Tauri IPC 命令
│   │   └── lib.rs                # 应用入口
│   ├── Cargo.toml
│   └── tauri.conf.json
├── public/                       # 静态资源
├── index.html
├── package.json
├── vite.config.ts
├── debug.bat                     # 双击启动调试
├── debug.ps1                     # PowerShell 调试启动
└── clear_cache.py                # 缓存清除工具
```

---

## 关键技术细节

### Knuth-Plass 段落断行

K-P 算法将段落断行建模为**有向无环图上的最短路径问题**。每个潜在的断行点是一个节点，边的权重为"不佳度"——衡量填充该行所需的空白拉伸量。动态规划找到全局最优断行序列。

- **Rust 实现**位于 `src-tauri/src/kp.rs`，支持可配置的字体度量
- **前端集成**通过 `ParagraphLineBreaks` 数据结构应用到 DOM 段落
- **响应式重排** — 窗口大小变化时触发重新计算

### CJK 强调标记处理

CommonMark 规范要求强调标记（`**`、`*`）必须紧邻 Unicode 空白或标点才能被识别。CJK 字符两者都不满足，导致 `和**SnapKV**提出` 被视为纯文本。DD Reader 通过**受保护的 HTML 后处理**解决：

1. `$...$` / `$$...$$` 数学公式占位保护
2. `<code>` / `<pre>` 代码块占位保护
3. 与 CJK 字符相邻的未转换 `**文本**` → `<strong>文本</strong>`
4. 恢复所有占位符

确保代码块（`2**2`）、数学公式（`$x^{2**n}$`）和转义星号（`\*\*文本\*\*`）永远不会被误处理。

---

## 许可证

DD Reader 使用 [MIT License](LICENSE) 开源。

## 致谢

- [Telari](https://github.com/sachinchoolur/telari) — 启发本项目的原始 macOS 阅读器
- [Tauri](https://tauri.app) — 轻量级桌面应用框架
- [pulldown-cmark](https://github.com/raphlinus/pulldown-cmark) — 出色的 CommonMark 解析器
- [KaTeX](https://katex.org) — 快速数学公式排版
- [CodeMirror](https://codemirror.net) — 可扩展的代码编辑器

<div align="right">

[↑ 回到顶部](#top)

</div>

---

<a id="en"></a>

<div align="center">

**A modern Markdown reader for Windows, powered by TeX-level typography**

[![Rust](https://img.shields.io/badge/Rust-1.77+-orange.svg)](https://www.rust-lang.org)
[![Tauri](https://img.shields.io/badge/Tauri-2.x-blue.svg)](https://tauri.app)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## Overview

DD Reader is a **Windows desktop Markdown reader** that brings TeX-quality typesetting to everyday document reading. At its core is the **Knuth-Plass (K-P) paragraph justification algorithm** — the same algorithm used by TeX to produce beautifully balanced, evenly spaced paragraphs. It also features a split-pane editing mode, live preview, math rendering, and multi-tab workspace management.

> Inspired by [Telari](https://github.com/sachinchoolur/telari) (macOS) and the reading experience of Typora.

---

## Features

### Typography
- **Knuth-Plass Justification** — Rust-powered K-P algorithm computes optimal line breaks for every paragraph
- **CJK-first design** — Native support for Chinese, Japanese, and Korean text with proper emphasis handling
- **Adjustable typography** — Change font size, line height, max width, and page margins via sliders or numeric input

### Reading & Editing
- **Reading mode** — Clean, distraction-free reading view with status bar
- **Split-pane editor** — CodeMirror 6 (left) + K-P live preview (right)
- **Sync scroll** — Optional linked scrolling between source and preview
- **Adjustable split ratio** — Drag to resize editor/preview panes

### Math & Code
- **KaTeX integration** — Inline `$...$` and block `$$...$$` LaTeX formulas
- **Code highlighting** — 30+ languages via CodeMirror

### File Management
- **Multi-tab workspace** — Open multiple files, preserve scroll/parse state
- **File tree sidebar** — Collapsible file browser with auto-refresh
- **Drag & drop** — Drag files or folders directly into the window
- **Session restore** — Reopens last tabs on startup with lazy loading

### Themes & UX
- **Light/Dark themes** — Toggle between reading-friendly and coding-friendly modes
- **Ctrl+Scroll zoom** — Adjust font size on the fly
- **Settings panel** — Sliders for font size, line height, max width, margins

---

## Architecture

```
┌───────────────────────────────────────────────┐
│           Web Frontend (React 19 + TS)        │
│  ┌──────────┐ ┌──────────┐ ┌────────────────┐ │
│  │  Editor  │ │  Reader  │ │ File Tree/Tabs │ │
│  │CodeMirror│ │KaTeX+K-P │ │  Settings Panel│ │
│  └──────────┘ └──────────┘ └────────────────┘ │
├───────────────────────────────────────────────┤
│              Tauri IPC Bridge                 │
├───────────────────────────────────────────────┤
│           Rust Backend (Tauri Core)           │
│  ┌──────────┐ ┌──────────┐ ┌────────────────┐ │
│  │K-P Engine│ │ MD Parser│ │  File/FS Svc   │ │
│  │ DP algo  │ │pulldown  │ │notify/watcher  │ │
│  └──────────┘ └──────────┘ └────────────────┘ │
└───────────────────────────────────────────────┘
```

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Desktop Framework | [Tauri 2.x](https://tauri.app) | Lightweight (~5MB) Rust-based desktop shell |
| Frontend | React 19 + TypeScript 6 | Component-based UI |
| State Management | [Zustand](https://zustand-demo.pmnd.rs) | Minimal, hook-based global state |
| Markdown Parser | [pulldown-cmark](https://crates.io/crates/pulldown-cmark) (Rust) | CommonMark-compliant |
| Editor | [CodeMirror 6](https://codemirror.net) | Modular, extensible |
| Math Rendering | [KaTeX](https://katex.org) | Fast LaTeX math |
| K-P Algorithm | Pure Rust | Dynamic programming optimal line-breaking |
| Styling | CSS Modules | Component-scoped styles |

---

## Getting Started

### Prerequisites

- **Windows 10/11** (x64)
- [Node.js](https://nodejs.org) 18+
- [Rust](https://www.rust-lang.org/tools/install) 1.77+
- [Microsoft Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022) (with C++ workload)

### Development

```bash
git clone https://github.com/Ecila01/dd-reader.git
cd dd-reader
npm install
npx tauri dev
```

### Build

```bash
npx tauri build
```

Output in `src-tauri/target/release/bundle/`:
- **NSIS installer** — `DD Reader_{version}_x64-setup.exe`
- **MSI installer** — `DD Reader_{version}_x64_en-US.msi`
- **Portable** — `dd-reader.exe` (standalone, no install)

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+O` | Open file |
| `Ctrl+Shift+O` | Open folder as workspace |
| `Ctrl+E` | Toggle Reading / Editing mode |
| `Ctrl+B` | Toggle sidebar |
| `Ctrl+N` | New tab |
| `Ctrl+Scroll` | Zoom font size |

---

## Project Structure

```
dd-reader/
├── src/                          # React frontend
│   ├── components/               # UI components
│   │   ├── Editor.tsx            # Split-pane editor
│   │   ├── CodeMirrorEditor.tsx  # CodeMirror 6 wrapper
│   │   ├── Reader.tsx            # Reading mode with K-P
│   │   ├── Layout.tsx            # Main layout shell
│   │   ├── TabBar.tsx            # Multi-tab management
│   │   ├── Sidebar.tsx           # File tree sidebar
│   │   ├── TitleBar.tsx          # Title bar
│   │   ├── StatusBar.tsx         # Status bar
│   │   └── Settings.tsx          # Settings panel
│   ├── hooks/                    # Custom hooks
│   │   ├── useKaTeX.ts           # KaTeX rendering
│   │   ├── useKeyboardShortcuts.ts
│   │   ├── useOpenFile.ts        # File open + async parse
│   │   ├── useWorkspace.ts       # Workspace management
│   │   ├── useDragDrop.ts        # Drag & drop
│   │   ├── useZoom.ts            # Ctrl+Scroll zoom
│   │   └── useSession.ts         # Session persistence
│   ├── store/                    # Zustand state
│   ├── types/                    # TypeScript types
│   ├── App.tsx
│   └── main.tsx
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── kp.rs                 # Knuth-Plass algorithm
│   │   ├── md.rs                 # Markdown parsing + CJK fix
│   │   ├── commands.rs           # Tauri IPC commands
│   │   └── lib.rs                # App entry point
│   ├── Cargo.toml
│   └── tauri.conf.json
├── public/                       # Static assets
├── index.html
├── package.json
├── vite.config.ts
├── debug.bat                     # Double-click debug launcher
├── debug.ps1                     # PowerShell debug launcher
└── clear_cache.py                # Cache clearing utility
```

---

## Key Technical Details

### Knuth-Plass Paragraph Justification

The K-P algorithm models paragraph breaking as a **shortest-path problem** on a directed acyclic graph. Each potential line break is a node, edges are weighted by "badness" — how much whitespace stretching is needed. Dynamic programming finds the globally optimal break sequence.

- **Rust implementation** in `src-tauri/src/kp.rs` with configurable font metrics
- **Frontend integration** via `ParagraphLineBreaks` applied to DOM paragraphs
- **Responsive re-layout** — window resize triggers re-computation

### CJK Emphasis Handling

CommonMark specifies emphasis markers (`**`, `*`) must be adjacent to unicode whitespace/punctuation to be recognized. CJK characters are neither, causing `和**SnapKV**提出` to be treated literally. DD Reader solves this with protected HTML post-processing:

1. `$...$` / `$$...$$` math formulas are placeholder-protected
2. `<code>` / `<pre>` blocks are placeholder-protected
3. Unconverted `**text**` adjacent to CJK characters → `<strong>text</strong>`
4. All placeholders are restored

This ensures code blocks, math formulas, and escaped stars are never affected.

---

## License

DD Reader is licensed under the [MIT License](LICENSE).

## Acknowledgments

- [Telari](https://github.com/sachinchoolur/telari) — The original macOS reader that inspired this project
- [Tauri](https://tauri.app) — Lightweight desktop app framework
- [pulldown-cmark](https://github.com/raphlinus/pulldown-cmark) — Excellent CommonMark parser
- [KaTeX](https://katex.org) — Fast math typesetting
- [CodeMirror](https://codemirror.net) — Extensible code editor

<div align="right">

[↑ Back to top](#top)

</div>
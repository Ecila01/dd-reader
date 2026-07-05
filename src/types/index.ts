/// 全局类型定义

/// 应用模式
export type AppMode = 'reading' | 'editing';

/// 主题类型
export type Theme = 'light' | 'dark';

/// 文件标签页
export interface Tab {
  id: string;
  path: string;
  name: string;
  content: string;
  isDirty: boolean;
}

/// 解析后的文档
export interface ParsedDocument {
  html: string;
  line_breaks: ParagraphLineBreaks[];
  metadata: DocumentMetadata;
}

/// 段落断行数据
export interface ParagraphLineBreaks {
  paragraph_index: number;
  break_points: number[];
  line_spacings: number[];
}

/// 文档元信息
export interface DocumentMetadata {
  word_count: number;
  char_count: number;
  line_count: number;
}

/// 文件树节点
export interface FileTreeNode {
  name: string;
  path: string;
  is_dir: boolean;
  children?: FileTreeNode[];
}

/// 文件条目（来自 Rust 后端，平铺列表）
export interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
}

/// 字体设置
export interface FontSettings {
  cjk: string;
  latin: string;
  mono: string;
  fontSize: number;
  lineHeight: number;
}

/// 阅读设置
export interface ReadingSettings {
  font: FontSettings;
  maxWidth: number;
  pageMargin: number;
  showStatusBar: boolean;
}

/// 应用设置
export interface AppSettings {
  theme: Theme;
  mode: AppMode;
  reading: ReadingSettings;
  sidebarWidth: number;
  splitRatio: number; // 编辑模式下左右分屏比例（0-1）
  syncScroll: boolean; // 编辑模式下源码与预览同步滚动
}
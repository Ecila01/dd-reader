/// 全局状态管理（Zustand）
import { create } from 'zustand';
import type { AppMode, Theme, Tab, ParsedDocument, AppSettings, FileEntry } from '../types';

interface AppState {
  // 应用模式
  mode: AppMode;
  setMode: (mode: AppMode) => void;

  // 主题
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // 标签页管理
  tabs: Tab[];
  activeTabId: string | null;
  addTab: (tab: Tab) => void;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTabContent: (id: string, content: string) => void;
  markTabClean: (id: string) => void;

  // 当前文档解析结果
  parsedDocument: ParsedDocument | null;
  setParsedDocument: (doc: ParsedDocument | null) => void;

  // 标签页解析缓存（每个标签页独立缓存解析结果）
  tabParsedDocs: Record<string, ParsedDocument>;
  setTabParsedDoc: (tabId: string, doc: ParsedDocument | null) => void;

  // 侧边栏
  sidebarVisible: boolean;
  toggleSidebar: () => void;
  setSidebarVisible: (visible: boolean) => void;

  // 设置面板
  settingsPanelVisible: boolean;
  toggleSettingsPanel: () => void;
  setSettingsPanelVisible: (visible: boolean) => void;

  // 分屏比例
  splitRatio: number;
  setSplitRatio: (ratio: number) => void;

  // 设置
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;

  // 工作区（文件树）
  workspacePath: string | null;
  fileTree: FileEntry[];
  setWorkspace: (path: string | null, files: FileEntry[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  mode: 'reading',
  setMode: (mode) => set({ mode }),

  theme: 'light',
  setTheme: (theme) => set({ theme }),

  tabs: [],
  activeTabId: null,
  addTab: (tab) =>
    set((state) => ({
      tabs: [...state.tabs, tab],
      activeTabId: tab.id,
    })),
  removeTab: (id) =>
    set((state) => {
      const newTabs = state.tabs.filter((t) => t.id !== id);
      // 清理该标签页的解析缓存
      const { [id]: _, ...restDocs } = state.tabParsedDocs;
      const newActiveId =
        state.activeTabId === id
          ? newTabs.length > 0
            ? newTabs[newTabs.length - 1].id
            : null
          : state.activeTabId;
      // 切换到新标签页时同步解析结果
      const newDoc = newActiveId ? (restDocs[newActiveId] ?? null) : null;
      return { tabs: newTabs, activeTabId: newActiveId, tabParsedDocs: restDocs, parsedDocument: newDoc };
    }),
  setActiveTab: (id) =>
    set((state) => {
      const doc = state.tabParsedDocs[id] ?? null;
      return { activeTabId: id, parsedDocument: doc };
    }),
  updateTabContent: (id, content) =>
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === id ? { ...t, content, isDirty: true } : t
      ),
    })),
  markTabClean: (id) =>
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === id ? { ...t, isDirty: false } : t
      ),
    })),

  parsedDocument: null,
  setParsedDocument: (doc) => set({ parsedDocument: doc }),

  tabParsedDocs: {},
  setTabParsedDoc: (tabId, doc) =>
    set((state) => {
      if (doc === null) {
        const { [tabId]: _, ...rest } = state.tabParsedDocs;
        return { tabParsedDocs: rest };
      }
      return { tabParsedDocs: { ...state.tabParsedDocs, [tabId]: doc } };
    }),

  sidebarVisible: false,
  toggleSidebar: () => set((s) => ({ sidebarVisible: !s.sidebarVisible })),
  setSidebarVisible: (visible) => set({ sidebarVisible: visible }),

  settingsPanelVisible: false,
  toggleSettingsPanel: () => set((s) => ({ settingsPanelVisible: !s.settingsPanelVisible })),
  setSettingsPanelVisible: (visible) => set({ settingsPanelVisible: visible }),

  splitRatio: 0.5,
  setSplitRatio: (ratio) => set({ splitRatio: ratio }),

  settings: {
    theme: 'light',
    mode: 'reading',
    reading: {
      font: {
        cjk: '"Noto Serif CJK SC", "Source Han Serif SC", serif',
        latin: '"Latin Modern Roman", "Times New Roman", serif',
        mono: '"Cascadia Code", "Fira Code", monospace',
        fontSize: 16,
        lineHeight: 1.8,
      },
      maxWidth: 0,
      pageMargin: 48,
      showStatusBar: true,
    },
    sidebarWidth: 240,
    splitRatio: 0.5,
    syncScroll: false,
  },
  updateSettings: (partial) =>
    set((state) => ({
      settings: { ...state.settings, ...partial },
    })),

  workspacePath: null,
  fileTree: [],
  setWorkspace: (path, files) => set({ workspacePath: path, fileTree: files }),
}));
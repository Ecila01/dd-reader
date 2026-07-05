/// 会话持久化：保存/恢复标签页、模式、设置（启动秒开，不阻塞 UI）
import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../store';

interface SessionData {
  tabs: Array<{ id: string; path: string; name: string; isDirty: boolean }>;
  activeTabId: string | null;
  mode: string;
  theme: string;
  settings: Record<string, unknown>;
  sidebarVisible: boolean;
  workspacePath: string | null;
}

export function useSession() {
  const saveSession = useCallback(async () => {
    const state = useAppStore.getState();
    const data: SessionData = {
      tabs: state.tabs.map((t) => ({
        id: t.id,
        path: t.path,
        name: t.name,
        isDirty: t.isDirty,
      })),
      activeTabId: state.activeTabId,
      mode: state.mode,
      theme: state.theme,
      settings: state.settings as unknown as Record<string, unknown>,
      sidebarVisible: state.sidebarVisible,
      workspacePath: state.workspacePath,
    };
    try {
      await invoke('save_session', { data: JSON.stringify(data) });
    } catch {}
  }, []);

  /// 启动时恢复：仅创建标签页占位符，不加载文件/不恢复工作区
  const restoreSession = useCallback(async () => {
    try {
      const raw = await invoke<string>('load_session');
      if (!raw) return;

      const data: SessionData = JSON.parse(raw);
      if (!data.tabs || data.tabs.length === 0) return;

      const store = useAppStore.getState();

      // 恢复设置（同步操作，无 IPC）
      if (data.settings) {
        store.updateSettings(data.settings as Parameters<typeof store.updateSettings>[0]);
      }
      if (data.theme) store.setTheme(data.theme as 'light' | 'dark');
      if (data.mode) store.setMode(data.mode as 'reading' | 'editing');
      if (data.sidebarVisible !== undefined) store.setSidebarVisible(data.sidebarVisible);

      // 恢复标签页（仅占位符，不读文件）
      let restoredCount = 0;
      for (const tab of data.tabs) {
        if (restoredCount >= 10) break;
        if (!tab.path) continue;

        store.addTab({
          id: tab.id,
          path: tab.path,
          name: tab.name,
          content: '',      // 空内容 → 点击后懒加载
          isDirty: false,
        });
        restoredCount++;
      }

      if (data.activeTabId && restoredCount > 0) {
        store.setActiveTab(data.activeTabId);
      }
    } catch {
      // 会话文件损坏，忽略
    }
  }, []);

  return { saveSession, restoreSession };
}
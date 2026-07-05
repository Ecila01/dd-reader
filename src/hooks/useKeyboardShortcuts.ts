/// 键盘快捷键 hooks
import { useEffect, useCallback } from 'react';
import { useAppStore } from '../store';
import { useOpenFile } from './useOpenFile';
import { useWorkspace } from './useWorkspace';

export function useKeyboardShortcuts() {
  const setMode = useAppStore((s) => s.setMode);
  const mode = useAppStore((s) => s.mode);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const addTab = useAppStore((s) => s.addTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const { openFile } = useOpenFile();
  const { openFolder } = useWorkspace();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      // Ctrl+E: 切换阅读/编辑模式
      if (ctrl && e.key === 'e') {
        e.preventDefault();
        setMode(mode === 'reading' ? 'editing' : 'reading');
        return;
      }

      // Ctrl+O: 打开文件
      if (ctrl && e.key === 'o' && !e.shiftKey) {
        e.preventDefault();
        openFile();
        return;
      }

      // Ctrl+Shift+O: 打开文件夹
      if (ctrl && e.key === 'O') {
        e.preventDefault();
        openFolder();
        return;
      }

      // Ctrl+B: 切换侧边栏
      if (ctrl && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Ctrl+N: 新建标签页
      if (ctrl && e.key === 'n') {
        e.preventDefault();
        const tabId = `tab_${Date.now()}`;
        addTab({
          id: tabId,
          path: '',
          name: '未命名',
          content: '',
          isDirty: false,
        });
        setActiveTab(tabId);
        return;
      }
    },
    [mode, setMode, toggleSidebar, openFile, openFolder, addTab, setActiveTab]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
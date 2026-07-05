/// 工作区 Hook：文件夹管理 + 文件监听 + 文件树交互
import { useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-dialog';
import { useAppStore } from '../store';
import type { FileEntry, ParsedDocument } from '../types';

export function useWorkspace() {
  const workspacePath = useAppStore((s) => s.workspacePath);
  const setWorkspace = useAppStore((s) => s.setWorkspace);
  const addTab = useAppStore((s) => s.addTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const setParsedDocument = useAppStore((s) => s.setParsedDocument);
  const setTabParsedDoc = useAppStore((s) => s.setTabParsedDoc);

  // 刷新文件树
  const refreshFileTree = useCallback(async () => {
    const path = useAppStore.getState().workspacePath;
    if (!path) return;
    try {
      const files = await invoke<FileEntry[]>('open_folder', { path });
      useAppStore.getState().setWorkspace(path, files);
    } catch (err) {
      console.error('刷新文件树失败:', err);
    }
  }, []);

  // 监听 fs-change 事件
  useEffect(() => {
    let unlistenFn: (() => void) | undefined;
    listen('fs-change', () => {
      refreshFileTree();
    }).then((fn) => {
      unlistenFn = fn;
    });
    return () => {
      unlistenFn?.();
    };
  }, [refreshFileTree]);

  // 打开文件夹选择对话框
  const openFolder = useCallback(async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: '选择工作区文件夹',
      });
      if (!selected) return;

      const folderPath = selected as string;
      const files = await invoke<FileEntry[]>('open_folder', { path: folderPath });
      setWorkspace(folderPath, files);

      await invoke('watch_folder', { path: folderPath });
    } catch (err) {
      console.error('打开文件夹失败:', err);
    }
  }, [setWorkspace]);

  // 从文件树中点击打开文件（先显示标签页，后台解析）
  const openFileFromTree = useCallback(
    async (filePath: string) => {
      try {
        const content = await invoke<string>('open_file', { path: filePath });
        const fileName = filePath.split(/[/\\]/).pop() ?? '未命名';
        const tabId = `tab_${Date.now()}`;

        // 立即显示标签页
        addTab({
          id: tabId,
          path: filePath,
          name: fileName,
          content,
          isDirty: false,
        });
        setActiveTab(tabId);

        // 后台异步解析
        invoke<ParsedDocument>('parse_markdown', { content })
          .then((parsed) => {
            setTabParsedDoc(tabId, parsed);
            setParsedDocument(parsed);
          })
          .catch((err) => console.error('解析失败:', err));
      } catch (err) {
        console.error('打开文件失败:', err);
      }
    },
    [addTab, setActiveTab, setParsedDocument, setTabParsedDoc]
  );

  return { workspacePath, openFolder, openFileFromTree, refreshFileTree };
}
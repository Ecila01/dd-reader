/// 打开文件并解析 Hook
import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { useAppStore } from '../store';
import type { ParsedDocument } from '../types';

export function useOpenFile() {
  const addTab = useAppStore((s) => s.addTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const setParsedDocument = useAppStore((s) => s.setParsedDocument);
  const setTabParsedDoc = useAppStore((s) => s.setTabParsedDoc);
  const updateTabContent = useAppStore((s) => s.updateTabContent);

  /// 内部共享：通过路径打开文件（标签页立即显示，解析异步进行）
  const openFileByPath = useCallback(
    async (filePath: string) => {
      try {
        const content = await invoke<string>('open_file', { path: filePath });
        const fileName = filePath.split(/[/\\]/).pop() ?? '未命名';
        const tabId = `tab_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

        // 立即显示标签页，不等待解析
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

  /// 对话框选择文件打开
  const openFile = useCallback(async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: 'Markdown',
            extensions: ['md', 'markdown', 'txt'],
          },
        ],
      });

      if (!selected) return;
      await openFileByPath(selected as string);
    } catch (err) {
      console.error('打开文件失败:', err);
    }
  }, [openFileByPath]);

  /// 懒加载标签页内容（用于会话恢复）
  const loadTabContent = useCallback(
    async (tabId: string, filePath: string) => {
      try {
        const content = await invoke<string>('open_file', { path: filePath });
        updateTabContent(tabId, content);

        // 后台异步解析
        invoke<ParsedDocument>('parse_markdown', { content })
          .then((parsed) => {
            setTabParsedDoc(tabId, parsed);
            const store = useAppStore.getState();
            if (store.activeTabId === tabId) {
              setParsedDocument(parsed);
            }
          })
          .catch(() => {});
      } catch (err) {
        console.error('加载标签页内容失败:', err);
      }
    },
    [updateTabContent, setTabParsedDoc, setParsedDocument]
  );

  return { openFile, openFileByPath, loadTabContent };
}
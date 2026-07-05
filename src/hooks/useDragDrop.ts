/// 拖拽文件/文件夹到窗口直接打开
import { useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { useAppStore } from '../store';
import { useOpenFile } from './useOpenFile';

interface DragDropPayload {
  type: 'enter' | 'over' | 'drop' | 'leave';
  paths: string[];
  position: { x: number; y: number };
}

function isMarkdownFile(filePath: string): boolean {
  const ext = filePath.split('.').pop()?.toLowerCase();
  return ext === 'md' || ext === 'markdown' || ext === 'txt';
}

export function useDragDrop() {
  const processingRef = useRef(false);
  const { openFileByPath } = useOpenFile();

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const w = getCurrentWebviewWindow();
    w.onDragDropEvent((event) => {
      const payload = event.payload as DragDropPayload;

      if (payload.type !== 'drop') return;
      if (!payload.paths || payload.paths.length === 0) return;
      if (processingRef.current) return;
      processingRef.current = true;

      const store = useAppStore.getState();

      (async () => {
        try {
          for (const filePath of payload.paths) {
            if (isMarkdownFile(filePath)) {
              await openFileByPath(filePath);
            } else {
              // 尝试作为文件夹打开
              try {
                const files = await invoke<{ name: string; path: string; is_dir: boolean }[]>(
                  'open_folder',
                  { path: filePath }
                );
                store.setWorkspace(filePath, files);
                store.setSidebarVisible(true);
                invoke('watch_folder', { path: filePath }).catch(() => {});
              } catch {
                console.error('无法打开:', filePath);
              }
            }
          }
        } finally {
          processingRef.current = false;
        }
      })();
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      unlisten?.();
    };
  }, [openFileByPath]);
}
/// 主应用组件：集成所有 hooks 和布局
import { useEffect } from 'react';
import { useAppStore } from './store';
import { Layout } from './components/Layout';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useDragDrop } from './hooks/useDragDrop';
import { useZoom } from './hooks/useZoom';
import { useSession } from './hooks/useSession';

export default function App() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  useKeyboardShortcuts();
  useDragDrop();
  useZoom();
  const { saveSession, restoreSession } = useSession();

  // 启动时 fire-and-forget 恢复会话（不阻塞 UI）
  useEffect(() => {
    restoreSession();
  }, []);

  // 监听系统主题变化
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light');
    };
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [setTheme]);

  // 关闭前保存会话
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveSession();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveSession]);

  return (
    <div className={`app ${theme}`} data-theme={theme}>
      <Layout />
    </div>
  );
}
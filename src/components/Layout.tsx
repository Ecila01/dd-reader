/// 主布局组件：标题栏 + 标签栏 + 内容区 + 状态栏
import { useAppStore } from '../store';
import { TitleBar } from './TitleBar';
import { TabBar } from './TabBar';
import { Sidebar } from './Sidebar';
import { Reader } from './Reader';
import { Editor } from './Editor';
import { StatusBar } from './StatusBar';
import styles from './Layout.module.css';

export function Layout() {
  const mode = useAppStore((s) => s.mode);
  const sidebarVisible = useAppStore((s) => s.sidebarVisible);
  const theme = useAppStore((s) => s.theme);

  return (
    <div className={`${styles.layout} ${styles[theme]}`}>
      <TitleBar />
      <TabBar />
      <div className={styles.main}>
        {sidebarVisible && <Sidebar />}
        <div className={styles.content}>
          {mode === 'reading' ? <Reader /> : <Editor />}
        </div>
      </div>
      <StatusBar />
    </div>
  );
}
/// 标题栏：文件名 + 模式切换按钮 + 设置入口
import { useAppStore } from '../store';
import type { AppMode } from '../types';
import styles from './TitleBar.module.css';

export function TitleBar() {
  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);
  const activeTab = useAppStore((s) => s.tabs.find((t) => t.id === s.activeTabId));
  const sidebarVisible = useAppStore((s) => s.sidebarVisible);
  const setSidebarVisible = useAppStore((s) => s.setSidebarVisible);
  const settingsPanelVisible = useAppStore((s) => s.settingsPanelVisible);
  const toggleSettingsPanel = useAppStore((s) => s.toggleSettingsPanel);

  const handleModeSwitch = (newMode: AppMode) => {
    setMode(newMode);
  };

  const handleSettingsClick = () => {
    // 如果侧边栏关闭，先打开侧边栏
    if (!sidebarVisible) {
      setSidebarVisible(true);
    }
    toggleSettingsPanel();
  };

  return (
    <div className={styles.titleBar}>
      <div className={styles.left}>
        <span className={styles.icon}>📄</span>
        <span className={styles.filename}>
          {activeTab?.name ?? 'DD Reader'}
        </span>
      </div>
      <div className={styles.modeSwitcher}>
        <button
          className={`${styles.modeBtn} ${mode === 'reading' ? styles.active : ''}`}
          onClick={() => handleModeSwitch('reading')}
          title="阅读模式"
        >
          👁 阅读
        </button>
        <button
          className={`${styles.modeBtn} ${mode === 'editing' ? styles.active : ''}`}
          onClick={() => handleModeSwitch('editing')}
          title="编辑模式"
        >
          ✏️ 编辑
        </button>
        <button
          className={`${styles.modeBtn} ${settingsPanelVisible ? styles.active : ''}`}
          onClick={handleSettingsClick}
          title="设置"
        >
          ⚙️ 设置
        </button>
      </div>
    </div>
  );
}
/// 侧边栏：文件树 + 设置面板
import { useAppStore } from '../store';
import { useWorkspace } from '../hooks/useWorkspace';
import { Settings } from './Settings';
import styles from './Sidebar.module.css';

export function Sidebar() {
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const fileTree = useAppStore((s) => s.fileTree);
  const workspacePath = useAppStore((s) => s.workspacePath);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const settingsPanelVisible = useAppStore((s) => s.settingsPanelVisible);
  const toggleSettingsPanel = useAppStore((s) => s.toggleSettingsPanel);
  const { openFolder, openFileFromTree } = useWorkspace();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <span className={styles.title}>工作区</span>
        <button className={styles.collapseBtn} onClick={toggleSidebar} title="收起侧边栏">
          «
        </button>
      </div>
      <div className={styles.tree}>
        {workspacePath ? (
          <>
            <div className={styles.workspacePath} title={workspacePath}>
              {workspacePath.split(/[/\\]/).pop()}
            </div>
            {fileTree.length === 0 ? (
              <div className={styles.emptyHint}>文件夹为空</div>
            ) : (
              fileTree.map((entry) => (
                <div
                  key={entry.path}
                  className={`${styles.treeItem} ${entry.is_dir ? styles.dirItem : styles.fileItem}`}
                  onClick={() => {
                    if (!entry.is_dir) {
                      openFileFromTree(entry.path);
                    }
                  }}
                  title={entry.path}
                >
                  <span className={styles.itemIcon}>
                    {entry.is_dir ? '📁' : '📄'}
                  </span>
                  <span className={styles.itemName}>{entry.name}</span>
                </div>
              ))
            )}
          </>
        ) : (
          <div className={styles.emptyHint}>
            <button className={styles.openFolderBtn} onClick={openFolder}>
              📂 打开文件夹
            </button>
            <div className={styles.hintText}>打开文件夹以浏览文件</div>
          </div>
        )}
      </div>

      {/* 设置面板 — 由 TitleBar 的设置按钮控制 */}
      {settingsPanelVisible && <Settings />}

      <div className={styles.footer}>
        <button className={styles.footerBtn} onClick={openFolder} title="打开文件夹">
          📂
        </button>
        <button
          className={`${styles.footerBtn} ${settingsPanelVisible ? styles.footerBtnActive : ''}`}
          onClick={toggleSettingsPanel}
          title="设置"
        >
          ⚙️
        </button>
        <button className={styles.footerBtn} onClick={toggleTheme} title={theme === 'light' ? '切换深色主题' : '切换浅色主题'}>
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
    </div>
  );
}
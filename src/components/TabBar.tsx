/// 标签栏：多标签页切换 + 历史标签页懒加载
import { useAppStore } from '../store';
import { useOpenFile } from '../hooks/useOpenFile';
import styles from './TabBar.module.css';

export function TabBar() {
  const tabs = useAppStore((s) => s.tabs);
  const activeTabId = useAppStore((s) => s.activeTabId);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const removeTab = useAppStore((s) => s.removeTab);
  const { loadTabContent } = useOpenFile();

  if (tabs.length === 0) return null;

  const handleTabClick = (tab: typeof tabs[0]) => {
    setActiveTab(tab.id);
    // 历史标签页：内容未加载时，点击后才加载
    if (!tab.content && tab.path) {
      loadTabContent(tab.id, tab.path);
    }
  };

  return (
    <div className={styles.tabBar}>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`${styles.tab} ${tab.id === activeTabId ? styles.active : ''}`}
          onClick={() => handleTabClick(tab)}
        >
          <span className={styles.tabName}>
            {tab.isDirty ? '● ' : ''}{tab.content ? '📄' : '💤'} {tab.name}
          </span>
          <button
            className={styles.closeBtn}
            onClick={(e) => {
              e.stopPropagation();
              removeTab(tab.id);
            }}
            title="关闭"
          >
            ×
          </button>
        </div>
      ))}
      <div className={styles.tabSpacer} />
    </div>
  );
}
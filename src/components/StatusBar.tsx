/// 底部状态栏
import { useAppStore } from '../store';
import styles from './StatusBar.module.css';

export function StatusBar() {
  const parsedDocument = useAppStore((s) => s.parsedDocument);
  const mode = useAppStore((s) => s.mode);
  const activeTab = useAppStore((s) => s.tabs.find((t) => t.id === s.activeTabId));
  const settings = useAppStore((s) => s.settings);

  const meta = parsedDocument?.metadata;
  const kpCount = parsedDocument?.line_breaks.length ?? 0;

  return (
    <div className={styles.statusBar}>
      <div className={styles.left}>
        {mode === 'editing' && (
          <span>行: —, 列: —</span>
        )}
        {meta && (
          <>
            <span>字数: {meta.word_count.toLocaleString()}</span>
            <span>字符: {meta.char_count.toLocaleString()}</span>
          </>
        )}
      </div>
      <div className={styles.right}>
        {kpCount > 0 && (
          <span>K-P 段落: {kpCount}</span>
        )}
        <span>
          {settings.reading.font.cjk.includes('Serif') ? '衬线' : '无衬线'}
        </span>
        {activeTab && (
          <span>{activeTab.isDirty ? '● 未保存' : '已保存'}</span>
        )}
      </div>
    </div>
  );
}
/// 编辑模式：左侧 CodeMirror 6 编辑器 + 右侧预览（分屏）
import { useRef, useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../store';
import { CodeMirrorEditor } from './CodeMirrorEditor';
import { useKaTeX } from '../hooks/useKaTeX';
import type { ParsedDocument } from '../types';
import styles from './Editor.module.css';

export function Editor() {
  const activeTab = useAppStore((s) => s.tabs.find((t) => t.id === s.activeTabId));
  const updateTabContent = useAppStore((s) => s.updateTabContent);
  const parsedDocument = useAppStore((s) => s.parsedDocument);
  const setParsedDocument = useAppStore((s) => s.setParsedDocument);
  const setTabParsedDoc = useAppStore((s) => s.setTabParsedDoc);
  const splitRatio = useAppStore((s) => s.splitRatio);
  const setSplitRatio = useAppStore((s) => s.setSplitRatio);
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const theme = useAppStore((s) => s.theme);

  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 同步滚动相关
  const editorScrollApi = useRef<{
    scrollTo: (pct: number) => void;
    getScrollPercent: () => number;
    getScrollDOM: () => HTMLElement;
  } | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const syncLockRef = useRef(false); // 防止滚动事件互相触发死循环

  // 实时解析预览（debounce 300ms），解析结果缓存到标签页
  const parseContent = useCallback(
    async (content: string, tabId: string) => {
      try {
        const parsed = await invoke<ParsedDocument>('parse_markdown', { content });
        setParsedDocument(parsed);
        setTabParsedDoc(tabId, parsed);
      } catch {
        // 解析失败时保持旧预览
      }
    },
    [setParsedDocument, setTabParsedDoc]
  );

  const handleChange = useCallback(
    (value: string) => {
      if (!activeTab) return;
      updateTabContent(activeTab.id, value);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        parseContent(value, activeTab.id);
      }, 300);
    },
    [activeTab, updateTabContent, parseContent]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // 处理分隔线拖拽
  const handleMouseDown = useCallback(() => setIsDragging(true), []);
  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      setSplitRatio(Math.max(0.2, Math.min(0.8, ratio)));
    },
    [isDragging, setSplitRatio]
  );

  const kpCount = parsedDocument?.line_breaks.length ?? 0;
  const renderedHtml = useKaTeX(parsedDocument?.html ?? '');
  const syncScroll = settings.syncScroll;

  // 同步滚动：监听编辑器滚动 → 预览跟随
  // 监听预览滚动 → 编辑器跟随
  useEffect(() => {
    if (!syncScroll) return;

    const editorApi = editorScrollApi.current;
    const preview = previewRef.current;
    if (!editorApi || !preview) return;

    const editorDOM = editorApi.getScrollDOM();

    const onEditorScroll = () => {
      if (syncLockRef.current) return;
      syncLockRef.current = true;
      const pct = editorApi.getScrollPercent();
      preview.scrollTop = pct * Math.max(0, preview.scrollHeight - preview.clientHeight);
      requestAnimationFrame(() => { syncLockRef.current = false; });
    };

    const onPreviewScroll = () => {
      if (syncLockRef.current) return;
      syncLockRef.current = true;
      const max = preview.scrollHeight - preview.clientHeight;
      const pct = max > 0 ? preview.scrollTop / max : 0;
      editorApi.scrollTo(pct);
      requestAnimationFrame(() => { syncLockRef.current = false; });
    };

    editorDOM.addEventListener('scroll', onEditorScroll, { passive: true });
    preview.addEventListener('scroll', onPreviewScroll, { passive: true });

    return () => {
      editorDOM.removeEventListener('scroll', onEditorScroll);
      preview.removeEventListener('scroll', onPreviewScroll);
    };
  }, [syncScroll, renderedHtml]);

  // 编辑器就绪回调
  const handleEditorReady = useCallback(
    (api: { scrollTo: (pct: number) => void; getScrollPercent: () => number; getScrollDOM: () => HTMLElement }) => {
      editorScrollApi.current = api;
    },
    []
  );

  // 切换同步滚动
  const toggleSyncScroll = useCallback(() => {
    updateSettings({ syncScroll: !settings.syncScroll });
  }, [settings.syncScroll, updateSettings]);

  return (
    <div
      ref={containerRef}
      className={styles.editor}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 左侧编辑区 - CodeMirror 6 */}
      <div className={styles.pane} style={{ flex: splitRatio }}>
        <div className={styles.paneHeader}>
          <span className={styles.paneLabel}>✏️ 编辑</span>
          <div className={styles.paneActions}>
            <button
              className={`${styles.syncBtn} ${syncScroll ? styles.syncActive : ''}`}
              onClick={toggleSyncScroll}
              title={syncScroll ? '已启用同步滚动（点击关闭）' : '同步滚动已关闭（点击开启）'}
            >
              {syncScroll ? '🔗' : '🔓'}
            </button>
            <span className={styles.paneInfo}>Markdown</span>
          </div>
        </div>
        <CodeMirrorEditor
          content={activeTab?.content ?? ''}
          onChange={handleChange}
          theme={theme}
          onEditorReady={handleEditorReady}
        />
      </div>

      {/* 分隔线 */}
      <div
        className={`${styles.divider} ${isDragging ? styles.dividerActive : ''}`}
        onMouseDown={handleMouseDown}
      />

      {/* 右侧预览区 */}
      <div className={styles.pane} style={{ flex: 1 - splitRatio }}>
        <div className={styles.paneHeader}>
          <span className={styles.paneLabel}>👁 预览</span>
          <span className={styles.paneInfo}>
            {kpCount > 0 ? `K-P ${kpCount}段` : 'K-P 对齐'}
          </span>
        </div>
        <div className={styles.preview} ref={previewRef}>
          {parsedDocument ? (
            <div
              className={styles.previewContent}
              style={{
                fontFamily: settings.reading.font.cjk,
                fontSize: settings.reading.font.fontSize,
                lineHeight: settings.reading.font.lineHeight,
              }}
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          ) : (
            <div className={styles.previewEmpty}>
              输入 Markdown 内容以查看预览
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
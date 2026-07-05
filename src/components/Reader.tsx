/// 阅读器组件：Markdown 渲染视图 + K-P 断行 + KaTeX 公式
/// 单层 DOM 结构，匹配旧版快速渲染路径
import { useRef, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../store';
import { useKaTeX } from '../hooks/useKaTeX';
import type { ParsedDocument } from '../types';
import styles from './Reader.module.css';

export function Reader() {
  const parsedDocument = useAppStore((s) => s.parsedDocument);
  const activeTab = useAppStore((s) => s.tabs.find((t) => t.id === s.activeTabId));
  const setParsedDocument = useAppStore((s) => s.setParsedDocument);
  const reading = useAppStore((s) => s.settings.reading);
  const theme = useAppStore((s) => s.theme);
  const contentRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevWidthRef = useRef<number>(0);

  const renderedHtml = useKaTeX(parsedDocument?.html ?? '');

  // 应用 K-P 断行数据
  useEffect(() => {
    if (!parsedDocument || !contentRef.current) return;
    const paragraphs = contentRef.current.querySelectorAll('p');
    const lineBreaks = parsedDocument.line_breaks;
    lineBreaks.forEach((lb) => {
      if (lb.paragraph_index < paragraphs.length) {
        const p = paragraphs[lb.paragraph_index] as HTMLElement;
        if (lb.line_spacings.length > 0) {
          const avgRatio = lb.line_spacings.reduce((a, b) => a + b, 0) / lb.line_spacings.length;
          if (avgRatio > 1.0) {
            const extraSpacing = (avgRatio - 1.0) * 2;
            p.style.wordSpacing = `${extraSpacing.toFixed(2)}em`;
          }
        }
        if (lb.break_points.length > 0) {
          p.style.textAlign = 'justify';
          p.dataset.kpBreaks = lb.break_points.length.toString();
        }
      }
    });
  }, [parsedDocument, renderedHtml]);

  // 窗口大小变化时，用新行宽重新解析
  const handleResize = useCallback(
    (content: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        if (!contentRef.current) return;
        const textWidth = contentRef.current.clientWidth;
        if (Math.abs(textWidth - prevWidthRef.current) < 10) return;
        prevWidthRef.current = textWidth;
        try {
          const parsed = await invoke<ParsedDocument>('parse_markdown', {
            content,
            lineWidth: textWidth,
          });
          setParsedDocument(parsed);
        } catch {}
      }, 300);
    },
    [setParsedDocument]
  );

  useEffect(() => {
    if (!contentRef.current) return;
    const el = contentRef.current;
    const observer = new ResizeObserver(() => {
      const rawContent = activeTab?.content;
      if (rawContent) handleResize(rawContent);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [activeTab?.content, handleResize]);

  return (
    <div className={`${styles.reader} ${theme === 'dark' ? styles.darkReader : ''}`}>
      <div
        ref={contentRef}
        className={styles.content}
        style={{
          padding: `${reading.pageMargin}px`,
          maxWidth: reading.maxWidth > 0 ? reading.maxWidth : 'none',
          margin: '0 auto',
          fontFamily: reading.font.cjk,
          fontSize: reading.font.fontSize,
          lineHeight: reading.font.lineHeight,
        }}
      >
        {parsedDocument ? (
          <div
            className={styles.markdown}
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📖</div>
            <h2>欢迎使用 DD Reader</h2>
            <p>打开一个 Markdown 文件开始阅读</p>
            <p className={styles.hint}>
              使用 <kbd>Ctrl+O</kbd> 打开文件，或 <kbd>Ctrl+E</kbd> 切换到编辑模式
            </p>
            <p className={styles.hint}>
              也可将文件拖拽到窗口直接打开
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
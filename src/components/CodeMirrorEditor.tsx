/// CodeMirror 6 编辑器组件
/// 封装 CodeMirror 6，提供 Markdown 语法高亮和实时编辑
import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { oneDark } from '@codemirror/theme-one-dark';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';

interface CodeMirrorEditorProps {
  content: string;
  onChange: (content: string) => void;
  theme: 'light' | 'dark';
  /** 编辑器就绪后回调，传入滚动 API，供父组件做同步滚动 */
  onEditorReady?: (scrollApi: {
    scrollTo: (pct: number) => void;
    getScrollPercent: () => number;
    getScrollDOM: () => HTMLElement;
  }) => void;
}

export function CodeMirrorEditor({ content, onChange, theme, onEditorReady }: CodeMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const extensions = [
      lineNumbers(),
      highlightActiveLine(),
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      markdown({
        base: markdownLanguage,
        codeLanguages: languages,
      }),
      syntaxHighlighting(defaultHighlightStyle),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChange(update.state.doc.toString());
        }
      }),
    ];

    if (theme === 'dark') {
      extensions.push(oneDark);
    }

    const state = EditorState.create({
      doc: content,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    // 通知父组件编辑器已就绪，传递滚动 API
    if (onEditorReady) {
      onEditorReady({
        scrollTo: (pct: number) => {
          const dom = view.scrollDOM;
          dom.scrollTop = pct * Math.max(0, dom.scrollHeight - dom.clientHeight);
        },
        getScrollPercent: () => {
          const dom = view.scrollDOM;
          const max = dom.scrollHeight - dom.clientHeight;
          return max > 0 ? dom.scrollTop / max : 0;
        },
        getScrollDOM: () => view.scrollDOM,
      });
    }

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 当外部内容变化时更新编辑器（如切换标签页）
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentContent = view.state.doc.toString();
    if (content !== currentContent) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentContent.length,
          insert: content,
        },
      });
    }
  }, [content]);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        overflow: 'auto',
        fontSize: '13px',
        fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
      }}
    />
  );
}
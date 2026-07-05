/// KaTeX 数学公式渲染 Hook
/// 在 HTML 中查找 LaTeX 数学公式并渲染为 KaTeX HTML
import { useMemo } from 'react';
import katex from 'katex';

/**
 * 使用 KaTeX 渲染 HTML 中的数学公式
 * 支持 $...$ 行内公式和 $$...$$ 块级公式
 */
export function useKaTeX(html: string): string {
  return useMemo(() => {
    return renderMathInHtml(html);
  }, [html]);
}

function renderMathInHtml(html: string): string {
  let result = html;

  // 1. 渲染块级公式 $$...$$
  result = result.replace(/<p>\s*\$\$\s*\n?([\s\S]*?)\$\$\s*<\/p>/g, (_match, formula) => {
    try {
      const rendered = katex.renderToString(formula.trim(), {
        displayMode: true,
        throwOnError: false,
        trust: true,
      });
      return `<div class="katex-display">${rendered}</div>`;
    } catch {
      return `<div class="katex-error">公式渲染失败</div>`;
    }
  });

  // 2. 渲染行内公式 $...$（不在 $$ 中的）
  result = result.replace(/(?<!\$)\$([^$\n]+?)\$(?!\$)/g, (_match, formula) => {
    try {
      return katex.renderToString(formula.trim(), {
        displayMode: false,
        throwOnError: false,
        trust: true,
      });
    } catch {
      return `<span class="katex-error">${formula}</span>`;
    }
  });

  return result;
}
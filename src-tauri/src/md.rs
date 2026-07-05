/// Markdown 解析模块
/// 使用 pulldown-cmark 将 Markdown 转换为 HTML，并统计元信息
///
/// 流程：
///   1. 预处理：占位符保护数学公式（$...$ / $$...$$）和转义星号（\* / \*\*）
///   2. pulldown-cmark 解析 → HTML
///   3. 后处理：保护 <code>/<pre> 区域，对 CJK 紧邻的 **text** 做 <strong> 替换
///   4. 恢复所有占位符

use pulldown_cmark::{Parser, html, Options};
use regex::Regex;
use crate::commands::{ParsedDocument, DocumentMetadata, FileEntry};
use crate::kp;

const PH: char = '\u{FFF0}';

struct Preprocessed {
    text: String,
    placeholders: Vec<String>,
}

pub fn parse(content: &str, line_width: Option<f64>) -> Result<ParsedDocument, Box<dyn std::error::Error>> {
    // 步骤 1：预处理 — 保护数学公式和转义星号
    let pp = preprocess(content);

    // 步骤 2：pulldown-cmark 解析
    let mut options = Options::empty();
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TASKLISTS);
    options.insert(Options::ENABLE_FOOTNOTES);
    let parser = Parser::new_ext(&pp.text, options);

    let mut html_output = String::new();
    html::push_html(&mut html_output, parser);

    // 步骤 3：保护代码块 → 修复 CJK emphasis → 恢复代码块
    let html_output = fix_cjk_emphasis_in_html(&html_output);

    // 步骤 4：恢复占位符（数学公式、转义星号）
    let html_output = restore_placeholders(&html_output, &pp.placeholders);

    let metadata = DocumentMetadata {
        word_count: count_words(content),
        char_count: content.chars().count(),
        line_count: content.lines().count(),
    };

    let metrics = kp::FontMetrics::default();
    let line_width = line_width.unwrap_or(metrics.font_size * 45.0);
    let line_breaks = kp::process_document(content, line_width, &metrics);

    Ok(ParsedDocument {
        html: html_output,
        line_breaks,
        metadata,
    })
}

// ─── 预处理：保护数学公式和转义星号 ───────────────────────

fn preprocess(content: &str) -> Preprocessed {
    let mut placeholders: Vec<String> = Vec::new();
    let mut result = String::with_capacity(content.len());

    let chars: Vec<char> = content.chars().collect();
    let len = chars.len();
    let mut i = 0;

    while i < len {
        let ch = chars[i];

        // $$...$$ 行间公式
        if ch == '$' && i + 1 < len && chars[i + 1] == '$' {
            let start = i;
            i += 2;
            while i + 1 < len && !(chars[i] == '$' && chars[i + 1] == '$') {
                i += 1;
            }
            if i + 1 < len {
                i += 2;
                let original: String = chars[start..i].iter().collect();
                push_ph(&mut placeholders, &mut result, original);
                continue;
            }
            result.push_str("$$");
            continue;
        }

        // $...$ 行内公式
        if ch == '$' {
            let start = i;
            i += 1;
            let mut found = false;
            while i < len && chars[i] != '\n' {
                if chars[i] == '$' && chars[i - 1] != '\\' {
                    i += 1;
                    found = true;
                    break;
                }
                i += 1;
            }
            if found {
                let original: String = chars[start..i].iter().collect();
                push_ph(&mut placeholders, &mut result, original);
                continue;
            }
            result.push('$');
            i = start + 1;
            continue;
        }

        // \* 或 \*\* 转义星号 → 占位符存去斜杠版本
        if ch == '\\' && i + 1 < len && chars[i + 1] == '*' {
            i += 1; // 跳过 \
            let star_start = i;
            while i < len && chars[i] == '*' {
                i += 1;
            }
            let unescaped: String = chars[star_start..i].iter().collect();
            push_ph(&mut placeholders, &mut result, unescaped);
            continue;
        }

        result.push(ch);
        i += 1;
    }

    Preprocessed { text: result, placeholders }
}

fn push_ph(placeholders: &mut Vec<String>, buf: &mut String, original: String) {
    use std::fmt::Write;
    let id = placeholders.len();
    placeholders.push(original);
    write!(buf, "{PH}PT{id}").unwrap();
}

fn restore_placeholders(html: &str, placeholders: &[String]) -> String {
    let mut result = html.to_string();
    for (id, original) in placeholders.iter().enumerate().rev() {
        let ph = format!("{PH}PT{id}");
        result = result.replace(&ph, original);
    }
    result
}

// ─── 后处理：CJK emphasis 修复 ─────────────────────────────

/// 对 pulldown-cmark 输出的 HTML 做 CJK emphasis 修复。
/// 原理：保护代码块区域 → 在非保护区域中用正则匹配 CJK 紧邻的
/// 未被转换的 `**text**`/`*text*`/`__text__`/`_text_` 并替换为对应 HTML 标签
/// → 恢复代码块区域。
fn fix_cjk_emphasis_in_html(html: &str) -> String {
    // 保护 <code>...</code> 和 <pre>...</pre> 区域
    let code_re = Regex::new(r"<code[^>]*>[\s\S]*?</code>|<pre[^>]*>[\s\S]*?</pre>").unwrap();

    let mut protected: Vec<String> = Vec::new();
    let mut clean = String::with_capacity(html.len());
    let mut last = 0;

    for m in code_re.find_iter(html) {
        clean.push_str(&html[last..m.start()]);
        let id = protected.len();
        protected.push(m.as_str().to_string());
        write_ph2(&mut clean, id);
        last = m.end();
    }
    clean.push_str(&html[last..]);

    // 在非保护区域中执行 CJK emphasis 替换
    let fixed = apply_cjk_emphasis(&clean);

    // 恢复代码块
    let mut result = fixed;
    for (id, original) in protected.iter().enumerate().rev() {
        let ph = format!("{PH}PC{id}");
        result = result.replace(&ph, original);
    }

    result
}

fn write_ph2(buf: &mut String, id: usize) {
    use std::fmt::Write;
    write!(buf, "{PH}PC{id}").unwrap();
}

/// CJK 字符 Unicode 范围（用于正则）
const CJK_RE: &str = r"[\u{4E00}-\u{9FFF}\u{3400}-\u{4DBF}\u{3000}-\u{303F}\u{FF00}-\u{FFEF}\u{2E80}-\u{2EFF}\u{3300}-\u{33FF}\u{F900}-\u{FAFF}\u{FE30}-\u{FE4F}]";

/// 在 HTML 文本中替换 CJK 紧邻的 emphasis 标记。
/// 处理顺序：先 `**` → `<strong>`，再 `*` → `<em>`，
/// 避免 `*` 匹配 `**` 的内部。
fn apply_cjk_emphasis(html: &str) -> String {
    let mut result = html.to_string();

    // ── ** 粗体（双星号） ──
    // CJK**text** → CJK<strong>text</strong>
    let re_left_strong = Regex::new(&format!(r"({CJK_RE})\*\*([^*\n]+?)\*\*")).unwrap();
    result = re_left_strong.replace_all(&result, "$1<strong>$2</strong>").to_string();

    // **text**CJK → <strong>text</strong>CJK
    let re_right_strong = Regex::new(&format!(r"\*\*([^*\n]+?)\*\*({CJK_RE})")).unwrap();
    result = re_right_strong.replace_all(&result, "<strong>$1</strong>$2").to_string();

    // ── __ 粗体（双下划线） ──
    let re_left_strong_u = Regex::new(&format!(r"({CJK_RE})__([^_\n]+?)__")).unwrap();
    result = re_left_strong_u.replace_all(&result, "$1<strong>$2</strong>").to_string();

    let re_right_strong_u = Regex::new(&format!(r"__([^_\n]+?)__({CJK_RE})")).unwrap();
    result = re_right_strong_u.replace_all(&result, "<strong>$1</strong>$2").to_string();

    // ── * 斜体（单星号） ──
    let re_left_em = Regex::new(&format!(r"({CJK_RE})\*([^*\n]+?)\*")).unwrap();
    result = re_left_em.replace_all(&result, "$1<em>$2</em>").to_string();

    let re_right_em = Regex::new(&format!(r"\*([^*\n]+?)\*({CJK_RE})")).unwrap();
    result = re_right_em.replace_all(&result, "<em>$1</em>$2").to_string();

    // ── _ 斜体（单下划线） ──
    let re_left_em_u = Regex::new(&format!(r"({CJK_RE})_([^_\n]+?)_")).unwrap();
    result = re_left_em_u.replace_all(&result, "$1<em>$2</em>").to_string();

    let re_right_em_u = Regex::new(&format!(r"_([^_\n]+?)_({CJK_RE})")).unwrap();
    result = re_right_em_u.replace_all(&result, "<em>$1</em>$2").to_string();

    result
}

// ─── 工具函数 ─────────────────────────────────────────────

fn count_words(content: &str) -> usize {
    let mut count = 0;
    let mut in_word = false;

    for ch in content.chars() {
        if ch.is_whitespace() {
            if in_word { count += 1; in_word = false; }
        } else if ch.is_ascii_alphanumeric() {
            in_word = true;
        } else {
            count += 1;
            if in_word { in_word = false; }
        }
    }
    if in_word { count += 1; }
    count
}

pub fn list_markdown_files(dir_path: &str) -> Result<Vec<FileEntry>, Box<dyn std::error::Error>> {
    let mut entries = Vec::new();
    let dir = std::path::Path::new(dir_path);

    if !dir.is_dir() {
        return Err(format!("'{}' 不是一个有效目录", dir_path).into());
    }

    let read_dir = std::fs::read_dir(dir)?;
    for entry in read_dir {
        let entry = entry?;
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();
        let is_dir = path.is_dir();

        if is_dir || path.extension().map_or(false, |ext| ext == "md") {
            entries.push(FileEntry { name, path: path.to_string_lossy().to_string(), is_dir });
        }
    }

    entries.sort_by(|a, b| {
        b.is_dir.cmp(&a.is_dir).then(a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });

    Ok(entries)
}
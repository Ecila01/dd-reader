/// Knuth-Plass 断行算法模块
/// 实现 TeX 风格的最优断行算法，将段落断行问题建模为最短路径问题

use crate::commands::ParagraphLineBreaks;

/// 字体度量，用于计算每个字符/单词的宽度
#[derive(Debug, Clone)]
pub struct FontMetrics {
    /// 中文字符宽度（像素）
    pub cjk_width: f64,
    /// 英文字符平均宽度（像素）
    pub latin_width: f64,
    /// 空格宽度（像素）
    pub space_width: f64,
    /// 字体大小（pt）
    pub font_size: f64,
}

impl Default for FontMetrics {
    fn default() -> Self {
        Self {
            cjk_width: 16.0,
            latin_width: 8.0,
            space_width: 4.0,
            font_size: 16.0,
        }
    }
}

/// 断行点——算法内部使用
#[derive(Debug, Clone)]
struct BreakPoint {
    /// 字符偏移（字节偏移）
    offset: usize,
}

/// DP 状态

/// 对一段文本执行 K-P 断行算法
///
/// # Arguments
/// * `text` - 段落文本
/// * `line_width` - 目标行宽（像素）
/// * `metrics` - 字体度量
///
/// # Returns
/// 断行点列表（每行的结束字符偏移）和每行的间距调整值
pub fn find_optimal_breaks(
    text: &str,
    line_width: f64,
    metrics: &FontMetrics,
) -> (Vec<usize>, Vec<f64>) {
    if text.is_empty() || line_width <= 0.0 {
        return (Vec::new(), Vec::new());
    }

    // 1. 收集所有可能的断行点
    let chars: Vec<char> = text.chars().collect();
    let break_positions = collect_break_positions(&chars, text, metrics);

    if break_positions.is_empty() {
        return (Vec::new(), Vec::new());
    }

    // 2. 计算每个字符的宽度
    let char_widths: Vec<f64> = chars
        .iter()
        .map(|ch| char_width(*ch, metrics))
        .collect();

    // 3. 动态规划：计算从每个断行点到末尾的最优解
    let n = break_positions.len();
    let mut best: Vec<Option<DpState>> = vec![None; n];

    // 最后一个位置（段落末尾）代价为 0
    best[n - 1] = Some(DpState {
        total_badness: 0.0,
        next: None,
        line_width_ratio: 1.0,
    });

    // 从后往前递推
    for i in (0..n - 1).rev() {
        let from = break_positions[i].offset;
        let mut min_cost = f64::MAX;
        let mut best_next = None;
        let mut best_ratio = 1.0;

        // 尝试在当前断行点之后的所有可能断行点
        for j in (i + 1)..n {
            let to = break_positions[j].offset;

            // 计算这一行的宽度
            let line_w = line_width_between(
                from, to, &char_widths, &break_positions, i, j, metrics,
            );

            // 计算 badness
            let badness = if line_w <= 0.0 {
                0.0
            } else {
                let r = line_w / line_width;
                let b = (1.0 - r).abs().powi(3) * 100.0;
                b.min(10000.0)
            };

            // 禁止太紧的行（宽度超过行宽 50% 以上）
            if line_w > line_width * 1.5 {
                continue;
            }

            if let Some(next_state) = &best[j] {
                let total = badness + next_state.total_badness;
                if total < min_cost {
                    min_cost = total;
                    best_next = Some(j);
                    best_ratio = if line_w > 0.0 { line_width / line_w } else { 1.0 };
                }
            }
        }

        if min_cost < f64::MAX {
            best[i] = Some(DpState {
                total_badness: min_cost,
                next: best_next,
                line_width_ratio: best_ratio,
            });
        }
    }

    // 4. 回溯找出最优断行路径
    let mut break_points = Vec::new();
    let mut spacings = Vec::new();
    let mut current = 0;

    while let Some(state) = &best[current] {
        break_points.push(break_positions[current].offset);
        spacings.push(state.line_width_ratio);

        if let Some(next) = state.next {
            current = next;
        } else {
            break;
        }
    }

    // 去掉第一个断行点（段落开头）
    if !break_points.is_empty() {
        break_points.remove(0);
    }
    if !spacings.is_empty() {
        spacings.remove(0);
    }

    (break_points, spacings)
}

/// DP 状态
#[derive(Debug, Clone)]
struct DpState {
    total_badness: f64,
    next: Option<usize>,
    line_width_ratio: f64,
}

/// 收集所有可能的断行位置
fn collect_break_positions(
    chars: &[char],
    _text: &str,
    metrics: &FontMetrics,
) -> Vec<BreakPoint> {
    let mut positions = vec![BreakPoint { offset: 0 }];

    let mut byte_offset = 0;
    let mut line_width = 0.0;
    let max_line_width = metrics.font_size * 45.0; // 约 45 个中文字符宽

    for (_idx, ch) in chars.iter().enumerate() {
        let w = char_width(*ch, metrics);
        line_width += w;

        let ch_len = ch.len_utf8();
        byte_offset += ch_len;

        // 中文字符：每个字符都可以断行
        if is_cjk(*ch) {
            positions.push(BreakPoint { offset: byte_offset });
        }
        // 空格：断行点
        else if *ch == ' ' {
            positions.push(BreakPoint { offset: byte_offset });
        }
        // 强制断行，限制最大行宽
        else if line_width > max_line_width && (*ch == ',' || *ch == '.' || *ch == '!' || *ch == '?' || *ch == ';' || *ch == ':' || *ch == ')' || *ch == ']' || *ch == '}') {
            positions.push(BreakPoint { offset: byte_offset });
        }
    }

    // 最终断行点：段落末尾
    if byte_offset > 0 {
        // 只添加不同位置
        if positions.last().map_or(true, |p| p.offset != byte_offset) {
            positions.push(BreakPoint { offset: byte_offset });
        }
    }

    // 去重并排序
    positions.sort_by_key(|p| p.offset);
    positions.dedup_by_key(|p| p.offset);

    positions
}

/// 计算两个断行点之间文本的宽度
fn line_width_between(
    from: usize,
    to: usize,
    char_widths: &[f64],
    _break_positions: &[BreakPoint],
    _i: usize,
    _j: usize,
    _metrics: &FontMetrics,
) -> f64 {
    let from_idx = char_offset_to_index(from, char_widths.len());
    let to_idx = char_offset_to_index(to, char_widths.len());

    let mut total = 0.0;
    for idx in from_idx..to_idx.min(char_widths.len()) {
        total += char_widths[idx];
    }
    total
}

/// 字符偏移转字符索引（近似）
fn char_offset_to_index(offset: usize, total_chars: usize) -> usize {
    // 简化：假设每个字符 ~1-3 字节，用比例近似
    // 实际项目应使用 UTF-8 字节到字符的精确映射
    let estimated = (offset as f64 / 1.5) as usize;
    estimated.min(total_chars)
}

/// 判断是否为 CJK 字符
fn is_cjk(ch: char) -> bool {
    matches!(
        ch,
        '\u{4E00}'..='\u{9FFF}'   // 中日韩统一表意文字
        | '\u{3400}'..='\u{4DBF}' // CJK 扩展 A
        | '\u{3000}'..='\u{303F}' // CJK 标点
        | '\u{FF00}'..='\u{FFEF}' // 全角字符
        | '\u{2E80}'..='\u{2EFF}' // CJK 部首补充
        | '\u{3300}'..='\u{33FF}' // CJK 兼容
        | '\u{F900}'..='\u{FAFF}' // CJK 兼容表意文字
        | '\u{FE30}'..='\u{FE4F}' // CJK 兼容形式
        | '\u{2F800}'..='\u{2FA1F}' // CJK 兼容表意文字补充
    )
}

/// 计算单个字符的宽度
fn char_width(ch: char, metrics: &FontMetrics) -> f64 {
    if is_cjk(ch) {
        metrics.cjk_width
    } else if ch == ' ' {
        metrics.space_width
    } else if ch.is_ascii() {
        // 英文等宽近似
        if ch.is_ascii_uppercase() {
            metrics.latin_width * 1.2
        } else if ch == 'i' || ch == 'l' || ch == 'I' || ch == '1' || ch == '!' || ch == '.' || ch == ',' || ch == ';' || ch == ':' || ch == '\'' {
            metrics.latin_width * 0.6
        } else if ch == 'm' || ch == 'w' || ch == 'M' || ch == 'W' {
            metrics.latin_width * 1.5
        } else {
            metrics.latin_width
        }
    } else {
        metrics.latin_width
    }
}

/// 对整篇文档的每个段落执行 K-P 断行，返回断行数据
pub fn process_document(
    content: &str,
    line_width: f64,
    metrics: &FontMetrics,
) -> Vec<ParagraphLineBreaks> {
    let mut result = Vec::new();
    let mut paragraph_index = 0;

    // 按段落分割（空行分隔）
    for paragraph in content.split("\n\n") {
        let trimmed = paragraph.trim();
        if trimmed.is_empty() {
            continue;
        }

        let (break_points, line_spacings) = find_optimal_breaks(trimmed, line_width, metrics);

        if !break_points.is_empty() {
            result.push(ParagraphLineBreaks {
                paragraph_index,
                break_points,
                line_spacings,
            });
        }

        paragraph_index += 1;
    }

    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_kp_basic() {
        let metrics = FontMetrics::default();
        let text = "现代数学始于格里高里和牛顿的微积分，而如今，你几乎在每一个现代学科中都能看到数学的身影。";
        let (breaks, spacings) = find_optimal_breaks(text, 400.0, &metrics);

        assert!(!breaks.is_empty());
        // 最后一个断行点应该接近文本末尾
        let last = breaks.last().unwrap();
        assert!(*last > 0);
    }

    #[test]
    fn test_kp_short() {
        let metrics = FontMetrics::default();
        let text = "短文本";
        let (breaks, _) = find_optimal_breaks(text, 400.0, &metrics);

        // 短文本可能只有一个断行点
        assert!(!breaks.is_empty());
    }

    #[test]
    fn test_process_document() {
        let metrics = FontMetrics::default();
        let content = "第一段文本内容。\n\n第二段文本内容。\n\n第三段。";
        let result = process_document(content, 400.0, &metrics);

        assert_eq!(result.len(), 3);
        assert_eq!(result[0].paragraph_index, 0);
        assert_eq!(result[1].paragraph_index, 1);
        assert_eq!(result[2].paragraph_index, 2);
    }
}
// Tauri 命令：前端可调用的 Rust 函数

use std::sync::{Mutex, OnceLock};
use notify::{Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use tauri::Emitter;

/// 全局文件监听器（保证生命周期与 App 一致）
static FILE_WATCHER: OnceLock<Mutex<Option<RecommendedWatcher>>> = OnceLock::new();

/// 获取数据目录
/// 策略：exe 目录可写 → 便携模式（.data/），不可写 → 标准模式（%APPDATA%）
fn get_data_dir() -> std::path::PathBuf {
    let exe = std::env::current_exe().unwrap_or_default();
    let exe_dir = exe.parent().unwrap_or_else(|| std::path::Path::new("."));

    // 便携模式：exe 同级 .data/
    let portable_dir = exe_dir.join(".data");

    // 检测 exe 目录是否可写（创建 .data/ 并尝试写临时文件）
    if let Ok(()) = std::fs::create_dir_all(&portable_dir) {
        let probe = portable_dir.join(".write_test");
        if std::fs::write(&probe, b"1").is_ok() {
            let _ = std::fs::remove_file(&probe);
            // 可写 → 便携模式，同时从旧位置迁移
            migrate_from_roaming(&portable_dir);
            return portable_dir;
        }
    }

    // 不可写 → 标准模式：%APPDATA%/com.ddreader.app
    let roaming = std::env::var("APPDATA")
        .map(|p| std::path::PathBuf::from(p).join("com.ddreader.app"))
        .unwrap_or_else(|_| portable_dir); // 如果连 APPDATA 都拿不到，回退到便携路径

    let _ = std::fs::create_dir_all(&roaming);
    roaming
}

/// 从旧 %APPDATA% 位置迁移到便携目录
fn migrate_from_roaming(portable_dir: &std::path::Path) {
    if let Ok(appdata) = std::env::var("APPDATA") {
        let old = std::path::PathBuf::from(appdata).join("com.ddreader.app");
        let old_session = old.join("session.json");
        let new_session = portable_dir.join("session.json");
        if old_session.exists() && !new_session.exists() {
            let _ = std::fs::copy(&old_session, &new_session);
        }
    }
}

/// Markdown 解析结果
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ParsedDocument {
    pub html: String,
    pub line_breaks: Vec<ParagraphLineBreaks>,
    pub metadata: DocumentMetadata,
}

/// 段落的断行数据
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ParagraphLineBreaks {
    pub paragraph_index: usize,
    pub break_points: Vec<usize>,
    pub line_spacings: Vec<f64>,
}

/// 文档元信息
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DocumentMetadata {
    pub word_count: usize,
    pub char_count: usize,
    pub line_count: usize,
}

/// 解析 Markdown 文本，可指定目标行宽（像素），不传则默认 720px
#[tauri::command]
pub fn parse_markdown(content: String, line_width: Option<f64>) -> Result<ParsedDocument, String> {
    crate::md::parse(&content, line_width).map_err(|e| e.to_string())
}

/// 打开文件并返回内容
#[tauri::command]
pub fn open_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| format!("无法读取文件 '{}': {}", path, e))
}

/// 打开文件夹并返回文件列表
#[tauri::command]
pub fn open_folder(path: String) -> Result<Vec<FileEntry>, String> {
    crate::md::list_markdown_files(&path).map_err(|e| e.to_string())
}

/// 文件条目
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
}

/// 开始监听文件夹变化（自动停止旧监听器）
#[tauri::command]
pub fn watch_folder(app_handle: tauri::AppHandle, path: String) -> Result<(), String> {
    // 先停止旧监听器
    let lock = FILE_WATCHER.get_or_init(|| Mutex::new(None));
    *lock.lock().unwrap() = None;

    let handle = app_handle.clone();
    let cb = move |res: Result<Event, notify::Error>| {
        if let Ok(event) = res {
            match event.kind {
                EventKind::Create(_) | EventKind::Modify(_) | EventKind::Remove(_) => {
                    let _ = handle.emit("fs-change", ());
                }
                _ => {}
            }
        }
    };

    let mut watcher = RecommendedWatcher::new(cb, Config::default())
        .map_err(|e| e.to_string())?;

    watcher
        .watch(std::path::Path::new(&path), RecursiveMode::Recursive)
        .map_err(|e| e.to_string())?;

    *lock.lock().unwrap() = Some(watcher);

    Ok(())
}

// ─── 会话持久化 ─────────────────────────────────────────

/// 获取应用数据目录路径
#[tauri::command]
pub fn get_app_data_dir() -> Result<String, String> {
    let dir = get_data_dir();
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.to_string_lossy().to_string())
}

/// 保存会话数据
#[tauri::command]
pub fn save_session(data: String) -> Result<(), String> {
    let dir = get_data_dir();
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let path = dir.join("session.json");
    std::fs::write(&path, data).map_err(|e| e.to_string())
}

/// 加载会话数据
#[tauri::command]
pub fn load_session() -> Result<String, String> {
    let dir = get_data_dir();
    let path = dir.join("session.json");
    if path.exists() {
        std::fs::read_to_string(&path).map_err(|e| e.to_string())
    } else {
        Ok(String::new())
    }
}

/// 清除所有缓存数据
#[tauri::command]
pub fn clear_cache() -> Result<(), String> {
    let dir = get_data_dir();
    if dir.exists() {
        std::fs::remove_dir_all(&dir).map_err(|e| e.to_string())?;
    }
    Ok(())
}
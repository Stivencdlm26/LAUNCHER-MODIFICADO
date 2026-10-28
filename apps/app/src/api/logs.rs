use crate::api::Result;
use std::io::{Read, Seek, SeekFrom};
use theseus::logs::LogType;
use theseus::logs::{self, CensoredString, LatestLogCursor, Logs};
use theseus::prelude::DirectoryInfo;

/*
A log is a struct containing the filename string, stdout, and stderr, as follows:

pub struct Logs {
    pub filename:  String,
    pub stdout: String,
    pub stderr: String,
}
*/

pub fn init<R: tauri::Runtime>() -> tauri::plugin::TauriPlugin<R> {
    tauri::plugin::Builder::new("logs")
        .js_init_script(include_str!("webview-logs.js"))
        .invoke_handler(tauri::generate_handler![
            logs_get_logs,
            logs_get_logs_by_filename,
            logs_get_output_by_filename,
            logs_delete_logs,
            logs_delete_logs_by_filename,
            logs_get_latest_log_cursor,
            logs_get_live_log_buffer,
            logs_clear_live_log_buffer,
            logs_log_webview,
            logs_get_launcher_log_tail,
        ])
        .build()
}

/// Read a bounded tail of the current launcher session log for the in-app diagnostics panel.
#[tauri::command]
pub fn logs_get_launcher_log_tail() -> Result<String> {
    let Some(directory_info) = DirectoryInfo::global_handle_if_ready() else {
        return Ok("Launcher state is not initialized yet.".to_owned());
    };
    let Some(logs_dir) = directory_info.launcher_logs_dir() else {
        return Ok("The launcher log directory is unavailable.".to_owned());
    };
    let entries = match std::fs::read_dir(logs_dir) {
        Ok(entries) => entries,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
            return Ok("No launcher session log exists yet.".to_owned());
        }
        Err(error) => return Err(error.into()),
    };

    let mut latest: Option<(std::time::SystemTime, std::path::PathBuf)> = None;
    for entry in entries {
        let entry = entry?;
        let path = entry.path();
        if !entry.file_type()?.is_file()
            || !path.file_name().and_then(|name| name.to_str()).is_some_and(
                |name| name.starts_with("session_") && name.ends_with(".log"),
            )
        {
            continue;
        }
        let modified = entry
            .metadata()?
            .modified()
            .unwrap_or(std::time::UNIX_EPOCH);
        if latest
            .as_ref()
            .is_none_or(|(latest_modified, _)| modified > *latest_modified)
        {
            latest = Some((modified, path));
        }
    }

    let Some((_, path)) = latest else {
        return Ok("No launcher session log exists yet.".to_owned());
    };
    const MAX_BYTES: u64 = 512 * 1024;
    let mut file = std::fs::File::open(path)?;
    let length = file.metadata()?.len();
    let start = length.saturating_sub(MAX_BYTES);
    file.seek(SeekFrom::Start(start))?;
    let mut bytes = Vec::with_capacity(length.saturating_sub(start) as usize);
    file.read_to_end(&mut bytes)?;
    let output = String::from_utf8_lossy(&bytes);
    let mut lines: Vec<&str> = output.lines().collect();
    if lines.len() > 800 {
        lines.drain(..lines.len() - 800);
    }
    Ok(lines.join("\n"))
}

#[tauri::command]
pub fn logs_log_webview<R: tauri::Runtime>(
    webview: tauri::Webview<R>,
    level: &str,
    message: &str,
) {
    let label = webview.label();
    match level {
        "trace" => {
            tracing::trace!(target: "webview", webview = label, "{message}")
        }
        "debug" => {
            tracing::debug!(target: "webview", webview = label, "{message}")
        }
        "warn" => {
            tracing::warn!(target: "webview", webview = label, "{message}")
        }
        "error" => {
            tracing::error!(target: "webview", webview = label, "{message}")
        }
        _ => tracing::info!(target: "webview", webview = label, "{message}"),
    }
}

/// Get all logs for an instance, sorted by filename.
#[tauri::command]
pub async fn logs_get_logs(
    instance_id: &str,
    clear_contents: Option<bool>,
) -> Result<Vec<Logs>> {
    let val = logs::get_logs(instance_id, clear_contents).await?;

    Ok(val)
}

/// Get a log struct for an instance by filename.
#[tauri::command]
pub async fn logs_get_logs_by_filename(
    instance_id: &str,
    log_type: LogType,
    filename: String,
) -> Result<Logs> {
    Ok(logs::get_logs_by_filename(instance_id, log_type, filename).await?)
}

/// Get the output for an instance by filename.
#[tauri::command]
pub async fn logs_get_output_by_filename(
    instance_id: &str,
    log_type: LogType,
    filename: String,
) -> Result<CensoredString> {
    Ok(logs::get_output_by_filename(instance_id, log_type, &filename).await?)
}

/// Delete all logs for an instance.
#[tauri::command]
pub async fn logs_delete_logs(instance_id: &str) -> Result<()> {
    Ok(logs::delete_logs(instance_id).await?)
}

/// Delete a log for an instance by filename.
#[tauri::command]
pub async fn logs_delete_logs_by_filename(
    instance_id: &str,
    log_type: LogType,
    filename: String,
) -> Result<()> {
    Ok(logs::delete_logs_by_filename(instance_id, log_type, &filename).await?)
}

/// Get live log from a cursor
#[tauri::command]
pub async fn logs_get_latest_log_cursor(
    instance_id: &str,
    cursor: u64, // 0 to start at beginning of file
) -> Result<LatestLogCursor> {
    Ok(logs::get_latest_log_cursor(instance_id, cursor).await?)
}

/// Get all buffered live log lines for an instance.
#[tauri::command]
pub async fn logs_get_live_log_buffer(
    instance_id: &str,
) -> Result<CensoredString> {
    Ok(logs::get_live_log_buffer(instance_id).await?)
}

/// Clear the live log buffer for an instance.
#[tauri::command]
pub async fn logs_clear_live_log_buffer(instance_id: &str) -> Result<()> {
    logs::clear_live_log_buffer(instance_id);
    Ok(())
}

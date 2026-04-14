#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::fs;
use std::path::Path;
use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
struct OllamaRequest {
    model: String,
    prompt: String,
    stream: bool,
}

#[derive(Deserialize)]
struct OllamaResponse {
    response: String,
}

#[derive(Serialize)]
struct ProcessResult {
    success: bool,
    category: String,
    message: String,
    new_path: String,
    is_script: bool,
}

#[derive(Serialize)]
struct FileInfo {
    name: String,
    path: String,
    size: u64,
    extension: String,
}

#[tauri::command]
async fn scan_directory(dir_path: String) -> Result<Vec<FileInfo>, String> {
    let path = Path::new(&dir_path);
    if !path.exists() || !path.is_dir() {
        return Err("Invalid directory".into());
    }

    let mut files = Vec::new();
    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries.flatten() {
            if let Ok(metadata) = entry.metadata() {
                if metadata.is_file() {
                    let file_name = entry.file_name().to_string_lossy().to_string();
                    let file_path = entry.path().to_string_lossy().to_string();
                    let size = metadata.len();
                    let extension = entry.path().extension().unwrap_or_default().to_string_lossy().to_string();
                    
                    files.push(FileInfo {
                        name: file_name,
                        path: file_path,
                        size,
                        extension,
                    });
                }
            }
        }
    }

    Ok(files)
}

#[tauri::command]
async fn analyze_and_move_file(file_path: String, target_dir: String) -> Result<ProcessResult, String> {
    let path = Path::new(&file_path);
    
    if !path.exists() {
        return Err("File not found".into());
    }

    let file_name = path.file_name().unwrap().to_str().unwrap();
    let ext = path.extension().unwrap_or_default().to_str().unwrap_or_default().to_lowercase();

    // 1. Security Check for Scripts
    let is_script = ext == "py" || ext == "ps1" || ext == "sh" || ext == "bat" || ext == "js";
    
    if is_script {
        // We pause and return to frontend for confirmation
        return Ok(ProcessResult {
            success: false,
            category: "script".to_string(),
            message: "Security risk detected. Awaiting confirmation.".to_string(),
            new_path: "".to_string(),
            is_script: true,
        });
    }

    // 2. Ask Local Ollama for Category
    let client = Client::new();
    let prompt = format!(
        "Determine the category for a file named '{}'. Reply with exactly ONE word from this list: Document, Image, Archive, Presentation, Spreadsheet, Other.", 
        file_name
    );
    
    let req_body = OllamaRequest {
        model: "llama3.2".to_string(), // You can change this to qwen2.5:3b or others
        prompt,
        stream: false,
    };

    // Send request to local Ollama instance
    let res = client.post("http://localhost:11434/api/generate")
        .json(&req_body)
        .send()
        .await;

    let category = match res {
        Ok(response) => {
            if let Ok(ollama_res) = response.json::<OllamaResponse>().await {
                let cat = ollama_res.response.trim().to_lowercase();
                // Clean up the response just in case LLM is chatty
                if cat.contains("document") { "document".to_string() }
                else if cat.contains("image") { "image".to_string() }
                else if cat.contains("archive") { "archive".to_string() }
                else if cat.contains("presentation") { "presentation".to_string() }
                else if cat.contains("spreadsheet") { "spreadsheet".to_string() }
                else { "other".to_string() }
            } else {
                "other".to_string()
            }
        },
        Err(_) => "other".to_string() // Fallback if Ollama is not running
    };

    // 3. Move the file
    let final_dir = format!("{}/{}", target_dir, category);
    fs::create_dir_all(&final_dir).map_err(|e| e.to_string())?;
    
    let new_path = format!("{}/{}", final_dir, file_name);
    if let Err(_) = fs::rename(path, &new_path) {
        // Fallback to copy and remove if rename fails (e.g. cross-device link)
        fs::copy(path, &new_path).map_err(|e| e.to_string())?;
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }

    Ok(ProcessResult {
        success: true,
        category,
        message: "Moved successfully".to_string(),
        new_path,
        is_script: false,
    })
}

#[tauri::command]
async fn force_move_script(file_path: String, target_dir: String) -> Result<ProcessResult, String> {
    let path = Path::new(&file_path);
    if !path.exists() {
        return Err("File not found".into());
    }
    let file_name = path.file_name().unwrap().to_str().unwrap();
    
    let final_dir = format!("{}/scripts", target_dir);
    fs::create_dir_all(&final_dir).map_err(|e| e.to_string())?;
    
    let new_path = format!("{}/{}", final_dir, file_name);
    if let Err(_) = fs::rename(path, &new_path) {
        fs::copy(path, &new_path).map_err(|e| e.to_string())?;
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }

    Ok(ProcessResult {
        success: true,
        category: "script".to_string(),
        message: "Script moved successfully".to_string(),
        new_path,
        is_script: true,
    })
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![scan_directory, analyze_and_move_file, force_move_script])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

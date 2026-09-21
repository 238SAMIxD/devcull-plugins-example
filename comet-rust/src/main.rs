use serde::Serialize;
use std::env;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Serialize)]
struct Response {
    reclaimed_bytes: u64,
    error: String,
}

#[derive(Serialize)]
struct EstimateResponse {
    reclaimable_bytes: u64,
    error: String,
}

#[derive(Serialize)]
struct InstalledResponse {
    installed: bool,
}

fn print_response(res: &Response) {
    println!("{}", serde_json::to_string(res).unwrap());
}

fn print_estimate_response(res: &EstimateResponse) {
    println!("{}", serde_json::to_string(res).unwrap());
}

fn print_installed(res: &InstalledResponse) {
    println!("{}", serde_json::to_string(res).unwrap());
}

fn get_cache_path() -> Result<PathBuf, String> {
    let os = env::consts::OS;
    
    if os == "windows" {
        if let Ok(local_app_data) = env::var("LOCALAPPDATA") {
            let mut path = PathBuf::from(local_app_data);
            path.push("Comet");
            path.push("User Data");
            path.push("Default");
            path.push("Cache");
            return Ok(path);
        } else {
            return Err("LOCALAPPDATA environment variable not found".to_string());
        }
    }

    if let Ok(home) = env::var("HOME") {
        let mut path = PathBuf::from(home);
        if os == "macos" {
            path.push("Library");
            path.push("Caches");
            path.push("ai.perplexity.comet");
            Ok(path)
        } else if os == "linux" {
            path.push(".cache");
            path.push("comet");
            Ok(path)
        } else {
            Err(format!("Unsupported OS: {}", os))
        }
    } else {
        Err("HOME environment variable not found".to_string())
    }
}

fn get_dir_size(path: &Path) -> std::io::Result<u64> {
    let mut size = 0;
    if path.is_dir() {
        for entry in fs::read_dir(path)? {
            if let Ok(entry) = entry {
                let path = entry.path();
                if path.is_dir() {
                    size += get_dir_size(&path).unwrap_or(0);
                } else if let Ok(metadata) = entry.metadata() {
                    size += metadata.len();
                }
            }
        }
    }
    Ok(size)
}

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 2 {
        print_response(&Response {
            reclaimed_bytes: 0,
            error: "Unknown command".to_string(),
        });
        return;
    }

    let command = &args[1];

    let cache_path = match get_cache_path() {
        Ok(path) => path,
        Err(e) => {
            print_response(&Response {
                reclaimed_bytes: 0,
                error: e,
            });
            return;
        }
    };

    if command == "installed" {
        print_installed(&InstalledResponse {
            installed: cache_path.exists(),
        });
        return;
    }

    if command == "estimate" {
        if cache_path.exists() {
            match get_dir_size(&cache_path) {
                Ok(size) => {
                    print_estimate_response(&EstimateResponse {
                        reclaimable_bytes: size,
                        error: String::new(),
                    });
                }
                Err(e) => {
                    print_estimate_response(&EstimateResponse {
                        reclaimable_bytes: 0,
                        error: e.to_string(),
                    });
                }
            }
        } else {
            print_estimate_response(&EstimateResponse {
                reclaimable_bytes: 0,
                error: String::new(),
            });
        }
        return;
    }

    if command == "clean" {
        let size = if cache_path.exists() {
            get_dir_size(&cache_path).unwrap_or(0)
        } else {
            0
        };

        if cache_path.exists() {
            if let Err(e) = fs::remove_dir_all(&cache_path) {
                print_response(&Response {
                    reclaimed_bytes: 0,
                    error: e.to_string(),
                });
                return;
            }
        }

        print_response(&Response {
            reclaimed_bytes: size,
            error: String::new(),
        });
        return;
    }

    print_response(&Response {
        reclaimed_bytes: 0,
        error: "Unknown command".to_string(),
    });
}

import sys
import os
import json
import shutil
from pathlib import Path

def get_cache_path():
    platform = sys.platform
    homedir = os.path.expanduser("~")
    
    if platform == "darwin":
        return os.path.join(homedir, "Library", "Caches", "Firefox", "Profiles")
    elif platform.startswith("linux"):
        return os.path.join(homedir, ".cache", "mozilla", "firefox")
    elif platform == "win32":
        local_app_data = os.environ.get("LOCALAPPDATA", os.path.join(homedir, "AppData", "Local"))
        return os.path.join(local_app_data, "Mozilla", "Firefox", "Profiles")
    return None

def estimate_size(path):
    total = 0
    if os.path.exists(path):
        for p in Path(path).rglob('*'):
            try:
                if p.is_file() and not p.is_symlink():
                    total += p.stat().st_size
            except Exception:
                pass
    return total

def clean_cache(path):
    total = estimate_size(path)
    if os.path.exists(path):
        shutil.rmtree(path, ignore_errors=True)
    return total

def main():
    try:
        if len(sys.argv) < 2:
            print(json.dumps({"reclaimed_bytes": 0, "error": "Unknown command"}))
            return
            
        command = sys.argv[1]
        cache_path = get_cache_path()
        
        if command == "installed":
            is_installed = cache_path is not None and os.path.exists(cache_path)
            print(json.dumps({"installed": is_installed}))
            
        elif command == "estimate":
            if cache_path:
                reclaimed = estimate_size(cache_path)
                print(json.dumps({"reclaimed_bytes": reclaimed, "error": ""}))
            else:
                print(json.dumps({"reclaimed_bytes": 0, "error": ""}))
                
        elif command == "clean":
            if cache_path:
                reclaimed = clean_cache(cache_path)
                print(json.dumps({"reclaimed_bytes": reclaimed, "error": ""}))
            else:
                print(json.dumps({"reclaimed_bytes": 0, "error": ""}))
                
        else:
            print(json.dumps({"reclaimed_bytes": 0, "error": "Unknown command"}))
            
    except Exception as e:
        print(json.dumps({"reclaimed_bytes": 0, "error": str(e)}))

if __name__ == "__main__":
    main()

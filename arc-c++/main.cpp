#include <iostream>
#include <filesystem>
#include <cstdlib>
#include <string>

namespace fs = std::filesystem;

std::string escape_json(const std::string &s) {
    std::string escaped;
    for (char c : s) {
        if (c == '"') escaped += "\\\"";
        else if (c == '\\') escaped += "\\\\";
        else if (c == '\b') escaped += "\\b";
        else if (c == '\f') escaped += "\\f";
        else if (c == '\n') escaped += "\\n";
        else if (c == '\r') escaped += "\\r";
        else if (c == '\t') escaped += "\\t";
        else escaped += c;
    }
    return escaped;
}

std::string get_cache_path() {
#if defined(__APPLE__)
    const char* home = std::getenv("HOME");
    if (home) {
        return std::string(home) + "/Library/Caches/company.thebrowser.Browser";
    }
#elif defined(_WIN32)
    const char* local_app_data = std::getenv("LOCALAPPDATA");
    if (local_app_data) {
        return std::string(local_app_data) + "\\Packages\\TheBrowserCompany.Arc_ttt1ap7aakyb4\\LocalCache\\Local\\Arc\\User Data\\Default\\Cache";
    }
#else
    const char* home = std::getenv("HOME");
    if (home) {
        return std::string(home) + "/.cache/arc";
    }
#endif
    return "";
}

uintmax_t estimate_size(const fs::path& path) {
    uintmax_t total = 0;
    if (fs::exists(path) && fs::is_directory(path)) {
        std::error_code ec;
        for (auto& p : fs::recursive_directory_iterator(path, fs::directory_options::skip_permission_denied, ec)) {
            if (fs::is_regular_file(p.status(ec))) {
                total += fs::file_size(p, ec);
            }
        }
    }
    return total;
}

int main(int argc, char* argv[]) {
    if (argc < 2) {
        std::cout << "{\"reclaimed_bytes\": 0, \"error\": \"Unknown command\"}\n";
        return 0;
    }

    std::string command = argv[1];
    std::string cache_path_str = get_cache_path();

    if (cache_path_str.empty()) {
        std::cout << "{\"reclaimed_bytes\": 0, \"error\": \"Unsupported OS or missing env var\"}\n";
        return 0;
    }

    fs::path cache_path(cache_path_str);

    try {
        if (command == "installed") {
            bool installed = fs::exists(cache_path);
            std::cout << "{\"installed\": " << (installed ? "true" : "false") << "}\n";
        } else if (command == "estimate") {
            uintmax_t size = estimate_size(cache_path);
            std::cout << "{\"reclaimable_bytes\": " << size << ", \"error\": \"\"}\n";
        } else if (command == "clean") {
            uintmax_t size = estimate_size(cache_path);
            if (fs::exists(cache_path)) {
                fs::remove_all(cache_path);
            }
            std::cout << "{\"reclaimed_bytes\": " << size << ", \"error\": \"\"}\n";
        } else {
            std::cout << "{\"reclaimed_bytes\": 0, \"error\": \"Unknown command\"}\n";
        }
    } catch (const std::exception& e) {
        std::cout << "{\"reclaimed_bytes\": 0, \"error\": \"" << escape_json(e.what()) << "\"}\n";
    }

    return 0;
}

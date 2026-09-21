"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
function getCachePaths() {
    const platform = process.platform;
    const homedir = os.homedir();
    if (platform === 'darwin') {
        return [path.join(homedir, 'Library', 'Caches', 'Google', 'Chrome')];
    }
    else if (platform === 'linux') {
        return [path.join(homedir, '.cache', 'google-chrome')];
    }
    else if (platform === 'win32') {
        const localAppData = process.env.LOCALAPPDATA || path.join(homedir, 'AppData', 'Local');
        return [
            path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Default', 'Cache'),
            path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Default', 'Code Cache')
        ];
    }
    return [];
}
async function getDirSize(dirPath) {
    let totalSize = 0;
    try {
        const stats = await fs.promises.stat(dirPath);
        if (stats.isFile()) {
            return stats.size;
        }
        else if (stats.isDirectory()) {
            const files = await fs.promises.readdir(dirPath);
            for (const file of files) {
                totalSize += await getDirSize(path.join(dirPath, file));
            }
        }
    }
    catch (e) {
        // Ignore files or directories we can't access
    }
    return totalSize;
}
async function checkInstalled(paths) {
    for (const p of paths) {
        if (fs.existsSync(p)) {
            return true;
        }
    }
    return false;
}
async function estimateSize(paths) {
    let total = 0;
    for (const p of paths) {
        if (fs.existsSync(p)) {
            total += await getDirSize(p);
        }
    }
    return total;
}
async function cleanCaches(paths) {
    const total = await estimateSize(paths);
    for (const p of paths) {
        if (fs.existsSync(p)) {
            await fs.promises.rm(p, { recursive: true, force: true });
        }
    }
    return total;
}
async function main() {
    try {
        const command = process.argv[2];
        const cachePaths = getCachePaths();
        if (command === 'installed') {
            const installed = await checkInstalled(cachePaths);
            console.log(JSON.stringify({ installed }));
        }
        else if (command === 'estimate') {
            const reclaimed_bytes = await estimateSize(cachePaths);
            console.log(JSON.stringify({ reclaimed_bytes, error: "" }));
        }
        else if (command === 'clean') {
            const reclaimed_bytes = await cleanCaches(cachePaths);
            console.log(JSON.stringify({ reclaimed_bytes, error: "" }));
        }
        else {
            console.log(JSON.stringify({ reclaimed_bytes: 0, error: "Unknown command" }));
        }
    }
    catch (error) {
        console.log(JSON.stringify({ reclaimed_bytes: 0, error: error.message || String(error) }));
    }
}
main();

import fs from 'fs';
import path from 'path';
import os from 'os';

function getCachePath() {
    const platform = process.platform;
    const homedir = os.homedir();

    if (platform === 'darwin') {
        return path.join(homedir, 'Library', 'Caches', 'Chromium');
    } else if (platform === 'linux') {
        return path.join(homedir, '.cache', 'chromium');
    } else if (platform === 'win32') {
        const localAppData = process.env.LOCALAPPDATA || path.join(homedir, 'AppData', 'Local');
        return path.join(localAppData, 'Chromium', 'User Data', 'Default', 'Cache');
    }
    return null;
}

async function getDirSize(dirPath) {
    let totalSize = 0;
    try {
        const stats = await fs.promises.stat(dirPath);
        if (stats.isFile()) {
            return stats.size;
        } else if (stats.isDirectory()) {
            const files = await fs.promises.readdir(dirPath);
            for (const file of files) {
                totalSize += await getDirSize(path.join(dirPath, file));
            }
        }
    } catch (e) {
    }
    return totalSize;
}

async function main() {
    try {
        const command = process.argv[2];
        const cachePath = getCachePath();

        if (!cachePath) {
            console.log(JSON.stringify({ reclaimed_bytes: 0, error: "Unsupported OS" }));
            return;
        }

        if (command === 'installed') {
            const installed = fs.existsSync(cachePath);
            console.log(JSON.stringify({ installed }));
        } else if (command === 'estimate') {
            if (fs.existsSync(cachePath)) {
                const reclaimed_bytes = await getDirSize(cachePath);
                console.log(JSON.stringify({ reclaimed_bytes, error: "" }));
            } else {
                console.log(JSON.stringify({ reclaimed_bytes: 0, error: "" }));
            }
        } else if (command === 'clean') {
            if (fs.existsSync(cachePath)) {
                const reclaimed_bytes = await getDirSize(cachePath);
                await fs.promises.rm(cachePath, { recursive: true, force: true });
                console.log(JSON.stringify({ reclaimed_bytes, error: "" }));
            } else {
                console.log(JSON.stringify({ reclaimed_bytes: 0, error: "" }));
            }
        } else {
            console.log(JSON.stringify({ reclaimed_bytes: 0, error: "Unknown command" }));
        }
    } catch (error) {
        console.log(JSON.stringify({ reclaimed_bytes: 0, error: error.message || String(error) }));
    }
}

main();

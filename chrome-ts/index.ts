import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

function getCachePaths(): string[] {
    const platform = process.platform;
    const homedir = os.homedir();

    if (platform === 'darwin') {
        return [path.join(homedir, 'Library', 'Caches', 'Google', 'Chrome')];
    } else if (platform === 'linux') {
        return [path.join(homedir, '.cache', 'google-chrome')];
    } else if (platform === 'win32') {
        const localAppData = process.env.LOCALAPPDATA || path.join(homedir, 'AppData', 'Local');
        return [
            path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Default', 'Cache'),
            path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Default', 'Code Cache')
        ];
    }
    return [];
}

async function getDirSize(dirPath: string): Promise<number> {
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

async function checkInstalled(paths: string[]): Promise<boolean> {
    for (const p of paths) {
        if (fs.existsSync(p)) {
            return true;
        }
    }
    return false;
}

async function estimateSize(paths: string[]): Promise<number> {
    let total = 0;
    for (const p of paths) {
        if (fs.existsSync(p)) {
            total += await getDirSize(p);
        }
    }
    return total;
}

async function cleanCaches(paths: string[]): Promise<number> {
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
        } else if (command === 'estimate') {
            const reclaimed_bytes = await estimateSize(cachePaths);
            console.log(JSON.stringify({ reclaimed_bytes, error: "" }));
        } else if (command === 'clean') {
            const reclaimed_bytes = await cleanCaches(cachePaths);
            console.log(JSON.stringify({ reclaimed_bytes, error: "" }));
        } else {
            console.log(JSON.stringify({ reclaimed_bytes: 0, error: "Unknown command" }));
        }
    } catch (error: any) {
        console.log(JSON.stringify({ reclaimed_bytes: 0, error: error.message || String(error) }));
    }
}

main();

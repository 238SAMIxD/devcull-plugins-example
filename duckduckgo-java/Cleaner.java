import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.stream.Stream;

public class Cleaner {
    public static void main(String[] args) {
        if (args.length < 1) {
            System.out.println("{\"reclaimed_bytes\": 0, \"error\": \"Unknown command\"}");
            return;
        }

        String command = args[0];

        try {
            Path cachePath = getCachePath();
            if (cachePath == null) {
                System.out.println("{\"reclaimed_bytes\": 0, \"error\": \"Unsupported OS or missing env var\"}");
                return;
            }

            if ("installed".equals(command)) {
                boolean installed = Files.exists(cachePath);
                System.out.println("{\"installed\": " + installed + "}");
            } else if ("estimate".equals(command)) {
                long size = estimateSize(cachePath);
                System.out.println("{\"reclaimable_bytes\": " + size + ", \"error\": \"\"}");
            } else if ("clean".equals(command)) {
                long size = estimateSize(cachePath);
                if (Files.exists(cachePath)) {
                    deleteRecursively(cachePath);
                }
                System.out.println("{\"reclaimed_bytes\": " + size + ", \"error\": \"\"}");
            } else {
                System.out.println("{\"reclaimed_bytes\": 0, \"error\": \"Unknown command\"}");
            }
        } catch (Exception e) {
            String errorMsg = e.getMessage();
            if (errorMsg != null) {
                errorMsg = errorMsg.replace("\\", "\\\\").replace("\"", "\\\"");
            } else {
                errorMsg = "Unknown error";
            }
            System.out.println("{\"reclaimed_bytes\": 0, \"error\": \"" + errorMsg + "\"}");
        }
    }

    private static Path getCachePath() throws IOException {
        String osName = System.getProperty("os.name").toLowerCase();
        String userHome = System.getProperty("user.home");

        if (osName.contains("mac")) {
            return Paths.get(userHome, "Library", "Caches", "com.duckduckgo.macos.browser");
        } else if (osName.contains("win")) {
            String localAppData = System.getenv("LOCALAPPDATA");
            if (localAppData == null) {
                localAppData = Paths.get(userHome, "AppData", "Local").toString();
            }
            Path packagesPath = Paths.get(localAppData, "Packages");
            if (Files.exists(packagesPath)) {
                try (DirectoryStream<Path> stream = Files.newDirectoryStream(packagesPath, "DuckDuckGo.DesktopBrowser_*")) {
                    for (Path entry : stream) {
                        return entry.resolve("LocalState").resolve("EBWebView").resolve("Default").resolve("Cache");
                    }
                }
            }
            return null;
        } else if (osName.contains("nix") || osName.contains("nux")) {
            return Paths.get(userHome, ".cache", "duckduckgo");
        }
        return null;
    }

    private static long estimateSize(Path cachePath) {
        if (!Files.exists(cachePath)) {
            return 0;
        }
        long[] totalSize = {0};
        try (Stream<Path> paths = Files.walk(cachePath)) {
            paths.filter(Files::isRegularFile).forEach(path -> {
                try {
                    totalSize[0] += Files.size(path);
                } catch (IOException e) {
                }
            });
        } catch (IOException e) {
        }
        return totalSize[0];
    }

    private static void deleteRecursively(Path rootPath) throws IOException {
        Files.walkFileTree(rootPath, new SimpleFileVisitor<Path>() {
            @Override
            public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                Files.delete(file);
                return FileVisitResult.CONTINUE;
            }

            @Override
            public FileVisitResult visitFileFailed(Path file, IOException exc) throws IOException {
                return FileVisitResult.CONTINUE;
            }

            @Override
            public FileVisitResult postVisitDirectory(Path dir, IOException exc) throws IOException {
                if (exc == null) {
                    Files.delete(dir);
                    return FileVisitResult.CONTINUE;
                } else {
                    throw exc;
                }
            }
        });
    }
}

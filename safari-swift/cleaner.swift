import Foundation

struct PluginResponse: Codable {
    var installed: Bool?
    var reclaimed_bytes: Int?
    var error: String?
}

func printResponse(_ response: PluginResponse) {
    let encoder = JSONEncoder()
    if let data = try? encoder.encode(response),
       let jsonString = String(data: data, encoding: .utf8) {
        print(jsonString)
    } else {
        print("{\"reclaimed_bytes\":0,\"error\":\"Failed to encode JSON\"}")
    }
}

#if !os(macOS)
printResponse(PluginResponse(installed: false, reclaimed_bytes: nil, error: nil))
exit(0)
#else

func getCachePath() -> URL {
    return FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent("Library/Caches/com.apple.Safari")
}

func estimateSize(at url: URL) throws -> Int {
    var totalSize = 0
    let fileManager = FileManager.default
    
    if !fileManager.fileExists(atPath: url.path) {
        return 0
    }
    
    let resourceKeys: [URLResourceKey] = [.fileSizeKey]
    guard let enumerator = fileManager.enumerator(at: url, includingPropertiesForKeys: resourceKeys) else {
        return 0
    }
    
    for case let fileURL as URL in enumerator {
        do {
            let resourceValues = try fileURL.resourceValues(forKeys: Set(resourceKeys))
            if let fileSize = resourceValues.fileSize {
                totalSize += fileSize
            }
        } catch {
        }
    }
    
    return totalSize
}

func main() {
    let arguments = CommandLine.arguments
    if arguments.count < 2 {
        printResponse(PluginResponse(installed: nil, reclaimed_bytes: 0, error: "Unknown command"))
        return
    }
    
    let command = arguments[1]
    let cachePath = getCachePath()
    let fileManager = FileManager.default
    
    do {
        switch command {
        case "installed":
            let isInstalled = fileManager.fileExists(atPath: cachePath.path)
            printResponse(PluginResponse(installed: isInstalled, reclaimed_bytes: nil, error: nil))
            
        case "estimate":
            let size = try estimateSize(at: cachePath)
            printResponse(PluginResponse(installed: nil, reclaimed_bytes: size, error: ""))
            
        case "clean":
            let size = try estimateSize(at: cachePath)
            if fileManager.fileExists(atPath: cachePath.path) {
                try fileManager.removeItem(at: cachePath)
            }
            printResponse(PluginResponse(installed: nil, reclaimed_bytes: size, error: ""))
            
        default:
            printResponse(PluginResponse(installed: nil, reclaimed_bytes: 0, error: "Unknown command"))
        }
    } catch {
        printResponse(PluginResponse(installed: nil, reclaimed_bytes: 0, error: error.localizedDescription))
    }
}

main()

#endif

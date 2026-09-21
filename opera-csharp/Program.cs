using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Text.Json;

try
{
    if (args.Length == 0)
    {
        Console.WriteLine(JsonSerializer.Serialize(new Response(0, "Unknown command")));
        return;
    }

    string command = args[0];
    string? cachePath = GetCachePath();

    if (cachePath == null)
    {
        Console.WriteLine(JsonSerializer.Serialize(new Response(0, "Unsupported OS")));
        return;
    }

    if (command == "installed")
    {
        bool installed = Directory.Exists(cachePath);
        Console.WriteLine(JsonSerializer.Serialize(new InstalledResponse(installed)));
    }
    else if (command == "estimate")
    {
        long size = EstimateSize(cachePath);
        Console.WriteLine(JsonSerializer.Serialize(new EstimateResponse(size, "")));
    }
    else if (command == "clean")
    {
        long size = EstimateSize(cachePath);
        if (Directory.Exists(cachePath))
        {
            Directory.Delete(cachePath, true);
        }
        Console.WriteLine(JsonSerializer.Serialize(new Response(size, "")));
    }
    else
    {
        Console.WriteLine(JsonSerializer.Serialize(new Response(0, "Unknown command")));
    }
}
catch (Exception ex)
{
    Console.WriteLine(JsonSerializer.Serialize(new Response(0, ex.Message)));
}

static string? GetCachePath()
{
    string homeDir = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);

    if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
    {
        return Path.Combine(homeDir, "Library", "Caches", "com.operasoftware.Opera");
    }
    else if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
    {
        return Path.Combine(homeDir, ".cache", "opera");
    }
    else if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
    {
        string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        return Path.Combine(localAppData, "Opera Software", "Opera Stable", "Cache");
    }

    return null;
}

static long EstimateSize(string path)
{
    long totalSize = 0;
    if (!Directory.Exists(path))
    {
        return 0;
    }

    try
    {
        foreach (string file in Directory.EnumerateFiles(path, "*", SearchOption.AllDirectories))
        {
            try
            {
                totalSize += new FileInfo(file).Length;
            }
            catch (Exception)
            {
            }
        }
    }
    catch (Exception)
    {
    }

    return totalSize;
}

public record Response(long reclaimed_bytes, string error);
public record EstimateResponse(long reclaimable_bytes, string error);
public record InstalledResponse(bool installed);

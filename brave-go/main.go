package main

import (
	"encoding/json"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"runtime"
)

type Response struct {
	ReclaimedBytes int64  `json:"reclaimed_bytes"`
	Error          string `json:"error"`
}

type InstalledResponse struct {
	Installed bool `json:"installed"`
}

func printResponse(resp interface{}) {
	bytes, err := json.Marshal(resp)
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to marshal response: %v\n", err)
		fmt.Println(`{"reclaimed_bytes":0,"error":"failed to marshal json"}`)
		return
	}
	fmt.Println(string(bytes))
}

func getCachePath() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}

	switch runtime.GOOS {
	case "darwin":
		return filepath.Join(homeDir, "Library", "Caches", "BraveSoftware", "Brave-Browser"), nil
	case "linux":
		return filepath.Join(homeDir, ".cache", "BraveSoftware", "Brave-Browser"), nil
	case "windows":
		localAppData := os.Getenv("LOCALAPPDATA")
		if localAppData == "" {
			localAppData = filepath.Join(homeDir, "AppData", "Local")
		}
		return filepath.Join(localAppData, "BraveSoftware", "Brave-Browser", "User Data", "Default", "Cache"), nil
	default:
		return "", fmt.Errorf("unsupported operating system: %s", runtime.GOOS)
	}
}

func estimateSize(path string) (int64, error) {
	var totalSize int64

	_, err := os.Stat(path)
	if os.IsNotExist(err) {
		return 0, nil
	} else if err != nil {
		return 0, err
	}

	err = filepath.WalkDir(path, func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			return nil // ignore files we cannot access
		}
		if !d.IsDir() {
			info, err := d.Info()
			if err == nil {
				totalSize += info.Size()
			}
		}
		return nil
	})

	return totalSize, nil
}

func main() {
	if len(os.Args) < 2 {
		printResponse(Response{ReclaimedBytes: 0, Error: "Unknown command"})
		return
	}

	command := os.Args[1]

	cachePath, err := getCachePath()
	if err != nil {
		printResponse(Response{ReclaimedBytes: 0, Error: err.Error()})
		return
	}

	switch command {
	case "installed":
		_, err := os.Stat(cachePath)
		installed := err == nil
		printResponse(InstalledResponse{Installed: installed})

	case "estimate":
		size, err := estimateSize(cachePath)
		if err != nil {
			printResponse(Response{ReclaimedBytes: 0, Error: err.Error()})
		} else {
			printResponse(Response{ReclaimedBytes: size, Error: ""})
		}

	case "clean":
		size, err := estimateSize(cachePath)
		if err != nil {
			printResponse(Response{ReclaimedBytes: 0, Error: err.Error()})
			return
		}

		err = os.RemoveAll(cachePath)
		if err != nil {
			printResponse(Response{ReclaimedBytes: 0, Error: err.Error()})
		} else {
			printResponse(Response{ReclaimedBytes: size, Error: ""})
		}

	default:
		printResponse(Response{ReclaimedBytes: 0, Error: "Unknown command"})
	}
}

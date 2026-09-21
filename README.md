# devcull-plugin-examples

This repository contains official, cross-platform browser cache cleaners acting as language examples for the `devcull` community. It serves as the official "Rosetta Stone" to demonstrate how to write plugins in multiple different programming languages using our simple JSON interface.

## The Polyglot Roster

Each folder in this repository acts as a placeholder (for now) and will contain a complete, working example of a `devcull` plugin written in a specific language targeting a specific browser.

*   **[Chrome](chrome-ts/)**: TypeScript / Node.js
*   **[Firefox](firefox-py/)**: Python
*   **[Opera](opera-csharp/)**: C# / .NET
*   **[Brave](brave-go/)**: Go
*   **[Safari](safari-swift/)**: Swift
*   **[Edge](edge-ruby/)**: Ruby
*   **[Comet](comet-rust/)**: Rust

## The Plugin Protocol (How it works)

Developing `devcull` plugins is incredibly straightforward. The `devcull` engine passes positional arguments to the plugin executable (e.g., `./plugin clean`), and the plugin simply outputs a single JSON response to `stdout`.

For example, a successful cache cleaning operation might output:

```json
{"reclaimed_bytes": 1024, "error": ""}
```

If an error occurs, the plugin might output:

```json
{"reclaimed_bytes": 0, "error": "Permission denied"}
```

There are no complex SDKs or libraries required—just parse the command-line arguments and print JSON!

## Installation Instructions

To install a plugin, a user simply copies the desired folder into their local `devcull` plugins directory:

```bash
cp -r <plugin-folder> ~/.config/devcull/plugins/
```

After copying the folder, the `devcull` engine will automatically discover and integrate the new plugin.

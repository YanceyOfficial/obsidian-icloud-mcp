# obsidian-icloud-mcp

Connecting your Obsidian Vaults that are stored in iCloud Drive to AI via the Model Context Protocol (MCP)

## Usage with Claude Desktop

Add this to your `claude_desktop_config.json`:

### Local Testing

```json
{
  "mcpServers": {
    "obsidian-icloud-mcp": {
      "command": "node",
      "args": [
        "/path/to/obsidian-icloud-mcp/build/index.js",
        "/Users/<USERNAME>/Library/Mobile\\ Documents/iCloud~md~obsidian/Documents/<VAULT_NAME_1>",
        "/Users/<USERNAME>/Library/Mobile\\ Documents/iCloud~md~obsidian/Documents/<VAULT_NAME_2>",
      ]
    }
  }
}
```

### NPX

```json
{
  "mcpServers": {
    "obsidian-icloud-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "obsidian-icloud-mcp",
        "/Users/<USERNAME>/Library/Mobile\\ Documents/iCloud~md~obsidian/Documents/<VAULT_NAME_1>",
        "/Users/<USERNAME>/Library/Mobile\\ Documents/iCloud~md~obsidian/Documents/<VAULT_NAME_2>",
      ]
    }
  }
}
```

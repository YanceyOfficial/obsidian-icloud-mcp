# Obsidian iCloud MCP

Connecting Obsidian Vaults that are stored in iCloud Drive to AI via the Model Context Protocol (MCP).

> [!WARNING]
> Obsidian iCloud MCP is fully tested on MacOS. If you are using Windows or Linux, please test it and let me know if it works.

## Usage with Claude Desktop

Add this to your [`claude_desktop_config.json`](https://modelcontextprotocol.io/quickstart/user):

### Debugging in Development

```json
{
  "mcpServers": {
    "obsidian-mcp": {
      "command": "node",
      "args": [
        "/path/to/obsidian-mcp/build/index.js",
        "/Users/<USERNAME>/Library/Mobile\\ Documents/iCloud~md~obsidian/Documents/<VAULT_NAME_1>",
        "/Users/<USERNAME>/Library/Mobile\\ Documents/iCloud~md~obsidian/Documents/<VAULT_NAME_2>"
      ]
    }
  }
}
```

Using [`npx @modelcontextprotocol/inspector node path/to/server/index.js arg1 arg2 arg3 arg...`](https://modelcontextprotocol.io/docs/tools/inspector) to inspect servers locally developed.

### Using in Production

```json
{
  "mcpServers": {
    "obsidian-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "obsidian-mcp",
        "/Users/<USERNAME>/Library/Mobile\\ Documents/iCloud~md~obsidian/Documents/<VAULT_NAME_1>",
        "/Users/<USERNAME>/Library/Mobile\\ Documents/iCloud~md~obsidian/Documents/<VAULT_NAME_2>"
      ]
    }
  }
}
```

# PeerDrop for Obsidian

Share files between Obsidian vaults using WebRTC peer-to-peer connections, powered by [PairDrop](https://github.com/schlagmichdoch/pairdrop).

## Features

- **P2P File Sharing**: Direct peer-to-peer file transfers using WebRTC
- **Share Files & Folders**: Share individual files or entire folders between vaults
- **Cross-Platform**: Works on desktop (Windows, macOS, Linux) and mobile
- **Auto-Discovery**: Automatically discover peers on the same network
- **Progress Tracking**: Real-time transfer progress with detailed status
- **Configurable**: Custom signaling server, save locations, and device names

## Installation

### Manual Installation

1. Download the latest release (`main.js`, `manifest.json`, `styles.css`)
2. Create a folder called `peerdrop` in your vault's `.obsidian/plugins/` directory
3. Copy the downloaded files into the folder
4. Enable the plugin in Obsidian Settings > Community Plugins

### From Source

```bash
cd obsidian-peerdrop
npm install
npm run build
```

Then copy `main.js`, `manifest.json`, and `styles.css` to your vault's plugins folder.

## Usage

### Sharing Files

1. Click the PeerDrop icon in the ribbon (left sidebar)
2. Select a peer from the list of discovered devices
3. Choose files or folders to share
4. Monitor transfer progress

### Alternative Methods

- **Context Menu**: Right-click any file/folder and select "Share via PeerDrop"
- **Command Palette**: Use `Ctrl/Cmd + P` and search for "PeerDrop"
  - `Show available peers` - Open peer selection
  - `Share current file` - Share the currently open file
  - `Share files...` - Open file picker
  - `Reconnect to server` - Manually reconnect

### Receiving Files

When someone sends you files:
1. An incoming transfer dialog will appear
2. Review the files being sent
3. Click "Accept" to receive or "Decline" to reject
4. Files are saved to your configured save location (default: `PeerDrop/`)

## Settings

| Setting | Description |
|---------|-------------|
| **Signaling Server URL** | WebSocket URL for peer discovery (default: `wss://pairdrop.net`) |
| **Save Location** | Folder where received files are saved |
| **Discovery Mode** | `Auto-discover` (find all peers) or `Paired devices only` |
| **Device Name** | Custom name for your device (auto-generated if empty) |
| **Auto-accept from paired** | Automatically accept files from paired devices |
| **Show Notifications** | Display notifications for transfers |

## Self-Hosted Server

You can use your own PairDrop server:

1. Deploy PairDrop following the [official instructions](https://github.com/schlagmichdoch/pairdrop#deployment)
2. Update the "Signaling Server URL" in plugin settings to your server's WebSocket URL

## How It Works

1. **Signaling**: Peers connect to a signaling server to discover each other
2. **WebRTC**: Once peers are found, a direct WebRTC connection is established
3. **Transfer**: Files are chunked into 64KB pieces and sent directly peer-to-peer
4. **Storage**: Received files are saved to your vault using Obsidian's API

Data flows directly between peers - the signaling server only facilitates the initial connection.

## Compatibility

- **Obsidian**: v1.0.0+
- **Platforms**: Desktop (Windows, macOS, Linux), Mobile (iOS, Android)
- **Peers**: Works with other Obsidian vaults and PairDrop web/mobile apps

## Troubleshooting

### Can't see peers
- Ensure both devices are connected to the same signaling server
- Check if you're behind a restrictive firewall (may need TURN server)
- Try the "Reconnect" button in settings

### Transfers failing
- Large files may timeout on slow connections
- Check your internet connection
- Try sending fewer files at once

### Connection issues
- WebRTC requires HTTPS for the signaling server
- Some corporate networks block WebRTC - try a different network

## License

MIT License - See [LICENSE](LICENSE) for details.

## Credits

- [PairDrop](https://github.com/schlagmichdoch/pairdrop) - The original WebRTC file sharing solution
- [Obsidian](https://obsidian.md/) - The knowledge management platform

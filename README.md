# P2P Share

Share files between Obsidian vaults using WebRTC peer-to-peer connections, powered by [PairDrop](https://github.com/schlagmichdoch/pairdrop).

## Features

- **P2P File Sharing**: Direct peer-to-peer file transfers using WebRTC
- **PairDrop Compatible**: Works with PairDrop web and mobile browser apps
- **Device Pairing**: Pair devices for cross-network file sharing
- **Share Files & Folders**: Share individual files or entire folders between vaults
- **Cross-Platform**: Works on desktop (Windows, macOS, Linux) and mobile
- **Auto-Discovery**: Automatically discover peers on the same network
- **Progress Tracking**: Real-time transfer progress with detailed status
- **Multilingual**: Available in 8 languages (English, Spanish, German, French, Russian, Japanese, Korean, Simplified Chinese)
- **System Notifications**: Optional OS-level notifications for incoming transfers (desktop only)
- **Configurable**: Custom signaling server, save location, and log levels

## Installation

### Manual Installation

1. Download the latest release (`main.js`, `manifest.json`, `styles.css`)
2. Create a folder called `p2p-share` in your vault's `.obsidian/plugins/` directory
3. Copy the downloaded files into the folder
4. Enable the plugin in Obsidian Settings > Community Plugins

### Via BRAT (Beta Reviewer's Auto-update Tool):

1. Ensure the [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin is installed
2. Trigger the command Obsidian42 - BRAT: Add a beta plugin for testing
3. Enter this repository, gapmiss/p2p-share
4. Enable the "P2P Share" plugin in the community plugin list

### From Source

```bash
git clone https://github.com/gapmiss/p2p-share.git
cd p2p-share
npm install
npm run build
```

Then copy `main.js`, `manifest.json`, and `styles.css` to your vault's plugins folder (e.g. `.obsidian/plugins/p2p-share`).

## Usage

### Sharing Files

1. Click the P2P Share icon in the ribbon (left sidebar)
2. Select a peer from the list of discovered devices
3. Choose files or folders to share
4. Monitor transfer progress

### Alternative Methods

- **Context Menu**: Right-click any file/folder and select "Share via P2P Share"
- **Command Palette**: Use `Ctrl/Cmd + P` and search for "P2P Share"
  - `Show available peers` - Open peer selection
  - `Share current file` - Share the currently open file
  - `Share files...` - Open file picker
  - `Reconnect to server` - Manually reconnect
  - `Pair with device` - Pair for cross-network sharing
  - `Toggle connection` - Connect or disconnect from server
- **Status Bar**: Click the status bar item for quick access to connect/disconnect, show peers, and pair

### Receiving Files

When someone sends you files:
1. An incoming transfer dialog will appear
2. Review the files being sent
3. Click "Accept" to receive or "Decline" to reject
4. Files are saved to your configured save location (default: `P2P Share/`)

### Device Pairing

Pair devices to share files across different networks:

1. Run command `P2P Share: Pair with device`
2. Choose "Show pairing code" on one device
3. Enter the 6-digit code on the other device
4. Devices are now paired and can discover each other from anywhere

Manage paired devices in Settings > P2P Share > Paired Devices.

## Settings

| Setting | Description |
|---------|-------------|
| **Signaling Server URL** | WebSocket URL for peer discovery (default: `wss://pairdrop.net`) |
| **Save Location** | Folder where received files are saved (default: `P2P Share/`) |
| **Discovery Mode** | `Auto-discover` (local network + paired devices) or `Paired devices only` |
| **Log Level** | Console logging verbosity (Silent, Error, Warning, Info, Debug) |
| **Auto-connect on startup** | Automatically connect to server when Obsidian loads (default: enabled) |
| **System Notifications** | Show OS-level notifications for incoming transfers (desktop only, default: disabled) |
| **Paired Devices** | View and manage paired devices (each can have auto-accept enabled) |

## Self-Hosted Server

You can use your own PairDrop signaling server for privacy or reliability:

1. See **[DEPLOYMENT.md](DEPLOYMENT.md)** for detailed hosting options including:
   - Docker (recommended)
   - Fly.io, Railway, Render (free tiers)
   - VPS with Nginx reverse proxy
2. Update the "Signaling Server URL" in plugin settings to your server's WebSocket URL

The signaling server only handles peer discovery - actual file data transfers directly between peers via WebRTC.

## How It Works

1. **Signaling**: Peers connect to a signaling server to discover each other
2. **WebRTC**: Once peers are found, a direct WebRTC connection is established
3. **Transfer**: Files are chunked into 64KB pieces and sent directly peer-to-peer
4. **Storage**: Received files are saved to your vault using Obsidian's API

Data flows directly between peers - the signaling server only facilitates the initial connection and never sees your file contents.

## Security

P2P Share uses **WebRTC's built-in encryption** (DTLS + SRTP) for secure peer-to-peer file transfers:

- ✅ **All file data is encrypted** during transfer (same encryption as Zoom/Google Meet)
- ✅ **Signaling uses WSS (WebSocket Secure)** - encrypted with TLS like HTTPS
- ✅ **Server never sees your files** - only connection metadata for peer discovery
- ✅ **No configuration needed** - encryption is automatic

For detailed security information, see **[SECURITY.md](SECURITY.md)**.

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

- [PairDrop](https://github.com/schlagmichdoch/pairdrop)
- [Obsidian](https://obsidian.md/)

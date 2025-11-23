# CLAUDE.md - Development Guidelines for PeerDrop

This file provides context for AI assistants (Claude, etc.) working on this codebase.

## Project Overview

PeerDrop is an Obsidian plugin that enables peer-to-peer file sharing between vaults using WebRTC. It uses the PairDrop protocol for signaling/peer discovery.

## Architecture

```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│  Obsidian Vault │◄──────────────────►│  PairDrop       │
│  (Plugin)       │   (Signaling)      │  Server         │
└────────┬────────┘                    └─────────────────┘
         │
         │ WebRTC (P2P)
         │
┌────────▼────────┐
│  Obsidian Vault │
│  (Plugin)       │
└─────────────────┘
```

### Key Components

| File | Purpose |
|------|---------|
| `src/main.ts` | Plugin entry point, event handlers, UI coordination |
| `src/signaling.ts` | WebSocket connection to PairDrop server |
| `src/peer-manager.ts` | Manages peer connections and file transfers |
| `src/rtc-peer.ts` | WebRTC data channel implementation |
| `src/modals/*.ts` | UI modals (peer selection, file picker, transfer progress) |
| `src/types.ts` | TypeScript interfaces |

## PairDrop Protocol

The plugin implements the PairDrop signaling protocol:

### Connection Flow
1. Connect to WebSocket at `wss://server/server?webrtc_supported=true`
2. Receive `ws-config` with RTC configuration
3. Receive `display-name` with assigned peer ID
4. Send `join-ip-room` to join room based on IP
5. Receive `peers` list of other peers in room

### Message Types (Server → Client)
- `ws-config` - RTC config and WS fallback settings
- `display-name` - Assigned identity (peerId, peerIdHash, displayName)
- `peers` - List of peers in room
- `peer-joined` - New peer entered room
- `peer-left` - Peer left room
- `signal` - WebRTC signaling (offer/answer/ICE)
- `ping` - Keepalive (must respond with `pong`)

### Message Types (Client → Server)
- `join-ip-room` - Join room based on IP address
- `pong` - Keepalive response
- `signal` - WebRTC signaling (requires `to`, `roomType`, `roomId`)
- `disconnect` - Graceful disconnect

### WebRTC Signaling Format
```typescript
// Offer/Answer
{ type: 'signal', to: peerId, roomType: 'ip', roomId: '127.0.0.1', sdp: RTCSessionDescription }

// ICE Candidate
{ type: 'signal', to: peerId, roomType: 'ip', roomId: '127.0.0.1', ice: RTCIceCandidate }
```

## File Transfer Protocol

Over the WebRTC data channel:

1. **Sender** sends `header` with file metadata
2. **Receiver** shows accept/reject modal
3. **Receiver** sends `transfer-accepted` or `transfer-rejected`
4. **Sender** sends files:
   - `file-start` with metadata
   - Binary chunks (64KB each)
   - `file-end`
5. **Sender** sends `transfer-complete`

### File Metadata
```typescript
interface FileMetadata {
  name: string;
  path?: string;  // Relative path for folder structure
  size: number;
  type: string;   // MIME type
  lastModified?: number;
}
```

## Development Commands

```bash
npm install      # Install dependencies
npm run dev      # Watch mode for development
npm run build    # Production build
```

## Code Conventions

### Obsidian API
- Use `registerEvent()` for event listeners (auto-cleanup)
- Use `addCommand()` for command palette entries
- Use `Notice` for user notifications
- Extend `Modal` for dialogs

### TypeScript
- Strict mode enabled
- Use `instanceof` checks for Obsidian types (TFile, TFolder)
- Handle optional chaining for nullable values

### Error Handling
- Log errors with `console.error('PeerDrop:', ...)`
- Show user-facing errors with `new Notice('PeerDrop: ...')`
- Use timeouts for async operations that may hang

## Common Issues

### "Unknown message type ws-config"
The plugin wasn't handling PairDrop's initial messages. Fixed by adding handlers for `ws-config` and `display-name`.

### Peers don't see each other
Must send `join-ip-room` after receiving `display-name`. Peers are grouped by IP address on the server.

### WebRTC signals not delivered
Signals must include `roomType` and `roomId` for the server to route them correctly.

### Transfer completes but UI stuck
Race condition - transfer may complete before modal is created. Fixed by implementing request/accept flow.

### querySelector fails on filenames
Filenames with special characters (quotes, brackets) break CSS selectors. Use `CSS.escape()`.

## Testing

1. Run two Obsidian vaults on the same machine
2. Both should connect to the same signaling server
3. Peers should appear in each other's peer list
4. Test file transfer with accept dialog
5. Test folder transfer (structure should be preserved)
6. Test with special characters in filenames

## Future Improvements

- [ ] Paired device management (persistent pairing)
- [ ] TURN server support for restrictive networks
- [ ] Transfer queue for multiple files
- [ ] Resume interrupted transfers
- [ ] End-to-end encryption
- [ ] Mobile-specific optimizations
- [ ] Drag-and-drop file sharing

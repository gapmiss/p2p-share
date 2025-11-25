# CLAUDE.md - Development Guidelines for P2P Share

This file provides context for AI assistants (Claude, etc.) working on this codebase.

## Project Overview

P2P Share is an Obsidian plugin that enables peer-to-peer file sharing between vaults using WebRTC. It uses the PairDrop protocol for signaling/peer discovery.

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
| `src/signaling.ts` | WebSocket connection to PairDrop server, device pairing |
| `src/peer-manager.ts` | Manages peer connections and file transfers |
| `src/rtc-peer.ts` | WebRTC data channel, PairDrop file transfer protocol |
| `src/modals/*.ts` | UI modals (peer selection, file picker, transfer, pairing, confirm) |
| `src/types.ts` | TypeScript interfaces and PairDrop message types |
| `src/logger.ts` | Configurable logging system |
| `src/settings.ts` | Plugin settings UI |
| `src/i18n/` | Internationalization system with English and French translations |

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
- `peers` - List of peers in room (includes roomType, roomId)
- `peer-joined` - New peer entered room (includes roomType, roomId)
- `peer-left` - Peer left room
- `signal` - WebRTC signaling (offer/answer/ICE)
- `ping` - Keepalive (must respond with `pong`)
- `pair-device-initiated` - Pairing code generated (pairKey, roomSecret)
- `pair-device-joined` - Pairing successful (roomSecret, peerId)
- `pair-device-join-key-invalid` - Invalid pairing code
- `pair-device-canceled` - Pairing canceled
- `secret-room-deleted` - Paired room removed

### Message Types (Client → Server)
- `join-ip-room` - Join room based on IP address
- `room-secrets` - Join paired device rooms (array of roomSecrets)
- `room-secrets-deleted` - Leave paired device rooms
- `pair-device-initiate` - Request a pairing code
- `pair-device-join` - Join with a pairing code (pairKey)
- `pair-device-cancel` - Cancel pairing attempt
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

## File Transfer Protocol (PairDrop Compatible)

Over the WebRTC data channel, using PairDrop's protocol for compatibility with web/mobile apps:

### Transfer Flow
1. **Sender** sends `request` with file headers array, totalSize, imagesOnly flag
2. **Receiver** shows accept/reject modal
3. **Receiver** sends `files-transfer-response` with accepted: true/false
4. **Sender** sends files sequentially:
   - `header` with name, mime, size
   - Binary chunks (64KB each)
   - `partition` every 1MB (flow control)
   - **Receiver** responds with `partition-received`
   - **Receiver** sends `progress` updates
   - **Receiver** sends `file-transfer-complete` when file done
5. Repeat for each file

### Message Types (Data Channel)
```typescript
// Request to send files
{ type: 'request', header: [{name, mime, size}], totalSize, imagesOnly }

// Accept/reject response
{ type: 'files-transfer-response', accepted: boolean, reason?: string }

// File header (before each file's data)
{ type: 'header', name, mime, size }

// Flow control (every 1MB)
{ type: 'partition', offset }
{ type: 'partition-received', offset }

// Progress update
{ type: 'progress', progress: 0-1 }

// File complete
{ type: 'file-transfer-complete' }

// Display name change
{ type: 'display-name-changed', displayName }
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

### Logging
- Use `logger` from `src/logger.ts` (not console.log directly)
- Log levels: `debug`, `info`, `warn`, `error`, `none`
- User configurable in settings
- Show user-facing errors with `new Notice('P2P Share: ...')`
- Use timeouts for async operations that may hang

### Internationalization (i18n)
- Use `t()` function from `src/i18n` for translating strings
- Use `tp()` function for pluralized strings (e.g., "1 file" vs "2 files")
- Translation keys defined in `src/i18n/locales/en.ts` (source of truth)
- Current supported languages: English (en), French (fr)
- Language auto-detected from Obsidian's language setting via `moment.locale()`
- To add a new language: Create `src/i18n/locales/[code].ts` and add to `translations` object in `src/i18n/index.ts`

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
5. Test folder transfer (files flattened for PairDrop web compatibility)
6. Test with special characters in filenames
7. Test with PairDrop web/mobile apps
8. Test device pairing across different networks
9. Test connect/disconnect toggle from status bar menu

## Future Improvements

- [x] Paired device management (persistent pairing)
- [x] PairDrop protocol compatibility
- [x] Configurable logging
- [x] Connection toggle UI
- [x] Internationalization (English and French)
- [ ] Additional languages (Spanish, German, Chinese, etc.)
- [ ] TURN server support for restrictive networks
- [ ] Transfer queue for multiple files
- [ ] Resume interrupted transfers
- [ ] End-to-end encryption
- [ ] Mobile-specific optimizations
- [ ] Drag-and-drop file sharing
- [ ] Text/clipboard sharing

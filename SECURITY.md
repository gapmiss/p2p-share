# Security and Encryption

This document explains how P2P Share keeps your file transfers secure and private.

## TL;DR - Is It Secure?

**Yes!** Your file transfers are encrypted automatically using industry-standard WebRTC encryption. Files are sent directly peer-to-peer and never touch the signaling server.

- ✅ All file data is encrypted during transfer
- ✅ The signaling server never sees your files
- ✅ Uses the same encryption technology as video calling apps (Zoom, Google Meet, etc.)
- ✅ No configuration needed - encryption is automatic

## How It Works

P2P Share uses a two-layer architecture that separates peer discovery from file transfer:

```
Your Vault ──WSS (TLS)──> PairDrop Server <──WSS (TLS)── Peer's Vault
    │                    (Signaling Only)                      │
    │                                                           │
    └────── WebRTC P2P (DTLS + SRTP Encrypted) ───────────────┘
                    (Actual File Transfer)
```

### Phase 1: Peer Discovery (Signaling)
- Your vault connects to the PairDrop signaling server via **WSS (WebSocket Secure)**
- WSS uses **TLS encryption** (the same as HTTPS)
- The server helps peers find each other and exchange connection information
- The server sees: peer IDs, display names, room membership, connection timing

### Phase 2: File Transfer (Peer-to-Peer)
- Once peers find each other, a **direct WebRTC connection** is established
- All file data flows **directly between peers** - bypassing the server
- WebRTC uses **DTLS** (Datagram TLS) and **SRTP** (Secure Real-time Transport Protocol)
- The server sees: nothing - files go directly peer-to-peer

## Encryption Layers

| Layer | Protocol | Encryption | What It Protects |
|-------|----------|------------|------------------|
| **Signaling Channel** | WSS | TLS 1.2+ | Peer discovery, connection setup |
| **WebRTC Handshake** | DTLS | Automatic | Key exchange, connection negotiation |
| **File Transfer** | SRTP | AES-128+ | All file data and control messages |

## What Is Encrypted?

### ✅ Encrypted in Transit
- All file contents (binary data)
- File names and metadata
- Control messages (transfer requests, progress updates)
- WebRTC signaling (SDP offers/answers, ICE candidates)
- Connection to signaling server (peer discovery)

### ⚠️ What the Signaling Server Can See
- Peer IDs (random identifiers)
- Display names (device names like "iPhone" or "Chrome")
- Room membership (which peers are paired)
- Connection timing and metadata
- IP addresses (needed for NAT traversal via STUN)

### ❌ What the Signaling Server CANNOT See
- File contents
- File names
- File sizes
- Transfer progress
- Any actual file data

## WebRTC Security Features

WebRTC provides enterprise-grade encryption automatically:

1. **DTLS-SRTP Encryption**: Mandatory in modern WebRTC implementations
2. **Strong Ciphers**: AES-GCM, ChaCha20-Poly1305
3. **Perfect Forward Secrecy**: New encryption keys for each session
4. **Authenticated Encryption**: Prevents tampering with data in transit
5. **Man-in-the-Middle Protection**: Certificate-based authentication

## Comparison to HTTPS File Uploads

### Traditional HTTPS Upload (e.g., cloud storage)
- Client → Server → Recipient
- Server sees all file data
- Must trust server operator with your files
- Server stores files (potential data breach risk)

### P2P Share (WebRTC)
- Sender → **Direct** → Receiver
- Server facilitates connection only
- Server never sees file data
- No server-side storage (zero data breach risk)

**Bottom Line**: WebRTC P2P is **more private** than HTTPS because the signaling server only facilitates the connection but never has access to your file data.

## Trust Model

When using P2P Share, you are trusting:

1. **The Signaling Server Operator** (default: pairdrop.net)
   - Can see connection metadata (peer IDs, timing)
   - Cannot see file contents
   - Could potentially block connections
   - Can be self-hosted for full control

2. **Your Network Connection**
   - WebRTC encrypts data in transit
   - If using public WiFi, signaling metadata is visible to network operator
   - File contents remain encrypted even on untrusted networks

3. **The Peer You're Transferring With**
   - For local network peers: anyone on your network
   - For paired devices: only devices you explicitly paired with
   - Files are decrypted only on the receiving peer's device

## Security Best Practices

### For Maximum Privacy
1. **Self-host the PairDrop server** - Run your own signaling server
2. **Use paired devices mode** - Only connect to explicitly paired devices
3. **Use trusted networks** - Avoid public WiFi for sensitive transfers
4. **Verify peer identity** - Check device names before sending

### For Maximum Compatibility
1. **Use the default public server** (pairdrop.net)
2. **Auto discovery mode** - Allow local network + paired devices
3. **Accept the STUN server usage** - Enables NAT traversal

## What About End-to-End Encryption?

P2P Share uses **transport encryption** (encrypts data during transfer) but not **end-to-end encryption** (application-layer encryption where only sender/receiver can decrypt).

**Current Security Model:**
- Files are encrypted in transit via WebRTC (DTLS-SRTP)
- Files are decrypted when received and saved to your vault
- Similar to Zoom or Google Meet video calls

**True End-to-End Encryption Would Mean:**
- Files encrypted with a password/key before transfer
- Files remain encrypted even after transfer
- Only the recipient with the password can decrypt

This is not currently implemented but could be added as an optional feature for ultra-sensitive data.

## Known Limitations

1. **No file integrity verification** - No automatic checksum/hash verification after transfer
2. **No certificate pinning** - Trusts system CA certificate store
3. **STUN servers only** - No TURN servers (may fail on restrictive corporate networks)
4. **No encryption status indicator** - No UI showing encryption is active
5. **Metadata visible to server** - Peer IDs and connection timing visible to signaling server

## Reporting Security Issues

If you discover a security vulnerability in P2P Share, please report it responsibly:

1. **Do not** open a public GitHub issue
2. Contact the maintainer privately (see repository for contact info)
3. Provide details about the vulnerability and steps to reproduce
4. Allow time for a fix before public disclosure

## Technical Details

### Encryption Algorithms
WebRTC uses industry-standard encryption:
- **DTLS 1.2** for key exchange and connection setup
- **SRTP** with AES-128-GCM or ChaCha20-Poly1305 for data encryption
- **ECDHE** (Elliptic Curve Diffie-Hellman Ephemeral) for perfect forward secrecy
- **SHA-256** for integrity verification

### WebRTC Configuration
```typescript
// From src/rtc-peer.ts
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};
```

- Uses Google's public STUN servers for NAT traversal
- No TURN servers (relay servers for restrictive networks)
- Default WebRTC encryption (DTLS-SRTP mandatory)
- No custom certificate configuration

### Signaling Security
```typescript
// From src/signaling.ts
// Default server URL uses WSS (WebSocket Secure)
serverUrl: 'wss://pairdrop.net'

// Automatically upgrades HTTP/WS to HTTPS/WSS
if (wsUrl.startsWith('http://')) {
  wsUrl = wsUrl.replace('http://', 'ws://');
} else if (wsUrl.startsWith('https://')) {
  wsUrl = wsUrl.replace('https://', 'wss://');
}
```

- Defaults to WSS (WebSocket Secure = TLS encryption)
- Prevents accidental unencrypted connections
- Compatible with self-hosted servers

## Self-Hosting for Maximum Security

For complete control over your data:

1. **Run your own PairDrop server**
   - Docker: `docker run -p 3000:3000 linuxserver/pairdrop`
   - Self-hosted deployment gives you full control

2. **Configure P2P Share to use your server**
   - Settings → Server URL → `https://your-server.com`
   - Or `wss://your-server.com` for direct WebSocket

3. **Benefits of self-hosting**
   - No third-party sees even metadata
   - Full control over server logs and data retention
   - Can add custom authentication
   - Can deploy on private networks (air-gapped systems)

## Conclusion

P2P Share is designed with privacy in mind:
- **Transport encryption is automatic** - no configuration needed
- **Server never sees your files** - only facilitates peer discovery
- **Direct peer-to-peer transfers** - no intermediary storage
- **Industry-standard encryption** - same technology as enterprise video conferencing

Your files are encrypted and secure during transfer. For maximum privacy, consider self-hosting the signaling server.

## Further Reading

- [WebRTC Security Architecture](https://www.ietf.org/rfc/rfc8827.html)
- [DTLS-SRTP Encryption](https://www.ietf.org/rfc/rfc5764.html)
- [PairDrop Documentation](https://github.com/schlagmichdoch/PairDrop)
- [WebRTC Security Considerations](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Security)

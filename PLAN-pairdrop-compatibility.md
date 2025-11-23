# Plan: PairDrop Protocol Compatibility

**Goal**: Make the plugin fully compatible with PairDrop web/mobile apps so files can be transferred between Obsidian vaults and any PairDrop client.

## Current State

The plugin uses a custom protocol that only works plugin-to-plugin:
```
header → transfer-accepted → file-start → chunks → file-end → transfer-complete
```

## Target State

Implement PairDrop's actual protocol from `network.js`:
```
request → files-transfer-response → header → partition → chunks → partition-received → file-transfer-complete
```

---

## Phase 1: Understand PairDrop Protocol

Reference: `/Users/gm/Projects/PairDrop/public/scripts/network.js`

### Sending Files (lines 436-514)

1. **Request** (`requestFileTransfer` method):
```javascript
{
  type: 'request',
  header: [{ name, mime, size }, ...],  // Array of file metadata
  totalSize: number,
  imagesOnly: boolean,
  thumbnailDataUrl: string  // Base64 thumbnail of first image (optional)
}
```

2. **Wait for response** - Receiver sends `files-transfer-response`

3. **Send files** - For each file:
   - Send `header`: `{ type: 'header', size, name, mime }`
   - Send chunks via `FileChunker` (64KB chunks, 1MB partitions)
   - At partition end, send `{ type: 'partition', offset }`
   - Wait for `{ type: 'partition-received', offset }` before next partition
   - Receiver sends `{ type: 'file-transfer-complete' }` when file done

4. **Progress** - Receiver sends `{ type: 'progress', progress: 0-1 }`

### Receiving Files (lines 560-664)

1. **Receive `request`** - Show accept/reject dialog
2. **Send response**: `{ type: 'files-transfer-response', accepted: boolean }`
3. **Receive each file**:
   - `header` - Create `FileDigester`
   - Binary chunks - Feed to digester
   - `partition` - Send `partition-received` acknowledgment
   - Track progress, send `progress` updates
4. **File complete** - Send `file-transfer-complete`

### Key Classes (lines 1235-1313)

- `FileChunker`: Reads file in 64KB chunks, groups into 1MB partitions
- `FileDigester`: Reassembles chunks into file blob

---

## Phase 2: Implementation Tasks

### Task 1: Update Message Types (`src/types.ts`)

Add PairDrop-compatible message interfaces:
```typescript
interface PairDropRequest {
  type: 'request';
  header: { name: string; mime: string; size: number }[];
  totalSize: number;
  imagesOnly: boolean;
  thumbnailDataUrl?: string;
}

interface PairDropFileHeader {
  type: 'header';
  name: string;
  mime: string;
  size: number;
}

interface PairDropPartition {
  type: 'partition';
  offset: number;
}

interface PairDropTransferResponse {
  type: 'files-transfer-response';
  accepted: boolean;
  reason?: string;  // e.g., 'ios-memory-limit'
}
```

### Task 2: Rewrite Sender Logic (`src/rtc-peer.ts`)

Replace `sendFiles()` method:

1. Build request with file headers
2. Send `request` message
3. Wait for `files-transfer-response`
4. For each file:
   - Send `header` (single file metadata)
   - Implement partition-based chunking:
     - Send 64KB chunks
     - Every 1MB, send `partition` and wait for `partition-received`
   - Wait for `file-transfer-complete` before next file
5. Track receiver's `progress` messages for UI

### Task 3: Rewrite Receiver Logic (`src/rtc-peer.ts`)

Replace incoming message handlers:

1. Handle `request`:
   - Store pending request
   - Trigger `transfer-request` event for UI
2. On accept, send `files-transfer-response`
3. Handle `header`:
   - Initialize buffer for current file
4. Handle binary chunks:
   - Accumulate in buffer
   - Send `progress` updates periodically
5. Handle `partition`:
   - Send `partition-received` acknowledgment
6. When file complete:
   - Send `file-transfer-complete`
   - Emit `file-received` event

### Task 4: Update UI Events (`src/main.ts`, `src/peer-manager.ts`)

- Map new events to existing UI
- Handle `progress` from receiver (currently only sender tracks progress)
- Ensure `transfer-request` event carries correct data format

### Task 5: Handle Folder Transfers

PairDrop doesn't natively support folder structure. Options:
- **Option A**: Flatten to files (lose structure) - Compatible with web app
- **Option B**: Include path in filename or custom field - Plugin-to-plugin only
- **Option C**: Detect peer type, use appropriate method

Recommend: Option A for web compatibility, keep current behavior for plugin-to-plugin transfers (detect by checking if peer sends our custom messages).

### Task 6: Thumbnail Generation (Optional)

PairDrop shows image thumbnails in transfer requests. Low priority but nice UX:
- Generate thumbnail for first image file
- Convert to base64 data URL
- Include in `request` message

---

## Phase 3: Testing Matrix

| Sender | Receiver | Test |
|--------|----------|------|
| Plugin | Plugin | Verify still works |
| Plugin | PairDrop Web | Send file to browser |
| PairDrop Web | Plugin | Receive file from browser |
| Plugin | PairDrop Mobile | Send to phone |
| PairDrop Mobile | Plugin | Receive from phone |

### Test Cases

1. Single small file (<1MB)
2. Single large file (>1MB, tests partitioning)
3. Multiple files
4. Image file (thumbnail display)
5. Cancel mid-transfer
6. Reject transfer request
7. Network interruption

---

## Phase 4: Edge Cases

1. **iOS memory limit**: PairDrop rejects transfers >200MB on iOS Safari
2. **Display name sync**: Send `display-name-changed` when name updates
3. **Text messages**: PairDrop supports text sharing (future feature)
4. **WS fallback**: When WebRTC fails, PairDrop relays through server (low priority)

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/types.ts` | Add PairDrop message interfaces |
| `src/rtc-peer.ts` | Rewrite send/receive logic |
| `src/peer-manager.ts` | Update event handling |
| `src/main.ts` | Minor event mapping updates |
| `src/modals/incoming-transfer-modal.ts` | Handle thumbnail display (optional) |

---

## Estimated Effort

- Phase 1 (Understanding): Done via this analysis
- Phase 2 (Implementation): ~2-3 hours
- Phase 3 (Testing): ~1 hour
- Phase 4 (Edge cases): As needed

---

## References

- PairDrop network.js: `/Users/gm/Projects/PairDrop/public/scripts/network.js`
- FileChunker: lines 1235-1283
- FileDigester: lines 1285-1313
- Peer class: lines 322-720
- RTCPeer class: lines 722-938

---

## Starting Point

Begin new session with:

```
I'm working on the PeerDrop Obsidian plugin. I need to implement PairDrop
protocol compatibility so the plugin can transfer files with PairDrop
web/mobile apps.

See PLAN-pairdrop-compatibility.md for the full plan.

Start with Task 1: Update message types in src/types.ts
```

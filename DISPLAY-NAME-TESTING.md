# Display Name Change Feature - Testing Scenarios

This document outlines testing scenarios for the display name change feature implementation.

## Prerequisites

- Two Obsidian instances running the P2P Share plugin
- Both connected to the same PairDrop server
- (Optional) PairDrop web app open in a browser for cross-platform testing

## Test Scenarios

### 1. Basic Incoming Name Change (From PairDrop Web)

**Setup:**
- Open PairDrop web app (https://pairdrop.net or your server)
- Open Obsidian with P2P Share plugin
- Both should see each other

**Steps:**
1. In PairDrop web, click the settings icon
2. Change the display name to "TestBrowser"
3. Observe the Obsidian plugin

**Expected Results:**
- ✅ Peer name in Obsidian updates to "TestBrowser" without manual refresh
- ✅ If Peer Modal is open, the peer list updates automatically
- ✅ No errors in console

---

### 2. Basic Outgoing Name Change (From Obsidian)

**Setup:**
- Two Obsidian instances connected to same server
- Both can see each other as peers

**Steps:**
1. In Obsidian #1, go to Settings → P2P Share
2. Find "Display name" field under "Connection Status"
3. Enter "MyCustomName" and blur the field (click away)
4. Observe Obsidian #2

**Expected Results:**
- ✅ Obsidian #1 shows notice: "P2P Share: Display name changed to MyCustomName"
- ✅ Obsidian #2 shows Obsidian #1 as "MyCustomName" in peer list
- ✅ Name persists in settings after reload
- ✅ No errors in console

---

### 3. Name Change During Active File Transfer

**Setup:**
- Two Obsidian instances connected
- Start a file transfer from Instance #1 to Instance #2

**Steps:**
1. In Obsidian #1, share a large file (or folder with multiple files)
2. Obsidian #2 accepts the transfer (TransferModal opens)
3. **During transfer**, in Obsidian #1, change display name to "TransferTest"
4. Observe the TransferModal in Obsidian #2

**Expected Results:**
- ✅ The "From: [name]" field in TransferModal updates to "TransferTest" in real-time
- ✅ Transfer continues without interruption
- ✅ No errors or UI glitches

---

### 4. Name Change Before Accepting Transfer

**Setup:**
- Two Obsidian instances connected
- Prepare to send a file

**Steps:**
1. Obsidian #1 sends a file to Obsidian #2
2. Obsidian #2 sees IncomingTransferModal (don't accept yet)
3. **Before accepting**, in Obsidian #1, change name to "QuickChange"
4. Observe IncomingTransferModal in Obsidian #2
5. Accept or decline the transfer

**Expected Results:**
- ✅ The "From: [name]" field updates to "QuickChange" immediately
- ✅ If it's a paired device, auto-accept checkbox label updates
- ✅ Transfer can still be accepted/declined normally
- ✅ No errors

---

### 5. Paired Device Name Persistence

**Setup:**
- Two Obsidian instances
- Pair them using "Pair with device" command

**Steps:**
1. Complete device pairing between Instance #1 and #2
2. Verify both show in Settings → Paired Devices
3. In Instance #1, change display name to "PairedTest"
4. Check Settings → Paired Devices in Instance #2

**Expected Results:**
- ✅ Instance #2's paired device list shows Instance #1 as "PairedTest"
- ✅ Name persists in settings JSON (check `.obsidian/plugins/p2p-share/data.json`)
- ✅ After reloading Obsidian, paired device still shows as "PairedTest"
- ✅ Name survives reconnection to server

---

### 6. Name Change with Paired Device Auto-Accept

**Setup:**
- Two paired Obsidian instances
- Instance #2 has auto-accept enabled for Instance #1

**Steps:**
1. In Instance #1, change name to "AutoAcceptor"
2. Send a file from Instance #1 to Instance #2
3. Observe the notice in Instance #2

**Expected Results:**
- ✅ Notice says: "P2P Share: Auto-accepting transfer from AutoAcceptor"
- ✅ File is auto-accepted and downloaded
- ✅ Correct name shown throughout transfer

---

### 7. Input Validation - Empty Name

**Setup:**
- Obsidian with P2P Share plugin running

**Steps:**
1. Go to Settings → P2P Share → Display name
2. Enter "   " (only spaces)
3. Try to blur the field

**Expected Results:**
- ✅ No notice shown (empty names rejected)
- ✅ No message sent to peers
- ✅ Settings not updated

---

### 8. Input Validation - Very Long Name

**Setup:**
- Obsidian with P2P Share plugin running

**Steps:**
1. Go to Settings → P2P Share → Display name
2. Enter a name with 60+ characters
3. Blur the field

**Expected Results:**
- ✅ Name is truncated to 50 characters
- ✅ Peers receive the truncated version
- ✅ Notice shows truncated name

---

### 9. Input Validation - HTML/Script Injection

**Setup:**
- Obsidian with P2P Share plugin running
- Another Obsidian instance or PairDrop web to receive

**Steps:**
1. In Settings → Display name, enter: `<script>alert('xss')</script>`
2. Blur the field
3. Observe receiving peer

**Expected Results:**
- ✅ HTML tags are stripped
- ✅ Receiving peer shows clean text (no script execution)
- ✅ No XSS vulnerability

---

### 10. Name Change in Discovery Mode Switch

**Setup:**
- Two Obsidian instances, both in "Auto-discover on network" mode
- One paired device available

**Steps:**
1. In Instance #1, change name to "BeforeSwitch"
2. Switch Instance #1 to "Paired devices only" mode
3. Switch back to "Auto-discover on network"
4. Verify Instance #2 still sees updated name

**Expected Results:**
- ✅ Name persists through discovery mode changes
- ✅ No name reset to defaults
- ✅ Both modes show correct custom name

---

### 11. Multilingual Display Name

**Setup:**
- Obsidian instances with different locale settings

**Steps:**
1. Change Obsidian #1 language to French (or Russian/Chinese)
2. Set display name to "测试用户" (Chinese) or "Тест" (Russian)
3. Observe on Obsidian #2 (English locale)

**Expected Results:**
- ✅ Unicode characters display correctly
- ✅ No encoding issues
- ✅ Name shows consistently across locales

---

### 12. Reconnection Persistence

**Setup:**
- Two Obsidian instances connected
- Instance #1 has custom display name

**Steps:**
1. Set display name to "ReconnectTest" in Instance #1
2. In Instance #1, click "Disconnect" from status bar menu
3. Wait 5 seconds
4. Click "Connect" from status bar menu
5. Observe Instance #2

**Expected Results:**
- ✅ After reconnection, Instance #2 still sees "ReconnectTest"
- ✅ Name doesn't reset to default device name
- ✅ Paired devices maintain updated name

---

### 13. Multiple Simultaneous Name Changes

**Setup:**
- Three Obsidian instances connected to same server

**Steps:**
1. Change name in Instance #1 to "Device1"
2. Immediately change name in Instance #2 to "Device2"
3. Immediately change name in Instance #3 to "Device3"
4. Observe all three instances

**Expected Results:**
- ✅ All instances show correct names for all peers
- ✅ No race conditions or name conflicts
- ✅ No stale names displayed

---

### 14. Cross-Platform Compatibility (PairDrop Web ↔ Obsidian)

**Setup:**
- PairDrop web app in browser
- Obsidian with P2P Share plugin

**Steps:**
1. In browser, change PairDrop name to "WebBrowser"
2. Observe Obsidian
3. In Obsidian, change name to "ObsidianVault"
4. Observe browser

**Expected Results:**
- ✅ Obsidian receives name change from browser
- ✅ Browser receives name change from Obsidian (if PairDrop supports it)
- ✅ Full bidirectional compatibility maintained

---

### 15. Name Change with No Active Connections

**Setup:**
- Single Obsidian instance, no peers connected

**Steps:**
1. In Settings, change display name to "SoloTest"
2. Observe console and UI

**Expected Results:**
- ✅ Settings saved successfully
- ✅ Notice shown: "P2P Share: Display name changed to SoloTest"
- ✅ No errors about "no peers to broadcast to"
- ✅ When peer connects later, they see "SoloTest"

---

## Edge Cases to Verify

### A. Special Characters
- Test names with: `!@#$%^&*()_+-=[]{}|;:'",.<>?/`
- **Expected**: Non-alphanumeric characters should work (not stripped unless HTML)

### B. Emoji Support
- Test name: "MyDevice 🚀"
- **Expected**: Emojis should display correctly (Unicode support)

### C. Same Name as Another Peer
- Two peers set identical display names
- **Expected**: Both work fine (peerId is the unique identifier internally)

### D. Rapid Name Changes
- Change name 5 times in quick succession
- **Expected**: Last name wins, no message queuing issues

---

## Console Logging Verification

When testing, check the console with log level set to "Debug":

**Expected Debug Logs (Sender):**
```
P2P Share: Sending display name change to peer [peerId] [newName]
```

**Expected Debug Logs (Receiver):**
```
P2P Share: Peer changed display name to [newName]
P2P Share: Peer name changed {peerId: "...", displayName: "..."}
```

---

## Regression Testing

Ensure existing functionality still works:

1. ✅ Normal file transfers work
2. ✅ Folder transfers work
3. ✅ Pairing devices works
4. ✅ Unpairing devices works
5. ✅ Auto-accept still functions
6. ✅ Discovery mode switching works
7. ✅ All modals render correctly
8. ✅ Status bar updates correctly

---

## Known Limitations

1. **Server-assigned name**: The display name change is client-side only. The PairDrop server may still assign its own name initially, which gets overridden by custom name.

2. **Timing**: If a name change happens before WebRTC connection is established, the old name might briefly appear before updating.

3. **Browser compatibility**: PairDrop web may or may not support outgoing name changes (depends on PairDrop version).

---

## Files Changed (for reference)

- `src/types.ts` - Added PairDropDisplayNameChanged interface
- `src/rtc-peer.ts` - Added handlers for display-name-changed messages
- `src/peer-manager.ts` - Added roomSecret tracking and broadcast method
- `src/main.ts` - Added event handlers and UI coordination
- `src/settings.ts` - Added display name input field
- `src/modals/transfer-modal.ts` - Added updatePeerName() method
- `src/modals/incoming-transfer-modal.ts` - Added updatePeerName() method
- `src/i18n/locales/*.ts` - Added translations for 4 languages

---

## Success Criteria

All tests pass with:
- ✅ No TypeScript compilation errors
- ✅ No runtime errors in console
- ✅ Smooth UI updates without flicker
- ✅ Correct internationalization
- ✅ Data persistence across reloads
- ✅ Cross-platform compatibility with PairDrop

# Implementation Walkthrough: Fix Server Build Errors

## Run: run-002  
## Work Item: fix-server-build-errors-main
## Date: 2026-01-31

---

## Overview

This run fixed the SpacetimeDB server build compilation errors and updated the client to use the new SDK API. The server was already fixed in previous work - this run focused on client-side fixes.

---

## Problem Statement

The client was failing to build with the error:
```
The requested module '/node_modules/.vite/deps/@clockworklabs_spacetimedb-sdk.js' 
does not provide an export named 'SpacetimeDBClient'
```

This occurred because:
1. The client was using the old SDK API (`SpacetimeDBClient` class)
2. The installed SDK v1.3.3 uses a completely new API (`DbConnection.builder()`)
3. No generated TypeScript types existed for the module

---

## Solution

### Step 1: Verify Server Build

First, confirmed the server module compiles successfully:
```bash
cd Game/server
spacetime build
# Result: Build finished successfully.
```

### Step 2: Generate TypeScript Types

Generated TypeScript bindings from the server module:
```bash
spacetime generate --lang typescript --out-dir /tmp/generated
cp -r /tmp/generated/* Game/client/src/generated/
```

This created 54 generated files including:
- Table row types (PlayerState, WorldItem, NpcState, etc.)
- Reducer argument types
- DbConnection class with proper typing

### Step 3: Update Package Dependencies

Changed `Game/client/package.json`:
```diff
- "@clockworklabs/spacetimedb-sdk": "^1.0.0"
+ "spacetimedb": "^1.0.0"
```

### Step 4: Rewrite App.tsx

**Old API (broken):**
```typescript
import { SpacetimeDBClient } from '@clockworklabs/spacetimedb-sdk'
const client = new SpacetimeDBClient('ws://localhost:3000', 'cozy-mmo-server')
client.onConnect((token, identity) => { ... })
client.on('player_state', (row) => { ... })
client.reducers.createAccount()
```

**New API (fixed):**
```typescript
import { DbConnection } from './generated'
const connection = DbConnection.builder()
  .withUri('ws://localhost:3000')
  .withModuleName('cozy-mmo-server')
  .onConnect((ctx, identity, token) => { ... })
  .build()
connection.db.playerState.onInsert((ctx, row) => { ... })
connection.reducers.createAccount({})
```

Key changes:
1. Import from generated types instead of SDK package
2. Use `DbConnection.builder()` pattern
3. Table listeners use `onInsert/onUpdate/onDelete` with callback context
4. Reducers take named arguments as objects
5. Type conversions: numbers vs BigInt handling

---

## Files Modified

| File | Changes |
|------|---------|
| Game/client/package.json | Updated SDK dependency |
| Game/client/src/App.tsx | Complete rewrite for new API |
| Game/client/src/generated/* | 54 new generated type files |

---

## Build Results

**Server**: ✅ Success
**Client**: ✅ Success  
**TypeScript**: ✅ No errors

---

## Lessons Learned

1. The SpacetimeDB SDK v1.0+ has significant API changes from v0.x
2. Always generate TypeScript types from the server module for client development
3. Reducer arguments must match the generated type definitions exactly
4. BigInt vs Number types require careful attention in the new SDK

---

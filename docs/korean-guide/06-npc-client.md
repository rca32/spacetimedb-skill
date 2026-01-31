# SpacetimeDB 한국어 개발 가이드 - 06. NPC, AI, 웹 클라이언트 및 배포

이 문서에서는 AI NPC 시스템, React 웹 클라이언트 구현, 그리고 최종 배포 방법을 다룹니다.

## 📋 목차

1. [NPC 시스템 아키텍처](#1-npc-시스템-아키텍처)
2. [테이블 설계](#2-테이블-설계)
3. [NPC 리듀서](#3-npc-리듀서)
4. [대화 시스템](#4-대화-시스템)
5. [웹 클라이언트 구조](#5-웹-클라이언트-구조)
6. [클라이언트 구현](#6-클라이언트-구현)
7. [구독과 실시간 동기화](#7-구독과-실시간-동기화)
8. [빌드 및 배포](#8-빌드-및-배포)
9. [문제 해결](#9-문제-해결)

---

## 1. NPC 시스템 아키텍처

### 1.1 NPC의 역할

NPC (Non-Player Character)는 게임 세계를 생동감 있게 만드는 핵심 요소입니다.

**Cozy MMO의 NPC 종류:**

| 타입 | 역할 | 예시 |
|------|------|------|
| **Villager** | 배경 NPC | 마을 주민 |
| **Merchant** | 상인 | 아이템 거래 |
| **QuestGiver** | 퀘스트 제공 | 모험가 길드장 |

### 1.2 시스템 흐름

```
┌─────────────┐      spawn_npc()      ┌──────────────┐
│   init()    │ ─────────────────────→ │   NpcState   │
│  (초기화)    │                        │  (NPC 생성)   │
└─────────────┘                        └──────────────┘
                                              │
                     start_conversation()     │
┌─────────────┐ ←─────────────────────────────┘
│   Player    │
│  (플레이어)  │      send_message()      ┌──────────────┐
└─────────────┘ ─────────────────────────→ │   NpcConversation  │
       │                                   │   (대화 세션)   │
       │ ←─────────────────────────────────┘
       │              AI Response
       │
       │         end_conversation()
       └────────────────────────────────→ (세션 종료)
```

---

## 2. 테이블 설계

### 2.1 NpcState (NPC 상태) - Public

```rust
pub const NPC_TYPE_VILLAGER: u8 = 1;
pub const NPC_TYPE_MERCHANT: u8 = 2;
pub const NPC_TYPE_QUEST_GIVER: u8 = 3;
pub const NPC_STATUS_ACTIVE: u8 = 1;

#[table(name = "npc_state", public)]
pub struct NpcState {
    #[primary_key]
    pub npc_id: u64,
    pub name: String,
    pub npc_type: u8,
    pub hex_q: i32,        // 헥스 위치
    pub hex_r: i32,
    pub region_id: u64,
    pub status: u8,
    pub created_at: Timestamp,
}
```

### 2.2 NpcMemoryShort (NPC 기억) - Private

```rust
#[table(name = "npc_memory_short")]
pub struct NpcMemoryShort {
    #[primary_key]
    pub npc_id: u64,
    #[primary_key]
    pub player_identity: Identity,
    pub last_interaction: Timestamp,
    pub affinity: i32,     // 친밀도 (-100 ~ 100)
    pub last_topic: Option<String>,
}
```

### 2.3 NpcConversationSession (대화 세션) - Private

```rust
#[table(name = "npc_conversation_session")]
pub struct NpcConversationSession {
    #[primary_key]
    #[auto_inc]
    pub conversation_id: u64,
    pub npc_id: u64,
    pub player_identity: Identity,
    pub started_at: Timestamp,
    pub is_active: bool,
}
```

### 2.4 NpcConversationTurn (대화 내역) - Private

```rust
#[table(name = "npc_conversation_turn")]
pub struct NpcConversationTurn {
    #[primary_key]
    #[auto_inc]
    pub turn_id: u64,
    pub conversation_id: u64,
    pub is_player: bool,   // true = 플레이어, false = NPC
    pub message: String,
    pub sentiment: i8,     // -1 = 부정, 0 = 중립, 1 = 긍정
    pub timestamp: Timestamp,
}
```

---

## 3. NPC 리듀서

### 3.1 init - 초기 NPC 생성

```rust
#[reducer]
pub fn init(ctx: &ReducerContext) {
    log::info!("Initializing world with NPCs...");

    // Villagers
    spawn_npc_internal(ctx, 1001u64, "Alice".to_string(), NPC_TYPE_VILLAGER, 2, 0, 1);
    spawn_npc_internal(ctx, 1002u64, "Bob".to_string(), NPC_TYPE_VILLAGER, -2, 1, 1);
    spawn_npc_internal(ctx, 1003u64, "Charlie".to_string(), NPC_TYPE_VILLAGER, 0, -2, 1);
    
    // Merchants
    spawn_npc_internal(ctx, 2001u64, "Trader Joe".to_string(), NPC_TYPE_MERCHANT, 4, 0, 1);
    spawn_npc_internal(ctx, 2002u64, "Merchant Mary".to_string(), NPC_TYPE_MERCHANT, -2, -2, 1);
    
    // Quest Givers
    spawn_npc_internal(ctx, 3001u64, "Quest Master".to_string(), NPC_TYPE_QUEST_GIVER, 1, 1, 1);

    log::info!("World initialized with NPCs");
}

fn spawn_npc_internal(
    ctx: &ReducerContext,
    npc_id: u64,
    name: String,
    npc_type: u8,
    hex_q: i32,
    hex_r: i32,
    region_id: u64,
) {
    if ctx.db.npc_state().npc_id().find(&npc_id).is_some() {
        return;
    }

    ctx.db.npc_state().insert(NpcState {
        npc_id,
        name: name.clone(),
        npc_type,
        hex_q,
        hex_r,
        region_id,
        status: NPC_STATUS_ACTIVE,
        created_at: ctx.timestamp,
    });

    log::info!("Spawned NPC {} ({}) at ({}, {})", npc_id, name, hex_q, hex_r);
}
```

### 3.2 despawn_npc - NPC 제거

```rust
#[reducer]
pub fn despawn_npc(ctx: &ReducerContext, npc_id: u64) {
    // NPC 상태 확인
    let Some(npc) = ctx.db.npc_state().npc_id().find(&npc_id) else {
        log::error!("Despawn failed: NPC {} not found", npc_id);
        return;
    };

    // 활성 대화 세션 종료
    for session in ctx.db.npc_conversation_session().npc_id().filter(npc_id) {
        if session.is_active {
            ctx.db.npc_conversation_session().conversation_id().update(
                NpcConversationSession {
                    is_active: false,
                    ..session
                }
            );
        }
    }

    // NPC 삭제
    ctx.db.npc_state().npc_id().delete(&npc_id);
    
    log::info!("Despawned NPC {}", npc_id);
}
```

### 3.3 NPC 자동 배회

```rust
use spacetimedb::{table, reducer, schedule};

#[table(name = "wander_timer", scheduled)]
pub struct WanderTimer {
    #[primary_key]
    #[auto_inc]
    pub scheduled_id: u64,
    pub scheduled_at: ScheduleAt,
    pub last_run: Timestamp,
}

#[reducer]
pub fn wander_npcs(ctx: &ReducerContext, _timer: WanderTimer) {
    for npc in ctx.db.npc_state().iter() {
        // 30% 확률로 이동
        if ctx.random::<u8>() % 100 < 30 {
            let directions = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)];
            let idx = (ctx.random::<u8>() % 6) as usize;
            let (dq, dr) = directions[idx];
            
            let new_q = npc.hex_q + dq;
            let new_r = npc.hex_r + dr;
            
            // 다른 NPC나 플레이어가 없는지 확인
            if !is_position_occupied(ctx, new_q, new_r) {
                ctx.db.npc_state().npc_id().update(NpcState {
                    hex_q: new_q,
                    hex_r: new_r,
                    ..npc
                });
                
                log::debug!("NPC {} wandered to ({}, {})", npc.npc_id, new_q, new_r);
            }
        }
    }
}

fn is_position_occupied(ctx: &ReducerContext, q: i32, r: i32) -> bool {
    // 플레이어 확인
    for player in ctx.db.player_state().iter() {
        if player.hex_q == q && player.hex_r == r {
            return true;
        }
    }
    // NPC 확인
    for npc in ctx.db.npc_state().iter() {
        if npc.hex_q == q && npc.hex_r == r {
            return true;
        }
    }
    false
}
```

---

## 4. 대화 시스템

### 4.1 start_conversation - 대화 시작

```rust
#[reducer]
pub fn start_conversation(ctx: &ReducerContext, npc_id: u64) {
    let player_identity = ctx.sender;
    
    // 1. 플레이어 확인
    let Some(player) = ctx.db.player_state().identity().filter(player_identity).next() else {
        log::error!("Conversation failed: Player not found");
        return;
    };
    
    // 2. NPC 확인
    let Some(npc) = ctx.db.npc_state().npc_id().find(&npc_id) else {
        log::error!("Conversation failed: NPC {} not found", npc_id);
        return;
    };
    
    // 3. 거리 확인 (인접한 헥스만)
    if !is_adjacent_hex(player.hex_q, player.hex_r, npc.hex_q, npc.hex_r) {
        log::error!("Conversation failed: Too far from NPC");
        return;
    }
    
    // 4. 이미 활성 대화가 있는지 확인
    let existing = ctx.db.npc_conversation_session()
        .iter()
        .find(|s| s.npc_id == npc_id && s.player_identity == player_identity && s.is_active);
    
    if existing.is_some() {
        log::info!("Conversation already active");
        return;
    }
    
    // 5. 새 대화 세션 생성
    let conversation_id = ctx.random();
    ctx.db.npc_conversation_session().insert(NpcConversationSession {
        conversation_id,
        npc_id,
        player_identity,
        started_at: ctx.timestamp,
        is_active: true,
    });
    
    // 6. NPC 기억 업데이트
    update_npc_memory(ctx, npc_id, player_identity);
    
    // 7. 인사말 생성
    let greeting = generate_npc_greeting(ctx, npc_id, player_identity);
    
    ctx.db.npc_conversation_turn().insert(NpcConversationTurn {
        turn_id: ctx.random(),
        conversation_id,
        is_player: false,
        message: greeting,
        sentiment: 1,  // 긍정적
        timestamp: ctx.timestamp,
    });
    
    log::info!("Started conversation {} with NPC {}", conversation_id, npc_id);
}

fn generate_npc_greeting(ctx: &ReducerContext, npc_id: u64, player_identity: Identity) -> String {
    let npc = ctx.db.npc_state().npc_id().find(&npc_id).unwrap();
    
    // NPC 타입별 인사말
    match npc.npc_type {
        NPC_TYPE_MERCHANT => format!("Welcome! I'm {}. Looking to trade?", npc.name),
        NPC_TYPE_QUEST_GIVER => format!("Greetings, adventurer! I'm {}. Need a quest?", npc.name),
        _ => {
            // 친밀도에 따른 인사말
            let memory = ctx.db.npc_memory_short()
                .iter()
                .find(|m| m.npc_id == npc_id && m.player_identity == player_identity);
            
            match memory {
                Some(m) if m.affinity > 50 => format!("Hello, friend! Good to see you again!"),
                Some(m) if m.affinity < -20 => format!("Oh... it's you again."),
                _ => format!("Hello, I'm {}. Nice to meet you!", npc.name),
            }
        }
    }
}
```

### 4.2 send_message - 메시지 전송

```rust
#[reducer]
pub fn send_message(ctx: &ReducerContext, conversation_id: u64, message: String) {
    let player_identity = ctx.sender;
    
    // 1. 대화 세션 확인
    let Some(mut session) = ctx.db.npc_conversation_session()
        .conversation_id()
        .find(&conversation_id) else {
        log::error!("Message failed: Conversation {} not found", conversation_id);
        return;
    };
    
    // 2. 플레이어 권한 확인
    if session.player_identity != player_identity {
        log::error!("Message failed: Not your conversation");
        return;
    }
    
    // 3. 활성 세션 확인
    if !session.is_active {
        log::error!("Message failed: Conversation ended");
        return;
    }
    
    // 4. 플레이어 메시지 저장
    let sentiment = analyze_sentiment(&message);
    ctx.db.npc_conversation_turn().insert(NpcConversationTurn {
        turn_id: ctx.random(),
        conversation_id,
        is_player: true,
        message: message.clone(),
        sentiment,
        timestamp: ctx.timestamp,
    });
    
    // 5. NPC 응답 생성
    let npc_response = generate_npc_response(ctx, &session, &message);
    
    ctx.db.npc_conversation_turn().insert(NpcConversationTurn {
        turn_id: ctx.random(),
        conversation_id,
        is_player: false,
        message: npc_response.message,
        sentiment: npc_response.sentiment,
        timestamp: ctx.timestamp,
    });
    
    // 6. 친밀도 업데이트
    update_affinity(ctx, session.npc_id, player_identity, sentiment);
    
    log::info!("Message exchanged in conversation {}", conversation_id);
}

fn analyze_sentiment(message: &str) -> i8 {
    let positive = ["good", "great", "awesome", "thanks", "love", "happy", "nice"];
    let negative = ["bad", "hate", "terrible", "awful", "angry", "stupid", "worst"];
    
    let msg_lower = message.to_lowercase();
    let pos_count = positive.iter().filter(|&&w| msg_lower.contains(w)).count();
    let neg_count = negative.iter().filter(|&&w| msg_lower.contains(w)).count();
    
    if pos_count > neg_count { 1 }
    else if neg_count > pos_count { -1 }
    else { 0 }
}

struct NpcResponse {
    message: String,
    sentiment: i8,
}

fn generate_npc_response(
    ctx: &ReducerContext,
    session: &NpcConversationSession,
    player_message: &str,
) -> NpcResponse {
    let npc = ctx.db.npc_state().npc_id().find(&session.npc_id).unwrap();
    let memory = ctx.db.npc_memory_short()
        .iter()
        .find(|m| m.npc_id == session.npc_id && m.player_identity == session.player_identity);
    
    let affinity = memory.map(|m| m.affinity).unwrap_or(0);
    
    // 키워드 기반 응답
    let msg_lower = player_message.to_lowercase();
    
    if msg_lower.contains("quest") || msg_lower.contains("mission") {
        if npc.npc_type == NPC_TYPE_QUEST_GIVER {
            return NpcResponse {
                message: "I have a quest for you! Defeat 3 goblins in the forest.".to_string(),
                sentiment: 1,
            };
        } else {
            return NpcResponse {
                message: "I don't give quests. Talk to the Quest Master!".to_string(),
                sentiment: 0,
            };
        }
    }
    
    if msg_lower.contains("trade") || msg_lower.contains("buy") || msg_lower.contains("sell") {
        if npc.npc_type == NPC_TYPE_MERCHANT {
            return NpcResponse {
                message: "I have wood, stone, and iron for sale. What do you need?".to_string(),
                sentiment: 1,
            };
        }
    }
    
    if msg_lower.contains("bye") || msg_lower.contains("goodbye") {
        return NpcResponse {
            message: "Goodbye! Come back soon!".to_string(),
            sentiment: 1,
        };
    }
    
    // 친밀도 기반 기본 응답
    let response = if affinity > 50 {
        "It's always a pleasure talking with you! What else is on your mind?"
    } else if affinity < -20 {
        "...What do you want now?"
    } else {
        "That's interesting. Tell me more."
    };
    
    NpcResponse {
        message: response.to_string(),
        sentiment: if affinity > 0 { 1 } else { 0 },
    }
}
```

### 4.3 end_conversation - 대화 종료

```rust
#[reducer]
pub fn end_conversation(ctx: &ReducerContext, conversation_id: u64) {
    let player_identity = ctx.sender;
    
    let Some(mut session) = ctx.db.npc_conversation_session()
        .conversation_id()
        .find(&conversation_id) else {
        return;
    };
    
    if session.player_identity != player_identity {
        return;
    }
    
    session.is_active = false;
    ctx.db.npc_conversation_session().conversation_id().update(session);
    
    log::info!("Ended conversation {}", conversation_id);
}
```

---

## 5. 웹 클라이언트 구조

### 5.1 프로젝트 구조

```
client/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
└── src/
    ├── main.tsx           # 앱 진입점
    ├── App.tsx            # 메인 게임 UI
    ├── App.css            # 스타일
    ├── components/        # 컴포넌트
    │   ├── HexGrid.tsx    # 헥스 그리드
    │   ├── Inventory.tsx  # 인벤토리 패널
    │   ├── NPCPanel.tsx   # NPC 대화 패널
    │   └── GameLog.tsx    # 게임 로그
    └── hooks/             # 커스텀 훅
        └── useSpacetime.ts
```

### 5.2 패키지 설치

```bash
cd client
npm install @clockworklabs/spacetimedb-sdk
npm install lucide-react  # 아이콘
```

---

## 6. 클라이언트 구현

### 6.1 main.tsx - 진입점

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### 6.2 App.tsx - 메인 컴포넌트

```typescript
import { useEffect, useState, useCallback } from 'react'
import { DbConnection } from './generated'
import HexGrid from './components/HexGrid'
import Inventory from './components/Inventory'
import NPCPanel from './components/NPCPanel'
import GameLog from './components/GameLog'
import './App.css'

function App() {
  const [conn, setConn] = useState<DbConnection | null>(null)
  const [player, setPlayer] = useState<any>(null)
  const [npcs, setNpcs] = useState<any[]>([])
  const [selectedNPC, setSelectedNPC] = useState<any>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [isConnected, setIsConnected] = useState(false)

  // 연결 설정
  useEffect(() => {
    const connection = DbConnection.builder()
      .withUri('ws://localhost:3000')
      .withModuleName('cozy-mmo-server')
      .onConnect((ctx, identity, token) => {
        console.log('Connected! Identity:', identity.toHexString())
        setIsConnected(true)
        addLog('Connected to server')
        
        // 구독 설정
        conn?.subscription(['SELECT * FROM player_state'])
        conn?.subscription(['SELECT * FROM npc_state'])
        conn?.subscription(['SELECT * FROM world_item'])
        
        // 로그인
        conn?.reducers.login()
      })
      .onDisconnect((ctx, error) => {
        console.log('Disconnected:', error)
        setIsConnected(false)
        addLog('Disconnected from server')
      })
      .build()

    setConn(connection)

    return () => {
      connection.disconnect()
    }
  }, [])

  // 플레이어 데이터 구독
  useEffect(() => {
    if (!conn) return

    const unsubscribe = conn.db.player_state.onChange((event) => {
      // 현재 플레이어 찾기
      const currentPlayer = conn.db.player_state.iter()
        .find(p => p.identity.toHexString() === conn.identity?.toHexString())
      
      if (currentPlayer) {
        setPlayer(currentPlayer)
      }
    })

    return unsubscribe
  }, [conn])

  // NPC 데이터 구독
  useEffect(() => {
    if (!conn) return

    const unsubscribe = conn.db.npc_state.onChange(() => {
      const allNpcs = Array.from(conn.db.npc_state.iter())
      setNpcs(allNpcs)
    })

    return unsubscribe
  }, [conn])

  // 로그 추가
  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev.slice(-49), `[${new Date().toLocaleTimeString()}] ${message}`])
  }, [])

  // 이동 핸들러
  const handleMove = (dq: number, dr: number) => {
    if (!conn || !player) return
    
    const targetQ = player.hex_q + dq
    const targetR = player.hex_r + dr
    
    conn.reducers.move_player(targetQ, targetR)
    addLog(`Moving to (${targetQ}, ${targetR})`)
  }

  // NPC 선택
  const handleSelectNPC = (npc: any) => {
    setSelectedNPC(npc)
    
    // 대화 시작
    if (conn) {
      conn.reducers.start_conversation(npc.npc_id)
      addLog(`Started conversation with ${npc.name}`)
    }
  }

  return (
    <div className="game-container">
      <header className="game-header">
        <h1>Cozy MMO</h1>
        <div className="connection-status">
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </header>

      <main className="game-main">
        <div className="game-area">
          <HexGrid 
            player={player}
            npcs={npcs}
            onMove={handleMove}
            onSelectNPC={handleSelectNPC}
          />
        </div>

        <aside className="game-sidebar">
          <Inventory conn={conn} player={player} />
          {selectedNPC && (
            <NPCPanel 
              conn={conn} 
              npc={selectedNPC}
              onClose={() => setSelectedNPC(null)}
            />
          )}
          <GameLog logs={logs} />
        </aside>
      </main>
    </div>
  )
}

export default App
```

### 6.3 HexGrid.tsx - 헥스 그리드

```typescript
interface HexGridProps {
  player: any
  npcs: any[]
  onMove: (dq: number, dr: number) => void
  onSelectNPC: (npc: any) => void
}

const HEX_DIRECTIONS = [
  { dq: 1, dr: 0, label: '→' },
  { dq: 1, dr: -1, label: '↗' },
  { dq: 0, dr: -1, label: '↖' },
  { dq: -1, dr: 0, label: '←' },
  { dq: -1, dr: 1, label: '↙' },
  { dq: 0, dr: 1, label: '↘' },
]

function HexGrid({ player, npcs, onMove, onSelectNPC }: HexGridProps) {
  if (!player) {
    return <div className="hex-grid-loading">Loading...</div>
  }

  const viewRadius = 3
  const hexes = []

  // 주변 헥스 생성
  for (let q = -viewRadius; q <= viewRadius; q++) {
    for (let r = -viewRadius; r <= viewRadius; r++) {
      if (Math.abs(q + r) <= viewRadius) {
        const worldQ = player.hex_q + q
        const worldR = player.hex_r + r
        
        // 해당 위치의 NPC 찾기
        const npcAtPos = npcs.find(n => n.hex_q === worldQ && n.hex_r === worldR)
        
        hexes.push({ q, r, worldQ, worldR, npcAtPos })
      }
    }
  }

  return (
    <div className="hex-grid">
      <div className="hex-container">
        {hexes.map(({ q, r, worldQ, worldR, npcAtPos }) => {
          const isPlayer = q === 0 && r === 0
          
          return (
            <div
              key={`${q},${r}`}
              className={`hex ${isPlayer ? 'hex-player' : ''} ${npcAtPos ? 'hex-npc' : ''}`}
              style={{
                left: `${50 + q * 60 + r * 30}%`,
                top: `${50 + r * 52}%`,
              }}
              onClick={() => npcAtPos && onSelectNPC(npcAtPos)}
            >
              <div className="hex-content">
                {isPlayer && <span className="player-icon">👤</span>}
                {npcAtPos && <span className="npc-icon">🤖</span>}
                <span className="hex-coords">{worldQ},{worldR}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="movement-controls">
        {HEX_DIRECTIONS.map((dir, idx) => (
          <button
            key={idx}
            className="move-btn"
            onClick={() => onMove(dir.dq, dir.dr)}
          >
            {dir.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default HexGrid
```

### 6.4 Inventory.tsx - 인벤토리 패널

```typescript
import { useEffect, useState } from 'react'

interface InventoryProps {
  conn: any
  player: any
}

function Inventory({ conn, player }: InventoryProps) {
  const [slots, setSlots] = useState<any[]>([])
  const [container, setContainer] = useState<any>(null)

  useEffect(() => {
    if (!conn || !player) return

    // 인벤토리 컨테이너 찾기
    const invContainer = conn.db.inventory_container
      .owner_entity_id()
      .filter(player.entity_id)
      .next()
    
    if (!invContainer) return

    setContainer(invContainer)

    // 슬롯 데이터 가져오기
    const updateSlots = () => {
      const slotData = []
      for (let i = 0; i < invContainer.max_slots; i++) {
        const slot = conn.db.inventory_slot
          .container_id()
          .filter(invContainer.container_id)
          .find((s: any) => s.slot_index === i)
        
        if (slot?.instance_id) {
          const instance = conn.db.item_instance
            .instance_id()
            .find(slot.instance_id)
          
          if (instance) {
            const itemDef = conn.db.item_def
              .item_def_id()
              .find(instance.item_def_id)
            
            slotData.push({
              index: i,
              item: itemDef,
              count: instance.stack_count,
            })
            continue
          }
        }
        
        slotData.push({ index: i, item: null, count: 0 })
      }
      setSlots(slotData)
    }

    updateSlots()

    // 변경 감지
    const unsubscribe = conn.db.inventory_slot.onChange(updateSlots)
    return unsubscribe
  }, [conn, player])

  if (!container) return <div className="inventory-loading">Loading inventory...</div>

  return (
    <div className="inventory-panel">
      <h3>Inventory ({slots.filter(s => s.item).length}/{container.max_slots})</h3>
      <div className="inventory-grid">
        {slots.map((slot) => (
          <div
            key={slot.index}
            className={`inventory-slot ${slot.item ? 'has-item' : 'empty'}`}
          >
            {slot.item && (
              <>
                <span className="item-icon">📦</span>
                <span className="item-name">{slot.item.name}</span>
                {slot.count > 1 && (
                  <span className="item-count">x{slot.count}</span>
                )}
              </>
            )}
            {!slot.item && <span className="slot-number">{slot.index + 1}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Inventory
```

### 6.5 NPCPanel.tsx - NPC 대화 패널

```typescript
import { useEffect, useState, useRef } from 'react'

interface NPCPanelProps {
  conn: any
  npc: any
  onClose: () => void
}

function NPCPanel({ conn, npc, onClose }: NPCPanelProps) {
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [conversationId, setConversationId] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 대화 메시지 구독
  useEffect(() => {
    if (!conn) return

    // 활성 대화 찾기
    const session = conn.db.npc_conversation_session
      .iter()
      .find((s: any) => s.npc_id === npc.npc_id && s.is_active)
    
    if (session) {
      setConversationId(session.conversation_id)
    }

    // 메시지 업데이트
    const updateMessages = () => {
      if (!session) return
      
      const turns = conn.db.npc_conversation_turn
        .conversation_id()
        .filter(session.conversation_id)
      
      setMessages(Array.from(turns).sort((a: any, b: any) => 
        a.timestamp - b.timestamp
      ))
    }

    updateMessages()
    const unsubscribe = conn.db.npc_conversation_turn.onChange(updateMessages)
    
    return () => {
      unsubscribe()
      // 대화 종료
      if (session) {
        conn.reducers.end_conversation(session.conversation_id)
      }
    }
  }, [conn, npc])

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || !conversationId || !conn) return
    
    conn.reducers.send_message(conversationId, input.trim())
    setInput('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend()
  }

  return (
    <div className="npc-panel">
      <div className="npc-header">
        <h3>🤖 {npc.name}</h3>
        <button onClick={onClose} className="close-btn">✕</button>
      </div>

      <div className="npc-messages">
        {messages.map((msg: any, idx: number) => (
          <div
            key={idx}
            className={`message ${msg.is_player ? 'player' : 'npc'}`}
          >
            <div className="message-bubble">
              {msg.message}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="npc-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  )
}

export default NPCPanel
```

### 6.6 App.css - 스타일

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.game-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #1a1a2e;
  color: #eee;
  font-family: 'Segoe UI', sans-serif;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: #16213e;
  border-bottom: 2px solid #0f3460;
}

.game-header h1 {
  color: #e94560;
}

.connection-status {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.connection-status[data-connected="true"] {
  background: #28a745;
}

.connection-status[data-connected="false"] {
  background: #dc3545;
}

.game-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.game-area {
  flex: 1;
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.game-sidebar {
  width: 320px;
  background: #16213e;
  border-left: 2px solid #0f3460;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  overflow-y: auto;
}

/* Hex Grid */
.hex-grid {
  flex: 1;
  position: relative;
  background: #0f3460;
  border-radius: 8px;
  overflow: hidden;
}

.hex-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.hex {
  position: absolute;
  width: 60px;
  height: 52px;
  background: #1a1a2e;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
  transform: translate(-50%, -50%);
}

.hex:hover {
  background: #533483;
}

.hex-player {
  background: #28a745 !important;
}

.hex-npc {
  background: #e94560 !important;
}

.hex-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 0.75rem;
}

.player-icon, .npc-icon {
  font-size: 1.5rem;
}

.hex-coords {
  font-size: 0.625rem;
  opacity: 0.7;
}

/* Movement Controls */
.movement-controls {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  padding: 1rem;
  max-width: 200px;
  margin: 0 auto;
}

.move-btn {
  padding: 0.75rem;
  background: #e94560;
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 1.25rem;
  cursor: pointer;
  transition: background 0.2s;
}

.move-btn:hover {
  background: #c73e54;
}

/* Inventory */
.inventory-panel {
  background: #0f3460;
  border-radius: 8px;
  padding: 1rem;
}

.inventory-panel h3 {
  margin-bottom: 0.75rem;
  color: #e94560;
}

.inventory-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
}

.inventory-slot {
  aspect-ratio: 1;
  background: #1a1a2e;
  border: 2px solid #533483;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  position: relative;
}

.inventory-slot.has-item {
  border-color: #28a745;
  background: #1a2e1a;
}

.inventory-slot .item-icon {
  font-size: 1.25rem;
}

.inventory-slot .item-name {
  font-size: 0.625rem;
  text-align: center;
}

.inventory-slot .item-count {
  position: absolute;
  bottom: 2px;
  right: 4px;
  background: #e94560;
  color: white;
  padding: 0 4px;
  border-radius: 2px;
  font-size: 0.625rem;
}

/* NPC Panel */
.npc-panel {
  background: #0f3460;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  max-height: 300px;
}

.npc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #533483;
}

.npc-header h3 {
  color: #e94560;
}

.close-btn {
  background: none;
  border: none;
  color: #eee;
  font-size: 1.25rem;
  cursor: pointer;
}

.npc-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.message {
  display: flex;
}

.message.player {
  justify-content: flex-end;
}

.message.npc {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 80%;
  padding: 0.5rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
}

.message.player .message-bubble {
  background: #e94560;
  color: white;
  border-bottom-right-radius: 4px;
}

.message.npc .message-bubble {
  background: #533483;
  color: white;
  border-bottom-left-radius: 4px;
}

.npc-input {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem;
  border-top: 1px solid #533483;
}

.npc-input input {
  flex: 1;
  padding: 0.5rem;
  background: #1a1a2e;
  border: 1px solid #533483;
  border-radius: 4px;
  color: white;
}

.npc-input button {
  padding: 0.5rem 1rem;
  background: #28a745;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
}

/* Game Log */
.game-log {
  background: #0f3460;
  border-radius: 8px;
  padding: 1rem;
  max-height: 150px;
  overflow-y: auto;
}

.game-log h3 {
  margin-bottom: 0.5rem;
  color: #e94560;
  font-size: 0.875rem;
}

.log-entry {
  font-size: 0.75rem;
  color: #aaa;
  margin-bottom: 0.25rem;
}
```

---

## 7. 구독과 실시간 동기화

### 7.1 구독(Subscription) 개념

**구독**은 클라이언트가 특정 데이터의 변경을 실시간으로 받아보는 메커니즘입니다.

```typescript
// SQL-like 쿼리로 구독
conn.subscription(['SELECT * FROM player_state'])
conn.subscription(['SELECT * FROM npc_state WHERE status = 1'])
conn.subscription(['SELECT * FROM world_item'])
```

### 7.2 데이터 변경 감지

```typescript
// 테이블 변경 이벤트 구독
const unsubscribe = conn.db.player_state.onChange((event) => {
  console.log('Player state changed:', event)
  
  // event.type: 'insert' | 'update' | 'delete'
  // event.row: 변경된 데이터
})

// 컴포넌트 언마운트 시 구독 해제
return () => unsubscribe()
```

### 7.3 필터링된 구독

```typescript
// 특정 조건의 데이터만 구독
conn.subscription([
  'SELECT * FROM player_state WHERE is_online = true',
  'SELECT * FROM npc_state WHERE hex_q > -10 AND hex_q < 10'
])
```

---

## 8. 빌드 및 배포

### 8.1 서버 빌드

```bash
cd server

# 디버그 빌드
cargo build --target wasm32-unknown-unknown

# 릴리즈 빌드 (권장)
cargo build --target wasm32-unknown-unknown --release

# SpacetimeDB에 배포
spacetime publish cozy-mmo-server

# 또는 업데이트
spacetime publish --update cozy-mmo-server
```

### 8.2 클라이언트 빌드

```bash
cd client

# 개발 서버
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과물은 dist/ 폴더에 생성
```

### 8.3 전체 실행 순서

```bash
# 1. 터미널 1: SpacetimeDB 서버 시작
spacetime start

# 2. 터미널 2: 서버 배포
cd server
spacetime publish cozy-mmo-server

# 3. 터미널 3: 클라이언트 개발 서버
cd client
npm run dev

# 브라우저에서 http://localhost:3001 접속
```

---

## 9. 문제 해결

### 9.1 WebSocket 연결 실패

```
❌ Error: WebSocket connection failed
```

**해결:**
```bash
# 1. SpacetimeDB 서버 실행 확인
spacetime start

# 2. 포트 확인 (3000이 사용 중이면 다른 포트)
spacetime start --listen 127.0.0.1:3001

# 3. 클라이언트에서 포트 수정
const conn = DbConnection.builder()
  .withUri('ws://localhost:3001')  // 포트 확인
  .build()
```

### 9.2 인증 실패

```
❌ Error: Identity not found
```

**해결:**
- 브라우저 쿠키/로컬스토리지 삭제
- SpacetimeDB 서버 재시작
- 모듈 재배포: `spacetime publish --update`

### 9.3 리듀서 호출 실패

```
❌ Error: Reducer not found: move_player
```

**해결:**
```bash
# 1. 서버 빌드 확인
cargo build --target wasm32-unknown-unknown

# 2. 모듈 재배포
spacetime publish --update cozy-mmo-server

# 3. 클라이언트 재생성 (필요시)
spacetime generate --lang typescript --out-dir client/src/generated
```

### 9.4 타입 오류

```
❌ Type error: Property 'reducers' does not exist
```

**해결:**
```bash
# TypeScript 타입 재생성
spacetime generate --lang typescript --out-dir client/src/generated

# 또는
npx spacetime generate --lang typescript
```

---

## 🎉 완성!

축하합니다! 이제 완전한 SpacetimeDB 기반 실시간 멀티플레이어 게임을 만들 수 있습니다.

### 배운 내용 요약

✅ **서버 (Rust + SpacetimeDB)**
- Table과 Reducer 설계
- 인증 및 세션 관리
- 헥스 그리드 이동 시스템
- 인벤토리 및 제작 시스템
- NPC와 AI 대화 시스템

✅ **클라이언트 (React + TypeScript)**
- SpacetimeDB SDK 연결
- 실시간 데이터 구독
- 헥스 그리드 시각화
- NPC 대화 UI
- 인벤토리 패널

✅ **배포**
- WebAssembly 빌드
- 로컬 개발 환경
- 문제 해결

---

## 📚 추가 자료

- [SpacetimeDB 공식 문서](https://spacetimedb.com/docs)
- [SpacetimeDB Discord 커뮤니티](https://discord.gg/clockwork-labs)
- [Rust Programming Language](https://www.rust-lang.org/)
- [React 공식 문서](https://react.dev/)

---

*이 가이드는 SpacetimeDB 0.1.8과 React 18을 기준으로 작성되었습니다.*
*만든 게임을 공유하고 싶다면 [SpacetimeDB Discord](https://discord.gg/clockwork-labs)에 자랑해주세요!* 🎮

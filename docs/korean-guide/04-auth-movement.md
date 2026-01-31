# SpacetimeDB 한국어 개발 가이드 - 04. 인증 및 플레이어 이동 시스템

이 문서에서는 실제로 작동하는 인증 시스템과 헥스 그리드 기반의 플레이어 이동 시스템을 구현합니다.

## 📋 목차

1. [인증 시스템 개요](#1-인증-시스템-개요)
2. [테이블 설계](#2-테이블-설계)
3. [로그인/로그아웃 리듀서](#3-로그인로그아웃-리듀서)
4. [세션 관리](#4-세션-관리)
5. [헥스 그리드 좌표계](#5-헥스-그리드-좌표계)
6. [플레이어 이동 시스템](#6-플레이어-이동-시스템)
7. [연결 해제 처리](#7-연결-해제-처리)

---

## 1. 인증 시스템 개요

### 1.1 SpacetimeDB 인증의 특징

SpacetimeDB는 기존의 "아이디/비밀번호" 방식과 다른 **Identity 기반 인증**을 사용합니다.

**전통적인 인증:**
```
클라이언트 → 서버: username + password
서버 → 데이터베이스: 사용자 확인
서버 → 클라이언트: JWT 토큰 발급
```

**SpacetimeDB 인증:**
```
클라이언트 → SpacetimeDB: 연결 시도
SpacetimeDB → 클라이언트: 자동으로 Identity 생성/할당
클라이언트 → 서버: 자동 인증됨 (Identity로 식별)
```

### 1.2 왜 Identity 기반인가?

| 장점 | 설명 |
|------|------|
| **자동화** | 개발자가 비밀번호 해싱, 세션 관리를 직접 구현할 필요 없음 |
| **보안** | 암호학적으로 안전한 Identity, 위조 불가능 |
| **편의성** | 클라이언트는 자동 인증, Identity는 영구적 |

---

## 2. 테이블 설계

### 2.1 Account 테이블 (Private)

```rust
use spacetimedb::{table, Identity, Timestamp};

#[table(name = "account")]
pub struct Account {
    #[primary_key]
    pub identity: Identity,
    pub created_at: Timestamp,
    pub is_active: bool,
}
```

**설명:**
- `identity`는 사용자의 고유 식별자 (자동 생성)
- `is_active`로 계정 비활성화 관리
- Private 테이블: 다른 사용자는 이 정보를 볼 수 없음

### 2.2 PlayerState 테이블 (Public)

```rust
#[table(name = "player_state", public)]
pub struct PlayerState {
    #[primary_key]
    pub entity_id: u64,      // 플레이어 고유 ID
    pub identity: Identity,   // 연결된 계정
    pub region_id: u64,       // 현재 지역
    pub level: u32,          // 레벨
    pub hex_q: i32,          // 헥스 그리드 q 좌표
    pub hex_r: i32,          // 헥스 그리드 r 좌표
    pub last_login: Timestamp,
    pub is_online: bool,     // 접속 상태
}
```

**설명:**
- `public`으로 설정: 모든 플레이어가 서로의 위치를 볼 수 있음
- `hex_q`, `hex_r`: 헥스 그리드 좌표 (axial coordinate system)
- `is_online`: 실시간 접속 상태

### 2.3 SessionState 테이블 (Private)

```rust
#[table(name = "session_state")]
pub struct SessionState {
    #[primary_key]
    #[auto_inc]
    pub session_id: u64,
    pub identity: Identity,
    pub entity_id: u64,
    pub connected_at: Timestamp,
    pub last_active: Timestamp,
}
```

**설명:**
- 현재 접속 중인 세션 추적
- `last_active`: 마지막 활동 시간 (AFK 감지에 사용)

---

## 3. 로그인/로그아웃 리듀서

### 3.1 create_account - 계정 생성

```rust
#[reducer]
pub fn create_account(ctx: &ReducerContext) {
    let identity = ctx.sender;

    // 이미 계정이 있는지 확인
    if ctx.db.account().identity().find(&identity).is_some() {
        log::info!("Account already exists for identity: {:?}", identity);
        return;
    }

    // 새 계정 생성
    ctx.db.account().insert(Account {
        identity,
        created_at: ctx.timestamp,
        is_active: true,
    });

    log::info!("Created new account for identity: {:?}", identity);
}
```

**핵심 포인트:**
1. `ctx.sender` - 리듀서를 호출한 사용자의 Identity
2. `ctx.db.account()` - account 테이블에 접근
3. `.find(&identity)` - primary key로 검색
4. 중복 계정 방지

### 3.2 login - 로그인

```rust
#[reducer]
pub fn login(ctx: &ReducerContext) {
    let identity = ctx.sender;

    // 1. 계정 존재 확인
    let Some(account) = ctx.db.account().identity().find(&identity) else {
        log::error!("Login failed: Account not found");
        return;
    };

    // 2. 계정 활성화 상태 확인
    if !account.is_active {
        log::error!("Login failed: Account is deactivated");
        return;
    }

    // 3. 플레이어 정보 확인
    let player = ctx.db.player_state().identity().filter(identity).next();
    let entity_id = player.as_ref().map(|p| p.entity_id);

    // 4. 새 세션 생성
    let session_id = ctx.random();  // 랜덤 ID 생성
    let now = ctx.timestamp;

    ctx.db.session_state().insert(SessionState {
        session_id,
        identity,
        entity_id: entity_id.unwrap_or(0),
        connected_at: now,
        last_active: now,
    });

    // 5. 플레이어 온라인 상태 업데이트
    if let Some(entity_id) = entity_id {
        if let Some(player) = ctx.db.player_state().entity_id().find(&entity_id) {
            ctx.db.player_state().entity_id().update(PlayerState {
                is_online: true,
                last_login: now,
                ..player  // 나머지 필드는 기존 값 유지
            });
        }
    }

    log::info!("Login successful for identity: {:?}", identity);
}
```

**핵심 포인트:**
1. `ctx.random()` - 안전한 랜덤 숫자 생성
2. `ctx.timestamp` - 현재 서버 시간
3. `..player` - 구조체 업데이트 시 나머지 필드 유지
4. 세션 관리로 접속 상태 추적

### 3.3 logout - 로그아웃

```rust
#[reducer]
pub fn logout(ctx: &ReducerContext, session_id: u64) {
    let identity = ctx.sender;

    // 1. 세션 찾기 및 검증
    let Some(session) = ctx.db.session_state().session_id().find(&session_id) else {
        log::error!("Logout failed: Session {} not found", session_id);
        return;
    };

    // 2. 세션 소유권 확인
    if session.identity != identity {
        log::error!("Logout failed: Session doesn't belong to this identity");
        return;
    }

    // 3. 세션 삭제
    ctx.db.session_state().session_id().delete(&session_id);

    // 4. 플레이어 오프라인 상태로 변경
    if let Some(player) = ctx.db.player_state().identity().filter(identity).next() {
        ctx.db.player_state().entity_id().update(PlayerState {
            is_online: false,
            ..player
        });
    }

    log::info!("Logout successful");
}
```

**핵심 포인트:**
1. 세션 소유권 검증 (보안)
2. `.delete()`로 테이블 행 삭제
3. 오프라인 상태 업데이트

---

## 4. 세션 관리

### 4.1 세션의 역할

세션(Session)은 사용자의 **현재 접속 상태**를 추적합니다.

```
┌─────────────┐        login()         ┌──────────────┐
│  클라이언트  │ ───────────────────────→ │   SessionState  │
│  (Identity) │                        │   (세션 생성)   │
└─────────────┘                        └──────────────┘
         │                                    │
         │        AFK 감지 또는              │
         │        disconnect 처리            │
         │                                    ↓
         │                            ┌──────────────┐
         │                            │  세션 삭제    │
         │                            │  (로그아웃)   │
         │                            └──────────────┘
```

### 4.2 다중 세션 처리

SpacetimeDB는 하나의 Identity로 여러 세션을 가질 수 있습니다:

```rust
// 예: 같은 계정으로 PC와 모바일에서 동시 접속
SessionState { session_id: 1001, identity: Identity_A, ... }
SessionState { session_id: 1002, identity: Identity_A, ... }  // 같은 사용자, 다른 세션
```

### 4.3 클라이언트 연결 해제 처리

```rust
use spacetimedb::client_disconnected;

#[client_disconnected]
pub fn handle_disconnect(ctx: &ReducerContext) {
    let identity = ctx.sender;
    
    // 해당 사용자의 모든 세션 삭제
    for session in ctx.db.session_state().iter() {
        if session.identity == identity {
            ctx.db.session_state().session_id().delete(&session.session_id);
        }
    }
    
    // 플레이어 오프라인 상태로 변경
    if let Some(player) = ctx.db.player_state().identity().filter(identity).next() {
        ctx.db.player_state().entity_id().update(PlayerState {
            is_online: false,
            ..player
        });
    }
    
    log::info!("Client disconnected: {:?}", identity);
}
```

---

## 5. 헥스 그리드 좌표계

### 5.1 왜 헥스 그리드인가?

**사각형 그리드 vs 헥스 그리드:**

```
사각형 (4방향):          헥스 (6방향):
  ┌─┬─┬─┐                ⬡ ⬡ ⬡
  │ │ │ │               ⬡ ⬡ ⬡ ⬡
  ├─┼─┼─┤                ⬡ ⬡ ⬡
  │ │ │ │
  └─┴─┴─┘
```

헥스 그리드의 장점:
- **동일한 거리**: 모든 이웃이 중심에서 같은 거리
- **자연스러운 이동**: 6방향 이동이 더 자연스러움
- **전략 게임에 최적**: XCOM, Civilization 등에서 사용

### 5.2 Axial 좌표계 (q, r)

SpacetimeDB Cozy MMO는 **axial coordinate system**을 사용합니다.

```
         (q: -1, r: -1)  (q: 0, r: -1)  (q: 1, r: -1)
                 ⬡           ⬡           ⬡
            ⬡           ⬡           ⬡
       (q: -1, r: 0)   (q: 0, r: 0)   (q: 1, r: 0)
                 ⬡           ⬡           ⬡
            ⬡           ⬡           ⬡
       (q: -1, r: 1)   (q: 0, r: 1)   (q: 1, r: 1)
```

**특징:**
- `q`: x축 방향 좌표
- `r`: z축 방향 좌표 (y는 계산됨: `s = -q - r`)
- 6방향 이동 가능

### 5.3 헥스 거리 계산

```rust
/// 두 헥스 좌표 사이의 거리 계산
fn hex_distance(q1: i32, r1: i32, q2: i32, r2: i32) -> i32 {
    let s1 = -q1 - r1;  // s 좌표 계산
    let s2 = -q2 - r2;
    
    // 세 좌표축(q, r, s)의 차이 중 최대값
    ((q1 - q2).abs() + (r1 - r2).abs() + (s1 - s2).abs()) / 2
}

/// 인접한 헥스인지 확인
fn is_adjacent_hex(from_q: i32, from_r: i32, to_q: i32, to_r: i32) -> bool {
    hex_distance(from_q, from_r, to_q, to_r) == 1
}
```

**예시:**
```
현재 위치: (0, 0)
목표: (1, 0)     → 거리 1 (인접) ✅
목표: (1, -1)    → 거리 1 (인접) ✅
목표: (2, 0)     → 거리 2 (인접 아님) ❌
```

---

## 6. 플레이어 이동 시스템

### 6.1 spawn_player - 플레이어 생성

```rust
#[reducer]
pub fn spawn_player(ctx: &ReducerContext, region_id: u64) {
    let identity = ctx.sender;

    // 1. 계정 확인
    if ctx.db.account().identity().find(&identity).is_none() {
        log::error!("Cannot spawn: Account not found");
        return;
    }

    // 2. 이미 스폰되었는지 확인
    if ctx.db.player_state().identity().filter(identity).next().is_some() {
        log::info!("Player already exists");
        return;
    }

    // 3. 새 엔티티 ID 생성
    let entity_id = ctx.random();

    // 4. 플레이어 상태 생성
    ctx.db.player_state().insert(PlayerState {
        entity_id,
        identity,
        region_id,
        level: 1,
        hex_q: 0,  // 중심에서 시작
        hex_r: 0,
        last_login: ctx.timestamp,
        is_online: true,
    });

    log::info!("Spawned player {} for identity: {:?}", entity_id, identity);
}
```

### 6.2 move_player - 플레이어 이동

```rust
#[reducer]
pub fn move_player(ctx: &ReducerContext, target_q: i32, target_r: i32) {
    let identity = ctx.sender;

    // 1. 플레이어 찾기
    let Some(player) = ctx.db.player_state().identity().filter(identity).next() else {
        log::error!("Move failed: Player not found");
        return;
    };

    // 2. 온라인 상태 확인
    if !player.is_online {
        log::error!("Move failed: Player is offline");
        return;
    }

    // 3. 인접한 헥스인지 검증
    if !is_adjacent_hex(player.hex_q, player.hex_r, target_q, target_r) {
        log::error!("Move failed: Target is not adjacent");
        return;
    }

    // 4. 충돌 검사 (다른 플레이어가 있는지)
    if is_hex_occupied(ctx, target_q, target_r, player.entity_id) {
        log::error!("Move failed: Target hex is occupied");
        return;
    }

    // 5. 위치 업데이트
    ctx.db.player_state().entity_id().update(PlayerState {
        hex_q: target_q,
        hex_r: target_r,
        ..player
    });

    log::info!("Player moved from ({}, {}) to ({}, {})", 
        player.hex_q, player.hex_r, target_q, target_r);
}

/// 해당 헥스에 다른 플레이어가 있는지 확인
fn is_hex_occupied(ctx: &ReducerContext, q: i32, r: i32, exclude_entity_id: u64) -> bool {
    for player in ctx.db.player_state().iter() {
        if player.entity_id != exclude_entity_id 
           && player.hex_q == q 
           && player.hex_r == r {
            return true;
        }
    }
    false
}
```

**이동 검증 로직:**
1. ✅ 플레이어가 존재하는가?
2. ✅ 온라인 상태인가?
3. ✅ 인접한 헥스인가? (거리 == 1)
4. ✅ 목표 위치가 비어있는가?

### 6.3 6방향 이동

```rust
// 헥스 그리드의 6방향
const HEX_DIRECTIONS: [(i32, i32); 6] = [
    (1, 0),    // 동쪽 (East)
    (1, -1),   // 북동쪽 (North-East)
    (0, -1),   // 북서쪽 (North-West)
    (-1, 0),   // 서쪽 (West)
    (-1, 1),   // 남서쪽 (South-West)
    (0, 1),    // 남동쪽 (South-East)
];

#[reducer]
pub fn move_player_direction(ctx: &ReducerContext, direction: u8) {
    let identity = ctx.sender;
    
    let Some(player) = ctx.db.player_state().identity().filter(identity).next() else {
        return;
    };
    
    // 방향 검증
    if direction >= 6 {
        log::error!("Invalid direction: {}", direction);
        return;
    }
    
    // 새 좌표 계산
    let (dq, dr) = HEX_DIRECTIONS[direction as usize];
    let target_q = player.hex_q + dq;
    let target_r = player.hex_r + dr;
    
    // 기존 move_player 호출
    move_player(ctx, target_q, target_r);
}
```

---

## 7. 연결 해제 처리

### 7.1 자동 연결 해제

SpacetimeDB는 클라이언트가 연결을 끊으면 자동으로 `client_disconnected`가 호출됩니다.

```rust
use spacetimedb::client_disconnected;

#[client_disconnected]
pub fn on_disconnect(ctx: &ReducerContext) {
    let identity = ctx.sender;
    let now = ctx.timestamp;
    
    log::info!("Client disconnected: {:?} at {}", identity, now);
    
    // 1. 세션 정리
    cleanup_sessions(ctx, identity);
    
    // 2. 플레이어 상태 업데이트
    if let Some(player) = ctx.db.player_state().identity().filter(identity).next() {
        ctx.db.player_state().entity_id().update(PlayerState {
            is_online: false,
            ..player
        });
    }
}

fn cleanup_sessions(ctx: &ReducerContext, identity: Identity) {
    // 해당 사용자의 모든 세션 삭제
    let sessions_to_delete: Vec<u64> = ctx.db.session_state()
        .iter()
        .filter(|s| s.identity == identity)
        .map(|s| s.session_id)
        .collect();
    
    for session_id in sessions_to_delete {
        ctx.db.session_state().session_id().delete(&session_id);
    }
}
```

### 7.2 AFK (Away From Keyboard) 감지

```rust
use spacetimedb::{table, reducer, schedule};

#[table(name = "afk_check", scheduled)]
pub struct AfkCheck {
    #[primary_key]
    #[auto_inc]
    id: u64,
    scheduled_at: ScheduleAt,
}

#[reducer]
pub fn check_afk(ctx: &ReducerContext, _check: AfkCheck) {
    let now = ctx.timestamp;
    let afk_threshold = spacetimedb::duration!("5min");  // 5분
    
    for session in ctx.db.session_state().iter() {
        let inactive_duration = now - session.last_active;
        
        if inactive_duration > afk_threshold {
            // AFK 처리: 세션 삭제, 오프라인 표시
            ctx.db.session_state().session_id().delete(&session.session_id);
            
            if let Some(player) = ctx.db.player_state().entity_id().find(&session.entity_id) {
                ctx.db.player_state().entity_id().update(PlayerState {
                    is_online: false,
                    ..player
                });
            }
            
            log::info!("Session {} timed out due to inactivity", session.session_id);
        }
    }
}
```

---

## 📝 정리

### 인증 흐름
```
1. create_account() → 계정 생성
2. login() → 세션 생성, 온라인 상태로 변경
3. logout() 또는 disconnect → 세션 삭제, 오프라인 상태로 변경
```

### 이동 검증 단계
```
1. 플레이어 존재 확인
2. 온라인 상태 확인
3. 인접 헥스 검증 (hex_distance == 1)
4. 충돌 검사 (다른 플레이어 없음)
5. 위치 업데이트
```

---

## 👉 다음 단계

이제 **[05. 인벤토리 및 제작 시스템](./05-inventory-crafting.md)**에서 아이템 관리와 크래프팅을 구현해봅시다!

---

*헥스 그리드에 대해 더 알고 싶다면 [Red Blob Games의 Hexagonal Grids](https://www.redblobgames.com/grids/hexagons/)를 참고하세요.*

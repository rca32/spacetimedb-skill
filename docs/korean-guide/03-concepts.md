# SpacetimeDB 한국어 개발 가이드 - 03. 핵심 개념: Table과 Reducer

이 문서에서는 SpacetimeDB의 가장 중요한 두 가지 개념인 **Table**과 **Reducer**를 상세히 설명합니다. 이 개념들을 이해하면 SpacetimeDB로 어떤 애플리케이션이든 만들 수 있습니다.

## 📋 목차

1. [SpacetimeDB 아키텍처 개요](#1-spacetime-db-아키텍처-개요)
2. [Table이란?](#2-table이란)
3. [Reducer란?](#3-reducer란)
4. [Identity와 인증](#4-identity와-인증)
5. [접근 제어: Public vs Private](#5-접근-제어-public-vs-private)
6. [실제 코드 예시](#6-실제-코드-예시)

---

## 1. SpacetimeDB 아키텍처 개요

### 1.1 전통적인 아키텍처 vs SpacetimeDB

**전통적인 게임 서버:**
```
클라이언트 ↔ 게임 서버 ↔ 데이터베이스 ↔ 캐시 ↔ 메시지 큐
         ↕
   다른 서버들
```

**SpacetimeDB:**
```
클라이언트 ↔ SpacetimeDB (데이터베이스 = 서버)
         ↕
   다른 클라이언트들 (실시간 동기화)
```

### 1.2 핵심 특징

- **데이터베이스가 곧 서버**: SQL 쿼리와 트랜잭션을 지원하는 동시에 게임 로직도 실행
- **자동 실시간 동기화**: 데이터 변경이 모든 구독자에게 자동으로 전파
- **Identity 기반 보안**: 암호화된 Identity를 통한 인증 및 권한 관리

---

## 2. Table이란?

### 2.1 Table의 정의

**Table**은 SpacetimeDB에서 데이터를 저장하는 기본 단위입니다. 전통적인 데이터베이스의 테이블과 유사하지만, 몇 가지 중요한 차이점이 있습니다.

```rust
#[table(name = "players", public)]
pub struct Player {
    #[primary_key]
    id: u64,
    name: String,
    level: u32,
}
```

### 2.2 #[table] 매크로

`#[table]` 매크로는 Rust 구조체를 SpacetimeDB 테이블로 변환합니다.

**주요 속성:**

| 속성 | 설명 | 예시 |
|------|------|------|
| `name` | 테이블 이름 | `name = "players"` |
| `public` | 모든 클라이언트가 조회 가능 | `public` |
| `private` | 소유자만 접근 가능 (기본값) | `private` |
| `index` | 검색 성능 향상을 위한 인덱스 | `index(name = "by_level")` |

### 2.3 #[primary_key]

**Primary Key**는 테이블의 각 행을 고유하게 식별하는 필드입니다.

```rust
#[table(name = "accounts")]
pub struct Account {
    #[primary_key]
    identity: Identity,  // SpacetimeDB의 고유 식별자
    username: String,
    created_at: u64,
}
```

**특징:**
- 중복된 primary key 값을 가진 행은 하나만 존재할 수 있습니다
- `identity` 타입은 SpacetimeDB가 자동 생성하는 고유 식별자입니다
- Primary key를 사용하여 특정 행을 빠르게 조회할 수 있습니다

### 2.4 #[auto_inc]

자동 증가 ID가 필요할 때 사용합니다:

```rust
#[table(name = "items", public)]
pub struct Item {
    #[primary_key]
    #[auto_inc]
    id: u64,  // 1, 2, 3, ... 자동 할당
    name: String,
}
```

---

## 3. Reducer란?

### 3.1 Reducer의 정의

**Reducer**는 SpacetimeDB에서 상태를 변경하는 유일한 방법입니다. Redux나 다른 상태 관리 라이브러리의 개념과 유사합니다.

```rust
#[reducer]
pub fn create_account(ctx: &ReducerContext, username: String) {
    // 데이터베이스 변경 로직
}
```

### 3.2 #[reducer] 매크로

`#[reducer]` 매크로는 함수를 SpacetimeDB 리듀서로 등록합니다.

**ReducerContext**는 리듀서에 제공되는 컨텍스트입니다:

```rust
#[reducer]
pub fn move_player(ctx: &ReducerContext, x: i32, y: i32) {
    // ctx.sender: 리듀서를 호출한 사용자의 Identity
    // ctx.timestamp: 호출 시간
    // ctx.connection_id: 연결 ID
}
```

### 3.3 Reducer의 특징

**1. 원자적 실행**
```rust
#[reducer]
pub fn transfer_gold(ctx: &ReducerContext, to: Identity, amount: u64) {
    // 이 함수 내의 모든 작업은 원자적으로 실행됩니다
    // 중간에 실패하면 모든 변경이 롤백됩니다
}
```

**2. 자동 권한 검증**
```rust
#[reducer]
pub fn delete_account(ctx: &ReducerContext) {
    // ctx.sender를 통해 누가 호출했는지 확인 가능
    // 자신의 계정만 삭제 가능하도록 구현
    let account = ctx.db.account().identity().find(ctx.sender);
    // ...
}
```

**3. 클라이언트 호출 가능**
```typescript
// 클라이언트에서 Reducer 호출
conn.reducers.create_account("PlayerName");
conn.reducers.move_player(10, 20);
```

---

## 4. Identity와 인증

### 4.1 Identity란?

**Identity**는 SpacetimeDB에서 사용자를 식별하는 암호화된 고유 식별자입니다.

```rust
use spacetimedb::Identity;

#[table(name = "accounts")]
pub struct Account {
    #[primary_key]
    identity: Identity,  // 사용자의 고유 ID
    username: String,
}
```

### 4.2 Identity 특징

- **자동 생성**: 사용자가 처음 연결하면 자동으로 생성됩니다
- **영구적**: 같은 클라이언트는 항상 같은 Identity를 가집니다
- **안전한**: 위조가 불가능한 암호화 서명이 포함됩니다
- **Private 기본값**: 사용자의 Identity는 기본적으로 공개되지 않습니다

### 4.3 Identity 활용

```rust
#[reducer]
pub fn create_account(ctx: &ReducerContext, username: String) {
    // ctx.sender는 호출자의 Identity
    let identity = ctx.sender;
    
    // 이미 존재하는지 확인
    if ctx.db.account().identity().find(&identity).is_some() {
        panic!("Account already exists!");
    }
    
    // 새 계정 생성
    ctx.db.account().insert(Account {
        identity,
        username,
        created_at: ctx.timestamp,
    });
}
```

---

## 5. 접근 제어: Public vs Private

### 5.1 Public 테이블

**Public** 테이블은 모든 클라이언트가 볼 수 있습니다.

```rust
#[table(name = "player_positions", public)]
pub struct PlayerPosition {
    #[primary_key]
    identity: Identity,
    x: i32,
    y: i32,
}
```

**사용 사례:**
- 플레이어 위치 (모두가 볼 수 있어야 함)
- 월드에 떨어진 아이템
- NPC 상태
- 채팅 메시지

### 5.2 Private 테이블 (기본값)

**Private** 테이블은 소유자만 볼 수 있습니다 (기본값).

```rust
#[table(name = "inventories")]  // private이 기본값
pub struct Inventory {
    #[primary_key]
    identity: Identity,
    items: Vec<ItemId>,
    gold: u64,
}
```

**사용 사례:**
- 인벤토리 내용
- 개인 메시지
- 계정 상세 정보
- 게임 진행 상태

### 5.3 접근 제어 비교

| 테이블 타입 | 읽기 권한 | 쓰기 권한 | 예시 |
|------------|----------|----------|------|
| **Public** | 모든 클라이언트 | Reducer만 | 플레이어 위치 |
| **Private** | 소유자만 | 소유자의 Reducer만 | 인벤토리, 계정 정보 |

---

## 6. 실제 코드 예시

### 6.1 Account 테이블 (인증)

```rust
use spacetimedb::{table, ReducerContext, Identity, Timestamp};

#[table(name = "account")]
pub struct Account {
    #[primary_key]
    pub identity: Identity,
    pub username: String,
    pub created_at: u64,
    pub last_login: Option<u64>,
}

#[reducer]
pub fn create_account(ctx: &ReducerContext, username: String) {
    // 1. 이미 계정이 있는지 확인
    if ctx.db.account().identity().find(&ctx.sender).is_some() {
        log::error!("Account already exists for identity: {:?}", ctx.sender);
        return;
    }
    
    // 2. 새 계정 생성
    ctx.db.account().insert(Account {
        identity: ctx.sender,
        username,
        created_at: ctx.timestamp.to_micros_since_unix_epoch(),
        last_login: None,
    });
    
    log::info!("Account created: {}", username);
}

#[reducer]
pub fn login(ctx: &ReducerContext) {
    // 1. 계정 찾기
    let mut account = match ctx.db.account().identity().find(&ctx.sender) {
        Some(account) => account,
        None => {
            log::error!("Account not found");
            return;
        }
    };
    
    // 2. 마지막 로그인 시간 업데이트
    account.last_login = Some(ctx.timestamp.to_micros_since_unix_epoch());
    ctx.db.account().identity().update(account);
    
    log::info!("User logged in: {}", account.username);
}
```

**설명:**
1. `#[table(name = "account")]` - private 테이블 (기본값)
2. `#[primary_key]` - identity를 primary key로 사용
3. `ctx.sender` - 리듀서를 호출한 사용자의 Identity
4. `ctx.db.account()` - account 테이블에 접근

### 6.2 PlayerState 테이블 (Public)

```rust
#[table(name = "player_state", public)]
pub struct PlayerState {
    #[primary_key]
    pub identity: Identity,
    pub username: String,
    pub q: i32,  // 헥스 그리드 q 좌표
    pub r: i32,  // 헥스 그리드 r 좌표
    pub online: bool,
}

#[reducer]
pub fn spawn_player(ctx: &ReducerContext, username: String) {
    // 이미 스폰되었는지 확인
    if ctx.db.player_state().identity().find(&ctx.sender).is_some() {
        return;
    }
    
    // 새 플레이어 상태 생성
    ctx.db.player_state().insert(PlayerState {
        identity: ctx.sender,
        username,
        q: 0,
        r: 0,
        online: true,
    });
}

#[reducer]
pub fn move_player(ctx: &ReducerContext, q: i32, r: i32) {
    // 1. 현재 플레이어 상태 찾기
    let mut player = match ctx.db.player_state().identity().find(&ctx.sender) {
        Some(player) => player,
        None => {
            log::error!("Player not found");
            return;
        }
    };
    
    // 2. 이동 거리 계산 (헥스 그리드)
    let dq = (q - player.q).abs();
    let dr = (r - player.r).abs();
    let distance = (dq + dr + (dq - dr).abs()) / 2;
    
    // 3. 한 번에 1칸만 이동 가능
    if distance > 1 {
        log::error!("Cannot move more than 1 hex");
        return;
    }
    
    // 4. 위치 업데이트
    player.q = q;
    player.r = r;
    ctx.db.player_state().identity().update(player);
    
    log::info!("Player moved to ({}, {})", q, r);
}
```

**설명:**
1. `#[table(name = "player_state", public)]` - 모든 클라이언트가 볼 수 있음
2. 헥스 그리드 좌표계 (q, r) 사용
3. 거리 검증 로직
4. 자동으로 다른 플레이어들에게 위치 동기화

---

## 🔍 데이터 흐름 시각화

### 클라이언트 → 서버 → 클라이언트

```
┌─────────────┐     move_player(5, 3)     ┌──────────────┐
│  클라이언트A  │ ─────────────────────────→ │   SpacetimeDB │
│  (q=4, r=3)  │                           │    서버       │
└─────────────┘                           └──────────────┘
                                                   │
                    ┌─────────────┐               │
                    │  클라이언트B  │ ←─────────────┘
                    │  (구독 중)   │   player_state 변경 알림
                    └─────────────┘   (q=4,r=3) → (q=5,r=3)
```

### Reducer 실행 흐름

```
1. 클라이언트가 reducer 호출
   conn.reducers.move_player(5, 3)
        ↓
2. SpacetimeDB가 권한 확인
   - ctx.sender가 유효한가?
        ↓
3. Reducer 실행 (트랜잭션)
   - player_state 테이블 업데이트
        ↓
4. 변경사항을 구독자들에게 브로드캐스트
   - public 테이블: 모든 클라이언트
   - private 테이블: 소유자만
```

---

## 📝 핵심 정리

### ✅ Table
- 데이터 저장소 (`#[table]`)
- Primary key로 고유 식별 (`#[primary_key]`)
- Public/Private 접근 제어
- 자동 동기화 (Public 테이블)

### ✅ Reducer
- 상태 변경 함수 (`#[reducer]`)
- 원자적 트랜잭션 실행
- `ctx.sender`로 호출자 확인
- 클라이언트에서 직접 호출 가능

### ✅ Identity
- 사용자 고유 식별자
- 자동 생성, 영구적
- 안전한 암호화 서명
- 인증 및 권한 관리에 사용

---

## 🎯 학습 체크포인트

- [ ] Table과 Reducer의 차이점을 설명할 수 있다
- [ ] #[table] 매크로의 주요 속성들을 알고 있다
- [ ] #[reducer] 함수의 ctx 매개변수 활용법을 이해한다
- [ ] Identity의 역할과 활용법을 설명할 수 있다
- [ ] Public과 Private 테이블의 차이를 설명할 수 있다

---

## 👉 다음 단계

이제 **[04. 인증 및 이동 시스템](./04-auth-movement.md)**에서 실제로 로그인과 플레이어 이동을 구현해봅시다!

---

*이해가 안 되는 부분이 있으면 SpacetimeDB 공식 문서의 [Core Concepts](https://spacetimedb.com/docs)를 참고하세요.*

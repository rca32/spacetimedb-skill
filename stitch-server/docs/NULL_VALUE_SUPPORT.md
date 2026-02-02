# Null Value Support Implementation

> **작성일**: 2026-02-02
> **목표**: Optional parameter support (Option<u64>, Vec<bool>) for CLI testing
> **상태**: ✅ 구현 완료

---

## 문제 요약

기존 `spacetime call` 명령은 공백 분리 형식(single space-separated format)만 지원하여 `Option<T>` 및 `Vec<T>`와 같은 복잡한 타입을 전달할 수 없었습니다.

### 예시 문제

**기존 에러 (실패):**
```bash
spacetime call stitch-server empire_rank_set 1 1 "Noble" true true false false
Error: invalid type: boolean "true", expected a vec
```

**기존 에러 (실패):**
```bash
spacetime call stitch-server permission_edit 1 2 0 5 1
Error: invalid type: integer "1", expected sum type
```

---

## 솔루션: 테스트 헬퍼 리듀서

두 개의 새로운 리듀서를 구현하여 공백 분리 형식을 처리하고 null 값을 지원합니다.

### 1. permission_edit_simple

**위치**: `reducers/permission/permission_edit_simple.rs`

**파라미터**:
- `ordination_entity_id` (u64)
- `allowed_entity_id` (u64)
- `group` (i32)
- `rank` (i32)
- `claim_id_str` (String) - "null"일 경우 Option<u64> 처리

**사용법**:
```bash
# null claim_id 사용
spacetime call stitch-server permission_edit_simple 1 2 0 5 null

# 실제 claim_id 사용
spacetime call stitch-server permission_edit_simple 1 2 0 5 12345
```

**구현 특징**:
```rust
#[spacetimedb::reducer]
pub fn permission_edit_simple(
    ctx: &ReducerContext,
    ordained_entity_id: u64,
    allowed_entity_id: u64,
    group: i32,
    rank: i32,
    claim_id_str: String,
) -> Result<(), String> {
    let claim_id = if claim_id_str.to_lowercase() == "null" {
        None
    } else {
        claim_id_str.parse::<u64>().ok()
    };

    match ctx.call_reducer("permission_edit", (&ordination_entity_id, &allowed_entity_id, &group, &rank, &claim_id)) {
        Ok(()) => Ok(()),
        Err(e) => Err(format!("Failed to call permission_edit: {}", e)),
    }
}
```

---

### 2. empire_rank_set_simple

**위치**: `reducers/empire/empire_rank_set_simple.rs`

**파라미터**:
- `empire_entity_id` (u64)
- `rank` (u8)
- `title` (String)
- `permissions_str` (String) - "null"이나 비어있을 경우 빈 Vec 처리

**사용법**:
```bash
# null permissions 사용
spacetime call stitch-server empire_rank_set_simple 1 1 "Noble" null

# 콤마 구분 booleans 사용
spacetime call stitch-server empire_rank_set_simple 1 1 "Noble" "true,false,false,false"

# 특정 권한만 지정
spacetime call stitch-server empire_rank_set_simple 1 1 "Noble" "true,false,false"
```

**구현 특징**:
```rust
#[spacetimedb::reducer]
pub fn empire_rank_set_simple(
    ctx: &ReducerContext,
    empire_entity_id: u64,
    rank: u8,
    title: String,
    permissions_str: String,
) -> Result<(), String> {
    let permissions = if permissions_str.trim().to_lowercase() == "null" {
        Vec::new()
    } else {
        permissions_str
            .split(',')
            .filter_map(|s| s.trim().parse::<bool>().ok())
            .collect()
    };

    match ctx.call_reducer("empire_rank_set", (&empire_entity_id, &rank, &title, &permissions)) {
        Ok(()) => Ok(()),
        Err(e) => Err(format!("Failed to call empire_rank_set: {}", e)),
    }
}
```

---

## 수정된 파일

### 1. reducers/permission/permission_edit_simple.rs (새 파일)
- 테스트 헬퍼 리듀서 구현
- null 문자열을 Option<u64>로 변환
- 기존 permission_edit 리듀서 호출 래핑

### 2. reducers/permission/mod.rs (수정)
```rust
pub mod permission_edit;
pub mod permission_edit_simple; // 추가
```

### 3. reducers/empire/empire_rank_set_simple.rs (새 파일)
- 테스트 헬퍼 리듀서 구현
- 콤마 구분 문자열을 Vec<bool>로 변환
- 기존 empire_rank_set 리듀서 호출 래핑

### 4. reducers/empire/mod.rs (수정)
```rust
pub mod empire_create;
pub mod empire_node_register;
pub mod empire_rank_set;
pub mod empire_rank_set_simple; // 추가
```

---

## 컴파일 체크리스트

1. **모듈 등록**: `reducers/mod.rs`에 필요한 모듈이 포함되어 있는지 확인
2. **tracable**: `#[spacetimedb::reducer]` 속성이 올바르게 적용되었는지 확인
3. **릴레이션**: `call_reducer` 사용 시 타입 일치 확인
4. **메타데이터**: 컴파일 후 `spacetime call --list`로 확인

---

## 테스트 시나리오

### 테스트 1: permission_edit_simple (null claim_id)

```bash
# 1. Empire 생성
spacetime call stitch-server empire_create 1 6805694199193278222 "Test Empire"

# 2. Permission 수정 (claim_id = null)
spacetime call stitch-server permission_edit_simple \
    6805694199193278222 \
    6805694199193278222 \
    0 \
    5 \
    "null"

# 3. 확인
spacetime sql stitch-server "SELECT * FROM permission_state"
```

**기대 결과**: `permission_state` 테이블에 레코드 생성, `claim_id` = null

---

### 테스트 2: empire_rank_set_simple (null permissions)

```bash
# 1. Empire 생성 후
spacetime call stitch-server empire_create 1 6805694199193278222 "Test Empire"

# 2. Rank 설정 (permissions = null)
spacetime call stitch-server empire_rank_set_simple \
    1 \
    1 \
    "Noble" \
    "null"

# 3. 확인
spacetime sql stitch-server "SELECT * FROM empire_rank_state WHERE empire_entity_id = 1"
```

**기대 결과**: `empire_rank_state` 테이블에 레코드 생성, `permissions` = []

---

### 테스트 3: empire_rank_set_simple (권한 지정)

```bash
# 1. Rank 설정 (특정 권한)
spacetime call stitch-server empire_rank_set_simple \
    1 \
    1 \
    "Noble" \
    "true,false,true,false"

# 2. 확인
spacetime sql stitch-server "SELECT rank, title, permissions FROM empire_rank_state WHERE empire_entity_id = 1"
```

**기대 결과**: `permissions` = [true, false, true, false]

---

## 제약 사항

1. **클라이언트 제한**: 이 리듀서는 CLI에서만 테스트 가능, 서버 측 API는 기존 스키마 유지
2. **문자열 파싱**: 잘못된 콤마 구분 형식은 무시됨 (null을 제외한 모든 항목이 bool로 파싱 실패 시 무시)
3. **호환성**: 기존 API는 변경되지 않음 (이 리듀서는 별도 계층)

---

## 다음 단계

1. ✅ 구현: permission_edit_simple
2. ✅ 구현: empire_rank_set_simple
3. ⏳ 컴파일: Rust 빌드 확인
4. ⏳ 테스트: CLI를 통한 실제 테스트 실행
5. ⏳ 문서화: AI_TESTING_PLAYBOOK2.md 업데이트
6. ⏳ CI 통합: 자동화 테스트 추가

---

## 연관 파일

- `DESIGN/DETAIL/stitch-permission-access-control.md`
- `DESIGN/DETAIL/stitch-claim-empire-management.md`
- `stitch-server/docs/AI_TESTING_PLAYBOOK2.md`
- `stitch-server/docs/COMPREHENSIVE_TEST_REPORT.md`

---

**생성일**: 2026-02-02
**작성자**: AI Agent
**상태**: 구현 완료

# SpacetimeDB 디코딩 RangeError 대응 가이드

작성일: 2026-02-21  
대상: `stitch-server`, `stitch-orillusion-client`

## 1. 증상
- 예시:
  - `binary_reader.ts`
  - `algebraic_type.ts`
- 반복 오류:
  - `RangeError: Tried to read ... byte(s)`

## 2. 우선 의심 원인
1. 클라이언트 SDK/바인딩과 실행 DB 스키마 불일치
2. `byteArray(Vec<u8>)` 포함 테이블 구독 시 해석 경계 불일치

## 3. 단계별 대응

### 3.1 1차 분리
- AOI/세션 구독을 최소화한다.
- 테이블 구독을 절반씩 다시 켜서 문제 테이블을 고정한다.

### 3.2 2차 정렬
- 클라이언트 `spacetimedb` npm 패키지 버전을 서버 CLI 계열과 맞춘다.
- 바인딩 재생성:
```bash
cd stitch-orillusion-client
bun run spacetime:generate
```

### 3.3 3차 복구 (지속 재발 시)
```bash
cd /home/rca32/workspaces/spacetimedb-skill/stitch-server/crates/game_server
spacetime publish --delete-data=always --yes stitch-server
spacetime call stitch-server seed_data
spacetime call stitch-server import_csv_data
spacetime call stitch-server start_world_agents
```

### 3.4 4차 확인
- 클라이언트 dev 서버 재시작
- 브라우저 hard reload
- 제외했던 구독을 순차 복원

## 4. `server_correction_v2` 운영 규칙
- 스키마는 고정 스칼라 컬럼 사용:
  - `server_x/server_y/server_z`
  - `velocity_x/velocity_y/velocity_z`
- `Vec<f32>` 컬럼은 지양한다.
- 구독은 `session-self`에서만 유지하고 AOI 쿼리에는 중복 추가하지 않는다.

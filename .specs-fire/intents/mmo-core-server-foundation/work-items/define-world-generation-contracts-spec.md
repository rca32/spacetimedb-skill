# Contract Spec: 월드 생성 계약 정의

## Source

- `DESIGN/DETAIL/world-generation-system.md`

## Domain Contract

## 1) Inputs
- `world_gen_params.seed`: 동일 입력이면 동일 결과를 보장해야 한다.
- `chunk_coord(x, z, dimension)`: 청크 단위 생성/조회의 기본 키다.
- `biome/noise params`: 서버 파라미터 테이블에서 로드한다.

## 2) Outputs
- `terrain_chunk`: 청크별 지형 결과 저장.
- `resource_node`: 채집 가능한 리소스 노드 저장.
- (필요 시) 바이옴 인덱스/요약 테이블.

## 3) Determinism Rules
- 같은 `(seed, chunk_coord, params_version)` 조합은 항상 동일 결과.
- 난수는 서버 고정 RNG 경로만 사용.
- 클라이언트는 생성 결과를 제안하지 않고 구독만 수행.

## 4) Reducer Contract
- `worldgen_generate_chunk(x, z, dimension)`:
  - 입력 좌표 유효성 검사.
  - 이미 생성된 청크면 멱등 처리.
  - 생성 성공 시 `terrain_chunk`/`resource_node` 반영.
- `worldgen_regenerate_chunk(...)`:
  - admin/server 권한만 허용.
  - 재생성은 버전 추적 후 수행.

## 5) Validation Rules
- 청크 크기: 설계 상수(`32x32`) 준수.
- 좌표 변환: axial/cube 변환 오차 보정 규칙 준수.
- 리소스 배치: 바이옴 제한/밀도 상한/충돌 금지 조건 충족.

## 6) Subscription Contract
- 기본 구독: 플레이어 AOI 기준 인접 청크만 전송.
- 델타 전송: 변경된 청크/노드만 전송.
- 전체 월드 스냅샷 구독 금지(운영자 제외).

## Acceptance Checklist

- [ ] seed 기반 재현성 테스트 시 동일 결과 해시가 일치한다.
- [ ] 중복 청크 생성 호출이 상태를 오염시키지 않는다.
- [ ] 구독이 AOI 범위를 벗어난 청크를 전송하지 않는다.
- [ ] 클라이언트 입력 없이 서버 단독으로 월드 생성이 가능하다.

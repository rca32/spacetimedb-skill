# Resource(나무) 렌더 최적화 기록 (2026-02-21)

작성일: 2026-02-21  
대상: `stitch-orillusion-client`  
목적: resource(나무) 밀집 구간 프레임 저하 완화

## 1. 배경
- 기존 `resourceNode` 렌더 경로는 개체 수 증가 시 다음 비용이 함께 증가했다.
  - 개별 오브젝트 트랜스폼/시각 갱신 CPU 비용
  - 드로우콜 증가
- 1차 목표는 리스크를 최소화하면서 체감 성능을 먼저 확보하는 것이었다.

## 2. 1차 최적화 적용 범위
### In Scope
- `resourceNode`(나무) 경로만 우선 최적화
- 인스턴싱 경로 + 안전 fallback 경로 동시 유지
- 운영 토글 추가

### Out of Scope
- NPC/건물/프로젝트 사이트 인스턴싱
- 서버 스키마/리듀서 변경

## 3. 구현 상세
### 3.1 리소스 인스턴싱 경로
- `WorldStreamVisualizer` 내부에 resource 전용 루트(`resourceInstanceRoot`)를 추가
- 루트에 `InstanceDrawComponent`를 부착해 인스턴싱 경로를 사용
- 리소스 렌더 모드를 `instanced | legacy`로 분리

핵심 파일:
- `stitch-orillusion-client/src/world/stream-visualizer.ts`

핵심 포인트:
1. 인스턴싱 초기화 실패 시 자동으로 `legacy`로 fallback
2. 오브젝트 parent를 모드에 맞춰 `resourceInstanceRoot` 또는 `root`로 재배치
3. 기존 배치식(지면 높이 샘플, depleted 스케일) 유지

### 3.2 CPU 병목 완화(저주기 동기화)
- `resourceNode` 전수 순회를 매 프레임 수행하지 않도록 동기화 간격 제한 적용
- 현재 기본값:
  - `RESOURCE_SYNC_INTERVAL_MS = 120`

효과:
- 나무 수가 많은 장면에서 CPU 갱신 부담을 직접 완화

### 3.3 운영 토글/관측값
- 환경변수:
  - `VITE_RESOURCE_INSTANCING`
    - `1`(기본): 인스턴싱 사용
    - `0`: legacy 경로 강제(문제 발생 시 즉시 우회)
- HUD 표시 추가:
  - `resource render mode`
  - `resource sync interval`

핵심 파일:
- `stitch-orillusion-client/src/infra/config.ts`
- `stitch-orillusion-client/src/app/runtime.ts`
- `AGENTS.md`

## 4. 검증 결과
- `cd stitch-orillusion-client && bun run typecheck` 통과
- `cd stitch-orillusion-client && bun run build` 통과
- 사용자 체감 기준 프레임 개선 확인

## 5. 리스크/제약
1. 인스턴싱만으로는 병목이 완전히 해소되지 않을 수 있음
- CPU 전수 순회 비용이 큰 구간에서는 동기화 주기 최적화가 중요

2. 동기화 주기 증가에 따른 반응성 trade-off
- 너무 큰 interval은 리소스 상태 갱신 시각 반영이 늦어질 수 있음

## 6. 다음 최적화 체크리스트
1. `RESOURCE_SYNC_INTERVAL_MS` 튜닝
- 후보: `120 -> 150 -> 200` 비교 후 고정값 선정

2. 인스턴싱 효과 분리 측정
- `VITE_RESOURCE_INSTANCING=1` vs `0` 동일 조건 비교

3. 다음 병목 구간 프로파일링
- 우선 후보: `terrain/water` 렌더/업데이트 경로

## 7. 관련 문서
- 작업 로그(원본): `prompts/20260221_worklog.md`
- 상위 마스터: `IMPLEMENTDOC/overview/master.md`

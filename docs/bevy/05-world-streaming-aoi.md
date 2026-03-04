---
doc_id: bevy-05-world-streaming-aoi
owner: world-streaming
status: draft
source_design_docs:
  - ../../DESIGN/02-systems-design.md
  - ../../DESIGN/04-server-architecture.md
  - ../../DESIGN/06-sync-anti-cheat.md
depends_on:
  - bevy-03-client-server-contract
  - bevy-04-ecs-domain-model
last_reviewed: 2026-03-05
---

# 월드 스트리밍 및 AOI

## 왜 (의도)
MMO 월드에서 네트워크/메모리/렌더 비용을 통제하면서도 플레이어 주변 상태를 지연 없이 제공하기 위해 AOI 기반 스트리밍을 표준화한다.

## 무엇 (스펙)
### 근거 DESIGN 문서
- [시스템 디자인](../../DESIGN/02-systems-design.md)
- [서버 아키텍처](../../DESIGN/04-server-architecture.md)
- [동기화 및 안티치트](../../DESIGN/06-sync-anti-cheat.md)

### 구독 토폴로지
- 중심 청크 + 인접 링(ring) 단위 구독
- 플레이어 이동 시 증분 구독/해지
- 고정 객체(지형/건축)와 동적 객체(플레이어/NPC) 분리 스트림

### 캐시 정책
- `hot`: 현재 AOI 내부, 프레임 단위 갱신
- `warm`: 인접 AOI, 저빈도 갱신
- `cold`: AOI 외부, 즉시 해지 또는 압축 보관

### 성능 예산
- 평균 프레임: 60 FPS 목표
- 네트워크 지연: UI 반영 150ms 이하 목표
- 메모리: AOI 캐시 상한값 설정(맵 규모 기반)

### 실패 처리
- 델타 손실 감지 시 청크 단위 재동기화
- 서버 보정 이벤트 우선 적용
- 구독 재구성 중 입력은 로컬 큐에 임시 저장

## 어떻게 (구현)
1. `request_chunks_for_aoi` 류 reducer 호출 정책을 상태 전이로 정의한다.
2. AOI 변경 감지 시스템에서 구독 diff를 계산한다.
3. 지형/엔티티 스트림을 분리 적용해 대역폭 스파이크를 줄인다.
4. 캐시 정리 시스템을 주기적으로 실행해 메모리 상한을 유지한다.

## 어떻게 검증 (테스트)
- 이동 스트레스 테스트: 고속 이동 중 구독 누락 여부
- 경계 테스트: 청크 경계 왕복 시 중복 구독/해지 검증
- 장애 테스트: 네트워크 끊김 후 재연결 시 AOI 복구 시간 측정

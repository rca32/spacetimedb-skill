# Tick Scheduling

## 현재 구성
- 렌더 루프: Orillusion `renderLoop` 단일 루프
- 네트워크 intent 전송: 100ms 간격
- 서버 계산: reducer 호출 시점 기반

## 목표 구성
- physics/combat/economy 도메인 분리틱
- 각 틱 결과를 AOI 스트림으로 통합 반영

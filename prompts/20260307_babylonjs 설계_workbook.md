# 20260307_babylonjs 설계 workbook

## 작업 메모

### 1. 설계 기준선
- GDD는 코지 생존/제작 MMO, 정착지 성장, NPC 관계, 협동 건설을 중심으로 잡혀 있다.
- 기존 `docs/rfc-002~004`는 Bevy 기준이지만 상태 머신, queue-first ingest, AOI ring, recovery 원칙은 엔진 독립적으로 재사용 가능했다.
- 현재 `stitch-orillusion-client`는 이미 self subscription과 AOI subscription을 분리하고 있어 Babylon 설계에도 같은 키 구조를 유지하는 편이 자연스럽다.

### 2. Babylon.js에 맞춘 핵심 변환
- ECS/plugin 용어 대신 Babylon scene controller와 mirror store 중심으로 재정의
- `PBRMaterial`, `DefaultRenderingPipeline`, `HighlightLayer`, `GlowLayer`, `ParticleSystem`, `AnimationGroup`, `AssetContainer`, thin instances를 기본 채택
- 카메라는 `ArcRotateCamera` 중심, 필요 시 `UniversalCamera` 입력 규칙을 추가하는 하이브리드 모델
- UI는 Babylon GUI 단독이 아니라 DOM overlay와 혼합

### 3. SpacetimeDB 관련 메모
- callback은 직접 scene mutation을 하지 않고 queue에만 써야 한다.
- `WorldLoading -> InWorld` 전이는 필수 subscription `onApplied` 완료가 전제다.
- `request_id` 기반 intent 추적과 self correction stream은 유지해야 한다.

### 4. 리스크
- Babylon Havok은 로컬 보조 충돌 전용으로만 사용해야 하며 authoritative movement 판정을 침범하면 안 된다.
- 후처리와 그림자 기능은 도입 가치가 높지만 MMO 장면 밀도에서 즉시 성능 병목이 될 수 있다.
- DOM/Babylon GUI 혼합 상태 관리가 엉키면 입력 포커스 문제를 만들 수 있다.

### 5. 다음 구현 단위 제안
- connection + mirror store + baseline subscription
- terrain/resource/building AOI visualizer
- player prediction/correction
- build preview/NPC interaction vertical slice

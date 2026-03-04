---
doc_id: bevy-00-index
owner: game-architecture
status: draft
source_design_docs:
  - ../../DESIGN/02-systems-design.md
  - ../../DESIGN/04-server-architecture.md
  - ../../DESIGN/05-data-model.md
  - ../../DESIGN/06-sync-anti-cheat.md
  - ../../DESIGN/11-testing-evaluation.md
  - ../../DESIGN/15-tech-stack-build.md
  - ../../DESIGN/20-stitch-core-systems.md
depends_on: []
last_reviewed: 2026-03-05
---

# Bevy MMO RPG 구현 문서 인덱스

## 왜 (의도)
`DESIGN`에 정의된 MMO RPG를 Bevy 클라이언트에서 구현할 때, 팀이 동일한 용어/계약/검증 기준으로 작업하도록 단일 인덱스를 제공한다.

## 무엇 (스펙)
### 필독 DESIGN 링크
- [시스템 디자인](../../DESIGN/02-systems-design.md)
- [서버 아키텍처](../../DESIGN/04-server-architecture.md)
- [데이터 모델](../../DESIGN/05-data-model.md)
- [동기화/안티치트](../../DESIGN/06-sync-anti-cheat.md)
- [테스트 및 평가](../../DESIGN/11-testing-evaluation.md)
- [기술 스택 및 빌드](../../DESIGN/15-tech-stack-build.md)
- [Stitch 핵심 시스템](../../DESIGN/20-stitch-core-systems.md)

### 빠른 시작 (필독 5문서)
1. [01-implementation-roadmap](./01-implementation-roadmap.md)
2. [03-client-server-contract](./03-client-server-contract.md)
3. [04-ecs-domain-model](./04-ecs-domain-model.md)
4. [05-world-streaming-aoi](./05-world-streaming-aoi.md)
5. [11-observability-test-ops](./11-observability-test-ops.md)

### 문서 트리
- [01-implementation-roadmap](./01-implementation-roadmap.md): 단계별 구현 순서와 완료 조건
- [02-module-boundaries](./02-module-boundaries.md): Bevy Plugin 경계와 서버 모듈 책임 분리
- [03-client-server-contract](./03-client-server-contract.md): reducer/subscribe/권한 계약
- [04-ecs-domain-model](./04-ecs-domain-model.md): DESIGN 엔티티를 ECS 타입으로 매핑
- [05-world-streaming-aoi](./05-world-streaming-aoi.md): 청크/AOI 스트리밍 설계
- [06-movement-combat-loop](./06-movement-combat-loop.md): 이동/전투/PvP 루프
- [07-inventory-trade-crafting](./07-inventory-trade-crafting.md): 인벤토리/거래/제작
- [08-claim-housing-social](./08-claim-housing-social.md): 클레임/주거/소셜
- [09-ui-input-camera](./09-ui-input-camera.md): UI/입력/카메라 규격
- [10-assets-content-pipeline](./10-assets-content-pipeline.md): 에셋 파이프라인
- [11-observability-test-ops](./11-observability-test-ops.md): 계측/테스트/운영
- [12-migration-notes-from-legacy-engines](./12-migration-notes-from-legacy-engines.md): Unreal/Unity 문맥 이관
- [design-traceability-matrix](./appendix/design-traceability-matrix.md): DESIGN 추적 매트릭스
- [glossary-alignment](./appendix/glossary-alignment.md): 용어 정합성

### 문서 작성 공통 규칙
- 모든 문서는 `왜/무엇/어떻게/어떻게 검증` 4개 섹션을 유지한다.
- 상단 Front Matter 필드(`doc_id`, `owner`, `status`, `source_design_docs`, `depends_on`, `last_reviewed`)를 필수로 둔다.
- 각 문서는 최소 3개 이상의 `DESIGN` 근거 링크를 포함한다.
- BitCraft 자료는 영감 참고로만 기록하고 설계 근거로 채택하지 않는다.

## 어떻게 (구현)
1. 새 기능 구현 전에 관련 문서 1개를 주 문서로 지정한다.
2. 해당 문서의 계약(데이터/이벤트/권한/성능 예산)에 맞춰 구현한다.
3. 구현 PR에서 관련 문서 링크와 테스트 결과를 함께 제출한다.
4. 계약 변경 시 문서를 먼저 갱신하고 추적 매트릭스를 업데이트한다.

## 어떻게 검증 (테스트)
- 링크 검증: `docs/bevy` 내부 상대 링크와 `DESIGN` 링크가 모두 유효해야 한다.
- 구조 검증: 모든 파일이 Front Matter와 4개 고정 섹션을 가져야 한다.
- 추적 검증: 신규 기능이 [design-traceability-matrix](./appendix/design-traceability-matrix.md)에 반영되어야 한다.

---
doc_id: bevy-appendix-glossary-alignment
owner: architecture-governance
status: draft
source_design_docs:
  - ../../../DESIGN/02-systems-design.md
  - ../../../DESIGN/05-data-model.md
  - ../../../DESIGN/18-terminology.md
depends_on:
  - bevy-00-index
  - bevy-12-migration-notes-from-legacy-engines
last_reviewed: 2026-03-05
---

# 용어 정합성 (DESIGN ↔ Bevy)

## 왜 (의도)
동일 개념을 다른 이름으로 부르는 문제를 줄여 문서/코드/테스트 간 의사소통 비용을 낮춘다.

## 무엇 (스펙)
### 근거 DESIGN 문서
- [시스템 디자인](../../../DESIGN/02-systems-design.md)
- [데이터 모델](../../../DESIGN/05-data-model.md)
- [용어](../../../DESIGN/18-terminology.md)

### 용어 매핑
| DESIGN 용어 | 표준 정의 | Bevy 구현 용어 | 비고 |
| --- | --- | --- | --- |
| reducer | 서버 권위 상태 변경 함수 | server call intent | 클라이언트는 의도만 전송 |
| subscribe | 서버 상태 구독 | stream subscription | snapshot + delta 모델 |
| AOI | 관심 영역 스트리밍 범위 | world stream ring | 청크 기반 갱신 |
| claim | 영토/권한 단위 | claim state resource | 권한 비트마스크 연동 |
| item_stack | 스택형 아이템 상태 | inventory stack view | UI 읽기모델 사용 |
| price_index | 가격 지표 | market price view | 그래프/HUD 반영 |
| status_effect | 상태이상 | buff/status component | 전투 루프와 결합 |

### 네이밍 규칙
- 문서와 코드에서 동일한 도메인 접두사 사용(`combat_`, `inventory_`, `claim_`).
- 서버 원문 필드는 가능하면 유지하되, UI 표기는 사용자 용어로 별도 매핑한다.
- 신규 용어는 본 문서에 먼저 등록 후 사용한다.

## 어떻게 (구현)
1. 새 기능 시작 시 용어를 표준 용어 표에서 선택한다.
2. 표준 용어가 없으면 이 문서에 추가하고 리뷰 승인을 받는다.
3. 코드 주석/문서/테스트 케이스 명칭을 동일 용어로 통일한다.
4. 레거시 용어 발견 시 이관 노트 문서와 함께 교정한다.

## 어떻게 검증 (테스트)
- 문서 검증: PR에서 비표준 용어 사용 여부 확인
- 코드 검증: 모듈/이벤트/리소스 명명 규칙 점검
- 테스트 검증: 케이스 명칭이 표준 용어와 일치하는지 확인

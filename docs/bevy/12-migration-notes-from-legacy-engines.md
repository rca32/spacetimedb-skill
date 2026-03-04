---
doc_id: bevy-12-migration-notes-from-legacy-engines
owner: architecture-migration
status: draft
source_design_docs:
  - ../../DESIGN/15-tech-stack-build.md
  - ../../DESIGN/18-terminology.md
  - ../../DESIGN/19-faq.md
depends_on:
  - bevy-00-index
  - bevy-02-module-boundaries
  - bevy-03-client-server-contract
last_reviewed: 2026-03-05
---

# 레거시 엔진 문맥 이관 노트

## 왜 (의도)
기존 Unreal/Unity 문맥으로 작성된 구현 습관을 Bevy 기준 설계로 통합해, 팀 내 해석 차이와 중복 구현을 줄인다.

## 무엇 (스펙)
### 근거 DESIGN 문서
- [기술 스택 및 빌드](../../DESIGN/15-tech-stack-build.md)
- [용어](../../DESIGN/18-terminology.md)
- [FAQ](../../DESIGN/19-faq.md)

### 상태 라벨
- `replaced`: Bevy 방식으로 완전 대체
- `kept`: 공통 개념으로 유지
- `deprecated`: 신규 구현 금지

### 이관 매핑 표
| Legacy 개념 | Bevy 대응 | 상태 | 비고 |
| --- | --- | --- | --- |
| Scene 중심 로직 | Plugin + ECS 시스템 | replaced | 로직은 ECS 시스템으로 이동 |
| Monobehaviour Tick | Schedule 시스템 세트 | replaced | Update/PostUpdate로 분리 |
| Prefab 의존 초기화 | Spawn + Component 조립 | replaced | 데이터 주도 생성으로 전환 |
| RPC 직접 호출 | reducer intent + 구독 | replaced | 서버 권위 계약 준수 |
| ScriptableObject 설정 | Resource/Asset 기반 설정 | kept | 런타임 읽기 모델 분리 |

### 참고 정책
- BitCraft 관련 자료는 영감 출처로만 기록한다.
- 설계 의사결정 근거는 반드시 `DESIGN` 문서에서 인용한다.

## 어떻게 (구현)
1. 기존 문서/코드 용어를 [glossary-alignment](./appendix/glossary-alignment.md)에 먼저 매핑한다.
2. 매핑 결과를 기준으로 코드 모듈명을 Bevy Plugin 기준으로 정리한다.
3. 서버 통신 경로는 `reducer/subscribe` 계약으로 통일한다.
4. deprecated 항목은 새 구현에서 사용하지 않도록 체크를 추가한다.

## 어떻게 검증 (테스트)
- 용어 검증: PR 리뷰에서 legacy 용어 사용 여부 검사
- 구조 검증: Plugin 경계 위반 코드 탐지
- 계약 검증: 직접 RPC 스타일 호출 금지 테스트

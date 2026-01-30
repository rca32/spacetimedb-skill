# 콘텐츠 파이프라인

## 에셋 워크플로우
- 제작 도구: DCC + 내부 임포터.
- 검증: 자동 LOD/폴리곤 검사.

## 레벨/퀘스트 제작
- 도구: 월드 에디터 + 퀘스트 스크립터.
- 리뷰 게이트: 디자인 리뷰, 밸런스 검토.

## 릴리스 프로세스
- 스테이징: QA -> PTB -> 라이브.
- 롤아웃: 리전 순차 배포.

## 정적 데이터 임포트
- 스킬/업적/아이템/건축 설명을 임포트 리듀서로 적재.
- 스키마 변경 시 마이그레이션과 연동.

## 세부 설계 (BitCraft 참고)

### 정적 데이터 단계화
- Stage -> Validate -> Commit 흐름으로 운영 서버 무중단 반영.
- CSV/JSON에서 WorldDefinition, Biome/Resource/NPC/Building/Quest 데이터 적재.

### 파라미터 테이블
- parameters_desc_v2에 에이전트 tick, 이동/전투 수치, NPC 선택 수 등을 저장.
- 운영 중 update_timer로 주기 갱신 가능.

### 콘텐츠 구조화
- BuildingDesc/ConstructionRecipeDesc/TradeOrderDesc의 분리 설계.
- ItemListDesc로 확률 기반 드랍/보상 테이블 구성.

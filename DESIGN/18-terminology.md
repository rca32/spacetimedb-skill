# 용어 사전

## 아키텍처
- SpacetimeDB: 실시간 동기화 기반 백엔드 런타임.
- 테이블(Table): 모든 게임 상태가 저장되는 데이터 구조.
- 리듀서(Reducer): 상태 변경 로직을 수행하는 함수.
- 에이전트(Agent): 예약/주기 실행되는 서버 작업.
- 핸들러(Handler): 리듀서를 기능별로 묶은 모듈.
- 게임 모듈(Game Module): 지역 단위 게임 로직 모듈.
- 글로벌 모듈(Global Module): 엠파이어/전역 상태 모듈.

## 월드/좌표
- 헥스 좌표: 육각 격자 기반 좌표 체계.
- 오프셋 좌표: 저장/직렬화용 좌표 체계.
- 청크(Chunk): 스트리밍 단위의 월드 블록.
- 리전(Region): 지역 서버 단위의 월드 구역.
- 차원(Dimension): 인테리어/던전 등 별도 공간.

## 건축/클레임
- 클레임(Claim): 토템 기반 영토 소유 단위.
- 클레임 타일: 영토를 구성하는 헥스 타일.
- 프로젝트 사이트: 건축 진행 중 상태.
- 풋프린트(Footprint): 건물 점유 타일 집합.
- 유지비/감가: 건축물 유지 비용과 붕괴 메커니즘.

## 권한
- Owner/CoOwner: 최상위 소유/공동 소유 권한.
- Build/Inventory/Usage: 건축/보관/사용 권한.
- OverrideNoAccess: 최우선 차단 권한.
- 권한 그룹: 플레이어/클레임/엠파이어/전체.

## 전투
- CombatState: 전투 쿨다운/상태 테이블.
- Threat: 적의 어그로/위협 점수.
- AttackOutcome: 피해 결과 테이블.

## 거래
- 거래 세션: 직접 거래의 상태 객체.
- 주문장: 매수/매도 주문 테이블.
- 바터 스톨: 고정 교환형 상점.

## NPC/LLM
- NPC 상태 테이블: 관계/감정/기억 요약 저장.
- 대화 리듀서: NPC 대화 요청 처리.
- 안전 필터: 응답 정책 검증 계층.

## 월드 생성
- WorldDefinition: 월드 생성 파라미터 묶음.
- TerrainGraph/EntityGraph: 지형/엔티티 분리 그래프.
- TerrainChunkState: 32x32 지형 청크 상태.
- SurfaceType: Ocean/Lake/River/Ground 등 지형 표면 타입.

## 에이전트/스케줄
- Scheduled Table: 시간 기반 reducer를 트리거하는 테이블.
- Loop Timer: 에이전트 주기 실행을 위한 타이머 엔티티.
- agents_enabled: 에이전트 일괄 ON/OFF 플래그.

## 전투/위협
- AttackTimer: 공격 지연/투사체 타이밍용 예약 엔티티.
- AttackOutcomeState: 피해/치명/회피 결과 기록.
- ThreatState: 어그로/위협 누적 상태.

## 거래/경제
- TradeSessionState: 직접 거래 세션과 잠금.
- market_order: 매수/매도 주문 상태(기준 용어).
- order_fill: 체결/환불 기록(기준 용어).
- AuctionListingState/ClosedListingState는 과거 별칭으로만 유지.
- TradeOrderState: 바터 스톨 주문 상태.

## 클레임/엠파이어
- ClaimLocalState: 공급/유지비/타일 수 등 로컬 상태.
- ClaimTechState: 클레임 기술/제한치.
- EmpireNodeState: 엠파이어 영향력 노드.
- SiegeState: 공성 진행 상태.
- v0 범위: 엠파이어 전용 테이블은 미도입, 길드/클레임 조합으로 표현.

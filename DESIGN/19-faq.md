# FAQ (설계 Q&A)

## 비전·스코프
Q. “코지”를 수치로 정의할 계획이 있나요?
A. 코지 체감은 손실 상한과 회복 속도로 정의한다. 전투 패배 시 인벤토리 드롭 없음, 장비 내구도 손실 5% 이하, 사망 후 3분 내 전투 복귀 가능, 동일 활동 1회 재도전 비용은 세션 평균 획득량의 20% 이내로 제한한다.

Q. 완전 솔로 “비목표”의 경계는 어떻게 되나요?
A. 솔로 플레이는 탐험/제작/거래/기본 전투의 70% 수준까지 도달 가능하도록 설계한다. 최상위 티어(대규모 공성/레이드/대형 클레임 확장)는 파티/길드 협동을 요구한다.

## 월드·좌표·청크
Q. SpacetimeDB와 청크 스트리밍 매핑은 어떻게 되나요?
A. 구독은 region_id + instance_id + aoi_tiles 목록을 기준으로 한다. 플레이어가 청크 경계를 이동하면 AOI 목록을 갱신하고 재구독한다. terrain_chunk는 정적 1회 전송+캐시, 동적 테이블은 AOI 필터+델타 전송으로 처리한다.

Q. 인스턴스 진입/퇴장 시 구독 전환은 어떤 이벤트로 처리하나요?
A. enter_instance/exit_instance 리듀서에서 player_state.instance_id를 변경하고, 서버가 instance_changed 이벤트를 전송해 클라이언트가 구독을 스왑한다.

Q. entity_core의 visibility는 어떻게 처리되나요?
A. entity_core에 visibility 필드를 추가하고 0=Public, 1=Party, 2=Guild, 3=Private로 규정한다. RLS는 visibility에 따라 뷰를 분리해 필터링한다.

Q. 타일 크기/이동 시간은 어떻게 정의하나요?
A. 1타일 = 1.75m 기준으로 잡고, 기본 보행 속도에서 1타일 0.8초 내외가 되도록 설정한다.

Q. AOI 3x3 청크 성능 고려는?
A. 겹치는 청크는 서버 캐시를 공유해 전송량을 절감하고, 대규모 동접 시 AOI 축소/LOD/갱신 주기 완화를 적용한다.

## 전투·밸런스
Q. AttackOutcome 보관 기간은?
A. 원본 attack_outcome은 7일 보관 후 combat_metric으로 요약한다.

Q. Threat 초기화 시점은?
A. 전투 종료 시 즉시 삭제하며, 전투 중이라도 미접촉 30초 경과 시 TTL로 정리한다.

Q. TTK 기준은 솔로/파티 중 어느 쪽인가요?
A. TTK 6–10초(일반), 20–40초(엘리트)는 솔로 기준이다. 파티 스케일링은 EnemyScalingState로 체력 위주 증가, 공격력은 완만 증가로 유지한다.

Q. balance_params의 버전/캐시 불일치는 어떻게 관리하나요?
A. balance_params의 balance_epoch 키를 버전으로 사용하며 변경 시 서버가 브로드캐스트하고 클라이언트는 강제 리로드한다. 세션 중에는 동일 파라미터가 급변하지 않도록 고정한다.

## 경제·거래
Q. market_order/order_fill의 기록 주체와 구독 범위는?
A. 매칭/체결은 Global Services에서 처리하고 order_fill을 기록한다. 클라이언트는 본인 체결(SelfView)만 구독하며, 전역 지표는 price_index로 요약 전파한다.

Q. 직접 거래 45초 타임아웃 시 예외 플로우는?
A. 부분 완료는 허용하지 않는다. 양쪽 수락 전 타임아웃/로그아웃 시 escrow와 inventory_lock을 즉시 롤백한다.

Q. NPC 가격 변동 5%·1회/일은 NPC 단위인가요?
A. NPC별/품목별 1일 1회, 변동폭 5% 이내를 기본으로 한다. 지역 가격 밴드 기준으로 상한/하한을 둬 다중 NPC 간 동기화를 유지한다.

Q. 초기 유저 부재 시 LLM 플레이어는 어느 수준으로 활동하나요?
A. 실제 거래/제작/건축을 수행해 경제를 활성화한다. 일반 플레이어와 동일한 제약(스태미나/내구/재화)을 적용한다.

## LLM NPC
Q. npc_id는 entity_id와 동일한가요?
A. npc_state.npc_id는 entity_core.entity_id와 동일하게 사용한다.

Q. 대화 턴 상한/요약 주기는?
A. 8턴 또는 세션 토큰 상한 도달 시 요약을 저장하고, 동일 세션을 유지한 채 요약본으로 컨텍스트를 축약한다. 10분 이상 비활성 또는 명시 종료 시 세션을 종료한다.

Q. LLM 퀘스트 생성 검증 기준은?
A. 플레이어 진행도(레벨/티어) + llm_params의 레벨-티어 매핑으로 상한을 판단한다. 예시로 L1–5는 “일반~고급”만 허용하며, 초과 제안은 즉시 거절한다. 실패 시 “NPC가 제안을 거절/보류” 응답으로 대체한다.

## 인증·권한·RLS
Q. RLS의 “viewer”는 어떻게 적용하나요?
A. public/party/guild/self 뷰를 분리하고 :viewer_identity/:viewer_entity_id를 기준으로 필터링한다. 클라이언트는 베이스 테이블이 아닌 뷰를 구독한다.

Q. permission_state의 subject_id는 길드/엠파이어까지 포함하나요?
A. subject_type을 도입해 Player/Party/Guild/Empire/Public를 구분한다. subject_id는 해당 그룹의 ID를 가리키며 멤버십은 membership 테이블로 해석한다.

## 아키텍처·SpacetimeDB
Q. World Shard와 SpacetimeDB 인스턴스 관계는?
A. 기본은 Shard 1개 = SpacetimeDB 1개이며, 초기에는 리전 1개를 1샤드에 매핑한다. 이후 핫스팟 시 청크 단위로 리샤딩한다.

Q. Event/Command Bus는 어디에 두나요?
A. Bus는 외부 시스템(NATS/Kafka 등)으로 두고, 어댑터 서비스가 메시지를 수신해 리듀서를 호출한다.

Q. 글로벌 서비스와 게임 모듈 분리는 어떻게 되나요?
A. 글로벌 모듈은 별도 SpacetimeDB 인스턴스에서 운영하며, 교차 호출은 버스/메시지로만 수행한다.

## 운영·테스트
Q. LLM 봇의 identity는 어떻게 구분하나요?
A. player_state.is_bot 플래그로 구분하고, 운영/지표/비용 추적에 사용한다. 공개 노출은 최소화한다.

Q. “회귀 5% 차단”의 기준은?
A. 배포 직전 7일 이동 평균 대비 5% 이상 악화 시 차단한다. 대상 지표는 D1/D7 리텐션, ARPDAU, 평균 TTK, 경제 인플레 지수다.

Q. LLM/TUI 자동 플레이 테스트는 실제 TUI인가요?
A. ncurses 형태는 필수 아님. LLM이 이해 가능한 텍스트 상태 출력 + Toolcalling 방식으로 액션을 수행한다.

## 용어·문서 일관성
Q. AuctionListingState/ClosedListingState와 market_order/order_fill 용어는?
A. 기준 용어는 market_order/order_fill이며, AuctionListingState/ClosedListingState는 과거 별칭으로만 유지한다.

Q. 엠파이어 전용 테이블은 도입하나요?
A. v0 범위에서는 별도 테이블을 두지 않고 길드/클레임 조합으로 표현한다.

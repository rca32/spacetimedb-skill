# World, AOI, Rendering (Three.js)

## 1. World Data Sources
주요 공개 테이블:
- `transform_state`
- `terrain_chunk`
- `resource_node`
- `building_state`
- `claim_state`
- `combat_state`
- `attack_outcome`
- `npc_state`

## 2. AOI Strategy
기본 정책:
- region 필터 필수
- 플레이어 중심 chunk bounds 선택 구독
- 플레이어 이동 시 AOI 재계산

권장 기본값:
- terrain: 반경 3 chunk
- dynamic entity: 반경 2 chunk
- combat/outcome: 최근 500건 상한

## 3. koota Entity Mapping
클라이언트 traits:
- `NetEntity { table, serverId }`
- `WorldObjectKind { kind }` (`Player`, `Npc`, `Building`, `ResourceNode`, ...)
- `Position`, `Rotation`, `PresentationTransform`
- `ThreeObjectRef`

매핑 규칙:
1. 서버 row upsert -> 기존 entity trait update
2. 미존재 row -> entity spawn + Three object attach
3. AOI 외 row delete/unsub -> despawn 또는 object pool 반환

## 4. Three.js Scene Strategy
- 월드 정적 레이어: terrain/building
- 동적 레이어: player/npc/combat fx
- UI 레이어: CSS/DOM HUD 또는 별도 overlay canvas

성능 규칙:
- 동일 리소스 노드는 `InstancedMesh` 우선
- 정적 지형은 chunk cache + geometry 재사용
- material 재사용 원칙, 불필요한 투명 재질 최소화

## 5. Camera (Third-Person)
구성:
- Follow target: local player `PresentationTransform`
- Pivot + spring arm + collision probe
- 카메라 보간은 고정 스텝으로 실행

권장 파라미터:
- 거리 5.5m
- 높이 2.0m
- 회전 감도 0.12

## 6. Render Consistency Rules
- authoritative transform과 presentation transform 분리
- authoritative는 Sync 시스템만 갱신
- 렌더는 presentation transform만 사용
- 프레임 루프 내 new allocation 금지

## 7. Memory and Dispose Policy
- 언로드 시 `geometry.dispose()`, `material.dispose()`, `texture.dispose()` 호출
- render target/postprocess 자원도 명시적으로 해제
- 월드 리셋 시 scene subtree 단위로 dispose

## 8. Recovery
재연결 후:
1. world cache 초기화
2. AOI 구독 재생성
3. 최초 snapshot 완료 전까지 렌더 최소화
4. snapshot 준비 후 정상 렌더 재개

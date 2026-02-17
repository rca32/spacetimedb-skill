# World, AOI, Rendering

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
- region 단위 필터는 필수
- 플레이어 중심 hex/chunk bounds 기반 선택 구독
- 플레이어 이동 시 AOI 재계산

권장 기본값:
- terrain: 반경 3 chunk
- dynamic entity: 반경 2 chunk
- combat/outcome: 최근 500건 상한

## 3. Entity Mapping
클라이언트 Entity Tag:
- `NetEntity { server_id }`
- `WorldObjectKind` (`Player`, `Npc`, `Building`, `ResourceNode`, ...)

매핑 규칙:
1. 서버 row upsert -> 존재하면 component update
2. 없으면 spawn
3. AOI 밖 row delete/unsub -> despawn (또는 object pool 반환)

## 4. 3D Third-Person Camera
구성:
- Follow target: 로컬 플레이어 `Position` + 입력 기반 `viewYaw/viewPitch`
- Rig: `Root -> Shoulder -> Hand -> Camera`
- 동기화: 입력 yaw/pitch와 body yaw를 분리하고, 이동 시 body가 회전 수렴
- 충돌: 장애물 감지 시 카메라 pull-in + in/out damping + hold smoothing
- 안정성: 카메라 최소 높이 하한(`targetY + minCameraHeightOffset`) 강제

권장 파라미터:
- 기본 거리 5.5m
- follow height 0.35m
- 최소 거리 1.1m
- 회전 감도 0.12 deg/pixel
- 기본 pitch -18 deg

환경 변수(현재 구현):
- `VITE_CAMERA_FOLLOW_HEIGHT`
- `VITE_CAMERA_SHOULDER_OFFSET_X/Y/Z`
- `VITE_CAMERA_VERTICAL_ARM_LENGTH`
- `VITE_CAMERA_SIDE`, `VITE_CAMERA_DISTANCE`, `VITE_CAMERA_MIN_DISTANCE`
- `VITE_CAMERA_POSITION_DAMPING`, `VITE_CAMERA_AIM_DAMPING`
- `VITE_CAMERA_COLLISION_BUFFER`, `VITE_CAMERA_COLLISION_DAMPING_INTO`, `VITE_CAMERA_COLLISION_DAMPING_FROM`, `VITE_CAMERA_COLLISION_SMOOTHING_SECONDS`
- `VITE_CAMERA_MIN_HEIGHT_OFFSET`
- `VITE_SYNC_MOUSE_TURN_SENS_DEG`, `VITE_SYNC_MOUSE_PITCH_SENS_DEG`
- `VITE_SYNC_BODY_COUPLING_MODE`, `VITE_SYNC_BODY_TURN_SPEED_DEG`, `VITE_SYNC_TURN_SLOWDOWN_START_DEG`, `VITE_SYNC_TURN_STOP_DEG`

상세 명세와 고도화 계획:
- `12-camera-system-cinemachine-port-plan.md`

## 5. LOD/Streaming
- `terrain_chunk`: chunk 단위 mesh/cache
- 원거리 건물은 저해상도 mesh 또는 billboard
- resource node는 instancing 우선
- 텍스처/mesh는 AssetServer 비동기 로딩

## 6. Visual Consistency Rules
- authoritative 위치와 렌더 위치 분리
- authoritative는 sync plugin이 소유
- 렌더 위치는 보간된 presentation transform

## 7. AOI Subscription Examples
클라이언트가 생성하는 SQL 예시:
```sql
SELECT * FROM transform_state ts WHERE ts.region_id = :region
SELECT * FROM building_state b WHERE b.region_id = :region AND b.hex_x BETWEEN :minx AND :maxx AND b.hex_z BETWEEN :minz AND :maxz
SELECT * FROM claim_state c WHERE c.region_id = :region
SELECT * FROM resource_node r
```

## 8. Recovery
재연결 후:
1. world entity cache clear
2. AOI 구독 재생성
3. 최초 snapshot 수신 후 렌더 재개

# Domain: Building, Claim, Housing

## 1. Server Contract Mapping
### 1.1 Reducers
- `building_place`
- `building_advance`
- `building_deconstruct`
- `claim_totem_place`
- `claim_expand`
- `housing_create`
- `housing_enter`
- `housing_change_entrance`
- `interior_mark_empty`
- `housing_propagate_permissions`
- `rent_set_whitelist`

### 1.2 Tables
- `building_state`
- `claim_state`
- `housing_state`
- `dimension_network`
- `dimension_desc`
- `rent_state`
- `interior_collapse_timer`
- `permission_state` (private, 서버 검증 전용)

## 2. Building Flow
1. 빌드 모드에서 위치 지정
2. `building_place` 호출
3. `state=0(project)` 표시
4. 작업 입력마다 `building_advance`
5. `build_progress == build_required`면 `state=1(complete)`
6. 해체는 `building_deconstruct`

클라이언트는 거리/재료/권한을 사전 검사하되 최종 판정은 서버 결과를 따른다.

## 3. Claim Flow
1. 완공 건물을 토템으로 선택
2. `claim_totem_place`
3. 성공 시 권역 표시
4. 확장 입력은 `claim_expand`

UI는 반경/티어 변화(`radius`, `tier`)를 실시간 갱신한다.

## 4. Housing Flow
1. `housing_create`로 주거 생성
2. 입장: `housing_enter`
3. 입구 변경: `housing_change_entrance`
4. 내부 비움 토글: `interior_mark_empty`
5. 권한 전파: `housing_propagate_permissions`
6. 임대 화이트리스트: `rent_set_whitelist`

## 5. Permission UX
- 권한 부족 에러 시 액션 잠금 + 권한 요청 힌트 노출
- 화이트리스트 편집은 owner/admin만 활성화
- 주거 `locked_until` 남은 시간을 HUD로 표시

## 6. Edge Cases
1. region mismatch
2. too far from build position
3. housing must be empty to move entrance
4. no access to housing

## 7. Acceptance Criteria
- 건축 배치/진행/해체 시 상태 전이 정확
- 클레임 확장 반경/티어 UI 동기화 정확
- 주거 권한/화이트리스트/락 규칙 준수

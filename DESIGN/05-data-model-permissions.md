# 권한 플래그 비트마스크 해석

## permission_state.flags 비트 정의
| Flag | Bit | 의미 | 비고 |
|---|---:|---|---|
| `perm_view` | 0x0001 | 대상 엔티티/클레임 조회 권한 | 건물/클레임/아이템 요약 조회 |
| `perm_use` | 0x0002 | 사용/상호작용 권한 | 상호작용/작동/접근 |
| `perm_build` | 0x0004 | 건설/수정 권한 | 배치/철거/업그레이드 |
| `perm_inventory` | 0x0008 | 인벤토리 접근 권한 | 컨테이너 접근/회수 |
| `perm_trade` | 0x0010 | 거래/교환 권한 | 상점/바터/거래 사용 |
| `perm_admin` | 0x4000 | 관리 권한 | 권한 편집/멤버 관리 |
| `perm_owner` | 0x8000 | 소유자급 권한(전체) | 최상위 권한 |

## 플래그 조합 예시
- `perm_view | perm_use`: 일반 방문자(조회/사용만 가능)
- `perm_view | perm_use | perm_build`: 건설 참여자
- `perm_owner`: 소유자/관리자급 권한

## 적용 테이블
- `permission_state`: flags 필드로 저장
- `building_state`/`claim_state`: RLS 조건에서 `perm_view`/`perm_owner` 사용

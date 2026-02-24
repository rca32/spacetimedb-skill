# 11 Audio Runtime

작성일: 2026-02-24
범위: 2D/3D 오디오 런타임, 버스 믹싱, 에셋 매핑

## 목표
- 월드 3D 오디오와 UI/BGM 2D 오디오를 통합 운영한다.
- 이벤트 기반 재생으로 동기화/성능/디버깅 가능성을 확보한다.

## 범위
- 포함: listener, static/position audio, bus, spatial params, asset mapping.
- 제외: 음원 리마스터링 제작.

## 인터페이스
- 오디오 서비스 API:
  - `play2D(key, options): AudioHandle`
  - `play3D(key, worldPos, options): AudioHandle`
  - `stop(handle): void`
  - `setBusVolume(busId, volume01): void`
  - `setMute(busId, muted): void`
- listener API:
  - `bindListenerTo(entityIdOrCameraId): void`
- 이벤트 매퍼:
  - `mapGameEventToAudio(eventCode, payload): AudioCue[]`

## 데이터/이벤트
- bus 구조:
  - `master`, `bgm`, `sfx`, `ui`, `ambient`, `voice`.
- spatial 기본값:
  - `refDistance=4m`, `maxDistance=45m`, `rolloff=1.0`.
  - directional cone: `inner=45deg`, `outer=120deg`, `outerGain=0.35`.
- 동시 재생 제한:
  - 동일 key 동시 재생 `max=4`.
  - `ui_*` key는 `120ms` rate limit.
- 에셋 소스:
  - 입력: `assetdirectory/audio/kenney_repo/Audio (295 files)`.
  - 반영: `stitch-orillusion-clientv2/public/audio/{bgm,sfx,ui,ambient}`.
- 키 네이밍:
  - `ui_click_primary`, `ui_error_soft`, `rpg_hit_blunt_01`, `ambient_wind_forest_01`.

## 실패 모드
- 키 누락으로 무음.
- listener 바인딩 손실로 3D 위치 오디오 붕괴.
- bus gain 비정상으로 클리핑/왜곡.
- AOI 외부 오디오 미정리로 성능 저하.

## 검증
- 시나리오:
  - `S03` 전투 hit/skill/피격 오디오.
  - `S04` UI 다중 클릭/모달 전환.
  - `S05` 날씨 전환 ambient 교체.
- assertion:
  - `A-AUDIO-001` 키 해상 실패 0건.
  - `A-AUDIO-002` 버스별 볼륨 적용 오차 < `0.01`.
  - `A-AUDIO-003` AOI 밖 3D 오디오 active count `0`.
- 지표:
  - active voices, audio thread ms, decode latency.

## 운영
- 자산 반입은 링크 금지, 복사본만 사용.
- 파일명 정규화(`snake_case`) 필수.
- 음원 누락 시 fallback key(`ui_fallback_click`) 자동 대체.

## 수용 기준
- 2D/3D 오디오 동시 운용에서 아티팩트 없이 동작.
- 서버 이벤트와 재생 타이밍 동기화가 유지.
- 자동 시나리오로 오디오 회귀를 탐지 가능.

## Cross-Refs
- `03-spacetimedb-contract.md`
- `13-asset-pipeline-kenney.md`
- `15-test-plan-and-acceptance.md`

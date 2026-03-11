# Seed Asset Staging

이 디렉터리는 `assetdirectory/pack/kenney/*`에서 선별한 초기 seed asset을 `web-client` 빌드 입력 형태로 스테이징하는 위치다.

## 사용 흐름

1. `bun run assets:stage`
2. `assetpack/assetpack.config.ts` 기준으로 atlas/bundle taxonomy 정리
3. `public/assets` 또는 별도 build output으로 manifest 생성

## 현재 대상 패키지

- `ui-pack`
- `ui-pack-rpg-expansion`
- `input-prompts`
- `tiny-town`
- `top-down-shooter`
- `impact-sounds`

# RFC-007: Bevy 최신 그래픽/최적화 기술 적용성 조사 (Web MMORPG 기준)

- Status: Draft
- Date: 2026-03-05
- Scope: 조사/설계 (코드 반영 제외)
- Baseline:
  - Local engine source: `bevy 0.19.0-dev` (`/bevy/Cargo.toml`)
  - Stable reference line: `bevy 0.18.x` (공식 릴리스/문서 기준)

## 1. 조사 목적

Stitch MMORPG Web 클라이언트 관점에서 Bevy 최신 기술 중 실제 도입 가치를 판별하고, `Adopt Now / Adopt with Guardrail / Experimental Track / Defer`로 고정한다.

## 2. 최신성 기준

1. 공식 Bevy 뉴스: `Bevy 0.18` 릴리스(2026-01-13).
2. `docs.rs` 최신 crate 라인: `0.18.1` 확인.
3. 현재 워크스페이스 엔진은 `0.19.0-dev`이므로, 설계는 dev 선행 + stable fallback 동시 유지.

## 3. 기술 적용성 매트릭스

| Tech | 분류 | 적용 결정 | Web MMORPG 적용 방식 | 리스크/가드레일 |
|---|---|---|---|---|
| WebGPU backend | 렌더 백엔드 | Adopt Now | 기본 배포 아티팩트로 사용 | 브라우저 미지원 시 WebGL2 fallback 필수 |
| WebGL2 backend | 렌더 백엔드 | Adopt Now | 호환성 아티팩트 별도 빌드 | 비주얼 품질 하향 정책 필요 |
| Cargo Feature Collections | 빌드/최적화 | Adopt Now | `default-features=false` + 필요한 기능만 명시 | 기본 프로필 과다 활성화 금지 |
| `bevy_pbr` + 개선된 PBR 파이프라인 | 그래픽 | Adopt with Guardrail | 월드/빌딩/자원 렌더 기본 경로 | 품질 티어(저/중/고)로 실시간 하향 |
| `bevy_post_process` | 그래픽 | Adopt with Guardrail | bloom/tonemap 등 최소 세트만 사용 | AOI 부하 시 자동 비활성 |
| First-Party Camera Controllers | UX/그래픽 | Adopt Now | 3인칭 follow/aim 기반 카메라 리그 표준화 | 카메라 충돌/클리핑 보정 별도 시스템 유지 |
| Asset pipeline (Seekable readers, asset processor 개선) | 로딩/최적화 | Adopt Now | 대형 GLB/텍스처 스트리밍 안정화 | 파이프라인 전환 시 캐시 무효화 전략 필요 |
| glTF 확장/호환 개선 | 자산 | Adopt Now | Kenney/GLTF 샘플 로드 안정성 향상 기대 | 확장별 fallback material 준비 |
| AO/조명 고급 기능(0.18 신기능) | 그래픽 | Experimental Track | 품질 프로필 `high`에서만 실험 | 저사양/모바일 브라우저 기본 비활성 |
| Meshlet/가상지오메트리 계열 | 실험 그래픽 | Experimental Track | 대규모 오브젝트 밀집 맵에서만 별도 검증 | 디버그/비교 빌드 외 기본 비활성 |
| Solari/레이트레이싱 계열 | 실험 그래픽 | Defer | 초기 MMORPG Web 범위에서 제외 | 성능/호환성 리스크 큼 |

## 4. MMORPG 특화 최적화 정책

1. 네트워크/AOI 부하 우선:
  - 렌더 품질보다 `Net ingest + Snapshot apply` 시간을 우선 보호.
2. 프레임 예산:
  - `Update + Render <= 16.6ms` 목표, 지속 초과 시 즉시 품질 하향.
3. 품질 하향 순서:
  - PostFX -> Shadow quality -> 풀/소품 밀도 -> 고급 재질 효과.
4. 아티팩트 전략:
  - `webgpu` 1종 + `webgl2` 1종 동시 유지.

## 5. Bevy build profile 고정안

| Profile ID | 목적 | 핵심 feature 방향 |
|---|---|---|
| `web-prod-webgpu` | 주 배포 | `web`, `webgpu`, 3D/UI/asset 최소 집합 |
| `web-prod-webgl2` | fallback 배포 | `webgl2` 중심 동일 기능축 |
| `web-dev` | 내부 개발 | prod + dev tool 계열 |

## 6. 리스크와 대응

| 리스크 | 영향 | 대응 |
|---|---|---|
| 0.19-dev API churn | 중~높음 | 인터페이스 문서화 우선, 구현은 adapter 계층으로 격리 |
| WebGPU 브라우저 편차 | 높음 | WebGL2 fallback 아티팩트 상시 유지 |
| 고급 그래픽 기능 과도 도입 | 높음 | `Experimental Track`에서만 관리, 기본 비활성 |

## 7. 결론

현재 단계의 권장 전략은 다음과 같다.

1. `WebGPU + WebGL2 dual track`를 전제로 아키텍처를 고정한다.
2. 0.18 계열에서 검증된 경로를 우선 채택하고, 0.19-dev 기능은 실험 트랙으로 분리한다.
3. MMORPG 핵심(동시성/AOI/응답성)을 해치지 않는 범위에서 그래픽 기능을 단계적으로 활성화한다.

## 8. References

- Bevy 0.18 release note: https://bevy.org/news/bevy-0-18/
- Bevy crate versions: https://docs.rs/crate/bevy/latest
- Bevy examples WebGL2/WebGPU notes: https://github.com/bevyengine/bevy/blob/latest/examples/README.md
- Local feature definitions:
  - `/home/rca32/workspaces/spacetimedb-skill/bevy/Cargo.toml`
  - `/home/rca32/workspaces/spacetimedb-skill/bevy/docs/cargo_features.md`

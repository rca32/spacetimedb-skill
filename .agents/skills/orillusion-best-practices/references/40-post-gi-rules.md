# Post Processing and GI Rules

## TOC

- `post-enable-only-needed`
- `post-resolution-scaling-first`
- `post-bloom-emissive-control`
- `post-ssr-screen-space-limits`
- `gi-probe-volume-fit-scene`
- `gi-auto-render-off-for-static`
- `gi-memory-budget-oct-size`

## Rule `post-enable-only-needed`

- Priority: CRITICAL
- Anti-pattern: 모든 포스트 효과를 기본 활성화한 채 품질 저하 원인을 찾는다.
- Preferred pattern: 효과를 하나씩 켜고 장면 목적에 맞는 최소 조합만 유지한다.
- Verification: 활성화된 포스트 효과 목록과 성능 영향표를 남긴다.
- Evidence (Local): `orillusion-web/docs/guide/advanced/posteffect.md`
- Evidence (External): <https://www.orillusion.com/guide/advanced/posteffect.html>

## Rule `post-resolution-scaling-first`

- Priority: HIGH
- Anti-pattern: 품질 손실 없이 성능을 확보하려고 파라미터만 미세 조정한다.
- Preferred pattern: SSR/GTAO/TAA 등은 내부 해상도(비율)와 샘플링 횟수를 먼저 조절한다.
- Verification: 해상도 비율 조정 전후 FPS와 artifact를 비교한다.
- Evidence (Local): `orillusion/src/Engine3D.ts`
- Evidence (External): <https://www.orillusion.com/guide/advanced/post_ssr.html>

## Rule `post-bloom-emissive-control`

- Priority: HIGH
- Anti-pattern: Bloom 강도를 과하게 높여 전체 화면이 퍼지도록 만든다.
- Preferred pattern: `luminanceThreshole`과 material `emissive`를 함께 조정해 의도된 영역만 강조한다.
- Verification: 발광 오브젝트와 비발광 오브젝트 대비를 QA 스냅샷으로 확인한다.
- Evidence (Local): `orillusion-web/docs/guide/advanced/post_bloom.md`
- Evidence (External): <https://www.orillusion.com/guide/advanced/post_bloom.html>

## Rule `post-ssr-screen-space-limits`

- Priority: HIGH
- Anti-pattern: SSR을 완전한 반사 해법으로 가정하고 화면 밖/후면 반사 누락을 버그로 간주한다.
- Preferred pattern: SSR의 본질적 한계를 전제로 파라미터와 대체 반사 전략을 설계한다.
- Verification: 카메라 각도 변화에서 SSR 누락 영역이 예상 범위인지 확인한다.
- Evidence (Local): `orillusion-web/docs/guide/advanced/post_ssr.md`
- Evidence (External): <https://www.orillusion.com/guide/advanced/post_ssr.html>

## Rule `gi-probe-volume-fit-scene`

- Priority: CRITICAL
- Anti-pattern: 장면 크기와 무관하게 고정 probe count/space를 사용한다.
- Preferred pattern: `probeX/Y/ZCount`, `probeSpace`, `offset`을 월드 크기에 맞춰 먼저 맞춘다.
- Verification: GI 볼륨 커버리지와 누락 구역을 디버그 뷰로 확인한다.
- Evidence (Local): `orillusion-web/docs/guide/advanced/gi.md`
- Evidence (External): <https://www.orillusion.com/guide/advanced/gi.html>

## Rule `gi-auto-render-off-for-static`

- Priority: HIGH
- Anti-pattern: 정적 장면에서도 `autoRenderProbe`를 계속 켜둔다.
- Preferred pattern: 충분히 수렴한 뒤 `autoRenderProbe`를 꺼서 GPU 예산을 회수한다.
- Verification: GI 수렴 이후 auto update off 상태에서 품질 유지 여부를 확인한다.
- Evidence (Local): `orillusion-web/docs/guide/advanced/gi.md`
- Evidence (External): <https://www.orillusion.com/guide/advanced/gi.html>

## Rule `gi-memory-budget-oct-size`

- Priority: HIGH
- Anti-pattern: `octRTMaxSize`, `octRTSideSize`, `probeSize`를 과하게 설정해 메모리/대역폭 병목을 만든다.
- Preferred pattern: 장면 요구치에 맞는 최소 텍스처 크기로 시작해 단계적으로 상향한다.
- Verification: GI 관련 설정값 변경마다 GPU 메모리와 프레임 시간을 기록한다.
- Evidence (Local): `orillusion/src/Engine3D.ts`
- Evidence (External): <https://www.orillusion.com/guide/advanced/gi.html>

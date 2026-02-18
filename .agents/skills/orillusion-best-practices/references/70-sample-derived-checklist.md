# Sample-Derived Checklist

## 목적

Orillusion 공식 샘플(`orillusion/samples`, `orillusion-web/docs/public/demos`)에서 반복적으로 확인되는 설정 패턴을 QA 체크리스트로 정리한다.

## A. Startup Checklist

- [ ] `Engine3D.setting.*` 핵심값을 `init` 이전에 설정했는가?
- [ ] `await Engine3D.init()` 완료 후 `View3D`와 `startRenderView`를 호출했는가?
- [ ] 카메라 컨트롤러(`HoverCameraController`/`OrbitController`)를 의도에 맞게 배치했는가?
- [ ] 성능 측정 시 `Stats`를 일시적으로 활성화했는가?

Evidence (Local): `orillusion-web/docs/public/demos/getting_start/cube.ts`

## B. Render and Shadow Checklist

- [ ] `shadowBound`, `shadowSize`, `shadowBias`를 장면 규모에 맞춰 조정했는가?
- [ ] 대규모 월드에서 CSM 또는 대체 전략을 검토했는가?
- [ ] 디버그 렌더 옵션을 릴리스에서 비활성화했는가?

Evidence (Local): `orillusion/samples/lights/Sample_DirectLightShadow.ts`

## C. GI and Post Checklist

- [ ] GI 볼륨(`probe count/space/offset`)이 실제 플레이 영역을 커버하는가?
- [ ] 정적 장면에서 `autoRenderProbe`를 껐는가?
- [ ] Bloom/SSR/GTAO를 필요 최소 조합으로 유지했는가?

Evidence (Local): `orillusion-web/docs/public/demos/advanced/Sample_GI.ts`

## D. Compute Checklist

- [ ] 워크그룹 크기와 dispatch 크기가 해상도에 맞게 계산되는가?
- [ ] compute buffer 업데이트 후 `apply()` 호출이 보장되는가?
- [ ] storage texture usage 플래그가 올바른가?

Evidence (Local): `orillusion-web/docs/public/demos/compute/gaussianBlur.ts`

## E. Resource and Lifecycle Checklist

- [ ] 동일 URL 리소스 중복 로딩이 없는가?
- [ ] 공유 geometry/material에 `destroy(true)`를 사용하지 않았는가?
- [ ] 장면 언로드 시 불필요 리소스를 명시적으로 해제했는가?

Evidence (Local): `orillusion/src/assets/Res.ts`

## F. Physics/Particle Checklist

- [ ] Physics는 render loop와 동기화되어 업데이트되는가?
- [ ] 정적 리지드바디는 `mass = 0`인가?
- [ ] 파티클에서 `maxParticle`/`emissionRate` 예산이 정의되어 있는가?

Evidence (Local): `orillusion-web/docs/public/demos/physics/demo1.ts`

## G. Useful Audit Commands

```bash
rg -n "Engine3D\.setting\.|Engine3D\.init\(|Engine3D\.startRenderView\(" orillusion/samples orillusion-web/docs/public/demos -g '*.ts'
```

```bash
rg -o "Engine3D\.setting\.[a-zA-Z0-9_\.]+" orillusion/samples orillusion-web/docs/public/demos -g '*.ts' | sort | uniq -c | sort -nr
```

```bash
rg -n "destroy\(true\)" orillusion/src orillusion-web/docs/public/demos -g '*.ts'
```

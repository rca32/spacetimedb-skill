---
doc_id: bevy-10-assets-content-pipeline
owner: content-tech
status: draft
source_design_docs:
  - ../../DESIGN/14-pipeline-content.md
  - ../../DESIGN/15-tech-stack-build.md
  - ../../assetdirectory/README.md
depends_on:
  - bevy-01-implementation-roadmap
last_reviewed: 2026-03-05
---

# 에셋 및 콘텐츠 파이프라인

## 왜 (의도)
에셋 소스 수집과 런타임 사용 경로를 분리해 라이선스/품질/빌드 안정성을 보장한다.

## 무엇 (스펙)
### 근거 문서
- [파이프라인 및 콘텐츠](../../DESIGN/14-pipeline-content.md)
- [기술 스택 및 빌드](../../DESIGN/15-tech-stack-build.md)
- [assetdirectory 안내](../../assetdirectory/README.md)

### 경로 정책
- `assetdirectory/`: 실험/수집/검수 전용
- 실제 클라이언트 런타임 리소스: Bevy 프로젝트의 별도 `assets/` 경로
- `assetdirectory`를 빌드 경로에 직접 연결하지 않음

### 콘텐츠 단계
1. 수집: 외부 에셋 획득 및 라이선스 기록
2. 검수: 규격/품질/용량/네이밍 확인
3. 변환: 포맷 변환/압축/LOD 생성
4. 배포: 클라이언트 런타임 경로 반영

### 품질 기준
- 메모리 예산 초과 에셋 차단
- 텍스처/모델/오디오 네이밍 규칙 준수
- 메타데이터(출처, 라이선스, 버전) 필수

## 어떻게 (구현)
1. 에셋 매니페스트 파일을 만들어 수집-검수-배포 상태를 추적한다.
2. CI에서 매니페스트 규칙(누락 필드/금지 경로)을 검증한다.
3. 런타임 경로에 들어가는 에셋은 변환 파이프라인을 통과한 산출물만 허용한다.
4. 라이선스 리포트를 릴리즈 단위로 자동 생성한다.

## 어떻게 검증 (테스트)
- 경로 테스트: `assetdirectory` 직참조 금지 규칙 검증
- 품질 테스트: 규격/용량/네이밍 린트 검사
- 라이선스 테스트: 출처/라이선스 누락 에셋 차단 검증

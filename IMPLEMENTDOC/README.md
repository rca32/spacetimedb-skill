# IMPLEMENTDOC 구조 가이드

`IMPLEMENTDOC`는 구현 문서를 **주제별 디렉터리 + 날짜 기반 파일명**으로 관리한다.

## 1) 디렉터리 구조
- `overview/`
  - 프로젝트 레벨 마스터 문서
- `architecture/`
  - 서버/클라이언트 아키텍처, 정책, 스케줄링 등 장기 참조 문서
- `plans/worldgen/`
  - 월드젠 분석/단계별 실행계획(P0~P4 등)
- `plans/server/`
  - 서버 기능/아키텍처 실행계획
- `plans/client/`
  - 클라이언트 기능/렌더/UI 실행계획
- `logs/implementation/`
  - 구현 작업 로그(일자별)
- `logs/worldgen/`
  - 월드젠 진행 로그/상태 리포트
- `logs/server/`
  - 서버 작업 로그
- `logs/client/`
  - 클라이언트 작업 로그
- `guides/`
  - 실행 가이드/운영 가이드
- `optimizations/`
  - 성능 최적화 기록과 튜닝 메모

## 2) 파일명 규칙
- 기본 형식:
  - `YYYY-MM-DD-topic.md`
- 예시:
  - `2026-02-21-gap-analysis.md`
  - `2026-02-21-p3-generation-streaming-architecture-plan.md`
  - `2026-02-21-resource-render-instancing.md`

규칙:
1. 파일명 앞번호(`00-`, `15-`)를 더 이상 사용하지 않는다.
2. 날짜는 작성/최초 생성일 기준으로 고정한다.
3. 같은 주제 업데이트는 기존 문서를 갱신하고, 큰 단위 전환 시에만 새 날짜 파일을 만든다.

## 3) 문서 작성 규칙
1. 상단 3줄 고정:
   - 제목
   - 작성일
   - 범위/대상(필요 시)
2. 최소 섹션:
   - 배경
   - 적용 내용(또는 계획)
   - 검증/근거
   - 리스크/다음 액션
3. 다른 문서를 링크할 때는 항상 `IMPLEMENTDOC/...` 절대 경로를 사용한다.

## 4) 신규 문서 추가 절차
1. 먼저 카테고리 디렉터리를 결정한다.
2. `YYYY-MM-DD-topic.md`로 파일을 생성한다.
3. `overview/master.md`의 "최근 작업 로그" 또는 관련 섹션에 링크를 추가한다.
4. 구조 변경/이동이 있었으면 `README.md`의 구조/규칙 섹션을 최신 상태로 갱신한다.

## 5) 빠른 진입점
- 마스터: `IMPLEMENTDOC/overview/master.md`
- 서버 계획: `IMPLEMENTDOC/plans/server/`
- 클라이언트 계획: `IMPLEMENTDOC/plans/client/`
- 월드젠 계획: `IMPLEMENTDOC/plans/worldgen/`
- 서버 로그: `IMPLEMENTDOC/logs/server/`
- 클라이언트 로그: `IMPLEMENTDOC/logs/client/`
- 최신 구현 로그: `IMPLEMENTDOC/logs/implementation/`
- 최적화 기록: `IMPLEMENTDOC/optimizations/`
- 서버 운영 가이드: `IMPLEMENTDOC/guides/stitch-server-operations-guide.md`
- 클라이언트 개발 가이드: `IMPLEMENTDOC/guides/stitch-orillusion-client-development-guide.md`

# AGENTS 가이드

## 빠른 앵커
<!--- [IMPLEMENTDOC 운영 원칙 (서버/클라이언트 공통)](#implementdoc-운영-원칙-서버클라이언트-공통)
- [IMPLEMENTDOC 핵심 링크](#implementdoc-핵심-링크)-->
- [BitCraftPublicDoc ↔ BitCraftPublic/BitCraftServer 관계 (참고 수준)](#bitcraftpublicdoc--bitcraftpublicbitcraftserver-관계-참고-수준)
- [DESIGN 문서](#design-문서)
- [SpacetimeDB 작업 규칙](#spacetimedb-작업-규칙)
- [WSL 브라우저 자동화 규칙](#wsl-브라우저-자동화-규칙)
- [assetdirectory 안내](#assetdirectory-안내)

<!--## IMPLEMENTDOC 운영 원칙 (서버/클라이언트 공통)
- 서버/클라이언트 개발 모두 **IMPLEMENTDOC를 기준 문서 저장소**로 사용한다.
- 기능 개발 전에는 관련 문서를 먼저 확인한다.
  - 아키텍처/정책: `IMPLEMENTDOC/architecture/`
  - 기존 로그/근거: `IMPLEMENTDOC/logs/`
  - 가이드/런북: `IMPLEMENTDOC/guides/`
- 계획 문서는 반드시 IMPLEMENTDOC에 작성한다.
  - 서버 계획: `IMPLEMENTDOC/plans/server/`
  - 클라이언트 계획: `IMPLEMENTDOC/plans/client/`
  - 월드젠 계획: `IMPLEMENTDOC/plans/worldgen/`
- 작업 로그도 반드시 IMPLEMENTDOC에 남긴다.
  - 서버 로그: `IMPLEMENTDOC/logs/server/`
  - 클라이언트 로그: `IMPLEMENTDOC/logs/client/`
  - 공통/횡단 로그: `IMPLEMENTDOC/logs/implementation/`
- 문서 추가/수정 후 `IMPLEMENTDOC/overview/master.md`에 링크를 갱신한다.
- 문서 구조/규칙 변경 시 `IMPLEMENTDOC/README.md`를 함께 갱신한다.

## IMPLEMENTDOC 핵심 링크
- 구조/명명 규칙: `IMPLEMENTDOC/README.md`
- 마스터 인덱스: `IMPLEMENTDOC/overview/master.md`
- 서버 운영 가이드: `IMPLEMENTDOC/guides/stitch-server-operations-guide.md`
- 클라이언트 개발 가이드: `IMPLEMENTDOC/guides/stitch-orillusion-client-development-guide.md`
- SpacetimeDB RangeError 대응: `IMPLEMENTDOC/guides/spacetimedb-rangeerror-troubleshooting.md`-->

## BitCraftPublicDoc ↔ BitCraftPublic/BitCraftServer 관계 (참고 수준)
- 현재 프로젝트는 **그린필드 설계**이며, BitCraft 관련 자료는 **참고/영감 용도**로만 사용한다.
- `BitCraftPublicDoc/`와 `BitCraftPublic/BitCraftServer/`는 **검증 소스나 진실 소스가 아니다**.
- 설계 판단의 우선순위는 **DESIGN 문서와 본 프로젝트 요구사항**이며, BitCraft와 충돌 시 **항상 본 프로젝트 기준**을 따른다.

## DESIGN 문서
- DESIGN 문서는 **본 프로젝트의 요구사항/결정 사항**을 기반으로 작성한다.
- 외부 참고(예: BitCraft)는 **아이디어 소스**로만 쓰고, 설계 근거로 인용하지 않는다.
- 설계 항목에는 가능한 한 **현재 문서에서 정의한 테이블/리듀서/모듈 이름**을 명시한다.
- 수치/타이머/제약은 **본 프로젝트 파라미터/정책 정의**로부터 도출한다.

## SpacetimeDB 작업 규칙
- SpacetimeDB 관련 작업은 반드시 `.opencode/skills/spacetimedb-korean/SKILL.md` 스킬을 참조한다.

## WSL 브라우저 자동화 규칙
- WSL에서 OAuth/CAPTCHA/2FA/다운로드 제한으로 자동화가 막히면 기본 스킬로 `.agents/skills/wsl-human-cdp-download/SKILL.md`를 사용한다.
- 스크래핑/파일 수집은 가능하면 브라우저 다운로드 관리자 의존 대신 Linux 경로로 직접 저장하는 방식을 우선한다.

## assetdirectory 안내
- 외부 에셋 수집(모델/텍스처/오디오) 상세는 [`assetdirectory/README.md`](assetdirectory/README.md)를 참조.
- `assetdirectory`는 실험/테스트용으로만 보관하며 `web-client` 빌드 경로에는 강제 연결하지 않음.

# AGENTS 가이드

## 빠른 앵커
<!--- [IMPLEMENTDOC 운영 원칙 (서버/클라이언트 공통)](#implementdoc-운영-원칙-서버클라이언트-공통)
- [IMPLEMENTDOC 핵심 링크](#implementdoc-핵심-링크)-->
- [BitCraftPublicDoc ↔ BitCraftPublic/BitCraftServer 관계 (참고 수준)](#bitcraftpublicdoc--bitcraftpublicbitcraftserver-관계-참고-수준)
- [DESIGN 문서](#design-문서)
- [Client Development Environment](#client-development-environment)
- [파일 인코딩/BOM 주의](#파일-인코딩bom-주의)
- [SpacetimeDB 작업 규칙](#spacetimedb-작업-규칙)
- [assetdirectory 안내](#assetdirectory-안내)



## BitCraftPublicDoc ↔ BitCraftPublic/BitCraftServer 관계 (참고 수준)
- 현재 프로젝트는 **그린필드 설계**이며, BitCraft 관련 자료는 **참고/영감 용도**로만 사용한다.
- `BitCraftPublicDoc/`와 `BitCraftPublic/BitCraftServer/`는 **검증 소스나 진실 소스가 아니다**.
- 설계 판단의 우선순위는 **DESIGN 문서와 본 프로젝트 요구사항**이며, BitCraft와 충돌 시 **항상 본 프로젝트 기준**을 따른다.

## DESIGN 문서
- DESIGN 문서는 **본 프로젝트의 요구사항/결정 사항**을 기반으로 작성한다.
- 외부 참고(예: BitCraft)는 **아이디어 소스**로만 쓰고, 설계 근거로 인용하지 않는다.
- 설계 항목에는 가능한 한 **현재 문서에서 정의한 테이블/리듀서/모듈 이름**을 명시한다.
- 수치/타이머/제약은 **본 프로젝트 파라미터/정책 정의**로부터 도출한다.

## Client Development Environment
- Client 개발 환경은 `bun` 기반이며, 클라이언트 코드 작성은 `TypeScript`를 사용한다.

## 환경 해석 규칙
- 환경 컨텍스트에 `shell: powershell`이 주어지면 **Windows 환경으로 인식**한다.
- 환경 컨텍스트에 `shell: cmd`가 주어지면 **Windows 환경으로 인식**한다.
- 환경 컨텍스트에 `shell: bash`가 주어졌더라도 경로가 `C:\...`, `D:\...` 형태이면 Windows 기반 셸(예: Git Bash) 가능성을 먼저 고려한다.
- 환경 컨텍스트에 `shell: bash`가 주어지고 경로가 `/home/...`, `/workspace/...`, `/mnt/...` 형태이면 Linux/WSL 계열로 우선 해석한다.
- `wsl`, `/mnt/c/...`, `/mnt/d/...` 패턴이 보이면 **WSL 환경**으로 인식하고, 경로/권한/브라우저 연동이 일반 Linux와 다를 수 있음을 고려한다.
- 경로가 `D:\...`, `C:\...` 형태이면 Windows 경로 규칙을 따른다.
- 경로가 `/home/...`, `/usr/...`, `/opt/...` 형태이면 POSIX 경로 규칙을 따른다.
- Windows 환경에서는 줄바꿈, BOM, 경로 구분자, PowerShell 명령 문법 차이를 먼저 고려한다.
- POSIX 환경에서는 `/` 경로 구분자, LF 줄바꿈, 셸 quoting 규칙을 우선 고려한다.

## 파일 인코딩/BOM 주의
- Windows에서 생성된 `.md`, `.txt` 파일은 UTF-8 BOM이 포함될 수 있다.
- BOM이 있으면 `apply_patch`의 context matching이 실패할 수 있으므로, 수정 전 `Get-Content -Encoding utf8` 등으로 내용을 확인한다.
- 문맥 매칭 실패가 반복되면 BOM 존재를 우선 의심하고, 필요 시 파일을 UTF-8 without BOM으로 재저장하거나 삭제 후 동일 경로로 재생성한다.
- 프롬프트/기록 문서 수정 시에는 첫 줄 불일치가 BOM 때문일 가능성을 먼저 점검한다.

## SpacetimeDB 작업 규칙
- SpacetimeDB 관련 작업은 반드시 `.opencode/skills/spacetimedb/SKILL.md` 스킬을 참조한다.



## assetdirectory 안내
- 외부 에셋 수집(모델/텍스처/오디오) 상세는 [`assetdirectory/README.md`](assetdirectory/README.md)를 참조.
- `assetdirectory`는 실험/테스트용으로만 보관하며 `web-client` 빌드 경로에는 강제 연결하지 않음.

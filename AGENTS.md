# AGENTS 가이드

## 빠른 앵커
- [BitCraftPublicDoc ↔ BitCraftPublic/BitCraftServer 관계 (참고 수준)](#bitcraftpublicdoc--bitcraftpublicbitcraftserver-관계-참고-수준)
- [DESIGN 문서](#design-문서)
- [Client Development Environment](#client-development-environment)
- [웹 디버깅/테스트 규칙](#웹-디버깅테스트-규칙)
- [SpacetimeDB 작업 규칙](#spacetimedb-작업-규칙)




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
- 웹 개발 서버(`web-client`)는 `bun run dev` 기준으로 항상 실행 중인 상태로 보고 진행한다.
- 개발에 도움이 되는 정보는 웹 HUD에 표시 하지 않고 console로 남겨서 agent 가 agent-browser 의 console 확인 기능으로 확인하게 한다.
- 개발이나 디버깅시 agent-browser eval 적극적으로 사용할수있게 구조를 만드는게 좋음 

## 웹 디버깅/테스트 규칙
- 웹 페이지를 열고 조작해야 하는 디버깅/테스트 작업은 **항상 `agent-browser` 스킬을 사용**한다. Playwright는 사용하지 않는다.
- 다음 작업은 `agent-browser`로 수행한다.
  - 웹 화면 열기/탐색
  - DOM 상호작용(클릭, 입력, 스크롤)
  - 스크린샷/디버그 로그 확인
  - 테스트 시 상태 변화 검증(동작 전/후 비교)
- web-client 기능 개발이 마무리되면 
  - 1. 기본적으로 `agent-browser`로 페이지 로딩 후 스크린샷/브라우저 콘솔 에러를 점검한다. 
  - 2. WASD 이용해서 이동후 스크린샷/브라우저 콘솔 에러를 점검한다. 



## SpacetimeDB(stitch-server) 작업 규칙
- stitch-server/README.md
- SpacetimeDB 관련 작업은 반드시 `.opencode/skills/spacetimedb/SKILL.md` 스킬을 참조한다.

## Stitch MMO RPG SpacetimeDB server module 수정 후에는 
  cd /home/rca32/workspaces/spacetimedb-skill/stitch-server/crates/game_server
  spacetime build
  spacetime publish --server 127.0.0.1:3000 stitch-server

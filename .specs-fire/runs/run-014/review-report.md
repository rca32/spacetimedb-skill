---
run: run-014
generated: 2026-02-08T13:41:00Z
status: clean
---

# Review Report - run-014

## Findings
- Auto-fix: `role_revoke.rs` unused import 제거.
- Auto-fix: helper 테스트에서 잘못된 identity 생성 방식 수정.
- 추가 결함: 없음.

## Residual Risks
- `moderation_apply_action` 액션 타입은 `warn/ban/unban` 3종만 포함되어, 음소거/채팅 제한 등 세분화 제재는 후속 확장 필요.
- 신고 payload는 문자열 저장 방식으로, 구조화 스키마(예: JSON schema) 검증이 아직 없음.

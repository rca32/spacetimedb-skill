# SpacetimeDB 데이터베이스 전부 삭제

현재 계정에 연결된 SpacetimeDB 데이터베이스를 모두 삭제한다.

## 절차

1. **목록 조회**: `spacetime list` 실행하여 연관된 DB identity 목록을 확인한다.
2. **전부 삭제**: 출력된 테이블의 `db_identity` 컬럼에 나온 각 identity(예: `c200...` 형식 64자 hex)에 대해 `spacetime delete -y <identity>` 를 실행한다.
   - 한 번에 처리하려면: `spacetime list` 출력에서 identity들만 추출한 뒤, 루프로 `spacetime delete -y "$id"` 를 돌린다.
3. **확인(선택)**: `spacetime list` 를 다시 실행해 "No databases found" 로 비어 있음을 확인한다.

## 참고

- `-y`: 비대화형 실행(확인 프롬프트에 yes 응답).
- 로컬 서버 대상이면 필요 시 `-s 127.0.0.1:3000` 등으로 서버를 지정할 수 있다.

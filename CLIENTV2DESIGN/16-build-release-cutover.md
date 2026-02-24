# 16 Build Release Cutover

작성일: 2026-02-24
범위: clientv2 빅뱅 배포, 컷오버, 롤백 운영 계획

## 목표
- 단일 컷오버로 clientv2를 배포하고 실패 시 신속히 복구한다.
- 자동 검증 증거를 컷오버 승인 전제조건으로 강제한다.

## 범위
- 포함: 환경 구성, 배포 순서, 롤백 트리거, 운영 체크리스트.
- 제외: clientv1 병행 운영.

## 인터페이스
- 배포 입력:
  - build artifact hash
  - contract revision
  - asset manifest revision
- 배포 출력:
  - deployment record
  - post-deploy health report

## 데이터/이벤트
- 환경:
  - `dev`, `stage`, `prod`
- 컷오버 순서:
  1. stage 최종 검증(`15` pass)
  2. prod 서버(v2 contract) 배포
  3. clientv2 정적 자산 배포
  4. 접속 라우팅 전환
  5. 실시간 모니터링 60분
- 롤백 트리거:
  - 로그인 성공률 `< 95%`(5분 이동평균)
  - client crash rate `> 2%`
  - frame p95 `> 33ms`가 10분 지속
  - assertion fail 이벤트 발생

## 실패 모드
- 서버/클라이언트 contract revision 불일치.
- asset manifest mismatch.
- 컷오버 직후 대규모 접속 실패.

## 검증
- 배포 전 필수:
  - Gate-0 Go 기록 최신화.
  - Lane B pass 결과.
  - 성능 게이트 pass.
- 배포 후 필수:
  - 헬스체크 5분 간격 12회.
  - 주요 시나리오 S01/S03/S04 스모크.

## 운영
- 컷오버 윈도우는 90분 확보.
- 롤백 절차는 자동 스크립트+수동 승인 2단계.
- 컷오버 중 신규 기능 배포 금지.

## 수용 기준
- 컷오버 60분 내 Critical 장애 0건.
- 롤백 트리거 미충족 상태 유지.
- 승인 기록에 자동 증거 링크가 포함된다.

## Cross-Refs
- `13-asset-pipeline-kenney.md`
- `15-test-plan-and-acceptance.md`
- `17-risk-register-and-open-issues.md`

# 17 Risk Register And Open Issues

작성일: 2026-02-24
범위: clientv2 리스크 관리와 미결정 이슈 운영

## 목표
- 빅뱅 개발/배포 리스크를 정량적으로 관리한다.
- 미결정 이슈를 기본값과 함께 통제해 구현 지연을 방지한다.

## 범위
- 포함: 리스크 템플릿, 우선순위, 대응 SLA, 이슈 관리 규칙.
- 제외: 일반 회의 메모.

## 인터페이스
- 리스크 항목 필드:
  - `risk_id`, `title`, `type`, `probability`, `impact`, `owner`, `mitigation`, `status`, `target_date`.
- 이슈 항목 필드:
  - `issue_id`, `decision_needed`, `default_assumption`, `deadline`, `owner`, `status`.

## 데이터/이벤트
- 초기 리스크:
  - `R-001` Gate-0 체인 불안정으로 개발 지연
  - `R-002` 서버 v2 계약 변경 폭 과대
  - `R-003` 실GPU Lane B 환경 의존성
  - `R-004` 에셋 복사 파이프라인 용량 증가
  - `R-005` 대량 UI/FX 동시 부하로 성능 회귀
- 초기 오픈 이슈 + 기본값:
  - `I-001` audio_event_v2 권위 수준 -> 기본값: 서버 emit + 클라 local mix
  - `I-002` quest UI 갱신 주기 -> 기본값: `200ms`
  - `I-003` ultra profile 지원 범위 -> 기본값: 실GPU Lane B pass 장치만

## 실패 모드
- 리스크 등록만 하고 대응 실행이 없음.
- 오픈 이슈 결정 지연으로 문서-코드 괴리.
- 소유자 미지정으로 처리 누락.

## 검증
- 주 2회 리스크 리뷰.
- High 리스크는 대응 작업 없으면 No-Go.
- 만료된 open issue는 자동 escalatation.

## 운영
- 리스크 상태:
  - `open`, `mitigating`, `blocked`, `closed`.
- 대응 SLA:
  - High: 48시간 내 완화 계획 제출.
  - Medium: 5영업일 내 처리.
- 릴리스 전에는 High `0`건 필수.

## 수용 기준
- 모든 High 리스크에 오너/기한/완화계획이 존재.
- open issue마다 기본값이 명시되어 구현 차단이 발생하지 않는다.
- 리스크 업데이트 이력이 릴리스 판단에 직접 사용된다.

## Cross-Refs
- `01-scope-and-definition-of-done.md`
- `16-build-release-cutover.md`
- `19-agent-first-development-principles.md`

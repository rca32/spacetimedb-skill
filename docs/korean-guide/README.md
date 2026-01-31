# SpacetimeDB 한국어 개발 가이드

Cozy MMO 게임 개발을 통해 SpacetimeDB를 학습하는 한국어 종합 가이드입니다.

## 📚 가이드 목록

| 챕터 | 내용 | 파일 크기 |
|------|------|-----------|
| **01** | [소개 및 프로젝트 개요](./01-introduction.md) | 6.6KB |
| **02** | [개발 환경 설정](./02-setup.md) | 6.7KB |
| **03** | [핵심 개념: Table과 Reducer](./03-concepts.md) | 13KB |
| **04** | [인증 및 플레이어 이동 시스템](./04-auth-movement.md) | 18KB |
| **05** | [인벤토리 및 제작 시스템](./05-inventory-crafting.md) | 25KB |
| **06** | [NPC, AI, 웹 클라이언트 및 배포](./06-npc-client.md) | 37KB |

**총 용량**: 약 107KB | **총 페이지**: 6개

## 🎯 대상 독자

- SpacetimeDB 입문자
- 실시간 멀티플레이어 게임 개발자
- Rust + TypeScript 기반 풀스택 개발 학습자

## 🚀 시작하기

1. [01-introduction.md](./01-introduction.md)에서 프로젝트 개요 확인
2. [02-setup.md](./02-setup.md)에서 개발 환경 구축
3. 순서대로 각 챕터 학습 (03 → 04 → 05 → 06)

## 📖 학습 경로

```
01. 소개 → 02. 환경설정 → 03. 핵심개념 → 04. 인증/이동 → 05. 인벤토리/제작 → 06. NPC/클라이언트
```

## 🎮 만들게 될 것

- ✅ 실시간 멀티플레이어 게임 서버
- ✅ 헥스 그리드 기반 이동 시스템
- ✅ 인벤토리 및 아이템 제작
- ✅ AI NPC 대화 시스템
- ✅ React 웹 클라이언트

## 📝 주요 내용

### 서버 (Rust + SpacetimeDB)
- Table/Reducer 설계 패턴
- Identity 기반 인증 시스템
- 헥스 그리드 좌표계 및 이동 검증
- 인벤토리 컨테이너/슬롯 아키텍처
- 레시피 기반 제작 시스템
- NPC 메모리 및 대화 시스템

### 클라이언트 (React + TypeScript)
- SpacetimeDB SDK 연결 및 구독
- 실시간 데이터 동기화
- 헥스 그리드 시각화
- 인벤토리 UI
- NPC 대화 패널

## 🔗 참고 자료

- [SpacetimeDB 공식 문서](https://spacetimedb.com/docs)
- [SpacetimeDB GitHub](https://github.com/clockworklabs/SpacetimeDB)
- [Rust Programming Language](https://www.rust-lang.org/)
- [React 공식 문서](https://react.dev/)

## 📄 라이선스

이 가이드는 교육 목적으로 작성되었습니다.

---

*이 가이드는 SpacetimeDB 0.1.8을 기준으로 작성되었습니다.*
*마지막 업데이트: 2026년 1월*

# SpacetimeDB 한국어 개발 가이드 - 02. 개발 환경 설정

이 문서에서는 SpacetimeDB 개발에 필요한 모든 도구를 설치하고 프로젝트를 초기화하는 방법을 설명합니다.

## 📋 목차

1. [Rust 설치](#1-rust-설치)
2. [Node.js 설치](#2-nodejs-설치)
3. [SpacetimeDB CLI 설치](#3-spacetime-db-cli-설치)
4. [프로젝트 초기화](#4-프로젝트-초기화)
5. [개발 서버 실행](#5-개발-서버-실행)
6. [문제 해결](#6-문제-해결)

---

## 1. Rust 설치

SpacetimeDB 서버는 Rust 언어로 작성됩니다. Rust를 설치하는 가장 쉬운 방법은 `rustup`을 사용하는 것입니다.

### 1.1 rustup 설치

**Windows:**
```powershell
# PowerShell에서 실행
irm https://win.rustup.rs | iex
```

**macOS / Linux:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

설치가 완료되면 터미널을 재시작하거나 다음 명령을 실행하세요:
```bash
source $HOME/.cargo/env
```

### 1.2 설치 확인

```bash
# Rust 버전 확인
rustc --version
# 출력 예시: rustc 1.75.0 (82e1608df 2023-12-21)

# Cargo 버전 확인
cargo --version
# 출력 예시: cargo 1.75.0
```

### 1.3 WebAssembly 타겟 추가

SpacetimeDB 모듈은 WebAssembly로 컴파일됩니다:

```bash
rustup target add wasm32-unknown-unknown
```

---

## 2. Node.js 설치

클라이언트는 React + TypeScript로 개발되며 Node.js가 필요합니다.

### 2.1 공식 설치 (권장)

**Windows:**
- [nodejs.org](https://nodejs.org/)에서 LTS 버전 다운로드
- 설치 프로그램 실행

**macOS:**
```bash
# Homebrew 사용
brew install node

# 또는 공식 패키지 다운로드
```

**Linux:**
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 또는 fnm/nvm 사용 권장
```

### 2.2 설치 확인

```bash
node --version
# 출력 예시: v20.10.0

npm --version
# 출력 예시: 10.2.3
```

---

## 3. SpacetimeDB CLI 설치

SpacetimeDB 명령줄 도구(CLI)를 설치합니다.

### 3.1 설치 방법

**모든 OS:**
```bash
curl -sSf https://install.spacetimedb.com | sh
```

설치 스크립트가 자동으로 PATH에 추가합니다. 터미널을 재시작하세요.

### 3.2 수동 PATH 설정 (필요한 경우)

**Windows:**
- 시스템 환경 변수 편집
- Path에 `%USERPROFILE%\.spacetime\bin` 추가

**macOS / Linux:**
```bash
echo 'export PATH="$HOME/.spacetime/bin:$PATH"' >> ~/.bashrc
# 또는 ~/.zshrc (zsh 사용 시)
source ~/.bashrc
```

### 3.3 설치 확인

```bash
spacetime --version
# 출력 예시: spacetime 0.8.0
```

---

## 4. 프로젝트 초기화

### 4.1 폴더 구조 생성

```bash
# 프로젝트 폴더 생성
mkdir CozyMMO
cd CozyMMO

# 하위 폴더 생성
mkdir -p server/src/tables
mkdir -p client/src
```

### 4.2 서버 프로젝트 초기화

```bash
cd server

# Cargo.toml 생성
cat > Cargo.toml << 'EOF'
[package]
name = "cozy-mmo-server"
version = "0.1.0"
edition = "2021"

[dependencies]
spacetimedb = "0.8"

[lib]
crate-type = ["cdylib"]
EOF

# src 디렉토리 구조 생성
mkdir -p src/tables
```

### 4.3 클라이언트 프로젝트 초기화

```bash
cd ../client

# Vite + React + TypeScript 프로젝트 생성
npm create vite@latest . -- --template react-ts

# SpacetimeDB 클라이언트 SDK 설치
npm install @clockworklabs/spacetimedb-sdk
```

**vite.config.ts 설정:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
})
```

### 4.4 최종 폴더 구조

```
CozyMMO/
├── server/
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs
│       └── tables/
│           ├── mod.rs
│           ├── account.rs
│           └── ...
│
└── client/
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        └── App.css
```

---

## 5. 개발 서버 실행

### 5.1 SpacetimeDB 서버 시작

```bash
# 터미널 1: SpacetimeDB 서버 시작
spacetime start
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열면 SpacetimeDB 대시보드를 확인할 수 있습니다.

### 5.2 서버 모듈 빌드 및 배포

```bash
cd server

# 빌드
cargo build --target wasm32-unknown-unknown --release

# 배포
spacetime publish cozy-mmo-server
```

### 5.3 클라이언트 개발 서버 실행

```bash
cd client
npm install
npm run dev
```

클라이언트는 [http://localhost:3001](http://localhost:3001)에서 실행됩니다.

---

## 6. 문제 해결

### ❌ rustup 설치 후 `cargo` 명령을 찾을 수 없음

**원인:** PATH에 Cargo가 추가되지 않음

**해결:**
```bash
# 현재 세션에만 적용
source $HOME/.cargo/env

# 또는 터미널 재시작
```

### ❌ `spacetime` 명령을 찾을 수 없음

**원인:** SpacetimeDB CLI가 PATH에 없음

**해결:**
```bash
# 수동으로 PATH 추가 (macOS/Linux)
export PATH="$HOME/.spacetime/bin:$PATH"

# 영구 적용
echo 'export PATH="$HOME/.spacetime/bin:$PATH"' >> ~/.bashrc
```

### ❌ Windows에서 PowerShell 실행 정책 오류

**원인:** PowerShell 스크립트 실행이 차단됨

**해결:**
```powershell
# 관리자 권한 PowerShell에서 실행
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### ❌ WebAssembly 컴파일 오류

**원인:** wasm32 타겟이 설치되지 않음

**해결:**
```bash
rustup target add wasm32-unknown-unknown
```

### ❌ SpacetimeDB 서버 시작 실패

**원인:** 포트 3000이 이미 사용 중

**해결:**
```bash
# 다른 포트 사용
spacetime start --listen 127.0.0.1:3001
```

### ❌ npm install 실패

**원인:** 권한 문제 또는 네트워크 문제

**해결:**
```bash
# 캐시 클리어 후 재시도
npm cache clean --force
npm install

# 또는 관리자 권한 (Windows)
# sudo 권한 권장하지 않음 - npm 권한 설정 권장
```

---

## ✅ 설치 확인 체크리스트

설치가 완료되면 다음 명령들이 모두 작동해야 합니다:

```bash
# Rust
rustc --version  # ✅ rustc 1.75.0

# Node.js
node --version   # ✅ v20.x.x
npm --version    # ✅ 10.x.x

# SpacetimeDB
spacetime --version  # ✅ spacetime 0.8.x

# WebAssembly 타겟
rustup target list --installed | grep wasm32  # ✅ wasm32-unknown-unknown
```

---

## 🎉 다음 단계

모든 설치가 완료되면 **[03. 핵심 개념 - Table과 Reducer](./03-concepts.md)**으로 이동하여 SpacetimeDB의 기본 개념을 학습하세요!

---

*문제가 지속되면 [SpacetimeDB Discord](https://discord.gg/clockwork-labs)에서 도움을 요청하세요.*

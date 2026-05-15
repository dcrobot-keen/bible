# My Digital Garden

Quartz 4와 Obsidian을 활용한 개인 블로그/디지털 가든입니다.

## 기술 스택

- **[Quartz 4](https://quartz.jzhao.xyz/)** - 정적 사이트 생성기
- **[Obsidian](https://obsidian.md/)** - 마크다운 노트 작성
- **GitHub Pages** - 무료 호스팅

## 프로젝트 구조

```
bible/
├── content/          # Obsidian vault (마크다운 파일)
├── quartz/           # Quartz 소스 코드
├── public/           # 빌드된 정적 파일 (배포용)
├── quartz.config.ts  # Quartz 설정
└── quartz.layout.ts  # 레이아웃 설정
```

## 시작하기

### 1. Obsidian Vault 연결

1. Obsidian 열기
2. "Open folder as vault" 선택
3. 이 프로젝트의 `content` 폴더 선택

### 2. 로컬에서 미리보기

```bash
npx quartz build --serve
```

브라우저에서 http://localhost:8080 으로 접속

### 3. 글 작성하기

- Obsidian에서 `content` 폴더에 마크다운 파일 생성
- Wikilinks(`[[링크]]`) 사용 가능
- Frontmatter로 메타데이터 추가 가능:

```markdown
---
title: 제목
tags:
  - 태그1
  - 태그2
---

# 내용...
```

### 4. GitHub Pages 배포

#### 첫 배포 설정

1. GitHub에 저장소 생성
2. 저장소 연결 및 푸시:

```bash
git remote add origin https://github.com/your-username/your-repo.git
git branch -M main
git push -u origin main
```

3. GitHub 저장소 Settings → Pages → Source를 "GitHub Actions"로 설정

4. `.github/workflows/deploy.yml` 파일이 자동으로 배포 처리

#### 이후 배포

```bash
git add .
git commit -m "새 글 추가"
git push
```

GitHub Actions가 자동으로 빌드 및 배포합니다.

## 주요 기능

- ✅ Wikilinks 지원
- ✅ 양방향 링크 (Backlinks)
- ✅ 그래프 뷰
- ✅ 전문 검색
- ✅ 다크 모드
- ✅ 태그 시스템
- ✅ 반응형 디자인
- ✅ LaTeX 수식 지원
- ✅ Mermaid 다이어그램

## 설정 파일

### quartz.config.ts

사이트 메타데이터, 플러그인 등을 설정합니다.

### quartz.layout.ts

페이지 레이아웃과 컴포넌트 배치를 설정합니다.

## 커스터마이징

- **테마**: `quartz/styles/custom.scss` 수정
- **레이아웃**: `quartz.layout.ts` 수정
- **기능**: `quartz.config.ts`에서 플러그인 추가/제거

## 도움말

- [Quartz 공식 문서](https://quartz.jzhao.xyz/)
- [Obsidian 문서](https://help.obsidian.md/)
- [Quartz Discord](https://discord.gg/cRFFHYye7t)

## 라이선스

이 프로젝트는 Quartz v4를 기반으로 합니다.
Quartz는 MIT 라이선스로 제공됩니다.

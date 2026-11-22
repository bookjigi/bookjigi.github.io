# 하동책방 홈페이지 작업 안내

공개 주소: https://bookjigi.kr (일본어: https://bookjigi.kr/ja/)

저장소: https://github.com/bookjigi/bookjigi.github.io · GitHub Pages가 `docs` 폴더를 보여 줍니다.

## 1 · 폴더 구성

| 폴더·파일 | 하는 일 | 언제 고치나 |
|---|---|---|
| `src/pages/` | 메뉴별 본문 페이지 9개 | 글이나 사진을 바꿀 때 |
| `src/partials/header.html` | 맨 위 띠, 로고, 메뉴 | 메뉴 이름·순서를 바꿀 때 |
| `src/partials/subnav-bookshop.html` | 하동책방 묶음의 탭 | 하동책방 메뉴를 바꿀 때 |
| `src/partials/subnav-keeper.html` | 책방지기 묶음의 탭 | 책방지기 메뉴를 바꿀 때 |
| `src/partials/footer.html` | 맨 아래 주소·전화, 휴대폰 하단 버튼 | 연락처가 바뀔 때 |
| `src/partials/head.html` | 제목·설명·공유 이미지 같은 보이지 않는 정보 | 검색 공개할 때 |
| `src/static/assets/css/style.css` | 색·글꼴·배치 | 디자인을 바꿀 때 |
| `src/static/assets/js/site.js` | 큰 글씨, 메뉴 열기, 나타나는 효과 | 거의 안 고침 |
| `src/static/img/` | 사진 (webp), 로고 (png) | 사진을 더하거나 바꿀 때 |
| `build.ps1` | src를 합쳐 `docs/`에 완성본을 만듦 | 고치지 않음 |
| `docs/` | 완성된 홈페이지. GitHub Pages가 이 폴더를 보여 줌 | 직접 고치지 않음 (매번 새로 만들어짐) |
| `src/partials/header-ja.html`, `footer-ja.html` | 일본어 페이지의 머리·바닥 | 일본어 메뉴를 바꿀 때 |
| `src/static/CNAME` | 연결된 도메인 이름(bookjigi.kr) | 도메인을 바꿀 때만 |

## 2 · 페이지와 주소

| 묶음 | 메뉴 | 주소 | 파일 |
|---|---|---|---|
| 홈 | 첫 화면 | `/` | `src/pages/index.html` |
| 하동책방 | 책방 이야기 | `/bookshop/` | `src/pages/bookshop.html` |
| 하동책방 | 서가 | `/shelf/` | `src/pages/shelf.html` |
| 하동책방 | 둘러보기 | `/gallery/` | `src/pages/gallery.html` |
| 하동책방 | 오시는 길 | `/visit/` | `src/pages/visit.html` |
| 책방지기 | 소개 | `/about/` | `src/pages/about.html` |
| 책방지기 | 하는 일 | `/work/` | `src/pages/work.html` |
| 책방지기 | 걸어온 길 | `/path/` | `src/pages/path.html` |
| 책방지기 | 활동 | `/activity/` | `src/pages/activity.html` |
| 日本語 | ホーム | `/ja/` | `src/pages/ja-index.html` |
| 日本語 | 『土地』と河東 | `/ja/toji/` | `src/pages/ja-toji.html` |
| 日本語 | 資料室 | `/ja/library/` | `src/pages/ja-library.html` |
| 日本語 | 本屋守 | `/ja/about/` | `src/pages/ja-about.html` |
| 日本語 | アクセス | `/ja/visit/` | `src/pages/ja-visit.html` |

각 페이지 파일 맨 위의 `<!-- -->` 안에는 페이지 정보가 있습니다.

```
title: 서가 | 하동책방          ← 브라우저 탭 제목
description: ...               ← 검색·카톡 공유에 나오는 설명
path: shelf                    ← 주소 (/shelf/)
nav: shelf                     ← 메뉴에서 색이 칠해질 항목
group: bookshop                ← bookshop(하동책방) 또는 keeper(책방지기)
lang: ja                       ← 일본어 페이지만 (한국어는 생략)
```

## 3 · 고치는 순서

1. `src/` 안의 파일을 고칩니다.
2. `build.ps1`을 마우스 오른쪽 버튼 → "PowerShell에서 실행"을 누릅니다. "완료: 페이지 14 개를 docs 폴더에 만들었습니다"가 나오면 됩니다.
3. GitHub 저장소에 올립니다(GitHub Desktop의 Commit → Push, 또는 웹에서 파일 올리기). 1~2분 뒤 bookjigi.kr에 반영됩니다.

간단한 글자 수정은 GitHub 웹 화면에서 `docs` 안의 파일과 `src` 안의 같은 파일을 둘 다 고쳐도 됩니다.

## 4 · 자주 하는 일

- **사진 바꾸기**: 새 사진을 `src/static/img/`에 넣고, 페이지 파일에서 `/img/옛이름.webp`를 새 이름으로 바꿉니다.
- **새 페이지 더하기**: `src/pages/`에 파일을 하나 복사해 이름과 맨 위 정보(path, nav)를 바꾸고, `header.html`과 해당 `subnav-*.html`에 링크를 한 줄씩 더합니다.
- **검색 공개 상태**: 2026-11-22부터 네이버·구글 검색에 공개했습니다. `src/static/robots.txt`(모두 허용)와 `src/static/sitemap.xml`(페이지 목록)이 있습니다. 페이지를 새로 만들면 sitemap.xml에도 주소를 한 줄 더하세요.
- **자료 PDF**: `src/static/files/ja/`에 넣고 `src/pages/ja-library.html`에 링크를 답니다.
- **공유 썸네일**: `src/static/og-bookjigi-20261122.jpg` (1200x630). 바꿀 때는 새 파일 이름으로 넣고 `src/partials/head.html`의 og:image 경로도 바꾸세요(카톡 캐시 때문).
- **도메인 바꾸기**: `build.ps1` 맨 위 `$Site` 주소를 바꿉니다.

## 5 · 디자인 약속

- 색: 하동책방은 청록(#2F6F6A), 책방지기는 황토(#C98B3B), 바탕은 한지색(#FAF7F2)
- 글꼴: 지마켓 산스 (Light 300 / Medium 500 / Bold 700)
- 어르신 배려: 본문 18px 이상, 버튼 높이 48px 이상, "큰 글씨로 보기" 버튼 유지

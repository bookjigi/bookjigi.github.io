# 하동책방 홈페이지 만들기 스크립트
# 사용법: 이 파일을 마우스 오른쪽 버튼 > "PowerShell에서 실행"
#        (또는 PowerShell에서  .\build.ps1)
# 하는 일: src 폴더의 조각(partials)과 페이지(pages)를 합쳐 docs 폴더에 완성된 홈페이지를 만듭니다.
#         GitHub에 올리면(Commit) GitHub Pages가 docs 폴더를 bookjigi.kr로 보여 줍니다.

$ErrorActionPreference = 'Stop'
$Site  = 'https://bookjigi.kr'   # 도메인을 바꾸면 여기만 고치세요
$Root  = Split-Path -Parent $MyInvocation.MyCommand.Path
$Src   = Join-Path $Root 'src'
$Out   = Join-Path $Root 'docs'
$Utf8  = New-Object System.Text.UTF8Encoding($false)
# 스타일·스크립트 캐시 갱신용 번호 (빌드할 때마다 바뀜: 휴대폰이 예전 디자인을 기억하지 않게)
$Ver   = Get-Date -Format 'yyyyMMddHHmm'

function Read-Text($p)  { [System.IO.File]::ReadAllText($p, $Utf8) }
function Write-Text($p, $t) {
  $d = Split-Path -Parent $p
  if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
  [System.IO.File]::WriteAllText($p, $t, $Utf8)
}

# 1) docs 폴더 비우기
if (Test-Path $Out) {
  # 예전에 만든 파일 지우기 (폴더는 남겨 두고 파일만 비움)
  Get-ChildItem $Out -Recurse -File | Remove-Item -Force
} else {
  New-Item -ItemType Directory -Path $Out | Out-Null
}

# 2) 사진·글꼴·스타일 같은 고정 파일 복사 (src/static -> public)
Copy-Item -Path (Join-Path $Src 'static\*') -Destination $Out -Recurse -Force

# 3) 공통 조각 읽기
$head    = Read-Text (Join-Path $Src 'partials\head.html')
# 언어별 머리·바닥 (한국어: header.html / 일본어: header-ja.html)
$headers = @{ 'ko' = Read-Text (Join-Path $Src 'partials\header.html');    'ja' = Read-Text (Join-Path $Src 'partials\header-ja.html') }
$footers = @{ 'ko' = Read-Text (Join-Path $Src 'partials\footer.html');    'ja' = Read-Text (Join-Path $Src 'partials\footer-ja.html') }
# 언어별로 더 넣을 글꼴 (일본어는 Zen Maru Gothic)
$extras  = @{
  'ko' = ''
  'ja' = "<link rel=""preconnect"" href=""https://fonts.googleapis.com"">`n<link rel=""stylesheet"" href=""https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700&display=swap"">`n"
}
$subnavs = @{
  'bookshop' = Read-Text (Join-Path $Src 'partials\subnav-bookshop.html')
  'keeper'   = Read-Text (Join-Path $Src 'partials\subnav-keeper.html')
}

# 4) 페이지마다 합치기
$count = 0
Get-ChildItem (Join-Path $Src 'pages') -Filter *.html | ForEach-Object {
  $raw = Read-Text $_.FullName

  # 맨 위 <!-- ... --> 안의 정보(title, description, path, nav, group) 읽기
  $meta = @{}
  $m = [regex]::Match($raw, '^\s*<!--([\s\S]*?)-->')
  if ($m.Success) {
    foreach ($line in ($m.Groups[1].Value -split "`n")) {
      $kv = [regex]::Match($line, '^\s*(\w+)\s*:\s*(.*?)\s*$')
      if ($kv.Success) { $meta[$kv.Groups[1].Value] = $kv.Groups[2].Value }
    }
    $body = $raw.Substring($m.Length)
  } else { $body = $raw }

  $lang = if ($meta['lang']) { $meta['lang'] } else { 'ko' }
  $header = $headers[$lang]
  $footer = $footers[$lang]
  $path = $meta['path']
  $url  = if ([string]::IsNullOrEmpty($path)) { "$Site/" } else { "$Site/$path/" }
  $nav  = $meta['nav']

  $h = $head.Replace('{{LANG}}', $lang).Replace('{{EXTRA_HEAD}}', $extras[$lang]).Replace('{{TITLE}}', $meta['title']).Replace('{{DESCRIPTION}}', $meta['description']).Replace('{{URL}}', $url).Replace('{{SITE}}', $Site)
  if ($meta['ogimage']) { $h = $h.Replace("$Site/og-bookjigi-20261122.jpg", "$Site" + $meta['ogimage']) }
  $hd = $header.Replace("data-nav=""$nav""", "data-nav=""$nav"" aria-current=""page""")

  $sub = ''
  if ($meta['group'] -and $subnavs.ContainsKey($meta['group'])) {
    $sub = $subnavs[$meta['group']].Replace("data-nav=""$nav""", "data-nav=""$nav"" aria-current=""page""")
  }
  $body = $body.Replace('{{SUBNAV}}', $sub)

  $html = $h + $hd + "`n<main id=""top"">`n" + $body.Trim() + "`n</main>`n" + $footer

  $html = [regex]::Replace($html, '(/assets/(?:css|js)/[\w-]+\.(?:css|js))"', ('$1?v=' + $Ver + '"'))

  $target = if ([string]::IsNullOrEmpty($path)) { Join-Path $Out 'index.html' } else { Join-Path $Out "$path\index.html" }
  Write-Text $target $html
  $count++
  Write-Host ("  만듦: /" + $path)
}

Write-Host ""
Write-Host "완료: 페이지 $count 개를 docs 폴더에 만들었습니다."

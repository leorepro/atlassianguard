# Atlassian Guard 選版指南

Atlassian Guard **Standard 與 Premium** 的功能對照、場景對照、定價級距與導入 FAQ，
以單頁靜態網頁形式呈現。

🔗 **線上瀏覽：** https://atlassianguard.com/

## 專案結構

```
.
├── index.html                    # 網站本體：標記與文案
├── robots.txt                    # 全站開放索引，並指向 sitemap
├── sitemap.xml                   # 單一 URL，含 lastmod
├── favicon.ico                   # 多尺寸 16/32/48
├── assets/
│   ├── style.css                 # 全站樣式：設計 token 與版面
│   ├── app.js                    # 全站行為：影片延後載入、分組展開、捲動指示、章節錨點
│   ├── og-cover.png              # 社群分享卡片 1200×630（由 tools/og.html 產生）
│   ├── favicon-32.png
│   ├── favicon-192.png           # Android
│   ├── apple-touch-icon.png      # iOS 180×180
│   └── video/                    # 壓縮後的示意影片與 poster 圖
├── tools/
│   ├── og.html                   # 產生 og-cover.png 的版型
│   └── stamp-assets.py           # 部署前把 ?v= 改寫為資源內容雜湊
├── CNAME                         # 自訂網域 atlassianguard.com
├── .nojekyll                     # 告知 GitHub Pages 略過 Jekyll 處理
├── .gitignore
└── .github/
    └── workflows/
        └── deploy.yml            # push 到 main 即自動部署到 GitHub Pages
```

外部相依只有 Google Fonts（Plus Jakarta Sans / Noto Sans TC / IBM Plex Mono），
無建置步驟、無 npm 相依、無前端框架——`style.css` 與 `app.js` 均為原生撰寫，直接由
`index.html` 以相對路徑引用。

icon 的 `<link>` 一律用**相對路徑**，所以不論站台掛在自訂網域根目錄或
`leorepro.github.io/atlassianguard/` 子路徑都能正確載入。

## 本機預覽

直接用瀏覽器開啟 `index.html` 即可，或起一個本機伺服器：

```bash
python3 -m http.server 8000
# 開啟 http://localhost:8000
```

## 部署

採用 **GitHub Actions 自動部署**。任何推到 `main` 的 commit 都會觸發
`.github/workflows/deploy.yml`，把 repo 根目錄整包發布到 GitHub Pages。

### 自訂網域

`CNAME` 檔指定 `atlassianguard.com`，DNS 需維持以下設定：

| 類型 | 名稱 | 值 |
| --- | --- | --- |
| A | `@` | `185.199.108.153` / `.109.153` / `.110.153` / `.111.153` |
| CNAME | `www` | `leorepro.github.io` |

更換網域時要一併改 `CNAME`、`index.html` 的 `canonical` 與 `og:url`，以及本檔開頭的連結。

### 首次啟用（只需做一次）

1. 進入 repo 的 **Settings → Pages**
2. 將 **Source** 設為 **GitHub Actions**（不是 “Deploy from a branch”）
3. 推一個 commit 到 `main`，或在 **Actions** 分頁手動執行 *Deploy to GitHub Pages*

之後日常流程就只有：

```bash
git add -A
git commit -m "更新內容"
git push
```

約 1 分鐘後線上頁面即更新。部署狀態可在 **Actions** 分頁查看。

## 更新內容

- `index.html`：文案、表格與各 `<section>`（Hero、功能對照表、場景對照、定價、FAQ）
- `assets/style.css`：設計 token（顏色、字級、圓角、陰影）與所有版面樣式
- `assets/app.js`：五段互不相依的 IIFE——首屏影片延後載入、能力卡錄影展開、
  場景分組展開、捲動相關的三件事（區塊標示／進度條／回到頂端，共用同一個 rAF
  節流的監聽器），以及章節錨點。各自在目標元素不存在時直接跳出，因此未啟用
  指令碼或元素被移除時，頁面功能均不受影響

樣式沿用既有的 token 與語彙，新增顏色或字級前請先確認 `:root` 內是否已有對應的變數。

## SEO

`<head>` 內含 canonical、Open Graph／Twitter Card，以及一段 JSON-LD
（`Organization` / `WebSite` / `TechArticle` / `FAQPage`）。

**改 FAQ 時要同步更新 JSON-LD。** 結構化資料的問答必須與頁面上看得到的內容一字不差，
否則屬於 Google 定義的 spammy structured markup。FAQ 區塊改動後，重新產生 JSON-LD 的
`FAQPage` 節點（從 `<details>` 的 `<summary>` 與 `<p>` 抽取純文字即可）。

改內容後也請一併更新日期，四處值相同：`article:modified_time`、JSON-LD 的
`dateModified`、`sitemap.xml` 的 `<lastmod>`，以及頁尾 `<time>` 標籤。

`index.html` 內兩個 `?v=` 版本參數**不需要手動維護**：部署流程會在上傳前執行
`tools/stamp-assets.py`，把它們改寫為 `style.css` 與 `app.js` 的內容雜湊，
長效快取因而隨檔案內容自動失效。倉庫內保留的是日期版本，所以本機直接開啟
`index.html` 仍可正常運作；改寫只發生在 CI 的工作目錄，不會回寫進版本控制。

若 `?v=` 被拿掉、或資源檔被搬移，該腳本會讓部署直接失敗，而不是無聲地失去
快取失效機制。要在本機預覽改寫結果可執行（會就地改寫 `index.html`，看完記得還原）：

```bash
python3 tools/stamp-assets.py
```

⚠️ **本機開發時倉庫內的 `?v=` 固定不變，改了 `style.css` 或 `app.js` 後瀏覽器
會續用快取。** 請以強制重新整理（macOS `⌘⇧R`）載入，或在開發者工具的
Network 分頁勾選 Disable cache。這只影響本機；線上因為每次部署都會重新
計算雜湊，不會有這個問題。

## 資料來源

功能與定價資訊整理自 Atlassian 官方網站與支援文件（截至 2026 年 9 月）。
定價與功能可能異動，實際條件以
[Atlassian 官方頁面](https://www.atlassian.com/software/guard/pricing)及正式報價為準。

Atlassian、Jira、Confluence、Atlassian Guard 為 Atlassian Pty Ltd 之商標。

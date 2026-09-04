# Atlassian Guard 選版指南

Atlassian Guard **Standard 與 Premium** 的功能對照、場景對照、定價級距與導入 FAQ，
以單頁靜態網頁形式呈現。

🔗 **線上瀏覽：** https://leorepro.github.io/atlassianguard/

## 專案結構

```
.
├── index.html                    # 網站本體（單一自含檔案：內嵌 CSS、無 JS）
├── .nojekyll                     # 告知 GitHub Pages 略過 Jekyll 處理
├── .gitignore
└── .github/
    └── workflows/
        └── deploy.yml            # push 到 main 即自動部署到 GitHub Pages
```

外部相依只有 Google Fonts（Noto Sans TC / Noto Serif TC / IBM Plex Mono），
其餘樣式全部內嵌，無建置步驟、無 npm 相依。

## 本機預覽

直接用瀏覽器開啟 `index.html` 即可，或起一個本機伺服器：

```bash
python3 -m http.server 8000
# 開啟 http://localhost:8000
```

## 部署

採用 **GitHub Actions 自動部署**。任何推到 `main` 的 commit 都會觸發
`.github/workflows/deploy.yml`，把 repo 根目錄整包發布到 GitHub Pages。

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

所有文案、表格與樣式都在 `index.html` 內：

- `<style>` 區塊：設計 token（顏色、字體）與版面樣式
- `<body>` 內各 `<section>`：Hero、功能對照表、場景對照、定價、FAQ

## 資料來源

功能與定價資訊整理自 Atlassian 官方網站與支援文件（截至 2026 年 9 月）。
定價與功能可能異動，實際條件以
[Atlassian 官方頁面](https://www.atlassian.com/software/guard/pricing)及正式報價為準。

Atlassian、Jira、Confluence、Atlassian Guard 為 Atlassian Pty Ltd 之商標。

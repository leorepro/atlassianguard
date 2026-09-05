# tools/

`og.html` 是社群分享卡片 `assets/og-cover.png` 的來源，1200×630，
用 headless Chrome 截圖產生（不隨網站部署，僅供重製用）：

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=1 --window-size=1200,630 \
  --virtual-time-budget=6000 \
  --screenshot=assets/og-cover.png \
  "file://$PWD/tools/og.html"
```

改動後記得確認 `index.html` 的 `og:image` 與 `twitter:image` 仍指向同一路徑。

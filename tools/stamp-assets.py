#!/usr/bin/env python3
"""把 index.html 內的 ?v= 版本參數改寫為各資源的內容雜湊。

CSS 與 JS 外移後，只改樣式並不會變動 index.html 的內容，而 GitHub Pages 對
靜態資源給的是長效快取——回訪者因而可能拿到新的 HTML 配舊的樣式或指令碼。
部署前執行本腳本，版本參數即隨檔案內容自動變動，快取跟著失效。

倉庫內維持日期版本（如 ?v=20260905），本機直接開啟 index.html 仍可運作；
改寫只發生在部署流程的工作目錄，不會回寫進版本控制。

用法：於倉庫根目錄執行 `python3 tools/stamp-assets.py`。
任何一項資源找不到對應的 ?v= 就以非零狀態結束，避免無聲地失去快取失效機制。
"""

import hashlib
import pathlib
import re
import sys

ASSETS = ["assets/style.css", "assets/app.js"]
PAGE = "index.html"


def main() -> int:
    root = pathlib.Path(__file__).resolve().parent.parent
    page = root / PAGE
    html = page.read_text(encoding="utf-8")

    for name in ASSETS:
        target = root / name
        if not target.is_file():
            print(f"::error::找不到資源 {name}", file=sys.stderr)
            return 1

        digest = hashlib.sha256(target.read_bytes()).hexdigest()[:10]
        # 只認 name 後面緊接的 ?v=，值本身不限格式（日期或雜湊皆可覆寫）
        pattern = re.compile(re.escape(name) + r"\?v=[^\"']*")

        html, count = pattern.subn(f"{name}?v={digest}", html)
        if count != 1:
            print(
                f"::error::{PAGE} 內 {name}?v= 應恰好出現一次，實際為 {count} 次",
                file=sys.stderr,
            )
            return 1

        print(f"  {name} → {digest}")

    page.write_text(html, encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())

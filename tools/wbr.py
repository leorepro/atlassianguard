#!/usr/bin/env python3
"""在 index.html 的中文內文插入 <wbr>，讓瀏覽器只在詞的邊界斷行。

中文沒有空格，瀏覽器預設可在任兩個字之間換行，於是「公開連結」會被拆成
「公／開連結」。樣式表對全站設了 word-break:keep-all（中文不再任意斷行），
本腳本再用 BudouX 的繁體中文模型找出詞界、插入 <wbr>，成為唯一的換行點。
<wbr> 不會進入複製的文字，也不影響搜尋引擎索引，比零寬空白安全。

只處理 <body> 內長度達 12 字的文字節點；略過 script、style、svg、code、pre、title、
nav、button，以及 class 含 nb、btn、tag 等短標籤類元素（Chrome 在 nowrap 內仍會於 <wbr> 換行）。既有的 <wbr> 會先移除，因此可重複執行。

BudouX 對繁中偶有把詞切開的情形（如「缺／口」），故只採用兩側片段都至少兩個
字、且不落在英數字串中間的邊界；漏掉的邊界只是少一個換行點，不會產生錯誤的斷行。

倉庫內的 index.html 不含 <wbr>，維持可讀、可用字串比對編輯；改寫只發生在部署
流程的工作目錄。用法：於倉庫根目錄執行 `python3 tools/wbr.py`（需 pip install budoux）。
"""

import pathlib
import re
import sys

import budoux

PAGE = "index.html"
# 這些元素內的文字不動：程式碼、樣式、向量圖、標題列
SKIP_TAGS = {"script", "style", "svg", "code", "pre", "title", "textarea", "noscript", "nav", "button"}
# 短字串（導覽連結、按鈕、標籤、膠囊）不處理：Chrome 在 white-space:nowrap 內仍會於 <wbr> 換行，
# 「防護支柱」會被折成兩行；且短字串本來就放得下，不需要換行點
MIN_LEN = 12
SKIP_CLASS = re.compile(r'class="[^"]*\b(nb|btn|nav-cta|tag|pol-plan|ro-help|cp-ref|kpi-n|eyebrow)\b')
VOID_TAGS = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}

CJK = re.compile(r"[　-〿㐀-䶿一-鿿豈-﫿＀-￯]")
WORDISH = re.compile(r"[A-Za-z0-9&#;%.,'’\-–]")  # 英數字串內部不插入斷點（含實體如 &amp;）
# 不得出現在行首的標點：不在它前面插斷點
NO_BREAK_BEFORE = set("，。、；：！？）」』》〉】〕』’”%")
# 不得出現在行尾的標點：不在它後面插斷點
NO_BREAK_AFTER = set("（「『《〈【〔‘“")


def insert_wbr(text: str, parser) -> str:
    if not CJK.search(text):
        return text
    segs = [s for s in parser.parse(text) if s]
    out = segs[0]
    for prev, seg in zip(segs, segs[1:]):
        a, b = prev[-1], seg[0]
        ok = (
            len(prev.strip()) >= 2 and len(seg.strip()) >= 2
            and not a.isspace() and not b.isspace()           # 空白本身就是換行點
            and not (WORDISH.match(a) and WORDISH.match(b))   # 不切開英數字串
            and b not in NO_BREAK_BEFORE and a not in NO_BREAK_AFTER
        )
        out += ("<wbr>" if ok else "") + seg
    return out


def process(html: str) -> str:
    html = html.replace("<wbr>", "")
    parser = budoux.load_default_traditional_chinese_parser()
    body_at = html.lower().find("<body")
    if body_at < 0:
        raise SystemExit("找不到 <body>")
    head, body = html[:body_at], html[body_at:]

    parts = re.split(r"(<!--.*?-->|<[^>]+>)", body, flags=re.S)
    skip_stack: list[str] = []
    out = []
    for part in parts:
        if part.startswith("<"):
            out.append(part)
            if part.startswith("<!--") or part.startswith("</") is False and part.endswith("/>"):
                continue
            m = re.match(r"</?([A-Za-z][A-Za-z0-9-]*)", part)
            if not m:
                continue
            tag = m.group(1).lower()
            if part.startswith("</"):
                if skip_stack and skip_stack[-1] == tag:
                    skip_stack.pop()
            elif tag in VOID_TAGS:
                pass
            elif tag in SKIP_TAGS or SKIP_CLASS.search(part):
                skip_stack.append(tag)
            continue
        if skip_stack or len(part.strip()) < MIN_LEN:
            out.append(part)
        else:
            out.append(insert_wbr(part, parser))
    return head + "".join(out)


def main() -> int:
    root = pathlib.Path(__file__).resolve().parent.parent
    page = root / PAGE
    html = page.read_text(encoding="utf-8")
    new = process(html)
    n = new.count("<wbr>")
    if n == 0:
        print("::error::沒有插入任何 <wbr>，請檢查 budoux 模型或頁面內容", file=sys.stderr)
        return 1
    page.write_text(new, encoding="utf-8")
    print(f"已插入 {n} 個 <wbr>")
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3

from __future__ import annotations

import argparse
import html
import json
import re
import sys
import time
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen


DEFAULT_BASE_URL = "https://zread.ai"


def extract_paths(toc_html: str) -> list[str]:
    paths = re.findall(r'href="([^"]+)"', toc_html)
    seen = set()
    ordered = []
    for path in paths:
        if not path or path.startswith("#"):
            continue
        if path not in seen:
            seen.add(path)
            ordered.append(path)
    return ordered


def build_toc_html(paths: Iterable[str]) -> str:
    items = "\n".join(f'        <li><a href="{path}">{path}</a></li>' for path in paths)
    return (
        "<!DOCTYPE html>\n"
        '<html lang="en">\n'
        "  <head>\n"
        '    <meta charset="utf-8" />\n'
        "    <title>Generated TOC</title>\n"
        "  </head>\n"
        "  <body>\n"
        "    <nav>\n"
        "      <ul>\n"
        f"{items}\n"
        "      </ul>\n"
        "    </nav>\n"
        "  </body>\n"
        "</html>\n"
    )


def extract_main_html(page_html: str) -> str:
    article_match = re.search(
        r"<article\b[^>]*>(.*?)</article>",
        page_html,
        re.IGNORECASE | re.DOTALL,
    )
    if article_match:
        return article_match.group(1)

    main_match = re.search(
        r"<main\b[^>]*>(.*?)</main>",
        page_html,
        re.IGNORECASE | re.DOTALL,
    )
    if main_match:
        return main_match.group(1)

    return page_html


class SimpleMarkdownParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []
        self.link_href: str | None = None
        self.link_text: list[str] = []
        self.in_pre = False
        self.in_code_inline = False
        self.pending_heading: int | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        if tag in {"h1", "h2", "h3", "h4", "h5", "h6"}:
            self._ensure_blank_line()
            self.pending_heading = int(tag[1])
        elif tag == "p":
            self._ensure_blank_line()
        elif tag in {"ul", "ol"}:
            self._ensure_blank_line()
        elif tag == "li":
            self.parts.append("\n- ")
        elif tag == "br":
            self.parts.append("\n")
        elif tag == "pre":
            self._ensure_blank_line()
            self.parts.append("```\n")
            self.in_pre = True
        elif tag == "code":
            if not self.in_pre:
                self.parts.append("`")
                self.in_code_inline = True
        elif tag == "strong":
            self.parts.append("**")
        elif tag == "em":
            self.parts.append("*")
        elif tag == "a":
            self.link_href = None
            self.link_text = []
            for key, value in attrs:
                if key.lower() == "href" and value:
                    self.link_href = value

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag in {"h1", "h2", "h3", "h4", "h5", "h6"}:
            self.pending_heading = None
            self.parts.append("\n")
        elif tag == "pre":
            self.in_pre = False
            self.parts.append("\n```\n")
        elif tag == "code" and self.in_code_inline:
            self.parts.append("`")
            self.in_code_inline = False
        elif tag == "strong":
            self.parts.append("**")
        elif tag == "em":
            self.parts.append("*")
        elif tag == "a":
            text = "".join(self.link_text).strip()
            href = self.link_href or ""
            if text and href:
                self.parts.append(f"[{text}]({href})")
            elif text:
                self.parts.append(text)
            self.link_href = None
            self.link_text = []

    def handle_data(self, data: str) -> None:
        if not data:
            return
        if self.pending_heading:
            prefix = "#" * self.pending_heading
            self.parts.append(f"{prefix} ")
            self.pending_heading = None

        if self.link_href is not None:
            self.link_text.append(data)
            return

        if self.in_pre:
            self.parts.append(data)
            return

        cleaned = re.sub(r"\s+", " ", html.unescape(data))
        if cleaned.strip():
            self.parts.append(cleaned)

    def get_markdown(self) -> str:
        text = "".join(self.parts)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip() + "\n"

    def _ensure_blank_line(self) -> None:
        if not self.parts:
            return
        if not self.parts[-1].endswith("\n"):
            self.parts.append("\n")
        if not self.parts[-1].endswith("\n\n"):
            self.parts.append("\n")


def html_to_markdown(page_html: str) -> str:
    main_html = extract_main_html(page_html)
    parser = SimpleMarkdownParser()
    parser.feed(main_html)
    return parser.get_markdown()


def extract_flight_strings(page_html: str) -> list[str]:
    marker = 'self.__next_f.push([1,"'
    strings: list[str] = []
    idx = 0
    while True:
        start = page_html.find(marker, idx)
        if start == -1:
            break
        i = start + len(marker)
        raw_parts: list[str] = []
        while i < len(page_html):
            ch = page_html[i]
            if ch == '"':
                break
            if ch == "\\":
                if i + 1 < len(page_html):
                    raw_parts.append(page_html[i : i + 2])
                    i += 2
                    continue
            raw_parts.append(ch)
            i += 1
        raw = "".join(raw_parts)
        try:
            decoded = json.loads('"' + raw + '"')
        except Exception:
            decoded = None
        if decoded:
            strings.append(decoded)
        idx = i + 1
    return strings


def extract_markdown_from_flight(page_html: str, slug: str) -> str | None:
    for payload in extract_flight_strings(page_html):
        if f"slug:{slug}" not in payload:
            continue
        match = re.search(r"---\n.*?\n---\n", payload, re.DOTALL)
        if match:
            return payload[match.end() :].strip() + "\n"
        return payload.strip() + "\n"
    return None


def fetch_url(url: str, timeout: float) -> str:
    request = Request(url, headers={"User-Agent": "zread-fetcher/1.0"})
    with urlopen(request, timeout=timeout) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def fetch_url_with_retries(
    url: str,
    timeout: float,
    delay: float,
    retries: int,
) -> str:
    attempt = 0
    while True:
        try:
            return fetch_url(url, timeout=timeout)
        except (HTTPError, URLError) as exc:
            attempt += 1
            if attempt > retries:
                raise exc
            sleep_for = delay * (1 + attempt)
            print(
                f"Retry {attempt}/{retries} for {url}: {exc}",
                file=sys.stderr,
            )
            time.sleep(sleep_for)


def write_markdown(output_path: Path, markdown: str) -> None:
    output_path.write_text(markdown, encoding="utf-8")


def write_toc(output_path: Path, paths: Iterable[str]) -> None:
    output_path.write_text(build_toc_html(paths), encoding="utf-8")


def filter_doc_paths(toc_url: str, paths: Iterable[str]) -> list[str]:
    parsed = urlparse(toc_url)
    base_path = parsed.path.rstrip("/")
    ordered: list[str] = []
    for path in paths:
        if not path or path.startswith("#"):
            continue
        ordered.append(path)

    def is_numeric_doc(p: str) -> bool:
        return bool(re.match(r"^/\d", p))

    numeric_matches = [p for p in ordered if is_numeric_doc(p)]
    base_matches = [p for p in ordered if base_path and p.startswith(base_path)]

    if base_path:
        combined: list[str] = [base_path]
        combined.extend(base_path + p for p in numeric_matches)
        combined.extend(p for p in base_matches if p != base_path)
        seen = set()
        ordered_unique: list[str] = []
        for item in combined:
            if item in seen:
                continue
            seen.add(item)
            ordered_unique.append(item)
        return ordered_unique

    return numeric_matches


def is_doc_like_path(path: str) -> bool:
    if re.search(
        r"\.(css|js|png|jpg|jpeg|gif|svg|ico|webmanifest)$", path, re.IGNORECASE
    ):
        return False
    return True


def normalize_doc_path(base_path: str, href: str) -> str | None:
    if not href or href.startswith("#"):
        return None
    if href.startswith("http://") or href.startswith("https://"):
        parsed = urlparse(href)
        path = parsed.path
    else:
        path = href

    if not path.startswith("/"):
        return None

    if base_path and path.startswith(base_path):
        return path

    if base_path and re.match(r"^/\d", path):
        return base_path + path

    return None


def crawl_doc_paths(
    start_url: str,
    base_url: str,
    base_path: str,
    timeout: float,
    delay: float,
    retries: int,
    max_pages: int,
) -> list[str]:
    queue = [start_url]
    seen_urls: set[str] = set()
    doc_paths: list[str] = []
    seen_paths: set[str] = set()

    while queue and len(seen_urls) < max_pages:
        url = queue.pop(0)
        if url in seen_urls:
            continue
        seen_urls.add(url)
        try:
            page_html = fetch_url_with_retries(
                url,
                timeout=timeout,
                delay=delay,
                retries=retries,
            )
        except (HTTPError, URLError) as exc:
            print(f"Failed {url}: {exc}", file=sys.stderr)
            time.sleep(delay)
            continue

        for href in extract_paths(page_html):
            normalized = normalize_doc_path(base_path, href)
            if not normalized:
                continue
            if not is_doc_like_path(normalized):
                continue
            if normalized not in seen_paths:
                seen_paths.add(normalized)
                doc_paths.append(normalized)
                next_url = resolve_url(base_url, normalized)
                if (
                    next_url not in seen_urls
                    and len(seen_urls) + len(queue) < max_pages
                ):
                    queue.append(next_url)

        time.sleep(delay)

    if base_path and base_path not in seen_paths:
        doc_paths.insert(0, base_path)
    return doc_paths


def iter_paths(paths: Iterable[str]) -> Iterable[str]:
    for path in paths:
        if not path.startswith("/") and not path.startswith("http"):
            path = "/" + path
        yield path


def normalize_base_url(base_url: str) -> str:
    parsed = urlparse(base_url)
    if not parsed.scheme:
        base_url = f"https://{base_url}"
    return base_url.rstrip("/")


def resolve_url(base_url: str, path: str) -> str:
    if path.startswith("http://") or path.startswith("https://"):
        return path
    return urljoin(base_url + "/", path)


def slug_from_path(path: str) -> str:
    if path.startswith("http://") or path.startswith("https://"):
        parsed = urlparse(path)
        path = parsed.path
    return path.rstrip("/").split("/")[-1]


def run(
    toc_path: Path,
    output_dir: Path,
    base_url: str,
    delay: float,
    timeout: float,
    force: bool,
    retries: int,
    only: list[str] | None,
    toc_url: str | None,
    crawl_url: str | None,
    crawl_max: int,
) -> int:
    if toc_url or crawl_url:
        print(
            "Hint: If zread.ai returns 504, increase --timeout or --retries.",
            file=sys.stderr,
        )
        if crawl_url:
            print(
                "Hint: If coverage is low, increase --crawl-max.",
                file=sys.stderr,
            )
    if toc_url:
        toc_html = fetch_url_with_retries(
            toc_url,
            timeout=timeout,
            delay=delay,
            retries=retries,
        )
        toc_paths = extract_paths(toc_html)
        filtered_paths = filter_doc_paths(toc_url, toc_paths)
        if not filtered_paths:
            print("No documentation links found in toc URL", file=sys.stderr)
            return 1
        toc_path.parent.mkdir(parents=True, exist_ok=True)
        write_toc(toc_path, filtered_paths)

    if crawl_url:
        crawl_base = urlparse(crawl_url)
        base_path = crawl_base.path.rstrip("/")
        crawl_paths = crawl_doc_paths(
            crawl_url,
            base_url=base_url,
            base_path=base_path,
            timeout=timeout,
            delay=delay,
            retries=retries,
            max_pages=crawl_max,
        )
        if not crawl_paths:
            print("No documentation links found while crawling", file=sys.stderr)
            return 1
        toc_path.parent.mkdir(parents=True, exist_ok=True)
        write_toc(toc_path, crawl_paths)

    if not toc_path.exists():
        raise FileNotFoundError(f"toc.html not found: {toc_path}")

    toc_html = toc_path.read_text(encoding="utf-8")
    paths = extract_paths(toc_html)
    if not paths:
        print("No documentation links found in toc.html", file=sys.stderr)
        return 1

    output_dir.mkdir(parents=True, exist_ok=True)
    base_url = normalize_base_url(base_url)
    only_set = {item.strip("/") for item in (only or []) if item.strip()}

    for path in iter_paths(paths):
        url = resolve_url(base_url, path)
        slug = slug_from_path(path)
        if only_set and slug not in only_set and path.strip("/") not in only_set:
            continue
        output_path = output_dir / f"{slug}.md"
        if output_path.exists() and output_path.stat().st_size > 0 and not force:
            print(f"Skip existing {output_path}")
            continue
        try:
            attempt = 0
            while True:
                try:
                    page_html = fetch_url(url, timeout=timeout)
                    markdown_from_flight = extract_markdown_from_flight(page_html, slug)
                    markdown_from_html = html_to_markdown(page_html)
                    if markdown_from_flight and len(markdown_from_flight) > len(
                        markdown_from_html
                    ):
                        markdown = markdown_from_flight
                    else:
                        markdown = markdown_from_html
                    write_markdown(output_path, markdown)
                    print(f"Wrote {output_path} ({url})")
                    break
                except (HTTPError, URLError) as exc:
                    attempt += 1
                    if attempt > retries:
                        raise exc
                    sleep_for = delay * (1 + attempt)
                    print(
                        f"Retry {attempt}/{retries} for {url}: {exc}",
                        file=sys.stderr,
                    )
                    time.sleep(sleep_for)
        except (HTTPError, URLError) as exc:
            print(f"Failed {url}: {exc}", file=sys.stderr)
        time.sleep(delay)

    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Fetch zread.ai docs listed in toc.html and save as markdown."
    )
    parser.add_argument(
        "--toc",
        type=Path,
        help="Path to toc.html",
    )
    parser.add_argument(
        "--toc-url",
        type=str,
        help="URL to generate toc.html from (writes to --toc or --toc-out)",
    )
    parser.add_argument(
        "--crawl-url",
        type=str,
        help="URL to crawl for doc links (writes to --toc or --toc-out)",
    )
    parser.add_argument(
        "--crawl-max",
        type=int,
        default=200,
        help="Maximum pages to crawl (default: 200)",
    )
    parser.add_argument(
        "--toc-out",
        type=Path,
        help="Write generated toc to this path (default: <output-dir>/top.htm)",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        required=True,
        help="Directory to write markdown files",
    )
    parser.add_argument(
        "--base-url",
        type=str,
        default=DEFAULT_BASE_URL,
        help="Base URL for resolving relative hrefs",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=0.25,
        help="Delay between requests in seconds (default: 0.25)",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=20.0,
        help="Request timeout in seconds (default: 20)",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing markdown files",
    )
    parser.add_argument(
        "--retries",
        type=int,
        default=2,
        help="Retry count for failed requests (default: 2)",
    )
    parser.add_argument(
        "--only",
        nargs="*",
        help="Only fetch specific slugs (example: 1-overview)",
    )
    args = parser.parse_args()
    if args.toc_url and args.crawl_url:
        parser.error("--toc-url and --crawl-url cannot be used together")

    toc_path = args.toc
    if toc_path is None:
        if args.toc_out is not None:
            toc_path = args.toc_out
        elif args.toc_url is not None or args.crawl_url is not None:
            toc_path = args.output_dir / "top.htm"

    if toc_path is None:
        parser.error("--toc is required unless --toc-url or --crawl-url is provided")

    return run(
        toc_path,
        args.output_dir,
        args.base_url,
        args.delay,
        args.timeout,
        args.force,
        args.retries,
        args.only,
        args.toc_url,
        args.crawl_url,
        args.crawl_max,
    )


if __name__ == "__main__":
    raise SystemExit(main())

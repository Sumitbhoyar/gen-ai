#!/usr/bin/env python
"""
Health check script for the setup-test environment.

Checks:
- Python runtime
- LangChain core packages
- Ollama CLI availability
- SQLite basic operation
"""

from __future__ import annotations

import json
import platform
import sqlite3
import urllib.error
import urllib.request
import subprocess
import sys
from importlib import import_module
from typing import Any, Dict, List


def format_result(name: str, ok: bool, details: str) -> Dict[str, Any]:
    return {
        "name": name,
        "status": "ok" if ok else "error",
        "details": details,
    }


def check_python() -> Dict[str, Any]:
    version_info = sys.version_info
    version_str = platform.python_version()
    ok = version_info >= (3, 9)
    details = f"Python {version_str} detected"
    if not ok:
        details += " (requires >= 3.9)"
    return format_result("python", ok, details)


def check_import(module_name: str, display_name: str | None = None) -> Dict[str, Any]:
    display = display_name or module_name
    try:
        module = import_module(module_name)
        version = getattr(module, "__version__", "unknown")
        return format_result(display, True, f"Import OK (version: {version})")
    except Exception as exc:  # noqa: BLE001
        return format_result(display, False, f"Import failed: {exc}")


def _run_ollama_cmd(args: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["ollama", *args],
        check=False,
        capture_output=True,
        text=True,
        timeout=5,
    )


def _probe_ollama_http() -> Dict[str, Any]:
    url = "http://localhost:11434/api/version"
    try:
        with urllib.request.urlopen(url, timeout=5) as resp:  # nosec B310
            body = resp.read().decode("utf-8", errors="ignore")
            return format_result(
                "ollama_http",
                True,
                f"HTTP {resp.status} {resp.reason} @ /api/version: {body.strip() or 'OK'}",
            )
    except urllib.error.HTTPError as exc:
        return format_result("ollama_http", False, f"HTTP error @ /api/version: {exc.code} {exc.reason}")
    except urllib.error.URLError as exc:
        return format_result("ollama_http", False, f"HTTP connection error to http://localhost:11434: {exc.reason}")
    except Exception as exc:  # noqa: BLE001
        return format_result("ollama_http", False, f"HTTP probe error: {exc}")


def check_ollama_cli() -> Dict[str, Any]:
    # Try common version flags, then fall back to HTTP probe.
    try_variants = [["--version"], ["version"]]
    for variant in try_variants:
        try:
            proc = _run_ollama_cmd(variant)
            if proc.returncode == 0:
                details = (proc.stdout or proc.stderr or "").strip() or f"ollama {' '.join(variant)} OK"
                return format_result("ollama_cli", True, details)
            # If the command is unknown, continue to next variant.
            stderr = (proc.stderr or "").strip().lower()
            if "unknown command" in stderr or "unknown flag" in stderr:
                continue
            return format_result("ollama_cli", False, f"Exit code {proc.returncode}: {proc.stderr.strip()}")
        except FileNotFoundError:
            return format_result("ollama_cli", False, "ollama CLI not found on PATH")
        except Exception as exc:  # noqa: BLE001
            return format_result("ollama_cli", False, f"Command error: {exc}")

    # Fallback: probe the local HTTP API.
    return _probe_ollama_http()


def check_sqlite() -> Dict[str, Any]:
    try:
        with sqlite3.connect(":memory:") as conn:
            conn.execute("CREATE TABLE healthcheck(id INTEGER PRIMARY KEY, label TEXT)")
            conn.execute("INSERT INTO healthcheck(label) VALUES (?)", ("ok",))
            row = conn.execute("SELECT label FROM healthcheck WHERE id = 1").fetchone()
            ok = row is not None and row[0] == "ok"
        return format_result("sqlite", ok, "In-memory DB create/insert/select OK" if ok else "Unexpected query result")
    except Exception as exc:  # noqa: BLE001
        return format_result("sqlite", False, f"SQLite error: {exc}")


def main() -> None:
    results: List[Dict[str, Any]] = []

    # Core runtime
    results.append(check_python())

    # LangChain ecosystem imports
    results.append(check_import("langchain", "langchain"))
    results.append(check_import("langchain_community", "langchain-community"))
    results.append(check_import("langchain_ollama", "langchain-ollama"))
    results.append(check_import("dotenv", "python-dotenv"))
    results.append(check_import("pypdf", "pypdf"))

    # External / system checks
    results.append(check_ollama_cli())
    results.append(check_sqlite())

    print(json.dumps({"results": results}, indent=2))


if __name__ == "__main__":
    main()


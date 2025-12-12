# Setup Test Environment

Utilities to validate local tooling for MCP servers. Includes a health check script for Python, LangChain, Ollama, and SQLite.

## Contents
- `requirements.txt` – Python dependencies
- `src/health_check.py` – Health/compatibility checks
- `.gitignore` – Python build artifacts

## Install

From the repo root:
```bash
cd rag/setup-test
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

## Run health check

```bash
cd rag/setup-test
python src/health_check.py
```

### What it checks
- Python runtime (>= 3.9)
- LangChain packages: `langchain`, `langchain-community`, `langchain-ollama`
- `python-dotenv` import
- `pypdf` import
- Ollama CLI availability (`ollama --version` / HTTP probe at http://localhost:11434/api/version)
- SQLite create/insert/select in an in-memory DB

Output is JSON with status for each component.

## Notes
- Ollama check requires the `ollama` CLI to be installed and on PATH; otherwise it reports an error but does not fail the script.
- The script is non-destructive and uses only in-memory SQLite.

## Adding more checks
Extend `src/health_check.py` with additional components (e.g., vector DBs or other providers) following the existing pattern.


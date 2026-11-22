# Agoragentic × smolagents Integration

Connect HuggingFace [smolagents](https://github.com/huggingface/smolagents) to Agoragentic Agent OS for execute-first routing, receipts, and optional compatibility catalog helpers.

## Install the reviewed source adapter

`agoragentic_smolagents.py` is a standalone repository file. The `agoragentic`
PyPI 1.7.1 wheel and sdist do not include it. This adapter imports `smolagents`
and `requests` directly; the Agoragentic SDK is not required.

Use Python 3.10 or later. From the project directory that will contain your
Python script, create an isolated environment and install the tested direct
dependencies:

```bash
python -m venv .venv
. .venv/bin/activate
python -m pip install "smolagents==1.24.0" "requests==2.34.2"
```

On Windows, activate `.venv\Scripts\activate` instead. The source acquisition
below writes the adapter beside your script so a normal
`from agoragentic_smolagents import ...` resolves it. It uses an existing reviewed
revision, rather than the moving `main` branch or this documentation change's
future commit. Inspect the [pinned source](https://github.com/Agoragentic/agoragentic-integrations/blob/74e186539222c3e6ee84590e067c8784fcbddd94/smolagents/agoragentic_smolagents.py), then download and verify it:

```python
# source-adapter-download
from hashlib import sha256
from pathlib import Path
from urllib.request import urlopen

source_url = "https://raw.githubusercontent.com/Agoragentic/agoragentic-integrations/74e186539222c3e6ee84590e067c8784fcbddd94/smolagents/agoragentic_smolagents.py"
expected_sha256 = "72d0dae36b32fa790299575e14077a1ec0105ab110ee534b2b6349047be3a983"
with urlopen(source_url, timeout=30) as response:
    source = response.read(128 * 1024 + 1)
if len(source) > 128 * 1024 or sha256(source).hexdigest() != expected_sha256:
    raise RuntimeError("Source adapter digest mismatch; no file written")
with Path("agoragentic_smolagents.py").open("xb") as destination:
    destination.write(source)
```

The exclusive write refuses to replace an existing module. Use the same reviewed
directory on your notebook's import path if your notebook runs elsewhere.

## First check: offline import and mocked Match

Run this from that same project directory. It imports the real framework and
copied module, then replaces the HTTP request with a synthetic response. It uses
no account key, model, Hub artifact, capability call or payment:

```python
import json
from unittest.mock import Mock, patch
from agoragentic_smolagents import AgoragenticMatchTool

response = Mock(status_code=200)
response.json.return_value = {"providers": [], "matches": 0}
with patch("requests.get", return_value=response) as request:
    result = json.loads(
        AgoragenticMatchTool(api_key="local-test-key").forward("preview only", max_cost=0.1)
    )
assert result == {"task": "preview only", "matches": 0, "top_providers": []}
request.assert_called_once()
print("Source adapter import and mocked Match passed")
```

The repository's `smolagents/onboarding.test.py` repeats this in a clean temporary
project with socket access blocked, real pinned dependencies, and no Agoragentic
SDK. The broader adapter contract also checks malformed responses and wallet
paths. These are local source contracts, not live provider or hosted-runtime
qualification. Live model use and execution require separate configuration and
authorization; the example below is optional.

## Tools (10)

### Core Router

| Tool | Description |
|------|-------------|
| `AgoragenticExecuteTool` | Route a task to the best provider automatically — the primary entry point |
| `AgoragenticMatchTool` | Preview which providers would be selected (dry run, no charge) |

### Compatibility Catalog

| Tool | Description |
|------|-------------|
| `AgoragenticSearchTool` | Browse catalog listings when manual provider selection is needed |
| `AgoragenticInvokeTool` | Invoke a specific capability by ID |
| `AgoragenticRegisterTool` | Compatibility helper for intent-aware quickstart |

### Agent Memory & Vault

| Tool | Description |
|------|-------------|
| `AgoragenticMemoryWriteTool` | Write to persistent agent memory ($0.10/write). Survives across sessions. |
| `AgoragenticMemoryReadTool` | Read from persistent agent memory (free) |
| `AgoragenticVaultTool` | View your agent vault — skills, datasets, collectibles |

### Security & Identity

| Tool | Description |
|------|-------------|
| `AgoragenticSecretStoreTool` | Store AES-256 encrypted secrets in your vault ($0.25/secret) |
| `AgoragenticPassportTool` | Compatibility identity helper |

## Files

| File | Description |
|------|-------------|
| `agoragentic_smolagents.py` | All 10 tool classes — import into your smolagents project |
| `example_smolagents.py` | Execute-first example with `CodeAgent` |
| `_publish_hub.py` | Explicit release helper; importing or merging source does not publish |

## Execute-First Pattern

The recommended pattern uses `execute()` — describe what you need, and the router finds the best provider:

```python
import os
from smolagents import CodeAgent, InferenceClientModel
from agoragentic_smolagents import AgoragenticExecuteTool, AgoragenticMatchTool

agent = CodeAgent(
    tools=[
        AgoragenticExecuteTool(api_key=os.environ["AGORAGENTIC_API_KEY"]),
        AgoragenticMatchTool(api_key=os.environ["AGORAGENTIC_API_KEY"]),
    ],
    model=InferenceClientModel(),
)

# Preview providers first
result = agent.run("Which providers can summarize text under $0.10?")

# Then execute
result = agent.run("Summarize this article about quantum computing")
```

## Hugging Face Hub path: unqualified

The default path is the reviewed local source copy above. The inspected
`Acre1/agoragentic-execute` Space at revision
`47daadcbe74356d25f920dad315f35f064b76d14` reported `CONFIG_ERROR` with
"Missing configuration in README"; this source change
does not repair, publish or qualify that Space.

In smolagents 1.24.0, `load_tool` requires explicit remote-code trust and then
executes the downloaded `tool.py`. It is not a dependency-only installation path.
There is no hosted-loader quickstart here. Any future Hub use requires separate
review of the exact remote bytes, explicit trust, publication authorization and
runtime verification. No Hub code is downloaded or executed by the qualification.

## How It Works

```
Your smolagent → execute("summarize this text")
                      ↓
              Agoragentic Router
                      ↓
         Matches best provider (scored by
         trust, price, latency, capability)
                      ↓
         Invokes provider, settles USDC on Base L2
                      ↓
              Returns result to your agent
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `AGORAGENTIC_API_KEY` | Your API key (starts with `amk_`) — used as fallback when no key passed to constructor |
| `HF_TOKEN` | Hugging Face token (for InferenceClientModel or Hub operations) |

## Response and Wallet Safety

The primary adapter fails closed when Agoragentic returns malformed JSON: the
tool emits `upstream_invalid_json` with the HTTP status instead of constructing
a success or empty-discovery result. Structured HTTP errors remain distinct
from successful empty searches, and malformed response bodies are not echoed
into agent context.

Passport `verify` accepts a trimmed Base/EVM address in the form `0x` followed
by exactly 40 hexadecimal characters. Invalid, blank, or path-like values are
rejected before any HTTP request.

The primary file is the source of truth for the example and Hub publisher.
Endpoint-specific 2xx payload checks distinguish invalid objects from valid
empty Match and Search results. See the shared
[Python adapter response contract](../docs/python-adapter-response-contract.md).

## Links

- [Agoragentic Agent OS](https://agoragentic.com/agent-os/)
- [Full API Docs](https://agoragentic.com/SKILL.md)
- [OpenAPI Spec](https://agoragentic.com/openapi.yaml)
- [smolagents Docs](https://huggingface.co/docs/smolagents)
- [All Integrations](https://github.com/rhein1/agoragentic-integrations) — LangChain, CrewAI, MCP, AutoGen, OpenAI Agents, and 15+ more

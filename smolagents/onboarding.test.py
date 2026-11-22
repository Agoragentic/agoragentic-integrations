"""Qualify source-copy onboarding with real, pinned dependencies and no network.

Run this explicitly with the isolated qualification environment's Python:
    python smolagents/onboarding.test.py

Unlike adapter.test.py's hermetic response tests, this gate has no dependency
fallback or skip. Missing or mismatched real dependencies fail the child run.
"""

import base64
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import textwrap
import unittest


ADAPTER_PATH = Path(__file__).resolve().with_name("agoragentic_smolagents.py")
SOURCE_COMMIT = "74e186539222c3e6ee84590e067c8784fcbddd94"
SOURCE_SHA256 = "72d0dae36b32fa790299575e14077a1ec0105ab110ee534b2b6349047be3a983"

# The driver runs as an ordinary project script, not as a repository module.
# -E ignores PYTHONPATH/PYTHONHOME, and -s excludes the user site directory.
CLEAN_PROJECT_DRIVER = textwrap.dedent(r'''
    import base64
    import importlib.metadata
    import importlib.util
    import io
    import json
    import os
    from pathlib import Path
    import socket
    import sys
    import traceback
    from unittest.mock import patch

    project = Path(__file__).resolve().parent
    checkout = Path(sys.argv[1]).resolve()
    assert Path.cwd().resolve() == project
    assert sys.flags.ignore_environment == 1
    assert sys.flags.no_user_site == 1
    assert Path(sys.path[0]).resolve() == project
    assert not any(
        Path(entry).resolve() in {checkout, checkout / "smolagents"}
        for entry in sys.path if entry
    ), "the clean project must not import through the checkout"

    network_attempts = []
    blocked_dependency_probes = []
    capability_attempts = []
    importing_dependencies = False

    def forbid_socket(event, args):
        if event in {
            "socket.__new__", "socket.connect", "socket.bind", "socket.sendto", "socket.sendmsg",
            "socket.getaddrinfo", "socket.gethostbyname", "socket.gethostbyname_ex",
            "socket.gethostbyaddr", "socket.getnameinfo",
        }:
            # urllib3 probes local IPv6 support while requests imports. Deny
            # allocation before it occurs, and report this identified probe
            # separately; all other socket attempts still fail qualification.
            local_import_probe = (
                importing_dependencies and event == "socket.__new__"
                and args[1] == socket.AF_INET6 and args[2] == socket.SOCK_STREAM
                and any(frame.name == "_has_ipv6" and frame.filename.replace("\\", "/").endswith("/urllib3/util/connection.py")
                        for frame in traceback.extract_stack(limit=8))
            )
            (blocked_dependency_probes if local_import_probe else network_attempts).append(event)
            raise AssertionError("socket use is forbidden during offline onboarding")

    sys.addaudithook(forbid_socket)

    fixture = json.loads((project / "onboarding-fixture.json").read_text(encoding="utf-8"))
    source = base64.b64decode(fixture["source_base64"], validate=True)
    download_code = compile(fixture["download"], "<README source-adapter-download>", "exec")
    module_path = project / "agoragentic_smolagents.py"
    with patch("urllib.request.urlopen", return_value=io.BytesIO(source)) as download:
        exec(download_code, {})
    download.assert_called_once_with(fixture["source_url"], timeout=30)
    assert module_path.read_bytes() == source

    # The actual documented acquisition must reject replacement and bad bytes.
    with patch("urllib.request.urlopen", return_value=io.BytesIO(source)):
        try:
            exec(download_code, {})
        except FileExistsError:
            pass
        else:
            raise AssertionError("existing source adapter was overwritten")
    assert module_path.read_bytes() == source
    mismatch_project = project / "mismatch"
    mismatch_project.mkdir()
    os.chdir(mismatch_project)
    try:
        with patch("urllib.request.urlopen", return_value=io.BytesIO(source + b"\n")):
            try:
                exec(download_code, {})
            except RuntimeError as error:
                assert "digest mismatch" in str(error)
            else:
                raise AssertionError("mismatched source adapter was accepted")
        assert not (mismatch_project / "agoragentic_smolagents.py").exists()
    finally:
        os.chdir(project)

    # These imports must succeed from installed distributions. Importing the
    # adapter first would allow its optional Tool fallback to mask a missing SDK.
    importing_dependencies = True
    import requests
    import smolagents
    from smolagents import Tool
    importing_dependencies = False

    for name, expected in {"smolagents": "1.24.0", "requests": "2.34.2"}.items():
        assert importlib.metadata.version(name) == expected, name
    assert importlib.util.find_spec("agoragentic") is None, (
        "the agoragentic SDK must be absent from this onboarding environment"
    )
    assert "agoragentic" not in sys.modules
    assert Tool.__module__ == "smolagents.tools"

    def forbid_capability(*args, **kwargs):
        capability_attempts.append("unexpected remote, Hub, or model operation")
        raise AssertionError(capability_attempts[-1])

    with (
        patch.object(requests.sessions.Session, "request", side_effect=forbid_capability),
        patch.object(requests, "post", side_effect=forbid_capability),
        patch.object(smolagents, "load_tool", side_effect=forbid_capability),
        patch.object(Tool, "from_hub", side_effect=forbid_capability),
        patch.object(Tool, "push_to_hub", side_effect=forbid_capability),
        patch.object(smolagents, "CodeAgent", side_effect=forbid_capability),
        patch.object(smolagents, "InferenceClientModel", side_effect=forbid_capability),
    ):
        import agoragentic_smolagents as adapter

        assert Path(adapter.__file__).resolve() == project / "agoragentic_smolagents.py"
        assert adapter.Tool is Tool, "the real framework Tool must replace the fallback"
        assert adapter.requests is requests
        assert issubclass(adapter.AgoragenticMatchTool, Tool)
        tool = adapter.AgoragenticMatchTool(api_key="synthetic-offline-key")
        tool.validate_arguments()
        assert tool.name == "agoragentic_match"
        assert tool.output_type == "string"
        assert tool.inputs["task"]["type"] == "string"
        assert tool.inputs["max_cost"] == {
            "type": "number", "description": "Budget cap in USDC", "nullable": True,
        }

        response = requests.Response()
        response.status_code = 200
        response.url = "https://agoragentic.com/api/execute/match"
        response.headers["Content-Type"] = "application/json"
        response.encoding = "utf-8"
        response._content = b'{"providers": [], "matches": 0}'

        # Exercise the real Tool.__call__ path, including framework argument
        # validation, while replacing the HTTP boundary with a single fixture.
        with patch.object(requests, "get", return_value=response) as mocked_get:
            result = json.loads(tool(task="summarize this text", max_cost=0.25))
        mocked_get.assert_called_once_with(
            "https://agoragentic.com/api/execute/match",
            params={"task": "summarize this text", "max_cost": 0.25},
            headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer synthetic-offline-key",
            },
            timeout=15,
        )
        assert result == {
            "task": "summarize this text", "matches": 0, "top_providers": [],
        }

        # Also execute the default README smoke block unchanged. It supplies
        # its own mocked GET; inspect that mock's exact wire contract afterward.
        documented = {}
        exec(compile(fixture["smoke"], "<README offline Match>", "exec"), documented)
        assert documented["result"] == {
            "task": "preview only", "matches": 0, "top_providers": [],
        }
        documented["request"].assert_called_once_with(
            "https://agoragentic.com/api/execute/match",
            params={"task": "preview only", "max_cost": 0.1},
            headers={"Content-Type": "application/json", "Authorization": "Bearer local-test-key"},
            timeout=15,
        )

    assert not network_attempts, network_attempts
    assert not capability_attempts, capability_attempts
    assert "agoragentic" not in sys.modules
    print(json.dumps({
        "adapter_import": "clean_project_source_copy",
        "real_tool_contract": True,
        "mock_match": result,
        "unexpected_socket_attempts": len(network_attempts),
        "blocked_dependency_socket_probes": len(blocked_dependency_probes),
        "total_socket_attempts": len(network_attempts) + len(blocked_dependency_probes),
        "socket_operations_permitted": 0,
        "capability_attempts": len(capability_attempts),
        "agoragentic_sdk_required": False,
    }, sort_keys=True))
''')


class SourceCopyOnboardingTests(unittest.TestCase):
    def test_catalog_and_documented_dependency_pins_identify_the_source_copy(self):
        root = ADAPTER_PATH.parent.parent
        manifest = json.loads((root / "integrations.json").read_text(encoding="utf-8"))
        entry = next(item for item in manifest["integrations"] if item["id"] == "smolagents")
        self.assertEqual(entry["path"], "smolagents/agoragentic_smolagents.py")
        copy_step, separator, dependency_step = entry["install"].partition(";")
        self.assertEqual(separator, ";")
        self.assertEqual(copy_step, f"Copy {entry['path']} at {SOURCE_COMMIT} to your project (verify source SHA-256 in smolagents/README.md)")
        self.assertEqual(dependency_step.strip(), 'python -m pip install "smolagents==1.24.0" "requests==2.34.2"')
        readme = ADAPTER_PATH.with_name("README.md").read_text(encoding="utf-8")
        expected = {"smolagents==1.24.0", "requests==2.34.2"}
        requirements = ADAPTER_PATH.with_name("requirements-tested.txt").read_text(encoding="utf-8")
        self.assertEqual({line.strip() for line in requirements.splitlines() if line.strip() and not line.startswith("#")}, expected)
        for requirement in expected:
            self.assertIn(f'"{requirement}"', entry["install"])
            self.assertIn(f'"{requirement}"', readme)
        row = f"| smolagents | {entry['path']} | {entry['install']} |"
        self.assertIn(row, (root / "llms-full.txt").read_text(encoding="utf-8").splitlines())

    def test_clean_project_uses_pinned_adapter_and_real_runtime_without_network(self):
        source = ADAPTER_PATH.read_bytes()
        self.assertEqual(
            hashlib.sha256(source).hexdigest(), SOURCE_SHA256,
            f"onboarding source must remain the reviewed {SOURCE_COMMIT} adapter",
        )
        with tempfile.TemporaryDirectory(prefix="agoragentic-smolagents-onboarding-") as directory:
            project = Path(directory).resolve()
            readme = ADAPTER_PATH.with_name("README.md").read_text(encoding="utf-8")
            acquisition = re.findall(r"```python\n(# source-adapter-download\n.*?)\n```", readme, re.DOTALL)
            self.assertEqual(len(acquisition), 1, "README must provide one pinned source acquisition block")
            smoke_section = readme.split("## First check: offline import and mocked Match", 1)[1].split("## Tools", 1)[0]
            smoke = re.findall(r"```python\n(.*?)\n```", smoke_section, re.DOTALL)
            self.assertEqual(len(smoke), 1, "the default first check must remain an executable offline smoke")
            fixture = {
                "source_base64": base64.b64encode(source).decode("ascii"),
                "source_url": f"https://raw.githubusercontent.com/Agoragentic/agoragentic-integrations/{SOURCE_COMMIT}/smolagents/agoragentic_smolagents.py",
                "download": acquisition[0],
                "smoke": smoke[0],
            }
            (project / "onboarding-fixture.json").write_text(json.dumps(fixture), encoding="utf-8")
            driver = project / "qualify.py"
            driver.write_text(CLEAN_PROJECT_DRIVER, encoding="utf-8")
            completed = subprocess.run(
                [sys.executable, "-E", "-s", str(driver), str(ADAPTER_PATH.parent.parent)],
                cwd=project,
                capture_output=True,
                text=True,
                timeout=60,
                check=False,
            )
        self.assertEqual(
            completed.returncode, 0,
            "real-dependency source-copy qualification failed:\n"
            + completed.stdout + completed.stderr,
        )
        report = json.loads(completed.stdout.splitlines()[-1])
        self.assertTrue(report["real_tool_contract"])
        self.assertEqual(report["unexpected_socket_attempts"], 0)
        self.assertEqual(report["capability_attempts"], 0)
        self.assertFalse(report["agoragentic_sdk_required"])
        self.assertEqual(report["socket_operations_permitted"], 0)
        self.assertEqual(report["total_socket_attempts"], report["blocked_dependency_socket_probes"])
        print("Onboarding socket guard:", json.dumps({key: report[key] for key in (
            "blocked_dependency_socket_probes", "total_socket_attempts", "socket_operations_permitted",
        )}, sort_keys=True))


if __name__ == "__main__":
    unittest.main()

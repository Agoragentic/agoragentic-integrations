# AnyDoc Semantic Conformance Harness

This harness tests the lockfile-pinned `@firecrawl/anydoc@0.1.7` package against small public-safe files that exercise known document-conversion risks.

It does **not** assert that AnyDoc preserves every source semantic. It verifies that the adapter:

- runs the installed package in a killable child process with a deadline, V8 heap bound, sanitized environment, and Node permission boundary;
- reports installed parser and native-binding provenance instead of trusting hard-coded metadata;
- hard-splits evidence units and accounts for every covered or omitted character;
- fails closed for image-only, mixed text/image, password-protected, and malformed PDFs;
- independently recomputes fixture, source, parser-output, bounded-output, and evidence-coverage hashes;
- marks the result as non-source-exact and discloses format-specific limitations;
- blocks incomplete output, structure failures, unreviewed assets, and unattested custom parsers;
- keeps trap scanning and Agent OS context attachment pending;
- validates every spend, wallet, deployment, publication, memory, trust, and receipt-boundary flag.

The adapter-level network guard blocks Node built-in and global network APIs. It cannot prove that a native dependency made no raw syscall. CI therefore runs this harness inside a Docker container with `--network none`, finite memory/CPU/PID limits, a read-only source mount, no capabilities, and `no-new-privileges`. The harness independently checks those properties before setting `scope.no_network` to `true`.

## Cases

| Case | Boundary exercised |
|---|---|
| CSV baseline | signature-less format and non-authoritative types |
| Long CSV | hard chunk limits, ordered-prefix coverage, and incomplete-receipt blocker |
| XLSX hidden/formatted values | hidden content, percent formatting, formulas, coordinates, merged cells |
| XLSM alias | advertised macro-format alias normalizes to canonical `xlsx` |
| XLSX display formats and formula cache | worksheet order and date text retained, numeric display formats omitted, stale cached formula value emitted with a zero formula count |
| XLSX input size cap | a small valid workbook exceeds a deliberately lower byte limit and is rejected without retry |
| DOCX nested table with a header and footer | nested cell text retained, header and footer text absent from untruncated Markdown |
| DOCX with one embedded image | image counted in the receipt, image excluded from evidence, and incomplete receipt blocker |
| DOCX comment annotation | comment part and anchor are source-verified; pinned parser behavior is recorded without publishing comment text |
| DOCX Word text box | text from a source-verified VML text box appears in Markdown; the result makes no layout-fidelity claim |
| DOCX hidden run | instruction-like text marked hidden in Word appears in Markdown; the receipt stays pending and context attachment requires a trap scan |
| DOCX referenced footnote and endnote | both notes appear in Markdown, two structured notes are counted, and the receipt remains incomplete until note review |
| PPTX untitled slides with speaker notes | slide and note text retained in Markdown, zero notes counted in the structured result |
| Text PDF control | both text markers retained without OCR, complete text coverage, and a receipt blocked on unavailable document structure |
| Image-only PDF | explicit OCR-required failure |
| PDFs with one text page and one image-only page | both verified page orders reject with an OCR-required error and return no partial packet or receipt |
| Password-protected PDF | explicit encrypted-document failure |
| Truncated PDF container | explicit malformed-document failure |

The Python generator reopens and verifies the source-side facts before writing `generated/fixture-manifest.json`. The Node harness checks every fixture hash, the full generator dependency inventory, and the hash-locked requirements file against that manifest before invoking AnyDoc.

## Run locally

```bash
python -m pip install --require-hashes -r conformance/requirements.txt
python conformance/generate-fixtures.py
node conformance/run-conformance.mjs
cat conformance/report.json
```

A direct local run is useful for semantics, hashes, and authority checks, but reports `scope.no_network: false` unless it independently observes the required OS sandbox.

CI uses the equivalent of:

```bash
docker run --rm --network none --read-only \
  --memory 768m --memory-swap 768m --cpus 1 --pids-limit 64 \
  --cap-drop ALL --security-opt no-new-privileges \
  -v "$PWD:/work:ro" -v "$REPORT_DIR:/out:rw" -w /work \
  node:24-bookworm-slim \
  node conformance/run-conformance.mjs /out/report.json --require-os-sandbox
```

Python fixture dependencies are conformance-only and fully pinned with hashes in `conformance/requirements.txt`. Generated files and reports are not package inputs or marketplace proof. The uploaded report contains hashes, source-fact labels, limits, and statuses, but no Markdown excerpts or raw document bytes.

## Interpreting the report

A `pass` means the adapter represented the observed parser behavior honestly and maintained the tested authority boundary under the recorded sandbox.

It does not mean:

- source-exact conversion;
- legal, financial, compliance, or accounting correctness;
- universal prompt-injection safety;
- OCR support;
- production listing readiness;
- certification or endorsement by Firecrawl.

The production capability gate remains `rhein1/agent-marketplace#1269`.

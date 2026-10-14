// Offline tests for the optional x402-spotcheck buyer example (buyer.mjs, sdk/node/README.md).
// Mock fetch and a throwaway signing key only: no live endpoints, credentials, chain calls or spend.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { SpotCheckBlockedError, VERSION, spotCheckFetch } from "x402-spotcheck";
import { createCheckedBuyer } from "./buyer.mjs";

const URL_ = "https://seller.test/v1/text-summarizer";
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const PAY_TO = "0x" + "ab".repeat(20);
const LISTING = { price: 0.01, payTo: PAY_TO, network: "eip155:8453" };
const requirement = (o = {}) => ({ scheme: "exact", network: "eip155:8453", amount: "10000", asset: USDC, payTo: PAY_TO, maxTimeoutSeconds: 300, extra: { name: "USD Coin", version: "2" }, ...o });
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64");
const unb64 = (s) => JSON.parse(Buffer.from(s, "base64").toString());

// Mock seller: 402 with the given accepts until a payment header arrives, then 200. Records every request.
function seller({ accepts = [requirement()], raw402 = null } = {}) {
  const log = [];
  const fetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input.url;
    const h = new Headers(init.headers || (typeof input === "string" ? {} : input.headers));
    const paid = h.get("payment-signature") || h.get("x-payment");
    log.push({ url, paid: paid ? unb64(paid) : null });
    if (paid) return Response.json({ result: "summary" });
    if (raw402 != null) return new Response(raw402, { status: 402 });
    const c = { x402Version: 2, error: "Payment required", resource: { url }, accepts };
    return new Response(JSON.stringify(c), { status: 402, headers: { "content-type": "application/json", "payment-required": b64(c) } });
  };
  return { fetch, log, payments: () => log.filter((r) => r.paid) };
}

const buyer = (s, listings = new Map([[URL_, LISTING]])) =>
  createCheckedBuyer({ account: privateKeyToAccount(generatePrivateKey()), listings, fetchImpl: s.fetch });
const post = (pay) => pay(URL_, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "doc" }) });
const blocked = (code) => (err) => {
  const e = err instanceof SpotCheckBlockedError ? err : err?.cause;
  assert.ok(e instanceof SpotCheckBlockedError, "expected SpotCheckBlockedError, got " + err);
  if (code) assert.ok(e.decision?.reason_code === code || String(e.message).includes(code), `expected ${code}: ${e.message}`);
  return true;
};

test("pinned to x402-spotcheck 1.0.0", () => {
  assert.equal(VERSION, "1.0.0");
  const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url)));
  assert.equal(pkg.dependencies["x402-spotcheck"], "github:withgrokbot/x402-spotcheck#v1.0.0");
  assert.equal(pkg.dependencies["@x402/fetch"], "2.28.0");
  const lock = readFileSync(new URL("./package-lock.json", import.meta.url), "utf8");
  assert.match(lock, /x402-spotcheck\.git#a863ee089f69320e4f3da104c8c5f6077211d7bd/);
});

test("README optional example matches buyer.mjs imports and wrapper order", () => {
  const readme = readFileSync(new URL("../../sdk/node/README.md", import.meta.url), "utf8");
  assert.match(readme, /const fetchWithPayment = wrapFetchWithPayment\(fetch, wallet\);/, "default example unchanged");
  assert.match(readme, /npm i @x402\/fetch@2\.28\.0 @x402\/evm@2\.28\.0 viem github:withgrokbot\/x402-spotcheck#v1\.0\.0/);
  assert.match(readme, /import \{ x402Client, wrapFetchWithPayment \} from "@x402\/fetch";/);
  assert.match(readme, /import \{ spotCheckFetch \} from "x402-spotcheck";/);
  assert.match(readme, /wrapFetchWithPayment\(checkedFetch, client\)/);
  assert.match(readme, /mode: "local"/);
  assert.match(readme, /expected: \(url\) => listings\.get\(url\)/);
});

test("valid terms: signs once and pays the listed recipient", async () => {
  const s = seller();
  const res = await post(buyer(s));
  assert.equal(res.status, 200);
  assert.equal(s.payments().length, 1);
  assert.equal(s.payments()[0].paid.accepted.payTo, PAY_TO);
  assert.equal(s.payments()[0].paid.accepted.amount, "10000");
});

for (const [name, req, code] of [
  ["changed price", requirement({ amount: "20000" }), "price_mismatch"],
  ["changed recipient", requirement({ payTo: "0x" + "ee".repeat(20) }), "pay_to_mismatch"],
]) {
  test(`${name}: blocked, no payment payload sent`, async () => {
    const s = seller({ accepts: [req] });
    await assert.rejects(post(buyer(s)), blocked(code));
    assert.equal(s.payments().length, 0);
  });
}

test("wrong network: listing on another network than the Base challenge: network_mismatch, nothing sent", async () => {
  const s = seller();
  await assert.rejects(post(buyer(s, new Map([[URL_, { ...LISTING, network: "eip155:84532" }]]))), blocked("network_mismatch"));
  assert.equal(s.payments().length, 0);
});

test("scope: a non-Base challenge is not judged by spotcheck (Base only by default)", async () => {
  const s = seller({ accepts: [requirement({ network: "eip155:84532" })] });
  // spotcheck passes it through; here @x402/fetch then declines on its own, so still nothing is sent.
  await assert.rejects(post(buyer(s)), (e) => !(e instanceof SpotCheckBlockedError) && !(e?.cause instanceof SpotCheckBlockedError));
  assert.equal(s.payments().length, 0);
});

test("unknown: no listing for the URL passes through to local sanity checks only", async () => {
  const s = seller();
  assert.equal((await post(buyer(s, new Map()))).status, 200);
  assert.equal(s.payments().length, 1);
});

test("error: a throwing expected() passes through (documented fail-open)", async () => {
  const s = seller();
  const pay = createCheckedBuyer({ account: privateKeyToAccount(generatePrivateKey()), listings: { get() { throw new Error("catalog down"); } }, fetchImpl: s.fetch });
  assert.equal((await post(pay)).status, 200);
  assert.equal(s.payments().length, 1);
});

test("changed signed retry: a payment header for different terms is refused before it is sent", async () => {
  const s = seller();
  const guarded = spotCheckFetch(s.fetch, { mode: "local", expected: (url) => new Map([[URL_, LISTING]]).get(url) });
  const forged = b64({ x402Version: 2, resource: { url: URL_ }, accepted: requirement({ payTo: "0x" + "ee".repeat(20) }), payload: { signature: "0x00" } });
  await assert.rejects(guarded(URL_, { method: "POST", headers: { "PAYMENT-SIGNATURE": forged } }), blocked("pay_to_mismatch"));
  assert.equal(s.log.length, 0, "nothing reached the seller");
});

test("local mode makes no requests other than to the seller", async () => {
  const s = seller();
  await post(buyer(s));
  assert.ok(s.log.every((r) => r.url === URL_));
});

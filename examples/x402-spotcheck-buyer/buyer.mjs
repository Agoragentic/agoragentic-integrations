// Optional example: the anonymous x402 buyer flow with a local pre-payment check.
// The default example in sdk/node/README.md does not need this; it is the same flow with one extra wrapper.
//
//   npm i @x402/fetch@2.28.0 @x402/evm@2.28.0 viem github:withgrokbot/x402-spotcheck#v1.0.0
//
// x402-spotcheck 1.0.0 in local mode (the default, set explicitly here) makes no network calls of its own.
// It compares each 402 challenge with the listing terms you return from `expected`, before the x402 client signs:
// a different price, pay-to or network, or a non-USDC asset, throws SpotCheckBlockedError and nothing is signed.
// It also checks a signed retry against the same terms before it is sent.
// Scope: Base mainnet only (other networks pass through), and anything it cannot judge passes through
// (no listing for the URL, an unreadable 402, or an error in `expected` or in the check itself).
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { spotCheckFetch } from "x402-spotcheck";

/**
 * listings: Map of URL -> { price (USD), payTo, network (CAIP-2) }, taken from terms you reviewed
 * (for example an x402Listings() entry or a quote), not from the 402 you are about to pay.
 */
export function createCheckedBuyer({ account, listings, fetchImpl = globalThis.fetch }) {
  const client = new x402Client().register("eip155:*", new ExactEvmScheme(account));
  const checkedFetch = spotCheckFetch(fetchImpl, {
    mode: "local",
    expected: (url) => listings.get(url),
  });
  return wrapFetchWithPayment(checkedFetch, client);
}

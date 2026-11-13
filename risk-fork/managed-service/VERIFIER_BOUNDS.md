# Local managed verifier wait bounds

`createManagedProviderRegistry(registrations, options)` accepts optional trusted
host settings `verification_timeout_ms` (integer 50–30000, default 10000) and
`verification_concurrency` (integer 1–64, default 8). Unknown settings and invalid
values are rejected. Existing registry bindings, qualification hashes, error
codes, enabled/disabled cleanup policy and `local_test`-only admission remain
unchanged. These settings grant no provider authority.

Each registry has three independent pools shared across its registrations:
resource-binding verification, cleanup-evidence verification and recovery-absence
verification. This reserves cleanup/recovery capacity when resource verification
is saturated. Capacity is reserved before calling the callback; overload fails
closed immediately without queuing or invoking another callback. Only strict
`true` settled inside the deadline is accepted. Throws/rejections, overload and
expired waits use the existing purpose-specific attestation failure paths; raw
callback diagnostics are not returned.

A timeout only bounds the caller's asynchronous wait. The underlying callback is
not terminated. Its slot stays occupied until it actually settles, and late true
results cannot convert a failed attestation into success. Never reset or recreate
a registry to evade capacity held by unresolved operations. A registry restart is
not proof that those operations stopped. Separate registries/processes do not
share a global limit; production deployment must enforce its own aggregate bound.

The monotonic elapsed-time check also rejects a synchronous callback which
returns after the deadline, but JavaScript timers cannot preempt a callback that
blocks the event loop. Trusted read-only verifier implementations must still be
qualified for bounded work, cancellation/isolation, retry safety, and absence of
provider mutation. Durable operational circuit breakers, cross-process limits,
alerts and actual production qualification remain open. The tests use synthetic
callbacks only, never provider credentials, paid allocations or a hosted service.

# YEMA Production Internal Testing

Entry point: `/{locale}/internal-test`

Access is restricted server-side to the owner account configured in `src/lib/internalTest.ts`.

The console provisions idempotent Production fixtures for the nine YEMA personas and stores the active test persona in an HttpOnly cookie. Child personas use the existing signed child-session cookie.

The adult catalogue is available at `/{locale}/offers`. All authenticated adults can view the full Monde and Racines pricing catalogue. Only the owner internal-test account can use simulated payment. The simulation creates a real `Order`, a confirmed `Payment`, and an active `AccessGrant` marked `internalTest`; it does not contact an external payment provider.

Courses not yet editorially available remain labelled as coming soon. No placeholder cultural content is fabricated.

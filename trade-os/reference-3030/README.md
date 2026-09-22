# Local 3030 screen source

The five operations routes use the working-tree React components from the local
`ecoya-platform-user-frontend` running on port 3030, copied on 2026-09-20. They are
not screenshots or an embedded page. `source-manifest.json` records the original
file hashes; no source files in the reference workspace were changed.

## Preserved

- Monitor data, the two KPI cards, operational exception panels,
  risk/status placement, task grouping, filters and throughput presentation.
- Reports, sales performance, settlement and shipment component trees, queries,
  decimal calculations, charts, table columns, filters and dialogs.
- Actual local identity, entitlements and API responses; no sample-count overrides.

## Host adaptations

- Imports are namespaced under `reference-3030`; Korean messages are local imports.
- Next link/navigation and portal APIs have small Vite/React adapters in `compat`.
- The five screens retain the host's blue key-visual gradient. The outer host
  navigation is unchanged. The Owner principles panel was removed per user request.
- `reference.css` is generated from the source CSS and scoped to `.reference-3030`,
  including portal content. `host-tokens.css` maps its palette, typography,
  radius and shadow roles to live erp-doc-ui tokens, including body-mounted dialogs.
  Hero filters share `src/styles/hero-filter-tokens.css` with BusinessPageHero
  (transaction list); dropdown option panels keep their normal surface tokens.
  The transaction list and all five routes use `src/components/business-filters.tsx`
  and `src/styles/business-filters.css` for layout, search and segmented controls.
  Search is 40px; filter controls are 32px with shared spacing, typography and states.
  Existing tabs and visible choices remain visible; longer groups wrap to three
  columns on mobile. Query callbacks and dropdown implementations are preserved.
- Monitor's four operational queues each fill the content width in one column. Queue bodies
  scroll at 400px, inner queue frames are removed, and mobile uses one column.
  Counts, filtering and record actions still use the source data/functions.
- Reports, shipments, monitor, settlement and sales filters are inside the blue PageHeader.
  Reports, sales, settlement and monitor summary cards overlap the lower hero boundary, matching
  the host transaction list. Query and close behavior is preserved.
- Shipment results group by transaction, with one shared table per transaction
  and independent rows for B/L/container, route/vessel, effective ETD/ETA, evidence,
  status and tracking refresh. Confirmed dates keep precedence; source details
  expand within the date cell. Narrow screens scroll the table inside its card.
- Shipment statuses reuse the document list’s host `Tabs` (neutral background and
  white selected tab), with a labelled result panel and keyboard
  navigation. Settlement decision cards are unframed in the hero summary.
- `host.css` contains these presentation adaptations and the host-shell layout.
- Dialog accessibility skips the portal's style wrapper when hiding background
  content. This keeps the dialog available to keyboard and assistive technology.
- Operational content, including the monitor dashboard body below its header,
  fills the available width without the old 1440px cap.
  Typography aliases inherit the host tokens even where the imported CSS declares
  a snapshot of the same token names. Filters use 14px, primary labels 15px,
  secondary labels and chart ticks 13px through the host token scale.
- Native tables in monitor, sales, reports and settlement use the host Table
  primitives via `HostTable.tsx`: shared header fill, borders, hover states,
  14px cell typography and 12px cell padding. Existing columns, status colors,
  filtering and data queries are preserved.
- UUID transaction links now open a backend-connected detail in the host shell.
  The detail reads the same transaction and deal-scoped shipments API, showing
  transaction information, document status and refreshed tracking data. Existing
  DL-* prototype routes are unchanged. Tracking writes use the existing capability
  gate; confirmed dates retain precedence over provider dates. Opening the detail,
  reloading, or returning focus reads current backend values.
- Other destinations not yet imported (such as source document detail) still
  open the real local 3030 destination, preserving the actual record ID.

## Running locally

Keep the reference server at `http://localhost:3030` running, then run the host's
usual Vite development server. `vite.config.ts` relays only
`/__reference3030/api/platform/*` to the local reference server. The existing local
development credential is loaded server-side, never included in the client bundle.
Set `ECOYA_REFERENCE_ROOT` if the reference workspace is located elsewhere.

The canonical forms retain their API operations. User-submitted actions therefore
use the same local backend as 3030. Verification opens and cancels dialogs but does
not save financial records, close periods, or send dunning messages.

This connection is for local review; production builds show an explicit connection
notice rather than substituting sample data. No commit or deployment was performed.

## Checks

```sh
node scripts/build-reference-3030-styles.mjs
npx tsc -b --pretty false
npx playwright test tests/operations-3030-parity.spec.ts tests/shipments-host-deal.spec.ts --project=chrome
```

The browser checks compare live source and target KPI values, counts, table columns,
monitor placement, filters and close-dialog dismissal, plus all five screens at
390px width. The source browser must use Korean (`ecoya_locale=ko`) for comparison.

## Shipment / deal synchronization

- The existing deal workspace's shipment section embeds the same `ShipmentsConnected`
  reader and per-shipment refresh operation in local mode; its old example timeline
  no longer supplies live shipment values. Its ETA/status/count summary is updated
  from the same result. Other order-workflow controls remain in the workspace.
- UUIDs are queried directly. A human-readable deal number is resolved only by an
  exact, unique backend `display_id` match; missing matches show no shipments and
  ambiguous matches fail closed. Unrelated sample transactions are never substituted.
- Successful tracking writes publish record IDs through a local event and
  BroadcastChannel. Open lists and matching deal sections re-read their own authorized
  API data, including background tabs. No shipment payload is persisted in storage.
- Focus and navigation also re-read current data. Failed writes emit no update;
  manually confirmed ETA/ETD continue to take precedence over carrier values.

## Public design preview (devdev)

Production bundles use a separately labelled example-data adapter (`demo/`).
This was requested for the public design deployment on 2026-09-21. The local
3030 relay remains the default for development; `VITE_OPERATIONS_DEMO=true`
lets a developer test the public preview without any backend.

The demo uses sanitized seed response contracts and synthetic shipment records.
It never calls the live API, bundles credentials, or sends financial mutations.
Shipment refresh changes example ETA/status in this browser's localStorage and
uses the existing cross-tab update events. The normal deal workspace and UUID
shipment detail read the same example records. Other write operations explicitly
report that the example screen cannot perform actual saves or delivery.

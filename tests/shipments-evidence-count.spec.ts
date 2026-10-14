import { expect, test } from "@playwright/test"

test("shipment evidence count comes from its shipment while photos come from SNAP", async ({ page }) => {
  await page.route("**/__reference3030/api/platform/me", route => route.fulfill({ json: {
    user_id: "test-user",
    account: { account_id: "test-user", email_verified: true },
    current_organization_id: "test-org",
    organizations: [{ organization_id: "test-org", lifecycle_state: "active", membership: { status: "active", role: "OWNER" } }],
    capabilities: { can_create_organization: false, can_manage_billing: false, can_manage_products: false },
    products: [{ product_id: "TRADE_OS", subscription_state: "paid_active", trial_state: "not_started", trial_quota_state: "not_applicable", product_access_allowed: true, entitlement_state: "active", member_access: "granted", onboarding_state: "complete" }],
    landing: { state: "ready", path: "/erp/shipments", reason_code: "TEST_READY", allowed_actions: [], product_id: "TRADE_OS", organization_id: "test-org" },
  } }))
  await page.route("**/__reference3030/api/platform/me/entitlements", route => route.fulfill({ json: {
    features: { "erp.write": false }, products: { erp: { enabled: true }, snap: { enabled: true } }, workspace: { default_product: "TRADE_OS" },
  } }))
  await page.route("**/__reference3030/api/platform/trade/shipments**", route => route.fulfill({ json: {
    shipments: [{ id: "shipment-1", deal_id: "deal-1", deal_title: "근거 확인 거래", bl_number: "BL-1", container_number: "TEST000001", source: "manual", status: "departed", snap_evidence_count: 2 }],
    sync_status: "ok",
  } }))
  await page.route("**/__reference3030/api/platform/trade/snap-evidence/containers**", route => route.fulfill({ json: {
    containers: [{ id: "evidence-1", loading_job_id: "job-1", capture_key: "one", container_no: "TEST000001", container_no_valid: true, media_count: 3, status: "allocated" }],
  } }))
  await page.goto("/erp/shipments")
  const shipment = page.locator('[data-shipment-id="shipment-1"]')
  await expect(shipment.getByRole("link", { name: "SNAP 2건 · 3장" })).toBeVisible()
})

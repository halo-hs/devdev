// GENERATED FILE — do not edit by hand.
// Regenerate: npm run gen:api (scripts/generate-api-types.mjs)
// Backend pin: ecoya-platform-backend@5ce8126a1031fb969bf4df196a3d21bf118e37fc
// Source: docs/api/swagger.json → src/lib/api/generated/openapi.snapshot.json

export interface LandingCapabilities {
  can_create_organization?: boolean;
  can_manage_billing?: boolean;
  can_manage_products?: boolean;
}

export interface LandingDecision {
  allowed_actions: Array<string>;
  organization_id?: string;
  path: string;
  product_id?: string;
  reason_code: string;
  state: "signup_resume_required" | "invite_accept_required" | "organization_required" | "organization_membership_recovery_required" | "organization_selection_required" | "organization_access_blocked" | "product_activation_required" | "product_access_required" | "product_selection_required" | "ready";
}

export interface LandingProduct {
  entitlement_state: "active" | "inactive" | "blocked";
  member_access: "granted" | "not_granted";
  onboarding_state: "pending" | "complete";
  plan_code?: string;
  /** CS-01:48·109 — FE 가 trial_state·잔량을 재조합해 접근을 열지 않도록 서버가 단일 boolean 으로 판정을 소유한다. */
  product_access_allowed: boolean;
  product_id: "TRADE_OS" | "SNAP";
  subscription_state: "none" | "paid_active" | "paid_inactive";
  /** Server-derived OWNER CTA signal. Omitted when no valid operational threshold is configured or the trial is not eligible/reached. */
  trial_emphasis?: "subscribe";
  trial_ends_at?: string;
  /** DEC-TRIAL-001 — 시작 전 카드가 표시할 서버 Offer 운영값(CS-09 표시값 소유)과 활성 trial 의 종료 시각(체험 중 잔여 표시). 이용량 "잔여"는 차감 원장(products#256)이 없는 동안 제공량과 같다. */
  trial_offer?: LandingTrialOfferView;
  /** CF-01: `trial active + 무료 이용량 available`만 접근 가능한 trial 이다. 이름·값은 CS-01 §제품 상태 projection(trial_quota_state)을 따른다. */
  trial_quota_state: "available" | "exhausted" | "not_applicable" | "unknown";
  trial_state: "not_started" | "active" | "expired";
}

export interface LandingTrialOfferView {
  allowance_count: number;
  /** CS-09:42 — {product_trial_allowance_label} 은 서버 Offer 표시값이고 CF-06:43 이 단위 소유권을 제품 크레딧 정책에 둔다. 서버는 로케일 문자열 이 아니라 단위 코드를 내리고 FE i18n 이 로케일 렌더를 맡는다(#1653). SNAP 02-BUSINESS-MODEL.md:91 "Customer report credits" · Trade OS 02-BUSINESS-MODEL.md:26 "1 ERP 크레딧". */
  allowance_unit?: "erp_credits" | "customer_report_credits";
  duration_days: number;
}

export interface MeAccountView {
  account_id?: string;
  email_verified?: boolean;
}

export interface MeCurrentWorkspaceResponse {
  org_id?: string;
  role?: string;
  workspace?: MeWorkspaceView;
}

export interface MeMeResponse {
  /** Canonical Account → Organization → Product landing contract. */
  account: MeAccountView;
  capabilities: LandingCapabilities;
  current_organization_id?: string;
  email?: string;
  firebase_uid?: string;
  is_platform_admin?: boolean;
  landing: LandingDecision;
  onboarding_state?: string;
  org_id?: string;
  organizations: Array<MeOrganizationView>;
  platform_operator_capabilities?: Array<string>;
  platform_operator_role?: string;
  products: Array<LandingProduct>;
  role?: string;
  /** Nested workspace-aware view. */
  user?: MeUserView;
  /** Flat compatibility view. */
  user_id?: string;
  workspace?: MeWorkspaceView;
  workspaces?: Array<MeWorkspaceView>;
}

export interface MeOrganizationMembershipView {
  role: "OWNER" | "ADMIN" | "MEMBER";
  status: "active";
}

export interface MeOrganizationView {
  lifecycle_state: string;
  membership: MeOrganizationMembershipView;
  name?: string;
  organization_id?: string;
  slug?: string;
}

export interface MeUserView {
  email?: string;
  firebase_uid?: string;
  id?: string;
}

export interface MeWorkspaceView {
  id?: string;
  lifecycle_status?: string;
  name?: string;
  products: Array<"ERP" | "SNAP" | "Intelligence">;
  role?: string;
  slug?: string;
}

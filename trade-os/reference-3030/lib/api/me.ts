import { ApiError, apiRequest } from "./client";
import type {
  LandingCapabilities as LandingCapabilitiesWire,
  LandingDecision as LandingDecisionWire,
  LandingProduct as LandingProductWire,
  MeCurrentWorkspaceResponse,
  MeMeResponse as MeWireResponse,
  MeOrganizationView as OrganizationViewWire,
  MeWorkspaceView,
} from "./generated/me";

// `/me` gates every authenticated surface. A hung dependency must surface as
// a retryable error instead of leaving the shell in an endless loading state.
export const ME_REQUEST_TIMEOUT_MS = 15_000;

const PLATFORM_OPERATOR_ROLES = [
  "platform_owner",
  "platform_admin",
  "support",
  "billing",
  "security",
  "incident_manager",
  "readonly",
] as const;

const LANDING_STATES = [
  "signup_resume_required",
  "invite_accept_required",
  "organization_required",
  "organization_membership_recovery_required",
  "organization_selection_required",
  "organization_access_blocked",
  // CS-01 §landing 우선순위 표의 10개 닫힌 집합 — 미시작도 activation_required
  // 이며(rank 7), onboarding 은 landing gate 가 아니다(DEC-QUICKSTART-001).
  "product_activation_required",
  "product_access_required",
  "product_selection_required",
  "ready",
] as const;

const PRODUCT_IDS = ["TRADE_OS", "SNAP"] as const;
const SUBSCRIPTION_STATES = ["none", "paid_active", "paid_inactive"] as const;
const TRIAL_STATES = ["not_started", "active", "expired"] as const;
const TRIAL_QUOTA_STATES = ["available", "exhausted", "not_applicable", "unknown"] as const;
const TRIAL_EMPHASIS = ["subscribe"] as const;
const ENTITLEMENT_STATES = ["active", "inactive", "blocked"] as const;
const MEMBER_ACCESS_STATES = ["granted", "not_granted"] as const;
const PRODUCT_ONBOARDING_STATES = ["pending", "complete"] as const;
const ORGANIZATION_ROLES = ["OWNER", "ADMIN", "MEMBER"] as const;

export type PlatformOperatorRole = (typeof PLATFORM_OPERATOR_ROLES)[number];
export type LandingState = (typeof LANDING_STATES)[number];
export type ProductId = (typeof PRODUCT_IDS)[number];
export type OrganizationRole = (typeof ORGANIZATION_ROLES)[number];
// 폐기된 `operator`는 조직 역할이 아니다(10-login-and-session §5) — BE roles.go도 3역할만 발급한다.
export type WorkspaceRole = "owner" | "admin" | "member";
export type OnboardingState = "ready" | "needs_workspace" | "membership_recovery_required";

/** Server-projected operator actions used for fail-closed route entry. */
export type PlatformOperatorCapability =
  | "tenant.read"
  | "tenant.lifecycle"
  | "tenant.legal_hold"
  | "tenant.terminate"
  | "support.read"
  | "support.write"
  | "support.elevated_access"
  | "billing.read"
  | "billing.write"
  | "usage.read"
  | "incident.read"
  | "incident.write"
  | "incident.resolve"
  | "privacy.export"
  | "privacy.erase"
  | "ops.high_risk.request"
  | "ops.high_risk.approve"
  | "audit.read"
  | "ops.aggregate.read"
  | "ai_worker.read"
  | "ai_worker.write"
  | "failed_job.read"
  | "failed_job.retry"
  | "operator_role.read"
  | "operator_role.write"
  | "share.read"
  | "share.revoke"
  | "entitlement.write"
  | "ops.support.read_sensitive"
  | "ops.ai_approval.read_all_orgs"
  | "ops.ai_approval.decide"
  | "ops.ai_approval.decide_high_risk"
  | "ops.break_glass.activate";

export type LandingDecision = Readonly<LandingDecisionWire>;
export type LandingProduct = Readonly<LandingProductWire>;
export type LandingCapabilities = Readonly<Required<LandingCapabilitiesWire>>;
export type OrganizationView = Readonly<
  Omit<OrganizationViewWire, "organization_id"> & { readonly organization_id: string }
>;

export type UserView = {
  readonly id?: string;
  readonly email?: string;
  readonly firebase_uid?: string;
};

export type WorkspaceProduct = MeWorkspaceView["products"][number];
export type WorkspaceView = Readonly<Omit<MeWorkspaceView, "products">> & {
  readonly products: readonly WorkspaceProduct[];
};

export type CurrentWorkspaceResponse = Readonly<
  Required<Omit<MeCurrentWorkspaceResponse, "workspace">>
> & {
  readonly workspace: WorkspaceView;
};

// Canonical fields stay optional at this compatibility type boundary because
// hundreds of product-level fixtures construct MeResponse directly. Live
// responses never rely on that looseness: normalizePlatformIdentity validates
// every canonical field before returning.
type MeProjection = {
  readonly user_id: string;
  readonly email?: string;
  readonly firebase_uid?: string;
  readonly is_platform_admin?: boolean;
  readonly onboarding_state?: OnboardingState;
  readonly platform_operator_capabilities?: readonly PlatformOperatorCapability[];
  readonly platform_operator_role?: PlatformOperatorRole | null;
  readonly user?: UserView | null;
  readonly workspace?: WorkspaceView | null;
  readonly workspaces?: readonly WorkspaceView[];
  readonly account?: Readonly<{ account_id: string; email_verified: boolean }>;
  readonly organizations?: readonly OrganizationView[];
  readonly current_organization_id?: string;
  readonly products?: readonly LandingProduct[];
  readonly landing?: LandingDecision;
  readonly capabilities?: LandingCapabilities;
};

export type MeResponse<HasOrganization extends boolean = true> = MeProjection &
  (HasOrganization extends true
    ? { readonly org_id: string; readonly role: string }
    : { readonly org_id?: string; readonly role?: string });

export type MappedPlatformSession = MeResponse<true> & {
  readonly state: "mapped";
  readonly org_id: string;
  readonly role: WorkspaceRole;
  readonly user_id: string;
};

export type NeedsWorkspacePlatformSession = MeResponse<false> & {
  readonly state: "needs_workspace";
  readonly onboarding_state: "needs_workspace";
};

export type MembershipRecoveryRequiredPlatformSession = MeResponse<false> & {
  readonly state: "membership_recovery_required";
  readonly onboarding_state: "membership_recovery_required";
};

/** Valid canonical landing that intentionally has no selected Organization. */
export type LandingPlatformSession = MeResponse<false> & {
  readonly state: "landing";
};

/** Retained as a source-compatible legacy union member; live v2 parsing throws 502 instead. */
export type DeniedPlatformSession = MeResponse<false> & {
  readonly state: "denied";
  readonly reason: "invalid_identity";
};

/** Retained as a source-compatible legacy union member; live v2 parsing throws 502 instead. */
export type UnsupportedPlatformSession = MeResponse<false> & {
  readonly state: "unsupported";
  readonly reason: "unsupported_role";
};

export type PlatformIdentityResponse =
  | MappedPlatformSession
  | NeedsWorkspacePlatformSession
  | MembershipRecoveryRequiredPlatformSession
  | LandingPlatformSession
  | DeniedPlatformSession
  | UnsupportedPlatformSession;

export type PlatformIdentityRequest = {
  readonly next?: string | null;
  readonly productId?: ProductId | null;
};

export function isPlatformOperatorRole(value: unknown): value is PlatformOperatorRole {
  return PLATFORM_OPERATOR_ROLES.some((role) => role === value);
}

function isOneOf<const Values extends readonly string[]>(
  value: unknown,
  values: Values,
): value is Values[number] {
  return typeof value === "string" && values.some((candidate) => candidate === value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function projectionInvalid(message: string): never {
  throw new ApiError({
    status: 502,
    code: "LANDING_PROJECTION_INVALID",
    message,
  });
}

function isWorkspaceRole(role: string): role is WorkspaceRole {
  // §5: 폐기된 `operator` 는 조직 역할로 판정하지 않는다.
  return role === "owner" || role === "admin" || role === "member";
}

export function isMappedPlatformSession(
  identity: PlatformIdentityResponse,
): identity is MappedPlatformSession {
  return identity.state === "mapped";
}

export function hasServerOwnedLanding(
  identity: PlatformIdentityResponse,
): identity is PlatformIdentityResponse & {
  readonly account: Readonly<{ account_id: string; email_verified: boolean }>;
  readonly organizations: readonly OrganizationView[];
  readonly products: readonly LandingProduct[];
  readonly landing: LandingDecision;
  readonly capabilities: LandingCapabilities;
} {
  return Boolean(
    identity.account &&
      identity.organizations &&
      identity.products &&
      identity.landing &&
      identity.capabilities,
  );
}

export function requireServerOwnedLanding(identity: PlatformIdentityResponse): LandingDecision {
  if (!hasServerOwnedLanding(identity)) {
    return projectionInvalid("The /me response is missing the server-owned landing contract");
  }
  return identity.landing;
}

/**
 * CS-09 §만료·무료 이용량 소진 잠금 variant — 서버가 잠금 landing 에 제품
 * 기본 경로를 실었을 때만 제품 shell + 잠금 overlay 로 소비한다. /start 를
 * 실은 잠금(미시작·구독 비활성·집계 판정)은 기존 /start 패널 소비 그대로다.
 * 판정 스위치는 전적으로 서버가 보낸 (state, product_id, path) 조합이다 —
 * FE 는 trial 축을 재조합해 이 표면을 열지 않는다(CS-01:109).
 */
export function productLockLanding(
  identity: PlatformIdentityResponse,
): { productId: ProductId; landing: LandingDecision } | null {
  if (!hasServerOwnedLanding(identity)) return null;
  const landing = identity.landing;
  if (
    landing.state !== "product_activation_required" ||
    !isOneOf(landing.product_id, PRODUCT_IDS) ||
    landing.path !== PRODUCT_DEFAULT_PATHS[landing.product_id]
  ) {
    return null;
  }
  return { productId: landing.product_id, landing };
}

/** Same-origin path guard for both request `next` and server destinations. */
export function isSafePlatformPath(raw: string): boolean {
  if (
    !raw.startsWith("/") ||
    raw.startsWith("//") ||
    raw.includes("\\") ||
    raw.includes("#") ||
    /[\u0000-\u001F\u007F]/.test(raw)
  ) {
    return false;
  }
  try {
    const decodedRawPath = decodeURIComponent(raw.split("?")[0]);
    if (
      decodedRawPath.includes("\\") ||
      decodedRawPath.split("/").some((segment) => segment === "." || segment === "..")
    ) {
      return false;
    }
    const url = new URL(raw, "https://ecoya.invalid");
    if (url.origin !== "https://ecoya.invalid") return false;
    const decodedPath = decodeURIComponent(url.pathname);
    if (
      decodedPath.includes("\\") ||
      decodedPath.split("/").some((segment) => segment === "." || segment === "..")
    ) {
      return false;
    }
    for (const key of url.searchParams.keys()) {
      if (credentialShapedQueryKey(key)) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

// BE landing.credentialShapedQueryKey 와 동일 규칙 — 정확일치 열거는 access_token
// 류 접미 변종을 못 닫는다(보안 리뷰 N1). code·auth 는 정확 일치로만 걸러 무역
// 도메인 키(hs_code·country_code·author 등)의 제품 의도를 보존한다.
const CREDENTIAL_KEY_EXACT = new Set(["code", "auth", "authorization"]);
const CREDENTIAL_KEY_MARKERS = [
  "token", "secret", "grant", "session", "jwt", "password", "passwd", "otp",
  "auth_", "apikey", "api_key", "credential", "bearer",
] as const;

function credentialShapedQueryKey(key: string): boolean {
  const lowered = key.toLowerCase();
  if (CREDENTIAL_KEY_EXACT.has(lowered)) return true;
  return CREDENTIAL_KEY_MARKERS.some((marker) => lowered.includes(marker));
}

function productPathMatches(path: string, productId: ProductId): boolean {
  const pathname = path.split("?")[0].replace(/\/+$/, "");
  const root = productId === "TRADE_OS" ? "/erp" : "/snap";
  return pathname === root || pathname.startsWith(`${root}/`);
}

/**
 * 요청 경로가 그 제품의 접두(`/erp`·`/snap`) 아래인가. 잠금 landing 을 소비하는
 * 게이트가 "제품 shell은 유지하되 업무 데이터 대신 잠금 overlay를 표시한다"
 * (CS-09-product-access.md:68) 를 shell 루트 하나가 아니라 접두 **전체**에
 * 적용하기 위한 술어다.
 *
 * 접두는 잠금 overlay 보다 넓다: `(shell)`·`(product)` 그룹은 overlay 가 덮지만
 * (app) 직속 leaf 5개(`pending`·`join-pending`·`signup-rejected`·`app-guide`·
 * `link-guide`)는 덮지 않는다. 그 5개가 안전한 근거는 overlay 가 아니라
 * route-tree 가드(`src/app/snap/(app)/route-tree.test.ts`)다 — 그 세그먼트들을
 * page 하나짜리 leaf 로 고정해 제품 데이터 표면이 자라지 못하게 막고, 분류
 * 자체가 "잠그지 않는다"(멤버십·승인 상태 표면 / SC-45 역할 안내)이다.
 *
 * 범위는 잠긴 제품 자신의 접두로 한정된다:
 * "다른 Organization·활성 제품·Account·Common 설정은 잠그지 않는다"
 * (CS-09-product-access.md:78) 는 이 술어 밖이라 서버 landing 으로 이동한다.
 */
export function isWithinProductShell(path: string, productId: ProductId): boolean {
  return isSafePlatformPath(path) && productPathMatches(path, productId);
}

// BE internal/service/landing.productDefaultPath 의 거울 — 잠금 landing 이
// 실을 수 있는 유일한 제품 경로다(CS-09 §만료·무료 이용량 소진 잠금 variant).
export const PRODUCT_DEFAULT_PATHS = Object.freeze({
  TRADE_OS: "/erp/home",
  SNAP: "/snap/home",
} as const) satisfies Record<ProductId, string>;

export const PRODUCT_ROOT_PATHS = Object.freeze({
  TRADE_OS: "/erp",
  SNAP: "/snap",
} as const) satisfies Record<ProductId, string>;

export const COMMON_START_PATH = "/start";

export function pathnameOf(path: string): string {
  return path.split("?")[0].replace(/\/+$/, "") || "/";
}

function decodedPathnameOf(path: string): string {
  try {
    return pathnameOf(decodeURIComponent(path.split("?")[0]));
  } catch {
    return pathnameOf(path);
  }
}

// 제품 경로만 의도로 실린다 — 서버 productIDFromPath 가 해석하는 접두와 동일.
const PRODUCT_PATH_PATTERN = /^\/(erp|snap)(\/|$)/;

export function isProductPath(path: string): boolean {
  return PRODUCT_PATH_PATTERN.test(decodedPathnameOf(path));
}

/**
 * 02-COMMON-IA:49 — 제품 진입 경로가 명확하면 그 제품의 접근 상태를 바로
 * 판정하고 제품을 다시 선택하게 하지 않는다. 서버가 제품 요청을 공통 `/start`
 * 로 보낼 때 요청 경로를 `next` 로 실어, `/start` 의 재판정이 같은 제품 의도로
 * 이뤄지게 한다. 의도 없이 `/start` 를 재판정하면 집계 landing 이 활성(또는
 * 마지막 사용) 제품으로 되튕겨 CS-09 제품별 시작·잠금 variant 에 도달하지
 * 못한다(Product 선택기 실브라우저 실측). 게이트와 선택기가 같은 함수를 쓴다.
 * 목적지 자체는 여전히 서버 소유 path 다.
 */
export function productIntentDestination(
  requestedPath: string,
  landing: { readonly path: string; readonly product_id?: string | null },
): string {
  // 호출부의 sanitize 관례에 기대지 않는다 — 자격 키 쿼리 등 unsafe 요청 경로는
  // 의도로 실리지 않는다(라운드 2 보안 NIT-2, credentialShapedQueryKey 와 같은 축).
  if (
    !landing.product_id ||
    pathnameOf(landing.path) !== COMMON_START_PATH ||
    !isSafePlatformPath(requestedPath) ||
    !isProductPath(requestedPath)
  ) {
    return landing.path;
  }
  const separator = landing.path.includes("?") ? "&" : "?";
  return `${landing.path}${separator}next=${encodeURIComponent(requestedPath)}`;
}

// BE landing.nonRestorableProductPaths 의 거울 — 제품 접두 아래 있지만 "마지막
// 사용 경로" 로 기록·복원하지 않는 표면: 시작 가이드(CS-01:133 "자동 /onboarding
// redirect 금지", IA:125·127), SNAP 게이트 흐름 상태, 운영자 콘솔(`/erp/ops` —
// 제품 셸이 아니라 운영자 표면, 실브라우저 QA 에서 일반 owner 기록 적발),
// SNAP 공개 표면(`src/app/snap/(public)` 그룹 — 로그인·가입·초대·공유 뷰 등).
export const NON_RESTORABLE_PRODUCT_PATHS: readonly string[] = Object.freeze([
  "/erp/onboarding",
  "/erp/ops",
  "/snap/onboarding",
  "/snap/join-pending",
  "/snap/pending",
  "/snap/signup-rejected",
  "/snap/invite",
  "/snap/legal",
  "/snap/login",
  "/snap/pricing",
  "/snap/signup",
  "/snap/upload",
  "/snap/verify",
  "/snap/view",
  "/snap/work",
]);

export function isNonRestorableProductPath(path: string): boolean {
  // 서버 규칙은 디코딩된 pathname 을 본다 — 거울도 같게(정본 리뷰 N6).
  const pathname = decodedPathnameOf(path);
  return NON_RESTORABLE_PRODUCT_PATHS.some(
    (excluded) => pathname === excluded || pathname.startsWith(`${excluded}/`),
  );
}

/**
 * 02-COMMON-IA:42 "안전하게 복원할 수 있는" 경로의 클라이언트 거울 — 서버
 * RestorableProductPath 와 같은 규칙(allowlist·제품 접두·루트 제외·일시 경로
 * 제외). 리코더가 보낼 가치가 없는 경로를 거르는 용도이며, 판정은 서버가 한다.
 */
export function isRestorableProductPath(path: string, productId: ProductId): boolean {
  if (!isSafePlatformPath(path) || !productPathMatches(path, productId)) return false;
  if (decodedPathnameOf(path) === PRODUCT_ROOT_PATHS[productId]) return false;
  return !isNonRestorableProductPath(path);
}

function validateLandingPath(landing: LandingDecision): void {
  if (!isSafePlatformPath(landing.path)) {
    projectionInvalid("The server-owned landing path is unsafe");
  }
  const exactPaths: Partial<Record<LandingState, string>> = {
    signup_resume_required: "/signup",
    invite_accept_required: "/invite/accept",
    organization_required: "/organization/new",
    organization_membership_recovery_required: "/organization/recovery",
    organization_selection_required: "/organization/select",
    organization_access_blocked: "/start",
    product_access_required: "/start",
    product_selection_required: "/start",
  };
  const exact = exactPaths[landing.state];
  if (exact && landing.path !== exact) {
    projectionInvalid(`Landing state ${landing.state} returned an unexpected path`);
  }
  if (landing.state === "product_activation_required") {
    // CS-09: 만료·소진 잠금은 제품 shell 위 overlay 라 서버가 제품 기본
    // 경로를 실을 수 있다. 미시작·구독 비활성·집계 판정은 /start 그대로다.
    // 제품 경로는 product_id 가 동반된 정확한 기본 경로만 허용한다 — 임의
    // 하위 경로를 열면 서버 판정 없이 잠금 표면이 넓어진다.
    const lockSurfacePath = isOneOf(landing.product_id, PRODUCT_IDS)
      ? PRODUCT_DEFAULT_PATHS[landing.product_id]
      : null;
    if (landing.path !== "/start" && landing.path !== lockSurfacePath) {
      projectionInvalid("Landing state product_activation_required returned an unexpected path");
    }
  }
  if (landing.state === "ready") {
    const operatorPath = /^\/erp\/ops(?:\/|$)/.test(landing.path.split("?")[0]);
    if (
      (!landing.product_id && !operatorPath) ||
      (isOneOf(landing.product_id, PRODUCT_IDS) &&
        !productPathMatches(landing.path, landing.product_id))
    ) {
      projectionInvalid("Ready landing must point to the authorized product route");
    }
  }
}

function parseAccount(value: unknown, userId: string) {
  if (!isRecord(value) || !nonEmptyString(value.account_id) || typeof value.email_verified !== "boolean") {
    return projectionInvalid("The /me account projection is malformed");
  }
  const accountId = value.account_id.trim();
  if (accountId !== userId) {
    return projectionInvalid("The /me account_id does not match user_id");
  }
  return { account_id: accountId, email_verified: value.email_verified } as const;
}

function parseOrganizations(value: unknown): OrganizationView[] {
  if (!Array.isArray(value)) {
    return projectionInvalid("The /me organizations projection is not an array");
  }
  const ids = new Set<string>();
  return value.map((candidate) => {
    if (
      !isRecord(candidate) ||
      !nonEmptyString(candidate.organization_id) ||
      !nonEmptyString(candidate.lifecycle_state) ||
      !isRecord(candidate.membership) ||
      candidate.membership.status !== "active" ||
      !isOneOf(candidate.membership.role, ORGANIZATION_ROLES)
    ) {
      return projectionInvalid("An Organization projection is malformed");
    }
    const organizationId = candidate.organization_id.trim();
    if (ids.has(organizationId)) {
      return projectionInvalid("The /me organizations projection contains a duplicate id");
    }
    ids.add(organizationId);
    return {
      ...candidate,
      organization_id: organizationId,
      lifecycle_state: candidate.lifecycle_state.trim(),
      membership: {
        status: "active" as const,
        role: candidate.membership.role,
      },
    } as OrganizationView;
  });
}

function validTrialOffer(value: unknown): boolean {
  if (value === undefined) return true;
  return (
    isRecord(value) &&
    typeof value.duration_days === "number" &&
    Number.isInteger(value.duration_days) &&
    value.duration_days > 0 &&
    typeof value.allowance_count === "number" &&
    Number.isInteger(value.allowance_count) &&
    value.allowance_count >= 0 &&
    // CS-09:42 단위 코드(제품 크레딧 정책 소유) — 표시 축이라 미지 코드로
    // /me 를 끊지 않는다: 형태(string)만 검증하고 렌더가 known 코드만
    // 매핑, 그 외는 중립 표현 폴백(BE#1653).
    (value.allowance_unit === undefined || typeof value.allowance_unit === "string")
  );
}

function parseProducts(value: unknown): LandingProduct[] {
  if (!Array.isArray(value)) {
    return projectionInvalid("The /me products projection is not an array");
  }
  const ids = new Set<ProductId>();
  return value.map((candidate) => {
    if (
      !isRecord(candidate) ||
      !isOneOf(candidate.product_id, PRODUCT_IDS) ||
      !isOneOf(candidate.subscription_state, SUBSCRIPTION_STATES) ||
      !isOneOf(candidate.trial_state, TRIAL_STATES) ||
      // CS-01:48·109 — 접근 판정을 소유한 required 필드다. 빠지면 FE 가 축을
      // 재조합하게 되므로 projection 위반으로 거절한다(보안 리뷰 B2).
      !isOneOf(candidate.trial_quota_state, TRIAL_QUOTA_STATES) ||
      typeof candidate.product_access_allowed !== "boolean" ||
      !isOneOf(candidate.entitlement_state, ENTITLEMENT_STATES) ||
      !isOneOf(candidate.member_access, MEMBER_ACCESS_STATES) ||
      !isOneOf(candidate.onboarding_state, PRODUCT_ONBOARDING_STATES) ||
      (candidate.plan_code !== undefined && typeof candidate.plan_code !== "string") ||
      (candidate.trial_emphasis !== undefined &&
        !isOneOf(candidate.trial_emphasis, TRIAL_EMPHASIS)) ||
      // DEC-TRIAL-001 additive 표시값 — 있으면 형태를 엄격히 검증한다. 시작
      // 카드·잔여 배지가 이 값을 그대로 그리므로 손상 값은 502 로 끊는다.
      !validTrialOffer(candidate.trial_offer) ||
      (candidate.trial_ends_at !== undefined &&
        (typeof candidate.trial_ends_at !== "string" ||
          Number.isNaN(Date.parse(candidate.trial_ends_at))))
    ) {
      return projectionInvalid("A Product landing projection is malformed");
    }
    if (ids.has(candidate.product_id)) {
      return projectionInvalid("The /me products projection contains a duplicate product");
    }
    ids.add(candidate.product_id);
    return candidate as LandingProduct;
  });
}

function parseCapabilities(value: unknown): LandingCapabilities {
  if (
    !isRecord(value) ||
    typeof value.can_create_organization !== "boolean" ||
    typeof value.can_manage_billing !== "boolean" ||
    typeof value.can_manage_products !== "boolean"
  ) {
    return projectionInvalid("The /me capabilities projection is malformed");
  }
  return {
    can_create_organization: value.can_create_organization,
    can_manage_billing: value.can_manage_billing,
    can_manage_products: value.can_manage_products,
  };
}

function parseLanding(value: unknown): LandingDecision {
  if (
    !isRecord(value) ||
    !isOneOf(value.state, LANDING_STATES) ||
    !nonEmptyString(value.path) ||
    !nonEmptyString(value.reason_code) ||
    !Array.isArray(value.allowed_actions) ||
    value.allowed_actions.some((action) => !nonEmptyString(action)) ||
    (value.organization_id !== undefined && !nonEmptyString(value.organization_id)) ||
    (value.product_id !== undefined && !isOneOf(value.product_id, PRODUCT_IDS))
  ) {
    return projectionInvalid("The /me landing decision is malformed");
  }
  const landing: LandingDecision = {
    allowed_actions: value.allowed_actions.map((action) => String(action).trim()),
    path: value.path,
    reason_code: value.reason_code.trim(),
    state: value.state,
    ...(value.organization_id ? { organization_id: value.organization_id.trim() } : {}),
    ...(value.product_id ? { product_id: value.product_id } : {}),
  };
  validateLandingPath(landing);
  return landing;
}

function canonicalRoleToWorkspaceRole(role: OrganizationRole): WorkspaceRole {
  return role.toLowerCase() as WorkspaceRole;
}

export function normalizePlatformIdentity(identity: unknown): PlatformIdentityResponse {
  if (!isRecord(identity) || !nonEmptyString(identity.user_id)) {
    return projectionInvalid("The /me response is missing user_id");
  }
  const userId = identity.user_id.trim();
  const account = parseAccount(identity.account, userId);
  const organizations = parseOrganizations(identity.organizations);
  const products = parseProducts(identity.products);
  const capabilities = parseCapabilities(identity.capabilities);
  const landing = parseLanding(identity.landing);

  const currentOrganizationId =
    identity.current_organization_id === undefined
      ? undefined
      : nonEmptyString(identity.current_organization_id)
        ? identity.current_organization_id.trim()
        : projectionInvalid("current_organization_id is blank");
  const currentOrganization = currentOrganizationId
    ? organizations.find((organization) => organization.organization_id === currentOrganizationId)
    : undefined;
  if (currentOrganizationId && !currentOrganization) {
    return projectionInvalid("current_organization_id is not an active Membership");
  }
  if (landing.organization_id && landing.organization_id !== currentOrganizationId) {
    return projectionInvalid("landing.organization_id does not match the selected Organization");
  }
  if (landing.product_id) {
    const landingProduct = products.find(
      (product) => product.product_id === landing.product_id,
    );
    if (!landingProduct) {
      return projectionInvalid("landing.product_id is absent from the Product projection");
    }
    // CS-01:109 — ready 는 요청 제품의 product_access_allowed=true 일 때만 제품
    // route 를 연다. 서버 자신이 모순된 projection(ready + false)을 보내면 FE 가
    // 열어주지 않고 fail-closed 한다(정본 리뷰 B1).
    if (landing.state === "ready" && !landingProduct.product_access_allowed) {
      return projectionInvalid("Ready landing contradicts product_access_allowed");
    }
  }
  if (identity.org_id !== undefined) {
    if (!nonEmptyString(identity.org_id) || identity.org_id.trim() !== currentOrganizationId) {
      return projectionInvalid("Legacy org_id disagrees with current_organization_id");
    }
  }

  const role = currentOrganization
    ? canonicalRoleToWorkspaceRole(currentOrganization.membership.role)
    : undefined;
  if (identity.role !== undefined && (!nonEmptyString(identity.role) || identity.role.trim() !== role)) {
    return projectionInvalid("Legacy role disagrees with Organization Membership");
  }
  const operatorRole = identity.platform_operator_role;
  if (operatorRole !== undefined && operatorRole !== null && !isPlatformOperatorRole(operatorRole)) {
    return projectionInvalid("platform_operator_role is unknown");
  }
  if (
    identity.platform_operator_capabilities !== undefined &&
    (!Array.isArray(identity.platform_operator_capabilities) ||
      identity.platform_operator_capabilities.some((capability) => !nonEmptyString(capability)))
  ) {
    return projectionInvalid("platform_operator_capabilities is malformed");
  }

  const normalized = {
    ...(identity as unknown as MeWireResponse),
    account,
    capabilities,
    current_organization_id: currentOrganizationId,
    landing,
    organizations,
    products,
    user_id: userId,
    ...(currentOrganizationId ? { org_id: currentOrganizationId } : {}),
    ...(role ? { role } : {}),
  } as unknown as MeResponse<false>;

  switch (landing.state) {
    case "organization_required":
      return {
        ...normalized,
        onboarding_state: "needs_workspace",
        state: "needs_workspace",
      };
    case "organization_membership_recovery_required":
      return {
        ...normalized,
        onboarding_state: "membership_recovery_required",
        state: "membership_recovery_required",
      };
    default:
      if (currentOrganizationId && role && isWorkspaceRole(role)) {
        return {
          ...normalized,
          org_id: currentOrganizationId,
          role,
          state: "mapped",
          user_id: userId,
        };
      }
      return { ...normalized, state: "landing" };
  }
}

function buildIdentityPath(base: string, request: PlatformIdentityRequest): string {
  const search = new URLSearchParams();
  if (request.next && isSafePlatformPath(request.next)) {
    search.set("next", request.next);
  }
  if (request.productId && isOneOf(request.productId, PRODUCT_IDS)) {
    search.set("product_id", request.productId);
  }
  const query = search.toString();
  return query ? `${base}?${query}` : base;
}

export async function getPlatformIdentity(
  getIdToken: () => Promise<string>,
  request: PlatformIdentityRequest = {},
): Promise<PlatformIdentityResponse> {
  const isBrowser = typeof window !== "undefined";
  const identity = await apiRequest<unknown>(
    buildIdentityPath(isBrowser ? "/api/platform/me" : "/api/v1/me", request),
    {
      baseUrl: isBrowser ? "" : undefined,
      getIdToken,
      timeoutMs: ME_REQUEST_TIMEOUT_MS,
    },
  );
  return normalizePlatformIdentity(identity);
}

/** Wire result of POST /me/products/{id}/trial (server-owned start). */
export type StartProductTrialResult = {
  readonly product_id: ProductId;
  readonly trial_ends_at: string;
  readonly started: boolean;
  readonly trial_offer: { readonly duration_days: number; readonly allowance_count: number };
};

/**
 * COMMON:DEC-TRIAL-001 — 활성 OWNER 의 무료체험 시작. 멱등(started=false 는
 * 재지급 없는 재시도)이며 판정은 전부 서버 소유다. 손상 응답은 502 로 끊는다.
 */
export async function startProductTrial(
  productId: ProductId,
  getIdToken: () => Promise<string>,
): Promise<StartProductTrialResult> {
  const value = await apiRequest<unknown>(
    `/api/platform/me/products/${productId}/trial`,
    { baseUrl: "", getIdToken, init: { method: "POST" } },
  );
  if (
    !isRecord(value) ||
    !isOneOf(value.product_id, PRODUCT_IDS) ||
    value.trial_state !== "active" ||
    typeof value.trial_ends_at !== "string" ||
    Number.isNaN(Date.parse(value.trial_ends_at)) ||
    typeof value.started !== "boolean" ||
    !validTrialOffer(value.trial_offer) ||
    value.trial_offer === undefined
  ) {
    return projectionInvalid("The trial start response is malformed");
  }
  const offer = value.trial_offer as { duration_days: number; allowance_count: number };
  return {
    product_id: value.product_id,
    trial_ends_at: value.trial_ends_at,
    started: value.started,
    trial_offer: { allowance_count: offer.allowance_count, duration_days: offer.duration_days },
  };
}

/**
 * 02-COMMON-IA:42·51 — 서버가 승인한 "마지막 사용 제품·경로" 기록. 판정(현재
 * identity 로 그 제품·경로가 ready 로 열리는가)은 전부 서버 소유이고, 실패는
 * 선호 기록 실패일 뿐 접근과 무관하다(호출자가 무시한다). keepalive 로 페이지
 * 이탈 직전 전송도 살린다.
 */
export async function recordProductRoute(
  productId: ProductId,
  path: string,
  organizationId: string,
  getIdToken: () => Promise<string>,
): Promise<void> {
  await apiRequest<null>(`/api/platform/me/products/${productId}/route`, {
    baseUrl: "",
    getIdToken,
    init: {
      body: JSON.stringify({ organization_id: organizationId, path }),
      keepalive: true,
      method: "PUT",
    },
  });
}

/** Persist the caller's current Organization through the legacy dual-read endpoint. */
export async function selectCurrentWorkspace(
  workspaceId: string,
  getIdToken: () => Promise<string>,
): Promise<CurrentWorkspaceResponse> {
  const normalizedWorkspaceId = workspaceId.trim();
  if (!normalizedWorkspaceId) {
    throw new ApiError({
      status: 400,
      code: "API_INVALID_WORKSPACE_ID",
      message: "workspace_id is required",
    });
  }

  const isBrowser = typeof window !== "undefined";
  return apiRequest<CurrentWorkspaceResponse>(
    isBrowser ? "/api/platform/me/workspace" : "/api/v1/me/workspace",
    {
      baseUrl: isBrowser ? "" : undefined,
      getIdToken,
      init: {
        body: JSON.stringify({ workspace_id: normalizedWorkspaceId }),
        method: "PATCH",
      },
      timeoutMs: ME_REQUEST_TIMEOUT_MS,
    },
  );
}

export async function getMe(getIdToken: () => Promise<string>): Promise<MeResponse> {
  const identity = await getPlatformIdentity(getIdToken);
  if (identity.state === "mapped") return identity;

  const codeByState = {
    needs_workspace: "AUTH_USER_HAS_NO_ORG",
    membership_recovery_required: "MEMBERSHIP_RECOVERY_REQUIRED",
    landing: "AUTH_MAPPING_INCOMPLETE",
    denied: "LANDING_PROJECTION_INVALID",
    unsupported: "LANDING_PROJECTION_INVALID",
  } as const;
  throw new ApiError({
    code: codeByState[identity.state],
    message: "Platform identity has no selected Organization",
    status: identity.state === "membership_recovery_required" ? 409 : 403,
  });
}

import { ApiError, apiRequest, DEFAULT_PLATFORM_API_BASE_URL } from "./client";
import { isUuidLike } from "./erpExtraction";

// Org member read surface — GET /admin/members. The backend guarantees a
// status for every member; selection UIs must use it to exclude inactive
// memberships while historical references can still be labelled.
export type OrgMemberResponse = {
  display_name?: string;
  org_id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
};

export type OrgMemberListResponse = {
  items: OrgMemberResponse[];
};

// GET /admin/users. Backend #209 adds display_name; labels fall back to email
// and then user_id for stale or partial responses.
export type OrgUserResponse = {
  display_name?: string;
  id: string;
  email: string;
  role: string;
  default_org_id?: string;
  created_at: string;
  updated_at: string;
};

export type OrgUserListResponse = {
  items: OrgUserResponse[];
};

export type MemberAssignableRole = "admin" | "member";

export type ChangeMemberRoleBody = {
  role: MemberAssignableRole;
};

export type RemoveMemberMode = "recall" | "transfer" | "per_deal";

export type RemoveMemberAssignment = {
  deal_id: string;
  to_user_id: string | null;
};

export type RemoveMemberBody = {
  mode: RemoveMemberMode;
  to_user_id?: string;
  assignments?: RemoveMemberAssignment[];
};

export type RemoveMemberResponse = {
  archived_deal_exclusion?: string;
  deal_event_behavior?: string;
  removed_user_id: string;
  reassigned_count: number;
  reassignment_mode?: RemoveMemberMode | string;
  share_deletion_policy?: string;
  target_user_id?: string;
  mode: RemoveMemberMode | string;
};

// GET /admin/members/{user_id}/removal-preview (backend #623). Names the active
// assigned deals a removal would move and the members the DELETE would accept as
// recipients, so the roster never offers a recipient the removal then rejects.
export type MemberRemovalRecipient = {
  user_id: string;
  display_name?: string;
  role: string;
};

export type MemberRemovalPreview = {
  removed_user_id: string;
  active_deal_count: number;
  active_deal_ids: string[];
  eligible_recipients: MemberRemovalRecipient[];
};

export type MemberShareListResponse = {
  sharer_id: string;
  viewers: string[];
};

export type AddMemberShareBody = {
  viewer_id: string;
};

function apiPath(path: string): string {
  return typeof window !== "undefined" ? `/api/platform${path}` : `/api/v1${path}`;
}

function apiBaseUrl(): string | undefined {
  return typeof window !== "undefined" ? "" : DEFAULT_PLATFORM_API_BASE_URL;
}

export function normalizeUuidUserId(userId: string): string {
  const normalizedUserId = userId.trim().toLowerCase();

  if (!isUuidLike(normalizedUserId)) {
    throw new ApiError({
      code: "MEMBER_INVALID_USER_ID",
      message: "user_id must be a UUID",
      status: 400,
    });
  }

  return normalizedUserId;
}

export async function listOrgMembers(
  getIdToken: () => Promise<string>,
): Promise<OrgMemberListResponse> {
  return apiRequest<OrgMemberListResponse>(apiPath("/admin/members"), {
    baseUrl: apiBaseUrl(),
    getIdToken,
  });
}

export async function listOrgUsers(getIdToken: () => Promise<string>): Promise<OrgUserListResponse> {
  return apiRequest<OrgUserListResponse>(apiPath("/admin/users"), {
    baseUrl: apiBaseUrl(),
    getIdToken,
  });
}

export async function changeMemberRole(
  userId: string,
  body: ChangeMemberRoleBody,
  getIdToken: () => Promise<string>,
): Promise<OrgMemberResponse> {
  const normalizedUserId = encodeURIComponent(normalizeUuidUserId(userId));

  return apiRequest<OrgMemberResponse>(apiPath(`/admin/users/${normalizedUserId}/role`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
    init: {
      body: JSON.stringify(body),
      method: "PATCH",
    },
  });
}

export async function removeMember(
  userId: string,
  body: RemoveMemberBody,
  getIdToken: () => Promise<string>,
): Promise<RemoveMemberResponse> {
  const normalizedUserId = encodeURIComponent(normalizeUuidUserId(userId));

  return apiRequest<RemoveMemberResponse>(apiPath(`/admin/members/${normalizedUserId}`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
    init: {
      body: JSON.stringify(body),
      method: "DELETE",
    },
  });
}

export async function getMemberRemovalPreview(
  userId: string,
  getIdToken: () => Promise<string>,
): Promise<MemberRemovalPreview> {
  const normalizedUserId = encodeURIComponent(normalizeUuidUserId(userId));

  return apiRequest<MemberRemovalPreview>(
    apiPath(`/admin/members/${normalizedUserId}/removal-preview`),
    {
      baseUrl: apiBaseUrl(),
      getIdToken,
    },
  );
}

export async function getMemberShares(
  userId: string,
  getIdToken: () => Promise<string>,
): Promise<MemberShareListResponse> {
  const normalizedUserId = encodeURIComponent(normalizeUuidUserId(userId));

  return apiRequest<MemberShareListResponse>(apiPath(`/admin/members/${normalizedUserId}/shares`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
  });
}

export async function addMemberShare(
  userId: string,
  body: AddMemberShareBody,
  getIdToken: () => Promise<string>,
): Promise<Record<string, never>> {
  const normalizedUserId = encodeURIComponent(normalizeUuidUserId(userId));

  return apiRequest<Record<string, never>>(apiPath(`/admin/members/${normalizedUserId}/shares`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
    init: {
      body: JSON.stringify(body),
      method: "POST",
    },
  });
}

export async function removeMemberShare(
  userId: string,
  viewerId: string,
  getIdToken: () => Promise<string>,
): Promise<void> {
  const normalizedUserId = encodeURIComponent(normalizeUuidUserId(userId));
  const normalizedViewerId = encodeURIComponent(normalizeUuidUserId(viewerId));

  return apiRequest<void>(apiPath(`/admin/members/${normalizedUserId}/shares/${normalizedViewerId}`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
    init: {
      method: "DELETE",
    },
  });
}

export type OrgMember = {
  org_id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  display_name?: string | null;
  email?: string | null;
};

export const LIST_MEMBERS_LIMIT = 200;

// erp-v2-adapt: begin - QA-1326 rejects unreplaced template tokens in member labels.
export const TEMPLATE_TOKEN_RE = /\{[a-zA-Z0-9_]+\}/;
// erp-v2-adapt: end
export async function listMembers(getIdToken: () => Promise<string>): Promise<OrgMember[]> {
  const query = new URLSearchParams({ limit: String(LIST_MEMBERS_LIMIT) });
  const res = await apiRequest<{ items: OrgMember[] }>(apiPath(`/admin/members?${query}`), {
    baseUrl: apiBaseUrl(),
    getIdToken,
  });
  return res.items ?? [];
}

export function memberLabel(m: Pick<OrgMember, "display_name" | "email" | "user_id">): string {
  const name = m.display_name?.trim();
  // erp-v2-adapt: begin - QA-1326 falls through to canonical email/id labels for placeholder names.
  if (name && TEMPLATE_TOKEN_RE.test(name)) {
    const email = m.email?.trim();
    if (email) return email;
    return m.user_id.slice(0, 8);
  }
  // erp-v2-adapt: end
  if (name) return name;
  const email = m.email?.trim();
  if (email) return email;
  return m.user_id.slice(0, 8);
}

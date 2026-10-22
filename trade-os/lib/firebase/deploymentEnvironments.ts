// Markers that identify real deployments where development-only behavior is forbidden.
export const NON_DEV_DEPLOYMENT_ENVIRONMENTS: readonly string[] = [
  "prod",
  "production",
  "staging",
  "staging-smoke",
];

// Explicit development markers are intentionally separate: unknown or empty is not dev.
export const DEV_DEPLOYMENT_ENVIRONMENTS: readonly string[] = [
  "local",
  "dev",
  "test",
];

export const DEV_PUBLIC_APP_ENVIRONMENTS: readonly string[] = [
  "dev",
  "development",
  "test",
];

export function normalizedDeploymentEnvironment(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

export function isNonDevDeploymentEnvironment(value: string | undefined): boolean {
  return NON_DEV_DEPLOYMENT_ENVIRONMENTS.includes(normalizedDeploymentEnvironment(value));
}

export function isDevDeploymentEnvironment(value: string | undefined): boolean {
  return DEV_DEPLOYMENT_ENVIRONMENTS.includes(normalizedDeploymentEnvironment(value));
}

export function isDevPublicAppEnvironment(value: string | undefined): boolean {
  return DEV_PUBLIC_APP_ENVIRONMENTS.includes(normalizedDeploymentEnvironment(value));
}

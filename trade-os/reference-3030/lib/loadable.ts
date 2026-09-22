export type Loadable<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "empty" }
  | { status: "restricted"; reason: string }
  | { status: "error"; retryable: boolean; correlationId?: string };

export function fromSettled<T>(
  result: PromiseSettledResult<T>,
  isEmpty: (data: T) => boolean = () => false,
): Loadable<T> {
  if (result.status === "rejected") {
    return { status: "error", retryable: true };
  }
  if (isEmpty(result.value)) {
    return { status: "empty" };
  }
  return { status: "ready", data: result.value };
}

export function isLoadableReady<T>(
  loadable: Loadable<T>,
): loadable is Extract<Loadable<T>, { status: "ready" }> {
  return loadable.status === "ready";
}

export function isLoadableError<T>(
  loadable: Loadable<T>,
): loadable is Extract<Loadable<T>, { status: "error" }> {
  return loadable.status === "error";
}

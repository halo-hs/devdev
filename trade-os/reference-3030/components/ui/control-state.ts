import { useState, type ChangeEvent } from "react";

type CheckedInput = HTMLInputElement;

export function visualCheckedValue({
  checked,
  fallback = false,
  visualChecked,
}: {
  checked?: boolean;
  fallback?: boolean;
  visualChecked?: boolean;
}) {
  if (typeof visualChecked === "boolean") return visualChecked;
  if (typeof checked === "boolean") return checked;
  return fallback;
}

export function useInputCheckedState({
  checked,
  defaultChecked,
  onChange,
}: {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (event: ChangeEvent<CheckedInput>) => void;
}) {
  const isControlled = typeof checked === "boolean";
  const [uncontrolledChecked, setUncontrolledChecked] = useState(
    Boolean(defaultChecked),
  );
  const resolvedChecked = isControlled ? checked : uncontrolledChecked;

  function handleChange(event: ChangeEvent<CheckedInput>) {
    if (!isControlled) {
      setUncontrolledChecked(event.currentTarget.checked);
    }
    onChange?.(event);
  }

  return {
    handleChange,
    inputChecked: isControlled ? checked : undefined,
    inputDefaultChecked: isControlled ? undefined : defaultChecked,
    resolvedChecked,
  };
}

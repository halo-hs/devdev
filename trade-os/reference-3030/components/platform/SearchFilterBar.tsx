"use client";

import type { ChangeEvent, ComponentProps, ReactNode } from "react";

import { Button } from "@trade-os/reference-3030/components/ui/button";
import { Icon } from "@trade-os/reference-3030/components/ui/icon";
import { SearchInput, TextInput } from "@trade-os/reference-3030/components/ui/input";
import { cx } from "@trade-os/reference-3030/components/ui/utils";

type SearchFilterBarProps = ComponentProps<"div"> & {
  // erp-v2-adapt: begin — QA-1328 localized accessible name for the search clear control
  searchClearAriaLabel?: string;
  // erp-v2-adapt: end
  searchLabel?: ReactNode;
  searchPlaceholder?: string;
  searchInputType?: "search" | "text";
  searchValue?: string;
  searchOpen?: boolean;
  searchLeadingIcon?: boolean;
  onSearchOpenChange?: (open: boolean) => void;
  onSearchChange?: (value: string) => void;
  resultLabel?: ReactNode;
};

function SearchFilterBar({
  // erp-v2-adapt: begin — QA-1328 keep the search clear label off the wrapper DOM node
  searchClearAriaLabel,
  // erp-v2-adapt: end
  searchLabel,
  searchPlaceholder,
  searchInputType = "text",
  searchValue,
  searchOpen = false,
  searchLeadingIcon = false,
  onSearchOpenChange,
  onSearchChange,
  resultLabel,
  className,
  ...props
}: SearchFilterBarProps) {
  const resolvedSearchLabel = typeof searchLabel === "string" ? searchLabel : "검색";
  const searchInputProps = {
    // erp-v2-adapt: begin — QA-1328 forward the localized label through both input branches
    clearAriaLabel: searchClearAriaLabel,
    // erp-v2-adapt: end
    value: searchValue,
    type: searchInputType,
    "aria-label": resolvedSearchLabel,
    placeholder: searchPlaceholder,
    onChange: (event: ChangeEvent<HTMLInputElement>) => onSearchChange?.(event.target.value),
    onClear: () => {
      onSearchChange?.("");
      onSearchOpenChange?.(false);
    },
    size: "md" as const,
  };

  return (
    // Bar: flex / flex-wrap / items-center / gap-3 / w-full / transparent
    <div
      className={cx("flex w-full flex-wrap items-center gap-3 bg-transparent", className)}
      data-ui="search-filter-bar"
      {...props}
    >
      {/* Keep the desktop search width while allowing the enclosing card to shrink. */}
      <div className={searchOpen ? "w-full min-w-0 max-w-[560px]" : "w-auto min-w-0"}>
        {searchOpen ? (
          searchLeadingIcon ? (
            <TextInput
              {...searchInputProps}
              leadingSlot={<Icon name="icon-search" size={16} />}
            />
          ) : (
            <SearchInput
              {...searchInputProps}
              trailingSlot={<Icon name="icon-search" size={16} />}
            />
          )
        ) : (
          // tertiary + black → variant=tertiary / intent=brand
          <Button
            type="button"
            size="md"
            variant="tertiary"
            intent="brand"
            leadingIcon={<Icon name="icon-search" size={16} />}
            onClick={() => onSearchOpenChange?.(true)}
          >
            {searchLabel ?? "검색"}
          </Button>
        )}
      </div>
      {resultLabel && (
        <>
          {/* Separator: 1px × 18px / gray-10 */}
          <span className="h-[18px] w-px bg-ecoya-gray-10" data-ui="search-filter-separator" />
          <span className="inline-flex h-8 items-center whitespace-nowrap text-label-12 font-medium text-ecoya-gray-4">
            {resultLabel}
          </span>
        </>
      )}
    </div>
  );
}

export { SearchFilterBar };
export type { SearchFilterBarProps };

"use client";

import { Fragment, useState, type ButtonHTMLAttributes, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";

import { ecoyaIllustration } from "@trade-os/reference-3030/lib/assets";

import { Icon } from "./icon";
import { SelectTrigger } from "./input";
import { Switch } from "./switch";
import { cx } from "./utils";

type TableAlign = "left" | "center" | "right";
export type SortState = "inactive" | "asc" | "desc";
export type StatusBadgeVariant =
  | "green"
  | "orange"
  | "blue"
  | "grape"
  | "pink"
  | "gray";
type PaginationItemType = "page" | "prev" | "next" | "ellipsis";

type TableHeaderCellProps = {
  align?: TableAlign;
  children?: ReactNode;
  className?: string;
  divider?: boolean;
  /** Omitted: SNAP 57px; explicit compact/standard retain legacy 42px/44px. */
  height?: "compact" | "standard";
  minWidth?: "default" | "none";
  onSortClick?: () => void;
  role?: string;
  sort?: SortState | false;
};

type TableCellProps = {
  align?: TableAlign;
  children?: ReactNode;
  className?: string;
  /** Omitted: SNAP 57px; explicit compact/standard retain legacy 42px/44px. */
  height?: "compact" | "standard";
  minWidth?: "default" | "none";
  role?: string;
  width?: string;
};

type KeyedDataTableRow = {
  key: string | number;
  expanded?: ReactNode;
  expandedAriaLabel?: string;
  rowClassName?: string;
};

type PaginationItemProps = {
  active?: boolean;
  ariaLabel?: string;
  children?: ReactNode;
  disabled?: boolean;
  hovered?: boolean;
  onClick?: () => void;
  type?: PaginationItemType;
};

type PaginationLabels = {
  nextPage?: string;
  previousPage?: string;
  root?: string;
};

type PaginationProps = {
  className?: string;
  defaultPage?: number;
  disabled?: boolean;
  labels?: PaginationLabels;
  onPageChange?: (page: number) => void;
  page?: number;
  pageSize?: number;
  siblingCount?: number;
  total?: number;
};

export type TableActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  iconName?: string;
  label?: ReactNode;
};

export type DataTableRow = {
  active?: boolean;
  blNo?: ReactNode;
  bookmarked?: boolean;
  importCode?: ReactNode;
  key: string | number;
  no: ReactNode;
  qty?: ReactNode;
  status?: ReactNode;
  statusVariant?: StatusBadgeVariant;
};

export type DataTableColumn<Row extends KeyedDataTableRow> = {
  align?: TableAlign;
  cellClassName?: string;
  header: ReactNode;
  headerClassName?: string;
  key: string;
  render: (row: Row) => ReactNode;
  sort?: SortState | false;
  width?: string;
};

type DataTableBaseProps = {
  className?: string;
  empty?: boolean;
  emptyLabel?: ReactNode;
  loading?: boolean;
  onSortChange?: (columnKey: string, sort: SortState) => void;
};

type FixedDataTableProps = DataTableBaseProps & {
  columns?: undefined;
  onActiveChange?: (row: DataTableRow, active: boolean) => void;
  rows?: Array<DataTableRow>;
};

type GenericDataTableProps<Row extends KeyedDataTableRow> = DataTableBaseProps & {
  columns: Array<DataTableColumn<Row>>;
  onActiveChange?: never;
  rows?: Array<Row>;
};

const badgeStyles: Record<StatusBadgeVariant, string> = {
  green: "bg-ecoya-system-green-6 text-[color:var(--ecoya-system-green-1)]",
  orange: "bg-ecoya-system-orange-6 text-[color:var(--ecoya-system-orange-2)]",
  blue: "bg-ecoya-system-blue-6 text-[color:var(--ecoya-system-blue-2)]",
  grape: "bg-ecoya-system-grape-6 text-[color:var(--ecoya-system-grape-2)]",
  pink: "bg-ecoya-system-pink-6 text-[color:var(--ecoya-system-pink-2)]",
  gray: "bg-ecoya-gray-10 text-[color:var(--ecoya-gray-4)]",
};

function textAlignClass(align: TableAlign) {
  if (align === "left") return "text-left";
  if (align === "right") return "text-right";
  return "text-center";
}

export function StatusBadge({
  children,
  className,
  variant = "pink",
}: {
  children?: ReactNode;
  className?: string;
  variant?: StatusBadgeVariant;
}) {
  return (
    <span
      className={cx(
        "inline-flex h-5 items-center justify-center rounded-3xl px-2.5 py-0.5 text-badge-12 font-medium",
        badgeStyles[variant],
        className,
      )}
      data-ui="status-badge"
    >
      {children}
    </span>
  );
}

export function TableSortIcon({
  size = "header",
  state = "inactive",
}: {
  size?: "header" | "standalone";
  state?: SortState;
}) {
  const activeUp = state === "asc";
  const activeDown = state === "desc";
  const frameClass = size === "standalone" ? "h-[15px] w-[10px]" : "h-3 w-2";
  const caretClass = size === "standalone" ? "h-[6px] w-[10px]" : "h-[5px] w-2";

  return (
    <span
      aria-hidden="true"
      className={cx(
        "inline-flex shrink-0 flex-col items-center justify-center gap-[2px]",
        frameClass,
      )}
    >
      <Icon
        className={cx(caretClass, activeUp ? "text-ecoya-blue-5" : "text-ecoya-gray-7")}
        name="icon-caret-up"
      />
      <Icon
        className={cx(caretClass, activeDown ? "text-ecoya-blue-5" : "text-ecoya-gray-7")}
        name="icon-caret-down"
      />
    </span>
  );
}

export function TableHeaderCell({
  align = "center",
  children,
  className,
  divider = false,
  height,
  minWidth = "default",
  onSortClick,
  role,
  sort = "inactive",
}: TableHeaderCellProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!onSortClick) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onSortClick();
  }

  return (
    <div
      aria-sort={
        sort === "asc" ? "ascending" : sort === "desc" ? "descending" : undefined
      }
      className={cx(
        "flex shrink-0 items-center justify-center border-b border-[var(--ecoya-table-border)] bg-surface-muted px-3 py-0 text-body-15 font-medium text-[color:var(--ecoya-text-secondary)]",
        onSortClick && "cursor-pointer outline-none focus-visible:shadow-[var(--ecoya-shadow-input-focused)]",
        minWidth === "default" ? "min-w-[70px]" : "min-w-0",
        height === undefined ? "h-[57px]" : height === "compact" ? "h-[42px]" : "h-11",
        divider && "border-r border-border",
        className,
      )}
      data-ui="table-header-cell"
      data-height={height}
      onClick={onSortClick}
      onKeyDown={handleKeyDown}
      role={role ?? (onSortClick ? "button" : undefined)}
      tabIndex={onSortClick ? 0 : undefined}
    >
      <div className="flex min-w-0 flex-1 items-start justify-center gap-1">
        <span className={cx("min-w-0 flex-1 truncate", textAlignClass(align))}>
          {children}
        </span>
        {sort !== false ? <TableSortIcon state={sort} /> : null}
      </div>
    </div>
  );
}

export function TableCell({
  align = "center",
  children,
  className,
  height,
  minWidth = "default",
  role,
  width,
}: TableCellProps) {
  return (
    <div
      className={cx(
        "flex items-center justify-center border-b border-[var(--ecoya-table-border)] px-3 py-0 text-body-15 font-regular text-[color:var(--ecoya-text-primary)]",
        minWidth === "default" ? "min-w-[70px]" : "min-w-0",
        height === undefined ? "h-[57px]" : height === "compact" ? "h-[42px]" : "h-11",
        className,
      )}
      data-ui="table-cell"
      data-height={height}
      role={role}
      style={width ? ({ width } as CSSProperties) : undefined}
    >
      <span className={cx("min-w-0 flex-1 truncate", textAlignClass(align))}>
        {children}
      </span>
    </div>
  );
}

export function TableActionButton({
  className,
  iconName,
  label = "Edit",
  ...props
}: TableActionButtonProps = {}) {
  const resolvedIconName = iconName ?? "icon-pencil";

  return (
    <button
      className={cx(
        "inline-flex h-6 shrink-0 items-center justify-center gap-0.5 overflow-hidden rounded-[6px] bg-ecoya-gray-12 pl-1 pr-2 text-button-13 font-medium text-ecoya-gray-2 shadow-[0_0_0_0.5px_rgba(160,164,171,0.2),0_1px_2px_0_rgba(5,29,57,0.1)] outline-none focus-visible:shadow-[var(--ecoya-shadow-input-focused)] disabled:opacity-50",
        className,
      )}
      type="button"
      {...props}
    >
      <Icon className="size-4" name={resolvedIconName} />
      <span className="shrink-0">{label}</span>
    </button>
  );
}

/**
 * 정본: Figma SNAP 2.0 node 48:5 · 07_Data_Table `PaginationItem`(160:84).
 *
 * 8 심볼(page/prev/next × default·current·disabled + ellipsis)이 전부 **32×32**
 * 이고(metadata.xml:75-82 · 08_PaginationItem 2372:13846 도 동일), 라운드는
 * **8px**(Figma 문자열은 `var(--r-md,8px)` — 아래 (b) 참조), 라벨은
 * `var(--text-button-3,15px)/var(--leading-button-3,20px)`
 * Medium 이다(design_context.forced.md:1429-1462). 상태별 색:
 *   default  → `var(--button-ghost-foreground,#166dd7)`
 *   current  → outline background/border/foreground + tertiary 그림자
 *   disabled → `var(--button-ghost-disabled-foreground,#c8cad0)`
 * prev/next 는 상태에 따라 아이콘 **계열**이 갈린다 — default=Arrow,
 * disabled=Chevron(forced.md:1454-1457). 종전 구현은 상태와 무관하게 항상
 * chevron 이었다.
 *
 * 아이콘 크기 16px: 전용 spec 심볼은 `size-[16px]`, 조립 인스턴스는 `size-[20px]`
 * 로 Figma 내부가 갈린다. 전용 spec 보드 > 조합 보드 규칙으로 16px 을 택한다
 * (전수 카운트도 16px 53회 > 20px 11회).
 *
 * ── 토큰 참조와 리터럴을 가르는 기준(이 파일 전체에 적용) ──────────────────
 * 이 파일은 DS 2.0 토큰 스코프(`[data-ds="2"]`) **밖**에서 렌더되는 DS 1.0
 * 표면이다. `data-ds="2"` 를 세우는 곳은 `app/design-system/ds2/page.tsx` 와
 * `platform/PlatformSideNav.tsx:216`(레일) 뿐이고, `Pagination`/`PaginationFooter`
 * 의 소비처(DS 보드 2곳과 실제 표 9곳)는 그 안이 아니다. 그래서
 * `var(--토큰, 정본값)` 은 두 부류로 갈린다.
 *
 *  (a) 토큰이 `:root` 에 **없다** → fallback 이 실제로 평가된다. 스코프 밖에서는
 *      정본값이, 스코프 안에서는 DS 2.0 토큰이 걸리는 이중 계약이라 그대로 둔다.
 *      `--button-outline-{background,border,foreground}` ·
 *      `--button-ghost-{foreground,disabled-foreground}` · `--surface-border` ·
 *      `--text-button-3` · `--leading-button-3` 8개가 여기 속한다
 *      (globals.css 안에 정의 0건 — `git grep` 로 확인).
 *
 *  (b) 토큰이 `:root` 에 **있다** → fallback 은 **절대 평가되지 않는다**. CSS `var()`
 *      의 두 번째 인자는 "토큰이 미정의일 때"만 쓰이지 "값이 마음에 안 들 때" 쓰이지
 *      않는다. 즉 정본값을 적어놓고도 렌더되는 것은 DS 1.0 값이다. globals.css 의
 *      `--r-*` 브리지(:307-320)와 `--muted-foreground`(:434 light / :527 dark)가
 *      정확히 이 경우다:
 *        --r-sm            → --ecoya-radius-sm   8px      (정본 6px)
 *        --r-md            → --ecoya-radius-md  10px      (정본 8px)
 *        --r-lg            → --ecoya-radius-lg  14px      (정본 12px)
 *        --muted-foreground→ --ecoya-gray-4     #54575c   (정본 gray/4 #5c5e66)
 *      이름을 바꿔 우회할 길도 없다 — `--radius-*`(globals.css:826-830)와
 *      `--color-gray-4`(:413)도 같은 `--ecoya-*` 로 별칭돼 있어 같은 값에 걸린다.
 *      그래서 (b) 4개는 **리터럴로 적는다**(`rounded-[8px]` / `rounded-b-[12px]` /
 *      `rounded-[6px]` / `text-[#5c5e66]`). 하단 12px 라운드는 Figma 코드젠 자신도
 *      `rounded-bl-[12px] rounded-br-[12px]` 리터럴로 뱉는다(forced.md:577).
 *
 *  버린 두 선택지: ① `tokens-ds2.css` 에 새 역할 토큰을 세우는 길은 그 파일이
 *  통째로 `[data-ds="2"]` 스코프라 DS 1.0 에서 여전히 안 걸린다(스코프 밖에 서는
 *  것은 `.ds2-typo-*` **클래스**뿐이고, 그 클래스가 참조하는 `--text-*`/`--leading-*`
 *  는 (a) 부류라 fallback 이 산다). ② 이 컴포넌트를 DS 2.0 스코프로 옮기는 것은
 *  실제 표 9곳의 화면 루트를 건드리는 별개 결정이다(`ds2/page.tsx:193`).
 *  같은 라운드의 `ui/info-list.tsx` 도 같은 이유로 12값을 리터럴로 옮겼다.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * current 의 그림자는 `shadow/btn/tertiary/black` 변수값(spread 0.5px)을 그대로
 * 적는다. forced.md 가 뱉는 `0px_0px_0px_0px` 는 Figma 의 tailwind emitter 가
 * spread 를 떨어뜨린 것이고, 변수 원장(variables.json)이 0.5 라고 말한다.
 * `var(--shadow-btn-tertiary-black)` 를 쓰지 않는 것도 스코프 때문이다.
 *
 * hover 는 정본에 없는 축이라(정적 보드) 기존 --ecoya-* 동작을 유지한다.
 */
export function PaginationItem({
  active,
  ariaLabel,
  children,
  disabled,
  hovered,
  onClick,
  type = "page",
}: PaginationItemProps) {
  const isArrow = type === "prev" || type === "next";
  const isEllipsis = type === "ellipsis";
  const resolvedAriaLabel = ariaLabel ?? (type === "prev" ? "Previous page" : type === "next" ? "Next page" : undefined);

  if (isEllipsis) {
    // 정본은 리터럴 '•••' 이 아니라 icon_More(Fill) 16px 이다(forced.md:1458).
    // 가로 3점 자산은 `icon-more-fill-1`(path 좌표 (6,12)(12,12)(18,12));
    // `icon-more-fill` 은 세로 3점이라 페이지 줄에 맞지 않는다.
    return (
      <span
        className="flex size-8 items-center justify-center text-[color:var(--ecoya-text-subtle)]"
        data-ui="pagination-ellipsis"
      >
        <Icon className="size-4" name="icon-more-fill-1" />
        <span className="sr-only">More pages</span>
      </span>
    );
  }

  return (
    <button
      aria-current={active ? "page" : undefined}
      aria-label={resolvedAriaLabel}
      className={cx(
        // rounded-[8px]: 정본 `var(--r-md,8px)` 의 (b) 부류 — DS 1.0 `:root` 가
        // --r-md 를 10px 로 정의해 fallback 이 죽는다. 위 헤더 (b) 참조.
        "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-[8px] text-[length:var(--text-button-3,15px)] font-medium leading-[var(--leading-button-3,20px)] focus-visible:outline-none focus-visible:shadow-[var(--ecoya-shadow-button-blue-pressed)]",
        active
          ? "border border-[color:var(--button-outline-border,#eeeff1)] bg-[color:var(--button-outline-background,#ffffff)] text-[color:var(--button-outline-foreground,#2a2c32)] shadow-[0px_0px_0px_0.5px_rgba(160,164,171,0.2),0px_1px_2px_rgba(5,29,57,0.1)]"
          : "bg-transparent text-[color:var(--button-ghost-foreground,#166dd7)] hover:bg-ecoya-gray-11",
        hovered && !active && "bg-ecoya-gray-11",
        disabled && "text-[color:var(--button-ghost-disabled-foreground,#c8cad0)] hover:bg-transparent",
      )}
      data-ui="pagination-item"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {isArrow ? (
        <Icon
          className="size-4"
          name={
            disabled
              ? type === "prev"
                ? "icon-chevron-left"
                : "icon-chevron-right"
              : type === "prev"
                ? "icon-arrow-left"
                : "icon-arrow-right"
          }
        />
      ) : (
        children
      )}
    </button>
  );
}

function clampPage(page: number, totalPages: number) {
  return Math.min(Math.max(page, 1), Math.max(totalPages, 1));
}

function paginationRange({
  currentPage,
  siblingCount,
  totalPages,
}: {
  currentPage: number;
  siblingCount: number;
  totalPages: number;
}) {
  const totalNumbers = siblingCount * 2 + 5;
  if (totalPages <= totalNumbers) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const leftSibling = Math.max(currentPage - siblingCount, 2);
  const rightSibling = Math.min(currentPage + siblingCount, totalPages - 1);
  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < totalPages - 1;
  const pages: Array<number | "..."> = [1];

  if (showLeftEllipsis) {
    pages.push("...");
  }

  for (let page = leftSibling; page <= rightSibling; page += 1) {
    pages.push(page);
  }

  if (showRightEllipsis) {
    pages.push("...");
  }

  pages.push(totalPages);
  return pages;
}

/**
 * 정본: Figma SNAP 2.0 node 48:5 · 07_Data_Table `Pagination`(155:267) —
 * `state=default | disabled` 2 variants 뿐이다(metadata.xml:157-159).
 *
 * 종전의 `full` 모드(page/total/defaultPage 가 전부 없을 때 totalPages=999 로 두고
 * `[1,"...",6,7,8,9,"...",999]` 고정 배열을 그리던 분기)는 정본 어디에도 근거가
 * 없어 제거했다. 페이지 배열은 언제나 total/pageSize 에서 계산한다.
 *
 * 항목 간격은 정본 `pagination-content` 의 `var(--space/2,2px)`
 * (forced.md:584)를 gap-0.5로 옮겼다 — 종전은 gap-1(4px)이었다.
 */
export function Pagination({
  className,
  defaultPage,
  disabled,
  labels,
  onPageChange,
  page,
  pageSize = 10,
  siblingCount = 1,
  total,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil((total ?? 50) / pageSize));
  const [uncontrolledPage, setUncontrolledPage] = useState(defaultPage ?? 1);
  const currentPage = clampPage(page ?? uncontrolledPage, totalPages);
  const pages = paginationRange({ currentPage, siblingCount, totalPages });

  function commitPage(nextPage: number) {
    const resolvedPage = clampPage(nextPage, totalPages);
    if (resolvedPage === currentPage || disabled) return;
    if (page === undefined) {
      setUncontrolledPage(resolvedPage);
    }
    onPageChange?.(resolvedPage);
  }

  return (
    <nav
      aria-label={labels?.root ?? "Pagination"}
      className={cx("flex items-center justify-center gap-0.5", className)}
      data-ui="pagination"
    >
      <PaginationItem
        ariaLabel={labels?.previousPage ?? "Previous page"}
        disabled={disabled || currentPage <= 1}
        onClick={() => commitPage(currentPage - 1)}
        type="prev"
      />
      {pages.map((page, index) =>
        page === "..." ? (
          <PaginationItem key={`${page}-${index}`} type="ellipsis" />
        ) : (
          <PaginationItem
            active={page === currentPage}
            disabled={disabled}
            key={`${page}-${index}`}
            onClick={() => commitPage(page)}
          >
            {page}
          </PaginationItem>
        ),
      )}
      <PaginationItem
        ariaLabel={labels?.nextPage ?? "Next page"}
        disabled={disabled || currentPage >= totalPages}
        onClick={() => commitPage(currentPage + 1)}
        type="next"
      />
    </nav>
  );
}

/**
 * 정본: Figma SNAP 2.0 node 48:5 · 07_Data_Table `Table Footer`(2257:11397).
 *
 * 2 variants — `Pagination footer`(1320×73.5) / `none`(1320×41). 밴드 계약은
 * design_context.forced.md:577 다:
 *   `border-t border-[var(--surface-border,#eeeff1)] rounded-bl-[12px]
 *    rounded-br-[12px] p-[20px] flex items-center justify-between`
 * 내부는 Total 라벨(좌) · pagination-content(중) · pagination-page-size(우,
 * 'Rows per page' 라벨 + 32px select) 3열이고, 줄바꿈 시 `gap-y-[12px]` 를 갖는다.
 *
 * 종전 구현과 다른 점 3가지:
 *  1. 폭 하드코딩(`w-[1195px]`/`w-[1000px]`)을 없앤다. 1320px 는 보드 캔버스
 *     폭이지 컴포넌트 계약이 아니고, 정본 밴드는 부모 폭을 채운다.
 *  2. 상단 1px 룰과 하단 12px 라운드를 붙인다(정본 양 variant 공통).
 *  3. page-size 라벨을 정식 슬롯으로 노출한다. 종전 `pageSizeLabel` 은 사실
 *     select 의 **선택값**("10/page")이었고 라벨은 아예 없었다 —
 *     `pageSizeValue`(선택값)와 `pageSizeLabel`(정본의 'Rows per page' 자리,
 *     문구는 호출부 번역)로 나눈다.
 *
 * `full`(legacy) 모드는 그대로 두지 않는다: `Pagination` 이 page/total/defaultPage
 * 없이 호출되면 [1,…,6,7,8,9,…,999] 고정 배열을 그리는데 정본 어디에도 근거가
 * 없다. 여기서는 total/page 를 그대로 넘겨 실제 페이지 수를 계산하게 한다.
 */
export function PaginationFooter({
  className,
  columnButton,
  labels,
  onPageChange,
  page,
  pageSize,
  // 정본은 이 자리에 'Rows per page' 라벨을 두지만, 그 **문구**를 기본값으로
  // 박으면 번역되지 않는 영어가 컴포넌트에 남는다(scripts/verify-no-hardcoded-
  // dialog-i18n-defaults.mjs 가 막는 클래스이고, 이 컴포넌트의 형제 슬롯
  // `totalLabel` 도 같은 이유로 null 기본값이다). 정본이 고정하는 것은 **슬롯의
  // 존재와 배치**이므로 슬롯만 노출하고 문구는 호출부의 번역에서 받는다.
  pageSizeLabel = null,
  pageSizeValue = "",
  total,
  totalLabel = null,
  totalValue = null,
}: {
  className?: string;
  columnButton?: boolean;
  labels?: PaginationLabels;
  onPageChange?: (page: number) => void;
  page?: number;
  pageSize?: number;
  pageSizeLabel?: ReactNode;
  pageSizeValue?: string;
  total?: number;
  totalLabel?: ReactNode;
  totalValue?: ReactNode;
}) {
  const showTotal = totalLabel != null || totalValue != null;

  return (
    <div
      className={cx(
        // rounded-b-[12px]: 정본 밴드가 `rounded-bl-[12px] rounded-br-[12px]` 리터럴
        // 이고(forced.md:577), `var(--r-lg,12px)` 로 적으면 DS 1.0 `:root` 의 14px 로
        // 해소된다((b) 부류). border 색 `--surface-border` 는 (a) 부류라 참조 유지.
        "flex w-full flex-wrap items-center justify-between gap-y-3 rounded-b-[12px] border-t border-[color:var(--surface-border,#eeeff1)] p-5",
        className,
      )}
      data-ui="pagination-footer"
    >
      {showTotal ? (
        <div className="flex items-center gap-0.5 text-body-14">
          {/* text-[#5c5e66] = 정본 gray/4. `var(--muted-foreground,#5c5e66)` 는
              DS 1.0 `:root`(globals.css:434) 가 --ecoya-gray-4 #54575c 로 정의해
              fallback 이 죽는 (b) 부류다. */}
          {totalLabel != null ? (
            <span className="font-regular text-[#5c5e66]">{totalLabel}</span>
          ) : null}
          {totalValue != null ? (
            <span className="font-regular text-[color:var(--ecoya-text-primary)]">{totalValue}</span>
          ) : null}
        </div>
      ) : null}
      <Pagination
        className="min-w-0 flex-1"
        labels={labels}
        onPageChange={onPageChange}
        page={page}
        pageSize={pageSize}
        total={total}
      />
      {columnButton ? (
        <div className="flex items-center gap-2" data-ui="pagination-page-size">
          {/* 위 Total 라벨과 같은 (b) 부류 — 정본 gray/4 #5c5e66 리터럴. */}
          {pageSizeLabel != null ? (
            <span className="text-body-14 font-regular whitespace-nowrap text-[#5c5e66]">
              {pageSizeLabel}
            </span>
          ) : null}
          {/* rounded-[6px]: 정본 `var(--r-sm,6px)`(forced.md:665) 의 (b) 부류 —
              DS 1.0 `:root` 는 --r-sm 을 8px 로 정의한다. */}
          <SelectTrigger
            className="!h-8 !w-[88px] flex-none gap-1 rounded-[6px] !border-ecoya-gray-10 shadow-[var(--ecoya-shadow-input)] hover:!border-ecoya-gray-7"
            selectedText={pageSizeValue}
            size="sm"
          />
        </div>
      ) : null}
    </div>
  );
}

export function EmptyTableState({
  className,
  label,
}: {
  className?: string;
  label?: ReactNode;
}) {
  return (
    <div
      className={cx("flex min-h-[418px] w-full flex-col items-center justify-center px-10 py-4", className)}
      data-ui="empty-table-state"
    >
      <span
        aria-hidden="true"
        className="block size-14 bg-contain bg-center bg-no-repeat"
        style={{ backgroundImage: `url("${ecoyaIllustration("Bag_Gray")}")` }}
      />
      {label ? (
        <span className="text-body-16 font-medium text-[color:var(--ecoya-text-subtle)]">{label}</span>
      ) : null}
    </div>
  );
}

function DataTableHeader({
  empty,
}: {
  empty?: boolean;
}) {
  const widths = empty
    ? ["w-[60px]", "w-[70px]", "w-[143px]", "w-[203.667px]", "w-[203.667px]", "w-[203.667px]", "w-[311px]"]
    : ["w-[70px]", "w-[70px]", "w-[128px]", "w-[256.333px]", "w-[256.333px]", "w-[256.333px]", "w-[158px]"];

  return (
    <div className="flex w-full items-start">
      <TableHeaderCell
        align={empty ? "left" : "center"}
        className={cx(widths[0], "max-w-[70px] rounded-l-[8px]")}
        minWidth={empty ? "none" : "default"}
        sort={false}
      >
        No.
      </TableHeaderCell>
      <TableHeaderCell className={widths[1]}>
        Bo...
      </TableHeaderCell>
      <TableHeaderCell className={widths[2]}>
        Status
      </TableHeaderCell>
      <TableHeaderCell className={widths[3]}>
        B/L No.
      </TableHeaderCell>
      <TableHeaderCell className={widths[4]}>
        Import Code
      </TableHeaderCell>
      <TableHeaderCell className={widths[5]}>
        Qty
      </TableHeaderCell>
      <TableHeaderCell className={cx(widths[6], "rounded-r-[8px]")} divider={false}>
        Use
      </TableHeaderCell>
    </div>
  );
}

function nextSortState(sort: SortState | false | undefined) {
  if (sort === "asc") return "desc";
  if (sort === "desc") return "inactive";
  return "asc";
}

function GenericDataTable<Row extends KeyedDataTableRow>({
  className,
  columns,
  emptyLabel,
  loading,
  onSortChange,
  rows,
}: {
  className?: string;
  columns: Array<DataTableColumn<Row>>;
  emptyLabel?: ReactNode;
  loading?: boolean;
  onSortChange?: (columnKey: string, sort: SortState) => void;
  rows: Array<Row>;
}) {
  return (
    <div
      className={cx(
        "w-full overflow-x-auto rounded-lg border border-border-muted bg-surface p-2 shadow-section",
        className,
      )}
      data-ui="data-table"
      role="table"
    >
      <div className="min-w-full">
        <div className="flex w-full items-start" role="row">
          {columns.map((column, index) => (
            <TableHeaderCell
              align={column.align}
              className={cx(
                column.width ?? "flex-1",
                index === 0 && "rounded-l-[8px]",
                index === columns.length - 1 && "rounded-r-[8px]",
                column.headerClassName,
              )}
              divider={false}
              key={column.key}
              minWidth="none"
              onSortClick={
                column.sort === undefined || column.sort === false || !onSortChange
                  ? undefined
                  : () => onSortChange(column.key, nextSortState(column.sort))
              }
              role="columnheader"
              sort={column.sort ?? false}
            >
              {column.header}
            </TableHeaderCell>
          ))}
        </div>
        {loading || rows.length === 0 ? (
          <EmptyTableState label={loading ? "Loading" : emptyLabel} />
        ) : (
          rows.map((row) => (
            <Fragment key={row.key}>
              <div className={cx("flex w-full items-start hover:bg-ecoya-blue-10", row.rowClassName)} role="row">
                {columns.map((column) => (
                  <TableCell
                    align={column.align}
                    className={cx(column.width ?? "flex-1", column.cellClassName)}
                    key={column.key}
                    minWidth="none"
                    role="cell"
                  >
                    {column.render(row)}
                  </TableCell>
                ))}
              </div>
              {row.expanded ? (
                <div className="w-full border-y border-ecoya-gray-10 bg-ecoya-gray-12" role="row">
                  <div
                    aria-colspan={columns.length}
                    aria-label={row.expandedAriaLabel}
                    className="w-full p-3"
                    role="cell"
                  >
                    {row.expanded}
                  </div>
                </div>
              ) : null}
            </Fragment>
          ))
        )}
      </div>
    </div>
  );
}

export function DataTable<Row extends KeyedDataTableRow>(props: GenericDataTableProps<Row>): ReactNode;
export function DataTable(props: FixedDataTableProps): ReactNode;
export function DataTable<Row extends KeyedDataTableRow>(
  props: GenericDataTableProps<Row> | FixedDataTableProps,
) {
  const {
    className,
    empty = false,
    emptyLabel,
    loading = false,
    onSortChange,
  } = props;

  if (props.columns) {
    return (
      <GenericDataTable
        className={className}
        columns={props.columns}
        emptyLabel={emptyLabel}
        loading={loading}
        onSortChange={onSortChange}
        rows={props.rows ?? []}
      />
    );
  }

  if (empty) {
    return (
      <div
        className={cx(
          "w-[1195px] rounded-lg border border-border-muted bg-surface p-2 shadow-section",
          className,
        )}
        data-ui="data-table-empty"
      >
        <DataTableHeader empty />
        <EmptyTableState label={emptyLabel} />
      </div>
    );
  }

  const fixedRows = props.rows ?? [];

  return (
    <div
      className={cx(
        "flex w-[1195px] items-start rounded-lg border border-border-muted bg-surface p-2 shadow-section",
        className,
      )}
      data-ui="data-table"
    >
      <div className="flex w-[70px] flex-col items-center">
        <TableHeaderCell className="w-[70px] rounded-l-[8px]" sort={false}>
          No.
        </TableHeaderCell>
        {fixedRows.map((row) => (
          <TableCell className="w-[70px]" key={row.key}>
            {row.no}
          </TableCell>
        ))}
      </div>
      <div className="flex w-[70px] flex-col items-start">
        <TableHeaderCell className="w-[70px]">
          Bo...
        </TableHeaderCell>
        {fixedRows.map((row) => (
          <TableCell className="w-[70px]" key={row.key}>
            {row.bookmarked ? (
              <Icon className="mx-auto size-[18px] text-ecoya-system-red-2" name="icon-bookmark-fill" />
            ) : null}
          </TableCell>
        ))}
      </div>
      <div className="flex w-[128px] flex-col items-center">
        <TableHeaderCell className="w-[128px]">
          Status
        </TableHeaderCell>
        {fixedRows.map((row) => (
          <TableCell className="w-[128px]" key={row.key}>
            <StatusBadge variant={row.statusVariant}>{row.status}</StatusBadge>
          </TableCell>
        ))}
      </div>
      <div className="flex w-[256.333px] flex-col items-center">
        <TableHeaderCell className="w-[256.333px]">
          B/L No.
        </TableHeaderCell>
        {fixedRows.map((row) => (
          <TableCell
            className="w-[256.333px] text-ecoya-system-blue-2 underline"
            key={row.key}
          >
            {row.blNo}
          </TableCell>
        ))}
      </div>
      <div className="flex w-[256.333px] flex-col items-center">
        <TableHeaderCell className="w-[256.333px]">
          Import Code
        </TableHeaderCell>
        {fixedRows.map((row) => (
          <TableCell className="w-[256.333px]" key={row.key}>
            {row.importCode}
          </TableCell>
        ))}
      </div>
      <div className="flex w-[256.333px] flex-col items-center">
        <TableHeaderCell className="w-[256.333px]">
          Qty
        </TableHeaderCell>
        {fixedRows.map((row) => (
          <TableCell align="right" className="w-[256.333px]" key={row.key}>
            {row.qty}
          </TableCell>
        ))}
      </div>
      <div className="flex w-[158px] flex-col items-center">
        <TableHeaderCell className="w-[158px] rounded-r-[8px]" divider={false}>
          Use
        </TableHeaderCell>
        {fixedRows.map((row) => (
          <TableCell className="w-[158px]" key={row.key}>
            <Switch
              checked={row.active}
              onCheckedChange={(active) => props.onActiveChange?.(row, active)}
            />
          </TableCell>
        ))}
      </div>
    </div>
  );
}

export function TableDropdownCell({
  className,
  placeholder,
}: {
  className?: string;
  placeholder?: string;
} = {}) {
  return (
    <TableCell className={cx("w-[170px] px-5", className)}>
      <SelectTrigger className="!w-[130px] min-w-[100px]" placeholder={placeholder} size="sm" />
    </TableCell>
  );
}

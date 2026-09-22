import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  DataTable,
  type DataTableColumn,
  type DataTableSortState,
} from "./data-table"
import { PaginationController } from "./pagination-controller"

describe("PaginationController", () => {
  it("renders a bounded page window and requests controlled page changes", async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    const onChange = vi.fn()

    render(
      <PaginationController
        page={5}
        pageSize={10}
        total={100}
        showPageSizeSelect={false}
        onPageChange={onPageChange}
        onChange={onChange}
      />
    )

    expect(screen.getByRole("button", { name: "Page 5" })).toHaveAttribute(
      "aria-current",
      "page"
    )
    expect(screen.getByText("Total 100")).toHaveClass(
      "typo-b9r",
      "text-[var(--table-caption-foreground)]"
    )
    expect(
      screen.getByRole("button", { name: "Previous page" })
    ).toHaveAttribute("data-size", "icon-sm")
    expect(
      document.querySelectorAll('[data-slot="pagination-ellipsis"]')
    ).toHaveLength(2)

    await user.click(screen.getByRole("button", { name: "Page 6" }))

    expect(onPageChange).toHaveBeenLastCalledWith(6)
    expect(onChange).toHaveBeenLastCalledWith(6, 10)
  })

  it("changes page size through the official Select and respects disabled navigation", async () => {
    const user = userEvent.setup()
    const onPageSizeChange = vi.fn()
    const { rerender } = render(
      <PaginationController
        page={1}
        pageSize={10}
        total={80}
        pageSizeOptions={[10, 20]}
        onPageSizeChange={onPageSizeChange}
      />
    )

    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled()

    await user.click(screen.getByRole("combobox", { name: "Rows per page" }))
    await user.click(await screen.findByRole("option", { name: "20 per page" }))

    expect(onPageSizeChange).toHaveBeenLastCalledWith(20)

    rerender(
      <PaginationController
        page={1}
        pageSize={10}
        total={80}
        disabled
        onPageSizeChange={onPageSizeChange}
      />
    )

    expect(
      screen.getByRole("combobox", { name: "Rows per page" })
    ).toBeDisabled()
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled()
  })
})

type Person = {
  id: string
  profile: { name: string }
  score: number
}

const people: Person[] = [
  { id: "beta", profile: { name: "Beta" }, score: 2 },
  { id: "alpha", profile: { name: "Alpha" }, score: 10 },
]

const columns: DataTableColumn<Person>[] = [
  {
    header: "Name",
    accessor: "profile.name",
    sortable: true,
    render: (value) => <span data-testid="person-name">{String(value)}</span>,
  },
  {
    id: "score",
    header: "Score",
    accessor: (person) => person.score,
    render: (value) => `Score ${String(value)}`,
  },
]

const renderedNames = () =>
  screen.getAllByTestId("person-name").map((cell) => cell.textContent)

describe("DataTable", () => {
  it("reads nested and function accessors and cycles uncontrolled sorting", async () => {
    const user = userEvent.setup()
    const onSortChange = vi.fn()

    render(
      <DataTable
        aria-label="People"
        columns={columns}
        data={people}
        onSortChange={onSortChange}
      />
    )

    expect(renderedNames()).toEqual(["Beta", "Alpha"])
    expect(screen.getByText("Score 2")).toBeInTheDocument()

    const sortButton = screen.getByRole("button", { name: "Name" })
    const columnHeader = screen.getByRole("columnheader", { name: "Name" })

    expect(sortButton).toHaveClass(
      "text-[var(--table-header-foreground)]",
      "hover:text-[var(--table-header-foreground)]",
      "active:text-[var(--table-header-foreground)]"
    )

    await user.click(sortButton)
    expect(renderedNames()).toEqual(["Alpha", "Beta"])
    expect(columnHeader).toHaveAttribute("aria-sort", "ascending")
    expect(onSortChange).toHaveBeenLastCalledWith({
      columnId: "profile.name",
      direction: "asc",
    })

    await user.click(sortButton)
    expect(renderedNames()).toEqual(["Beta", "Alpha"])
    expect(columnHeader).toHaveAttribute("aria-sort", "descending")

    await user.click(sortButton)
    expect(renderedNames()).toEqual(["Beta", "Alpha"])
    expect(columnHeader).toHaveAttribute("aria-sort", "none")
    expect(onSortChange).toHaveBeenLastCalledWith(null)
  })

  it("keeps controlled sorting unchanged until the owner updates it", async () => {
    const user = userEvent.setup()
    const onSortChange = vi.fn()
    const ascending: DataTableSortState = {
      columnId: "profile.name",
      direction: "asc",
    }

    const { rerender } = render(
      <DataTable
        columns={columns}
        data={people}
        sortState={ascending}
        onSortChange={onSortChange}
      />
    )

    expect(renderedNames()).toEqual(["Alpha", "Beta"])
    await user.click(screen.getByRole("button", { name: "Name" }))
    expect(onSortChange).toHaveBeenLastCalledWith({
      columnId: "profile.name",
      direction: "desc",
    })
    expect(renderedNames()).toEqual(["Alpha", "Beta"])

    rerender(
      <DataTable
        columns={columns}
        data={people}
        sortState={{ columnId: "profile.name", direction: "desc" }}
        onSortChange={onSortChange}
      />
    )
    expect(renderedNames()).toEqual(["Beta", "Alpha"])
  })

  it("uses Spinner and Empty states and supports accessible row activation", async () => {
    const user = userEvent.setup()
    const onRowClick = vi.fn()
    const { rerender } = render(
      <DataTable
        aria-label="People"
        columns={columns}
        data={people}
        loading
        loadingLabel="Loading people"
      />
    )

    expect(screen.getByRole("table", { name: "People" })).toHaveAttribute(
      "aria-busy",
      "true"
    )
    expect(
      screen.getByRole("status", { name: "Loading people" })
    ).toBeInTheDocument()

    rerender(
      <DataTable columns={columns} data={[]} emptyText="No people found" />
    )
    expect(screen.getByText("No people found")).toBeInTheDocument()

    rerender(
      <DataTable
        columns={columns}
        data={[people[0]]}
        onRowClick={onRowClick}
        getRowLabel={(person) => `${person.profile.name} row`}
        getRowTone={() => "danger"}
        getRowClassName={() => "audited-row"}
      />
    )

    const row = screen.getByRole("row", { name: "Beta row" })
    const rowAction = screen.getByRole("button", { name: "Beta row" })
    expect(row).toHaveAttribute("data-tone", "danger")
    expect(row).toHaveClass("audited-row")

    await user.click(row)
    rowAction.focus()
    await user.keyboard("{Enter}")

    expect(onRowClick).toHaveBeenCalledTimes(2)
    expect(onRowClick).toHaveBeenLastCalledWith(people[0], 0)

    expect(within(row).getByText("Beta")).toBeInTheDocument()
  })

  it("uses semantic background roles for every status row tone", () => {
    const tonePeople = [
      { id: "danger", profile: { name: "Danger" }, score: 1 },
      { id: "warning", profile: { name: "Warning" }, score: 2 },
      { id: "success", profile: { name: "Success" }, score: 3 },
    ] as const

    render(
      <DataTable
        columns={columns}
        data={tonePeople}
        getRowLabel={(person) => `${person.id} row`}
        getRowTone={(person) => person.id}
        onRowClick={vi.fn()}
      />
    )

    for (const tone of ["danger", "warning", "success"] as const) {
      const row = screen.getByRole("row", { name: `${tone} row` })

      expect(row).toHaveAttribute("data-clickable", "true")
      expect(row).toHaveClass(
        `[&>td]:bg-[var(--data-table-row-${tone}-background)]`,
        `hover:[&>td]:bg-[var(--data-table-row-${tone}-background-hover)]!`,
        `data-[clickable=true]:active:[&>td]:bg-[var(--data-table-row-${tone}-background-active)]!`
      )
    }
  })
})

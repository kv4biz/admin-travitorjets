// src/components/dashboard/tables/TableRenderer.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { MoreHorizontal, Plus, Columns, ArrowUpDown, Filter } from "lucide-react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { TableSkeleton } from "./TableSkeleton";
import { EmptyState } from "./EmptyState";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { TableControls } from "./TableControls";

/* ---------------- TYPES ---------------- */

export interface ColumnConfig<T> {
  key: keyof T;
  label: string;
  primary?: boolean;
  render?: (row: T) => React.ReactNode;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterableField<T> {
  key: keyof T;
  label: string;
  options: FilterOption[];
}

interface TableRendererProps<T> {
  endpoint: string;
  columns: ColumnConfig<T>[];
  searchFields?: string[];
  showAddButton?: boolean;
  addButtonLabel?: string;
  onAdd?: () => void;
  onView?: (row: T) => void;
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
  pageSize?: number;
  refreshKey?: number;
  actions?: {
    view?: boolean;
    edit?: boolean;
    delete?: boolean;
  };
  sortableFields?: (keyof T)[];
  filterableFields?: FilterableField<T>[];
  /** Provide a custom search UI – completely replaces the default search bar */
  customSearch?: React.ReactNode;
  canEdit?: (row: T) => boolean;
  canDelete?: (row: T) => boolean;
  showSearch?: boolean; // new – default true
}

/* ---------------- COMPONENT ---------------- */

export function TableRenderer<T extends { id: string }>({
  endpoint,
  columns,
  searchFields,
  showAddButton = true,
  addButtonLabel = "Add New",
  onAdd,
  onView,
  onEdit,
  onDelete,
  pageSize = 15,
  refreshKey,
  actions,
  sortableFields,
  filterableFields = [],
  customSearch,
  canEdit,
  canDelete,
  showSearch = true, // <-- default true
}: TableRendererProps<T>) {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [search, setSearch] = useState(searchInput);

  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [totalPages, setTotalPages] = useState(1);

  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    if (typeof window === "undefined") return columns.map((c) => String(c.key));
    const saved = localStorage.getItem(`table_visible_${endpoint}`);
    return saved ? JSON.parse(saved) : columns.map((c) => String(c.key));
  });

  const [sortBy, setSortBy] = useState<keyof T | null>(() => {
    const fromUrl = searchParams.get("sortBy") as keyof T | null;
    return fromUrl && columns.some((c) => c.key === fromUrl) ? fromUrl : null;
  });
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(() => {
    const fromUrl = searchParams.get("sortOrder");
    return fromUrl === "asc" || fromUrl === "desc" ? fromUrl : "asc";
  });

  const [filters, setFilters] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    for (const f of filterableFields) {
      const param = searchParams.get(`filter_${String(f.key)}`);
      if (param) {
        initial[String(f.key)] = param.split(",");
      } else {
        initial[String(f.key)] = [];
      }
    }
    return initial;
  });

  const resolvedActions = {
    view: true,
    edit: true,
    delete: true,
    ...actions,
  };
  const hasActions = resolvedActions.view || resolvedActions.edit || resolvedActions.delete;

  // Fetching logic unchanged
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        params.set("page", String(page));
        params.set("limit", String(pageSize));
        if (searchFields) params.set("searchFields", searchFields.join(","));
        if (sortBy) {
          params.set("sortBy", String(sortBy));
          params.set("sortOrder", sortOrder);
        }
        for (const [field, values] of Object.entries(filters)) {
          if (values.length > 0) {
            params.set(`filter_${field}`, values.join(","));
          }
        }
        const res = await fetch(`${endpoint}?${params.toString()}`);
        const json = await res.json();
        setData(json.data || []);
        setTotalPages(Math.ceil((json.meta?.total || 0) / pageSize) || 1);
      } catch (err) {
        console.error(err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [endpoint, search, page, pageSize, searchFields, refreshKey, sortBy, sortOrder, filters]);

  useEffect(() => setMounted(true), []);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  useEffect(() => {
    localStorage.setItem(`table_visible_${endpoint}`, JSON.stringify(visibleColumns));
  }, [visibleColumns, endpoint]);

  const displayedColumns = useMemo(() => {
    if (!mounted) {
      return columns.filter((col) => visibleColumns.includes(String(col.key)));
    }
    if (isMobile) {
      const primaryCols = columns.filter((col) => col.primary === true);
      return primaryCols.length ? primaryCols : columns.slice(0, 2);
    }
    if (isTablet) {
      const visible = columns.filter((col) => visibleColumns.includes(String(col.key)));
      return visible.slice(0, 3);
    }
    return columns.filter((col) => visibleColumns.includes(String(col.key)));
  }, [columns, visibleColumns, isMobile, isTablet, mounted]);

  const handleSort = (field: keyof T) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const clearSort = () => {
    setSortBy(null);
    setSortOrder("asc");
    setPage(1);
  };

  const sortableFieldSet = sortableFields ? new Set(sortableFields as string[]) : new Set(columns.map((c) => String(c.key)));

  const toggleFilterValue = (fieldKey: string, value: string) => {
    setFilters((prev) => {
      const current = prev[fieldKey] || [];
      const newValues = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [fieldKey]: newValues };
    });
    setPage(1);
  };

  const clearFilters = () => {
    const empty: Record<string, string[]> = {};
    for (const f of filterableFields) {
      empty[String(f.key)] = [];
    }
    setFilters(empty);
    setPage(1);
  };

  const rowCanEdit = (row: T) => {
    if (!resolvedActions.edit) return false;
    if (canEdit) return canEdit(row);
    return true;
  };
  const rowCanDelete = (row: T) => {
    if (!resolvedActions.delete) return false;
    if (canDelete) return canDelete(row);
    return true;
  };

  const hasActiveFilters = Object.values(filters).some((arr) => arr.length > 0);

  // Pagination (unchanged)
  const renderPagination = () => {
    const pages: (number | "...")[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push("...");
    }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (page > 1) setPage(page - 1);
              }}
            />
          </PaginationItem>
          {pages.map((p, i) =>
            p === "..." ? (
              <PaginationItem key={`ellipsis-${i}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={p}>
                <PaginationLink isActive={p === page} onClick={() => setPage(p)}>
                  {p}
                </PaginationLink>
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (page < totalPages) setPage(page + 1);
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  // Top bar – handles customSearch and default controls, passing showSearch
  const renderTopBar = () => {
    if (customSearch) {
      return (
        <div className="flex items-center gap-2 w-full p-1">
          <div className="flex-1">{customSearch}</div>
          {/* Right side controls (columns, sort, filter, add) */}
          <div className="flex items-center gap-0.5 lg:gap-2 ml-auto shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Columns className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {columns.map((col) => (
                  <DropdownMenuCheckboxItem
                    key={String(col.key)}
                    checked={visibleColumns.includes(String(col.key))}
                    onCheckedChange={() => toggleColumn(String(col.key))}
                  >
                    {col.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {columns.map((col) => {
                  const colKey = String(col.key);
                  if (!sortableFieldSet.has(colKey)) return null;
                  return (
                    <DropdownMenuItem key={colKey} onClick={() => handleSort(col.key)} className="flex justify-between">
                      {col.label}
                      {sortBy === col.key && <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>}
                    </DropdownMenuItem>
                  );
                })}
                {sortBy && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={clearSort}>Clear sort</DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {filterableFields.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    {hasActiveFilters && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {filterableFields.map((field) => (
                    <div key={String(field.key)}>
                      <DropdownMenuLabel>{field.label}</DropdownMenuLabel>
                      {field.options.map((opt) => (
                        <DropdownMenuCheckboxItem
                          key={opt.value}
                          checked={(filters[String(field.key)] || []).includes(opt.value)}
                          onCheckedChange={() => toggleFilterValue(String(field.key), opt.value)}
                        >
                          {opt.label}
                        </DropdownMenuCheckboxItem>
                      ))}
                      <DropdownMenuSeparator />
                    </div>
                  ))}
                  {hasActiveFilters && <DropdownMenuItem onClick={clearFilters}>Clear all filters</DropdownMenuItem>}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {showAddButton && onAdd && (
              <Button onClick={onAdd}>
                <Plus className="h-4 w-4 lg:mr-2" />
                <span className="hidden md:inline">{addButtonLabel}</span>
              </Button>
            )}
          </div>
        </div>
      );
    }

    // Default top bar – uses TableControls, now with showSearch prop
    return (
      <TableControls
        columns={columns}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        handleSearch={handleSearch}
        handleClearSearch={handleClearSearch}
        showSearch={showSearch} // <-- passed
        showAddButton={showAddButton}
        addButtonLabel={addButtonLabel}
        onAdd={onAdd}
        visibleColumns={visibleColumns}
        toggleColumn={toggleColumn}
        sortBy={sortBy}
        sortOrder={sortOrder}
        handleSort={handleSort}
        clearSort={clearSort}
        sortableFieldSet={sortableFieldSet}
        filterableFields={filterableFields}
        filters={filters}
        toggleFilterValue={toggleFilterValue}
        clearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />
    );
  };

  return (
    <div className="w-full space-y-4" suppressHydrationWarning>
      {renderTopBar()}
      <div className="rounded-md border overflow-auto h-[calc(100vh-240px)] lg:h-[calc(100vh-210px)]">
        <Table className="min-w-full border-spacing-0">
          <TableHeader>
            <TableRow>
              {displayedColumns.map((col, index) => {
                const isFirst = index === 0;
                return (
                  <TableHead
                    key={String(col.key)}
                    className={`sticky top-0 z-40 bg-background whitespace-nowrap ${isFirst ? "left-0 z-30" : ""}`}
                    style={isFirst ? { minWidth: "140px", width: "140px" } : undefined}
                  >
                    {col.label}
                  </TableHead>
                );
              })}
              {hasActions && <TableHead className="sticky top-0 right-0 z-50 bg-background text-right whitespace-nowrap">Actions</TableHead>}
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableSkeleton columns={displayedColumns.length} rows={pageSize} />
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={displayedColumns.length + (hasActions ? 1 : 0)}>
                  <EmptyState />
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.id} className="group odd:bg-muted/50 hover:bg-muted">
                  {displayedColumns.map((col, index) => {
                    const isFirst = index === 0;
                    const stickyClass = isFirst ? "sticky left-0 z-20 bg-background group-odd:bg-muted group-hover:bg-muted" : "";
                    return (
                      <TableCell
                        key={String(col.key)}
                        className={`whitespace-nowrap ${stickyClass}`}
                        style={isFirst ? { minWidth: "140px", width: "140px" } : undefined}
                      >
                        {col.render ? col.render(row) : ((row[col.key] as React.ReactNode) ?? "—")}
                      </TableCell>
                    );
                  })}

                  {hasActions && (
                    <TableCell className="sticky right-0 z-20 bg-background group-odd:bg-muted group-hover:bg-muted text-right whitespace-nowrap">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {resolvedActions.view && <DropdownMenuItem onClick={() => onView?.(row)}>View</DropdownMenuItem>}
                          {rowCanEdit(row) && <DropdownMenuItem onClick={() => onEdit(row)}>Edit</DropdownMenuItem>}
                          {rowCanDelete(row) && (
                            <DropdownMenuItem onClick={() => onDelete(row)} className="text-destructive">
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-center">{renderPagination()}</div>
    </div>
  );
}

// src/components/dashboard/tables/TableControls.tsx
"use client";

import { Plus, Columns, Search, X, ArrowUpDown, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

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

interface TableControlsProps<T> {
  columns: ColumnConfig<T>[];
  searchInput: string;
  setSearchInput: (value: string) => void;
  handleSearch: () => void;
  handleClearSearch: () => void;
  showSearch?: boolean; // new prop
  showAddButton: boolean;
  addButtonLabel: string;
  onAdd?: () => void;
  visibleColumns: string[];
  toggleColumn: (key: string) => void;
  sortBy: keyof T | null;
  sortOrder: "asc" | "desc";
  handleSort: (field: keyof T) => void;
  clearSort: () => void;
  sortableFieldSet: Set<string>;
  filterableFields: FilterableField<T>[];
  filters: Record<string, string[]>;
  toggleFilterValue: (fieldKey: string, value: string) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

/* ---------------- COMPONENT ---------------- */

export function TableControls<T>({
  columns,
  searchInput,
  setSearchInput,
  handleSearch,
  handleClearSearch,
  showSearch = true, // default true – backward compatible
  showAddButton,
  addButtonLabel,
  onAdd,
  visibleColumns,
  toggleColumn,
  sortBy,
  sortOrder,
  handleSort,
  clearSort,
  sortableFieldSet,
  filterableFields,
  filters,
  toggleFilterValue,
  clearFilters,
  hasActiveFilters,
}: TableControlsProps<T>) {
  return (
    <div className="flex items-center gap-2 w-full px-2 py-1">
      {/* SEARCH (conditional) */}
      {showSearch && (
        <div className={`flex items-center ${showAddButton && onAdd ? "flex-1 max-w-2xl xl:max-w-3xl" : "flex-1 max-w-4xl"} `}>
          <div className="relative w-full">
            <Input
              placeholder="Search..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pr-20"
            />

            {searchInput && (
              <button
                onClick={handleClearSearch}
                type="button"
                className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            )}

            <button
              onClick={handleSearch}
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* When search is hidden, push right side controls out */}
      {!showSearch && <div className="flex-1" />}

      {/* RIGHT SIDE ACTIONS */}
      <div className="flex items-center gap-0.5 lg:gap-2 ml-auto shrink-0">
        {/* COLUMNS TOGGLE */}
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

        {/* SORT */}
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

        {/* FILTER */}
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

        {/* ADD BUTTON */}
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

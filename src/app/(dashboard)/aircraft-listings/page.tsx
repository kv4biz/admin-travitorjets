//src/(dashboard)/aircraft-listings/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { ResizableLayout } from "@/components/dashboard/layouts/ResizableLayout";
import { ActionPanel } from "@/components/dashboard/layouts/ActionPanel";
import { TableRenderer, ColumnConfig, FilterableField } from "@/components/dashboard/tables/TableRenderer";
import { FormRenderer, FormFieldConfig } from "@/components/dashboard/forms/FormRenderer";
import { ConfirmDialog } from "@/components/dashboard/dialogs/ConfirmDialog";
import { createAircraftListingSchema } from "@/lib/validations/aircraft-listing.schema";
import { content } from "@/lib/content";
import { z } from "zod";

type AircraftListing = {
  id: string;
  title: string;
  description: string | null;
  aircraft_type_id: string | null;
  aircraft_type: { id: string; name: string } | null;
  registration_number: string | null;
  year: number | null;
  price: number | null;
  currency_code: string;
  images: string[] | null;
  documents: string[] | null;
  status: "active" | "sold" | "inactive";
  created_at: string;
  updated_at: string;
};

// Table columns
const columns: ColumnConfig<AircraftListing>[] = [
  {
    key: "title",
    label: content.pages.aircraftListings.columns.title,
    primary: true,
  },
  {
    key: "registration_number",
    label: content.pages.aircraftListings.columns.registration,
    primary: true,
  },
  {
    key: "aircraft_type",
    label: content.pages.aircraftListings.columns.aircraftType,
    render: (row) => row.aircraft_type?.name || "—",
  },
  { key: "year", label: content.pages.aircraftListings.columns.year },
  {
    key: "price",
    label: content.pages.aircraftListings.columns.price,
    render: (row) =>
      row.price
        ? new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: row.currency_code || "USD",
          }).format(row.price)
        : "—",
  },
  {
    key: "status",
    label: content.pages.aircraftListings.columns.status,
    render: (row) => (
      <span className={row.status === "active" ? "text-green-600" : row.status === "sold" ? "text-gray-500" : "text-yellow-600"}>{row.status}</span>
    ),
  },
];

// Form fields
const formFields: FormFieldConfig[] = [
  {
    name: "title",
    label: content.pages.aircraftListings.form.title,
    type: "text",
    required: true,
    placeholder: content.pages.aircraftListings.form.titlePlaceholder,
  },
  {
    name: "registration_number",
    label: content.pages.aircraftListings.form.registrationNumber,
    type: "text",
    placeholder: content.pages.aircraftListings.form.registrationPlaceholder,
  },
  {
    name: "aircraft_type_id",
    label: content.pages.aircraftListings.form.aircraftType,
    type: "select",
    placeholder: content.pages.aircraftListings.form.selectTypePlaceholder,
  },
  {
    name: "year",
    label: content.pages.aircraftListings.form.year,
    type: "number",
    placeholder: content.pages.aircraftListings.form.yearPlaceholder,
  },
  {
    name: "price",
    label: content.pages.aircraftListings.form.price,
    type: "number",
    placeholder: content.pages.aircraftListings.form.pricePlaceholder,
  },
  {
    name: "currency_code",
    label: content.pages.aircraftListings.form.currency,
    type: "select",
    options: [{ value: "USD", label: "USD" }],
  },
  {
    name: "status",
    label: content.pages.aircraftListings.form.status,
    type: "select",
    options: [
      { value: "active", label: content.pages.aircraftListings.form.statusActive },
      { value: "sold", label: content.pages.aircraftListings.form.statusSold },
      { value: "inactive", label: content.pages.aircraftListings.form.statusInactive },
    ],
  },
  {
    name: "images",
    label: content.pages.aircraftListings.form.images,
    type: "image",
    bucket: "aircraft-listings",
    multiple: true,
    maxFiles: 10,
    placeholder: content.pages.aircraftListings.form.imagesHint,
  },
  {
    name: "documents",
    label: content.pages.aircraftListings.form.documents,
    type: "document",
    bucket: "aircraft-listings",
    multiple: true,
    maxFiles: 10,
    placeholder: content.pages.aircraftListings.form.documentsHint,
  },
  {
    name: "description",
    label: content.pages.aircraftListings.form.description,
    type: "textarea",
    placeholder: content.pages.aircraftListings.form.descriptionPlaceholder,
  },
];

export default function AircraftListingsPage() {
  const [mode, setMode] = useState<"create" | "edit" | "preview">("create");
  const [selectedRow, setSelectedRow] = useState<AircraftListing | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AircraftListing | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [aircraftTypes, setAircraftTypes] = useState<{ id: string; name: string }[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshTable = () => setRefreshKey((prev) => prev + 1);

  const searchFields = useMemo(() => ["title", "registration_number"], []);

  // Fetch aircraft types for select and filtering
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await fetch("/api/aircraft-types?limit=100");
        const json = await res.json();
        if (json.data) setAircraftTypes(json.data);
      } catch (error) {
        console.error("Failed to fetch aircraft types", error);
      }
    };
    fetchTypes();
  }, []);

  // Filterable fields: status and aircraft type
  const filterableFields: FilterableField<AircraftListing>[] = useMemo(() => {
    const fields: FilterableField<AircraftListing>[] = [
      {
        key: "status",
        label: "Status",
        options: [
          { label: "Active", value: "active" },
          { label: "Sold", value: "sold" },
          { label: "Inactive", value: "inactive" },
        ],
      },
    ];
    if (aircraftTypes.length > 0) {
      fields.push({
        key: "aircraft_type_id",
        label: "Aircraft Type",
        options: aircraftTypes.map((t) => ({ label: t.name, value: t.id })),
      });
    }
    return fields;
  }, [aircraftTypes]);

  const sortableFields: (keyof AircraftListing)[] = ["title", "registration_number", "year", "price", "status", "created_at"];

  // Inject options into select fields
  const fieldsWithOptions = formFields.map((field) => {
    if (field.name === "aircraft_type_id") {
      return {
        ...field,
        options: aircraftTypes.map((t) => ({ value: t.id, label: t.name })),
      };
    }
    return field;
  });

  const handleAdd = () => {
    setMode("create");
    setSelectedRow(null);
    setShowPanel(true);
  };

  const handleEdit = (row: AircraftListing) => {
    setMode("edit");
    setSelectedRow(row);
    setShowPanel(true);
  };

  const handleView = (row: AircraftListing) => {
    setMode("preview");
    setSelectedRow(row);
    setShowPanel(true);
  };

  const handleDelete = (row: AircraftListing) => {
    setDeleteTarget(row);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/aircraft-listings/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(content.pages.aircraftListings.toast.deleted);
        refreshTable();
        setDeleteTarget(null);
      } else {
        const json = await res.json();
        toast.error(json.error || content.pages.aircraftListings.toast.error);
      }
    } catch {
      toast.error(content.pages.aircraftListings.toast.error);
    }
  };

  const onSubmit = async (values: z.infer<typeof createAircraftListingSchema>) => {
    const url = mode === "create" ? "/api/aircraft-listings" : `/api/aircraft-listings/${selectedRow?.id}`;
    const method = mode === "create" ? "POST" : "PATCH";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        toast.success(mode === "create" ? content.pages.aircraftListings.toast.created : content.pages.aircraftListings.toast.updated);
        setShowPanel(false);
        refreshTable();
      } else {
        const json = await res.json();
        toast.error(json.error || content.pages.aircraftListings.toast.error);
      }
    } catch {
      toast.error(content.pages.aircraftListings.toast.error);
    }
  };

  const defaultValues = selectedRow
    ? {
        title: selectedRow.title,
        description: selectedRow.description || "",
        aircraft_type_id: selectedRow.aircraft_type_id || "",
        registration_number: selectedRow.registration_number || "",
        year: selectedRow.year ?? undefined,
        price: selectedRow.price ?? undefined,
        currency_code: selectedRow.currency_code || "USD",
        images: selectedRow.images || [],
        documents: selectedRow.documents || [],
        status: selectedRow.status || "active",
      }
    : {
        currency_code: "USD",
        status: "active",
      };

  return (
    <div className="space-y-4">
      <ResizableLayout
        showPanel={showPanel}
        table={
          <TableRenderer<AircraftListing>
            endpoint="/api/aircraft-listings"
            columns={columns}
            searchFields={searchFields}
            showAddButton
            addButtonLabel={content.pages.aircraftListings.addButton}
            onAdd={handleAdd}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            pageSize={20}
            refreshKey={refreshKey}
            sortableFields={sortableFields}
            filterableFields={filterableFields}
          />
        }
        panel={
          <ActionPanel
            title={
              mode === "create"
                ? content.pages.aircraftListings.form.createTitle
                : mode === "edit"
                  ? content.pages.aircraftListings.form.editTitle
                  : "Preview"
            }
            onCancel={() => setShowPanel(false)}
          >
            <FormRenderer
              key={`${mode}-${selectedRow?.id ?? "new"}`}
              schema={createAircraftListingSchema}
              fields={fieldsWithOptions}
              defaultValues={defaultValues}
              onSubmit={onSubmit}
              submitLabel={mode === "create" ? "Create" : "Save"}
              onCancel={() => setShowPanel(false)}
              disabled={mode === "preview"}
            />
          </ActionPanel>
        }
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Aircraft Listing"
        description={content.pages.aircraftListings.confirmDelete}
      />
    </div>
  );
}

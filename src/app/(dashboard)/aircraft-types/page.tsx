// src/app/(dashboard)/aircraft-types/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { ResizableLayout } from "@/components/dashboard/layouts/ResizableLayout";
import { ActionPanel } from "@/components/dashboard/layouts/ActionPanel";
import { TableRenderer, ColumnConfig, FilterableField } from "@/components/dashboard/tables/TableRenderer";
import { FormRenderer, FormFieldConfig } from "@/components/dashboard/forms/FormRenderer";
import { ConfirmDialog } from "@/components/dashboard/dialogs/ConfirmDialog";
import { createAircraftTypeSchema } from "@/lib/validations/aircraft-type.schema";
import { content } from "@/lib/content";
import { z } from "zod";

type AircraftType = {
  id: string;
  name: string;
  aircraft_class_id: string | null;
  aircraft_class: { id: string; name: string } | null;
  manufacturer_name: string | null;
  range_maximum: number | null;
  altitude: number | null;
  pax_maximum: number | null;
  cabin_height: number | null;
  cabin_length: number | null;
  cabin_width: number | null;
  luggage_volume: number | null;
  cruise_speed_kt: number | null;
  description: string | null;
  images?: string[];
};

const columns: ColumnConfig<AircraftType>[] = [
  { key: "name", label: content.pages.aircraftTypes.columns.name, primary: true },
  { key: "manufacturer_name", label: content.pages.aircraftTypes.columns.manufacturer, primary: true },
  { key: "aircraft_class", label: content.pages.aircraftTypes.columns.class, render: (row) => row.aircraft_class?.name || "—" },
  { key: "range_maximum", label: content.pages.aircraftTypes.columns.range },
  { key: "pax_maximum", label: content.pages.aircraftTypes.columns.pax },
  { key: "cruise_speed_kt", label: content.pages.aircraftTypes.columns.speed },
];

const formFields: FormFieldConfig[] = [
  {
    name: "name",
    label: content.pages.aircraftTypes.form.name,
    type: "text",
    required: true,
    placeholder: content.pages.aircraftTypes.form.namePlaceholder,
  },
  {
    name: "manufacturer_name",
    label: content.pages.aircraftTypes.form.manufacturer,
    type: "text",
    placeholder: content.pages.aircraftTypes.form.manufacturerPlaceholder,
  },
  {
    name: "aircraft_class_id",
    label: content.pages.aircraftTypes.form.class,
    type: "select",
    placeholder: content.pages.aircraftTypes.form.selectClassPlaceholder,
  },
  {
    name: "range_maximum",
    label: content.pages.aircraftTypes.form.range,
    type: "number",
    placeholder: content.pages.aircraftTypes.form.rangePlaceholder,
  },
  { name: "pax_maximum", label: content.pages.aircraftTypes.form.pax, type: "number", placeholder: content.pages.aircraftTypes.form.paxPlaceholder },
  {
    name: "cruise_speed_kt",
    label: content.pages.aircraftTypes.form.speed,
    type: "number",
    placeholder: content.pages.aircraftTypes.form.speedPlaceholder,
  },
  {
    name: "cabin_height",
    label: content.pages.aircraftTypes.form.cabinHeight,
    type: "number",
    placeholder: content.pages.aircraftTypes.form.cabinHeightPlaceholder,
  },
  {
    name: "cabin_length",
    label: content.pages.aircraftTypes.form.cabinLength,
    type: "number",
    placeholder: content.pages.aircraftTypes.form.cabinLengthPlaceholder,
  },
  {
    name: "cabin_width",
    label: content.pages.aircraftTypes.form.cabinWidth,
    type: "number",
    placeholder: content.pages.aircraftTypes.form.cabinWidthPlaceholder,
  },
  {
    name: "luggage_volume",
    label: content.pages.aircraftTypes.form.luggageVolume,
    type: "number",
    placeholder: content.pages.aircraftTypes.form.luggageVolumePlaceholder,
  },
  { name: "images", label: "Images", type: "image", bucket: "aircraft-images", multiple: true, maxFiles: 10, placeholder: "Upload up to 10 images" },
  {
    name: "description",
    label: content.pages.aircraftTypes.form.description,
    type: "textarea",
    placeholder: content.pages.aircraftTypes.form.descriptionPlaceholder,
  },
];

export default function AircraftTypesPage() {
  const [mode, setMode] = useState<"create" | "edit" | "preview">("create");
  const [selectedRow, setSelectedRow] = useState<AircraftType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AircraftType | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [aircraftClasses, setAircraftClasses] = useState<{ id: string; name: string }[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshTable = () => setRefreshKey((prev) => prev + 1);
  const searchFields = useMemo(() => ["name", "manufacturer_name"], []);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch("/api/aircraft-classes");
        const json = await res.json();
        if (json.data) setAircraftClasses(json.data);
      } catch (error) {
        console.error("Failed to fetch aircraft classes", error);
      }
    };
    fetchClasses();
  }, []);

  const filterableFields: FilterableField<AircraftType>[] = useMemo(() => {
    if (aircraftClasses.length === 0) return [];
    return [
      {
        key: "aircraft_class_id",
        label: "Aircraft Class",
        options: aircraftClasses.map((c) => ({ label: c.name, value: c.id })),
      },
    ];
  }, [aircraftClasses]);

  const sortableFields: (keyof AircraftType)[] = ["name", "manufacturer_name", "range_maximum", "pax_maximum", "cruise_speed_kt"];

  // Inject class options into the form select
  const fieldsWithOptions = formFields.map((field) => {
    if (field.name === "aircraft_class_id") {
      return {
        ...field,
        options: aircraftClasses.map((c) => ({ value: c.id, label: c.name })),
      };
    }
    return field;
  });

  const handleAdd = () => {
    setMode("create");
    setSelectedRow(null);
    setShowPanel(true);
  };

  const handleEdit = (row: AircraftType) => {
    setMode("edit");
    setSelectedRow(row);
    setShowPanel(true);
  };

  const handleView = (row: AircraftType) => {
    setMode("preview");
    setSelectedRow(row);
    setShowPanel(true);
  };

  const handleDelete = (row: AircraftType) => {
    setDeleteTarget(row);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/aircraft-types/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(content.pages.aircraftTypes.toast.deleted);
        refreshTable();
        setDeleteTarget(null);
      } else {
        const json = await res.json();
        toast.error(json.error || content.pages.aircraftTypes.toast.error);
      }
    } catch {
      toast.error(content.pages.aircraftTypes.toast.error);
    }
  };

  const onSubmit = async (values: z.infer<typeof createAircraftTypeSchema>) => {
    const url = mode === "create" ? "/api/aircraft-types" : `/api/aircraft-types/${selectedRow?.id}`;
    const method = mode === "create" ? "POST" : "PATCH";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        toast.success(mode === "create" ? content.pages.aircraftTypes.toast.created : content.pages.aircraftTypes.toast.updated);
        // ✅ Panel closes automatically via onSuccess callback (no setShowPanel here)
        refreshTable();
      } else {
        const json = await res.json();
        toast.error(json.error || content.pages.aircraftTypes.toast.error);
      }
    } catch {
      toast.error(content.pages.aircraftTypes.toast.error);
    }
  };

  const defaultValues = selectedRow
    ? {
        name: selectedRow.name,
        manufacturer_name: selectedRow.manufacturer_name || "",
        aircraft_class_id: selectedRow.aircraft_class_id || "",
        range_maximum: selectedRow.range_maximum ?? undefined,
        pax_maximum: selectedRow.pax_maximum ?? undefined,
        cruise_speed_kt: selectedRow.cruise_speed_kt ?? undefined,
        cabin_height: selectedRow.cabin_height ?? undefined,
        cabin_length: selectedRow.cabin_length ?? undefined,
        cabin_width: selectedRow.cabin_width ?? undefined,
        luggage_volume: selectedRow.luggage_volume ?? undefined,
        description: selectedRow.description || "",
        images: selectedRow.images || [],
      }
    : {};

  return (
    <div className="space-y-4">
      <ResizableLayout
        showPanel={showPanel}
        table={
          <TableRenderer<AircraftType>
            endpoint="/api/aircraft-types"
            columns={columns}
            searchFields={searchFields}
            showAddButton
            addButtonLabel={content.pages.aircraftTypes.addButton}
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
                ? content.pages.aircraftTypes.form.createTitle
                : mode === "edit"
                  ? content.pages.aircraftTypes.form.editTitle
                  : "Preview"
            }
            onCancel={() => setShowPanel(false)}
          >
            <FormRenderer
              key={`${mode}-${selectedRow?.id ?? "new"}`}
              schema={createAircraftTypeSchema}
              fields={fieldsWithOptions}
              defaultValues={defaultValues}
              onSubmit={onSubmit}
              submitLabel={mode === "create" ? "Create" : "Save"}
              onCancel={() => setShowPanel(false)}
              onSuccess={() => setShowPanel(false)} // ✅ panel closes only on success
              disabled={mode === "preview"}
            />
          </ActionPanel>
        }
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Aircraft Type"
        description={content.pages.aircraftTypes.confirmDelete}
      />
    </div>
  );
}

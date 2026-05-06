/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/(dashboard)/empty-legs/page.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { UseFormReturn } from "react-hook-form";
import { ResizableLayout } from "@/components/dashboard/layouts/ResizableLayout";
import { ActionPanel } from "@/components/dashboard/layouts/ActionPanel";
import { TableRenderer, ColumnConfig } from "@/components/dashboard/tables/TableRenderer";
import { FormRenderer, FormFieldConfig } from "@/components/dashboard/forms/FormRenderer";
import { ConfirmDialog } from "@/components/dashboard/dialogs/ConfirmDialog";
import { EmptyLegsSearch, EmptyLegSearchParams } from "@/components/dashboard/empty-legs/EmptyLegsSearch";
import { createEmptyLegSchema } from "@/lib/validations/empty-leg.schema";
import { content } from "@/lib/content";
import { z } from "zod";

type EmptyLeg = {
  id: string;
  source: "admin" | "pexjet";
  external_id: string | null;
  slug: string | null;
  dep_airport_id: string;
  arr_airport_id: string;
  departure_time: string;
  aircraft_type_id: string | null;
  aircraft_name: string | null;
  aircraft_category: string | null;
  aircraft_max_pax: number | null;
  aircraft_image: string | null;
  available_seats: number | null;
  total_seats: number | null;
  price: number | null;
  currency_code: string;
  price_type: "fixed" | "contact";
  destination_image_url?: string | null;
  destination_description?: string | null;
  is_public: boolean;
  dep_airport?: {
    id: string;
    name: string;
    iata: string | null;
    icao: string;
    city: string | null;
    latitude: number;
    longitude: number;
  };
  arr_airport?: {
    id: string;
    name: string;
    iata: string | null;
    icao: string;
    city: string | null;
    latitude: number;
    longitude: number;
  };
  aircraft_type?: {
    id: string;
    name: string;
    aircraft_class?: { name: string } | null;
    pax_maximum?: number | null;
    images?: string[] | null;
  } | null;
};

export default function EmptyLegsPage() {
  const [mode, setMode] = useState<"create" | "edit" | "preview">("create");
  const [selectedRow, setSelectedRow] = useState<EmptyLeg | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmptyLeg | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [searchParams, setSearchParams] = useState<EmptyLegSearchParams>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState<UseFormReturn | null>(null);

  const [aircraftTypes, setAircraftTypes] = useState<
    { id: string; name: string; aircraft_class?: { name: string } | null; pax_maximum?: number | null; images?: string[] | null }[]
  >([]);

  useEffect(() => {
    fetch("/api/aircraft-types?limit=100&select=*,aircraft_class(name)")
      .then((res) => res.json())
      .then((json) => setAircraftTypes(json.data || []))
      .catch(console.error);
  }, []);

  const refreshTable = () => setRefreshKey((prev) => prev + 1);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (searchParams.depLat) p.set("dep_lat", String(searchParams.depLat));
    if (searchParams.depLng) p.set("dep_lng", String(searchParams.depLng));
    if (searchParams.arrLat) p.set("arr_lat", String(searchParams.arrLat));
    if (searchParams.arrLng) p.set("arr_lng", String(searchParams.arrLng));
    if (searchParams.fromDate) p.set("date", searchParams.fromDate);
    if (searchParams.radiusKm !== undefined) p.set("radius_km", String(searchParams.radiusKm));
    return p.toString();
  }, [searchParams]);

  const endpoint = useMemo(() => {
    const base = "/api/empty-legs";
    return queryString ? `${base}?${queryString}` : base;
  }, [queryString]);

  const columns: ColumnConfig<EmptyLeg>[] = [
    {
      key: "dep_airport",
      label: content.pages.emptyLegs.columns.from,
      render: (row) => (row.dep_airport ? `${row.dep_airport.iata || row.dep_airport.icao} – ${row.dep_airport.city || ""}` : "—"),
    },
    {
      key: "arr_airport",
      label: content.pages.emptyLegs.columns.to,
      render: (row) => (row.arr_airport ? `${row.arr_airport.iata || row.arr_airport.icao} – ${row.arr_airport.city || ""}` : "—"),
    },
    {
      key: "departure_time",
      label: content.pages.emptyLegs.columns.departure,
      render: (row) => new Date(row.departure_time).toLocaleString(),
    },
    { key: "aircraft_name", label: content.pages.emptyLegs.columns.aircraft },
    {
      key: "available_seats",
      label: content.pages.emptyLegs.columns.seats,
      render: (row) => `${row.available_seats ?? "?"} / ${row.total_seats ?? "?"}`,
    },
    {
      key: "price",
      label: content.pages.emptyLegs.columns.price,
      render: (row) =>
        row.price_type === "contact"
          ? "Contact"
          : new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: row.currency_code,
            }).format(row.price ?? 0),
    },
    {
      key: "source",
      label: content.pages.emptyLegs.columns.source,
      render: (row) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            row.source === "pexjet" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
          }`}
        >
          {row.source === "pexjet" ? "PexJet" : "Admin"}
        </span>
      ),
    },
  ];

  const formFields: FormFieldConfig[] = [
    {
      name: "dep_airport_id",
      label: content.pages.emptyLegs.form.depAirport,
      type: "airport",
      required: true,
      placeholder: content.pages.emptyLegs.form.depAirportPlaceholder,
    },
    {
      name: "arr_airport_id",
      label: content.pages.emptyLegs.form.arrAirport,
      type: "airport",
      required: true,
      placeholder: content.pages.emptyLegs.form.arrAirportPlaceholder,
    },
    {
      name: "departure_time",
      label: content.pages.emptyLegs.form.departureTime,
      type: "datetime",
      required: true,
    },
    {
      name: "aircraft_type_id",
      label: content.pages.emptyLegs.form.aircraftType,
      type: "select",
      placeholder: content.pages.emptyLegs.form.aircraftTypePlaceholder,
    },
    {
      name: "available_seats",
      label: content.pages.emptyLegs.form.availableSeats,
      type: "number",
    },
    {
      name: "price_type",
      label: content.pages.emptyLegs.form.priceType,
      type: "select",
      options: [
        { value: "fixed", label: content.pages.emptyLegs.form.fixed },
        { value: "contact", label: content.pages.emptyLegs.form.contact },
      ],
    },
    {
      name: "price",
      label: content.pages.emptyLegs.form.price,
      type: "number",
    },
    {
      name: "currency_code",
      label: content.pages.emptyLegs.form.currency,
      type: "select",
      options: [{ value: "USD", label: "USD" }],
    },
    {
      name: "destination_image_url",
      label: content.pages.emptyLegs.form.destinationImageUrl,
      type: "image",
      bucket: "aircraft-images",
      maxFiles: 1,
    },
    {
      name: "destination_description",
      label: content.pages.emptyLegs.form.destinationDescription,
      type: "textarea",
      placeholder: content.pages.emptyLegs.form.destinationDescriptionPlaceholder,
    },
    {
      name: "comment",
      label: content.pages.emptyLegs.form.comment,
      type: "textarea",
      placeholder: content.pages.emptyLegs.form.commentPlaceholder,
    },
  ];

  const previewFields: FormFieldConfig[] = [
    { name: "aircraft_name", label: content.pages.emptyLegs.form.aircraftName, type: "text" },
    { name: "aircraft_category", label: content.pages.emptyLegs.form.aircraftCategory, type: "text" },
    { name: "aircraft_max_pax", label: content.pages.emptyLegs.form.maxPax, type: "number" },
    {
      name: "aircraft_image",
      label: "Aircraft Image",
      type: "image",
      bucket: "aircraft-images",
      maxFiles: 1,
    },
  ];

  const priceType = form?.watch("price_type");
  const aircraftTypeId = form?.watch("aircraft_type_id");

  const fieldsToRender = useMemo(() => {
    let fields = mode === "preview" ? [...formFields, ...previewFields] : [...formFields];

    if (priceType === "contact") {
      fields = fields.filter((f) => f.name !== "price");
    }

    return fields.map((field) => {
      if (field.name === "aircraft_type_id") {
        return {
          ...field,
          options: aircraftTypes.map((t) => ({ value: t.id, label: t.name })),
        };
      }
      return field;
    });
  }, [mode, priceType, aircraftTypes]);

  // Auto‑fill aircraft details when aircraft type changes
  useEffect(() => {
    if (!form || !aircraftTypeId) return;
    const selected = aircraftTypes.find((t) => t.id === aircraftTypeId);
    if (selected) {
      form.setValue("aircraft_name", selected.name);
      form.setValue("aircraft_category", selected.aircraft_class?.name || "");
      form.setValue("aircraft_image", selected.images?.[0] ?? "");
      form.setValue("aircraft_max_pax", selected.pax_maximum ?? undefined);
      // Only set available_seats if it's not already set (e.g., when creating a new record)
      if (form.getValues("available_seats") === undefined || form.getValues("available_seats") === null) {
        form.setValue("available_seats", selected.pax_maximum ?? undefined);
      }
    }
  }, [aircraftTypeId, form, aircraftTypes]);

  // Clear price when switching to contact type
  useEffect(() => {
    if (priceType === "contact" && form) {
      form.setValue("price", undefined);
    }
  }, [priceType, form]);

  // Clamp available_seats to never exceed aircraft_max_pax
  useEffect(() => {
    if (!form) return;
    const subscription = form.watch((value) => {
      const avail = value.available_seats;
      const max = value.aircraft_max_pax;
      if (typeof avail === "number" && typeof max === "number" && avail > max) {
        form.setValue("available_seats", max, { shouldValidate: true });
        toast.info("Available seats cannot exceed the aircraft’s maximum capacity.");
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleAdd = () => {
    setMode("create");
    setSelectedRow(null);
    setShowPanel(true);
  };
  const handleEdit = (row: EmptyLeg) => {
    setMode("edit");
    setSelectedRow(row);
    setShowPanel(true);
  };
  const handleView = (row: EmptyLeg) => {
    setMode("preview");
    setSelectedRow(row);
    setShowPanel(true);
  };
  const handleDelete = (row: EmptyLeg) => setDeleteTarget(row);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/empty-legs/${deleteTarget.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(content.pages.emptyLegs.toast.deleted);
      refreshTable();
      setDeleteTarget(null);
    } else {
      const json = await res.json();
      toast.error(json.error || content.pages.emptyLegs.toast.error);
    }
  };

  const onSubmit = async (values: z.infer<typeof createEmptyLegSchema>) => {
    if (values.aircraft_type_id && !values.total_seats) {
      const selectedType = aircraftTypes.find((t) => t.id === values.aircraft_type_id);
      if (selectedType) {
        values.aircraft_name = values.aircraft_name || selectedType.name;
        values.aircraft_category = values.aircraft_category || selectedType.aircraft_class?.name || "";
        values.aircraft_max_pax = values.aircraft_max_pax ?? selectedType.pax_maximum ?? undefined;
        values.aircraft_image = values.aircraft_image || selectedType.images?.[0] || "";
        if (values.available_seats === undefined) {
          values.available_seats = selectedType.pax_maximum ?? undefined;
        }
        values.total_seats = values.aircraft_max_pax ?? selectedType.pax_maximum ?? undefined;
      } else {
        values.total_seats = values.aircraft_max_pax;
      }
    } else {
      values.total_seats = values.aircraft_max_pax;
    }

    if (values.price_type === "contact") {
      values.price = undefined;
    }

    const url = mode === "create" ? "/api/empty-legs" : `/api/empty-legs/${selectedRow?.id}`;
    const method = mode === "create" ? "POST" : "PATCH";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (res.ok) {
      toast.success(mode === "create" ? content.pages.emptyLegs.toast.created : content.pages.emptyLegs.toast.updated);
      setShowPanel(false);
      refreshTable();
    } else {
      const json = await res.json();
      toast.error(json.error || content.pages.emptyLegs.toast.error);
    }
  };

  const defaultValues = useMemo(() => {
    if (!selectedRow) return {};

    const toAirportObject = (joined: any, id: string): any => {
      if (joined && typeof joined === "object" && joined.id) {
        return {
          id: joined.id,
          name: joined.name || "",
          iata: joined.iata || null,
          icao: joined.icao || "",
          city: joined.city || null,
          country: joined.country || null,
          latitude: joined.latitude || null,
          longitude: joined.longitude || null,
        };
      }
      return {
        id,
        name: "",
        iata: null,
        icao: "",
        city: null,
        country: null,
        latitude: null,
        longitude: null,
      };
    };

    let isoDeparture = "";
    if (selectedRow.departure_time) {
      const d = new Date(selectedRow.departure_time);
      if (!isNaN(d.getTime())) {
        isoDeparture = d.toISOString();
      }
    }

    return {
      dep_airport_id: toAirportObject(selectedRow.dep_airport, selectedRow.dep_airport_id),
      arr_airport_id: toAirportObject(selectedRow.arr_airport, selectedRow.arr_airport_id),
      departure_time: isoDeparture,
      aircraft_type_id: selectedRow.aircraft_type_id || "",
      aircraft_name: selectedRow.aircraft_name || "",
      aircraft_category: selectedRow.aircraft_category || "",
      aircraft_max_pax: selectedRow.aircraft_max_pax ?? undefined,
      aircraft_image: selectedRow.aircraft_image || "",
      available_seats: selectedRow.available_seats ?? undefined,
      price_type: selectedRow.price_type || "fixed",
      price: selectedRow.price ?? undefined,
      currency_code: selectedRow.currency_code,
      destination_image_url: selectedRow.destination_image_url || "",
      destination_description: selectedRow.destination_description || "",
      comment: "",
    };
  }, [selectedRow]);

  return (
    <div className="space-y-4">
      <ResizableLayout
        showPanel={showPanel}
        table={
          <TableRenderer<EmptyLeg>
            endpoint={endpoint}
            columns={columns}
            searchFields={[]}
            showAddButton
            addButtonLabel={content.pages.emptyLegs.addButton}
            onAdd={handleAdd}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            pageSize={50}
            refreshKey={refreshKey}
            sortableFields={["departure_time", "price", "available_seats"]}
            filterableFields={[
              {
                key: "source",
                label: "Source",
                options: [
                  { label: "PexJet", value: "pexjet" },
                  { label: "Admin", value: "admin" },
                ],
              },
              {
                key: "price_type",
                label: "Price Type",
                options: [
                  { label: "Fixed", value: "fixed" },
                  { label: "Contact", value: "contact" },
                ],
              },
            ]}
            customSearch={<EmptyLegsSearch onSearch={setSearchParams} />}
            canEdit={(row) => row.source === "admin"}
            canDelete={(row) => row.source === "admin"}
          />
        }
        panel={
          <ActionPanel
            title={
              mode === "create"
                ? content.pages.emptyLegs.form.createTitle
                : mode === "edit"
                  ? content.pages.emptyLegs.form.editTitle
                  : "View Empty Leg"
            }
            onCancel={() => setShowPanel(false)}
          >
            <FormRenderer
              key={`${mode}-${selectedRow?.id ?? "new"}`}
              schema={createEmptyLegSchema}
              fields={fieldsToRender}
              defaultValues={defaultValues}
              onSubmit={onSubmit}
              submitLabel={mode === "create" ? "Create" : "Save"}
              onCancel={() => setShowPanel(false)}
              onSuccess={() => setShowPanel(false)}
              disabled={mode === "preview"}
              onFormReady={setForm}
            />
          </ActionPanel>
        }
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Empty Leg"
        description={content.pages.emptyLegs.confirmDelete}
      />
    </div>
  );
}

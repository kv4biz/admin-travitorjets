//src/app/(dashboard)/airports/page.tsx
"use client";

import { useState, useMemo } from "react";
import { ResizableLayout } from "@/components/dashboard/layouts/ResizableLayout";
import { ActionPanel } from "@/components/dashboard/layouts/ActionPanel";
import { TableRenderer, ColumnConfig, FilterableField } from "@/components/dashboard/tables/TableRenderer";
import { FormRenderer, FormFieldConfig } from "@/components/dashboard/forms/FormRenderer";
import { content } from "@/lib/content";
import { AirportSchema, AirportFormValues } from "@/lib/validations/airport.schema";

type Airport = {
  id: string;
  icao: string;
  iata: string | null;
  lid: string | null;
  name: string;
  city: string | null;
  country: string | null;
  country_code: string | null;
  latitude: number | null;
  longitude: number | null;
  size: string | null;
  continent: string | null;
};

const columns: ColumnConfig<Airport>[] = [
  { key: "name", label: content.pages.airports.columns.name, primary: true },
  { key: "icao", label: content.pages.airports.columns.icao, primary: true },
  { key: "iata", label: content.pages.airports.columns.iata },
  { key: "city", label: content.pages.airports.columns.city },
  { key: "country", label: content.pages.airports.columns.country },
  { key: "size", label: "Size" },
  { key: "continent", label: "Continent" },
];

const sortableFields: (keyof Airport)[] = ["icao", "iata", "name", "city", "country", "size", "continent"];

const filterableFields: FilterableField<Airport>[] = [
  {
    key: "size",
    label: "Airport Size",
    options: [
      { label: "Small", value: "small_airport" },
      { label: "Medium", value: "medium_airport" },
      { label: "Large", value: "large_airport" },
    ],
  },
  {
    key: "continent",
    label: "Continent",
    options: [
      { label: "Africa", value: "AF" },
      { label: "Antarctica", value: "AN" },
      { label: "Asia", value: "AS" },
      { label: "Europe", value: "EU" },
      { label: "North America", value: "NA" },
      { label: "Oceania", value: "OC" },
      { label: "South America", value: "SA" },
    ],
  },
];

const formFields: FormFieldConfig[] = [
  { name: "icao", label: "ICAO", type: "text", required: true },
  { name: "iata", label: "IATA", type: "text" },
  { name: "lid", label: "Local Identifier (LID)", type: "text" },
  { name: "name", label: "Airport Name", type: "text", required: true },
  { name: "city", label: "City", type: "text" },
  { name: "country", label: "Country", type: "text" },
  { name: "country_code", label: "Country Code", type: "text" },
  { name: "latitude", label: "Latitude", type: "number" },
  { name: "longitude", label: "Longitude", type: "number" },
  { name: "size", label: "Size", type: "text" },
  { name: "continent", label: "Continent", type: "text" },
];

export default function AirportsPage() {
  const [selectedRow, setSelectedRow] = useState<Airport | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [refreshKey] = useState(0);

  const searchFields = useMemo(() => ["icao", "iata", "name", "city", "country", "continent"], []);

  const handleView = (row: Airport) => {
    setSelectedRow(row);
    setShowPanel(true);
  };

  // No-op handlers (required by TableRenderer but not used)
  const handleAdd = () => {};
  const handleEdit = () => {};
  const handleDelete = () => {};

  const defaultValues = selectedRow
    ? {
        icao: selectedRow.icao,
        iata: selectedRow.iata || "",
        lid: selectedRow.lid || "",
        name: selectedRow.name,
        city: selectedRow.city || "",
        country: selectedRow.country || "",
        country_code: selectedRow.country_code || "",
        latitude: selectedRow.latitude ?? undefined,
        longitude: selectedRow.longitude ?? undefined,
        size: selectedRow.size || "",
        continent: selectedRow.continent || "",
      }
    : {};

  const onSubmit = async (values: AirportFormValues) => {
    // Preview only – no submission
    console.log(values);
  };

  return (
    <div className="space-y-4">
      <ResizableLayout
        showPanel={showPanel}
        table={
          <TableRenderer<Airport>
            endpoint="/api/airports"
            columns={columns}
            searchFields={searchFields}
            showAddButton={false}
            onAdd={handleAdd}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            pageSize={50}
            refreshKey={refreshKey}
            actions={{ view: true, edit: false, delete: false }}
            sortableFields={sortableFields}
            filterableFields={filterableFields}
          />
        }
        panel={
          <ActionPanel title={content.pages.airports.form.title || "Airport Details"} onCancel={() => setShowPanel(false)}>
            <FormRenderer
              key={selectedRow?.id ?? "none"}
              schema={AirportSchema}
              fields={formFields}
              defaultValues={defaultValues}
              onSubmit={onSubmit}
              submitLabel=""
              onCancel={() => setShowPanel(false)}
              disabled={true}
            />
          </ActionPanel>
        }
      />
    </div>
  );
}

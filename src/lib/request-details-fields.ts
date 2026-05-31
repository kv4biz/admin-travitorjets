// src/lib/request-details-fields.ts
import { FormFieldConfig } from "@/components/dashboard/forms/FormRenderer";

type RequestType = "empty_leg_inquiry" | "charter" | "aircraft_inquiry";

const EMPTY_LEG_FIELDS: FormFieldConfig[] = [
  { name: "departure_airport_id", label: "Departure Airport", type: "airport", editable: false },
  { name: "arrival_airport_id", label: "Arrival Airport", type: "airport", editable: false },
  { name: "departure_time", label: "Departure Time", type: "datetime", editable: false },
  { name: "aircraft_name", label: "Aircraft Name", type: "text", editable: false },
  { name: "aircraft_category", label: "Category", type: "text", editable: false },
  { name: "aircraft_image", label: "Aircraft Image", type: "image", editable: false },
  { name: "available_seats", label: "Available Seats", type: "number", editable: false },
  { name: "passengers", label: "Passengers Requested", type: "number", editable: false },
  { name: "message", label: "Additional Notes", type: "textarea", editable: false },
  {
    name: "price",
    label: "Current Price",
    type: "text",
    editable: false,
    render: (value: unknown) => {
      const numValue = value as number | null;
      return numValue == null ? "Contact" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(numValue);
    },
  },
  { name: "currency_code", label: "Currency", type: "text", editable: false },
  { name: "price_agreed", label: "Negotiated Price", type: "number", editable: true },
];

const CHARTER_FIELDS: FormFieldConfig[] = [
  { name: "departure_airport_id", label: "Departure Airport", type: "airport", editable: true },
  { name: "arrival_airport_id", label: "Arrival Airport", type: "airport", editable: true },
  { name: "departure_time", label: "Departure Time", type: "datetime", editable: true },
  { name: "aircraft_class_id", label: "Aircraft Class", type: "select", placeholder: "Select class", editable: true },
  { name: "aircraft_type_id", label: "Aircraft Type", type: "select", placeholder: "Select type", editable: true },
  { name: "passengers", label: "Passengers", type: "number", editable: true },
  { name: "price_agreed", label: "Price Agreed", type: "number", editable: true },
  { name: "currency_code", label: "Currency Code", type: "text", editable: false },
  { name: "date_range_days", label: "Date Range (days)", type: "number", editable: false },
  { name: "radius_km", label: "Radius (km)", type: "number", editable: false },
  { name: "additional_notes", label: "Additional Notes", type: "textarea", editable: true },
];

const AIRCRAFT_INQUIRY_FIELDS: FormFieldConfig[] = [
  { name: "aircraft_model", label: "Aircraft Model", type: "text", editable: false },
  { name: "manufacturer", label: "Manufacturer", type: "text", editable: false },
  { name: "year", label: "Year", type: "number", editable: false },
  { name: "price_agreed", label: "Price Agreed", type: "number", editable: true },
  { name: "currency_code", label: "Currency Code", type: "text", editable: false },
  { name: "financing", label: "Financing / Purchase", type: "text", editable: true },
  { name: "budget", label: "Budget", type: "number", editable: true },
  { name: "comments", label: "Comments", type: "textarea", editable: true },
];

export function getRequestDetailsFields(type: string): FormFieldConfig[] {
  switch (type as RequestType) {
    case "empty_leg_inquiry":
      return EMPTY_LEG_FIELDS;
    case "charter":
      return CHARTER_FIELDS;
    case "aircraft_inquiry":
      return AIRCRAFT_INQUIRY_FIELDS;
    default:
      return [];
  }
}

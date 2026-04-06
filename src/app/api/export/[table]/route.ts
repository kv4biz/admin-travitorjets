//src/app/api/export/[table]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withManagerAuth, apiError } from "@/lib/api-utils";

const ALLOWED_TABLES = [
  "profiles",
  "requests",
  "invoices",
  "payments",
  "empty_legs",
  "aircraft_listings",
] as const;

type AllowedTable = (typeof ALLOWED_TABLES)[number];

type ExportRow = Record<string, unknown>;

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str =
    typeof value === "string"
      ? value
      : typeof value === "number" || typeof value === "boolean"
        ? String(value)
        : JSON.stringify(value);

  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowsToCsv(rows: ExportRow[]): string {
  if (rows.length === 0) return "";

  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((k) => set.add(k));
      return set;
    }, new Set<string>()),
  );

  const lines: string[] = [];
  lines.push(headers.map(escapeCsvValue).join(","));

  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsvValue(row[h])).join(","));
  }

  return lines.join("\n");
}

export async function GET(
  request: NextRequest,
  { params }: { params: { table: string } },
) {
  return withManagerAuth(async (_, supabase) => {
    const table = params.table as AllowedTable;

    if (!ALLOWED_TABLES.includes(table)) {
      return apiError("Invalid table", 400);
    }

    const { data, error } = await supabase.from(table).select("*");
    if (error) return apiError(error.message, 500);

    const csv = rowsToCsv((data || []) as ExportRow[]);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=export_${table}.csv`,
      },
    });
  });
}

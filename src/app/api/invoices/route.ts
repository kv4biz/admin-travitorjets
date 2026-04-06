//src/app/api/invoices/route.ts
import { NextRequest } from "next/server";
import {
  withAdminAuth,
  apiSuccess,
  apiError,
  getPagination,
  parseBody,
} from "@/lib/api-utils";
import { createInvoiceSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  return withAdminAuth(async (_, supabase) => {
    const searchParams = request.nextUrl.searchParams;
    const { from, to, page, limit } = getPagination(searchParams);
    let query = supabase
      .from("invoices")
      .select("*, request:request_id(*)", { count: "exact" });

    if (searchParams.has("status")) {
      query = query.eq("status", searchParams.get("status")!);
    }
    if (searchParams.has("request_id")) {
      query = query.eq("request_id", searchParams.get("request_id")!);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) return apiError(error.message, 500);
    return apiSuccess(data, { page, limit, total: count || 0 });
  });
}

export async function POST(request: NextRequest) {
  return withAdminAuth(async (user, supabase) => {
    const { data: body, error: parseError } = await parseBody(request);
    if (parseError) return apiError(parseError, 400);

    const validation = createInvoiceSchema.safeParse(body);
    if (!validation.success) {
      return apiError(validation.error.issues[0].message, 400);
    }

    const { data, error } = await supabase
      .from("invoices")
      .insert(validation.data)
      .select()
      .single();

    if (error) return apiError(error.message, 500);
    return apiSuccess(data);
  });
}

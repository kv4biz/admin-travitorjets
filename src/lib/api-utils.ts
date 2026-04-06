import { NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { User } from "@supabase/supabase-js";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

type SupabaseClientType = SupabaseClient<Database>;

/**
 * Success response
 */
export function apiSuccess<T>(
  data: T,
  meta?: { page?: number; limit?: number; total?: number },
) {
  if (meta) {
    return NextResponse.json({ data, error: null, meta });
  }
  return NextResponse.json({ data, error: null });
}

/**
 * Error response
 */
export function apiError(message: string, status: number = 400) {
  return NextResponse.json({ data: null, error: message }, { status });
}

/**
 * Parse JSON body safely
 */
export async function parseBody<T>(
  request: Request,
): Promise<{ data: T | null; error: string | null }> {
  try {
    const body = await request.json();
    return { data: body as T, error: null };
  } catch {
    return { data: null, error: "Invalid JSON body" };
  }
}

/**
 * Pagination helper (offset-based)
 */
export function getPagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") || "20")),
  );
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  return { from, to, page, limit };
}

/**
 * Base auth wrapper (checks authentication only)
 */
export async function withAuth(
  handler: (user: User, supabase: SupabaseClientType) => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      return apiError("Unauthorized", 401);
    }
    return await handler(user, supabase);
  } catch (error) {
    console.error("Auth error:", error);
    return apiError("Internal server error", 500);
  }
}

/**
 * Admin auth wrapper – requires role 'staff' or 'manager'
 */
export async function withAdminAuth(
  handler: (user: User, supabase: SupabaseClientType) => Promise<NextResponse>,
): Promise<NextResponse> {
  return withAuth(async (user, supabase) => {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error || !profile || !["staff", "manager"].includes(profile.role)) {
      return apiError("Forbidden: Admin access required", 403);
    }
    return handler(user, supabase);
  });
}

/**
 * Manager auth wrapper – requires role 'manager'
 */
export async function withManagerAuth(
  handler: (user: User, supabase: SupabaseClientType) => Promise<NextResponse>,
): Promise<NextResponse> {
  return withAuth(async (user, supabase) => {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error || !profile || profile.role !== "manager") {
      return apiError("Forbidden: Manager access required", 403);
    }
    return handler(user, supabase);
  });
}

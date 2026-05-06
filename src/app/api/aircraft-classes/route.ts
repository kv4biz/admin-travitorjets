//src/app/api/aircraft-classes/route.ts
import { withAdminAuth, apiSuccess, apiError } from "@/lib/api-utils";

export async function GET() {
  return withAdminAuth(async (_, supabase) => {
    const { data, error } = await supabase
      .from("aircraft_classes")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) return apiError(error.message, 500);

    return apiSuccess(data);
  });
}

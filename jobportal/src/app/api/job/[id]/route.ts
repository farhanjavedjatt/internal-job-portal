import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!id || id.length > 64) return NextResponse.json({ error: "bad id" }, { status: 400 });

  const sb = await getServerSupabase();
  const { data, error } = await sb
    .from("jobs")
    .select("id,description")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "not found" }, { status: 404 });
  }
  return NextResponse.json({ id: data.id, description: data.description ?? "" });
}

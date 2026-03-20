import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

async function getSuperadminStatus(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  return data?.role === "superadmin";
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isSuperadmin = await getSuperadminStatus(supabase, user.id);
  if (!isSuperadmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const serviceClient = await createServiceClient();
  const { data: authUsers, error: listError } = await serviceClient.auth.admin.listUsers();
  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  const { data: profiles } = await serviceClient
    .from("profiles")
    .select("id, full_name, avatar_url, role, is_approved");

  const profileMap = new Map((profiles ?? []).map((p: { id: string; full_name: string | null; avatar_url: string | null; role: string; is_approved: boolean }) => [p.id, p]));

  const users = authUsers.users.map((u) => {
    const profile = profileMap.get(u.id) as { full_name: string | null; avatar_url: string | null; role: string; is_approved: boolean } | undefined;
    return {
      id: u.id,
      email: u.email,
      full_name: profile?.full_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      role: profile?.role ?? "user",
      is_approved: profile?.is_approved ?? false,
      created_at: u.created_at,
    };
  });

  return NextResponse.json(users);
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isSuperadmin = await getSuperadminStatus(supabase, user.id);
  if (!isSuperadmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { userId, is_approved, role } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof is_approved === "boolean") updates.is_approved = is_approved;
  if (typeof role === "string") updates.role = role;

  const serviceClient = await createServiceClient();
  const { error } = await serviceClient
    .from("profiles")
    .update(updates)
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

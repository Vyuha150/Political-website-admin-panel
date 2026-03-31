// app/api/check-role/route.ts
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const access_token = cookieStore.get("sb-access-token")?.value;

  if (!access_token) {
    return NextResponse.json({ role: null }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { role: null, error: "Missing Supabase environment variables" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    },
  });

  // Get user info from the access token
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(access_token);

  if (userError || !user) {
    return NextResponse.json({ role: null }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ role: null }, { status: 403 });
  }

  return NextResponse.json({ role: profile.role });
}

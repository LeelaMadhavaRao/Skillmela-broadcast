import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

function generateCode(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// POST - Create a new broadcast
export async function POST(request: NextRequest) {
  try {
    const { admin_name, password } = await request.json();

    if (!admin_name || !password) {
      return NextResponse.json(
        { error: "Admin name and password are required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Generate unique code
    let code: string;
    let attempts = 0;
    do {
      code = generateCode();
      const { data: existing } = await supabase
        .from("broadcasts")
        .select("id")
        .eq("code", code)
        .single();

      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      return NextResponse.json(
        { error: "Failed to generate unique code. Please try again." },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from("broadcasts")
      .insert({ code, admin_name, password })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Get broadcasts by admin name
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const admin_name = searchParams.get("admin_name");

    if (!admin_name) {
      return NextResponse.json(
        { error: "Admin name is required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("broadcasts")
      .select("*")
      .eq("admin_name", admin_name)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

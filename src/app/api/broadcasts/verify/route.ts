import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { code, password, admin_name, role } = await request.json();

    if (!code || !role) {
      return NextResponse.json(
        { error: "Code and role are required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Look up broadcast by code
    const { data: broadcast, error } = await supabase
      .from("broadcasts")
      .select("*")
      .eq("code", code)
      .single();

    if (error || !broadcast) {
      return NextResponse.json(
        { error: "Broadcast code does not exist" },
        { status: 404 }
      );
    }

    // For instructor: verify password
    if (role === "instructor") {
      if (!password) {
        return NextResponse.json(
          { error: "Password is required for instructor" },
          { status: 400 }
        );
      }
      if (broadcast.password !== password) {
        return NextResponse.json(
          { error: "Incorrect password" },
          { status: 401 }
        );
      }
    }

    // For administrator: verify admin_name and password
    if (role === "administrator") {
      if (!admin_name || !password) {
        return NextResponse.json(
          { error: "Admin name and password are required" },
          { status: 400 }
        );
      }
      if (broadcast.admin_name !== admin_name) {
        return NextResponse.json(
          { error: "Incorrect administrator name" },
          { status: 401 }
        );
      }
      if (broadcast.password !== password) {
        return NextResponse.json(
          { error: "Incorrect password" },
          { status: 401 }
        );
      }
    }

    // For student: just check code exists (already done above)

    return NextResponse.json({
      success: true,
      broadcast_id: broadcast.id,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

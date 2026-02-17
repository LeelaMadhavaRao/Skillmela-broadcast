import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const admin_name = searchParams.get("admin_name");
    const password = searchParams.get("password");

    if (!admin_name || !password) {
      return NextResponse.json(
        { error: "Admin name and password are required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Verify ownership
    const { data: broadcast, error: findError } = await supabase
      .from("broadcasts")
      .select("*")
      .eq("id", id)
      .single();

    if (findError || !broadcast) {
      return NextResponse.json(
        { error: "Broadcast not found" },
        { status: 404 }
      );
    }

    if (broadcast.admin_name !== admin_name || broadcast.password !== password) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Delete all files in storage for this broadcast
    const { data: messages } = await supabase
      .from("messages")
      .select("file_url")
      .eq("broadcast_id", id)
      .not("file_url", "is", null);

    if (messages && messages.length > 0) {
      const filePaths = messages
        .map((m) => {
          if (!m.file_url) return null;
          const url = new URL(m.file_url);
          const parts = url.pathname.split("/broadcast-files/");
          return parts.length > 1 ? parts[1] : null;
        })
        .filter(Boolean) as string[];

      if (filePaths.length > 0) {
        await supabase.storage.from("broadcast-files").remove(filePaths);
      }
    }

    // Delete broadcast (cascade deletes messages)
    const { error: deleteError } = await supabase
      .from("broadcasts")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

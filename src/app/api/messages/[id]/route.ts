import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// PATCH - Update a message
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { content, password } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    // Get message to find broadcast, then verify password
    const { data: message } = await supabase
      .from("messages")
      .select("broadcast_id")
      .eq("id", id)
      .single();

    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    const { data: broadcast } = await supabase
      .from("broadcasts")
      .select("password")
      .eq("id", message.broadcast_id)
      .single();

    if (!broadcast || broadcast.password !== password) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid password" },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("messages")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

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

// DELETE - Delete a message
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const password = searchParams.get("password");

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    // Get message first to check for file and verify password
    const { data: message } = await supabase
      .from("messages")
      .select("*")
      .eq("id", id)
      .single();

    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    // Verify password against parent broadcast
    const { data: broadcast } = await supabase
      .from("broadcasts")
      .select("password")
      .eq("id", message.broadcast_id)
      .single();

    if (!broadcast || broadcast.password !== password) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid password" },
        { status: 401 }
      );
    }

    if (message?.file_url) {
      const url = new URL(message.file_url);
      const parts = url.pathname.split("/broadcast-files/");
      if (parts.length > 1) {
        await supabase.storage.from("broadcast-files").remove([parts[1]]);
      }
    }

    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

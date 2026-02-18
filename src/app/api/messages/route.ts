import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// GET - Get all messages for a broadcast
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Broadcast code is required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get broadcast by code
    const { data: broadcast, error: broadcastError } = await supabase
      .from("broadcasts")
      .select("id")
      .eq("code", code)
      .single();

    if (broadcastError || !broadcast) {
      return NextResponse.json(
        { error: "Broadcast not found" },
        { status: 404 }
      );
    }

    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("broadcast_id", broadcast.id)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ messages, broadcast_id: broadcast.id });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Send a message (text or file)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const broadcast_id = formData.get("broadcast_id") as string;
    const content = formData.get("content") as string | null;
    const file = formData.get("file") as File | null;
    const password = formData.get("password") as string | null;

    if (!broadcast_id) {
      return NextResponse.json(
        { error: "Broadcast ID is required" },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "Password is required for sending messages" },
        { status: 401 }
      );
    }

    if (!content && !file) {
      return NextResponse.json(
        { error: "Message content or file is required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Verify password against broadcast
    const { data: broadcast, error: broadcastError } = await supabase
      .from("broadcasts")
      .select("password")
      .eq("id", broadcast_id)
      .single();

    if (broadcastError || !broadcast) {
      return NextResponse.json(
        { error: "Broadcast not found" },
        { status: 404 }
      );
    }

    if (broadcast.password !== password) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid password" },
        { status: 401 }
      );
    }

    let file_url: string | null = null;
    let file_name: string | null = null;

    if (file) {
      const ext = file.name.split(".").pop();
      const fileName = `${broadcast_id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from("broadcast-files")
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json(
          { error: "Failed to upload file: " + uploadError.message },
          { status: 500 }
        );
      }

      const { data: publicUrl } = supabase.storage
        .from("broadcast-files")
        .getPublicUrl(fileName);

      file_url = publicUrl.publicUrl;
      file_name = file.name;
    }

    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        broadcast_id,
        content: content || null,
        file_url,
        file_name,
        sender_role: "instructor",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(message, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

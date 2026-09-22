import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const wallet = String(formData.get("wallet") || "").toLowerCase();
    const activity = String(formData.get("activity") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const passportTokenId = String(formData.get("passportTokenId") || "").trim() || null;

    if (!(file instanceof File) || !wallet || !activity || !description) {
      return NextResponse.json({ error: "Faltan archivo, wallet, actividad o descripción." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Formato no permitido. Usa JPG, PNG, WEBP, MP4, WEBM o MOV." }, { status: 415 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "El archivo supera el límite de 50 MB." }, { status: 413 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const contentHash = createHash("sha256").update(bytes).digest("hex");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectPath = `${wallet}/${Date.now()}-${contentHash.slice(0, 16)}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("evidencias")
      .upload(objectPath, bytes, { contentType: file.type, upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: `No se pudo guardar el archivo: ${uploadError.message}` }, { status: 502 });
    }

    const { data: publicUrl } = supabase.storage.from("evidencias").getPublicUrl(objectPath);
    const { data: evidence, error: insertError } = await supabase
      .from("producer_evidence")
      .insert({
        wallet_address: wallet,
        passport_token_id: passportTokenId,
        activity,
        description,
        media_url: publicUrl.publicUrl,
        media_type: file.type,
        file_name: file.name,
        file_size: file.size,
        content_hash: `sha256:${contentHash}`,
        status: "PENDING_REVIEW",
        captured_at: new Date().toISOString(),
      })
      .select("id, activity, description, media_url, media_type, content_hash, status, captured_at")
      .single();

    if (insertError) {
      await supabase.storage.from("evidencias").remove([objectPath]);
      return NextResponse.json({ error: `El archivo se subió, pero no se pudo registrar: ${insertError.message}` }, { status: 502 });
    }

    return NextResponse.json({ success: true, evidence });
  } catch (error) {
    console.error("[EVIDENCE_UPLOAD_ERROR]", error);
    return NextResponse.json({ error: "No se pudo procesar la evidencia." }, { status: 500 });
  }
}

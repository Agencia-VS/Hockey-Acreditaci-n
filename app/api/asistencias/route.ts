import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type UpsertAsistenciaPayload = {
  acreditacion_id: number;
  jornada: number;
  asistio: boolean;
};

function parseIds(idsParam: string | null): number[] {
  if (!idsParam) return [];
  return idsParam
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value > 0);
}

function getBearerToken(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth?.toLowerCase().startsWith("bearer ")) return null;
  return auth.slice(7);
}

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Faltan variables de entorno de Supabase." },
        { status: 500 }
      );
    }

    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Sesión inválida o expirada." },
        { status: 401 }
      );
    }

    const body = (await req.json()) as Partial<UpsertAsistenciaPayload>;

    if (
      typeof body.acreditacion_id !== "number" ||
      typeof body.jornada !== "number" ||
      typeof body.asistio !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Payload inválido para asistencia." },
        { status: 400 }
      );
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey);

    const { error } = await serviceClient.from("asistencias").upsert(
      {
        acreditacion_id: body.acreditacion_id,
        jornada: body.jornada,
        asistio: body.asistio,
      },
      { onConflict: "acreditacion_id,jornada" }
    );

    if (error) {
      return NextResponse.json(
        { error: `Error al guardar asistencia: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error API asistencias:", error);
    return NextResponse.json(
      { error: "Error interno al guardar asistencia." },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Faltan variables de entorno de Supabase." },
        { status: 500 }
      );
    }

    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Sesión inválida o expirada." },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const jornada = Number(url.searchParams.get("jornada"));
    const ids = parseIds(url.searchParams.get("ids"));

    if (!Number.isInteger(jornada) || jornada < 1) {
      return NextResponse.json(
        { error: "Parámetro jornada inválido." },
        { status: 400 }
      );
    }

    if (!ids.length) {
      return NextResponse.json({ data: [] });
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await serviceClient
      .from("asistencias")
      .select("acreditacion_id, asistio")
      .eq("jornada", jornada)
      .in("acreditacion_id", ids);

    if (error) {
      return NextResponse.json(
        { error: `Error al cargar asistencias: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (error) {
    console.error("Error API asistencias GET:", error);
    return NextResponse.json(
      { error: "Error interno al cargar asistencias." },
      { status: 500 }
    );
  }
}

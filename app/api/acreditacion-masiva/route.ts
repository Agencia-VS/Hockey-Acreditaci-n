import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

const AREAS = [
  "Producción",
  "Voluntarios",
  "Auspiciadores",
  "Proveedores",
  "Fan Fest",
  "Prensa",
] as const;

type AccreditacionRecord = {
  nombre: string;
  apellido: string;
  rut: string;
  correo: string;
  empresa: string;
  area: string;
};

type InvalidRecord = {
  row: number;
  reason: string;
};

const FIELD_ALIASES: Record<keyof AccreditacionRecord, string[]> = {
  nombre: ["nombre"],
  apellido: ["apellido"],
  rut: ["rut", "r.u.t", "rut/documento", "documento", "dni", "pasaporte"],
  correo: ["correo", "email", "correo electronico", "correo electrónico"],
  empresa: ["empresa", "empresa/medio", "medio"],
  area: ["area", "área"],
};

const normalizeAreaValue = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

function normalizeRecord(record: Record<string, unknown>): AccreditacionRecord {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    const lowerKey = key.trim().toLowerCase();
    normalized[lowerKey] = value == null ? "" : String(value).trim();
  }

  const pick = (aliases: string[]) =>
    aliases.map((alias) => normalized[alias]).find((value) => value && value.length) || "";

  return {
    nombre: pick(FIELD_ALIASES.nombre),
    apellido: pick(FIELD_ALIASES.apellido),
    rut: pick(FIELD_ALIASES.rut),
    correo: pick(FIELD_ALIASES.correo),
    empresa: pick(FIELD_ALIASES.empresa),
    area: pick(FIELD_ALIASES.area),
  };
}

function parseCsv(buffer: Buffer): AccreditacionRecord[] {
  const content = buffer.toString("utf-8");
  const rows = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as Record<string, unknown>[];
  return rows.map(normalizeRecord);
}

function parseExcel(buffer: Buffer): AccreditacionRecord[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });
  return rows.map(normalizeRecord);
}

function validateRecords(records: AccreditacionRecord[]) {
  const valid: AccreditacionRecord[] = [];
  const invalid: InvalidRecord[] = [];

  records.forEach((record, index) => {
    const rowNumber = index + 2; // Considera el encabezado en la fila 1
    const nombre = record.nombre.trim();
    const apellido = record.apellido.trim();
    const correo = record.correo.trim().toLowerCase();
    const areaRaw = record.area.trim();

    const areaMatch = AREAS.find(
      (area) => normalizeAreaValue(area) === normalizeAreaValue(areaRaw)
    );

    if (!nombre || !apellido || !correo || !areaMatch) {
      invalid.push({
        row: rowNumber,
        reason: "Faltan campos requeridos (nombre, apellido, correo o area).",
      });
      return;
    }

    if (!correo.includes("@")) {
      invalid.push({
        row: rowNumber,
        reason: "El correo no tiene formato valido.",
      });
      return;
    }

    valid.push({
      nombre,
      apellido,
      rut: record.rut.trim(),
      correo,
      empresa: record.empresa.trim(),
      area: areaMatch,
    });
  });

  return { valid, invalid };
}

async function insertAccreditations(records: AccreditacionRecord[]) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { error: "Faltan variables de entorno de Supabase." };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const chunkSize = 500;
  let inserted = 0;

  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize).map((record) => ({
      ...record,
      status: "pendiente",
      zona: null,
    }));

    const { error } = await supabase.from("acreditaciones").insert(chunk);
    if (error) {
      return { error: error.message };
    }
    inserted += chunk.length;
  }

  return { inserted };
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "Archivo no proporcionado o invalido." },
        { status: 400 }
      );
    }

    const fileName = (file as Blob & { name?: string }).name || "";
    const buffer = Buffer.from(await file.arrayBuffer());

    const records = fileName.endsWith(".xlsx") || fileName.endsWith(".xls")
      ? parseExcel(buffer)
      : parseCsv(buffer);

    if (records.length === 0) {
      return NextResponse.json(
        { error: "El archivo no contiene registros." },
        { status: 400 }
      );
    }

    const { valid, invalid } = validateRecords(records);

    if (valid.length === 0) {
      return NextResponse.json(
        {
          error: "No hay registros validos. Revisa el template.",
          invalidos: invalid.slice(0, 10),
        },
        { status: 400 }
      );
    }

    const { error, inserted } = await insertAccreditations(valid);

    if (error) {
      return NextResponse.json(
        { error: `Error al guardar en la base de datos: ${error}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `${inserted} acreditaciones cargadas exitosamente.`,
      insertados: inserted,
      totalLineas: records.length,
      invalidos: invalid.length,
      invalidSample: invalid.slice(0, 10),
    });
  } catch (error) {
    console.error("Error al procesar el archivo:", error);
    return NextResponse.json(
      { error: "Error al procesar el archivo." },
      { status: 500 }
    );
  }
}

export async function GET() {
  const rows = [
    {
      nombre: "Juan",
      apellido: "Perez",
      rut: "12345678-K",
      correo: "juan@example.com",
      empresa: "Empresa A",
      area: "Prensa",
    },
    {
      nombre: "Maria",
      apellido: "Gonzalez",
      rut: "98765432-9",
      correo: "maria@example.com",
      empresa: "Empresa B",
      area: "Voluntarios",
    },
    {
      nombre: "Carlos",
      apellido: "Lopez",
      rut: "11223344-5",
      correo: "carlos@example.com",
      empresa: "Empresa C",
      area: "Produccion",
    },
    {
      nombre: "Ana",
      apellido: "Martinez",
      rut: "44332211-3",
      correo: "ana@example.com",
      empresa: "Empresa D",
      area: "Proveedores",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: ["nombre", "apellido", "rut", "correo", "empresa", "area"],
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="template_acreditacion.xlsx"',
    },
  });
}

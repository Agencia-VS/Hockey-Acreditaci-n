import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://acreditaciones.accredia.cl";

const eventLogoUrl = `${siteUrl.replace(/\/$/, "")}/img/LogoHockeyClaro.png`;

type ApprovalPayload = {
  nombre: string;
  apellido: string;
  correo: string;
  zona?: string | null;
  area?: string;
};

const ZONA_NOMBRE: Record<string, string> = {
  "1": "Venue",
  "2": "FOP",
  "3": "LOC",
  "4": "VIP",
  "5": "Broadcast",
  "6": "Officials",
  "7": "Media",
  "8": "Volunteers",
  "9": "Todas las zonas",
};

const getZonaNombre = (zona?: string | null) => {
  if (!zona) return "Por confirmar";

  const cleaned = zona.trim();

  if (/^\d+$/.test(cleaned)) {
    return ZONA_NOMBRE[cleaned] ?? cleaned;
  }

  const zoneMatch = cleaned.match(/^zona\s*(\d+)(?:\.(.+))?$/i);
  if (zoneMatch) {
    const [, zoneNumber, inlineName] = zoneMatch;
    return (inlineName?.trim() || ZONA_NOMBRE[zoneNumber] || cleaned).trim();
  }

  return cleaned;
};

const from = "Hockey World Qualifiers Santiago 2026 <no-reply@acreditaciones.accredia.cl>";

const buildApprovalHtml = ({ nombre, apellido, zona, area }: ApprovalPayload) => `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Acreditación Aprobada</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; max-width: 100%;">
            <tr>
              <td style="background: linear-gradient(135deg, #1f0f6c 0%, #1e0b97 50%, #1f0f6c 100%); padding: 40px 30px; text-align: center;">
                <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 12px auto;">
                  <tr>
                    <td style="padding-right: 14px; vertical-align: middle;">
                      <img src="https://res.cloudinary.com/dubnevl0h/image/upload/v1768136932/Dise%C3%B1o_sin_t%C3%ADtulo_1_z8qzbu.png" alt="Logo VS" style="height: 56px; display: block;" />
                    </td>
                    <td style="width: 1px; background-color: rgba(255, 255, 255, 0.35); font-size: 0; line-height: 0;">&nbsp;</td>
                    <td style="padding-left: 14px; vertical-align: middle;">
                      <img src="https://res.cloudinary.com/ddwytwhln/image/upload/v1771325577/LogoHockeyHorizontalClaro_crhvbo.png" alt="Logo Hockey World Cup Qualifiers" style="height: 56px; display: block;" />
                    </td>
                  </tr>
                </table>
                <p style="color: #ff9e1a; font-size: 16px; margin: 0; font-weight: 600;">
                  Acreditaciones Accredia - Hockey World Qualifiers Santiago 2026
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding: 40px 30px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <div style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 12px 24px; border-radius: 50px; font-weight: 600; font-size: 16px;">
                    ✅ Acreditación Aprobada
                  </div>
                </div>

                <p style="font-size: 18px; color: #1f2937; margin: 0 0 20px 0; line-height: 1.6;">
                  Hola <strong>${nombre} ${apellido}</strong>,
                </p>

                <p style="font-size: 16px; color: #4b5563; margin: 0 0 30px 0; line-height: 1.6;">
                  Nos complace informarte que tu solicitud de acreditación ha sido <strong style="color: #10b981;">aprobada exitosamente</strong>.
                </p>

                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                  <tr>
                    <td style="padding: 20px; background-color: #f9fafb; border-left: 4px solid #1e0b97; border-radius: 8px; margin-bottom: 15px;">
                      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                        Área de Acreditación
                      </p>
                      <p style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 700;">
                        ${area}
                      </p>
                    </td>
                  </tr>
                  <tr><td style="height: 15px;"></td></tr>
                  <tr>
                    <td style="padding: 20px; background-color: #fff3e6; border-left: 4px solid #ff9e1a; border-radius: 8px;">
                      <p style="margin: 0 0 8px 0; color: #b45309; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                        Zona Asignada
                      </p>
                      <p style="margin: 0; color: #9a3412; font-size: 18px; font-weight: 700;">
                        ${getZonaNombre(zona)}
                      </p>
                    </td>
                  </tr>
                </table>

                <div style="background-color: #ffffff; border-left: 4px solid #ff9e1a; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                  <p style="margin: 0 0 10px 0; color: #1f0f6c; font-weight: 600; font-size: 15px;">
                    📋 Próximos pasos:
                  </p>
                  <ul style="margin: 0; padding-left: 20px; color: #1f0f6c; font-size: 14px; line-height: 1.8;">
                    <li>Guarda este correo como comprobante</li>
                    <li>Presentate en el evento con tu documento de identidad</li>
                    <li>Dirígete a la zona de acreditaciones para recoger tu credencial</li>
                  </ul>
                </div>

                <p style="font-size: 16px; color: #4b5563; margin: 0; line-height: 1.6;">
                  ¡Te esperamos en el evento!
                </p>
              </td>
            </tr>

            <tr>
              <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                  <strong>By Accredia</strong>
                </p>
                <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.6;">
                  Este es un correo automático, por favor no responder.<br>
                  Para consultas, contacta al equipo organizador.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
`;

const buildEmailPayload = (payload: ApprovalPayload) => ({
  from,
  to: payload.correo,
  subject: "✅ Tu acreditación ha sido aprobada",
  html: buildApprovalHtml(payload),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (Array.isArray(body?.items)) {
      const items = body.items as ApprovalPayload[];

      if (!items.length) {
        return NextResponse.json(
          { error: "No hay destinatarios para enviar." },
          { status: 400 }
        );
      }

      const validItems = items.filter((item) => item?.correo);

      if (!validItems.length) {
        return NextResponse.json(
          { error: "No hay correos válidos para enviar." },
          { status: 400 }
        );
      }

      const { data, error } = await resend.batch.send(
        validItems.map((item) => buildEmailPayload(item))
      );

      if (error) {
        console.error("ERROR RESEND BATCH:", error);
        return NextResponse.json(
          { error: "Error al enviar correos en batch", detalle: error },
          { status: 500 }
        );
      }

      console.log("RESEND BATCH OK:", data);
      return NextResponse.json({
        ok: true,
        batch: true,
        total: items.length,
        enviados: validItems.length,
        omitidos: items.length - validItems.length,
      });
    }

    const { nombre, apellido, correo, zona, area } = body as ApprovalPayload;

    if (!correo) {
      return NextResponse.json(
        { error: "Falta el correo del destinatario" },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send(
      buildEmailPayload({ nombre, apellido, correo, zona, area })
    );

    if (error) {
      console.error("ERROR RESEND:", error);
      return NextResponse.json(
        { error: "Error al enviar correo", detalle: error },
        { status: 500 }
      );
    }

    console.log("RESEND OK:", data);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("ERROR send-approval:", err);
    return NextResponse.json(
      { error: "Error interno en send-approval" },
      { status: 500 }
    );
  }
}

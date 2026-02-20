// components/AccreditationForm.tsx
"use client";

import { useState } from "react";
import type { TipoArea } from "./AreaSelector";
import { supabase } from "@/lib/supabase";
import LoadingSpinner from "@/components/LoadingSpinner";

export type DatosBasicos = {
  nombre: string;
  apellido: string;
  rut: string; // Puede ser pasaporte/DNI/RUT; sin validación de DV
  correo: string;
  empresa: string;
};

type Language = "es" | "en";

const AREA_LABELS: Record<Language, Record<TipoArea, string>> = {
  es: {
    "Producción": "Producción",
    Voluntarios: "Voluntarios",
    Auspiciadores: "Auspiciadores",
    Proveedores: "Proveedores",
    "Fan Fest": "Fan Fest",
    Prensa: "Prensa",
  },
  en: {
    "Producción": "Production",
    Voluntarios: "Volunteers",
    Auspiciadores: "Sponsors",
    Proveedores: "Suppliers",
    "Fan Fest": "Fan Fest",
    Prensa: "Press",
  },
};

export default function AccreditationForm({
  area,
  onCancel,
  onSuccess,
  lang = "es",
}: {
  area: TipoArea;
  onCancel: () => void;
  onSuccess: (datos: DatosBasicos) => void;
  lang?: Language;
}) {
  const copy =
    lang === "en"
      ? {
          dataFor: "Data for",
          changeArea: "Change area",
          firstName: "First name",
          lastName: "Last name",
          document: "ID / Document",
          documentPlaceholder: "RUT, DNI or Passport",
          email: "Email",
          company: "Company",
          acceptTerms: "I accept the",
          termsAndConditions: "terms and conditions",
          submit: "Submit request",
          sending: "Sending...",
          back: "Back",
          firstNameHint: "Use your legal first name as shown on your ID.",
          lastNameHint: "Use your legal last name as shown on your ID.",
          documentHint: "Optional, but recommended for faster verification.",
          emailHint: "Use an active email to receive notifications.",
          companyHint: "If applicable, include your organization or media outlet.",
          termsHint: "You must accept the terms to submit your request.",
          nameRequired: "First name and last name are required.",
          unknownError: "Unknown error.",
          acceptTermsError: "You must accept the terms and conditions.",
        }
      : {
          dataFor: "Datos para",
          changeArea: "Cambiar área",
          firstName: "Nombre",
          lastName: "Apellido",
          document: "RUT / Documento",
          documentPlaceholder: "RUT, DNI o Pasaporte",
          email: "Correo",
          company: "Empresa",
          acceptTerms: "Acepto los",
          termsAndConditions: "términos y condiciones",
          submit: "Enviar solicitud",
          sending: "Enviando...",
          back: "Volver",
          firstNameHint: "Usa tu nombre legal tal como aparece en tu documento.",
          lastNameHint: "Usa tu apellido legal tal como aparece en tu documento.",
          documentHint: "Opcional, pero recomendado para validación más rápida.",
          emailHint: "Usa un correo activo para recibir notificaciones.",
          companyHint: "Si aplica, indica empresa, institución o medio.",
          termsHint: "Debes aceptar los términos para enviar la solicitud.",
          nameRequired: "Nombre y apellido son obligatorios.",
          unknownError: "Error desconocido.",
          acceptTermsError: "Debes aceptar los términos y condiciones.",
        };

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datos, setDatos] = useState<DatosBasicos>({
    nombre: "",
    apellido: "",
    rut: "",
    correo: "",
    empresa: "",
  });
  const [aceptaTyC, setAceptaTyC] = useState(false);

  async function manejarSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validaciones mínimas (sin validar RUT/Documento)
    if (!datos.nombre.trim() || !datos.apellido.trim()) {
      setError(copy.nameRequired);
      return;
    }

    setCargando(true);
    try {
  const { error: sbError } = await supabase.from("acreditaciones").insert({
    area,
    nombre: datos.nombre.trim(),
    apellido: datos.apellido.trim(),
    rut: datos.rut.trim(),
    correo: datos.correo.trim().toLowerCase(),
    empresa: datos.empresa.trim(),
  });

  if (sbError) {
    console.error("Supabase insert error:", sbError); // <— mira la consola
    setError(sbError.message);                         // <— muestra el mensaje real
    return;
  }

  onSuccess(datos);
} catch (err: unknown) {
  const msg = err instanceof Error ? err.message : copy.unknownError;
  console.error("Catch error:", err);
  setError(msg);
}
  if (!aceptaTyC) {
  setError(copy.acceptTermsError);
  return;
}

  }


  return (
    <section className="bg-white/95 backdrop-blur-sm rounded-2xl border border-white/30 p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">{copy.dataFor}: {AREA_LABELS[lang][area]}</h2>
        <button className="text-sm text-[#1E0B97] hover:text-[#1F0F6C] font-medium underline" onClick={onCancel}>
          {copy.changeArea}
        </button>
      </div>

      <form onSubmit={manejarSubmit} className="grid grid-cols-1 gap-4">
        {/* Nombre / Apellido */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">{copy.firstName}</label>
            <input
              className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-[#1E0B97] focus:ring-2 focus:ring-[#1E0B97]/20 transition-all"
              value={datos.nombre}
              onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
              required
            />
            <p className="mt-1 text-xs text-gray-500">{copy.firstNameHint}</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">{copy.lastName}</label>
            <input
              className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-[#1E0B97] focus:ring-2 focus:ring-[#1E0B97]/20 transition-all"
              value={datos.apellido}
              onChange={(e) => setDatos({ ...datos, apellido: e.target.value })}
              required
            />
            <p className="mt-1 text-xs text-gray-500">{copy.lastNameHint}</p>
          </div>
        </div>

        {/* Documento / Correo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">{copy.document}</label>
            <input
              className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-[#1E0B97] focus:ring-2 focus:ring-[#1E0B97]/20 transition-all"
              placeholder={copy.documentPlaceholder}
              value={datos.rut}
              onChange={(e) => setDatos({ ...datos, rut: e.target.value })}
            />
            <p className="mt-1 text-xs text-gray-500">{copy.documentHint}</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">{copy.email}</label>
            <input
              type="email"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-[#1E0B97] focus:ring-2 focus:ring-[#1E0B97]/20 transition-all"
              value={datos.correo}
              onChange={(e) => setDatos({ ...datos, correo: e.target.value })}
            />
            <p className="mt-1 text-xs text-gray-500">{copy.emailHint}</p>
          </div>
        </div>

        {/* Empresa */}
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">{copy.company}</label>
          <input
            className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-[#1E0B97] focus:ring-2 focus:ring-[#1E0B97]/20 transition-all"
            value={datos.empresa}
            onChange={(e) => setDatos({ ...datos, empresa: e.target.value })}
          />
          <p className="mt-1 text-xs text-gray-500">{copy.companyHint}</p>
        </div>
        {/* Términos y condiciones */}
<div className="flex items-start gap-2">
  <input
    id="acepta-tyc"
    type="checkbox"
    className="mt-1 h-4 w-4 rounded border-gray-300 text-[#1E0B97] focus:ring-[#1E0B97]"
    checked={aceptaTyC}
    onChange={(e) => setAceptaTyC(e.target.checked)}
  />
  <label htmlFor="acepta-tyc" className="text-sm text-gray-700">
    {copy.acceptTerms}{" "}
    <a
      href="/docs/TerminosFEOCH.pdf"  // ← si usas URL externa, reemplázala aquí
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#1E0B97] hover:text-[#1F0F6C] underline font-medium"
    >
      {copy.termsAndConditions}
    </a>.
  </label>
</div>
        <p className="-mt-2 text-xs text-gray-500">{copy.termsHint}</p>


        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={cargando || !aceptaTyC}
            className="rounded-xl bg-gradient-to-r from-[#FF9E1A] via-[#FF712A] to-[#FD4727] hover:from-[#FF712A] hover:via-[#FD4727] hover:to-[#CC0000] text-white font-semibold px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center gap-2"
          >
            {cargando ? (
              <LoadingSpinner size="sm" tone="light" label={copy.sending} labelClassName="text-white" />
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {copy.submit}
              </>
            )}
          </button>
          <button 
            type="button" 
            onClick={onCancel} 
            disabled={cargando}
            className="rounded-xl bg-white border-2 border-[#1E0B97]/30 text-[#1E0B97] hover:bg-[#1E0B97]/5 font-medium px-6 py-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copy.back}
          </button>
        </div>
      </form>
    </section>
  );
}
// app/acreditacion/page.tsx
"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import AreaSelector, { TipoArea } from "@/components/AreaSelector";
import AccreditationForm from "@/components/AccreditationForm";
import Image from "next/image";
import Link from "next/link";
import IconoFlotanteAdmin from "@/components/BotonesFlotantes/IconoFlotanteAdmin";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useRouter, useSearchParams } from "next/navigation";
import Modal from "@/components/Modal";
import PhotographerBibDisclaimer from "@/components/PhotographerBibDisclaimer";

function AcreditacionPageContent() {
  const [lang, setLang] = useState<"es" | "en">("es");
  const [showDisclaimerOverlay, setShowDisclaimerOverlay] = useState(true);
  const [area, setArea] = useState<TipoArea | null>(null);
  const [enviado, setEnviado] = useState<null | { nombre: string; apellido: string }>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [aceptaTyCMasivo, setAceptaTyCMasivo] = useState(false);
  const [modal, setModal] = useState<
    { type: "success" | "error"; title: string; message: string } | null
  >(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const queryLang = searchParams.get("lang");
    if (queryLang === "en" || queryLang === "es") {
      setLang(queryLang);
    }
  }, [searchParams]);

  const copy =
    lang === "en"
      ? {
          modalAcceptTitle: "Accept terms",
          modalAcceptMessage: "You must accept the terms and conditions before uploading the file.",
          modalUploadErrorTitle: "Upload error",
          modalUploadErrorMessage: "Error importing file.",
          modalUploadSuccessTitle: "Upload successful",
          modalUploadSuccessMessage: "Import completed.",
          modalUploadInvalidRows: (count: number) => ` ${count} rows with errors.`,
          loading: "Loading...",
          back: "Back",
          step1: "Select area",
          step2: "Complete details",
          bulkTitle: "Bulk accreditation",
          bulkSubtitle: "Download the template and upload your Excel file with multiple requests.",
          downloadTemplate: "Download template",
          importing: "Importing...",
          importBulk: "Bulk import",
          acceptTerms: "I accept the",
          termsAndConditions: "terms and conditions",
          requiredFields:
            "Required fields: first name, last name, ID/Document, email, and area. Valid areas: Production, Volunteers, Sponsors, Suppliers, Fan Fest, Press.",
          bulkFileHint: "Accepted formats: .csv, .xlsx, .xls · Maximum file size: 5MB.",
          requestSent: "Request sent!",
          thanks: "Thank you",
          requestReceived: "We have received your accreditation request.",
          sendAnother: "Send another request",
          footerSystem: "Official accreditation system • Fast and secure registration",
          footerRights: "© 2026 Somos VS. All rights reserved.",
          close: "Close",
        }
      : {
          modalAcceptTitle: "Acepta los términos",
          modalAcceptMessage: "Debes aceptar los términos y condiciones antes de enviar el archivo.",
          modalUploadErrorTitle: "Error en la carga",
          modalUploadErrorMessage: "Error al importar el archivo.",
          modalUploadSuccessTitle: "Carga exitosa",
          modalUploadSuccessMessage: "Importación completada.",
          modalUploadInvalidRows: (count: number) => ` ${count} filas con error.`,
          loading: "Cargando...",
          back: "Volver",
          step1: "Selecciona área",
          step2: "Completa datos",
          bulkTitle: "Acreditacion masiva",
          bulkSubtitle: "Descarga el template y sube tu Excel con varias solicitudes.",
          downloadTemplate: "Descargar template",
          importing: "Importando...",
          importBulk: "Importar masivo",
          acceptTerms: "Acepto los",
          termsAndConditions: "términos y condiciones",
          requiredFields:
            "Campos requeridos: nombre, apellido, RUT/documento, correo y area. Areas validas: Produccion, Voluntarios, Auspiciadores, Proveedores, Fan Fest, Prensa.",
          bulkFileHint: "Formatos aceptados: .csv, .xlsx, .xls · Tamaño máximo: 5MB.",
          requestSent: "¡Solicitud enviada!",
          thanks: "Gracias",
          requestReceived: "Hemos recibido tu solicitud de acreditación.",
          sendAnother: "Enviar otra solicitud",
          footerSystem: "Sistema de acreditación oficial • Registro rápido y seguro",
          footerRights: "© 2026 Somos VS. Todos los derechos reservados.",
          close: "Cerrar",
        };

  const handleBack = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsNavigating(true);
    router.push(`/?lang=${lang}`);
  };

  const descargarTemplate = () => {
    window.location.href = `/api/acreditacion-masiva?lang=${lang}`;
  };

  const importarMasivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!aceptaTyCMasivo) {
      setModal({
        type: "error",
        title: copy.modalAcceptTitle,
        message: copy.modalAcceptMessage,
      });
      e.target.value = "";
      return;
    }

    setImporting(true);
    setModal(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/acreditacion-masiva", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      const invalidSampleText = Array.isArray(result?.invalidSample)
        ? result.invalidSample
            .slice(0, 5)
            .map((item: { row?: number; reason?: string }) => {
              const rowLabel = lang === "en" ? "Row" : "Fila";
              const rowText = item?.row ? `${rowLabel} ${item.row}` : rowLabel;
              return `${rowText}: ${item?.reason || "Error de validación"}`;
            })
            .join("\n")
        : "";

      if (!response.ok) {
        setModal({
          type: "error",
          title: copy.modalUploadErrorTitle,
          message: invalidSampleText
            ? `${result?.error || copy.modalUploadErrorMessage}\n\n${invalidSampleText}`
            : result?.error || copy.modalUploadErrorMessage,
        });
      } else {
        const invalidos = result?.invalidos ?? 0;
        const detalleInvalidos = invalidos
          ? copy.modalUploadInvalidRows(invalidos)
          : "";
        setModal({
          type: "success",
          title: copy.modalUploadSuccessTitle,
          message: invalidSampleText
            ? `${result?.message || copy.modalUploadSuccessMessage}${detalleInvalidos}\n\n${invalidSampleText}`
            : `${result?.message || copy.modalUploadSuccessMessage}${detalleInvalidos}`,
        });
      }
    } catch (error) {
      console.error("Error al importar masivo:", error);
      setModal({
        type: "error",
        title: copy.modalUploadErrorTitle,
        message: copy.modalUploadErrorMessage,
      });
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-[#1F0F6C] via-[#1E0B97] to-[#1F0F6C] relative">
      {showDisclaimerOverlay && (
        <PhotographerBibDisclaimer
          lang={lang}
          overlay
          onAcknowledge={() => setShowDisclaimerOverlay(false)}
        />
      )}
      <Modal
        open={!!modal}
        type={modal?.type}
        title={modal?.title || ""}
        message={modal?.message || ""}
        closeLabel={copy.close}
        onClose={() => setModal(null)}
      />
      {/* Overlay de loading */}
      {isNavigating && (
        <div className="fixed inset-0 bg-[#1F0F6C]/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <LoadingSpinner
            size="lg"
            tone="light"
            stacked
            label={copy.loading}
            labelClassName="text-white font-semibold"
          />
        </div>
      )}

      {/* Decoración de fondo sutil */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-[#FF9E1A] rounded-full blur-3xl opacity-10"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#1E0B97] rounded-full blur-3xl opacity-10"></div>
        <div className="absolute top-0 left-0 h-full w-10 bg-[#FD4727] opacity-10 -skew-x-6"></div>
        <div className="absolute top-0 right-0 h-full w-10 bg-[#FF712A] opacity-10 skew-x-6"></div>
      </div>

      <IconoFlotanteAdmin />

      <div className="relative z-10 w-full flex flex-col items-center px-4 py-8 sm:py-10">
        <div className="fixed top-6 right-6 z-50 inline-flex rounded-full border border-white/30 bg-white/20 p-1 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setLang("es")}
            title="Español"
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
              lang === "es" ? "bg-white text-[#1E0B97]" : "text-white hover:bg-white/20"
            }`}
            aria-label="Cambiar a español"
          >
            ES
          </button>
          <button
            type="button"
            onClick={() => setLang("en")}
            title="English"
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
              lang === "en" ? "bg-white text-[#1E0B97]" : "text-white hover:bg-white/20"
            }`}
            aria-label="Switch to English"
          >
            EN
          </button>
        </div>

        {/* Botón volver - posicionado arriba a la izquierda */}
        <Link
          href={`/?lang=${lang}`}
          onClick={handleBack}
          className="fixed top-6 left-6 z-50 inline-flex items-center gap-2 bg-white/20 backdrop-blur-md text-white hover:bg-white/30 font-medium transition-all px-4 py-2 rounded-full border border-white/30 hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">{copy.back}</span>
        </Link>

        <div className="w-full max-w-3xl">
          {/* Header compacto */}
          <header className="mb-8 flex flex-col items-center text-center">
            <div className="relative w-full max-w-xs sm:max-w-md mb-4 min-h-[96px] sm:min-h-[120px] flex items-center justify-center">
              <Image
                src="/img/LogoHockeyClaro.png"
                alt="Logo Hockey"
                width={600}
                height={200}
                priority
                className="w-full h-auto object-contain drop-shadow-2xl opacity-0 animate-fade-in"
                style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}
              />
            </div>
          </header>

          {/* Indicador de pasos mejorado */}
          <div className="mb-8 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all w-full sm:w-auto justify-center ${
              !area 
                ? "bg-white text-[#1E0B97] shadow-xl font-semibold" 
                : "bg-white/20 text-white/70 border border-white/30 backdrop-blur-sm"
            }`}>
              <span className="font-semibold">1</span>
              <span>{copy.step1}</span>
            </div>
            <svg className="w-5 h-5 text-white/60 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all w-full sm:w-auto justify-center ${
              area 
                ? "bg-white text-[#1E0B97] shadow-xl font-semibold" 
                : "bg-white/20 text-white/70 border border-white/30 backdrop-blur-sm"
            }`}>
              <span className="font-semibold">2</span>
              <span>{copy.step2}</span>
            </div>
          </div>

          <div className="mb-6 bg-white/95 backdrop-blur-sm rounded-2xl border border-white/30 p-5 sm:p-6 shadow-2xl">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF712A] text-white shadow-md">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M3 10h18M3 16h18M4 20h16" />
                      </svg>
                    </div>
                    <div>
                      <h2
                        className="text-lg font-semibold text-gray-900"
                        style={{ fontFamily: "MTM Palma 67" }}
                      >
                        {copy.bulkTitle}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {copy.bulkSubtitle}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={importarMasivo}
                  />
                  <button
                    onClick={descargarTemplate}
                      className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-white border-2 border-[#FF9E1A] text-[#1E0B97] font-semibold px-4 py-2.5 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {copy.downloadTemplate}
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importing || !aceptaTyCMasivo}
                      className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1F0F6C] via-[#1E0B97] to-[#1F0F6C] hover:shadow-lg text-white font-semibold px-4 py-2.5 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {importing ? copy.importing : copy.importBulk}
                  </button>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <input
                  id="acepta-tyc-masivo"
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-[#1E0B97] focus:ring-[#1E0B97]"
                  checked={aceptaTyCMasivo}
                  onChange={(e) => setAceptaTyCMasivo(e.target.checked)}
                />
                <label htmlFor="acepta-tyc-masivo" className="text-sm text-gray-700">
                  {copy.acceptTerms}{" "}
                  <a
                    href="/docs/TerminosFEOCH.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1E0B97] hover:text-[#1F0F6C] underline font-medium"
                  >
                    {copy.termsAndConditions}
                  </a>
                  {" "}.
                </label>
              </div>
                <div className="rounded-xl bg-[#FF9E1A]/10 px-4 py-3 text-xs text-gray-700">
                  {copy.requiredFields}
                </div>
                <p className="text-xs text-gray-500">{copy.bulkFileHint}</p>
              </div>

            </div>
          </div>

          {!area && <AreaSelector onSelect={(a) => setArea(a)} lang={lang} />}

          {area && !enviado && (
            <AccreditationForm
              area={area}
              lang={lang}
              onCancel={() => setArea(null)}
              onSuccess={(datos) => setEnviado({ nombre: datos.nombre, apellido: datos.apellido })}
            />
          )}

          {enviado && (
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-white/30 p-8 shadow-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#FF9E1A] to-[#FF712A] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">{copy.requestSent}</h2>
                <p className="text-gray-700 text-lg mb-6">
                  {copy.thanks} <span className="font-semibold text-[#1E0B97]">{enviado.nombre} {enviado.apellido}</span>.
                  <br />
                  {copy.requestReceived}
                </p>
                <button 
                  className="px-6 py-3 bg-gradient-to-r from-[#FF9E1A] via-[#FF712A] to-[#FD4727] text-white font-semibold rounded-xl hover:from-[#FF712A] hover:via-[#FD4727] hover:to-[#CC0000] transition-all duration-300 hover:scale-105 shadow-lg" 
                  onClick={() => { setEnviado(null); setArea(null); }}
                >
                  {copy.sendAnother}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="py-6 text-center mt-8">
            <p className="text-sm text-white/60">
            {copy.footerSystem}
          </p> <br />
          <p className="text-white/40 text-xs">
            {copy.footerRights}
          </p>
        </footer>
      </div>
    </main>
  );
}

export default function AcreditacionPage() {
  return (
    <Suspense fallback={null}>
      <AcreditacionPageContent />
    </Suspense>
  );
}

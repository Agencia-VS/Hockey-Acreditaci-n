"use client";

type Language = "es" | "en";

type PhotographerBibDisclaimerProps = {
  lang?: Language;
  overlay?: boolean;
  onAcknowledge?: () => void;
};

export default function PhotographerBibDisclaimer({
  lang = "es",
  overlay = false,
  onAcknowledge,
}: PhotographerBibDisclaimerProps) {
  const copy =
    lang === "en"
      ? {
          title: "Important Information – Photographer Bib Use and Return",
          acknowledge: "Understood",
          paragraphs: [
            "Photographer bibs will be collected daily at the Accreditation Area. In order to receive a bib, an official form of identification (ID card, passport, or driver’s license) must be left as a temporary guarantee. The document will be returned once the bib is handed back at the end of the day.",
            "If the working day extends beyond the Accreditation Area opening hours, a member of the Organizing Committee will be available to receive the bib and return the corresponding document.",
            "Bibs must be returned at the end of each day, as they will be reused for future events. We appreciate your understanding and cooperation.",
          ],
        }
      : {
          title: "Información importante – Uso y devolución de petos para fotógrafos",
          acknowledge: "Entendido",
          paragraphs: [
            "El retiro de petos para fotógrafos acreditados se realizará diariamente en el Área de Acreditación. Para su entrega, será necesario dejar un documento de identidad oficial (cédula de identidad, pasaporte o licencia de conducir) como garantía, el cual será devuelto una vez que el peto sea entregado al finalizar la jornada.",
            "En caso de que la jornada se extienda fuera del horario del Área de Acreditación, un miembro del Comité Organizador estará disponible para recibir el peto y devolver el documento correspondiente.",
            "Los petos deberán ser devueltos obligatoriamente al término de cada jornada, ya que serán reutilizados en futuros eventos. Agradecemos su comprensión y colaboración.",
          ],
        };

  if (overlay) {
    return (
      <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
        <section className="w-full max-w-4xl rounded-2xl border border-white/30 bg-white/95 p-5 sm:p-6 shadow-2xl backdrop-blur-sm max-h-[90vh] overflow-y-auto">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1E0B97] text-white">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="w-full">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3" style={{ fontFamily: "MTM Palma 67" }}>
                {copy.title}
              </h2>
              <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
                {copy.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={onAcknowledge}
                  className="rounded-xl bg-gradient-to-r from-[#1F0F6C] via-[#1E0B97] to-[#1F0F6C] text-white font-semibold px-5 py-2.5 hover:shadow-lg transition-all hover:scale-[1.01]"
                >
                  {copy.acknowledge}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <section className="mb-6 rounded-2xl border border-white/30 bg-white/95 p-5 sm:p-6 shadow-2xl backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1E0B97] text-white">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3" style={{ fontFamily: "MTM Palma 67" }}>
            {copy.title}
          </h2>
          <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
            {copy.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// components/AreaSelector.tsx
export type TipoArea =
  | "Producción"
  | "Voluntarios"
  | "Auspiciadores"
  | "Proveedores"
  | "Fan Fest"
  | "Prensa";

type Language = "es" | "en";

const AREAS: TipoArea[] = [
  "Producción",
  "Voluntarios",
  "Auspiciadores",
  "Proveedores",
  "Fan Fest",
  "Prensa",
];

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

export default function AreaSelector({
  onSelect,
  lang = "es",
}: {
  onSelect: (a: TipoArea) => void;
  lang?: Language;
}) {
  const copy =
    lang === "en"
      ? {
          title: "Select area",
          subtitle: "Before completing your details, choose which group you belong to.",
          cta: "Continue →",
        }
      : {
          title: "Selecciona el área",
          subtitle: "Antes de completar tus datos, elige a qué grupo perteneces.",
          cta: "Continuar →",
        };

  return (
    <section className="bg-white/95 backdrop-blur-sm rounded-2xl border border-white/30 p-6 shadow-2xl">
      <h1
        className="text-2xl font-semibold mb-4 text-gray-900"
        style={{ fontFamily: "MTM Palma 67" }}
      >
        {copy.title}
      </h1>
      <p className="text-gray-700 mb-6">{copy.subtitle}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {AREAS.map((a) => (
          <button
  key={a}
  onClick={() => onSelect(a)}
  className="rounded-xl bg-gradient-to-r from-[#1F0F6C] to-[#1E0B97] text-white px-4 py-3 text-left transition-all duration-200
             hover:from-[#1E0B97] hover:to-[#1F0F6C] hover:scale-105 hover:shadow-lg
             focus:outline-none focus:ring-2 focus:ring-[#FF9E1A]"
>
  <span className="block text-base font-semibold">{AREA_LABELS[lang][a]}</span>
  <span className="block text-sm text-white/80">{copy.cta}</span>
</button>

        ))}
      </div>
    </section>
  );
}
// app/page.tsx
"use client";
import Link from "next/link";
import Image from "next/image";
import IconoFlotanteAdmin from "@/components/BotonesFlotantes/IconoFlotanteAdmin";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function LandingPageContent() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [lang, setLang] = useState<"es" | "en">("es");
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
          loading: "Loading...",
          backgroundAlt: "Hockey World Cup background",
          logoAlt: "Hockey World Cup logo",
          cta: "Get event accreditation",
          toAccreditation: "/acreditacion?lang=en",
        }
      : {
          loading: "Cargando...",
          backgroundAlt: "Fondo mundial de hockey",
          logoAlt: "Logo Mundial de Hockey",
          cta: "Acreditarse al evento",
          toAccreditation: "/acreditacion?lang=es",
        };

  const handleAccreditationClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsNavigating(true);
    router.push(copy.toAccreditation);
  };

  return (
    <div className="bg-[#1E0B97] text-white">
      <IconoFlotanteAdmin />
      <section className="min-h-screen w-full relative overflow-hidden">
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

        <Image
          src="/img/FondoHockey.2.png"
          alt={copy.backgroundAlt}
          fill
          priority
          quality={100}
          className="object-cover object-[center_top] sm:object-center opacity-0 animate-fade-in"
          style={{ animationDuration: "1.4s", animationFillMode: "forwards" }}
          sizes="(max-width: 640px) 100vw, 100vw"
        />
        <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 z-10 w-[200px] sm:w-[220px] md:w-[300px] lg:w-[380px]">
          <Image
            src="/img/LogoHockeyHorizontalClaro.png"
            alt={copy.logoAlt}
            width={840}
            height={240}
            priority
            className="h-auto w-full object-contain drop-shadow-2xl opacity-0 animate-fade-in"
            style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}
          />
        </div>
        <div className="absolute bottom-6 right-1/2 translate-x-1/2 sm:right-6 sm:translate-x-0 z-10">
          <div className="rounded-full bg-[#1F0F6C]/70 px-2 py-2 backdrop-blur-md">
            <Link
              href={copy.toAccreditation}
              onClick={handleAccreditationClick}
              className="inline-flex items-center justify-center rounded-full border-2 border-[#FD4727] bg-[#FF712A] px-10 py-4 text-lg font-semibold text-white shadow-2xl transition-transform hover:scale-105"
            >
              {copy.cta}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={null}>
      <LandingPageContent />
    </Suspense>
  );
}


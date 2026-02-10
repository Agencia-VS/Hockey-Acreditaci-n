// app/page.tsx
"use client";
import Link from "next/link";
import Image from "next/image";
import IconoFlotanteAdmin from "@/components/BotonesFlotantes/IconoFlotanteAdmin";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LandingPage() {
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();

  const handleAccreditationClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsNavigating(true);
    router.push("/acreditacion");
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
              label="Cargando..."
              labelClassName="text-white font-semibold"
            />
          </div>
        )}
        <Image
          src="/img/FondoHockey.2.png"
          alt="Fondo mundial de hockey"
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
            alt="Logo Mundial de Hockey"
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
              href="/acreditacion"
              onClick={handleAccreditationClick}
              className="inline-flex items-center justify-center rounded-full border-2 border-[#FD4727] bg-[#FF712A] px-10 py-4 text-lg font-semibold text-white shadow-2xl transition-transform hover:scale-105"
            >
              Acreditarse al evento
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}


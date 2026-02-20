"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import LoadingSpinner from "@/components/LoadingSpinner";
import Image from "next/image";
import Modal from "@/components/Modal";
import ConfirmModal from "@/components/ConfirmModal";

/** ===== Tipos ===== */
type Zona = `Zona ${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}` | null;

export type Row = {
  id: number;
  area: string;
  nombre: string;
  apellido: string;
  rut: string;
  correo: string;
  empresa: string | null;
  status: "pendiente" | "aprobado" | "rechazado";
  created_at: string;
  zona: Zona;
};

/** ===== Constantes ===== */
const AREAS = [
  "Producción",
  "Voluntarios",
  "Auspiciadores",
  "Proveedores",
  "Fan Fest",
  "Prensa",
] as const;

const JORNADAS = Array.from({ length: 8 }, (_, i) => i + 1);

// Mapa: valor guardado -> texto que se muestra en el select
const ZONA_LABEL: Record<Exclude<Zona, null>, string> = {
  "Zona 1": "Zona 1.Venue",
  "Zona 2": "Zona 2.FOP",
  "Zona 3": "Zona 3.LOC",
  "Zona 4": "Zona 4.VIP",
  "Zona 5": "Zona 5.Broadcast",
  "Zona 6": "Zona 6.Officials",
  "Zona 7": "Zona 7.Media",
  "Zona 8": "Zona 8.Volunteers",
  "Zona 9": "Todas las zonas", // 👈 nueva zona, texto frontend
};

// Lista de valores internos (lo que se guarda en la BD)
const ZONAS = Object.keys(ZONA_LABEL) as Exclude<Zona, null>[];

/** ===== Componente ===== */
export default function AdminDashboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [area, setArea] = useState<string>("*");
  const [status, setStatus] = useState<string>("*");
  const [jornada, setJornada] = useState<number>(1);
  const [asistencia, setAsistencia] = useState<Record<number, boolean>>({});
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [feedbackModal, setFeedbackModal] = useState<
    { type: "success" | "error"; title: string; message: string } | null
  >(null);
  const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);

  const showError = (title: string, message: string) => {
    setFeedbackModal({ type: "error", title, message });
  };

  const showSuccess = (title: string, message: string) => {
    setFeedbackModal({ type: "success", title, message });
  };

  const loadAsistencias = useCallback(
    async (currentRows: Row[], jornadaActual: number) => {
      if (!currentRows.length) {
        setAsistencia({});
        return;
      }

      const ids = currentRows.map((r) => r.id);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        showError("Sesión expirada", "Debes iniciar sesión nuevamente para cargar asistencias.");
        setAsistencia({});
        return;
      }

      const response = await fetch(
        `/api/asistencias?jornada=${jornadaActual}&ids=${ids.join(",")}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error("Error cargando asistencias:", result);
        showError("Error al cargar asistencias", result?.error || "No se pudieron cargar asistencias.");
        setAsistencia({});
        return;
      }

      const map: Record<number, boolean> = {};
      (result?.data ?? []).forEach((row: { acreditacion_id: number; asistio: boolean }) => {
        map[row.acreditacion_id] = row.asistio;
      });
      setAsistencia(map);
    },
    []
  );

  const load = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("acreditaciones")
      .select(
        "id,area,nombre,apellido,rut,correo,empresa,status,created_at,zona"
      )
      .order("created_at", { ascending: false });

    if (area !== "*") query = query.eq("area", area);
    if (status !== "*") query = query.eq("status", status);

    const { data, error } = await query;
    if (error) console.error(error);
    const currentRows = (data ?? []) as Row[];
    setRows(currentRows);
    await loadAsistencias(currentRows, jornada);
    setLoading(false);
  }, [area, status, jornada, loadAsistencias]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setAsistencia({});
    loadAsistencias(rows, jornada);
  }, [jornada, rows, loadAsistencias]);

  useEffect(() => {
    const rowIds = new Set(rows.map((r) => r.id));
    setSelectedIds((prev) => prev.filter((id) => rowIds.has(id)));
  }, [rows]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) =>
      [r.nombre, r.apellido, r.rut, r.correo, r.empresa ?? ""].some((x) =>
        x.toLowerCase().includes(term)
      )
    );
  }, [rows, q]);

  const setEstado = async (id: number, nuevo: Row["status"]) => {
    const { error } = await supabase
      .from("acreditaciones")
      .update({ status: nuevo })
      .eq("id", id);
    if (error) {
      showError("Error al actualizar estado", error.message);
      return;
    }
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: nuevo } : r))
    );
  };

  const toggleRowSelection = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const filteredIds = useMemo(() => filtered.map((r) => r.id), [filtered]);
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id));

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
      return;
    }

    setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
  };

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedIds.includes(row.id)),
    [rows, selectedIds]
  );

  const limpiarSeleccion = () => setSelectedIds([]);

  const setZona = async (id: number, zona: Zona) => {
    const { error } = await supabase
      .from("acreditaciones")
      .update({ zona })
      .eq("id", id);
    if (error) {
      showError("Error al actualizar zona", error.message);
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, zona } : r)));
  };

  const setAsistenciaDia = async (id: number, value: boolean) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      showError("Sesión expirada", "Debes iniciar sesión nuevamente para guardar asistencia.");
      return;
    }

    const response = await fetch("/api/asistencias", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        acreditacion_id: id,
        jornada,
        asistio: value,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      showError("Error al guardar asistencia", result?.error || "No se pudo guardar asistencia.");
      return;
    }

    setAsistencia((prev) => ({ ...prev, [id]: value }));
  };

  const aprobarConZona = async (r: Row) => {
    if (!r.zona) {
      showError("Zona requerida", "Debes seleccionar una zona antes de aprobar.");
      return;
    }

    // 1) Actualiza en Supabase
    const { error } = await supabase
      .from("acreditaciones")
      .update({ status: "aprobado", zona: r.zona })
      .eq("id", r.id);

    if (error) {
      showError("Error al aprobar", error.message);
      return;
    }

    // Actualiza estado local
    setRows((prev) =>
      prev.map((x) =>
        x.id === r.id ? { ...x, status: "aprobado", zona: r.zona } : x
      )
    );

    showSuccess("Acreditación aprobada", `Se aprobó a ${r.nombre} ${r.apellido}.`);
  };

  const enviarCorreoAprobacion = async (r: Row, silent = false): Promise<boolean> => {
    if (!r.zona || r.status !== "aprobado") {
      if (!silent) {
        showError(
          "No se puede enviar correo",
          "La acreditación debe estar aprobada y tener zona asignada para enviar correo."
        );
      }
      return false;
    }

    try {
      const response = await fetch("/api/send-approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: r.nombre,
          apellido: r.apellido,
          correo: r.correo,
          zona: r.zona,
          area: r.area,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Error al enviar correo:", result);
        if (!silent) {
          showError(
            "Error al enviar correo",
            `No se pudo enviar el correo.\n\nError: ${result.error || "Desconocido"}\n\nVerifica la configuración de RESEND_API_KEY en .env`
          );
        }
        return false;
      } else {
        console.log("✅ Correo enviado exitosamente a:", r.correo);
        if (!silent) {
          showSuccess(
            "Correo enviado",
            `Se ha enviado un correo de confirmación a: ${r.correo}`
          );
        }
        return true;
      }
    } catch (e) {
      console.error("Error enviando correo de aprobación:", e);
      if (!silent) {
        showError(
          "Error al enviar correo",
          "Hubo un problema al enviar el correo.\n\nRevisa la consola del navegador (F12) para más detalles."
        );
      }
      return false;
    }
  };

  const cambiarEstadoMasivo = async (nuevo: Row["status"]) => {
    if (!selectedIds.length) {
      showError("Sin selección", "Selecciona al menos un registro.");
      return;
    }

    const { error } = await supabase
      .from("acreditaciones")
      .update({ status: nuevo })
      .in("id", selectedIds);

    if (error) {
      showError("Error en acción masiva", error.message);
      return;
    }

    setRows((prev) =>
      prev.map((r) => (selectedIds.includes(r.id) ? { ...r, status: nuevo } : r))
    );
    const total = selectedIds.length;
    limpiarSeleccion();
    showSuccess("Acción masiva completada", `Se actualizaron ${total} registros.`);
  };

  const aprobarMasivoConZona = async () => {
    if (!selectedRows.length) {
      showError("Sin selección", "Selecciona al menos un registro.");
      return;
    }

    const conZona = selectedRows.filter((row) => row.zona);
    const sinZona = selectedRows.length - conZona.length;

    if (!conZona.length) {
      showError("Zona requerida", "Ninguno de los registros seleccionados tiene zona asignada.");
      return;
    }

    const ids = conZona.map((row) => row.id);
    const { error } = await supabase
      .from("acreditaciones")
      .update({ status: "aprobado" })
      .in("id", ids);

    if (error) {
      showError("Error en aprobación masiva", error.message);
      return;
    }

    setRows((prev) =>
      prev.map((row) => (ids.includes(row.id) ? { ...row, status: "aprobado" } : row))
    );
    limpiarSeleccion();
    showSuccess(
      "Aprobación masiva completada",
      `Aprobados: ${ids.length}${sinZona ? `\nSin zona (omitidos): ${sinZona}` : ""}`
    );
  };

  const enviarCorreoMasivo = async () => {
    if (!selectedRows.length) {
      showError("Sin selección", "Selecciona al menos un registro.");
      return;
    }

    const elegibles = selectedRows.filter((row) => row.status === "aprobado" && row.zona);
    const omitidos = selectedRows.length - elegibles.length;

    if (!elegibles.length) {
      showError(
        "Sin registros elegibles",
        "Solo se puede enviar correo a acreditaciones aprobadas con zona asignada."
      );
      return;
    }

    const response = await fetch("/api/send-approval", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: elegibles.map((row) => ({
          nombre: row.nombre,
          apellido: row.apellido,
          correo: row.correo,
          zona: row.zona,
          area: row.area,
        })),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      showError(
        "Error en envío masivo",
        `No se pudieron enviar los correos en batch.\n\nError: ${result?.error || "Desconocido"}`
      );
      return;
    }

    limpiarSeleccion();
    showSuccess(
      "Envío masivo de correos",
      `Enviados: ${result?.enviados ?? elegibles.length}${omitidos ? `\nOmitidos: ${omitidos}` : ""}`
    );
  };

  const eliminarRegistro = async (r: Row) => {
    setConfirmDelete(r);
  };

  const eliminarMasivo = async () => {
    if (!selectedIds.length) {
      showError("Sin selección", "Selecciona al menos un registro.");
      return;
    }
    setConfirmBulkDeleteOpen(true);
  };

  const confirmarEliminarMasivo = async () => {
    const ids = [...selectedIds];
    setConfirmBulkDeleteOpen(false);

    const { error } = await supabase
      .from("acreditaciones")
      .delete()
      .in("id", ids);

    if (error) {
      showError("Error al eliminar masivo", error.message);
      return;
    }

    setRows((prev) => prev.filter((row) => !ids.includes(row.id)));
    limpiarSeleccion();
    showSuccess("Eliminación masiva completada", `Se eliminaron ${ids.length} registros.`);
  };

  const confirmarEliminarRegistro = async () => {
    if (!confirmDelete) return;
    const target = confirmDelete;
    setConfirmDelete(null);

    const { error } = await supabase
      .from("acreditaciones")
      .delete()
      .eq("id", target.id);

    if (error) {
      showError("Error al eliminar", error.message);
      return;
    }

    // Elimina del estado local
    setRows((prev) => prev.filter((x) => x.id !== target.id));
    showSuccess("Registro eliminado", "La acreditación se eliminó correctamente.");
  };

  const exportCSV = () => {
    // Headers en español más descriptivos
    const headers = [
      "ID",
      "Área",
      "Nombre",
      "Apellido",
      "RUT/Documento",
      "Correo Electrónico",
      "Empresa/Medio",
      "Estado",
      "Zona Asignada",
      "Fecha de Solicitud",
    ];

    const lines = [headers.join(",")].concat(
      filtered.map((r) => {
        // Formatear fecha legible
        const fecha = new Date(r.created_at).toLocaleString("es-CL", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });

        // Traducir estado
        const estadoES =
          r.status === "pendiente"
            ? "Pendiente"
            : r.status === "aprobado"
            ? "Aprobado"
            : "Rechazado";

        // Usar el label legible de zona si existe
        const zonaLegible = r.zona ? ZONA_LABEL[r.zona] : "Sin asignar";

        const row = [
          r.id,
          r.area,
          r.nombre,
          r.apellido,
          r.rut,
          r.correo,
          r.empresa || "N/A",
          estadoES,
          zonaLegible,
          fecha,
        ];

        return row.map((val) => JSON.stringify(String(val))).join(",");
      })
    );

    const csv = "\uFEFF" + lines.join("\n"); // BOM para que Excel reconozca UTF-8
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `acreditaciones_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    // No necesitamos location.reload() porque onAuthStateChange actualiza automáticamente
  };


  return (
    <main className="min-h-screen w-full bg-gradient-to-br from-[#1F0F6C] via-[#1E0B97] to-[#1F0F6C] relative overflow-hidden">
      <Modal
        open={!!feedbackModal}
        type={feedbackModal?.type}
        title={feedbackModal?.title || ""}
        message={feedbackModal?.message || ""}
        onClose={() => setFeedbackModal(null)}
      />
      <ConfirmModal
        open={!!confirmDelete}
        title="Eliminar acreditación"
        message={
          confirmDelete
            ? `¿Estás seguro de eliminar la acreditación de ${confirmDelete.nombre} ${confirmDelete.apellido}?\n\nEsta acción no se puede deshacer.`
            : ""
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        danger
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmarEliminarRegistro}
      />
      <ConfirmModal
        open={confirmBulkDeleteOpen}
        title="Eliminar acreditaciones"
        message={`¿Seguro que deseas eliminar ${selectedIds.length} registros seleccionados?\n\nEsta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        danger
        onCancel={() => setConfirmBulkDeleteOpen(false)}
        onConfirm={confirmarEliminarMasivo}
      />

      {/* Decoración de fondo */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-[#FF9E1A] rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#1E0B97] rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-7xl">
          {/* Encabezado con logo */}
          <header className="mb-6 bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-4 sm:p-6 border border-[#FF9E1A]/30">
            <div className="flex flex-col gap-4">
              {/* Logo y título */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-24 h-10 sm:w-32 sm:h-12">
                    <Image
                      src="/img/VSLogo1.png"
                      alt="Logo VS"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                  <div className="border-l-2 border-[#FF9E1A]/60 pl-3 sm:pl-4">
                    <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-[#1F0F6C] via-[#1E0B97] to-[#1F0F6C] bg-clip-text text-transparent">
                      Panel de acreditaciones
                    </h1>
                    <p className="text-gray-600 text-xs sm:text-sm">
                      Gestión de solicitudes de acreditación
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <button
                    onClick={exportCSV}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF9E1A] to-[#FFD08A] hover:shadow-lg text-gray-900 font-semibold px-4 py-2.5 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="hidden sm:inline">Exportar CSV</span>
                    <span className="sm:hidden">Exportar</span>
                  </button>
                  <button
                    onClick={logout}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white hover:bg-gray-50 border-2 border-gray-300 text-gray-700 font-semibold px-4 py-2.5 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Filtros */}
          <div className="mb-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-5 border border-[#FF9E1A]/30">
            <h2 className="text-xs sm:text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Filtros de búsqueda</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  placeholder="Buscar por nombre, rut, correo, empresa"
                  className="w-full rounded-xl border border-gray-300 pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-[#1E0B97] focus:border-transparent transition-all outline-none"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <select
                className="rounded-xl border border-gray-300 px-3 py-2.5 focus:ring-2 focus:ring-[#1E0B97] focus:border-transparent transition-all outline-none"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              >
                <option value="*">Todas las áreas</option>
                {AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <select
                className="rounded-xl border border-gray-300 px-3 py-2.5 focus:ring-2 focus:ring-[#1E0B97] focus:border-transparent transition-all outline-none"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="*">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="aprobado">Aprobado</option>
                <option value="rechazado">Rechazado</option>
              </select>
              <select
                className="rounded-xl border border-gray-300 px-3 py-2.5 focus:ring-2 focus:ring-[#1E0B97] focus:border-transparent transition-all outline-none"
                value={jornada}
                onChange={(e) => setJornada(Number(e.target.value))}
              >
                {JORNADAS.map((day) => (
                  <option key={day} value={day}>
                    Dia {day}
                  </option>
                ))}
              </select>
              <button
                onClick={load}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1F0F6C] via-[#1E0B97] to-[#1F0F6C] hover:shadow-lg text-white font-semibold px-4 py-2.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refrescar
              </button>
            </div>
          </div>

          <div className="mb-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-4 border border-[#FF9E1A]/30">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <p className="text-sm font-medium text-gray-700">
                Seleccionados: <span className="font-semibold text-[#1E0B97]">{selectedIds.length}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={aprobarMasivoConZona}
                  className="inline-flex items-center gap-2 rounded-lg bg-green-500 hover:bg-green-600 text-white px-3 py-2 text-xs font-semibold transition-all"
                >
                  Aprobar masivo
                </button>
                <button
                  onClick={() => cambiarEstadoMasivo("rechazado")}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-500 hover:bg-red-600 text-white px-3 py-2 text-xs font-semibold transition-all"
                >
                  Rechazar masivo
                </button>
                <button
                  onClick={() => cambiarEstadoMasivo("pendiente")}
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 text-xs font-semibold transition-all"
                >
                  Pendiente masivo
                </button>
                <button
                  onClick={enviarCorreoMasivo}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 text-xs font-semibold transition-all"
                >
                  Enviar correos
                </button>
                <button
                  onClick={eliminarMasivo}
                  className="inline-flex items-center gap-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 text-xs font-semibold transition-all"
                >
                  Eliminar masivo
                </button>
                <button
                  onClick={limpiarSeleccion}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 text-xs font-semibold transition-all"
                >
                  Limpiar selección
                </button>
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-[#FF9E1A]/30">
            {/* Indicador de scroll en móvil */}
            <div className="block sm:hidden bg-[#FF9E1A]/10 px-4 py-2 text-center">
              <p className="text-xs text-[#1F0F6C]">
                <svg className="inline w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Desliza para ver más columnas
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gradient-to-r from-[#1F0F6C] via-[#1E0B97] to-[#1F0F6C] text-white">
                  <tr>
                    <th className="text-left p-2 sm:p-4 font-semibold border-r border-white/20 text-xs sm:text-sm">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleSelectAllFiltered}
                        aria-label="Seleccionar todo"
                      />
                    </th>
                    <th className="text-left p-2 sm:p-4 font-semibold border-r border-white/20 text-xs sm:text-sm">Fecha</th>
                    <th className="text-left p-2 sm:p-4 font-semibold border-r border-white/20 text-xs sm:text-sm">Área</th>
                    <th className="text-left p-2 sm:p-4 font-semibold border-r border-white/20 text-xs sm:text-sm">Nombre</th>
                    <th className="text-left p-2 sm:p-4 font-semibold border-r border-white/20 text-xs sm:text-sm">Documento</th>
                    <th className="text-left p-2 sm:p-4 font-semibold border-r border-white/20 text-xs sm:text-sm">Correo</th>
                    <th className="text-left p-2 sm:p-4 font-semibold border-r border-white/20 text-xs sm:text-sm">Empresa</th>
                    <th className="text-left p-2 sm:p-4 font-semibold border-r border-white/20 text-xs sm:text-sm">Estado</th>
                    <th className="text-left p-2 sm:p-4 font-semibold border-r border-white/20 text-xs sm:text-sm">Zona</th>
                    <th className="text-left p-2 sm:p-4 font-semibold border-r border-white/20 text-xs sm:text-sm">Asistencia</th>
                    <th className="text-left p-2 sm:p-4 font-semibold text-xs sm:text-sm">Acciones</th>
                  </tr>
                </thead>

                <tbody className="bg-white">
                  {loading ? (
                    <tr>
                      <td className="p-8 text-center" colSpan={11}>
                        <LoadingSpinner
                          size="md"
                          tone="brand"
                          label="Cargando acreditaciones..."
                          labelClassName="text-gray-600 font-medium"
                        />
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td className="p-8 text-center" colSpan={11}>
                        <div className="flex flex-col items-center gap-2">
                          <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <p className="text-gray-500 font-medium">No se encontraron resultados</p>
                          <p className="text-gray-400 text-sm">Intenta ajustar los filtros de búsqueda</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => {
                      const rowColor =
                        r.status === "aprobado"
                          ? "bg-green-50 hover:bg-green-100"
                          : r.status === "rechazado"
                          ? "bg-red-50 hover:bg-red-100"
                          : "hover:bg-gray-50";

                      return (
                        <tr key={r.id} className={`border-t border-gray-200 transition-colors ${rowColor}`}>
                          <td className="p-2 sm:p-4 whitespace-nowrap border-r border-gray-200">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(r.id)}
                              onChange={() => toggleRowSelection(r.id)}
                              aria-label={`Seleccionar ${r.nombre} ${r.apellido}`}
                            />
                          </td>
                          <td className="p-2 sm:p-4 whitespace-nowrap text-gray-600 border-r border-gray-200">
                            <div className="text-xs">
                              {new Date(r.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(r.created_at).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="p-2 sm:p-4 whitespace-nowrap border-r border-gray-200">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#FF9E1A]/15 text-[#1F0F6C]">
                              {r.area}
                            </span>
                          </td>
                          <td className="p-2 sm:p-4 whitespace-nowrap font-medium text-gray-900 border-r border-gray-200 text-xs sm:text-sm">
                            {r.nombre} {r.apellido}
                          </td>
                          <td className="p-2 sm:p-4 whitespace-nowrap text-gray-600 font-mono text-xs border-r border-gray-200">
                            {r.rut}
                          </td>
                          <td className="p-2 sm:p-4 whitespace-nowrap text-gray-600 text-xs border-r border-gray-200">
                            {r.correo}
                          </td>
                          <td className="p-2 sm:p-4 whitespace-nowrap text-gray-600 border-r border-gray-200 text-xs sm:text-sm">
                            {r.empresa ?? "—"}
                          </td>

                          {/* Estado */}
                          <td className="p-2 sm:p-4 whitespace-nowrap border-r border-gray-200">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                              r.status === "aprobado"
                                ? "bg-green-100 text-green-800"
                                : r.status === "rechazado"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {r.status}
                            </span>
                          </td>

                          {/* Zona (select editable con etiquetas nuevas) */}
                          <td className="p-2 sm:p-4 whitespace-nowrap border-r border-gray-200">
                            <select
                              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#1E0B97] focus:border-transparent transition-all outline-none bg-white"
                              value={r.zona ?? ""}
                              onChange={(e) => {
                                const val = e.target.value as Zona | "";
                                setZona(
                                  r.id,
                                  val === "" ? null : (val as Zona)
                                );
                              }}
                            >
                              <option value="">Sin asignar</option>
                              {ZONAS.map((z) => (
                                <option key={z} value={z}>
                                  {ZONA_LABEL[z]}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="p-2 sm:p-4 whitespace-nowrap border-r border-gray-200">
                            <button
                              onClick={() =>
                                setAsistenciaDia(r.id, !(asistencia[r.id] ?? false))
                              }
                              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                                asistencia[r.id]
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {asistencia[r.id] ? "Asistio" : "Sin registro"}
                            </button>
                          </td>

                          <td className="p-2 sm:p-4 whitespace-nowrap">
                            <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                              <button
                                onClick={() => aprobarConZona(r)}
                                className="group relative inline-flex items-center justify-center rounded-lg bg-green-500 hover:bg-green-600 text-white px-2 sm:px-2.5 py-1.5 text-xs font-medium transition-all hover:scale-105 active:scale-95"
                                title="Aprobar"
                              >
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="absolute left-1/2 -translate-x-1/2 -top-8 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                  Aprobar
                                </span>
                              </button>
                              <button
                                onClick={() => enviarCorreoAprobacion(r)}
                                className="group relative inline-flex items-center justify-center rounded-lg bg-blue-500 hover:bg-blue-600 text-white px-2 sm:px-2.5 py-1.5 text-xs font-medium transition-all hover:scale-105 active:scale-95"
                                title="Enviar correo"
                              >
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.945a2 2 0 002.22 0L21 8m-18 8h18a2 2 0 002-2V8a2 2 0 00-2-2H3a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                </svg>
                                <span className="absolute left-1/2 -translate-x-1/2 -top-8 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                  Enviar correo
                                </span>
                              </button>
                              <button
                                onClick={() => setEstado(r.id, "rechazado")}
                                className="group relative inline-flex items-center justify-center rounded-lg bg-red-500 hover:bg-red-600 text-white px-2 sm:px-2.5 py-1.5 text-xs font-medium transition-all hover:scale-105 active:scale-95"
                                title="Rechazar"
                              >
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span className="absolute left-1/2 -translate-x-1/2 -top-8 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                  Rechazar
                                </span>
                              </button>
                              <button
                                onClick={() => setEstado(r.id, "pendiente")}
                                className="group relative inline-flex items-center justify-center rounded-lg bg-gray-500 hover:bg-gray-600 text-white px-2 sm:px-2.5 py-1.5 text-xs font-medium transition-all hover:scale-105 active:scale-95"
                                title="Marcar como pendiente"
                              >
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="absolute left-1/2 -translate-x-1/2 -top-8 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                  Pendiente
                                </span>
                              </button>
                              <button
                                onClick={() => eliminarRegistro(r)}
                                className="group relative inline-flex items-center justify-center rounded-lg bg-orange-500 hover:bg-orange-600 text-white px-2 sm:px-2.5 py-1.5 text-xs font-medium transition-all hover:scale-105 active:scale-95"
                                title="Eliminar registro"
                              >
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span className="absolute left-1/2 -translate-x-1/2 -top-8 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                  Eliminar
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}




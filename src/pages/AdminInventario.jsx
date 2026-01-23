import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import {
  getEquipos,
  getLaptops,
  getExtensiones,
  createEquipo,
  updateEquipo,
  deleteEquipo,
  createLaptop,
  updateLaptop,
  deleteLaptop,
  createExtension,
  updateExtension,
  deleteExtension,
} from "@/lib/reservas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

function EstadoBadge({ estado }) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium border ${
        estado
          ? "bg-green-100 text-green-800 border-green-300"
          : "bg-yellow-100 text-yellow-800 border-yellow-300"
      }`}
    >
      {estado ? "Activo" : "Mantenimiento"}
    </span>
  );
}

export default function AdminInventario() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "equipos";
  const [tab, setTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [equipos, setEquipos] = useState([]);
  const [laptops, setLaptops] = useState([]);
  const [extensiones, setExtensiones] = useState([]);

  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    document.title = "Inventario | Admin";
  }, []);

  useEffect(() => {
    const sp = new URLSearchParams(searchParams);
    sp.set("tab", tab);
    setSearchParams(sp, { replace: true });
  }, [tab]);

  useEffect(() => {
    const label =
      tab === "equipos"
        ? "Proyectores"
        : tab === "laptops"
        ? "Laptops"
        : "Extensiones";
    document.title = `Inventario - ${label} | Admin`;
  }, [tab]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [eq, la, ex] = await Promise.all([
        getEquipos({ onlyDisponibles: false }),
        getLaptops({ onlyDisponibles: false }),
        getExtensiones({ onlyDisponibles: false }),
      ]);
      setEquipos(eq || []);
      setLaptops(la || []);
      setExtensiones(ex || []);
    } catch (err) {
      Swal.fire(
        "Error",
        err.message || "No se pudo cargar el inventario",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const resetForm = () => setForm({});

  const openCreate = () => {
    setIsEdit(false);
    if (tab === "equipos") {
      setForm({ hdmi: false, vga: false, estado: true });
    } else if (tab === "laptops") {
      setForm({ estado: true });
    } else if (tab === "extensiones") {
      setForm({ estado: true });
    } else {
      resetForm();
    }
    setOpen(true);
  };
  const openEdit = (row) => {
    setIsEdit(true);
    if (tab === "equipos") {
      setForm({
        id: row.id,
        nombre_equipo: row.nombre_equipo,
        hdmi: !!row.hdmi,
        vga: !!row.vga,
        estado: Number(row.estado) === 1,
      });
    } else if (tab === "laptops") {
      setForm({
        id: row.id,
        nombre_laptop: row.nombre_laptop,
        estado: Number(row.estado) === 1,
      });
    } else {
      setForm({
        id: row.id,
        nombre_extension: row.nombre_extension,
        estado: Number(row.estado) === 1,
      });
    }
    setOpen(true);
  };

  const onDelete = async (row) => {
    const res = await Swal.fire({
      title: "¿Eliminar?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
      reverseButtons: true,
      focusCancel: true,
    });
    if (!res.isConfirmed) return;
    try {
      if (tab === "equipos") await deleteEquipo({ id: row.id });
      else if (tab === "laptops") await deleteLaptop({ id: row.id });
      else await deleteExtension({ id: row.id });
      await Swal.fire("Eliminado", "El elemento fue eliminado", "success");
      loadAll();
    } catch (err) {
      Swal.fire("Error", err.message || "No se pudo eliminar", "error");
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      if (tab === "equipos") {
        const payload = {
          nombre_equipo: form.nombre_equipo,
          hdmi: !!form.hdmi,
          vga: !!form.vga,
          estado: form.estado ? 1 : 0,
        };
        if (isEdit) await updateEquipo({ id: form.id, ...payload });
        else await createEquipo(payload);
      } else if (tab === "laptops") {
        const payload = {
          nombre_laptop: form.nombre_laptop,
          estado: form.estado ? 1 : 0,
        };
        if (isEdit) await updateLaptop({ id: form.id, ...payload });
        else await createLaptop(payload);
      } else {
        const payload = {
          nombre_extension: form.nombre_extension,
          estado: form.estado ? 1 : 0,
        };
        if (isEdit) await updateExtension({ id: form.id, ...payload });
        else await createExtension(payload);
      }
      setOpen(false);
      resetForm();
      await Swal.fire(
        "Guardado",
        "Los cambios se aplicaron correctamente",
        "success"
      );
      loadAll();
    } catch (err) {
      Swal.fire("Error", err.message || "No se pudo guardar", "error");
    } finally {
      setSaving(false);
    }
  };

  const ActivoSwitch = ({ checked, onChange }) => (
    <label className="inline-flex items-center gap-3 cursor-pointer select-none">
      <input
        type="checkbox"
        role="switch"
        aria-checked={!!checked}
        className="sr-only peer"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div
        className={`relative h-5 w-10 rounded-full transition-colors ${
          checked ? "bg-green-500" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </div>
      <div className="relative w-28 h-5 overflow-hidden">
        <div
          className={`absolute inset-0 flex w-[200%] items-center transition-transform duration-300 ${
            checked ? "translate-x-0" : "-translate-x-1/2"
          }`}
        >
          <div className="w-1/2 text-sm">Activo</div>
          <div className="w-1/2 text-sm">Mantenimiento</div>
        </div>
      </div>
    </label>
  );

  const EquipoFields = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
        <Label className="text-left sm:text-right">Nombre</Label>
        <Input
          autoFocus
          inputMode="text"
          autoComplete="off"
          onKeyDownCapture={(e) => e.stopPropagation()}
          value={form.nombre_equipo || ""}
          onChange={(e) =>
            setForm((f) => ({ ...f, nombre_equipo: e.target.value }))
          }
          placeholder="Proyector ..."
          className="col-span-1 sm:col-span-3"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
        <Label className="text-left sm:text-right">Compatibilidad</Label>
        <div className="col-span-1 sm:col-span-3 flex items-center gap-6">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={!!form.hdmi}
              onChange={(e) =>
                setForm((f) => ({ ...f, hdmi: e.target.checked }))
              }
            />
            <span>HDMI</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={!!form.vga}
              onChange={(e) =>
                setForm((f) => ({ ...f, vga: e.target.checked }))
              }
            />
            <span>VGA</span>
          </label>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
        <Label className="text-left sm:text-right">Estado</Label>
        <div className="col-span-1 sm:col-span-3">
          <ActivoSwitch
            checked={!!form.estado}
            onChange={(v) => setForm((f) => ({ ...f, estado: v }))}
          />
        </div>
      </div>
    </div>
  );

  const LaptopFields = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
        <Label className="text-left sm:text-right">Nombre</Label>
        <Input
          autoFocus
          inputMode="text"
          autoComplete="off"
          onKeyDownCapture={(e) => e.stopPropagation()}
          value={form.nombre_laptop || ""}
          onChange={(e) =>
            setForm((f) => ({ ...f, nombre_laptop: e.target.value }))
          }
          placeholder="Laptop ..."
          className="col-span-1 sm:col-span-3"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
        <Label className="text-left sm:text-right">Estado</Label>
        <div className="col-span-1 sm:col-span-3">
          <ActivoSwitch
            checked={!!form.estado}
            onChange={(v) => setForm((f) => ({ ...f, estado: v }))}
          />
        </div>
      </div>
    </div>
  );

  const ExtensionFields = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
        <Label className="text-left sm:text-right">Nombre</Label>
        <Input
          autoFocus
          inputMode="text"
          autoComplete="off"
          onKeyDownCapture={(e) => e.stopPropagation()}
          value={form.nombre_extension || ""}
          onChange={(e) =>
            setForm((f) => ({ ...f, nombre_extension: e.target.value }))
          }
          placeholder="Extensión ..."
          className="col-span-1 sm:col-span-3"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
        <Label className="text-left sm:text-right">Estado</Label>
        <div className="col-span-1 sm:col-span-3">
          <ActivoSwitch
            checked={!!form.estado}
            onChange={(v) => setForm((f) => ({ ...f, estado: v }))}
          />
        </div>
      </div>
    </div>
  );

  const TableBase = ({
    columns,
    columnWidths,
    rows,
    renderRow,
    containerClass,
  }) => (
    <div
      className={`overflow-x-auto rounded border hidden sm:block ${
        containerClass || ""
      }`}
    >
      <table className="w-full table-fixed text-sm">
        {Array.isArray(columnWidths) &&
        columnWidths.length === columns.length ? (
          <colgroup>
            {columnWidths.map((w, i) => (
              <col key={i} style={{ width: w }} />
            ))}
          </colgroup>
        ) : null}
        <thead>
          <tr className="bg-muted/30">
            {columns.map((c) => {
              let align = "text-left";
              if (c === "Compatibilidad" || c === "Estado")
                align = "text-center";
              if (c === "Acciones") align = "text-right";
              return (
                <th key={c} className={`px-3 py-2 font-semibold ${align}`}>
                  {c}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-6 text-center text-muted-foreground"
              >
                No hay elementos.
              </td>
            </tr>
          ) : (
            rows.map((r) => renderRow(r))
          )}
        </tbody>
      </table>
    </div>
  );

  const CardListBase = ({ rows, renderCard }) => (
    <div className="sm:hidden space-y-3">
      {rows.length === 0 ? (
        <div className="rounded border p-4 text-center text-muted-foreground">
          No hay elementos.
        </div>
      ) : (
        rows.map((r) => <div key={r.id}>{renderCard(r)}</div>)
      )}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full sm:w-auto rounded border overflow-hidden">
          <button
            className={`flex-1 px-3 py-2 text-sm text-center ${
              tab === "equipos" ? "bg-[#0D4D98] text-white" : "bg-background"
            }`}
            onClick={() => setTab("equipos")}
          >
            Proyectores
          </button>
          <button
            className={`flex-1 px-3 py-2 text-sm text-center ${
              tab === "laptops" ? "bg-[#0D4D98] text-white" : "bg-background"
            }`}
            onClick={() => setTab("laptops")}
          >
            Laptops
          </button>
          <button
            className={`flex-1 px-3 py-2 text-sm text-center ${
              tab === "extensiones"
                ? "bg-[#0D4D98] text-white"
                : "bg-background"
            }`}
            onClick={() => setTab("extensiones")}
          >
            Extensiones
          </button>
        </div>
        <Button className="bg-[#0D4D98] w-full sm:w-auto" onClick={openCreate}>
          + Agregar
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-6">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          <span>Cargando inventario...</span>
        </div>
      ) : (
        <>
          {tab === "equipos" ? (
            <>
              <CardListBase
                rows={equipos}
                renderCard={(e) => (
                  <div className="rounded border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{e.nombre_equipo}</div>
                        <div className="mt-1 flex gap-2 text-xs">
                          {e.hdmi ? (
                            <span className="rounded border px-2 py-0.5">
                              HDMI
                            </span>
                          ) : null}
                          {e.vga ? (
                            <span className="rounded border px-2 py-0.5">
                              VGA
                            </span>
                          ) : null}
                          {!e.hdmi && !e.vga ? (
                            <span className="text-muted-foreground">
                              Sin compatibilidad
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <EstadoBadge estado={Number(e.estado) === 1} />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => openEdit(e)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => onDelete(e)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                )}
              />
              <TableBase
                columns={["Nombre", "Compatibilidad", "Estado", "Acciones"]}
                columnWidths={["10%", "10%", "15%", "10%"]}
                rows={equipos}
                renderRow={(e) => (
                  <tr key={e.id} className="border-t">
                    <td className="px-3 py-2">{e.nombre_equipo}</td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex justify-center gap-2 text-xs">
                        {e.hdmi ? (
                          <span className="rounded border px-2 py-0.5">
                            HDMI
                          </span>
                        ) : null}
                        {e.vga ? (
                          <span className="rounded border px-2 py-0.5">
                            VGA
                          </span>
                        ) : null}
                        {!e.hdmi && !e.vga ? (
                          <span className="text-muted-foreground">—</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <EstadoBadge estado={Number(e.estado) === 1} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(e)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onDelete(e)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              />
            </>
          ) : null}

          {tab === "laptops" ? (
            <>
              <CardListBase
                rows={laptops}
                renderCard={(l) => (
                  <div className="rounded border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-medium">{l.nombre_laptop}</div>
                      <EstadoBadge estado={Number(l.estado) === 1} />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => openEdit(l)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => onDelete(l)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                )}
              />
              <TableBase
                columns={["Nombre", "Estado", "Acciones"]}
                columnWidths={["12%", "15%", "15%"]}
                containerClass="sm:max-w-3xl sm:mx-auto"
                rows={laptops}
                renderRow={(l) => (
                  <tr key={l.id} className="border-t">
                    <td className="px-3 py-2">{l.nombre_laptop}</td>
                    <td className="px-3 py-2 text-center">
                      <EstadoBadge estado={Number(l.estado) === 1} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(l)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onDelete(l)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              />
            </>
          ) : null}

          {tab === "extensiones" ? (
            <>
              <CardListBase
                rows={extensiones}
                renderCard={(x) => (
                  <div className="rounded border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-medium">{x.nombre_extension}</div>
                      <EstadoBadge estado={Number(x.estado) === 1} />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => openEdit(x)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => onDelete(x)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                )}
              />
              <TableBase
                columns={["Nombre", "Estado", "Acciones"]}
                columnWidths={["12%", "15%", "15%"]}
                containerClass="sm:max-w-3xl sm:mx-auto"
                rows={extensiones}
                renderRow={(x) => (
                  <tr key={x.id} className="border-t">
                    <td className="px-3 py-2">{x.nombre_extension}</td>
                    <td className="px-3 py-2 text-center">
                      <EstadoBadge estado={Number(x.estado) === 1} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(x)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onDelete(x)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              />
            </>
          ) : null}
        </>
      )}

      <Dialog
        open={open}
        modal={false}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) resetForm();
        }}
      >
        <DialogContent
          className="sm:max-w-xl"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Editar" : "Agregar"}{" "}
              {tab === "equipos"
                ? "Proyector"
                : tab === "laptops"
                ? "Laptop"
                : "Extensión"}
            </DialogTitle>
            <DialogDescription>
              Completa los campos y confirma para{" "}
              {isEdit ? "guardar" : "agregar"}.
            </DialogDescription>
          </DialogHeader>

          {tab === "equipos" ? (
            <EquipoFields />
          ) : tab === "laptops" ? (
            <LaptopFields />
          ) : (
            <ExtensionFields />
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button className="bg-[#0D4D98]" onClick={save} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <span>Guardar</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

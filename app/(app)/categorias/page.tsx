"use client";

import { useEffect, useState } from "react";
import { ApiError, createCategory, deleteCategory, listCategories, updateCategory } from "@/lib/api";
import type { Category } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { CategoryDot } from "@/components/CategoryDot";
import { Modal, ModalHeader } from "@/components/Modal";

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formTarget, setFormTarget] = useState<Category | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  function refresh() {
    setLoading(true);
    listCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="flex-1 p-8 flex flex-col gap-5 min-w-0">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="m-0 text-[22px] font-semibold tracking-tight">Categorías</h1>
          <p className="mt-1 text-sm text-ink-2">{categories.length} categorías activas</p>
        </div>
        <button
          onClick={() => setFormTarget("new")}
          className="flex items-center gap-2 border-none bg-accent text-white text-sm font-medium px-4 py-2.5 rounded-lg"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nueva categoría
        </button>
      </div>

      <div className="bg-surface border border-border rounded-[10px] overflow-hidden">
        <div className="grid grid-cols-[28px_1.3fr_1.8fr_130px_140px_80px] items-center px-5 py-3 border-b border-border text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
          <div />
          <div>Nombre</div>
          <div>Descripción</div>
          <div>Tickets</div>
          <div>Gasto histórico</div>
          <div />
        </div>

        {!loading && categories.length === 0 && (
          <div className="px-5 py-12 text-center text-ink-muted text-sm">
            No hay categorías creadas todavía.
          </div>
        )}

        {categories.map((cat) => (
          <div
            key={cat.id}
            className="grid grid-cols-[28px_1.3fr_1.8fr_130px_140px_80px] items-center px-5 py-3 border-b border-border text-[13px]"
          >
            <CategoryDot categoryId={cat.id} size={11} />
            <div className="font-medium">{cat.name}</div>
            <div className="text-ink-2 whitespace-nowrap overflow-hidden text-ellipsis">
              {cat.description || "—"}
            </div>
            <div className="font-mono text-ink-2">{cat.ticket_count}</div>
            <div className="font-mono tabular-nums">{formatCurrency(cat.total_amount)}</div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setFormTarget(cat)}
                className="border-none bg-transparent p-1 flex rounded-md text-ink-muted"
                aria-label="Editar"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
                </svg>
              </button>
              <button
                onClick={() => setDeleteTarget(cat)}
                className="border-none bg-transparent p-1 flex rounded-md text-ink-muted"
                aria-label="Eliminar"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 7h16M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {formTarget && (
        <CategoryFormModal
          target={formTarget}
          onClose={() => setFormTarget(null)}
          onSaved={refresh}
        />
      )}

      {deleteTarget && (
        <DeleteCategoryModal
          category={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={refresh}
        />
      )}
    </main>
  );
}

function CategoryFormModal({
  target,
  onClose,
  onSaved,
}: {
  target: Category | "new";
  onClose: () => void;
  onSaved: () => void;
}) {
  const isCreate = target === "new";
  const [name, setName] = useState(isCreate ? "" : target.name);
  const [description, setDescription] = useState(isCreate ? "" : target.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (isCreate) {
        await createCategory({ name, description: description || null });
      } else {
        await updateCategory(target.id, { name, description: description || null });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar la categoría.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} width={420}>
      <ModalHeader title={isCreate ? "Nueva categoría" : "Editar categoría"} onClose={onClose} />
      <div className="flex flex-col gap-3.5">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted mb-1.5">
            Nombre
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre de la categoría"
            className="w-full border border-border rounded-[7px] px-3 py-2.5 text-[13px] outline-none focus:border-accent"
          />
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted mb-1.5">
            Descripción
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción breve"
            rows={2}
            className="w-full border border-border rounded-[7px] px-3 py-2.5 text-[13px] outline-none focus:border-accent resize-none"
          />
        </div>
      </div>
      {error && <div className="text-xs text-[#b3302f] mt-3">{error}</div>}
      <div className="flex gap-2.5 mt-5.5">
        <button
          onClick={onClose}
          className="flex-1 border border-border bg-surface text-ink-2 text-sm font-medium py-2.5 rounded-lg"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 border-none bg-accent text-white text-sm font-medium py-2.5 rounded-lg disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </Modal>
  );
}

function DeleteCategoryModal({
  category,
  onClose,
  onDeleted,
}: {
  category: Category;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      await deleteCategory(category.id);
      onDeleted();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo eliminar la categoría.");
      setDeleting(false);
    }
  }

  return (
    <Modal onClose={onClose} width={380}>
      <div className="text-[15px] font-semibold mb-2">Eliminar categoría</div>
      <p className="text-[13px] text-ink-2 leading-relaxed mb-5">
        ¿Seguro que querés eliminar &quot;{category.name}&quot;? Los tickets asociados quedarán
        sin categoría asignada.
      </p>
      {error && <div className="text-xs text-[#b3302f] mb-3">{error}</div>}
      <div className="flex gap-2.5">
        <button
          onClick={onClose}
          className="flex-1 border border-border bg-surface text-ink-2 text-sm font-medium py-2.5 rounded-lg"
        >
          Cancelar
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex-1 border-none bg-[#d03b3b] text-white text-sm font-medium py-2.5 rounded-lg disabled:opacity-60"
        >
          {deleting ? "Eliminando…" : "Eliminar"}
        </button>
      </div>
    </Modal>
  );
}

"use client";
import { useEffect, useState } from "react";
import { getPlans, createPlan, updatePlan, deletePlan } from "@/lib/api";
import { Plus, Edit2, Trash2, Package, Store, Check, X } from "lucide-react";

const ALL_MODULES = [
    { key: "reports", label: "Reportes" },
    { key: "branches", label: "Sucursales" },
    { key: "users", label: "Usuarios" },
    { key: "stock_movements", label: "Stock - Movimientos" },
    { key: "suppliers", label: "Compras - Proveedores" },
    { key: "purchase_orders", label: "Compras - Órdenes de Compra" },
    { key: "supplier_payments", label: "Compras - Pagos a Proveedores" },
    { key: "expenses", label: "Compras - Otros Gastos" },
    { key: "sales", label: "Ventas" },
    { key: "coupons", label: "Administración - Cupones" },
    { key: "discounts", label: "Administración - Descuentos" },
    { key: "shipping", label: "Envíos" },
    { key: "payment_gateways", label: "Pasarelas de Pago" },
    { key: "events", label: "Eventos" },
    { key: "bot", label: "Asistente Bot" },
    { key: "web_content", label: "Contenido Web" },
    { key: "blog", label: "Blog" },
    { key: "audit", label: "Auditoría" },
    { key: "alerts", label: "Alertas" },
];

const PAYMENT_METHODS = [
    { key: "payment_method_cash", label: "Efectivo" },
    { key: "payment_method_card", label: "Tarjeta de Crédito" },
    { key: "payment_method_debit", label: "Tarjeta de Débito" },
    { key: "payment_method_transfer", label: "Transferencia" },
    { key: "payment_method_mercadopago", label: "Mercado Pago" },
    { key: "payment_method_qr", label: "Pago con QR" },
];

const MODULE_LABELS: Record<string, string> = {
    products: "Productos",
    categories: "Categorías",
    settings: "Configuración",
    inventory: "Inventario",
    pos: "Punto de Venta (POS)",
    custom_ticket: "Factura y Ticket",
    custom_theme: "Apariencia y Colores",
    access_control: "Control de Acceso",
    backups: "Copias de Seguridad"
};
ALL_MODULES.forEach(m => MODULE_LABELS[m.key] = m.label);
PAYMENT_METHODS.forEach(m => MODULE_LABELS[m.key] = m.label);

function getModuleLabel(key: string) {
    return MODULE_LABELS[key] || key;
}

interface Plan {
    id: number; name: string; monthlyPrice: number; maxProducts: number;
    maxBranches: number; allowCustomDomain: boolean; allowInvoicing: boolean;
    allowPOS: boolean; enabledModules: string[]; description?: string;
    isActive: boolean; _count?: { tenants: number };
}

const emptyForm = { name: "", monthlyPrice: "", maxProducts: "50", maxBranches: "1", allowCustomDomain: false, allowInvoicing: false, allowPOS: false, enabledModules: ["sales", "payment_method_cash", "payment_method_transfer", "payment_method_mercadopago"], description: "", isActive: true };

export default function PlansPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<any>({ ...emptyForm });
    const [saving, setSaving] = useState(false);

    const fetchPlans = () => {
        setLoading(true);
        getPlans().then(r => setPlans(r.data.data || [])).catch(console.error).finally(() => setLoading(false));
    };
    useEffect(() => { fetchPlans(); }, []);

    const openCreate = () => { setEditingId(null); setForm({ ...emptyForm }); setShowModal(true); };
    const openEdit = (p: Plan) => {
        setEditingId(p.id);
        setForm({ name: p.name, monthlyPrice: p.monthlyPrice.toString(), maxProducts: p.maxProducts.toString(), maxBranches: p.maxBranches.toString(), allowCustomDomain: p.allowCustomDomain, allowInvoicing: p.allowInvoicing, allowPOS: p.allowPOS, enabledModules: p.enabledModules || [], description: p.description || "", isActive: p.isActive });
        setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true);
        const data = { ...form, monthlyPrice: parseFloat(form.monthlyPrice), maxProducts: parseInt(form.maxProducts), maxBranches: parseInt(form.maxBranches) };
        try {
            if (editingId) await updatePlan(editingId, data);
            else await createPlan(data);
            setShowModal(false); fetchPlans();
        } catch (err: any) { alert(err.response?.data?.message || "Error al guardar plan"); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Deseas eliminar este plan? Esta acción no se puede deshacer si hay Negocios    en este plan.")) return;
        try { await deletePlan(id); fetchPlans(); }
        catch (err: any) { alert(err.response?.data?.message || "Error al eliminar plan"); }
    };

    const toggleModule = (mod: string) => {
        const modules = form.enabledModules.includes(mod)
            ? form.enabledModules.filter((m: string) => m !== mod)
            : [...form.enabledModules, mod];
        setForm({ ...form, enabledModules: modules });
    };

    return (
        <div className="animate-fade-in space-y-6">

            {/* Title section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 dark:border-[#1e214d]/40 pb-5">
                <div>
                    <h2 className="text-xl font-bold text-neutral-800 dark:text-white tracking-tight">Planes de Suscripción</h2>
                    <p className="text-xs text-neutral-500 dark:text-[#9499c3]">Define tarifas, límites de inventario y módulos activos para tus Negocios</p>
                </div>
                <button
                    className="btn-grad px-5 py-2.5 text-xs flex items-center gap-2 cursor-pointer shadow-sm"
                    onClick={openCreate}
                >
                    <Plus size={16} /> Crear Nuevo Plan
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin" style={{ width: 28, height: 28, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%" }} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map((p) => (
                        <div key={p.id} className="glow-card p-6 border-neutral-300/80 dark:border-[#1e214d]/60 hover:border-orange-500/40 dark:hover:border-indigo-500/40 flex flex-col justify-between relative transition-all">
                            <div className="space-y-4">

                                {/* Header */}
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-extrabold text-sm text-neutral-800 dark:text-white">{p.name}</h3>
                                        <p className="text-[10px] text-neutral-400 dark:text-[#9499c3] mt-0.5">{p._count?.tenants || 0} negocios suscritos</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xl font-black text-orange-500 dark:text-indigo-400">${Number(p.monthlyPrice).toLocaleString()}</span>
                                        <span className="text-[10px] text-neutral-400 dark:text-[#9499c3]">/mes</span>
                                    </div>
                                </div>

                                {p.description && (
                                    <p className="text-xs text-neutral-500 dark:text-[#9499c3] leading-relaxed bg-neutral-100 dark:bg-[#0c0d24]/50 p-3 rounded-xl border border-neutral-200 dark:border-[#1e214d]/30">
                                        {p.description}
                                    </p>
                                )}

                                {/* Limits & Features list */}
                                <div className="space-y-2.5 pt-2">
                                    <div className="flex items-center gap-2.5 text-xs text-neutral-700 dark:text-white/90">
                                        <div className="w-6 h-6 rounded-lg bg-orange-500/10 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                                            <Package size={12} className="text-orange-600 dark:text-indigo-400" />
                                        </div>
                                        <span>Hasta <strong className="text-orange-500 dark:text-indigo-300 font-semibold">{p.maxProducts}</strong> productos</span>
                                    </div>

                                    <div className="flex items-center gap-2.5 text-xs text-neutral-700 dark:text-white/90">
                                        <div className="w-6 h-6 rounded-lg bg-orange-500/10 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                                            <Store size={12} className="text-orange-600 dark:text-indigo-400" />
                                        </div>
                                        <span>Hasta <strong className="text-orange-500 dark:text-indigo-300 font-semibold">{p.maxBranches}</strong> sucursales</span>
                                    </div>

                                    <div className="flex items-center gap-2.5 text-xs text-neutral-700 dark:text-white/90">
                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${p.allowPOS ? "bg-emerald-500/10 dark:bg-emerald-500/10" : "bg-neutral-100 dark:bg-[#121334]"}`}>
                                            {p.allowPOS ? <Check size={12} className="text-emerald-600 dark:text-emerald-400" /> : <X size={12} className="text-neutral-400 dark:text-[#9499c3]/40" />}
                                        </div>
                                        <span className={p.allowPOS ? "text-neutral-800 dark:text-white font-medium" : "text-neutral-400 dark:text-[#9499c3]/50"}>Terminal POS de caja</span>
                                    </div>

                                    <div className="flex items-center gap-2.5 text-xs text-neutral-700 dark:text-white/90">
                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${p.enabledModules?.includes("sales") ? "bg-emerald-500/10 dark:bg-emerald-500/10" : "bg-neutral-100 dark:bg-[#121334]"}`}>
                                            {p.enabledModules?.includes("sales") ? <Check size={12} className="text-emerald-600 dark:text-emerald-400" /> : <X size={12} className="text-neutral-400 dark:text-[#9499c3]/40" />}
                                        </div>
                                        <span className={p.enabledModules?.includes("sales") ? "text-neutral-800 dark:text-white font-medium" : "text-neutral-400 dark:text-[#9499c3]/50"}>Módulo Ventas Integrado</span>
                                    </div>
                                </div>

                                {/* Modules Tags */}
                                <div className="pt-2 border-t border-neutral-200 dark:border-[#1e214d]/40">
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 dark:text-[#9499c3]/60 block mb-2">Módulos Activos</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(p.enabledModules || []).map((m) => (
                                            <span key={m} className="text-[9px] px-2 py-0.5 rounded bg-orange-500/5 dark:bg-indigo-500/5 border border-orange-500/15 dark:border-indigo-500/15 text-orange-600 dark:text-indigo-300 font-mono capitalize">
                                                {getModuleLabel(m)}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                            </div>

                            {/* Actions Footer */}
                            <div className="flex gap-2.5 border-t border-neutral-200 dark:border-[#1e214d]/40 pt-4 mt-6">
                                <button
                                    className="flex-1 py-2 rounded-xl border border-neutral-200 dark:border-[#1e214d]/60 bg-neutral-100 dark:bg-[#121334]/50 hover:bg-neutral-200 dark:hover:bg-[#16183a] text-neutral-600 dark:text-[#9499c3] hover:text-neutral-800 dark:hover:text-white text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                                    onClick={() => openEdit(p)}
                                >
                                    <Edit2 size={13} /> Editar Plan
                                </button>
                                <button
                                    className="w-9 h-9 rounded-xl bg-red-500/5 hover:bg-red-500/15 border border-red-500/10 hover:border-red-500/30 text-red-500 flex items-center justify-center transition-all cursor-pointer"
                                    onClick={() => handleDelete(p.id)}
                                    title="Eliminar Plan"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                        </div>
                    ))}
                    {plans.length === 0 && (
                        <p className="text-center text-xs text-neutral-400 dark:text-[#9499c3] col-span-full py-12">No hay planes creados todavía.</p>
                    )}
                </div>
            )}

            {/* Plan Form Modal */}
            {showModal && (
                <div className="premium-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="premium-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620 }}>

                        {/* Modal Header */}
                        <div className="flex justify-between items-center border-b border-neutral-200 dark:border-[#1e214d]/50 pb-4 mb-6">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-orange-500/10 dark:bg-indigo-500/10 border border-orange-500/20 dark:border-indigo-500/20 flex items-center justify-center text-orange-500 dark:text-indigo-400">
                                    <Package size={16} />
                                </div>
                                <h3 className="text-sm font-bold text-neutral-800 dark:text-white">{editingId ? "Actualizar Plan SaaS" : "Nuevo Plan de Suscripción"}</h3>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-[#121334] border border-neutral-200 dark:border-[#1e214d]/80 flex items-center justify-center text-neutral-500 dark:text-[#9499c3] hover:text-neutral-800 dark:hover:text-white cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Nombre del Plan *</label>
                                    <input
                                        className="premium-input w-full px-3.5 py-2 text-xs"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="Ej. Plan Pro, Plan Oro"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Precio Mensual ($) *</label>
                                    <input
                                        className="premium-input w-full px-3.5 py-2 text-xs"
                                        type="number"
                                        value={form.monthlyPrice}
                                        onChange={(e) => setForm({ ...form, monthlyPrice: e.target.value })}
                                        placeholder="5000"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Límite de Productos</label>
                                    <input
                                        className="premium-input w-full px-3.5 py-2 text-xs"
                                        type="number"
                                        value={form.maxProducts}
                                        onChange={(e) => setForm({ ...form, maxProducts: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Límite de Sucursales</label>
                                    <input
                                        className="premium-input w-full px-3.5 py-2 text-xs"
                                        type="number"
                                        value={form.maxBranches}
                                        onChange={(e) => setForm({ ...form, maxBranches: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Breve Descripción</label>
                                <input
                                    className="premium-input w-full px-3.5 py-2 text-xs"
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Ej. Ideal para cadenas de Negocios medianas"
                                />
                            </div>

                            {/* Toggles */}
                            <div>
                                <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-2">Habilitación de Módulos Críticos</label>
                                <div className="grid grid-cols-3 gap-3 bg-neutral-50 dark:bg-[#0c0d24]/50 p-4 rounded-xl border border-neutral-200 dark:border-[#1e214d]/50">
                                    <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-700 dark:text-white">
                                        <input
                                            type="checkbox"
                                            className="accent-orange-500 dark:accent-indigo-500 rounded"
                                            checked={form.allowPOS}
                                            onChange={(e) => setForm({ ...form, allowPOS: e.target.checked })}
                                        />
                                        <span>POS</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-700 dark:text-white">
                                        <input
                                            type="checkbox"
                                            className="accent-orange-500 dark:accent-indigo-500 rounded"
                                            checked={form.enabledModules?.includes("sales") || false}
                                            onChange={() => toggleModule("sales")}
                                        />
                                        <span>Ventas</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-700 dark:text-white">
                                        <input
                                            type="checkbox"
                                            className="accent-orange-500 dark:accent-indigo-500 rounded"
                                            checked={form.enabledModules?.includes("web_content") || false}
                                            onChange={() => toggleModule("web_content")}
                                        />
                                        <span>Contenido Web</span>
                                    </label>
                                </div>
                            </div>

                            {/* Seguridad y Control */}
                            <div>
                                <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-2">Seguridad y Control</label>
                                <div className="grid grid-cols-2 gap-3 bg-neutral-50 dark:bg-[#0c0d24]/50 p-4 rounded-xl border border-neutral-200 dark:border-[#1e214d]/50">
                                    <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-700 dark:text-white">
                                        <input
                                            type="checkbox"
                                            className="accent-orange-500 dark:accent-indigo-500 rounded"
                                            checked={form.enabledModules?.includes("access_control") || false}
                                            onChange={() => toggleModule("access_control")}
                                        />
                                        <span>Control de Acceso</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-700 dark:text-white">
                                        <input
                                            type="checkbox"
                                            className="accent-orange-500 dark:accent-indigo-500 rounded"
                                            checked={form.enabledModules?.includes("backups") || false}
                                            onChange={() => toggleModule("backups")}
                                        />
                                        <span>Copias de Seguridad</span>
                                    </label>
                                </div>
                            </div>

                            {/* Personalización */}
                            <div>
                                <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-2">Personalización</label>
                                <div className="grid grid-cols-2 gap-3 bg-neutral-50 dark:bg-[#0c0d24]/50 p-4 rounded-xl border border-neutral-200 dark:border-[#1e214d]/50">
                                    <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-700 dark:text-white">
                                        <input
                                            type="checkbox"
                                            className="accent-orange-500 dark:accent-indigo-500 rounded"
                                            checked={form.enabledModules?.includes("custom_ticket") || false}
                                            onChange={() => toggleModule("custom_ticket")}
                                        />
                                        <span>Factura y Ticket</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-700 dark:text-white">
                                        <input
                                            type="checkbox"
                                            className="accent-orange-500 dark:accent-indigo-500 rounded"
                                            checked={form.enabledModules?.includes("custom_theme") || false}
                                            onChange={() => toggleModule("custom_theme")}
                                        />
                                        <span>Apariencia y Colores</span>
                                    </label>
                                </div>
                            </div>

                            {/* Modules selector */}
                            <div>
                                <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-2">Módulos Visibles en Panel de Tienda</label>
                                <div className="flex flex-wrap gap-1.5 p-3.5 bg-neutral-100 dark:bg-[#0c0d24]/30 rounded-xl border border-neutral-200 dark:border-[#1e214d]/40 max-h-40 overflow-y-auto custom-scrollbar mb-4">
                                    {ALL_MODULES.map((m) => {
                                        const isSelected = form.enabledModules.includes(m.key);
                                        return (
                                            <button
                                                key={m.key}
                                                type="button"
                                                onClick={() => toggleModule(m.key)}
                                                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border cursor-pointer transition-all duration-155 ${isSelected ? "bg-orange-500/10 dark:bg-indigo-500/10 border-orange-500 dark:border-indigo-500 text-orange-600 dark:text-indigo-300 shadow-sm shadow-orange-500/5 dark:shadow-indigo-500/5" : "bg-neutral-100 dark:bg-[#121334] border-neutral-200 dark:border-[#1e214d] text-neutral-500 dark:text-[#9499c3] hover:text-neutral-800 dark:hover:text-white"}`}
                                            >
                                                {m.label}
                                            </button>
                                        );
                                    })}
                                </div>
                                <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-2">Métodos de Pago Disponibles</label>
                                <div className="flex flex-wrap gap-1.5 p-3.5 bg-neutral-100 dark:bg-[#0c0d24]/30 rounded-xl border border-neutral-200 dark:border-[#1e214d]/40 max-h-40 overflow-y-auto custom-scrollbar">
                                    {PAYMENT_METHODS.map((m) => {
                                        const isSelected = form.enabledModules.includes(m.key);
                                        return (
                                            <button
                                                key={m.key}
                                                type="button"
                                                onClick={() => toggleModule(m.key)}
                                                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border cursor-pointer transition-all duration-155 ${isSelected ? "bg-emerald-500/10 dark:bg-emerald-500/10 border-emerald-500 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-sm shadow-emerald-500/5 dark:shadow-emerald-500/5" : "bg-neutral-100 dark:bg-[#121334] border-neutral-200 dark:border-[#1e214d] text-neutral-500 dark:text-[#9499c3] hover:text-neutral-800 dark:hover:text-white"}`}
                                            >
                                                {m.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="flex gap-3 mt-6 justify-end border-t border-neutral-200 dark:border-[#1e214d]/40 pt-4">
                            <button
                                className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-[#1e214d]/60 bg-neutral-100 dark:bg-[#121334]/50 hover:bg-neutral-200 dark:hover:bg-[#16183a] text-neutral-600 dark:text-[#9499c3] text-xs cursor-pointer"
                                onClick={() => setShowModal(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn-grad px-5 py-2 text-xs cursor-pointer"
                                onClick={handleSave}
                                disabled={saving || !form.name || !form.monthlyPrice}
                            >
                                {saving ? "Guardando..." : editingId ? "Guardar Cambios" : "Crear Plan"}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTenants, createTenant, updateTenant, getPlans, getRubros, updateTenantRubro, pauseTenant, resumeTenant } from "@/lib/api";
import { Plus, Search, Eye, Filter, RefreshCw, X, Calendar, User, Globe, Phone, FileText, CheckCircle2, Pencil, Building2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Tenant {
    id: string; name: string; slug: string; ownerName: string;
    ownerEmail: string; ownerPhone?: string; domain?: string;
    status: string; subscriptionStart: string; subscriptionEnd?: string;
    monthlyPrice?: number; planId?: number; plan?: { name: string; id: number; enabledModules?: string[] };
    pendingPlanId?: number; pendingPlan?: { id: number; name: string };
    ownerPassword?: string;
    rubroId?: number; rubro?: { id: number; name: string; slug: string; icon?: string };
    enabledModules?: string[];
    _count?: { payments: number };
}

interface Rubro {
    id: number; slug: string; name: string; icon?: string;
}

const emptyForm = { name: "", ownerName: "", ownerEmail: "", ownerPhone: "", domain: "", planId: "", rubroId: "", monthlyPrice: "", subscriptionEnd: "", notes: "", ownerPassword: "", enabledModules: [] };

const MODULE_TRANSLATIONS: Record<string, string> = {
    "products": "Catálogo",
    "sales": "Ventas",
    "categories": "Categorías",
    "settings": "Ajustes",
    "suppliers": "Proveedores",
    "expenses": "Gastos",
    "analytics": "Estadísticas",
    "chatbot": "Chatbot IA",
    "customers": "Clientes",
    "marketing": "Marketing"
};

const translateModule = (mod: string) => MODULE_TRANSLATIONS[mod] || mod;

export default function TenantsPage() {
    const router = useRouter();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [plans, setPlans] = useState<any[]>([]);
    const [rubros, setRubros] = useState<Rubro[]>([]);
    const [loading, setLoading] = useState(true);

    // Real DB Filters state
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<any>({ ...emptyForm });

    // Edit Modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState<any>({});

    const [saving, setSaving] = useState(false);

    // Real Database Query call
    const fetchTenantsData = (searchVal: string, statusVal: string) => {
        setLoading(true);
        getTenants({
            search: searchVal || undefined,
            status: statusVal || undefined
        })
            .then((res) => {
                setTenants(res.data.data.tenants || []);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    // Debouncing effect for Real-time database queries
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchTenantsData(search, statusFilter);
        }, 350);

        return () => clearTimeout(delayDebounceFn);
    }, [search, statusFilter]);

    // Load plans and rubros on mount
    useEffect(() => {
        getPlans().then(r => setPlans(r.data.data || [])).catch(() => { });
        getRubros().then(r => setRubros(r.data.data || [])).catch(() => { });
    }, []);

    const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const planId = e.target.value;
        if (!planId) {
            setForm({ ...form, planId: "", monthlyPrice: "" });
            return;
        }

        const selectedPlan = plans.find(p => p.id.toString() === planId);
        if (selectedPlan) {
            setForm({
                ...form,
                planId,
                monthlyPrice: selectedPlan.monthlyPrice,
                enabledModules: selectedPlan.enabledModules?.length > 0 ? selectedPlan.enabledModules : ["products", "sales", "categories", "settings"]
            });
        } else {
            setForm({ ...form, planId, enabledModules: [] });
        }
    };

    const handleCreate = async () => {
        setSaving(true);
        const data = {
            ...form,
            planId: form.planId ? parseInt(form.planId) : null,
            rubroId: form.rubroId ? parseInt(form.rubroId) : null,
            monthlyPrice: form.monthlyPrice ? parseFloat(form.monthlyPrice) : null,
            subscriptionEnd: form.subscriptionEnd ? new Date(form.subscriptionEnd).toISOString() : null,
            enabledModules: form.enabledModules || []
        };
        try {
            await createTenant(data);
            setShowModal(false);
            setForm({ ...emptyForm });
            fetchTenantsData(search, statusFilter);
        } catch (err: any) {
            alert(err.response?.data?.message || "Error al crear Negocio");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveEdit = async () => {
        setSaving(true);
        try {
            // SEGURIDAD: No enviar rubroId si ya estaba asignado (es permanente).
            // Solo se envía si el tenant no tenía rubro y se está asignando por primera vez.
            const payload: any = {
                name: editForm.name,
                ownerName: editForm.ownerName,
                ownerEmail: editForm.ownerEmail,
                ownerPhone: editForm.ownerPhone,
                domain: editForm.domain,
                planId: editForm.planId ? parseInt(editForm.planId) : null,
                monthlyPrice: editForm.monthlyPrice ? parseFloat(editForm.monthlyPrice) : null,
                subscriptionEnd: editForm.subscriptionEnd ? new Date(editForm.subscriptionEnd).toISOString() : null,
                notes: editForm.notes,
                ownerPassword: editForm.ownerPassword || undefined,
                enabledModules: editForm.enabledModules || []
            };
            // Solo incluir rubroId si se está asignando por primera vez (no tenía ninguno)
            if (!editForm._originalRubroId && editForm.rubroId) {
                payload.rubroId = parseInt(editForm.rubroId);
            }
            await updateTenant(editForm.id, payload);
            setShowEditModal(false);
            fetchTenantsData(search, statusFilter);
        } catch (err: any) {
            alert(err.response?.data?.message || "Error al guardar cambios");
        } finally {
            setSaving(false);
        }
    };

    const openEditModal = (t: Tenant) => {
        const originalRubroId = (t as any).rubro?.id || (t as any).rubroId || "";
        setEditForm({
            ...t,
            planId: t.plan?.id || t.planId || "",
            rubroId: originalRubroId,
            _originalRubroId: originalRubroId, // snapshot para detectar si ya tenía rubro
            subscriptionEnd: t.subscriptionEnd ? new Date(t.subscriptionEnd).toISOString().split('T')[0] : "",
            enabledModules: t.enabledModules?.length ? t.enabledModules : (t.plan?.enabledModules || [])
        });
        setShowEditModal(true);
    };

    return (
        <div className="animate-fade-in space-y-6">

            {/* Page Title Row */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 dark:border-[#1e214d]/40 pb-5">
                <div>
                    <h2 className="text-xl font-bold text-neutral-800 dark:text-white tracking-tight">Gestión de Negocios</h2>
                    <p className="text-xs text-neutral-500 dark:text-[#9499c3]">Monitorea las instancias, dominios y estado de facturación de cada cliente</p>
                </div>
                <button
                    className="btn-grad px-5 py-2.5 text-xs flex items-center gap-2 cursor-pointer shadow-sm"
                    onClick={() => setShowModal(true)}
                >
                    <Plus size={16} /> Registrar Negocio
                </button>
            </div>

            {/* Advanced Filter Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-neutral-100/50 dark:bg-[#0c0d24]/30 p-4 rounded-2xl border border-neutral-200 dark:border-[#1e214d]/40">

                {/* Search Input field */}
                <div className="relative">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-[#9499c3]" />
                    <input
                        className="premium-input w-full pl-10 pr-4 py-2 text-xs"
                        placeholder="Buscar por Nombre, Dueño, Email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Status Dropdown selector */}
                <div className="relative">
                    <Filter size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-[#9499c3]" />
                    <select
                        className="premium-input w-full pl-10 pr-4 py-2 text-xs cursor-pointer appearance-none"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">Todos los Estados</option>
                        <option value="ACTIVE">Activos</option>
                        <option value="PAUSED">Pausados</option>
                        <option value="SUSPENDED">Suspendidos</option>
                    </select>
                </div>

                {/* Info stats / Sync action */}
                <div className="flex justify-between sm:justify-end items-center gap-4">
                    <span className="text-[11px] text-neutral-500 dark:text-[#9499c3] font-semibold">
                        {tenants.length} Encontrados
                    </span>
                    <button
                        onClick={() => fetchTenantsData(search, statusFilter)}
                        className="w-9 h-9 rounded-xl bg-white dark:bg-[#121334] border border-neutral-200 dark:border-[#1e214d] flex items-center justify-center text-neutral-500 dark:text-[#9499c3] hover:text-orange-500 dark:hover:text-violet-400 cursor-pointer shadow-sm"
                        title="Sincronizar"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin text-orange-500 dark:text-indigo-400" : ""} />
                    </button>
                </div>
            </div>

            {/* Main Responsive Table */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin" style={{ width: 28, height: 28, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%" }} />
                </div>
            ) : (
                <div className="premium-table-container">
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>Nombre del Negocio</th>
                                <th>Dueño</th>
                                <th>Credenciales</th>
                                <th>Dominio / Slug</th>
                                <th>Plan Habilitado</th>
                                <th>Rubro</th>
                                <th>Estado</th>
                                <th>Vencimiento</th>
                                <th className="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tenants.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center text-xs text-neutral-400 dark:text-[#9499c3] py-12">
                                        No se encontraron Negocios con los filtros actuales.
                                    </td>
                                </tr>
                            ) : tenants.map((t) => (
                                <tr key={t.id} className="hover:bg-neutral-50/50 dark:hover:bg-[#16183a]/10">
                                    <td>
                                        <div className="font-extrabold text-xs text-neutral-800 dark:text-white">{t.name}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="text-[10px] text-neutral-400 dark:text-[#9499c3]">{t.slug}</div>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(t.id);
                                                    alert("Tenant ID copiado al portapapeles: " + t.id);
                                                }}
                                                className="text-[9px] font-mono bg-neutral-100 dark:bg-[#121334]/50 border border-neutral-200 dark:border-[#1e214d]/50 px-1.5 py-0.5 rounded text-neutral-500 hover:text-neutral-800 dark:hover:text-white transition-colors cursor-pointer"
                                                title="Copiar Tenant ID"
                                            >
                                                Copiar ID
                                            </button>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="text-xs text-neutral-800 dark:text-white font-medium">{t.ownerName}</div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1.5">
                                            {/* Correo */}
                                            <div className="flex items-center gap-2">
                                                <div className="text-[10px] text-neutral-500 dark:text-[#9499c3] truncate max-w-[120px]" title={t.ownerEmail}>{t.ownerEmail}</div>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(t.ownerEmail);
                                                        alert("Correo copiado al portapapeles");
                                                    }}
                                                    className="text-[9px] font-mono bg-neutral-100 dark:bg-[#121334]/50 border border-neutral-200 dark:border-[#1e214d]/50 px-1.5 py-0.5 rounded text-neutral-500 hover:text-neutral-800 dark:hover:text-white transition-colors cursor-pointer shrink-0"
                                                    title="Copiar Correo"
                                                >
                                                    Copiar
                                                </button>
                                            </div>

                                            {/* Contraseña */}
                                            <details className="group">
                                                <summary className="text-[10px] text-neutral-400 dark:text-[#9499c3] cursor-pointer hover:text-orange-500 transition-colors list-none flex items-center gap-1 w-fit group-open:hidden">
                                                    <span className="font-mono tracking-widest mt-0.5">••••••••</span>
                                                    <Eye size={10} />
                                                </summary>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-orange-600 dark:text-indigo-300 font-mono">
                                                        {t.ownerPassword || "admin123"}
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(t.ownerPassword || "admin123");
                                                            alert("Contraseña copiada al portapapeles");
                                                        }}
                                                        className="text-[9px] font-mono bg-neutral-100 dark:bg-[#121334]/50 border border-neutral-200 dark:border-[#1e214d]/50 px-1.5 py-0.5 rounded text-neutral-500 hover:text-neutral-800 dark:hover:text-white transition-colors cursor-pointer shrink-0"
                                                        title="Copiar Contraseña"
                                                    >
                                                        Copiar
                                                    </button>
                                                </div>
                                            </details>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="text-xs text-neutral-700 dark:text-indigo-300 font-semibold">{t.domain || `${t.slug}.saas.com`}</div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1.5 items-start">
                                            <select
                                                value={t.plan?.id || ""}
                                                disabled={!!t.pendingPlan}
                                                onChange={async (e) => {
                                                    const newPlanId = e.target.value;
                                                    const plan = plans.find(p => p.id.toString() === newPlanId);
                                                    try {
                                                        await updateTenant(t.id, {
                                                            planId: newPlanId ? parseInt(newPlanId) : null,
                                                            monthlyPrice: plan ? plan.monthlyPrice : null
                                                        });
                                                        // Refrescar lista de negocios
                                                        fetchTenantsData(search, statusFilter);
                                                    } catch (err: any) {
                                                        alert(err.response?.data?.message || "Error al actualizar plan");
                                                    }
                                                }}
                                                className="text-xs font-bold text-orange-600 dark:text-indigo-300 bg-orange-500/5 dark:bg-indigo-500/5 px-2.5 py-1 rounded-lg border border-orange-500/15 dark:border-indigo-500/15 cursor-pointer focus:outline-none hover:bg-orange-500/10 dark:hover:bg-indigo-500/10 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                            >
                                                {!t.plan?.id && (
                                                    <option value="" className="text-neutral-800 dark:text-neutral-200 bg-white dark:bg-[#121334]">Sin Plan</option>
                                                )}
                                                {plans.map(p => (
                                                    <option key={p.id} value={p.id} className="text-neutral-800 dark:text-neutral-200 bg-white dark:bg-[#121334]">
                                                        {p.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {t.pendingPlan && (
                                                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
                                                    ➔ {t.pendingPlan.name} (Falta Pago)
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    {/* Rubro — INMUTABLE una vez asignado */}
                                    <td>
                                        {(t.rubro?.id || t.rubroId) ? (
                                            // Si ya tiene rubro: solo lectura (inmutable)
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1.5 max-w-[140px] truncate">
                                                    🏢 {t.rubro?.name || 'Asignado'}
                                                </span>
                                                <span title="El rubro es permanente" className="text-[9px] text-neutral-400 cursor-help">🔒</span>
                                            </div>
                                        ) : (
                                            // Sin rubro: permitir asignar por primera vez
                                            <select
                                                value=""
                                                onChange={async (e) => {
                                                    const rid = e.target.value ? parseInt(e.target.value) : null;
                                                    if (!rid) return;
                                                    if (!confirm(`¿Confirmar asignar el rubro "${rubros.find(r => r.id === rid)?.name}" a este negocio? Esta acción es PERMANENTE e irreversible.`)) return;
                                                    try {
                                                        await updateTenantRubro(t.id, rid);
                                                        fetchTenantsData(search, statusFilter);
                                                    } catch (err: any) {
                                                        alert(err.response?.data?.message || "Error al asignar rubro");
                                                    }
                                                }}
                                                className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-500/5 px-2.5 py-1 rounded-lg border border-amber-500/25 cursor-pointer focus:outline-none hover:bg-amber-500/10 transition-colors max-w-[140px] truncate"
                                            >
                                                <option value="">Sin rubro...</option>
                                                {rubros.map(r => (
                                                    <option key={r.id} value={r.id}>{r.name}</option>
                                                ))}
                                            </select>
                                        )}
                                    </td>
                                    <td>
                                        <select
                                            value={t.status}
                                            onChange={async (e) => {
                                                const newStatus = e.target.value;
                                                const actionName = newStatus === "ACTIVE" ? "activar" : "pausar";
                                                if (!confirm(`¿Estás seguro de ${actionName} la tienda ${t.name}?`)) return;
                                                
                                                try {
                                                    if (newStatus === "ACTIVE") {
                                                        await resumeTenant(t.id);
                                                    } else {
                                                        await pauseTenant(t.id, "Pausado manualmente desde panel");
                                                    }
                                                    fetchTenantsData(search, statusFilter);
                                                } catch (err: any) {
                                                    alert(err.response?.data?.message || `Error al ${actionName} el negocio`);
                                                }
                                            }}
                                            className={`text-[11px] font-bold px-2 py-1.5 rounded-lg border cursor-pointer focus:outline-none transition-colors ${
                                                t.status === "ACTIVE" 
                                                    ? "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20" 
                                                    : t.status === "PAUSED" 
                                                        ? "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20" 
                                                        : "text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20"
                                            }`}
                                        >
                                            <option value="ACTIVE" className="text-neutral-800 dark:text-neutral-200 bg-white dark:bg-[#121334]">Activo</option>
                                            <option value="PAUSED" className="text-neutral-800 dark:text-neutral-200 bg-white dark:bg-[#121334]">Pausado</option>
                                            {t.status === "SUSPENDED" && <option value="SUSPENDED" className="text-neutral-800 dark:text-neutral-200 bg-white dark:bg-[#121334]">Suspendido</option>}
                                        </select>
                                    </td>
                                    <td>
                                        <div className="text-xs text-neutral-700 dark:text-white font-medium">
                                            {t.subscriptionEnd ? format(new Date(t.subscriptionEnd), "dd MMM yyyy", { locale: es }) : "—"}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => openEditModal(t)}
                                                className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-[#121334] border border-neutral-200 dark:border-[#1e214d] hover:border-orange-500 dark:hover:border-indigo-500 text-neutral-600 dark:text-[#9499c3] hover:text-neutral-800 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
                                                title="Editar Rápido"
                                            >
                                                <Pencil size={13} />
                                            </button>
                                            <button
                                                onClick={() => router.push(`/dashboard/tenants/${t.id}`)}
                                                className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-[#121334] border border-neutral-200 dark:border-[#1e214d] hover:border-emerald-500 dark:hover:border-emerald-500 text-neutral-600 dark:text-[#9499c3] hover:text-neutral-800 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
                                                title="Ver Ficha Técnica"
                                            >
                                                <Eye size={13} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Register Tenant Modal */}
            {showModal && (
                <div className="premium-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="premium-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>

                        {/* Modal Header */}
                        <div className="flex justify-between items-center border-b border-neutral-200 dark:border-[#1e214d]/50 pb-4 mb-6">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-orange-500/10 dark:bg-indigo-500/10 border border-orange-500/20 dark:border-indigo-500/20 flex items-center justify-center text-orange-500 dark:text-indigo-400">
                                    <Plus size={16} />
                                </div>
                                <h3 className="text-sm font-bold text-neutral-800 dark:text-white">Registrar Negocio
                                </h3>
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
                                    <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Nombre Comercial *</label>
                                    <input
                                        className="premium-input w-full px-3.5 py-2 text-xs"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="Ej. Tienda Deportes"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Subdominio (Slug)</label>
                                    <input
                                        className="premium-input w-full px-3.5 py-2 text-xs"
                                        value={form.slug}
                                        onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })}
                                        placeholder="tienda-deportes (auto)"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Nombre del Titular *</label>
                                    <input
                                        className="premium-input w-full px-3.5 py-2 text-xs"
                                        value={form.ownerName}
                                        onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                                        placeholder="Ej. Juan Pérez"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Email Titular *</label>
                                    <input
                                        className="premium-input w-full px-3.5 py-2 text-xs"
                                        type="email"
                                        value={form.ownerEmail}
                                        onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
                                        placeholder="juan@correo.com"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Contraseña de Acceso</label>
                                    <input
                                        className="premium-input w-full px-3.5 py-2 text-xs"
                                        type="text"
                                        value={form.ownerPassword}
                                        onChange={(e) => setForm({ ...form, ownerPassword: e.target.value })}
                                        placeholder="Por defecto: admin123"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Celular de Contacto</label>
                                    <input
                                        className="premium-input w-full px-3.5 py-2 text-xs"
                                        value={form.ownerPhone}
                                        onChange={(e) => setForm({ ...form, ownerPhone: e.target.value })}
                                        placeholder="+54911..."
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Dominio Personalizado</label>
                                    <input
                                        className="premium-input w-full px-3.5 py-2 text-xs"
                                        value={form.domain}
                                        onChange={(e) => setForm({ ...form, domain: e.target.value })}
                                        placeholder="www.mitienda.com"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Plan SaaS</label>
                                    <select
                                        className="premium-input w-full px-3.5 py-2 text-xs cursor-pointer"
                                        value={form.planId}
                                        onChange={handlePlanChange}
                                    >
                                        <option value="">Sin Plan</option>
                                        {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Cuota Mensual ($)</label>
                                    <input
                                        className="premium-input w-full px-3.5 py-2 text-xs"
                                        type="number"
                                        value={form.monthlyPrice}
                                        onChange={(e) => setForm({ ...form, monthlyPrice: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            {/* Modulos disponibles (Form Creacion) */}
                            <div className="bg-neutral-50 dark:bg-[#121334]/50 border border-neutral-200 dark:border-[#1e214d]/50 rounded-xl p-3">
                                <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-2">Módulos Activos</label>
                                {form.planId ? (() => {
                                    const p = plans.find(plan => plan.id.toString() === form.planId.toString());
                                    const allowedModules = p?.enabledModules?.length > 0 ? p.enabledModules : ["products", "sales", "categories", "settings"];

                                    return (
                                        <div className="grid grid-cols-2 gap-2">
                                            {allowedModules.map((mod: string) => {
                                                const isActive = (form.enabledModules || []).includes(mod);
                                                return (
                                                    <label key={mod} className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-neutral-100 dark:hover:bg-[#16183a] rounded">
                                                        <input
                                                            type="checkbox"
                                                            className="rounded border-neutral-300 text-orange-500 focus:ring-orange-500 dark:border-zinc-700 bg-transparent"
                                                            checked={isActive}
                                                            onChange={() => {
                                                                const current = form.enabledModules || [];
                                                                setForm({
                                                                    ...form,
                                                                    enabledModules: isActive ? current.filter((m: string) => m !== mod) : [...current, mod]
                                                                });
                                                            }}
                                                        />
                                                        <span className="text-[11px] text-neutral-700 dark:text-neutral-300 capitalize">{translateModule(mod)}</span>
                                                    </label>
                                                )
                                            })}
                                        </div>
                                    );
                                })() : (
                                    <p className="text-[11px] text-neutral-500 italic py-2">Selecciona un Plan SaaS primero para ver y configurar sus módulos disponibles.</p>
                                )}
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Vencimiento del Ciclo</label>
                                <input
                                    className="premium-input w-full px-3.5 py-2 text-xs cursor-pointer"
                                    type="date"
                                    value={form.subscriptionEnd}
                                    onChange={(e) => setForm({ ...form, subscriptionEnd: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Notas Internas</label>
                                <textarea
                                    className="premium-input w-full px-3.5 py-2 text-xs min-h-16 max-h-24"
                                    rows={2}
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    placeholder="Anotaciones administrativas..."
                                />
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
                                onClick={handleCreate}
                                disabled={saving || !form.name || !form.ownerName || !form.ownerEmail}
                            >
                                {saving ? "Inicializando..." : "Registrar Negocio"}
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* Edit Tenant Modal */}
            {showEditModal && (
                <div className="premium-modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="premium-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>

                        {/* Modal Header */}
                        <div className="flex justify-between items-center border-b border-neutral-200 dark:border-[#1e214d]/50 pb-4 mb-6">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-orange-500/10 dark:bg-indigo-500/10 border border-orange-500/20 dark:border-indigo-500/20 flex items-center justify-center text-orange-500 dark:text-indigo-400">
                                    <Building2 size={16} />
                                </div>
                                <h3 className="text-sm font-bold text-neutral-800 dark:text-white">Editar Datos del Negocio</h3>
                            </div>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-[#121334] border border-neutral-200 dark:border-[#1e214d]/80 flex items-center justify-center text-neutral-500 dark:text-[#9499c3] hover:text-neutral-800 dark:hover:text-white cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Razón Social o Nombre Fantasía</label>
                                <input
                                    className="premium-input w-full px-3.5 py-2 text-xs"
                                    value={editForm.name || ""}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Titular de Cuenta</label>
                                    <input
                                        className="premium-input w-full px-3.5 py-2 text-xs"
                                        value={editForm.ownerName || ""}
                                        onChange={(e) => setEditForm({ ...editForm, ownerName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Email Asociado</label>
                                    <input
                                        className="premium-input w-full px-3.5 py-2 text-xs"
                                        value={editForm.ownerEmail || ""}
                                        onChange={(e) => setEditForm({ ...editForm, ownerEmail: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Nueva Contraseña</label>
                                    <input
                                        className="premium-input w-full px-3.5 py-2 text-xs"
                                        type="text"
                                        value={editForm.ownerPassword || ""}
                                        onChange={(e) => setEditForm({ ...editForm, ownerPassword: e.target.value })}
                                        placeholder="Dejar vacío para no cambiar"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Celular de Contacto</label>
                                    <input
                                        className="premium-input w-full px-3.5 py-2 text-xs"
                                        value={editForm.ownerPhone || ""}
                                        onChange={(e) => setEditForm({ ...editForm, ownerPhone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Dominio Personalizado</label>
                                    <input
                                        className="premium-input w-full px-3.5 py-2 text-xs"
                                        value={editForm.domain || ""}
                                        onChange={(e) => setEditForm({ ...editForm, domain: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Plan Habilitado</label>
                                    <select
                                        className="premium-input w-full px-3.5 py-2 text-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                        value={editForm.planId || ""}
                                        disabled={!!editForm.pendingPlanId}
                                        onChange={(e) => {
                                            const pid = e.target.value;
                                            const plan = plans.find(p => p.id.toString() === pid);
                                            setEditForm({
                                                ...editForm,
                                                planId: pid,
                                                monthlyPrice: plan ? plan.monthlyPrice : editForm.monthlyPrice,
                                                enabledModules: plan ? editForm.enabledModules?.filter((m: string) => (plan.enabledModules?.length > 0 ? plan.enabledModules : ["products", "sales", "categories", "settings"]).includes(m)) : []
                                            });
                                        }}
                                    >
                                        {!editForm.planId && (
                                            <option value="">Sin Plan</option>
                                        )}
                                        {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                    {editForm.pendingPlanId ? (
                                        <p className="text-[9px] text-amber-600 dark:text-amber-400 mt-1 font-semibold">
                                            ⚠️ Este negocio tiene un plan pendiente de pago. Registra el cobro para confirmar el cambio.
                                        </p>
                                    ) : (
                                        <p className="text-[9px] text-amber-600 dark:text-amber-400 mt-1">
                                            Si cambias el plan, quedará como PENDIENTE hasta que registres su pago en Cobros.
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Cuota Mensual ($)</label>
                                    <input
                                        className="premium-input w-full px-3.5 py-2 text-xs"
                                        type="number"
                                        value={editForm.monthlyPrice || ""}
                                        onChange={(e) => setEditForm({ ...editForm, monthlyPrice: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Modulos disponibles (Form Edición) */}
                            <div className="bg-neutral-50 dark:bg-[#121334]/50 border border-neutral-200 dark:border-[#1e214d]/50 rounded-xl p-3">
                                <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-2">Módulos Activos</label>
                                {editForm.planId ? (() => {
                                    const p = plans.find(plan => plan.id.toString() === editForm.planId.toString());
                                    const allowedModules = p?.enabledModules?.length > 0 ? p.enabledModules : ["products", "sales", "categories", "settings"];

                                    return (
                                        <div className="grid grid-cols-2 gap-2">
                                            {allowedModules.map((mod: string) => {
                                                const isActive = (editForm.enabledModules || []).includes(mod);
                                                return (
                                                    <label key={mod} className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-neutral-100 dark:hover:bg-[#16183a] rounded">
                                                        <input
                                                            type="checkbox"
                                                            className="rounded border-neutral-300 text-orange-500 focus:ring-orange-500 dark:border-zinc-700 bg-transparent"
                                                            checked={isActive}
                                                            onChange={() => {
                                                                const current = editForm.enabledModules || [];
                                                                setEditForm({
                                                                    ...editForm,
                                                                    enabledModules: isActive ? current.filter((m: string) => m !== mod) : [...current, mod]
                                                                });
                                                            }}
                                                        />
                                                        <span className="text-[11px] text-neutral-700 dark:text-neutral-300 capitalize">{translateModule(mod)}</span>
                                                    </label>
                                                )
                                            })}
                                        </div>
                                    );
                                })() : (
                                    <p className="text-[11px] text-neutral-500 italic py-2">Selecciona un Plan SaaS primero para ver y configurar sus módulos disponibles.</p>
                                )}
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Rubro del Negocio</label>
                                {editForm.rubroId ? (
                                    // Rubro ya asignado: BLOQUEADO, no se puede cambiar
                                    <div className="flex items-center gap-2 premium-input px-3.5 py-2">
                                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                            🏢 {rubros.find(r => r.id.toString() === editForm.rubroId?.toString())?.name || 'Rubro asignado'}
                                        </span>
                                        <span className="ml-auto text-[10px] font-semibold text-red-500 dark:text-red-400 flex items-center gap-1">🔒 Permanente</span>
                                    </div>
                                ) : (
                                    // Sin rubro: se puede asignar por primera vez
                                    <select
                                        className="premium-input w-full px-3.5 py-2 text-xs cursor-pointer"
                                        value={editForm.rubroId || ""}
                                        onChange={(e) => setEditForm({ ...editForm, rubroId: e.target.value })}
                                    >
                                        <option value="">Sin Rubro asignado</option>
                                        {rubros.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                )}
                                <p className="text-[9px] mt-1">
                                    {editForm.rubroId ? (
                                        <span className="text-red-500 dark:text-red-400 font-semibold">⚠️ El rubro es permanente e irreversible. Define toda la estructura de datos del negocio.</span>
                                    ) : (
                                        <span className="text-amber-600 dark:text-amber-400">Una vez asignado, el rubro NO podrá modificarse.</span>
                                    )}
                                </p>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Vencimiento del Ciclo</label>
                                <input
                                    className="premium-input w-full px-3.5 py-2 text-xs cursor-pointer"
                                    type="date"
                                    value={editForm.subscriptionEnd || ""}
                                    onChange={(e) => setEditForm({ ...editForm, subscriptionEnd: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="flex gap-3 mt-6 justify-end border-t border-neutral-200 dark:border-[#1e214d]/40 pt-4">
                            <button
                                className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-[#1e214d]/60 bg-neutral-100 dark:bg-[#121334]/50 hover:bg-neutral-200 dark:hover:bg-[#16183a] text-neutral-600 dark:text-[#9499c3] text-xs cursor-pointer"
                                onClick={() => setShowEditModal(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn-grad px-5 py-2 text-xs cursor-pointer"
                                onClick={handleSaveEdit}
                                disabled={saving || !editForm.name}
                            >
                                {saving ? "Guardando..." : "Guardar Cambios"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTenant, updateTenant, pauseTenant, resumeTenant, registerPayment, getPlans } from "@/lib/api";
import { ArrowLeft, Copy, Pause, Play, CreditCard, Building2, Users, Package, ShoppingCart, Calendar, Phone, Mail, Globe, FileText, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function TenantDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [tenant, setTenant] = useState<any>(null);
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPayment, setShowPayment] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [payForm, setPayForm] = useState({ amount: "", period: "", method: "transfer", reference: "" });
    const [editForm, setEditForm] = useState<any>({});
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);

    const fetchTenant = () => {
        setLoading(true);
        getTenant(id).then((r) => {
            setTenant(r.data.data);
            setEditForm(r.data.data);
        }).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchTenant();
        getPlans().then(r => setPlans(r.data.data || [])).catch(() => { });
    }, [id]);

    const handlePause = async () => {
        if (!confirm("¿Deseas pausar este negocio? Se activará el modo mantenimiento.")) return;
        await pauseTenant(id, "manual");
        fetchTenant();
    };

    const handleResume = async () => {
        await resumeTenant(id);
        fetchTenant();
    };

    const handlePayment = async () => {
        setSaving(true);
        try {
            await registerPayment({ tenantId: id, amount: parseFloat(payForm.amount), period: payForm.period, method: payForm.method, reference: payForm.reference });
            setShowPayment(false);
            setPayForm({ amount: "", period: "", method: "transfer", reference: "" });
            fetchTenant();
        } catch (err: any) { alert(err.response?.data?.message || "Error al registrar pago"); }
        finally { setSaving(false); }
    };

    const handleSaveEdit = async () => {
        setSaving(true);
        try {
            await updateTenant(id, {
                name: editForm.name, ownerName: editForm.ownerName, ownerEmail: editForm.ownerEmail,
                ownerPhone: editForm.ownerPhone, domain: editForm.domain, planId: editForm.planId ? parseInt(editForm.planId) : null,
                monthlyPrice: editForm.monthlyPrice ? parseFloat(editForm.monthlyPrice) : null,
                subscriptionEnd: editForm.subscriptionEnd ? new Date(editForm.subscriptionEnd).toISOString() : null, notes: editForm.notes,
            });
            setShowEdit(false);
            fetchTenant();
        } catch (err: any) { alert(err.response?.data?.message || "Error al guardar cambios"); }
        finally { setSaving(false); }
    };

    const copyId = () => {
        navigator.clipboard.writeText(id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) return (
        <div className="flex items-center justify-center py-16">
            <div className="animate-spin" style={{ width: 28, height: 28, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%" }} />
        </div>
    );

    if (!tenant) return <p className="text-center text-xs text-neutral-500 dark:text-[#9499c3] py-12">Negocio no encontrado</p>;

    const statusBadge = tenant.status === "ACTIVE" ? "badge-active" : tenant.status === "PAUSED" ? "badge-paused" : "badge-suspended";
    const statusLabel = tenant.status === "ACTIVE" ? "Activo" : tenant.status === "PAUSED" ? "Pausado" : "Suspendido";

    const statCards = [
        { label: "Productos", value: tenant.stats?.productCount ?? 0, icon: Package, max: tenant.plan?.maxProducts, color: "text-orange-500 dark:text-indigo-400" },
        { label: "Usuarios Registrados", value: tenant.stats?.userCount ?? 0, icon: Users, color: "text-emerald-500 dark:text-blue-400" },
        { label: "Ventas Totales", value: tenant.stats?.saleCount ?? 0, icon: ShoppingCart, color: "text-orange-500 dark:text-emerald-400" },
        { label: "Sucursales Activas", value: tenant.stats?.branchCount ?? 0, icon: Building2, max: tenant.plan?.maxBranches, color: "text-amber-500 dark:text-violet-400" },
    ];

    return (
        <div className="animate-fade-in space-y-6">
            {/* Back link */}
            <button
                onClick={() => router.push("/dashboard/tenants")}
                className="flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-[#9499c3] hover:text-neutral-800 dark:hover:text-white bg-white dark:bg-[#121334]/40 hover:bg-neutral-100 dark:hover:bg-[#121334] border border-neutral-200 dark:border-[#1e214d]/60 px-4 py-2 rounded-xl transition-all cursor-pointer w-fit shadow-sm"
            >
                <ArrowLeft size={14} /> Volver a Negocios
            </button>

            {/* Header Info */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-neutral-200 dark:border-[#1e214d]/40 pb-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-neutral-800 dark:text-white tracking-tight">{tenant.name}</h1>
                        <span className={`premium-badge ${statusBadge}`}>{statusLabel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-neutral-400 dark:text-[#9499c3] font-mono bg-neutral-100 dark:bg-[#121334]/80 px-2 py-1 rounded border border-neutral-200 dark:border-[#1e214d]/50">ID: {id}</span>
                        <button
                            onClick={copyId}
                            className={`p-1.5 rounded bg-white dark:bg-[#121334]/40 hover:bg-neutral-100 dark:hover:bg-[#121334] border border-neutral-200 dark:border-[#1e214d]/60 text-xs transition-colors cursor-pointer ${copied ? "text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "text-neutral-500 dark:text-[#9499c3] hover:text-neutral-800 dark:hover:text-white"}`}
                            title="Copiar ID"
                        >
                            <Copy size={12} />
                        </button>
                    </div>
                </div>

                    {/* Main Action Buttons */}
                    <div className="flex flex-wrap gap-2.5">                    <button
                        className="btn-grad px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                        onClick={() => setShowPayment(true)}
                    >
                        <CreditCard size={14} /> Registrar Pago
                    </button>

                    {tenant.status === "ACTIVE" ? (
                        <button
                            className="w-10 h-10 rounded-xl bg-amber-500/5 hover:bg-amber-500/15 border border-amber-500/10 hover:border-amber-500/30 text-amber-600 dark:text-amber-500 flex items-center justify-center transition-all cursor-pointer"
                            onClick={handlePause}
                            title="Pausar Negocio"
                        >
                            <Pause size={15} />
                        </button>
                    ) : tenant.status === "PAUSED" ? (
                        <button
                            className="w-10 h-10 rounded-xl bg-emerald-500/5 hover:bg-emerald-500/15 border border-emerald-500/10 hover:border-emerald-500/30 text-emerald-600 dark:text-emerald-500 flex items-center justify-center transition-all cursor-pointer"
                            onClick={handleResume}
                            title="Reactivar Negocio"
                        >
                            <Play size={15} />
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Info Split Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Owner Info */}
                <div className="glass-panel rounded-2xl p-6 border-neutral-200/80 dark:border-[#1e214d]/60">
                    <h3 className="font-bold text-neutral-800 dark:text-white text-sm mb-4 flex items-center gap-2">
                        <Users size={16} className="text-orange-500 dark:text-indigo-400" />
                        <span>Información del Propietario</span>
                    </h3>
                    <div className="space-y-3.5 text-xs">
                        <div className="flex justify-between py-1.5 border-b border-neutral-200 dark:border-[#1e214d]/30">
                            <span className="text-neutral-400 dark:text-[#9499c3]">Nombre Completo</span>
                            <strong className="text-neutral-800 dark:text-white font-semibold">{tenant.ownerName}</strong>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-neutral-200 dark:border-[#1e214d]/30">
                            <span className="text-neutral-400 dark:text-[#9499c3]">Correo Electrónico</span>
                            <strong className="text-neutral-800 dark:text-white font-semibold flex items-center gap-1">
                                <Mail size={12} className="opacity-50" />
                                {tenant.ownerEmail}
                            </strong>
                        </div>

                        <div className="flex justify-between py-1.5 border-b border-neutral-200 dark:border-[#1e214d]/30">
                            <span className="text-neutral-400 dark:text-[#9499c3]">Número de Celular</span>
                            <strong className="text-neutral-800 dark:text-white font-semibold flex items-center gap-1">
                                <Phone size={12} className="opacity-50" />
                                {tenant.ownerPhone || "—"}
                            </strong>
                        </div>
                        <div className="flex justify-between py-1.5">
                            <span className="text-neutral-400 dark:text-[#9499c3]">Dominio Personalizado</span>
                            <strong className="text-orange-500 dark:text-indigo-300 font-semibold flex items-center gap-1">
                                <Globe size={12} className="text-orange-400/70 dark:text-indigo-400/70" />
                                {tenant.domain || "—"}
                            </strong>
                        </div>
                    </div>
                </div>

                {/* Subscription Info */}
                <div className="glass-panel rounded-2xl p-6 border-neutral-200/80 dark:border-[#1e214d]/60">
                    <h3 className="font-bold text-neutral-800 dark:text-white text-sm mb-4 flex items-center gap-2">
                        <CreditCard size={16} className="text-orange-500 dark:text-indigo-400" />
                        <span>Condición de Suscripción</span>
                    </h3>
                    <div className="space-y-3.5 text-xs">
                        <div className="flex justify-between py-1.5 border-b border-neutral-200 dark:border-[#1e214d]/30">
                            <span className="text-neutral-400 dark:text-[#9499c3]">Plan Habilitado</span>
                            <strong className="text-orange-600 dark:text-indigo-300 font-bold bg-orange-500/10 dark:bg-indigo-500/10 px-2 py-0.5 rounded border border-orange-500/20 dark:border-indigo-500/20">{tenant.plan?.name || "Sin Plan"}</strong>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-neutral-200 dark:border-[#1e214d]/30">
                            <span className="text-neutral-400 dark:text-[#9499c3]">Canon Mensual Cobrado</span>
                            <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">${Number(tenant.monthlyPrice || 0).toLocaleString()}/mes</strong>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-neutral-200 dark:border-[#1e214d]/30">
                            <span className="text-neutral-400 dark:text-[#9499c3]">Fecha de Inicio</span>
                            <strong className="text-neutral-800 dark:text-white font-semibold flex items-center gap-1">
                                <Calendar size={12} className="opacity-55" />
                                {format(new Date(tenant.subscriptionStart), "dd MMM yyyy", { locale: es })}
                            </strong>
                        </div>
                        <div className="flex justify-between py-1.5">
                            <span className="text-neutral-400 dark:text-[#9499c3]">Vencimiento Actual</span>
                            <strong className="text-neutral-800 dark:text-white font-semibold flex items-center gap-1">
                                <Calendar size={12} className="opacity-55" />
                                {tenant.subscriptionEnd ? format(new Date(tenant.subscriptionEnd), "dd MMM yyyy", { locale: es }) : "Suscripción vitalicia"}
                            </strong>
                        </div>
                    </div>
                </div>

            </div>

            {/* KPI Counters Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((s) => {
                    const Icon = s.icon;
                    return (
                        <div key={s.label} className="glow-card p-5 border-neutral-200/80 dark:border-[#1e214d]/60 hover:border-orange-500/30 dark:hover:border-indigo-500/30 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 dark:bg-indigo-500/10 border border-orange-500/20 dark:border-indigo-500/20 flex items-center justify-center shrink-0">
                                <Icon size={18} className={s.color} />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-[#9499c3]">{s.label}</p>
                                <p className="text-lg font-black text-neutral-800 dark:text-white mt-0.5">
                                    {s.value}
                                    {s.max ? (
                                        <span className="text-[11px] font-medium text-neutral-400 dark:text-[#9499c3] ml-1">/ {s.max}</span>
                                    ) : null}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Payments History Table */}
            <div className="glass-panel rounded-2xl p-6 border-neutral-200/80 dark:border-[#1e214d]/60">
                <h3 className="font-bold text-neutral-800 dark:text-white text-sm mb-4 flex items-center gap-2">
                    <FileText size={16} className="text-orange-500 dark:text-indigo-400" />
                    <span>Historial de Pagos de esta Cuenta</span>
                </h3>

                {(!tenant.payments || tenant.payments.length === 0) ? (
                    <p className="text-xs text-neutral-400 dark:text-[#9499c3] text-center py-8">Sin comprobantes de pago registrados.</p>
                ) : (
                    <div className="premium-table-container mt-3">
                        <table className="premium-table">
                            <thead>
                                <tr>
                                    <th>Fecha de Cobro</th>
                                    <th>Monto</th>
                                    <th>Período</th>
                                    <th>Método</th>
                                    <th>Comprobante / Referencia</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tenant.payments.map((p: any) => (
                                    <tr key={p.id}>
                                        <td>
                                            <div className="flex items-center gap-2 text-xs text-neutral-800 dark:text-white/95">
                                                <Calendar size={13} className="text-neutral-400 dark:text-[#9499c3]" />
                                                <span>{format(new Date(p.paidAt), "dd/MM/yyyy")}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                                                ${Number(p.amount).toLocaleString()}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="text-xs font-semibold text-orange-600 dark:text-indigo-300 bg-orange-500/5 dark:bg-indigo-500/5 px-2 py-0.5 rounded border border-orange-500/15 dark:border-indigo-500/15">
                                                {p.period}
                                            </span>
                                        </td>
                                        <td className="capitalize text-neutral-800 dark:text-white">{p.method || "—"}</td>
                                        <td>
                                            {p.reference ? (
                                                <span className="font-mono text-[10px] text-neutral-500 dark:text-[#9499c3] bg-neutral-100 dark:bg-[#121334] border border-neutral-200 dark:border-[#1e214d] px-2 py-1 rounded">
                                                    {p.reference}
                                                </span>
                                            ) : (
                                                <span className="text-neutral-400 dark:text-[#9499c3]/50 text-xs italic">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            {showPayment && (
                <div className="premium-modal-overlay" onClick={() => setShowPayment(false)}>
                    <div className="premium-modal" onClick={(e) => e.stopPropagation()}>

                        {/* Modal Header */}
                        <div className="flex justify-between items-center border-b border-neutral-200 dark:border-[#1e214d]/50 pb-4 mb-6">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-orange-500/10 dark:bg-indigo-500/10 border border-orange-500/20 dark:border-indigo-500/20 flex items-center justify-center text-orange-500 dark:text-indigo-400">
                                    <CreditCard size={16} />
                                </div>
                                <h3 className="text-sm font-bold text-neutral-800 dark:text-white">Registrar Recibo de Pago</h3>
                            </div>
                            <button
                                onClick={() => setShowPayment(false)}
                                className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-[#121334] border border-neutral-200 dark:border-[#1e214d]/80 flex items-center justify-center text-neutral-500 dark:text-[#9499c3] hover:text-neutral-800 dark:hover:text-white cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Monto Recibido ($) *</label>
                                <input
                                    className="premium-input w-full px-3.5 py-2 text-xs"
                                    type="number"
                                    value={payForm.amount}
                                    onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Período Fiscal / Mensualidad *</label>
                                <input
                                    className="premium-input w-full px-3.5 py-2 text-xs"
                                    value={payForm.period}
                                    onChange={(e) => setPayForm({ ...payForm, period: e.target.value })}
                                    placeholder="Ej. 2026-05"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Canal de Pago</label>
                                <select
                                    className="premium-input w-full px-3.5 py-2 text-xs cursor-pointer"
                                    value={payForm.method}
                                    onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}
                                >
                                    <option value="transfer">Transferencia Bancaria</option>
                                    <option value="cash">Efectivo</option>
                                    <option value="mercadopago">MercadoPago</option>
                                    <option value="other">Otro / Especial</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Número de Transacción / Comprobante</label>
                                <input
                                    className="premium-input w-full px-3.5 py-2 text-xs"
                                    value={payForm.reference}
                                    onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })}
                                    placeholder="Ej. REF-983103741"
                                />
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="flex gap-3 mt-6 justify-end border-t border-neutral-200 dark:border-[#1e214d]/40 pt-4">
                            <button
                                className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-[#1e214d]/60 bg-neutral-100 dark:bg-[#121334]/50 hover:bg-neutral-200 dark:hover:bg-[#16183a] text-neutral-600 dark:text-[#9499c3] text-xs cursor-pointer"
                                onClick={() => setShowPayment(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn-grad px-5 py-2 text-xs cursor-pointer"
                                onClick={handlePayment}
                                disabled={saving || !payForm.amount || !payForm.period}
                            >
                                {saving ? "Registrando..." : "Registrar Recibo"}
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEdit && (
                <div className="premium-modal-overlay" onClick={() => setShowEdit(false)}>
                    <div className="premium-modal" onClick={(e) => e.stopPropagation()}>

                        {/* Modal Header */}
                        <div className="flex justify-between items-center border-b border-neutral-200 dark:border-[#1e214d]/50 pb-4 mb-6">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-orange-500/10 dark:bg-indigo-500/10 border border-orange-500/20 dark:border-indigo-500/20 flex items-center justify-center text-orange-500 dark:text-indigo-400">
                                    <Building2 size={16} />
                                </div>
                                <h3 className="text-sm font-bold text-neutral-800 dark:text-white">Editar Datos del Negocio</h3>
                            </div>
                            <button
                                onClick={() => setShowEdit(false)}
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
                                    <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Celular de Contacto</label>
                                    <input
                                        className="premium-input w-full px-3.5 py-2 text-xs"
                                        value={editForm.ownerPhone || ""}
                                        onChange={(e) => setEditForm({ ...editForm, ownerPhone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Dominio Customizado</label>
                                    <input
                                        className="premium-input w-full px-3.5 py-2 text-xs"
                                        value={editForm.domain || ""}
                                        onChange={(e) => setEditForm({ ...editForm, domain: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Plan de Suscripción</label>
                                    <select
                                        className="premium-input w-full px-3.5 py-2 text-xs cursor-pointer"
                                        value={editForm.planId || ""}
                                        onChange={(e) => setEditForm({ ...editForm, planId: e.target.value })}
                                    >
                                        <option value="">Sin plan</option>
                                        {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Canon Mensual ($)</label>
                                    <input
                                        className="premium-input w-full px-3.5 py-2 text-xs"
                                        type="number"
                                        value={editForm.monthlyPrice || ""}
                                        onChange={(e) => setEditForm({ ...editForm, monthlyPrice: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Fecha de Vencimiento</label>
                                <input
                                    className="premium-input w-full px-3.5 py-2 text-xs cursor-pointer"
                                    type="date"
                                    value={editForm.subscriptionEnd ? editForm.subscriptionEnd.split("T")[0] : ""}
                                    onChange={(e) => setEditForm({ ...editForm, subscriptionEnd: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Notas Internas</label>
                                <textarea
                                    className="premium-input w-full px-3.5 py-2 text-xs min-h-16 max-h-24"
                                    rows={2}
                                    value={editForm.notes || ""}
                                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="flex gap-3 mt-6 justify-end border-t border-neutral-200 dark:border-[#1e214d]/40 pt-4">
                            <button
                                className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-[#1e214d]/60 bg-neutral-100 dark:bg-[#121334]/50 hover:bg-neutral-200 dark:hover:bg-[#16183a] text-neutral-600 dark:text-[#9499c3] text-xs cursor-pointer"
                                onClick={() => setShowEdit(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn-grad px-5 py-2 text-xs cursor-pointer"
                                onClick={handleSaveEdit}
                                disabled={saving}
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

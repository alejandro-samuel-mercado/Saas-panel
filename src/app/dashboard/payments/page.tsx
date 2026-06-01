"use client";
import { useEffect, useState } from "react";
import { getPayments, getTenants, getPlans, registerPayment } from "@/lib/api";
import { CreditCard, Calendar, DollarSign, RefreshCw, Hash, X, Plus, Building2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function PaymentsPage() {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [tenants, setTenants] = useState<any[]>([]);
    const [plans, setPlans] = useState<any[]>([]);
    const [payForm, setPayForm] = useState<any>({ tenantId: "", planId: "", amount: "", period: format(new Date(), "yyyy-MM"), method: "transfer", reference: "" });
    const [saving, setSaving] = useState(false);
    
    const [tenantSearch, setTenantSearch] = useState("");
    const [showTenantDropdown, setShowTenantDropdown] = useState(false);

    const filteredTenants = tenants.filter(t => t.name.toLowerCase().includes(tenantSearch.toLowerCase()) || t.slug.toLowerCase().includes(tenantSearch.toLowerCase())).slice(0, 6);

    const handleSelectTenant = (tId: string) => {
        const tenant = tenants.find(t => t.id === tId);
        if (tenant) {
            setTenantSearch(`${tenant.name} (${tenant.slug})`);
        } else {
            setTenantSearch("");
        }
        setShowTenantDropdown(false);
        setPayForm({
            ...payForm,
            tenantId: tId,
            planId: tenant?.pendingPlanId ? tenant.pendingPlanId.toString() : "",
            amount: tenant?.pendingPlan ? tenant.pendingPlan.monthlyPrice : payForm.amount
        });
    };

    const fetchPayments = () => {
        setLoading(true);
        getPayments({ limit: 200 })
            .then(r => setPayments(r.data.data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchPayments();
        getTenants({}).then(r => setTenants(r.data.data.tenants || [])).catch(() => {});
        getPlans().then(r => setPlans(r.data.data || [])).catch(() => {});
    }, []);

    const handleRegisterPayment = async () => {
        if (!payForm.tenantId || !payForm.amount || !payForm.period) return;
        setSaving(true);
        try {
            await registerPayment({
                tenantId: payForm.tenantId,
                amount: parseFloat(payForm.amount),
                period: payForm.period,
                method: payForm.method,
                reference: payForm.reference,
                planId: payForm.planId ? parseInt(payForm.planId) : undefined
            });
            setShowPaymentModal(false);
            setPayForm({ tenantId: "", planId: "", amount: "", period: format(new Date(), "yyyy-MM"), method: "transfer", reference: "" });
            setTenantSearch("");
            fetchPayments();
        } catch (err: any) {
            alert(err.response?.data?.message || "Error al registrar pago");
        } finally {
            setSaving(false);
        }
    };

    const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return (
        <div className="animate-fade-in space-y-6">

            {/* Title section & Total KPI */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-200 dark:border-[#1e214d]/40 pb-5">
                <div>
                    <h2 className="text-xl font-bold text-neutral-800 dark:text-white tracking-tight">Historial de Cobros</h2>
                    <p className="text-xs text-neutral-500 dark:text-[#9499c3]">Registro financiero y auditoría de suscripciones del SaaS</p>
                </div>

                {/* Total KPI Card */}
                <div className="glass-panel px-5 py-3 rounded-2xl border border-neutral-200 dark:border-[#1e214d]/85 flex items-center gap-4 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <DollarSign size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-[#9499c3]">Facturación Histórica</p>
                        <p className="text-lg font-black text-neutral-800 dark:text-white">${totalAmount.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Action Row */}
            <div className="flex justify-between items-center bg-neutral-100/50 dark:bg-[#0c0d24]/30 p-3.5 rounded-xl border border-neutral-200 dark:border-[#1e214d]/40">
                <span className="text-xs text-neutral-500 dark:text-[#9499c3] font-semibold">Mostrando {payments.length} transacciones</span>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowPaymentModal(true)}
                        className="btn-grad px-4 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                        <CreditCard size={13} /> Registrar Pago
                    </button>
                    <button
                        onClick={fetchPayments}
                        className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#121334] border border-neutral-200 dark:border-[#1e214d] hover:border-orange-500 dark:hover:border-indigo-500 text-xs font-semibold text-neutral-500 dark:text-[#9499c3] hover:text-neutral-800 dark:hover:text-white flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                    >
                        <RefreshCw size={12} className={loading ? "animate-spin text-orange-500 dark:text-indigo-400" : ""} />
                        <span>Refrescar</span>
                    </button>
                </div>
            </div>

            {/* Table Section - isolated container for perfect responsiveness */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin" style={{ width: 28, height: 28, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%" }} />
                </div>
            ) : (
                <div className="premium-table-container">
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>Fecha de Transacción</th>
                                <th>Negocio</th>
                                <th>Monto Procesado</th>
                                <th>Período Contratado</th>
                                <th>Método de Pago</th>
                                <th>Código de Referencia</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center text-xs text-neutral-400 dark:text-[#9499c3] py-12">
                                        No se registran pagos de suscripción en el historial.
                                    </td>
                                </tr>
                            ) : payments.map((p) => (
                                <tr key={p.id}>
                                    <td>
                                        <div className="flex items-center gap-2 text-xs text-neutral-700 dark:text-white/90">
                                            <Calendar size={13} className="text-neutral-400 dark:text-[#9499c3]" />
                                            <span>{format(new Date(p.paidAt), "dd/MM/yyyy HH:mm", { locale: es })}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="font-extrabold text-xs text-neutral-800 dark:text-white">
                                            {p.tenant?.name || "Negocio Desconocido"}
                                        </div>
                                        {p.tenant?.slug && (
                                            <div className="text-[10px] font-mono text-neutral-400 dark:text-[#9499c3]/70 mt-0.5">{p.tenant.slug}.saas.com</div>
                                        )}
                                    </td>
                                    <td>
                                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                                            +${Number(p.amount).toLocaleString()}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="text-xs font-semibold text-orange-600 dark:text-indigo-300 bg-orange-500/5 dark:bg-indigo-500/5 border border-orange-500/15 dark:border-indigo-500/15 px-2.5 py-1 rounded-lg">
                                            {p.period}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2 text-xs text-neutral-700 dark:text-white">
                                            <CreditCard size={13} className="text-neutral-400 dark:text-[#9499c3]/80" />
                                            <span className="capitalize">{p.method || "No especificado"}</span>
                                        </div>
                                    </td>
                                    <td>
                                        {p.reference ? (
                                            <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-500 dark:text-[#9499c3] bg-neutral-100 dark:bg-[#121334]/50 border border-neutral-200 dark:border-[#1e214d]/30 px-2.5 py-1 rounded-lg w-fit">
                                                <Hash size={11} className="opacity-60" />
                                                <span>{p.reference}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-neutral-400 dark:text-[#9499c3]/40 italic">Sin código</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Payment Registration Modal */}
            {showPaymentModal && (
                <div className="premium-modal-overlay" onClick={() => setShowPaymentModal(false)}>
                    <div className="premium-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>

                        <div className="flex justify-between items-center border-b border-neutral-200 dark:border-[#1e214d]/50 pb-4 mb-6">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-orange-500/10 dark:bg-indigo-500/10 border border-orange-500/20 dark:border-indigo-500/20 flex items-center justify-center text-orange-500 dark:text-indigo-400">
                                    <CreditCard size={16} />
                                </div>
                                <h3 className="text-sm font-bold text-neutral-800 dark:text-white">Registrar Cobro Manual</h3>
                            </div>
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-[#121334] border border-neutral-200 dark:border-[#1e214d]/80 flex items-center justify-center text-neutral-500 dark:text-[#9499c3] hover:text-neutral-800 dark:hover:text-white cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="relative">
                                <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Negocio *</label>
                                <input
                                    className="premium-input w-full px-3.5 py-2 text-xs"
                                    placeholder="Buscar por nombre o slug..."
                                    value={tenantSearch}
                                    onChange={(e) => {
                                        setTenantSearch(e.target.value);
                                        if (payForm.tenantId) setPayForm({ ...payForm, tenantId: "" });
                                        setShowTenantDropdown(true);
                                    }}
                                    onFocus={() => setShowTenantDropdown(true)}
                                    onBlur={() => setTimeout(() => setShowTenantDropdown(false), 200)}
                                />
                                {showTenantDropdown && (
                                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#121334] border border-neutral-200 dark:border-[#1e214d]/80 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                        {filteredTenants.length === 0 ? (
                                            <div className="p-3 text-xs text-neutral-400 dark:text-[#9499c3]">No se encontraron resultados</div>
                                        ) : (
                                            filteredTenants.map(t => (
                                                <div 
                                                    key={t.id} 
                                                    className="p-3 text-xs text-neutral-700 dark:text-white hover:bg-neutral-100 dark:hover:bg-[#1e214d]/50 cursor-pointer border-b border-neutral-100 dark:border-[#1e214d]/30 last:border-0"
                                                    onClick={() => handleSelectTenant(t.id)}
                                                >
                                                    <div className="font-bold">{t.name}</div>
                                                    <div className="text-[10px] opacity-70 font-mono mt-0.5">{t.slug}</div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Plan a Asignar</label>
                                    <select
                                        className="premium-input w-full px-3.5 py-2 text-xs cursor-pointer"
                                        value={payForm.planId}
                                        onChange={(e) => {
                                            const pid = e.target.value;
                                            const plan = plans.find(p => p.id.toString() === pid);
                                            setPayForm({ 
                                                ...payForm, 
                                                planId: pid,
                                                amount: plan ? plan.monthlyPrice : payForm.amount
                                            });
                                        }}
                                    >
                                        <option value="">Mantener Plan Actual</option>
                                        {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Monto Cobrado ($) *</label>
                                    <input
                                        className="premium-input w-full px-3.5 py-2 text-xs"
                                        type="number"
                                        value={payForm.amount}
                                        onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-[#9499c3] block mb-1">Período / Mes *</label>
                                    <input
                                        className="premium-input w-full px-3.5 py-2 text-xs"
                                        type="month"
                                        value={payForm.period}
                                        onChange={(e) => setPayForm({ ...payForm, period: e.target.value })}
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
                            </div>


                        </div>

                        <div className="flex gap-3 mt-6 justify-end border-t border-neutral-200 dark:border-[#1e214d]/40 pt-4">
                            <button
                                className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-[#1e214d]/60 bg-neutral-100 dark:bg-[#121334]/50 hover:bg-neutral-200 dark:hover:bg-[#16183a] text-neutral-600 dark:text-[#9499c3] text-xs cursor-pointer"
                                onClick={() => setShowPaymentModal(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn-grad px-5 py-2 text-xs cursor-pointer"
                                onClick={handleRegisterPayment}
                                disabled={saving || !payForm.tenantId || !payForm.amount || !payForm.period}
                            >
                                {saving ? "Procesando..." : "Confirmar Recibo"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

"use client";
import { useEffect, useState } from "react";
import { getDashboard } from "@/lib/api";
import { Building2, Users, DollarSign, CreditCard, Sparkles, ShieldAlert, ArrowUpRight, TrendingUp } from "lucide-react";
import Link from "next/link";

interface DashboardData {
    totalTenants: number;
    activeTenants: number;
    totalPlans: number;
    mrr: number;
    recentPayments: any[];
    expiringSoon: any[];
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDashboard()
            .then((r) => setData(r.data.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin" style={{ width: 28, height: 28, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%" }} />
            </div>
        );
    }

    if (!data) return <p className="text-center text-xs text-neutral-500 dark:text-[#9499c3] py-12">Error al recuperar datos del panel.</p>;

    // Style tags
    const statsList = [
        { label: "Total Negocios", value: data.totalTenants, sub: "Registrados globalmente", icon: Building2, color: "text-orange-500 dark:text-indigo-400" },
        { label: "Suscripciones Activas", value: data.activeTenants, sub: "Generando ingresos", icon: Users, color: "text-emerald-500 dark:text-blue-400" },
        { label: "MRR Estimado", value: `$${(data.mrr || 0).toLocaleString()}`, sub: "Ingresos mensuales recurrentes", icon: DollarSign, color: "text-orange-500 dark:text-emerald-400" },
        { label: "Planes Activos", value: data.totalPlans, sub: "Opciones de suscripción", icon: CreditCard, color: "text-amber-500 dark:text-violet-400" },
    ];

    return (
        <div className="animate-fade-in space-y-8">

            {/* Welcome Banner */}
            <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent dark:from-indigo-950/20 dark:via-purple-950/10 dark:to-transparent border border-orange-500/20 dark:border-indigo-500/15 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300">
                <div className="space-y-2 relative z-10">
                    <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-orange-500 dark:text-indigo-400" />
                        <span className="text-[10px] uppercase font-black tracking-wider text-orange-500 dark:text-indigo-400">Consola Central SaaS</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-neutral-800 dark:text-white">Bienvenido de vuelta, Administrador</h2>
                    <p className="text-xs text-neutral-500 dark:text-[#9499c3] max-w-xl">
                        Monitorea el crecimiento de tu red de Negocios, controla los pagos de facturación mensual y activa nuevos planes para tus Negocios de forma segura.
                    </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 relative z-10">
                    <div className="w-10 h-10 rounded-2xl bg-orange-500/10 dark:bg-indigo-500/15 flex items-center justify-center text-orange-500 dark:text-indigo-400 border border-orange-500/20 dark:border-indigo-500/20">
                        <TrendingUp size={18} />
                    </div>
                    <div>
                        <span className="text-[9px] uppercase font-bold tracking-wider text-neutral-500 dark:text-[#9499c3] block">MRR General</span>
                        <span className="text-sm font-extrabold text-neutral-800 dark:text-white">${(data.mrr || 0).toLocaleString()} ARS</span>
                    </div>
                </div>
            </div>

            {/* Stats KPI grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsList.map((s, idx) => {
                    const Icon = s.icon;
                    return (
                        <div key={idx} className="glow-card p-6 border-neutral-200/80 dark:border-[#1e214d]/60 hover:border-orange-500/40 dark:hover:border-indigo-500/40">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-neutral-400 dark:text-[#9499c3]">{s.label}</span>
                                    <p className="text-2xl font-black text-neutral-800 dark:text-white">{s.value}</p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-[#121334]/50 border border-neutral-200/50 dark:border-[#1e214d]/60 flex items-center justify-center">
                                    <Icon size={18} className={s.color} />
                                </div>
                            </div>
                            <p className="text-[11px] text-neutral-400 dark:text-[#9499c3]/70 mt-4 font-medium">{s.sub}</p>
                        </div>
                    );
                })}
            </div>

            {/* Critical Expirations / Alerts */}
            {data.expiringSoon.length > 0 && (
                <div className="bg-red-500/5 dark:bg-red-500/10 border border-red-500/15 dark:border-red-500/20 rounded-3xl p-5 flex gap-4 items-start">
                    <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 text-red-500 mt-0.5">
                        <ShieldAlert size={16} />
                    </div>
                    <div className="space-y-1 flex-1">
                        <span className="text-xs font-black text-neutral-800 dark:text-white">Alerta de Renovación Inminente</span>
                        <p className="text-xs text-neutral-500 dark:text-[#9499c3]/90">
                            Hay <strong className="text-red-500 font-bold">{data.expiringSoon.length} Negocios</strong> con suscripciones que vencen en los próximos 7 días. Registra sus pagos o ponte en contacto con los dueños.
                        </p>
                    </div>
                    <Link
                        href="/dashboard/tenants"
                        className="text-xs font-bold text-red-500 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 mt-1 cursor-pointer"
                    >
                        <span>Ver Negocios</span>
                        <ArrowUpRight size={14} />
                    </Link>
                </div>
            )}

            {/* Main Split Grid (Expirations vs. Payments) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Expiring Soon */}
                <div className="glass-panel rounded-3xl p-6 border-neutral-200/80 dark:border-[#1e214d]/60">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-extrabold text-sm text-neutral-800 dark:text-white">Negocios por Vencer</h3>
                            <p className="text-[10px] text-neutral-400 dark:text-[#9499c3]">Suscripciones en estado crítico de renovación</p>
                        </div>
                        <Link
                            href="/dashboard/tenants"
                            className="text-[10px] uppercase tracking-wider font-extrabold text-orange-500 dark:text-indigo-400 hover:opacity-85"
                        >
                            Gestionar Cuentas
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {data.expiringSoon.length === 0 ? (
                            <p className="text-xs text-neutral-400 dark:text-[#9499c3] text-center py-10 italic">No hay renovaciones urgentes esta semana.</p>
                        ) : data.expiringSoon.map((t) => (
                            <div key={t.id} className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#0c0d24]/50 border border-neutral-100 dark:border-[#1e214d]/40 flex justify-between items-center gap-4 hover:border-neutral-200 dark:hover:border-[#1e214d] transition-all">
                                <div className="min-w-0">
                                    <span className="font-bold text-xs text-neutral-800 dark:text-white truncate block">{t.name}</span>
                                    <span className="text-[10px] font-mono text-neutral-400 dark:text-[#9499c3]/70 block mt-0.5">{t.slug}.saas.com</span>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-[10px] font-bold text-red-500 bg-red-500/5 dark:bg-red-500/10 border border-red-500/10 px-2 py-0.5 rounded">
                                        Vence {new Date(t.subscriptionEnd).toLocaleDateString()}
                                    </span>
                                    <span className="text-xs font-extrabold text-neutral-700 dark:text-white block mt-1">${Number(t.monthlyPrice || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Payments */}
                <div className="glass-panel rounded-3xl p-6 border-neutral-200/80 dark:border-[#1e214d]/60">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-extrabold text-sm text-neutral-800 dark:text-white">Últimas Transacciones</h3>
                            <p className="text-[10px] text-neutral-400 dark:text-[#9499c3]">Últimos pagos de canon mensual ingresados</p>
                        </div>
                        <Link
                            href="/dashboard/payments"
                            className="text-[10px] uppercase tracking-wider font-extrabold text-orange-500 dark:text-indigo-400 hover:opacity-85"
                        >
                            Ver Facturas
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {data.recentPayments.length === 0 ? (
                            <p className="text-xs text-neutral-400 dark:text-[#9499c3] text-center py-10 italic">No se han registrado pagos en el sistema.</p>
                        ) : data.recentPayments.map((p) => (
                            <div key={p.id} className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#0c0d24]/50 border border-neutral-100 dark:border-[#1e214d]/40 flex justify-between items-center gap-4 hover:border-neutral-200 dark:hover:border-[#1e214d] transition-all">
                                <div className="min-w-0">
                                    <span className="font-bold text-xs text-neutral-800 dark:text-white truncate block">{p.tenant?.name || "Tienda"}</span>
                                    <span className="text-[10px] font-mono text-neutral-400 dark:text-[#9499c3]/70 block mt-0.5">{p.period} • {p.method}</span>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 px-2 py-0.5 rounded">
                                        +${Number(p.amount).toLocaleString()}
                                    </span>
                                    <span className="text-[9px] text-neutral-400 dark:text-[#9499c3]/70 block mt-1 font-mono">{p.reference || "N/C"}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

        </div>
    );
}

"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getCustomerByEmail } from "@/lib/api";
import { ArrowLeft, Users, Building2, CreditCard, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function CustomerDetailPage() {
    const router = useRouter();
    const params = useParams();
    const email = decodeURIComponent(params.email as string);
    const [customer, setCustomer] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getCustomerByEmail(email)
            .then((res) => setCustomer(res.data.data))
            .catch((err) => {
                console.error(err);
                router.push("/dashboard/customers");
            })
            .finally(() => setLoading(false));
    }, [email, router]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-muted border-t-primary rounded-full"></div>
            </div>
        );
    }

    if (!customer) return null;

    return (
        <div className="space-y-6">
            <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft size={16} /> Volver a Clientes
            </button>

            <div className="bg-card border border-border p-8 rounded-3xl shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-black text-2xl shadow-lg">
                            {customer.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-foreground">{customer.name}</h1>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground font-medium">
                                <span className="flex items-center gap-1.5"><Users size={14} /> {customer.email}</span>
                                {customer.phone && <span className="flex items-center gap-1.5">📞 {customer.phone}</span>}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-background border border-border px-4 py-3 rounded-2xl text-center min-w-[120px]">
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Negocios</p>
                            <p className="text-2xl font-black text-foreground">{customer.businessesCount}</p>
                        </div>
                        <div className="bg-background border border-border px-4 py-3 rounded-2xl text-center min-w-[120px]">
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">MRR (Monto)</p>
                            <p className="text-2xl font-black text-primary">${customer.totalMonthlyPrice.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2 px-1">
                    <Building2 className="text-secondary" size={20} /> Negocios del Cliente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {customer.tenants.map((tenant: any) => (
                        <div key={tenant.id} className="bg-card border border-border rounded-3xl p-6 flex flex-col h-full hover:shadow-md transition-all duration-300 group">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h4 className="font-bold text-lg text-foreground leading-tight group-hover:text-primary transition-colors">{tenant.name}</h4>
                                    <p className="text-xs text-muted-foreground mt-1">/{tenant.slug}</p>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    tenant.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 
                                    tenant.status === 'PAUSED' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 
                                    'bg-red-500/10 text-red-500 border border-red-500/20'
                                }`}>
                                    {tenant.status}
                                </span>
                            </div>

                            <div className="space-y-3 mt-auto mb-6">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground font-medium">Rubro:</span>
                                    <span className="font-semibold">{tenant.rubro?.name || 'No asignado'}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground font-medium">Plan Actual:</span>
                                    <span className="font-semibold text-secondary">{tenant.plan?.name || 'Ninguno'}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground font-medium">Suscripción:</span>
                                    <span className="font-semibold font-mono">
                                        {tenant.subscriptionEnd ? format(new Date(tenant.subscriptionEnd), 'dd/MM/yyyy') : 'Ilimitada'}
                                    </span>
                                </div>
                                {tenant.payments && tenant.payments.length > 0 && (
                                    <div className="mt-2 pt-3 border-t border-border/50">
                                        <p className="text-xs text-muted-foreground mb-1">Último Pago:</p>
                                        <div className="flex items-center gap-2 text-sm font-semibold">
                                            <CheckCircle2 size={14} className="text-green-500" />
                                            ${tenant.payments[0].amount} ({format(new Date(tenant.payments[0].paidAt), "MMM yyyy", { locale: es })})
                                        </div>
                                    </div>
                                )}
                                <div className="mt-2 pt-3 border-t border-border/50">
                                    <p className="text-xs text-muted-foreground mb-1.5">Pasarelas de Pago:</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {tenant.rubro?.cartEnabled === false ? (
                                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                No aplica para este rubro
                                            </span>
                                        ) : tenant.activeGateways && tenant.activeGateways.length > 0 ? (
                                            tenant.activeGateways.map((gw: string) => (
                                                <span key={gw} className="px-2 py-0.5 rounded-md bg-secondary/10 text-secondary text-[10px] font-bold border border-secondary/20">
                                                    {gw}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-[11px] text-amber-500 italic flex items-center gap-1">
                                                <AlertCircle size={12} /> Sin configurar
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={() => router.push(`/dashboard/tenants?search=${tenant.slug}`)}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-muted/50 hover:bg-primary hover:text-primary-foreground text-sm font-bold transition-colors mt-auto"
                            >
                                Gestionar Negocio <ChevronRight size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

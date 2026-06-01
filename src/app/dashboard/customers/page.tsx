"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCustomers } from "@/lib/api";
import { Users, Search, RefreshCw, Eye, Building2 } from "lucide-react";

export default function CustomersPage() {
    const router = useRouter();
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchCustomers = () => {
        setLoading(true);
        getCustomers()
            .then((res) => setCustomers(res.data.data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const filteredCustomers = customers.filter(c => 
        c.email.toLowerCase().includes(search.toLowerCase()) || 
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Users className="text-primary" />
                        Cartera de Clientes
                    </h1>
                    <p className="text-muted-foreground text-sm">Gestiona los dueños de negocios centralizadamente.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-xl bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                        />
                    </div>
                    <button onClick={fetchCustomers} className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground transition-all">
                        <RefreshCw size={18} className={loading ? "animate-spin text-primary" : ""} />
                    </button>
                </div>
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4 text-center">Negocios</th>
                                <th className="px-6 py-4 text-right">Monto Mensual</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <RefreshCw className="animate-spin w-6 h-6 text-primary" />
                                            <span>Cargando cartera de clientes...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                        No se encontraron clientes.
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((customer, idx) => (
                                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-foreground">{customer.name}</div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                {customer.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary font-bold text-xs">
                                                <Building2 size={12} />
                                                {customer.businessesCount} Negocios
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-mono font-bold">${customer.totalMonthlyPrice.toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => router.push(`/dashboard/customers/${encodeURIComponent(customer.email)}`)}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-semibold text-xs transition-colors"
                                            >
                                                <Eye size={14} /> Ver Detalle
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

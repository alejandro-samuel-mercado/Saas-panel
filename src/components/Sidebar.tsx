"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Building2, Layers, CreditCard, LogOut, Zap, ShieldCheck, Users } from "lucide-react";

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const menuItems = [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "Negocios", href: "/dashboard/tenants", icon: Building2 },
        { label: "Clientes", href: "/dashboard/customers", icon: Users },
        { label: "Planes SaaS", href: "/dashboard/plans", icon: Layers },
        { label: "Cobros & Pagos", href: "/dashboard/payments", icon: CreditCard },
    ];

    const handleLogout = () => {
        localStorage.removeItem("saas_token");
        localStorage.removeItem("saas_user");
        router.push("/");
    };

    return (
        <aside className="w-72 h-screen fixed top-0 left-0 bg-card border-r border-border flex flex-col justify-between py-8 px-6 z-30 transition-colors duration-500">

            {/* Absolute Merged Corner Joins to fit Layout Contours */}
            <div className="sidebar-corner-top hidden md:block" />
            <div className="sidebar-corner-bottom hidden md:block" />

            <div className="space-y-10">

                {/* Brand/Logo Header */}
                <div className="flex items-center gap-3 px-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground shadow-md shadow-primary/20 transition-all duration-300">
                        <Zap size={18} className="fill-white/20" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-foreground tracking-wide uppercase font-elegant">Super SaaS</h2>
                        <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-0.5">Control Central</p>
                    </div>
                </div>

                {/* Navigation Items */}
                <nav className="space-y-1.5">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${isActive
                                        ? "bg-primary/10 border border-primary/20 text-primary font-extrabold shadow-sm"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon size={16} className={isActive ? "text-primary" : "opacity-80"} />
                                    <span>{item.label}</span>
                                </div>
                                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />}
                            </Link>
                        );
                    })}
                </nav>

            </div>

            <div className="space-y-4">
                {/* Admin Tag */}
                <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                        <ShieldCheck size={14} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">Administrador</p>
                        <p className="text-[10px] text-muted-foreground truncate">SaaS Pro</p>
                    </div>
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 text-xs font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-2xl transition-colors"
                >
                    <LogOut size={14} />
                    <span>Cerrar Sesión</span>
                </button>
            </div>

        </aside>
    );
}

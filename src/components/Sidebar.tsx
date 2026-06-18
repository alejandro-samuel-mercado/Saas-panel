"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Building2, Layers, CreditCard, LogOut, Zap, ShieldCheck, Users, ChevronLeft, ChevronRight } from "lucide-react";

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
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
        <aside className={`${isCollapsed ? "w-20" : "w-72"} h-screen fixed top-0 left-0 bg-card border-r border-border flex flex-col justify-between py-8 px-4 z-30 transition-all duration-300`}>
            {/* Absolute Merged Corner Joins to fit Layout Contours */}
            <div className="sidebar-corner-top hidden md:block" />
            <div className="sidebar-corner-bottom hidden md:block" />

            <div className="space-y-10">

                {/* Brand/Logo Header */}
                <div className={`flex items-center gap-3 px-2 ${isCollapsed ? "justify-center" : ""}`}>
                    <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground shadow-md shadow-primary/20 transition-all duration-300">
                        <Zap size={18} className="fill-white/20" />
                    </div>
                    {!isCollapsed && (
                        <div className="overflow-hidden whitespace-nowrap transition-all duration-300 opacity-100">
                            <h2 className="text-sm font-black text-foreground tracking-wide uppercase font-elegant">Super SaaS</h2>
                            <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-0.5">Control Central</p>
                        </div>
                    )}
                </div>

                {/* Collapse Toggle Button */}
                <button
                    onClick={onToggle}
                    className="absolute -right-3 top-9 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground shadow-sm z-50 transition-colors"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                {/* Navigation Items */}
                <nav className="space-y-1.5">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center ${isCollapsed ? "justify-center px-2" : "justify-between px-4"} py-3.5 rounded-2xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${isActive
                                        ? "bg-primary/10 border border-primary/20 text-primary font-extrabold shadow-sm"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
                                    }`}
                                title={isCollapsed ? item.label : ""}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon size={16} className={isActive ? "text-primary shrink-0" : "opacity-80 shrink-0"} />
                                    {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                                </div>
                                {!isCollapsed && isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />}
                            </Link>
                        );
                    })}
                </nav>

            </div>

            <div className="space-y-4">
                {/* Admin Tag */}
                <div className={`p-4 rounded-2xl bg-muted/40 border border-border/80 flex items-center ${isCollapsed ? "justify-center px-2" : "gap-3"}`}>
                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                        <ShieldCheck size={14} />
                    </div>
                    {!isCollapsed && (
                        <div className="min-w-0 overflow-hidden">
                            <p className="text-xs font-bold text-foreground truncate">Administrador</p>
                            <p className="text-[10px] text-muted-foreground truncate">SaaS Pro</p>
                        </div>
                    )}
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    title={isCollapsed ? "Cerrar Sesión" : ""}
                    className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 text-xs font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-2xl transition-colors ${isCollapsed ? "px-2" : ""}`}
                >
                    <LogOut size={14} className="shrink-0" />
                    {!isCollapsed && <span className="whitespace-nowrap">Cerrar Sesión</span>}
                </button>
            </div>

        </aside>
    );
}

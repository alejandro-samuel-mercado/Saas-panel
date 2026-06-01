"use client";
import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Moon, Sun, Bell, HelpCircle, Activity } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<"light" | "dark">("dark");
    const [ready, setReady] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        setReady(true);
        const token = localStorage.getItem("saas_token");
        if (!token) {
            router.push("/");
            return;
        }
        const savedTheme = localStorage.getItem("saas_theme");
        if (savedTheme === "light") setTheme("light");
    }, [router]);

    const toggleTheme = () => {
        if (theme === "dark") {
            document.documentElement.classList.remove("dark");
            document.documentElement.classList.add("light");
            localStorage.setItem("saas_theme", "light");
            setTheme("light");
        } else {
            document.documentElement.classList.remove("light");
            document.documentElement.classList.add("dark");
            localStorage.setItem("saas_theme", "dark");
            setTheme("dark");
        }
    };

    const getPageTitle = () => {
        if (pathname === "/dashboard") return "Resumen Operativo";
        if (pathname?.startsWith("/dashboard/tenants")) return "Gestión de Negocios";
        if (pathname?.startsWith("/dashboard/plans")) return "Planes de Suscripción";
        if (pathname?.startsWith("/dashboard/payments")) return "Historial Financiero";
        return "SaaS Manager";
    };

    if (!ready) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="animate-spin w-9 h-9 border-4 border-muted border-t-primary rounded-full" />
        </div>
    );

    return (
        <div className="flex h-screen bg-background overflow-hidden relative transition-colors duration-500">

            {/* Structural Master Frame Borders around screen */}
            <div className="master-frame-border" />

            {/* Left Sidebar - w-72 wider size and fully fixed */}
            <Sidebar />

            {/* Right Content Space */}
            <main className="flex-1 flex flex-col overflow-hidden relative ml-72 m-2.5 rounded-l-2xl border-l border-border bg-background">

                {/* Top Header inside main view */}
                <header className="h-20 px-8 flex items-center justify-between z-10 bg-background border-b border-border transition-colors duration-300">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-primary to-secondary transition-all duration-300" />
                        <h1 className="text-xl font-bold text-foreground tracking-tight">{getPageTitle()}</h1>
                    </div>

                    <div className="flex items-center gap-6">

                        {/* System Health / Status Badge */}
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-[11px] font-bold">
                            <Activity size={13} className="animate-pulse" />
                            <span>Sistemas en línea</span>
                        </div>

                        {/* Actions Bar */}
                        <div className="flex items-center gap-2">

                            {/* Theme Toggle Switcher */}
                            <button
                                onClick={toggleTheme}
                                className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted transition-all cursor-pointer shadow-sm"
                                title="Cambiar Color de Tema"
                            >
                                {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
                            </button>

                            <button className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer shadow-sm">
                                <Bell size={17} />
                            </button>

                        </div>

                        <div className="w-px h-8 bg-border" />

                        {/* Profile Avatar widget */}
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col text-right hidden md:block">
                                <span className="text-xs font-extrabold text-foreground">SaaS Owner</span>

                            </div>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-md transition-all duration-300">
                                SO
                            </div>
                        </div>
                    </div>
                </header>

                {/* Scrollable Canvas for Dashboard children */}
                <div className="flex-1 overflow-y-auto px-8 py-10 pb-20 relative bg-background">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>

            </main>
        </div>
    );
}

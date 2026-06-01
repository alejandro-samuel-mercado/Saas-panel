"use client";
import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { saasLogin } from "@/lib/api";
import { Lock, Mail, Loader2, Zap, ShieldAlert, Sun, Moon } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [theme, setTheme] = useState<"light" | "dark">("dark");

    useEffect(() => {
        // Detect theme on mount
        if (typeof window !== "undefined") {
            const isLight = document.documentElement.classList.contains("light");
            setTheme(isLight ? "light" : "dark");
        }
    }, []);

    const toggleTheme = () => {
        const nextTheme = theme === "dark" ? "light" : "dark";
        if (nextTheme === "light") {
            document.documentElement.classList.remove("dark");
            document.documentElement.classList.add("light");
        } else {
            document.documentElement.classList.remove("light");
            document.documentElement.classList.add("dark");
        }
        localStorage.setItem("saas_theme", nextTheme);
        setTheme(nextTheme);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await saasLogin(email, password);
            localStorage.setItem("saas_token", res.data.data.token);
            localStorage.setItem("saas_user", JSON.stringify(res.data.data.user));
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.response?.data?.message || "Error de red o credenciales incorrectas");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-[#03030c] flex items-center justify-center relative px-4 overflow-hidden select-none transition-colors duration-500">

            {/* Dynamic Theme switch in Login Top Right */}
            <button
                onClick={toggleTheme}
                className="absolute top-6 right-6 w-11 h-11 rounded-2xl bg-white dark:bg-[#121334]/50 border border-neutral-200 dark:border-[#1e214d]/60 flex items-center justify-center text-neutral-600 dark:text-[#9499c3] hover:text-orange-500 dark:hover:text-violet-400 hover:bg-neutral-100 dark:hover:bg-[#16183a] transition-all cursor-pointer z-20 shadow-sm"
                title="Cambiar Color de Tema"
            >
                {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Decorative Ambient Lighting Glowing Spheres */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[15%] left-[5%] w-[380px] h-[380px] rounded-full bg-orange-400/5 dark:bg-violet-500/5 filter blur-[120px] animate-pulse duration-5000" />
                <div className="absolute bottom-[15%] right-[5%] w-[340px] h-[340px] rounded-full bg-emerald-400/5 dark:bg-blue-500/5 filter blur-[100px] animate-pulse duration-4000" />
            </div>

            {/* Frame Outlines for Login Viewport consistency */}
            <div className="master-frame-border" />

            {/* Login Form Container Card */}
            <div className="w-full max-w-[430px] bg-white dark:bg-[#101128] border border-neutral-200/80 dark:border-[#1e214d]/85 rounded-3xl p-8 md:p-10 shadow-xl dark:shadow-2xl relative z-10 animate-fade-in transition-all duration-300">

                {/* Colorful top border underline */}
                <div className="absolute top-0 left-6 right-6 h-1 bg-gradient-to-r from-orange-400 via-emerald-400 to-orange-500 dark:from-blue-500 dark:via-purple-500 dark:to-indigo-500 rounded-b" />

                {/* Corporate Branding Header */}
                <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 dark:from-indigo-500 dark:via-purple-500 dark:to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/10 dark:shadow-indigo-500/20 transition-all duration-300">
                        <Zap size={26} className="text-white fill-white/10" />
                    </div>
                    <h1 className="text-2xl font-black text-neutral-800 dark:text-white tracking-tight font-elegant">SaaS Central</h1>
                    <p className="text-[10px] text-orange-500 dark:text-indigo-400 font-extrabold uppercase tracking-widest mt-1.5">
                        Módulo de Administración
                    </p>
                </div>

                {/* Dynamic Authentication Error Display */}
                {error && (
                    <div className="bg-red-500/5 dark:bg-red-500/10 border border-red-500/15 dark:border-red-500/20 rounded-2xl p-4 mb-5 flex gap-3 items-start text-xs text-red-600 dark:text-red-400">
                        <ShieldAlert size={17} className="shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                            <span className="font-bold">Error de Autenticación</span>
                            <p className="opacity-85">{error}</p>
                        </div>
                    </div>
                )}

                {/* Input Fields */}
                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* User ID Field */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider font-extrabold text-neutral-500 dark:text-[#9499c3]">Email Corporativo</label>
                        <div className="relative">
                            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-[#9499c3]" />
                            <input
                                className="premium-input w-full pl-11 pr-4 py-3 text-xs"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@saas.com"
                                required
                            />
                        </div>
                    </div>

                    {/* Secure Token Password Field */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider font-extrabold text-neutral-500 dark:text-[#9499c3]">Contraseña Admin</label>
                        <div className="relative">
                            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-[#9499c3]" />
                            <input
                                className="premium-input w-full pl-11 pr-4 py-3 text-xs"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    {/* Login Submit Trigger */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-grad w-full h-12 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer mt-6"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin text-white" />
                                <span>Validando Credenciales...</span>
                            </>
                        ) : (
                            <span>Entrar al Panel</span>
                        )}
                    </button>
                </form>


            </div>
        </div>
    );
}

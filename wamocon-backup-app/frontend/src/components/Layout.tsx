import { useEffect, useState } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import {
    ShieldCheck, HardDrives, CalendarDots, Scroll, Desktop, TreeStructure,
    GearSix, Lifebuoy, BookOpenText, SignOut, CircleNotch, ArrowSquareOut,
    List, X, Sun, Moon, ArrowLineLeft, ArrowLineRight
} from '@phosphor-icons/react';
import client from '../api/client';
import { useAuthStore } from '../store/auth.store';

// Page label + title map for context header
const PAGE_META: Record<string, { title: string; subtitle?: string }> = {
    '/dashboard':   { title: 'Dashboard',          subtitle: 'Gesamtübersicht des Backup-Systems' },
    '/jobs':        { title: 'Backup-Pläne',        subtitle: 'Jobs verwalten und starten' },
    '/calendar':    { title: 'Kalender',            subtitle: 'Zeitplan und nächste Ausführungen' },
    '/logs':        { title: 'Protokolle',          subtitle: 'Lauf-Logs und Fehleranalyse' },
    '/devices':     { title: 'Geräte',              subtitle: 'Netzwerkgeräte und Status' },
    '/architecture':{ title: 'Architektur',         subtitle: 'Systemaufbau und Datenpfade' },
    '/settings':    { title: 'Einstellungen',       subtitle: 'System- und E-Mail-Konfiguration' },
    '/help':        { title: 'Hilfe & Support',     subtitle: 'FAQ und Fehlerbehebung' },
    '/manual':      { title: 'Handbuch',            subtitle: 'Dokumentation und Anleitungen' },
};

type NavGroup = {
    label: string;
    items: {
        path: string;
        label: string;
        icon: React.ElementType;
        adminOnly?: boolean;
        isExternal?: boolean;
    }[];
};

const NAV_GROUPS: NavGroup[] = [
    {
        label: 'Übersicht',
        items: [
            { path: '/dashboard', label: 'Dashboard',   icon: HardDrives },
            { path: '/calendar',  label: 'Kalender',    icon: CalendarDots },
        ],
    },
    {
        label: 'Backup',
        items: [
            { path: '/jobs', label: 'Backup-Pläne', icon: ShieldCheck },
            { path: '/logs', label: 'Protokolle',   icon: Scroll },
        ],
    },
    {
        label: 'Infrastruktur',
        items: [
            { path: '/devices',      label: 'Geräte',               icon: Desktop },
            { path: '/architecture', label: 'Architektur',          icon: TreeStructure },
            { path: 'urbackup',      label: 'Notebooks (UrBackup)', icon: ArrowSquareOut, isExternal: true },
        ],
    },
    {
        label: 'Verwaltung',
        items: [
            { path: '/settings', label: 'Einstellungen', icon: GearSix, adminOnly: true },
        ],
    },
    {
        label: 'Dokumentation',
        items: [
            { path: '/help',   label: 'Hilfe & Support', icon: Lifebuoy },
            { path: '/manual', label: 'Handbuch',        icon: BookOpenText },
        ],
    },
];

export default function Layout() {
    const token = localStorage.getItem('token');
    const location = useLocation();

    const [runningJob, setRunningJob]   = useState<any | null>(null);
    const [collapsed, setCollapsed]     = useState(() => localStorage.getItem('sidebar-collapsed') === 'true');
    const [darkMode, setDarkMode]       = useState(() => localStorage.getItem('dark-mode') === 'true' || window.matchMedia('(prefers-color-scheme: dark)').matches);
    const [mobileOpen, setMobileOpen]   = useState(false);

    // Apply dark mode class to root
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('dark-mode', String(darkMode));
    }, [darkMode]);

    useEffect(() => {
        localStorage.setItem('sidebar-collapsed', String(collapsed));
    }, [collapsed]);

    useEffect(() => {
        if (!token) return;
        const checkRunningJobs = async () => {
            try {
                const resp = await client.get('/dashboard');
                const runs = resp.data?.last_runs || [];
                const activeRun = runs.find((r: any) => r.status === 'running');
                setRunningJob(activeRun || null);
            } catch {
                // silent
            }
        };
        checkRunningJobs();
        const interval = setInterval(checkRunningJobs, 10000);
        return () => clearInterval(interval);
    }, [token]);

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    const user = useAuthStore.getState().user;
    const isAdmin = user?.role === 'admin';

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    // Current page meta
    const currentMeta = Object.entries(PAGE_META).find(([key]) => location.pathname.startsWith(key))?.[1];

    const sidebarWidth = collapsed ? 'w-[68px]' : 'w-64';

    const renderNavGroup = (group: NavGroup) => {
        const visibleItems = group.items.filter(item => !item.adminOnly || isAdmin);
        if (visibleItems.length === 0) return null;

        return (
            <div key={group.label} className="mb-2">
                {/* Section label */}
                {!collapsed && (
                    <p className="px-4 mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 select-none">
                        {group.label}
                    </p>
                )}
                <div className="space-y-0.5">
                    {visibleItems.map((item) => {
                        if (item.isExternal) {
                            const urBackupUrl = window.location.protocol + '//192.168.178.62:55414';
                            return (
                                <a
                                    key={item.path}
                                    href={urBackupUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={collapsed ? item.label : undefined}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-slate-400 hover:bg-indigo-900/40 hover:text-indigo-300"
                                >
                                    <item.icon
                                        size={20}
                                        weight="duotone"
                                        className="shrink-0 text-indigo-400/70 group-hover:text-indigo-400 transition-colors"
                                    />
                                    {!collapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
                                </a>
                            );
                        }

                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                title={collapsed ? item.label : undefined}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                                    isActive
                                        ? 'text-blue-400 font-medium active-nav-item'
                                        : 'hover:bg-slate-800/50 hover:text-white text-slate-400'
                                }`}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-blue-500 rounded-r-full" />
                                )}
                                <item.icon
                                    size={20}
                                    weight={isActive ? 'duotone' : 'regular'}
                                    className={`shrink-0 transition-colors ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`}
                                />
                                {!collapsed && <span className="text-sm truncate">{item.label}</span>}
                            </Link>
                        );
                    })}
                </div>
            </div>
        );
    };

    const sidebarContent = (
        <div className="flex flex-col h-full">
            {/* Brand */}
            <div className={`h-16 flex items-center border-b border-slate-800 bg-slate-950/30 shrink-0 ${collapsed ? 'justify-center px-2' : 'px-4 gap-3'}`}>
                <div className="relative shrink-0">
                    <img src="/src/assets/BackupPilot.png" alt="BackupPilot" className="w-9 h-9 rounded-xl object-contain" />
                    {/* Status pulse dot */}
                    <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${runningJob ? 'bg-blue-400 animate-pulse' : 'bg-emerald-500'}`} />
                </div>
                {!collapsed && (
                    <span className="font-bold text-base tracking-tight text-white leading-none">
                        BackupPilot
                    </span>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto p-3 mt-2 space-y-3">
                {NAV_GROUPS.map(renderNavGroup)}
            </nav>

            {/* Bottom controls */}
            <div className="shrink-0 border-t border-slate-800 bg-slate-950/20 p-3 space-y-1">
                {/* Dark mode toggle */}
                <button
                    onClick={() => setDarkMode(d => !d)}
                    title={darkMode ? 'Hell-Modus' : 'Dunkel-Modus'}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800/50 hover:text-white transition-colors ${collapsed ? 'justify-center' : ''}`}
                >
                    {darkMode
                        ? <Sun size={20} weight="regular" className="shrink-0" />
                        : <Moon size={20} weight="regular" className="shrink-0" />
                    }
                    {!collapsed && <span>{darkMode ? 'Hell-Modus' : 'Dunkel-Modus'}</span>}
                </button>

                {/* Collapse toggle */}
                <button
                    onClick={() => setCollapsed(c => !c)}
                    title={collapsed ? 'Sidebar aufklappen' : 'Sidebar einklappen'}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800/50 hover:text-white transition-colors ${collapsed ? 'justify-center' : ''}`}
                >
                    {collapsed
                        ? <ArrowLineRight size={20} weight="regular" className="shrink-0" />
                        : <ArrowLineLeft size={20} weight="regular" className="shrink-0" />
                    }
                    {!collapsed && <span>Einklappen</span>}
                </button>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    title={collapsed ? 'Abmelden' : undefined}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors ${collapsed ? 'justify-center' : ''}`}
                >
                    <SignOut size={20} weight="regular" className="shrink-0" />
                    {!collapsed && <span>Abmelden</span>}
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen bg-dots selection:bg-blue-100 overflow-hidden dark:bg-dots-dark">
            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar – desktop */}
            <aside className={`hidden lg:flex flex-col ${sidebarWidth} bg-slate-900 border-r border-slate-800 text-slate-300 transition-all duration-300 shrink-0 z-30`}>
                {sidebarContent}
            </aside>

            {/* Sidebar – mobile drawer */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col lg:hidden transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {sidebarContent}
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Context Header */}
                <header className="shrink-0 h-14 flex items-center gap-4 px-6 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md z-20">
                    {/* Mobile menu button */}
                    <button
                        className="lg:hidden text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                        onClick={() => setMobileOpen(o => !o)}
                    >
                        {mobileOpen ? <X size={22} /> : <List size={22} />}
                    </button>

                    <div className="flex-1 min-w-0">
                        {currentMeta && (
                            <div>
                                <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-none">{currentMeta.title}</h1>
                                {currentMeta.subtitle && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">{currentMeta.subtitle}</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Running job indicator in header */}
                    {runningJob && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-medium">
                            <CircleNotch size={14} className="animate-spin shrink-0" />
                            <span className="max-w-36 truncate hidden sm:inline">{runningJob.job_name}</span>
                            <span className="sm:hidden">läuft</span>
                        </div>
                    )}
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}

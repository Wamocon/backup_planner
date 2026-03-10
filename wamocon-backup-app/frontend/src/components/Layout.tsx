import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, Database, FileText, LifeBuoy } from 'lucide-react';

export default function Layout() {
    const token = localStorage.getItem('token');
    const location = useLocation();

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/jobs', label: 'Backup Plans', icon: Database },
        { path: '/logs', label: 'Logs & Results', icon: FileText },
        {
            path: '/help',
            label: 'Hilfe & Erklärung',
            icon: LifeBuoy,
            subItems: [
                { id: 'rule-321', label: 'Die 3-2-1 Regel' },
                { id: 'backup-types', label: 'Backup-Arten' },
                { id: 'faq', label: 'Häufige Fragen (FAQ)' },
                { id: 'urbackup', label: 'Notebooks (UrBackup)' }
            ]
        },
        { path: 'urbackup', label: 'Notebooks (UrBackup)', icon: Database, isExternal: true },
    ];

    return (
        <div className="flex h-screen bg-gray-50/50 selection:bg-blue-100">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between text-slate-300 transition-all duration-300 shrink-0">
                <div>
                    {/* Brand/Logo */}
                    <div className="h-20 flex items-center px-6 border-b border-slate-800 bg-slate-950/30">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Database className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-bold text-lg tracking-tight text-white">
                                WAMOCON
                                <span className="block text-xs text-blue-400 font-medium tracking-wide">Backup Planner</span>
                            </span>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="p-4 space-y-1 mt-4">
                        {navItems.map((item) => {
                            const isActive = !item.isExternal && location.pathname.startsWith(item.path);

                            if (item.isExternal) {
                                // Externer Link (UrBackup Dashboard)
                                // Assuming standard default port for UrBackup on the same host
                                const urBackupUrl = window.location.protocol + "//" + window.location.hostname + ":55414";
                                return (
                                    <a
                                        key={item.path}
                                        href={urBackupUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden hover:bg-indigo-900/40 hover:text-indigo-300 text-slate-400 mt-4 border border-slate-800/50"
                                        title="Öffnet das lokale UrBackup Dashboard"
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className="h-5 w-5 text-indigo-400/70 group-hover:text-indigo-400 transition-colors" />
                                            <span className="font-medium">{item.label}</span>
                                        </div>
                                        <svg className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                                    </a>
                                );
                            }

                            return (
                                <div key={item.path}>
                                    <Link
                                        to={item.path}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${isActive
                                            ? 'bg-blue-600/10 text-blue-400 font-medium'
                                            : 'hover:bg-slate-800/50 hover:text-white'
                                            }`}
                                    >
                                        {isActive && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-full" />
                                        )}
                                        <item.icon className={`h-5 w-5 transition-colors ${isActive ? 'text-blue-500' : 'text-slate-500 group-hover:text-slate-300'}`} />
                                        {item.label}
                                    </Link>

                                    {/* Render Subitems if parent is active */}
                                    {isActive && item.subItems && (
                                        <div className="ml-6 mt-1 mb-2 space-y-1 relative pl-5 border-l border-slate-800/50">
                                            {item.subItems.map(sub => (
                                                <a
                                                    key={sub.id}
                                                    href={`#${sub.id}`}
                                                    className="block py-1.5 text-sm text-slate-500 hover:text-blue-400 transition-colors relative"
                                                >
                                                    <span className="absolute -left-5 top-1/2 -mt-px w-3 h-px bg-slate-800/50"></span>
                                                    {sub.label}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>
                </div>

                {/* User / Logout */}
                <div className="p-4 border-t border-slate-800 bg-slate-950/20">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        Sign out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto w-full relative">
                <div className="absolute top-0 left-0 right-0 h-64 bg-slate-900 -z-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

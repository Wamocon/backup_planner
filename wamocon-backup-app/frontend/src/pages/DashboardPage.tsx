import { useEffect, useState } from 'react';
import client from '../api/client';
import Timeline from '../components/Timeline';
import JobCard from '../components/JobCard';
import JobModal from '../components/JobModal';
import { useAuthStore } from '../store/auth.store';
import { CheckCircle, XCircle, Loader2, Plus, ArrowRight, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardData {
    jobs_count: number;
    last_runs: any[];
    upcoming: any[];
    health: { status: string; version?: string; error?: string };
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);

    const user = useAuthStore(state => state.user);
    const isAdmin = user?.role === 'admin';

    const fetchDashboard = async () => {
        try {
            const resp = await client.get('/dashboard');
            setData(resp.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    const handleRunJob = async (id: number) => {
        if (!confirm('Möchtest du dieses Backup wirklich jetzt manuell starten?')) return;
        try {
            await client.post(`/jobs/${id}/run`);
            alert('Backup-Job erfolgreich manuell in die Warteschlange gestellt.');
            // Refresh to snag the new "running" execution log locally
            setTimeout(fetchDashboard, 1000);
        } catch (e) {
            alert('Starten des Jobs fehlgeschlagen.');
        }
    };

    const handleEditJob = () => {
        // Navigation hint for users trying to edit on dashboard
        alert("Um Jobs zu bearbeiten oder zu löschen, wechsle bitte in den Tab 'Backup Plans'.");
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full min-h-[400px]"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>;
    }

    if (error) {
        return <div className="text-red-500 p-6 bg-red-50 rounded-2xl border border-red-100 font-medium flex items-center shadow-sm"><XCircle className="w-6 h-6 mr-3" /> {error}</div>;
    }

    const isRunning = data?.last_runs?.some(r => r.status === 'running');

    // Simple hardcoded 3-2-1 check recommendation 
    const destinations = data?.upcoming?.map(j => j.destination) || [];
    const hasCloud = destinations.some(d => d.includes('drive'));
    const hasLocal = destinations.some(d => d.includes('nas'));
    const meets321 = hasCloud && hasLocal;


    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">

            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">Willkommen zurück, {user?.username}</h1>
                    <p className="text-slate-500 mt-2 text-lg">System Dashboard & Laufzeitüberwachung</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5"
                    >
                        <Plus className="w-5 h-5" /> Neuen Plan erstellen
                    </button>
                )}
            </div>

            {isRunning && (
                <div className="bg-indigo-50/50 backdrop-blur border border-indigo-200 p-5 rounded-2xl flex items-center shadow-lg shadow-indigo-500/5">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mr-4 shrink-0">
                        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                    </div>
                    <div>
                        <h3 className="text-indigo-900 font-bold text-lg">Backups werden gerade ausgeführt</h3>
                        <p className="text-indigo-700/80">Im Hintergrund laufen aktuell rclone Synchronisationen. Lade das Dashboard neu für den aktuellen Status.</p>
                    </div>
                </div>
            )}

            {/* Recommended Actions Alert (3-2-1 Rule logic MVP) */}
            {!meets321 && data && data.upcoming.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 p-5 rounded-2xl flex items-start">
                    <ShieldAlert className="w-6 h-6 text-orange-500 mr-4 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-orange-900 font-bold">Empfehlung: 3-2-1 Backup Regel</h3>
                        <p className="text-orange-800 mt-1 max-w-3xl">Es scheint, als würdest du deine Backups nicht lokal und in der Cloud (Offsite) separat aufteilen. Es wird dringend empfohlen sowohl ein NAS-Ziel als auch ein Cloud-Ziel in deinen Jobs einzuplanen, um optimal vor Ransomware geschützt zu sein.</p>
                    </div>
                </div>
            )}

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <CheckCircle className="w-24 h-24 text-slate-900" />
                    </div>
                    <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-2 z-10">Konfigurierte Pläne</h3>
                    <p className="text-5xl font-black text-slate-800 tracking-tight z-10">{data?.jobs_count || 0}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                    <div>
                        <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-2">Service Status (rclone)</h3>
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                {data?.health?.status === 'ok' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                                <span className={`relative inline-flex rounded-full h-3 w-3 ${data?.health?.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            </span>
                            <p className="text-2xl font-bold text-slate-800 capitalize">{data?.health?.status}</p>
                        </div>
                        {data?.health?.version && <p className="text-xs text-slate-400 mt-1">v{data.health.version}</p>}
                    </div>
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${data?.health?.status === 'ok' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
                        <CheckCircle className="w-8 h-8" />
                    </div>
                </div>

                <div className="col-span-1 md:col-span-1 border rounded-2xl overflow-hidden bg-white shadow-sm border-slate-200">
                    <Timeline recentRuns={data?.last_runs || []} />
                </div>
            </div>

            {/* Upcoming / Active Jobs Panel */}
            <div>
                <div className="flex justify-between items-end mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">Aktive Backup Pläne</h2>
                    <Link to="/jobs" className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center transition-colors">
                        Alle verwalten <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                </div>

                {data?.upcoming && data.upcoming.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {data.upcoming.map(job => (
                            <JobCard
                                key={job.id}
                                job={job}
                                isAdmin={isAdmin}
                                onRun={handleRunJob}
                                onEdit={handleEditJob}
                                onDelete={handleEditJob}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-12 text-center text-slate-500">
                        Es wurden noch keine Backup-Jobs angelegt. Nutze den Button oben, um den ersten Plan zu konfigurieren.
                    </div>
                )}
            </div>

            <JobModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaveSuccess={fetchDashboard}
            />
        </div>
    );
}

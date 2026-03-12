import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuthStore } from '../store/auth.store';
import { Plus, Edit, Trash2, Play, Loader2, Database } from 'lucide-react';
import JobModal from '../components/JobModal';

interface Job {
    id: number;
    name: string;
    source: string;
    destination: string;
    backup_type: string;
    schedule: string;
    retention_days: number;
    is_active: number;
}

export default function JobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingJob, setEditingJob] = useState<Job | null>(null);

    const user = useAuthStore(state => state.user);
    const isAdmin = user?.role === 'admin';

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const { data } = await client.get('/jobs');
            setJobs(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchJobs(); }, []);

    const handleOpenNew = () => {
        setEditingJob(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (job: Job) => {
        setEditingJob(job);
        setIsModalOpen(true);
    };

    const handleDelete = async (job: Job) => {
        if (job.backup_type === 'gobd') {
            alert('GoBD-konforme Backup-Pläne können aus Compliance-Gründen nicht gelöscht werden. Der Plan kann nur deaktiviert werden.');
            return;
        }
        if (!confirm('Diesen Backup-Plan wirklich löschen? Historische Läufe bleiben in der DB erhalten.')) return;
        try {
            await client.delete(`/jobs/${job.id}`);
            fetchJobs();
        } catch (e: any) {
            alert(e?.response?.data?.error || 'Löschen fehlgeschlagen.');
        }
    };

    const handleRun = async (id: number) => {
        if (!confirm('Diesen Backup-Job jetzt manuell außerhalb des Zeitplans starten?')) return;
        try {
            await client.post(`/jobs/${id}/run`);
            alert('Job erfolgreich gestartet. Du kannst den Lauf im Dashboard oder den Logs verfolgen.');
        } catch (e) {
            alert('Start fehlgeschlagen.');
        }
    };

    return (
        <div className="animate-in fade-in duration-500">
            <div className="sm:flex sm:items-center sm:justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Backup Plans (Jobs)</h1>
                    <p className="mt-2 text-slate-500 max-w-2xl">Verwalte hier alle Synchronisationen, rclone Quelle/Ziel Verbindungen und die zeitlichen Ausführungsintervalle der Backups.</p>
                </div>
                {isAdmin && (
                    <div className="mt-4 sm:mt-0">
                        <button
                            onClick={handleOpenNew}
                            className="inline-flex items-center gap-2 px-6 py-3 border border-transparent rounded-xl shadow-lg shadow-blue-500/20 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5 transition-all"
                        >
                            <Plus className="-ml-1 h-5 w-5" />
                            Neuen Plan erstellen
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white shadow-sm overflow-hidden sm:rounded-2xl border border-slate-200">
                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>
                ) : (
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50/80 backdrop-blur-sm">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan & Typ</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Verbindung (Quelle → Ziel)</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Erweiterte Settings</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                {isAdmin && <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Aktionen</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {jobs.map((job) => (
                                <tr key={job.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                                <Database className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-900">{job.name}</div>
                                                <div className={`text-xs font-medium uppercase tracking-wide mt-1 ${job.backup_type === 'gobd' ? 'text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full w-fit' : 'text-slate-500'}`}>{job.backup_type === 'gobd' ? 'GoBD' : job.backup_type}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-sm text-slate-900 font-medium font-mono text-xs bg-slate-100 px-2 py-1 rounded w-max mb-1.5" title="Quelle">
                                            {job.source}
                                        </div>
                                        <div className="text-sm text-slate-500 truncate max-w-[200px] font-mono text-xs" title="Ziel">
                                            {job.destination}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="text-sm text-slate-700">Cron: <code className="font-semibold text-indigo-600">{job.schedule}</code></div>
                                        <div className="text-xs text-slate-500 mt-1">Retention: {job.retention_days} Tage</div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${job.is_active ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                            {job.is_active ? 'Aktiviert' : 'Pausiert'}
                                        </span>
                                    </td>
                                    {isAdmin && (
                                        <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleRun(job.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200" title="Jetzt ausführen">
                                                    <Play className="w-4 h-4" /> Start
                                                </button>
                                                <button onClick={() => handleOpenEdit(job)} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors" title="Bearbeiten">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(job)} disabled={job.backup_type === 'gobd'} className={`p-2 rounded-lg transition-colors ${job.backup_type === 'gobd' ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`} title={job.backup_type === 'gobd' ? 'GoBD-Pläne können nicht gelöscht werden' : 'Löschen'}>
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {jobs.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={isAdmin ? 5 : 4} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <Database className="w-12 h-12 text-slate-300" />
                                            <p className="font-medium">Noch keine Backup-Pläne angelegt.</p>
                                            <p className="text-sm border border-slate-200 rounded-lg px-4 py-2 mt-2 bg-slate-50">Nutze den blauen Button oben rechts, um zu starten.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <JobModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                jobToEdit={editingJob}
                onSaveSuccess={fetchJobs}
            />
        </div>
    );
}

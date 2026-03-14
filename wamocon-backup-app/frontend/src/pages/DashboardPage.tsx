import { useEffect, useState, useRef } from 'react';
import client from '../api/client';
import Timeline from '../components/Timeline';
import JobCard from '../components/JobCard';
import JobModal from '../components/JobModal';
import { useAuthStore } from '../store/auth.store';
import { useToastStore } from '../store/toast.store';
import ConfirmModal from '../components/ConfirmModal';
import { CheckCircle, XCircle, Loader2, Plus, ArrowRight, ShieldAlert, Server, HardDrive, RefreshCw, WifiOff, Play, Wifi, Cloud, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

interface MacStudioJobStatus {
    running: boolean;
    active: boolean;
    pid: number | null;
    logLastModified: string | null;
}

interface MacStudioLatestBackup {
    date: string;
    status: string;
    duration: string | null;
    errorCount: string | null;
    startTime: string | null;
    endTime: string | null;
    filesAfter?: string;
    sizeAfter?: string;
}

interface MacStudioStatus {
    running: {
        orchestrator: { running: boolean; pid: number | null };
        gdrive: MacStudioJobStatus;
        nas: MacStudioJobStatus;
        anyRunning: boolean;
        checkedAt: string;
    };
    latestBackup: {
        gdrive: MacStudioLatestBackup;
        nas: MacStudioLatestBackup;
    };
}

interface UrBackupSummary {
    clients_total: number;
    clients_online: number;
    clients_file_ok: number;
    clients_image_ok: number;
    recent_backups: { client_name: string; backup_type: string; backup_time: string; status: string }[];
    sync: { last_sync_at: string | null; last_sync_error: string | null; schedule: string };
}

interface LiveActivity {
    clientid: number;
    name: string;
    action: string;
    percent_done: number;
    eta_ms: number;
    paused: boolean;
}

interface LiveStatus {
    id: number;
    name: string;
    online: boolean;
    status: number;
}

interface UrbClient {
    id: number;
    name: string;
    online: boolean;
    file_ok: number;
    image_ok: number;
    file_disabled: number;
    image_disabled: number;
    last_file_backup: string | null;
    last_image_backup: string | null;
}

interface DashboardData {
    jobs_count: number;
    last_runs: any[];
    upcoming: any[];
    health: { status: string; version?: string; error?: string };
    urbackup: UrBackupSummary;
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [syncing, setSyncing] = useState(false);
    const [urbClients, setUrbClients] = useState<UrbClient[]>([]);
    const [startingBackup, setStartingBackup] = useState<string | null>(null);
    const [liveData, setLiveData] = useState<{ status: LiveStatus[]; activities: { current: LiveActivity[]; last: any[] } } | null>(null);
    const liveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [macStudioData, setMacStudioData] = useState<MacStudioStatus | null>(null);
    const [macStudioError, setMacStudioError] = useState(false);
    const [triggeringBackup, setTriggeringBackup] = useState<string | null>(null);
    const macStudioIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);

    const user = useAuthStore(state => state.user);
    const isAdmin = user?.role === 'admin';
    const addToast = useToastStore(s => s.addToast);
    const [dialog, setDialog] = useState<{
        open: boolean; title: string; message: string; variant: 'danger' | 'primary'; onConfirm: () => void;
    }>({ open: false, title: '', message: '', variant: 'primary', onConfirm: () => {} });
    const closeDialog = () => setDialog(d => ({ ...d, open: false }));

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

    const fetchUrbClients = async () => {
        try {
            const resp = await client.get('/urbackup/clients');
            setUrbClients(resp.data.clients || []);
        } catch {
            // silently ignore — optional widget
        }
    };

    const handleManualSync = async () => {
        setSyncing(true);
        try {
            await client.post('/urbackup/sync');
            setTimeout(() => { fetchDashboard(); fetchUrbClients(); setSyncing(false); }, 3000);
        } catch {
            setSyncing(false);
        }
    };

    const handleStartBackup = async (clientId: number, backupType: string) => {
        const key = `${clientId}-${backupType}`;
        setStartingBackup(key);
        try {
            const resp = await client.post('/urbackup/start', { clientId, backupType });
            if (resp.data.success) {
                addToast(`Backup gestartet (${backupType.replace('_', ' ')}).`, 'success');
            } else {
                addToast('Backup konnte nicht gestartet werden – Client offline?', 'error');
            }
        } catch (e: any) {
            addToast(e.response?.data?.details || 'Backup-Start fehlgeschlagen.', 'error');
        } finally {
            setStartingBackup(null);
        }
    };

    const fetchMacStudio = async () => {
        try {
            const resp = await client.get('/macstudio/status');
            setMacStudioData(resp.data);
            setMacStudioError(false);
        } catch {
            setMacStudioError(true);
        }
    };

    const handleTriggerBackup = (target: 'gdrive' | 'nas' | 'all') => {
        const label = target === 'all' ? 'Alle Backups' : target === 'gdrive' ? 'Google Drive' : 'NAS';
        setDialog({
            open: true,
            title: 'MacStudio Backup starten',
            message: `"${label}" Backup jetzt manuell starten?`,
            variant: 'primary',
            onConfirm: async () => {
                setTriggeringBackup(target);
                try {
                    await client.post('/macstudio/trigger', { target });
                    addToast(`${label} Backup wurde angestossen.`, 'success');
                    setTimeout(fetchMacStudio, 3000);
                } catch (e: any) {
                    addToast(e.response?.data?.details || 'Trigger fehlgeschlagen.', 'error');
                } finally {
                    setTriggeringBackup(null);
                }
            }
        });
    };

    const fetchLiveData = async () => {
        try {
            const resp = await client.get('/urbackup/live');
            setLiveData(resp.data);
        } catch {
            // silently ignore
        }
    };

    useEffect(() => {
        fetchDashboard();
        fetchUrbClients();
        fetchLiveData();
        fetchMacStudio();
        liveIntervalRef.current = setInterval(fetchLiveData, 10000);
        macStudioIntervalRef.current = setInterval(fetchMacStudio, 30000);
        return () => {
            if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
            if (macStudioIntervalRef.current) clearInterval(macStudioIntervalRef.current);
        };
    }, []);

    const handleRunJob = (id: number) => {
        const job = data?.upcoming?.find((j: any) => j.id === id);
        setDialog({
            open: true,
            title: 'Backup jetzt starten',
            message: `"${job?.name || 'Backup'}" jetzt manuell außerhalb des Zeitplans starten?`,
            variant: 'primary',
            onConfirm: async () => {
                try {
                    await client.post(`/jobs/${id}/run`);
                    addToast('Backup-Job erfolgreich in die Warteschlange gestellt.', 'success');
                    setTimeout(fetchDashboard, 1000);
                } catch {
                    addToast('Starten des Jobs fehlgeschlagen.', 'error');
                }
            }
        });
    };

    const handleEditJob = () => {
        addToast("Um Jobs zu bearbeiten, wechsle bitte zu 'Backup-Pläne'.", 'info');
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full min-h-[400px]"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>;
    }

    if (error) {
        return <div className="text-red-500 p-6 bg-red-50 rounded-2xl border border-red-100 font-medium flex items-center shadow-sm"><XCircle className="w-6 h-6 mr-3" /> {error}</div>;
    }

    const isRunning = data?.last_runs?.some(r => r.status === 'running');

    // Simple hardcoded 3-2-1 check recommendation 
    const destinations = data?.upcoming?.map(j => j?.destination) || [];
    const hasCloud = destinations.some(d => d?.includes('drive'));
    const hasLocal = destinations.some(d => d?.includes('nas'));
    const meets321 = hasCloud && hasLocal;

    const urbackup = data?.urbackup;
    const hasUrBackupData = urbackup && urbackup.clients_total > 0;

    const formatRelative = (iso: string | null) => {
        if (!iso) return 'Nie';
        try { return formatDistanceToNow(parseISO(iso), { addSuffix: true, locale: de }); }
        catch { return iso; }
    };

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
                    <div className="flex-1">
                        <h3 className="text-indigo-900 font-bold text-lg">Backups werden gerade ausgeführt</h3>
                        <div className="flex items-center gap-3 flex-wrap mt-1">
                            <p className="text-indigo-700/80">Im Hintergrund laufen aktuell rclone Synchronisationen.</p>
                            <button
                                onClick={fetchDashboard}
                                className="flex items-center gap-1.5 text-sm font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-100 hover:bg-indigo-200 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                <RefreshCw className="w-3.5 h-3.5" /> Aktualisieren
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Recommended Actions Alert (3-2-1 Rule logic MVP) */}
            {!meets321 && data && data.upcoming.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 p-5 rounded-2xl flex items-start">
                    <ShieldAlert className="w-6 h-6 text-orange-500 mr-4 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-orange-900 font-bold">Empfehlung: 3-2-1 Backup Regel</h3>
                        <p className="text-orange-800 mt-1">Deine Backup-Ziele erfüllen noch nicht die 3-2-1-Regel. Richte sowohl ein lokales (NAS) als auch ein Cloud-Ziel ein.</p>
                        <Link to="/help#rule-321" className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-orange-700 hover:text-orange-900 underline underline-offset-2">
                            Mehr erfahren <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
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
                    <div className="flex gap-2 mt-3 z-10">
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            {data?.upcoming?.length || 0} aktiv
                        </span>
                        {((data?.jobs_count || 0) - (data?.upcoming?.length || 0)) > 0 && (
                            <span className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                                {(data?.jobs_count || 0) - (data?.upcoming?.length || 0)} pausiert
                            </span>
                        )}
                    </div>
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

            {/* Live URBackup Status + aktive Backups */}
            {liveData && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            Live – URBackup Status
                        </h2>
                        <span className="text-xs text-slate-400">Aktualisiert alle 10 Sek.</span>
                    </div>

                    {/* Aktive Backups mit Fortschritt */}
                    {liveData.activities.current.length > 0 ? (
                        <div className="divide-y divide-slate-50">
                            {liveData.activities.current.map((act, i) => {
                                const pct = Math.round(act.percent_done ?? 0);
                                const etaSec = act.eta_ms > 0 ? Math.round(act.eta_ms / 1000) : null;
                                const etaLabel = etaSec != null
                                    ? etaSec < 60 ? `${etaSec}s` : etaSec < 3600 ? `${Math.round(etaSec/60)}min` : `${(etaSec/3600).toFixed(1)}h`
                                    : '–';
                                return (
                                    <div key={i} className="px-6 py-4">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                                                <span className="font-semibold text-slate-800 text-sm">{act.name}</span>
                                                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{act.action}</span>
                                                {act.paused && <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Pausiert</span>}
                                            </div>
                                            <div className="flex items-center gap-3 text-sm">
                                                <span className="font-bold text-slate-800">{pct}%</span>
                                                <span className="text-slate-400 text-xs">ETA: {etaLabel}</span>
                                            </div>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-blue-400 transition-all duration-500"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="px-6 py-3 flex flex-wrap gap-4">
                            {liveData.status.length === 0 ? (
                                <p className="text-sm text-slate-400 italic">Keine Clients gefunden</p>
                            ) : liveData.status.map((s) => (
                                <div key={s.id} className="flex items-center gap-2 text-sm">
                                    <Wifi className={`w-4 h-4 ${s.online ? 'text-emerald-500' : 'text-slate-300'}`} />
                                    <span className={`font-medium ${s.online ? 'text-slate-800' : 'text-slate-400'}`}>{s.name}</span>
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${s.online ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {s.online ? 'Online' : 'Offline'}
                                    </span>
                                </div>
                            ))}
                            <span className="text-xs text-slate-400 ml-auto italic self-center">Kein aktives Backup</span>
                        </div>
                    )}
                </div>
            )}

            {/* MacStudio rclone Widget */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center">
                                <Cloud className="w-5 h-5" />
                            </span>
                            Cloud-Backups (MacStudio · rclone)
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">OneDrive → Google Drive &amp; Synology NAS · Aktualisiert alle 30 Sek.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {macStudioError && (
                            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                                <WifiOff className="w-3.5 h-3.5" /> MacStudio nicht erreichbar
                            </span>
                        )}
                        {isAdmin && !macStudioError && (
                            <button
                                onClick={() => handleTriggerBackup('all')}
                                disabled={triggeringBackup !== null || macStudioData?.running?.anyRunning}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-600 border border-teal-200 rounded-lg hover:bg-teal-50 disabled:opacity-50 transition-colors"
                            >
                                {triggeringBackup === 'all' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                                Alle starten
                            </button>
                        )}
                    </div>
                </div>

                {macStudioError ? (
                    <div className="p-8 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                        <Cloud className="w-10 h-10 opacity-20" />
                        <p>MacStudio Dashboard nicht erreichbar. Prüfe die Verbindung zu <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">192.168.178.62:9090</code>.</p>
                    </div>
                ) : !macStudioData ? (
                    <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-teal-500" /></div>
                ) : (
                    <div>
                        {macStudioData.running.anyRunning && (
                            <div className="mx-6 mt-4 bg-teal-50 border border-teal-200 rounded-xl p-3 flex items-center gap-2 text-sm text-teal-800">
                                <Loader2 className="w-4 h-4 animate-spin text-teal-500 shrink-0" />
                                <span>Backup läuft gerade auf dem MacStudio…</span>
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                            {([
                                { key: 'gdrive' as const, label: 'Google Drive', icon: Cloud, color: 'blue' },
                                { key: 'nas' as const, label: 'Synology NAS', icon: Database, color: 'purple' },
                            ]).map(({ key, label, icon: Icon, color }) => {
                                const running = macStudioData.running[key];
                                const latest = macStudioData.latestBackup[key];
                                const isOk = latest?.status?.startsWith('SUCCESS');
                                return (
                                    <div key={key} className="p-6 flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-7 h-7 rounded-lg bg-${color}-50 text-${color}-600 flex items-center justify-center`}>
                                                    <Icon className="w-4 h-4" />
                                                </span>
                                                <span className="font-semibold text-slate-800 text-sm">{label}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {running?.running ? (
                                                    <span className="flex items-center gap-1 text-xs text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full font-medium">
                                                        <Loader2 className="w-3 h-3 animate-spin" /> Läuft
                                                    </span>
                                                ) : (
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${isOk ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                        {latest?.status || '–'}
                                                    </span>
                                                )}
                                                {isAdmin && (
                                                    <button
                                                        onClick={() => handleTriggerBackup(key)}
                                                        disabled={triggeringBackup !== null || macStudioData.running.anyRunning}
                                                        title={`${label} Backup jetzt starten`}
                                                        className="p-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                                                    >
                                                        {triggeringBackup === key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {latest && (
                                            <div className="text-xs text-slate-500 space-y-1">
                                                <div className="flex justify-between"><span>Letztes Backup</span><span className="font-medium text-slate-700">{latest.date}</span></div>
                                                {latest.duration && <div className="flex justify-between"><span>Dauer</span><span className="font-medium text-slate-700">{latest.duration}</span></div>}
                                                {latest.errorCount && <div className="flex justify-between"><span>Fehler</span><span className={`font-medium ${latest.errorCount === '0' ? 'text-emerald-600' : 'text-red-600'}`}>{latest.errorCount}</span></div>}
                                                {latest.sizeAfter && <div className="flex justify-between"><span>Größe</span><span className="font-medium text-slate-700">{latest.sizeAfter}</span></div>}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* UrBackup Widget – kompakt */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
                <div className="px-6 py-4 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-3 shrink-0">
                        <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                            <Server className="w-5 h-5" />
                        </span>
                        <div>
                            <p className="font-bold text-slate-800 text-sm leading-tight">Endgerät-Backups (UrBackup)</p>
                            <p className="text-xs text-slate-400">Sync: {formatRelative(urbackup?.sync?.last_sync_at ?? null)}</p>
                        </div>
                    </div>

                    {hasUrBackupData && (
                        <div className="flex gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${urbackup.clients_online > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                <Wifi className="w-3 h-3" /> {urbackup.clients_online}/{urbackup.clients_total} online
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${urbackup.clients_file_ok === urbackup.clients_total ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                <HardDrive className="w-3 h-3" /> File {urbackup.clients_file_ok}/{urbackup.clients_total}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${urbackup.clients_image_ok === urbackup.clients_total ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                <Server className="w-3 h-3" /> Image {urbackup.clients_image_ok}/{urbackup.clients_total}
                            </span>
                        </div>
                    )}

                    <div className="flex items-center gap-2 ml-auto flex-wrap">
                        {urbackup?.sync?.last_sync_error && (
                            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg flex items-center gap-1">
                                <WifiOff className="w-3 h-3" /> Nicht erreichbar
                            </span>
                        )}
                        {isAdmin && (
                            <button
                                onClick={handleManualSync}
                                disabled={syncing}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 disabled:opacity-50 transition-colors"
                            >
                                <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
                                {syncing ? 'Sync...' : 'Sync'}
                            </button>
                        )}
                        <Link to="/devices" className="text-xs text-slate-500 hover:text-indigo-600 font-medium flex items-center gap-1">
                            Alle Geräte <ArrowRight className="w-3 h-3" />
                        </Link>
                        <Link to="/logs?tab=urbackup" className="text-xs text-slate-500 hover:text-indigo-600 font-medium flex items-center gap-1">
                            Logs <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
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
            <ConfirmModal
                isOpen={dialog.open}
                title={dialog.title}
                message={dialog.message}
                variant={dialog.variant}
                onConfirm={dialog.onConfirm}
                onCancel={closeDialog}
            />
        </div>
    );
}

import { useEffect, useState } from 'react';
import client from '../api/client';
import { FileText, Loader2, AlertCircle, CalendarClock, Database } from 'lucide-react';
import { format } from 'date-fns';

interface Run {
    id: number;
    job_id: number;
    job_name: string;
    started_at: string;
    status: string;
    error_message: string;
}

export default function LogsPage() {
    const [runs, setRuns] = useState<Run[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRun, setSelectedRun] = useState<Run | null>(null);
    const [logContent, setLogContent] = useState<string>('');
    const [loadingLog, setLoadingLog] = useState(false);

    useEffect(() => {
        const fetchRuns = async () => {
            try {
                const { data } = await client.get('/runs/recent?days=30');
                setRuns(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchRuns();
    }, []);

    const handleSelectRun = async (run: Run) => {
        setSelectedRun(run);
        setLoadingLog(true);
        try {
            const { data } = await client.get(`/runs/${run.id}/log`);
            setLogContent(data.content);
        } catch (e) {
            setLogContent('Logfile konnte nicht geladen werden oder ist leer.');
        } finally {
            setLoadingLog(false);
        }
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col animate-in fade-in duration-500">

            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Logs & Ergebnisse</h1>
                <p className="mt-2 text-slate-500 max-w-2xl">Hier findest du die direkte rclone Konsolenausgabe (STDOUT/STDERR) historischer Backup-Läufe für Fehleranalysen und Audits.</p>
            </div>

            <div className="flex flex-1 gap-6 min-h-0 bg-white p-2 rounded-3xl shadow-sm border border-slate-200">

                {/* Sidebar history */}
                <div className="w-1/3 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-white shadow-sm z-10">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2">
                            <CalendarClock className="w-5 h-5 text-indigo-500" />
                            Letzte Ausführungen
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3">
                        {loading ? (
                            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
                        ) : (
                            <ul className="space-y-2">
                                {runs.map(run => (
                                    <li key={run.id}>
                                        <button
                                            onClick={() => handleSelectRun(run)}
                                            className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex flex-col gap-2
                        ${selectedRun?.id === run.id
                                                    ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                                                    : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start w-full gap-2">
                                                <div className="truncate flex-1">
                                                    <span className="font-bold text-sm text-slate-800 block truncate leading-tight flex items-center gap-1.5">
                                                        <Database className="w-3.5 h-3.5 text-slate-400" />
                                                        {run.job_name || `Job #${run.job_id}`}
                                                    </span>
                                                </div>
                                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide shrink-0 ${run.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                                                        run.status === 'failed' ? 'bg-rose-100 text-rose-700' :
                                                            run.status === 'running' ? 'bg-blue-100 text-blue-700 animate-pulse' :
                                                                'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {run.status}
                                                </span>
                                            </div>
                                            <span className="text-xs text-slate-500 font-medium">{format(new Date(run.started_at), 'dd.MM.yyyy HH:mm:ss')}</span>
                                        </button>
                                    </li>
                                ))}
                                {runs.length === 0 && <li className="p-8 text-center text-sm text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">Keine Historie gefunden.</li>}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Log View Content */}
                <div className="flex-1 bg-slate-950 rounded-2xl flex flex-col overflow-hidden relative shadow-inner">
                    {selectedRun ? (
                        <>
                            {/* Terminal Header */}
                            <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center text-slate-300">
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-rose-500/50"></div>
                                        <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
                                        <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
                                    </div>
                                    <FileText className="w-4 h-4 ml-2 text-slate-500" />
                                    <span className="font-mono text-sm tracking-wide">run_{selectedRun.id}.log</span>
                                </div>
                                {selectedRun.status === 'failed' && selectedRun.error_message && (
                                    <div className="flex items-center gap-2 text-rose-400 bg-rose-950/50 px-3 py-1.5 rounded-lg border border-rose-900/50">
                                        <AlertCircle className="w-4 h-4" />
                                        <span className="text-xs font-medium truncate max-w-[200px] sm:max-w-[400px]">{selectedRun.error_message}</span>
                                    </div>
                                )}
                            </div>

                            {/* Terminal Output */}
                            <div className="flex-1 p-6 overflow-y-auto font-mono text-[13px] text-emerald-400 leading-relaxed whitespace-pre-wrap selection:bg-emerald-900 selection:text-emerald-100 relative">
                                {loadingLog ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-emerald-600/50 gap-4">
                                        <Loader2 className="w-8 h-8 animate-spin" />
                                        <p className="animate-pulse">Fetching stdout chunk...</p>
                                    </div>
                                ) : (
                                    logContent ? logContent : <span className="text-slate-600 italic">Keine Konsolenausgabe vorhanden. (Rclone loggt möglicherweise nur Fehler)</span>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-4">
                            <FileText className="w-16 h-16 opacity-20" />
                            <p className="font-medium">Wähle links eine Ausführung aus, um die Logs zu betrachten.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

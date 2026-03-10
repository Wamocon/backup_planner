import { format, subDays, isSameDay } from 'date-fns';

interface Run {
    id: number;
    job_id: number;
    job_name: string;
    started_at: string;
    status: 'running' | 'success' | 'failed' | 'stopped';
}

interface TimelineProps {
    recentRuns: Run[];
}

export default function Timeline({ recentRuns }: TimelineProps) {
    // Generate last 7 days
    const today = new Date();
    const days = Array.from({ length: 7 }).map((_, i) => subDays(today, 6 - i));

    const getDayStatus = (date: Date) => {
        const runsForDay = recentRuns.filter(r => isSameDay(new Date(r.started_at), date));
        if (runsForDay.length === 0) return 'unknown';
        if (runsForDay.some(r => r.status === 'failed')) return 'failed';
        if (runsForDay.some(r => r.status === 'running')) return 'running';
        return 'success';
    };

    const statusConfig: Record<string, { color: string, glow: string }> = {
        running: { color: 'bg-blue-500', glow: 'shadow-blue-500/40 ring-2 ring-blue-500/50' },
        success: { color: 'bg-emerald-500', glow: 'shadow-emerald-500/40' },
        failed: { color: 'bg-rose-500', glow: 'shadow-rose-500/40' },
        stopped: { color: 'bg-amber-500', glow: 'shadow-amber-500/40' },
        unknown: { color: 'bg-slate-200', glow: '' }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col justify-center">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6 flex items-center justify-between">
                7-Tage Verlauf
                <span className="text-xs font-medium normal-case bg-slate-100 text-slate-600 px-2 py-1 rounded-md">Letzte Woche</span>
            </h3>

            <div className="flex justify-between items-end gap-2 w-full">
                {days.map((day, idx) => {
                    const status = getDayStatus(day);
                    const config = statusConfig[status];
                    return (
                        <div key={idx} className="flex flex-col items-center gap-3 flex-1 group relative">

                            {/* Tooltip on hover */}
                            <div className="absolute bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none z-10 shadow-xl">
                                {format(day, 'dd. MMM')}: <span className="capitalize">{status === 'unknown' ? 'Keine Läufe' : status}</span>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
                            </div>

                            <div
                                className={`w-full max-w-[2.5rem] aspect-square rounded-xl flex items-center justify-center transition-all duration-300 shadow-md ${config.color} ${config.glow} hover:-translate-y-1 hover:scale-110 cursor-help relative overflow-hidden`}
                            >
                                {/* Internal shine effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{format(day, 'Eee')}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

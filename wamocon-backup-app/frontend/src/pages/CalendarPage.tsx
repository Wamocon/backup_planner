import { useState, useEffect, useMemo, useRef } from 'react';
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    startOfWeek, endOfWeek, isSameMonth, addDays, isToday,
    isTomorrow, differenceInDays, isSameDay, parseISO
} from 'date-fns';
import { de } from 'date-fns/locale';
import {
    Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, ShieldCheck,
    Clock, HardDrive, Info, Plus, X, CheckCircle2, XCircle, AlertCircle,
    Loader2, TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import client from '../api/client';
import JobModal from '../components/JobModal';
import { CronExpressionParser } from 'cron-parser';

// --- Farbkodierung nach Backup-Typ ---
const TYPE_COLORS: Record<string, { badge: string; dot: string; label: string }> = {
    full: {
        badge: 'bg-purple-50 text-purple-700 border-purple-100',
        dot: 'bg-purple-500',
        label: 'Full',
    },
    incremental: {
        badge: 'bg-blue-50 text-blue-700 border-blue-100',
        dot: 'bg-blue-500',
        label: 'Inkrementell',
    },
    differential: {
        badge: 'bg-orange-50 text-orange-700 border-orange-100',
        dot: 'bg-orange-500',
        label: 'Differenziell',
    },
    gobd: {
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        dot: 'bg-emerald-600',
        label: 'GoBD',
    },
};

const getTypeColors = (type: string) => TYPE_COLORS[type] ?? TYPE_COLORS.full;

// --- Status-Konfiguration für tatsächliche Runs ---
const RUN_STATUS_CONFIG: Record<string, { icon: any; color: string; dotColor: string; bg: string; label: string }> = {
    success: { icon: CheckCircle2, color: 'text-emerald-600', dotColor: 'bg-emerald-500', bg: 'bg-emerald-50 border-emerald-100', label: 'Erfolgreich' },
    failed:  { icon: XCircle,      color: 'text-red-600',     dotColor: 'bg-red-500',     bg: 'bg-red-50 border-red-100',         label: 'Fehlgeschlagen' },
    stopped: { icon: AlertCircle,  color: 'text-amber-600',   dotColor: 'bg-amber-400',   bg: 'bg-amber-50 border-amber-100',     label: 'Gestoppt' },
    running: { icon: Loader2,      color: 'text-blue-600',    dotColor: 'bg-blue-500',    bg: 'bg-blue-50 border-blue-100',       label: 'Läuft...' },
};

const getRunStatus = (status: string) => RUN_STATUS_CONFIG[status] ?? RUN_STATUS_CONFIG.failed;

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [jobs, setJobs] = useState<any[]>([]);
    const [runs, setRuns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showYearPicker, setShowYearPicker] = useState(false);

    const todayRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const user = useAuthStore(state => state.user);
    const isAdmin = user?.role === 'admin';

    // Kalender-Grenzen berechnen
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const resp = await client.get('/jobs');
            setJobs(resp.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRuns = async (from: Date) => {
        const daysAgo = Math.ceil(differenceInDays(new Date(), from));
        if (daysAgo <= 0) {
            setRuns([]);
            return;
        }
        try {
            // +7 Puffer damit die erste sichtbare Woche sicher abgedeckt ist
            const resp = await client.get(`/runs/recent?days=${daysAgo + 7}`);
            setRuns(resp.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    useEffect(() => {
        fetchRuns(startDate);
        setSelectedDay(null); // Auswahl zurücksetzen beim Monat-Wechsel
    }, [currentDate]); // eslint-disable-line react-hooks/exhaustive-deps

    // --- V1: Nächsten geplanten Job berechnen (direkt aus Jobs-Daten) ---
    const nextUpcomingJob = useMemo(() => {
        const withNextRun = jobs
            .filter(j => j.is_active && j.schedule)
            .map(job => {
                try {
                    const interval = CronExpressionParser.parse(job.schedule);
                    return { ...job, next_run: interval.next().toDate() };
                } catch {
                    return null;
                }
            })
            .filter(Boolean) as any[];

        return withNextRun.sort((a, b) => a.next_run.getTime() - b.next_run.getTime())[0] ?? null;
    }, [jobs]);

    // --- Monats-Statistiken (Option A) ---
    const monthStats = useMemo(() => {
        const monthRuns = runs.filter(r => {
            try { return isSameMonth(parseISO(r.started_at), currentDate); }
            catch { return false; }
        });
        const total = monthRuns.length;
        const success = monthRuns.filter(r => r.status === 'success').length;
        const failed = monthRuns.filter(r => r.status === 'failed').length;
        const rate = total > 0 ? Math.round((success / total) * 100) : null;
        return { total, success, failed, rate };
    }, [runs, currentDate]);

    // --- Heute-Navigation mit Scroll (Option C) ---
    const handleNavigateToday = () => {
        setCurrentDate(new Date());
        setTimeout(() => todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
    };

    // --- V1: Datum formatieren ---
    const formatNextRun = (date: Date): string => {
        if (isToday(date)) return `Heute · ${format(date, 'HH:mm')} Uhr`;
        if (isTomorrow(date)) return `Morgen · ${format(date, 'HH:mm')} Uhr`;
        return format(date, "EEEE, d. MMMM · HH:mm 'Uhr'", { locale: de });
    };

    // --- Hilfsfunktion: Geplante Jobs für einen Tag (Cron-Berechnung) ---
    const getPlannedJobsForDay = (day: Date): { name: string; time: string; type: string }[] => {
        const dayStart = new Date(day); dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);   dayEnd.setHours(23, 59, 59, 999);
        const dayJobs: { name: string; time: string; type: string }[] = [];

        jobs.forEach(job => {
            if (!job.is_active || !job.schedule) return;
            try {
                const interval = CronExpressionParser.parse(job.schedule, {
                    currentDate: new Date(dayStart.getTime() - 1000),
                    endDate: dayEnd,
                });
                while (true) {
                    try {
                        const obj = interval.next();
                        dayJobs.push({ name: job.name, time: format(obj.toDate(), 'HH:mm'), type: job.backup_type });
                    } catch { break; }
                }
            } catch { /* ungültige Cron-Expressions ignorieren */ }
        });

        return dayJobs.sort((a, b) => a.time.localeCompare(b.time));
    };

    // --- Hilfsfunktion: Tatsächliche Runs für einen Tag ---
    const getRunsForDay = (day: Date) =>
        runs.filter(r => {
            try { return isSameDay(parseISO(r.started_at), day); }
            catch { return false; }
        });

    // --- V4: Detail-Daten für ausgewählten Tag ---
    const selectedDayJobs = selectedDay ? getPlannedJobsForDay(selectedDay) : [];
    const selectedDayRuns = selectedDay ? getRunsForDay(selectedDay) : [];

    // --- Kalender-Grid aufbauen ---
    const rows = [];
    let days = [];
    let day = startDate;
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

    while (day <= endDate) {
        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(day);
            const isCurrentMonth = isSameMonth(currentDay, monthStart);
            const isPast = currentDay < todayStart;
            const isSelected = selectedDay ? isSameDay(currentDay, selectedDay) : false;
            const isWeekend = i === 5 || i === 6; // Option B: Sa/So
            const dayJobs = isCurrentMonth ? getPlannedJobsForDay(currentDay) : [];
            const dayRuns = isCurrentMonth ? getRunsForDay(currentDay) : [];

            days.push(
                <div
                    key={currentDay.toString()}
                    ref={isToday(currentDay) ? todayRef : undefined}
                    onClick={() => isCurrentMonth && setSelectedDay(isSelected ? null : currentDay)}
                    onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && isCurrentMonth && setSelectedDay(isSelected ? null : currentDay)}
                    tabIndex={isCurrentMonth ? 0 : -1}
                    role="button"
                    aria-label={format(currentDay, 'd. MMMM yyyy', { locale: de })}
                    className={[
                        'min-h-[100px] sm:min-h-[120px] p-2 border border-slate-100 flex flex-col gap-1 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
                        !isCurrentMonth
                            ? 'bg-slate-50 text-slate-400 cursor-default'
                            : isWeekend && isPast
                                ? 'bg-slate-100/70 text-slate-600 hover:bg-slate-100 cursor-pointer'
                                : isWeekend
                                    ? 'bg-slate-50/80 text-slate-700 hover:bg-slate-100/60 cursor-pointer'
                                    : isPast
                                        ? 'bg-slate-50/60 text-slate-600 hover:bg-slate-100/60 cursor-pointer'
                                        : 'bg-white text-slate-700 hover:bg-slate-50 cursor-pointer',
                        isToday(currentDay) ? '!bg-blue-50/50 ring-1 ring-inset ring-blue-200' : '',
                        isSelected ? '!bg-indigo-50 ring-2 ring-inset ring-indigo-400' : '',
                    ].join(' ')}
                >
                    <div className="flex justify-between items-start mb-1">
                        <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                            ${isToday(currentDay) ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30' : ''}
                        `}>
                            {format(currentDay, 'd')}
                        </span>

                        {/* V3: Status-Dots für tatsächliche Runs */}
                        {isCurrentMonth && dayRuns.length > 0 && (
                            <div className="flex gap-0.5 mt-1 flex-wrap justify-end max-w-[40px]">
                                {dayRuns.slice(0, 4).map((run, idx) => {
                                    const s = getRunStatus(run.status);
                                    return (
                                        <span
                                            key={idx}
                                            className={`w-2 h-2 rounded-full ${s.dotColor}`}
                                            title={`${run.job_name}: ${s.label}`}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* V2: Farbkodierte Job-Badges */}
                    <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                        {isCurrentMonth && dayJobs.slice(0, 3).map((dj, idx) => {
                            const colors = getTypeColors(dj.type);
                            return (
                                <div
                                    key={idx}
                                    onClick={(e) => { e.stopPropagation(); navigate('/jobs'); }}
                                    className={`text-[10px] leading-tight px-1.5 py-1 rounded border shadow-sm truncate cursor-pointer hover:opacity-75 transition-opacity ${colors.badge}`}
                                    title={`${dj.time} – ${dj.name} (${dj.type}) · Klick: Jobs öffnen`}
                                >
                                    <span className="font-semibold">{dj.time}</span>{' '}
                                    <span className="opacity-70">{dj.name}</span>
                                </div>
                            );
                        })}
                        {isCurrentMonth && dayJobs.length > 3 && (
                            <div className="text-[10px] font-medium text-slate-500 text-center mt-0.5">
                                +{dayJobs.length - 3} weitere
                            </div>
                        )}
                    </div>
                </div>
            );
            day = addDays(day, 1);
        }
        rows.push(<div className="grid grid-cols-7" key={day.toString()}>{days}</div>);
        days = [];
    }

    const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <CalendarIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Backup Kalender</h1>
                        <p className="text-slate-500 text-sm mt-1">Übersicht und dynamische Planung deiner Backup-Jobs.</p>
                    </div>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5"
                    >
                        <Plus className="w-5 h-5" /> Neuen Plan erstellen
                    </button>
                )}
            </div>

            {/* V1: Nächstes-Backup-Banner mit echtem Datum */}
            {!loading && nextUpcomingJob && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-blue-900 font-bold text-lg">Nächstes anstehendes Backup</h3>
                            <p className="text-blue-700 text-sm mt-0.5">
                                <span className="font-semibold">{nextUpcomingJob.name}</span>
                                {' '}
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getTypeColors(nextUpcomingJob.backup_type).badge}`}>
                                    {getTypeColors(nextUpcomingJob.backup_type).label}
                                </span>
                            </p>
                        </div>
                    </div>
                    <div className="text-right hidden sm:block">
                        <span className="text-xs text-blue-600/70 font-medium block mb-1 uppercase tracking-wide">Startet</span>
                        <span className="font-semibold text-blue-900 text-sm bg-white/70 border border-blue-100 px-3 py-1.5 rounded-lg inline-block shadow-sm">
                            {formatNextRun(nextUpcomingJob.next_run)}
                        </span>
                    </div>
                </div>
            )}

            {/* Haupt-Layout: Kalender (2/3) + Sidebar (1/3) */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Kalender-Ansicht */}
                <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    {/* Kalender-Header */}
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        {/* Option E: Jahr-Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowYearPicker(p => !p)}
                                className="flex items-center gap-1.5 text-lg font-bold text-slate-800 capitalize hover:text-blue-600 transition-colors"
                            >
                                {format(currentDate, 'MMMM', { locale: de })}
                                <span className="text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-lg text-sm font-semibold">
                                    {format(currentDate, 'yyyy')}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showYearPicker ? 'rotate-180' : ''}`} />
                            </button>
                            {showYearPicker && (
                                <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-20 p-2 grid grid-cols-3 gap-1 min-w-48">
                                    {Array.from({ length: 11 }, (_, k) => currentDate.getFullYear() - 5 + k).map(year => (
                                        <button
                                            key={year}
                                            onClick={() => { setCurrentDate(new Date(year, currentDate.getMonth(), 1)); setShowYearPicker(false); }}
                                            className={`px-2 py-1.5 text-sm rounded-lg transition-colors ${
                                                year === currentDate.getFullYear()
                                                    ? 'bg-blue-600 text-white font-bold'
                                                    : 'hover:bg-slate-100 text-slate-700'
                                            }`}
                                        >
                                            {year}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleNavigateToday}
                                className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-colors mr-2 shadow-sm"
                            >
                                Heute
                            </button>
                            <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                                <button
                                    onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                                    className="p-1.5 hover:bg-slate-50 text-slate-600 transition-colors border-r border-slate-200"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                                    className="p-1.5 hover:bg-slate-50 text-slate-600 transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Wochentage */}
                    <div className="grid grid-cols-7 bg-slate-50/80 border-b border-slate-200">
                        {weekDays.map((d, idx) => (
                            <div key={d} className={`py-2 text-center text-xs font-semibold uppercase tracking-wider ${
                                idx >= 5 ? 'text-slate-400 bg-slate-100/60' : 'text-slate-500'
                            }`}>
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Kalender-Grid */}
                    <div className="flex-1 overflow-hidden relative">
                        {loading && (
                            <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            </div>
                        )}
                        {rows}
                    </div>

                    {/* V2: Legende */}
                    <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center gap-x-4 gap-y-2">
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Typ:</span>
                        {Object.entries(TYPE_COLORS).map(([type, colors]) => (
                            <span key={type} className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border font-medium ${colors.badge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                                {colors.label}
                            </span>
                        ))}
                        <span className="text-xs text-slate-300 hidden sm:inline mx-1">|</span>
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Runs:</span>
                        {[['success', 'Erfolgreich'], ['failed', 'Fehler'], ['stopped', 'Gestoppt']].map(([status, label]) => (
                            <span key={status} className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                                <span className={`w-2 h-2 rounded-full ${RUN_STATUS_CONFIG[status].dotColor}`} />
                                {label}
                            </span>
                        ))}
                        <span className="text-xs text-slate-300 ml-auto hidden sm:inline">Klick auf Tag für Details</span>
                    </div>
                </div>

                {/* Rechte Sidebar: Detail-Panel oder Strategie-Karten */}
                <div className="space-y-4">
                    {selectedDay ? (
                        // === V4: Tag-Detail-Panel ===
                        <div className="bg-white rounded-2xl shadow-sm border border-indigo-200 overflow-hidden">
                            {/* Tag-Header */}
                            <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-between">
                                <div>
                                    <div className="text-xs text-indigo-200 font-semibold uppercase tracking-widest">
                                        {format(selectedDay, 'EEEE', { locale: de })}
                                    </div>
                                    <div className="text-2xl font-bold text-white mt-0.5">
                                        {format(selectedDay, 'd. MMMM yyyy', { locale: de })}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedDay(null)}
                                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors shrink-0"
                                    title="Schließen"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-4 space-y-5 max-h-[520px] overflow-y-auto">
                                {/* Geplante Ausführungen */}
                                <div>
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <CalendarIcon className="w-3.5 h-3.5" />
                                        Geplante Ausführungen ({selectedDayJobs.length})
                                    </h4>
                                    {selectedDayJobs.length > 0 ? (
                                        <div className="space-y-2">
                                            {selectedDayJobs.map((dj, idx) => {
                                                const colors = getTypeColors(dj.type);
                                                return (
                                                    <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border ${colors.badge}`}>
                                                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colors.dot}`} />
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-semibold truncate">{dj.name}</div>
                                                            <div className="text-xs opacity-70">{colors.label} · {dj.time} Uhr</div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic pl-1">Keine Jobs geplant.</p>
                                    )}
                                </div>

                                {/* Tatsächliche Runs */}
                                {selectedDayRuns.length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Tatsächliche Ausführungen ({selectedDayRuns.length})
                                        </h4>
                                        <div className="space-y-2">
                                            {selectedDayRuns.map((run, idx) => {
                                                const s = getRunStatus(run.status);
                                                const Icon = s.icon;
                                                return (
                                                    <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border ${s.bg}`}>
                                                        <Icon className={`w-4 h-4 shrink-0 ${s.color}`} />
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-semibold text-slate-700 truncate">{run.job_name}</div>
                                                            <div className="text-xs text-slate-500">
                                                                {s.label} · {format(parseISO(run.started_at), 'HH:mm')} Uhr
                                                                {run.finished_at && ` – ${format(parseISO(run.finished_at), 'HH:mm')} Uhr`}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Leer-Zustand */}
                                {selectedDayJobs.length === 0 && selectedDayRuns.length === 0 && (
                                    <div className="text-center py-10">
                                        <CalendarIcon className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                        <p className="text-sm text-slate-400">Kein Backup für diesen Tag geplant.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        // === Strategie-Sidebar (Standard) ===
                        <>
                            {/* Option A: Monats-Statistiken */}
                            {monthStats.total > 0 && (
                                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                        <TrendingUp className="w-3.5 h-3.5" />
                                        {format(currentDate, 'MMMM', { locale: de })} – Übersicht
                                    </h4>
                                    <div className="grid grid-cols-3 gap-3 mb-3">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-slate-800">{monthStats.total}</div>
                                            <div className="text-xs text-slate-400 mt-0.5">Runs</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-emerald-600">{monthStats.success}</div>
                                            <div className="text-xs text-slate-400 mt-0.5">Erfolgreich</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-red-500">{monthStats.failed}</div>
                                            <div className="text-xs text-slate-400 mt-0.5">Fehler</div>
                                        </div>
                                    </div>
                                    {monthStats.rate !== null && (
                                        <div className="mt-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs text-slate-500">Erfolgsquote</span>
                                                <span className={`text-xs font-bold ${
                                                    monthStats.rate >= 90 ? 'text-emerald-600'
                                                    : monthStats.rate >= 70 ? 'text-amber-600'
                                                    : 'text-red-500'
                                                }`}>{monthStats.rate}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${
                                                        monthStats.rate >= 90 ? 'bg-emerald-500'
                                                        : monthStats.rate >= 70 ? 'bg-amber-400'
                                                        : 'bg-red-500'
                                                    }`}
                                                    style={{ width: `${monthStats.rate}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <ShieldCheck className="w-24 h-24" />
                                </div>
                                <h3 className="font-bold text-lg flex items-center gap-2 relative z-10">
                                    <Info className="w-5 h-5 text-blue-400" />
                                    Backup Strategien
                                </h3>
                                <p className="text-slate-300 text-sm mt-2 font-medium relative z-10">
                                    Die 3-2-1 Backup-Regel empfiehlt eine Kombination aus verschiedenen Zyklen und Zielen.
                                </p>
                            </div>

                            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-blue-200 transition-colors group">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <h4 className="font-bold text-slate-800">Täglich (Inkrementell)</h4>
                                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                                    Ein schnelles Backup aller geänderten Dateien. Perfekt für das Ende eines Arbeitstages (z.B. 20:00 Uhr).
                                </p>
                                <ul className="text-xs text-slate-400 mt-3 space-y-1 list-disc list-inside">
                                    <li>Niedrige Dauer</li>
                                    <li>Geringer Speicherbedarf</li>
                                </ul>
                            </div>

                            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-purple-200 transition-colors group">
                                <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                    <CalendarIcon className="w-5 h-5" />
                                </div>
                                <h4 className="font-bold text-slate-800">Wöchentlich (Full)</h4>
                                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                                    Ein vollständiges Abbild deiner wichtigsten Daten. Ideal für's Wochenende, wenn das System nicht belastet wird.
                                </p>
                                <ul className="text-xs text-slate-400 mt-3 space-y-1 list-disc list-inside">
                                    <li>Höhere Dauer</li>
                                    <li>Optimal als robuster Referenzpunkt</li>
                                </ul>
                            </div>

                            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-emerald-200 transition-colors group">
                                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                    <HardDrive className="w-5 h-5" />
                                </div>
                                <h4 className="font-bold text-slate-800">Monatlich (Archiv/NAS)</h4>
                                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                                    Auslagerung auf ein externes Medium (z.B. NAS oder Cloud) zur Erfüllung der Offsite-Regel.
                                </p>
                                <ul className="text-xs text-slate-400 mt-3 space-y-1 list-disc list-inside">
                                    <li>Schutz vor lokaler Zerstörung</li>
                                    <li>Air-Gapped Schutz möglich</li>
                                </ul>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <JobModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaveSuccess={fetchJobs}
            />
        </div>
    );
}

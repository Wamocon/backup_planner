import { useState, useEffect } from 'react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    addDays,
    isToday
} from 'date-fns';
import { de } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ShieldCheck, Clock, HardDrive, Info, Plus } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import client from '../api/client';
import JobModal from '../components/JobModal';
import { CronExpressionParser } from 'cron-parser';

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [jobs, setJobs] = useState<any[]>([]);
    const [upcoming, setUpcoming] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);

    const user = useAuthStore(state => state.user);
    const isAdmin = user?.role === 'admin';

    const fetchData = async () => {
        setLoading(true);
        try {
            const [jobsResp, dashResp] = await Promise.all([
                client.get('/jobs'),
                client.get('/dashboard')
            ]);
            setJobs(jobsResp.data);
            setUpcoming(dashResp.data?.upcoming || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const goToToday = () => setCurrentDate(new Date());

    // Calendar generation logic
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start week on Monday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
        for (let i = 0; i < 7; i++) {
            formattedDate = format(day, dateFormat);

            // Find all jobs that will run on this specific 'day'
            const dayJobs: { name: string, time: string, type: string }[] = [];

            // Start of current day (00:00:00)
            const dayStart = new Date(day);
            dayStart.setHours(0, 0, 0, 0);

            // End of current day (23:59:59)
            const dayEnd = new Date(day);
            dayEnd.setHours(23, 59, 59, 999);

            jobs.forEach(job => {
                if (!job.is_active || !job.schedule) return;

                try {
                    const interval = CronExpressionParser.parse(job.schedule, {
                        currentDate: new Date(dayStart.getTime() - 1000), // Start just before the day to catch 00:00
                        endDate: dayEnd
                    });

                    while (true) {
                        try {
                            const obj = interval.next();
                            dayJobs.push({
                                name: job.name,
                                time: format(obj.toDate(), 'HH:mm'),
                                type: job.backup_type
                            });
                        } catch (e) {
                            break; // No more dates in this interval
                        }
                    }
                } catch (err) {
                    // Ignore parse errors for invalid crons
                }
            });

            // Sort jobs by time
            dayJobs.sort((a, b) => a.time.localeCompare(b.time));

            const isCurrentMonth = isSameMonth(day, monthStart);

            days.push(
                <div
                    key={day.toString()}
                    className={`min-h-[100px] sm:min-h-[120px] p-2 border border-slate-100 transition-colors flex flex-col gap-1
                        ${!isCurrentMonth ? 'bg-slate-50 text-slate-400' : 'bg-white text-slate-700 hover:bg-slate-50'}
                        ${isToday(day) ? 'bg-blue-50/50 ring-1 ring-inset ring-blue-200' : ''}
                    `}
                >
                    <div className="flex justify-between items-start mb-1">
                        <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full 
                            ${isToday(day) ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30' : ''}
                        `}>
                            {formattedDate}
                        </span>
                    </div>

                    {/* Render Job Occurrences */}
                    <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                        {isCurrentMonth && dayJobs.length > 0 && dayJobs.slice(0, 3).map((dj, idx) => (
                            <div
                                key={idx}
                                className="text-[10px] leading-tight px-1.5 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm truncate"
                                title={`${dj.time} - ${dj.name} (${dj.type})`}
                            >
                                <span className="font-semibold">{dj.time}</span> <span className="text-indigo-900/70">{dj.name}</span>
                            </div>
                        ))}
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

            {/* Next Backup Banner */}
            {!loading && upcoming.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-blue-900 font-bold text-lg">Nächstes anstehendes Backup</h3>
                            <p className="text-blue-700 text-sm mt-0.5">
                                Job: <span className="font-semibold">{upcoming[0].name}</span> ({upcoming[0].backup_type})
                            </p>
                        </div>
                    </div>
                    <div className="text-right hidden sm:block">
                        <span className="text-sm text-blue-800/70 font-medium">Zeitplan / Cron</span>
                        <div className="font-mono text-sm bg-white/60 px-2 py-1 rounded inline-block mt-1 text-indigo-700">
                            {upcoming[0].schedule}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Calendar View (Takes 2/3 width on large screens) */}
                <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    {/* Calendar Header */}
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h2 className="text-lg font-bold text-slate-800 capitalize">
                            {format(currentDate, 'MMMM yyyy', { locale: de })}
                        </h2>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={goToToday}
                                className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-colors mr-2 shadow-sm"
                            >
                                Heute
                            </button>
                            <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                                <button onClick={prevMonth} className="p-1.5 hover:bg-slate-50 text-slate-600 transition-colors border-r border-slate-200">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button onClick={nextMonth} className="p-1.5 hover:bg-slate-50 text-slate-600 transition-colors">
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Weekdays */}
                    <div className="grid grid-cols-7 bg-slate-50/80 border-b border-slate-200">
                        {weekDays.map(day => (
                            <div key={day} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="flex-1 overflow-hidden">
                        {rows}
                    </div>
                </div>

                {/* Recommendations Sidebar */}
                <div className="space-y-4">
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

                    {/* Suggestion Card: Daily */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-blue-200 transition-colors group">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Clock className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-slate-800 flex items-center gap-2">Täglich (Inkrementell)</h4>
                        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                            Ein schnelles Backup aller geänderten Dateien. Perfekt für das Ende eines Arbeitstages (z.B. 20:00 Uhr).
                        </p>
                        <ul className="text-xs text-slate-400 mt-3 space-y-1 list-disc list-inside">
                            <li>Niedrige Dauer</li>
                            <li>Geringer Speicherbedarf</li>
                        </ul>
                    </div>

                    {/* Suggestion Card: Weekly */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-purple-200 transition-colors group">
                        <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <CalendarIcon className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-slate-800 flex items-center gap-2">Wöchentlich (Full)</h4>
                        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                            Ein vollständiges Abbild deiner wichtigsten Daten. Ideal für's Wochenende, wenn das System nicht belastet wird.
                        </p>
                        <ul className="text-xs text-slate-400 mt-3 space-y-1 list-disc list-inside">
                            <li>Höhere Dauer</li>
                            <li>Optimal als robuster Referenzpunkt</li>
                        </ul>
                    </div>

                    {/* Suggestion Card: Monthly */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-emerald-200 transition-colors group">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <HardDrive className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-slate-800 flex items-center gap-2">Monatlich (Archiv/NAS)</h4>
                        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                            Auslagerung auf ein externes Medium (z.B. NAS oder Cloud) zur Erfüllung der Offsite-Regel.
                        </p>
                        <ul className="text-xs text-slate-400 mt-3 space-y-1 list-disc list-inside">
                            <li>Schutz vor lokaler Zerstörung</li>
                            <li>Air-Gapped Schutz möglich</li>
                        </ul>
                    </div>

                </div>
            </div>

            <JobModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaveSuccess={fetchData}
            />
        </div>
    );
}

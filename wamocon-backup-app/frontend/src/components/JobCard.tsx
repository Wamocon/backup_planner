import { Play, GearSix, Trash, Clock, ShieldCheck, ArrowSquareOut } from '@phosphor-icons/react';
import { format } from 'date-fns';

interface Job {
    id: number;
    name: string;
    source: string;
    destination: string;
    backup_type: string;
    schedule: string;
    next_run?: string;
    is_active: number;
}

interface JobCardProps {
    job: Job;
    isAdmin: boolean;
    onRun: (id: number) => void;
    onEdit: (id: number) => void;
    onDelete: (id: number) => void;
}

export default function JobCard({ job, isAdmin, onRun, onEdit, onDelete }: JobCardProps) {
    return (
        <div className="group bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col overflow-hidden relative">

            {/* Status Indicator */}
            <div className={`absolute top-0 left-0 w-1.5 h-full ${job.is_active ? 'bg-green-500' : 'bg-slate-300'}`} />

            <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors pl-2">{job.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${job.backup_type === 'full' ? 'bg-purple-100 text-purple-700' :
                            job.backup_type === 'incremental' ? 'bg-blue-100 text-blue-700' :
                                'bg-orange-100 text-orange-700'
                        }`}>
                        {job.backup_type}
                    </span>
                </div>

                <div className="space-y-3 pl-2 flex-1">
                    <div className="flex items-center text-sm text-slate-600">
                        <ArrowSquareOut size={16} className="mr-2 text-slate-400" />
                        <span className="truncate" title={job.source}>Von: <span className="font-medium text-slate-800">{job.source}</span></span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                        <ShieldCheck size={16} className="mr-2 text-slate-400" />
                        <span className="truncate" title={job.destination}>Nach: <span className="font-medium text-slate-800">{job.destination}</span></span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                        <Clock size={16} className="mr-2 text-slate-400" />
                        <span>Cron: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">{job.schedule}</code></span>
                    </div>
                </div>

                {job.is_active ? (
                    job.next_run && (
                        <div className="mt-6 pt-4 border-t border-slate-100 pl-2">
                            <p className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">Status</p>
                            <p className="text-sm font-medium text-blue-600 flex items-center">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse mr-2" />
                                Nächster Lauf: {format(new Date(job.next_run), 'dd.MM.yyyy HH:mm')}
                            </p>
                        </div>
                    )
                ) : (
                    <div className="mt-6 pt-4 border-t border-slate-100 pl-2">
                        <p className="text-sm font-medium text-slate-500 italic">Plan inaktiv</p>
                    </div>
                )}
            </div>

            {isAdmin && (
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                    <button
                        onClick={() => onRun(job.id)}
                        className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                        title="Diesen Backup-Job jetzt manuell starten"
                    >
                        <Play size={16} className="mr-1.5" /> Starten
                    </button>
                    <div className="flex gap-1">
                        <button
                            onClick={() => onEdit(job.id)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Plan bearbeiten"
                        >
                            <GearSix size={16} />
                        </button>
                        <button
                            onClick={() => onDelete(job.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Plan löschen"
                        >
                            <Trash size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

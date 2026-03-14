import React, { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';
import client from '../api/client';
import { CronExpressionParser } from 'cron-parser';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useToastStore } from '../store/toast.store';

const getCronPreview = (cronStr: string): string => {
    try {
        const interval = CronExpressionParser.parse(cronStr);
        const runs = [interval.next().toDate(), interval.next().toDate(), interval.next().toDate()];
        return runs.map(d => format(d, 'EEE dd.MM. HH:mm', { locale: de })).join('  ·  ');
    } catch {
        return 'Ungültiger Cron-Ausdruck';
    }
};

interface Job {
    id?: number;
    name: string;
    source: string;
    destination: string;
    backup_type: string;
    schedule: string;
    retention_days: number;
    is_active: number;
}

interface JobModalProps {
    isOpen: boolean;
    onClose: () => void;
    jobToEdit?: Job | null;
    onSaveSuccess: () => void;
}

export default function JobModal({ isOpen, onClose, jobToEdit, onSaveSuccess }: JobModalProps) {
    const [formData, setFormData] = useState<Job>({
        name: '', source: 'wmc-onedrive:', destination: 'synology-nas:WMC/Backup', backup_type: 'full',
        schedule: '0 18 * * *', retention_days: 90, is_active: 1
    });
    const [customCron, setCustomCron] = useState(false);
    const [loading, setLoading] = useState(false);
    const addToast = useToastStore(s => s.addToast);

    useEffect(() => {
        if (jobToEdit) {
            setFormData({
                id: jobToEdit.id,
                name: jobToEdit.name,
                source: jobToEdit.source,
                destination: jobToEdit.destination,
                backup_type: jobToEdit.backup_type,
                schedule: jobToEdit.schedule,
                retention_days: jobToEdit.retention_days,
                is_active: jobToEdit.is_active
            });
            const presets = ['0 18 * * *', '0 18 * * 0', '0 18 1 * *'];
            setCustomCron(!presets.includes(jobToEdit.schedule));
        } else {
            setFormData({ name: '', source: 'wmc-onedrive:', destination: 'synology-nas:WMC/Backup', backup_type: 'full', schedule: '0 18 * * *', retention_days: 90, is_active: 1 });
            setCustomCron(false);
        }
    }, [jobToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (formData.id) {
                await client.put(`/jobs/${formData.id}`, formData);
            } else {
                await client.post('/jobs', formData);
            }
            onSaveSuccess();
            onClose();
        } catch (err: any) {
            addToast(err?.response?.data?.error || 'Fehler beim Speichern des Plans.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
                <div className="relative inline-block px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-2xl shadow-2xl sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-8 border border-slate-100">

                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">
                                {formData.id ? 'Backup Plan bearbeiten' : 'Neuen Backup Plan erstellen'}
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">Konfiguriere Quellen, Ziele und den Zeitplan für die rclone Ausführung.</p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                            <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                        </button>
                    </div>

                    <form onSubmit={handleSave} className="space-y-6">

                        {/* Allgemeine Infos */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500">1. Allgemeine Informationen</h4>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name des Plans</label>
                                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow bg-slate-50 hover:bg-slate-100/50 focus:bg-white" placeholder="z.B. Tägliches OneDrive Backup" />
                            </div>
                        </div>

                        {/* Quell & Ziel */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                2. Quelle & Ziele
                                <div className="group relative inline-block">
                                    <Info className="w-4 h-4 text-blue-400 cursor-help" />
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl z-10 pointer-events-none">
                                        Diese Remotes müssen zuvor in der rclone.conf des hostenden MacStudio Servers konfiguriert worden sein.
                                    </div>
                                </div>
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Quelle</label>
                                    <select value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })} className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white">
                                        <option value="wmc-onedrive:">wmc-onedrive:</option>
                                        <option value="synology-nas:">synology-nas:</option>
                                        <option value="wmc-googledrive:">wmc-googledrive:</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Ziel (rclone Pfad)</label>
                                    <input type="text" required value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })} className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white" placeholder="synology-nas:WMC/Backup" />
                                </div>
                            </div>
                        </div>

                        {/* Strategie */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500">3. Strategie & Zeitplan</h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center justify-between">
                                        Backup-Typ
                                        <span className="group relative inline-block">
                                            <Info className="w-4 h-4 text-slate-400 cursor-help" />
                                            <span className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl z-10">
                                                Vollbackup kopiert alles neu. Inkrementell (--update) kopiert nur geänderte Dateien (empfohlen für Cloud). GoBD sichert Buchhaltungsdaten mit Checksummen-Prüfung und 10 Jahren Mindest-Aufbewahrung.
                                            </span>
                                        </span>
                                    </label>
                                    <select value={formData.backup_type} onChange={e => {
                                        const newType = e.target.value;
                                        const updates: Partial<Job> = { backup_type: newType };
                                        if (newType === 'gobd') {
                                            updates.retention_days = 3650;
                                        }
                                        setFormData({ ...formData, ...updates });
                                    }} className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white">
                                        <option value="full">Vollbackup</option>
                                        <option value="incremental">Inkrementell (Update)</option>
                                        <option value="differential">Differenziell</option>
                                        <option value="gobd">GoBD (Buchhaltungsdaten)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Ausführungs-Zeitplan</label>
                                    {!customCron ? (
                                        <select
                                            value={formData.schedule}
                                            onChange={e => {
                                                if (e.target.value === 'custom') setCustomCron(true);
                                                else setFormData({ ...formData, schedule: e.target.value });
                                            }}
                                            className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                                        >
                                            <option value="0 18 * * *">Täglich um 18:00 Uhr</option>
                                            <option value="0 18 * * 0">Wöchentlich (Sonntags 18:00)</option>
                                            <option value="0 18 1 * *">Monatlich (am 1. um 18:00)</option>
                                            <option value="custom">Benutzerdefiniert (Cron)...</option>
                                        </select>
                                    ) : (
                                        <div>
                                            <div className="flex gap-2">
                                                <input type="text" required value={formData.schedule} onChange={e => setFormData({ ...formData, schedule: e.target.value })} className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50" placeholder="0 18 * * *" />
                                                <button type="button" onClick={() => setCustomCron(false)} className="px-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-100 hover:bg-slate-200 font-medium">Zurück</button>
                                            </div>
                                            {(() => {
                                                const preview = getCronPreview(formData.schedule);
                                                const isInvalid = preview === 'Ungültiger Cron-Ausdruck';
                                                return (
                                                    <p className="text-xs mt-1.5 text-slate-500">
                                                        Nächste Läufe: <span className={isInvalid ? 'text-red-500 font-medium' : 'text-emerald-600 font-medium'}>{preview}</span>
                                                    </p>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Aufbewahrung (Retention)</label>
                                    <select value={formData.retention_days} onChange={e => setFormData({ ...formData, retention_days: Number(e.target.value) })} disabled={formData.backup_type === 'gobd'} className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed">
                                        <option value={7}>7 Tage</option>
                                        <option value={30}>1 Monat (30 Tage)</option>
                                        <option value={90}>3 Monate (90 Tage)</option>
                                        <option value={180}>6 Monate (180 Tage)</option>
                                        <option value={365}>1 Jahr (365 Tage)</option>
                                        <option value={3650}>10 Jahre (GoBD)</option>
                                        <option value={99999}>Unbegrenzte Aufbewahrung</option>
                                    </select>
                                </div>

                                <div className="flex items-center h-full pt-6">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={formData.is_active === 1} onChange={e => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        <span className="ml-3 text-sm font-medium text-slate-700">Plan ist aktiv</span>
                                    </label>
                                </div>
                            </div>

                            {/* GoBD-Hinweis */}
                            {formData.backup_type === 'gobd' && (
                                <div className="col-span-1 sm:col-span-2 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                                    <p className="font-semibold mb-1">GoBD-Compliance Hinweise:</p>
                                    <ul className="list-disc list-inside space-y-1 text-xs text-amber-700">
                                        <li>Aufbewahrungsfrist ist auf mindestens 10 Jahre festgelegt (gesetzliche Vorgabe)</li>
                                        <li>Checksummen-Prüfung wird automatisch bei jedem Lauf durchgeführt</li>
                                        <li>Dieser Plan kann nach Erstellung nicht gelöscht oder in einen anderen Typ geändert werden</li>
                                        <li>Empfohlen für: Eingangs-/Ausgangsrechnungen, Belege, E-Mail-Archiv</li>
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                            <button type="button" onClick={onClose} className="w-full sm:w-auto px-6 py-3 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors">
                                Abbrechen
                            </button>
                            <button type="submit" disabled={loading} className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50">
                                {loading ? 'Speichere...' : (formData.id ? 'Änderungen speichern' : 'Plan erstellen')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

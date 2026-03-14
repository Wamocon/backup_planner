import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuthStore } from '../store/auth.store';
import { Monitor, Wifi, Edit2, Save, X, HardDrive, Server, Loader2 } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

interface Device {
    id: number;
    name: string;
    online: boolean;
    last_file_backup: string | null;
    last_image_backup: string | null;
    file_ok: number;
    image_ok: number;
    file_disabled: number;
    image_disabled: number;
    client_version: string | null;
    synced_at: string | null;
    owner_id: number | null;
    display_name: string | null;
    owner_name: string | null;
    department: string | null;
    location: string | null;
    notes: string | null;
    owner_updated_at: string | null;
}

interface EditState {
    display_name: string;
    owner_name: string;
    department: string;
    location: string;
    notes: string;
}

const formatRel = (iso: string | null) => {
    if (!iso) return '–';
    try { return formatDistanceToNow(parseISO(iso), { addSuffix: true, locale: de }); }
    catch { return iso; }
};

export default function DevicesPage() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<EditState>({ display_name: '', owner_name: '', department: '', location: '', notes: '' });
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState<{ id: number; ok: boolean } | null>(null);
    const [historyMap, setHistoryMap] = useState<Record<string, Record<string, 'ok' | 'failed' | 'partial'>>>({});

    const user = useAuthStore(state => state.user);
    const isAdmin = user?.role === 'admin';

    const fetchDevices = async () => {
        try {
            const resp = await client.get('/devices');
            setDevices(resp.data);
        } catch {
            /* ignore */
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDevices();
        client.get('/urbackup/history?days=7').then(r => {
            const map: Record<string, Record<string, 'ok' | 'failed' | 'partial'>> = {};
            for (const entry of r.data) {
                const day = (entry.backup_time as string).slice(0, 10);
                if (!map[entry.client_name]) map[entry.client_name] = {};
                const prev = map[entry.client_name][day];
                if (!prev || entry.status !== 'ok') map[entry.client_name][day] = entry.status;
            }
            setHistoryMap(map);
        }).catch(() => {});
    }, []);

    const startEdit = (d: Device) => {
        setEditingId(d.id);
        setEditForm({
            display_name: d.display_name || '',
            owner_name: d.owner_name || '',
            department: d.department || '',
            location: d.location || '',
            notes: d.notes || ''
        });
    };

    const cancelEdit = () => { setEditingId(null); };

    const saveEdit = async (clientId: number) => {
        setSaving(true);
        try {
            await client.put(`/devices/${clientId}`, editForm);
            setSaveMsg({ id: clientId, ok: true });
            setEditingId(null);
            await fetchDevices();
        } catch {
            setSaveMsg({ id: clientId, ok: false });
        } finally {
            setSaving(false);
            setTimeout(() => setSaveMsg(null), 3000);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            </div>
        );
    }

    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().slice(0, 10);
    });
    const dotColor = { ok: 'bg-emerald-400', failed: 'bg-red-400', partial: 'bg-amber-400' };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                        <Monitor className="w-6 h-6" />
                    </span>
                    Geräte-Verwaltung
                </h1>
                <p className="text-slate-500 mt-2">Geräte (URBackup Clients) dokumentieren und Personen zuweisen.</p>
            </div>

            {devices.length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-12 text-center text-slate-400">
                    <Monitor className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Keine Geräte gefunden. Warte auf den ersten URBackup-Sync.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {devices.map(d => {
                        const isEditing = editingId === d.id;
                        return (
                            <div key={d.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                {/* Header */}
                                <div className="p-5 flex flex-wrap gap-4 items-start">
                                    <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${d.online ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                            <Monitor className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-lg leading-tight">
                                                {d.display_name || d.name}
                                            </p>
                                            {d.display_name && (
                                                <p className="text-xs text-slate-400 font-mono">{d.name}</p>
                                            )}
                                            {d.client_version && (
                                                <p className="text-xs text-slate-400">v{d.client_version}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status Badges */}
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${d.online ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                                            <Wifi className="w-3.5 h-3.5" />
                                            {d.online ? 'Online' : 'Offline'}
                                        </span>
                                        {!d.file_disabled && (
                                            <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${d.file_ok ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                                <HardDrive className="w-3 h-3" />
                                                File {d.file_ok ? 'OK' : 'NOK'}
                                            </span>
                                        )}
                                        {!d.image_disabled && (
                                            <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${d.image_ok ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                                <Server className="w-3 h-3" />
                                                Image {d.image_ok ? 'OK' : 'NOK'}
                                            </span>
                                        )}
                                    </div>

                                    {/* Backup Timestamps */}
                                    <div className="text-xs text-slate-400 space-y-0.5 min-w-[160px]">
                                        <p>Letztes File-Backup: <span className="font-medium text-slate-600">{formatRel(d.last_file_backup)}</span></p>
                                        <p>Letztes Image-Backup: <span className="font-medium text-slate-600">{formatRel(d.last_image_backup)}</span></p>
                                    </div>

                                    {/* 7-day mini history */}
                                    <div className="flex items-center gap-1" title="Backup-Status der letzten 7 Tage">
                                        {last7Days.map(day => {
                                            const st = historyMap[d.name]?.[day];
                                            return (
                                                <div
                                                    key={day}
                                                    title={`${day}: ${st ?? 'kein Backup'}`}
                                                    className={`w-3 h-3 rounded-sm ${ st ? dotColor[st] : 'bg-slate-200'}`}
                                                />
                                            );
                                        })}
                                        <span className="text-[10px] text-slate-400 ml-1">7T</span>
                                    </div>

                                    {isAdmin && !isEditing && (
                                        <button
                                            onClick={() => startEdit(d)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" /> Bearbeiten
                                        </button>
                                    )}
                                    {saveMsg?.id === d.id && (
                                        <span className={`text-xs px-2 py-1 rounded ${saveMsg.ok ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>
                                            {saveMsg.ok ? 'Gespeichert ✓' : 'Fehler beim Speichern'}
                                        </span>
                                    )}
                                </div>

                                {/* Assignment Info / Edit Form */}
                                {isEditing ? (
                                    <div className="border-t border-slate-100 p-5 bg-slate-50/50">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                            {[
                                                { key: 'display_name', label: 'Anzeigename', placeholder: 'z.B. Laptop Erwin' },
                                                { key: 'owner_name', label: 'Verantwortliche Person', placeholder: 'z.B. Erwin Moretz' },
                                                { key: 'department', label: 'Abteilung / Team', placeholder: 'z.B. IT' },
                                                { key: 'location', label: 'Standort / Raum', placeholder: 'z.B. Büro 2.OG' },
                                            ].map(f => (
                                                <div key={f.key}>
                                                    <label className="block text-xs font-semibold text-slate-500 mb-1">{f.label}</label>
                                                    <input
                                                        value={editForm[f.key as keyof EditState]}
                                                        onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                                        placeholder={f.placeholder}
                                                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                                    />
                                                </div>
                                            ))}
                                            <div className="sm:col-span-2 lg:col-span-3">
                                                <label className="block text-xs font-semibold text-slate-500 mb-1">Notizen</label>
                                                <textarea
                                                    value={editForm.notes}
                                                    onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                                                    placeholder="Freitext..."
                                                    rows={2}
                                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => saveEdit(d.id)}
                                                disabled={saving}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                                            >
                                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                Speichern
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className="flex items-center gap-1.5 px-4 py-2 text-slate-600 border border-slate-200 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                                            >
                                                <X className="w-4 h-4" /> Abbrechen
                                            </button>
                                        </div>
                                    </div>
                                ) : (d.owner_name || d.department || d.location || d.notes) ? (
                                    <div className="border-t border-slate-100 px-5 py-3 bg-slate-50/30 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                                        {d.owner_name && (
                                            <span className="text-slate-600"><span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Person</span> · {d.owner_name}</span>
                                        )}
                                        {d.department && (
                                            <span className="text-slate-600"><span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Abteilung</span> · {d.department}</span>
                                        )}
                                        {d.location && (
                                            <span className="text-slate-600"><span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Standort</span> · {d.location}</span>
                                        )}
                                        {d.notes && (
                                            <span className="text-slate-500 italic text-xs">{d.notes}</span>
                                        )}
                                    </div>
                                ) : isAdmin ? (
                                    <div className="border-t border-slate-100 px-5 py-2 text-xs text-slate-400 italic">
                                        Noch keine Zuweisung – klicke "Bearbeiten" um Person & Standort anzugeben.
                                    </div>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

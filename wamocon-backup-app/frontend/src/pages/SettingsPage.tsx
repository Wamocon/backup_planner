import { useEffect, useState } from 'react';
import client from '../api/client';
import { useToastStore } from '../store/toast.store';
import { GearSix, Envelope, FloppyDisk, PaperPlaneTilt, CircleNotch, Eye, EyeSlash } from '@phosphor-icons/react';

interface SettingsState {
    smtp_host: string;
    smtp_port: string;
    smtp_secure: string;
    smtp_user: string;
    smtp_password: string;
    smtp_from: string;
    notify_email: string;
    notify_on: string;
}

const DEFAULTS: SettingsState = {
    smtp_host: '',
    smtp_port: '587',
    smtp_secure: 'false',
    smtp_user: '',
    smtp_password: '',
    smtp_from: '',
    notify_email: '',
    notify_on: 'error',
};

export default function SettingsPage() {
    const [form, setForm] = useState<SettingsState>(DEFAULTS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const addToast = useToastStore(s => s.addToast);

    useEffect(() => {
        client.get('/settings').then(r => {
            setForm(prev => ({ ...prev, ...r.data }));
        }).catch(() => {
            addToast('Einstellungen konnten nicht geladen werden.', 'error');
        }).finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await client.put('/settings', form);
            addToast('Einstellungen gespeichert.', 'success');
        } catch {
            addToast('Speichern fehlgeschlagen.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleTestEmail = async () => {
        setTesting(true);
        try {
            const { data } = await client.post('/settings/test-email');
            addToast(data.message || 'Test-E-Mail gesendet.', 'success');
        } catch (e: any) {
            addToast(e.response?.data?.error || 'Test-E-Mail fehlgeschlagen.', 'error');
        } finally {
            setTesting(false);
        }
    };

    const set = (key: keyof SettingsState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(prev => ({ ...prev, [key]: e.target.value }));

    if (loading) {
        return <div className="flex justify-center items-center h-full min-h-100"><CircleNotch size={40} className="animate-spin text-blue-500" /></div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out max-w-2xl">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                        <GearSix size={24} />
                    </span>
                    Einstellungen
                </h1>
                <p className="text-slate-500 mt-2">SMTP-Konfiguration für E-Mail-Benachrichtigungen.</p>
            </div>

            {/* SMTP Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                    <Envelope size={16} className="text-indigo-500" />
                    <h2 className="font-bold text-slate-800 text-sm">E-Mail-Benachrichtigungen (SMTP)</h2>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">SMTP Host</label>
                            <input
                                type="text"
                                value={form.smtp_host}
                                onChange={set('smtp_host')}
                                placeholder="smtp.example.com"
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Port</label>
                            <input
                                type="number"
                                value={form.smtp_port}
                                onChange={set('smtp_port')}
                                placeholder="587"
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Benutzername</label>
                            <input
                                type="text"
                                value={form.smtp_user}
                                onChange={set('smtp_user')}
                                placeholder="user@example.com"
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Passwort</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.smtp_password}
                                    onChange={set('smtp_password')}
                                    placeholder="••••••••"
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Absender-Adresse</label>
                            <input
                                type="email"
                                value={form.smtp_from}
                                onChange={set('smtp_from')}
                                placeholder="backup@example.com"
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Empfänger (Notify Email)</label>
                            <input
                                type="email"
                                value={form.notify_email}
                                onChange={set('notify_email')}
                                placeholder="admin@example.com"
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            id="smtp_secure"
                            type="checkbox"
                            checked={form.smtp_secure === 'true'}
                            onChange={e => setForm(prev => ({ ...prev, smtp_secure: e.target.checked ? 'true' : 'false' }))}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-400"
                        />
                        <label htmlFor="smtp_secure" className="text-sm text-slate-700">SSL/TLS aktivieren (Port 465)</label>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-2">Benachrichtigen bei</label>
                        <div className="flex gap-2">
                            {(['error', 'success', 'both', 'none'] as const).map(v => (
                                <button
                                    key={v}
                                    type="button"
                                    onClick={() => setForm(prev => ({ ...prev, notify_on: v }))}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                        form.notify_on === v
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    {v === 'error' ? 'Nur Fehler' : v === 'success' ? 'Nur Erfolge' : v === 'both' ? 'Alle' : 'Keine'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                        {saving ? <CircleNotch size={16} className="animate-spin" /> : <FloppyDisk size={16} />}
                        Speichern
                    </button>
                    <button
                        onClick={handleTestEmail}
                        disabled={testing || !form.smtp_host || !form.notify_email}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 rounded-lg transition-colors"
                        title={!form.smtp_host || !form.notify_email ? 'Bitte SMTP-Host und Empfänger ausfüllen' : undefined}
                    >
                        {testing ? <CircleNotch size={16} className="animate-spin" /> : <PaperPlaneTilt size={16} />}
                        Test-E-Mail senden
                    </button>
                </div>
            </div>
        </div>
    );
}

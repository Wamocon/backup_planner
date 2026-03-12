import {
    Network, Server, Cloud, HardDrive, Database, Monitor, Shield,
    ArrowRight, ArrowDown, Mail, FileText, CheckCircle2, Lock
} from 'lucide-react';

const LAYERS = [
    {
        title: 'Datenquellen',
        subtitle: 'Wo eure Daten entstehen und eingehen',
        color: 'blue',
        items: [
            { icon: Cloud, label: 'OneDrive Business', desc: 'wmc-onedrive:', color: 'blue' },
            { icon: Cloud, label: 'Google Drive', desc: 'wmc-googledrive:', color: 'emerald' },
            { icon: Mail, label: 'E-Mail-Postfächer', desc: 'IMAP / Exchange', color: 'amber' },
            { icon: FileText, label: 'Lokale Dateien', desc: 'Rechnungen, Belege, Dokumente', color: 'purple' },
        ],
    },
    {
        title: 'Backup-Engine',
        subtitle: 'WAMOCON Backup Planner auf dem Mac Studio',
        color: 'indigo',
        items: [
            { icon: Server, label: 'Node.js Backend', desc: 'Express API, Scheduler (node-cron), JWT Auth', color: 'indigo' },
            { icon: Database, label: 'SQLite Datenbank', desc: 'Jobs, Runs, Konfiguration, Benutzer', color: 'slate' },
            { icon: Network, label: 'rclone', desc: 'Dateitransfer zwischen allen Remotes', color: 'cyan' },
            { icon: Monitor, label: 'UrBackup Server', desc: 'Notebook-Sicherung (Windows/macOS Clients)', color: 'violet' },
        ],
    },
    {
        title: 'Sicherungsziele',
        subtitle: 'Wo eure Backups gespeichert werden (3-2-1 Regel)',
        color: 'emerald',
        items: [
            { icon: HardDrive, label: 'Synology NAS', desc: 'synology-nas: — Lokale Sicherung im Haus', color: 'emerald' },
            { icon: Cloud, label: 'Cloud-Speicher', desc: 'OneDrive / Google Drive — Offsite Sicherung', color: 'blue' },
            { icon: Server, label: 'Mac Studio (lokal)', desc: 'UrBackup Volumes — Notebook-Images', color: 'slate' },
        ],
    },
];

const BACKUP_TYPES = [
    {
        type: 'full',
        label: 'Vollbackup',
        desc: 'Kopiert alle Dateien vollständig von der Quelle zum Ziel. Höchste Sicherheit, aber größter Speicherbedarf und längste Laufzeit.',
        flags: 'rclone copy SOURCE DEST',
        color: 'purple',
        retention: 'Frei wählbar',
    },
    {
        type: 'incremental',
        label: 'Inkrementell',
        desc: 'Kopiert nur Dateien, die neuer sind als die Ziel-Version (--update). Schnell und speicherschonend, ideal für tägliche Cloud-Sicherungen.',
        flags: 'rclone copy --update',
        color: 'blue',
        retention: 'Frei wählbar',
    },
    {
        type: 'differential',
        label: 'Differenziell',
        desc: 'Ähnlich wie Inkrementell, kopiert geänderte Dateien zum Ziel. Nutzt ebenfalls das --update Flag.',
        flags: 'rclone copy --update',
        color: 'orange',
        retention: 'Frei wählbar',
    },
    {
        type: 'gobd',
        label: 'GoBD (Buchhaltungsdaten)',
        desc: 'Speziell für steuerrelevante und buchhaltungspflichtige Daten gemäß den "Grundsätzen zur ordnungsmäßigen Führung und Aufbewahrung von Büchern, Aufzeichnungen und Unterlagen in elektronischer Form sowie zum Datenzugriff" (GoBD). Vollständige Kopie mit Checksummen-Prüfung zur Sicherstellung der Datenintegrität.',
        flags: 'rclone copy --checksum',
        color: 'emerald',
        retention: 'Mindestens 10 Jahre (3.650 Tage)',
        compliance: [
            'Aufbewahrungsfrist: Mindestens 10 Jahre (gesetzlich vorgeschrieben)',
            'Datenintegrität: Checksummen-Vergleich bei jedem Backup-Lauf',
            'Löschschutz: GoBD-Pläne können nicht gelöscht werden',
            'Typsicherung: Backup-Typ kann nachträglich nicht geändert werden',
            'Empfohlene Daten: Eingangs-/Ausgangsrechnungen, Belege, Quittungen, E-Mail-Archiv mit Rechnungsanhängen',
        ],
    },
];

const TECH_STACK = [
    { layer: 'Frontend', items: ['React 19', 'TypeScript', 'Vite', 'Tailwind CSS v4', 'Zustand', 'Axios'] },
    { layer: 'Backend', items: ['Node.js', 'Express', 'better-sqlite3', 'node-cron', 'JWT + bcrypt', 'Nodemailer'] },
    { layer: 'Transfer', items: ['rclone', 'UrBackup Server API'] },
    { layer: 'Infrastruktur', items: ['Mac Studio (Host)', 'PM2 (Prozessmanager)', 'Docker (UrBackup)'] },
];

const colorMap: Record<string, { bg: string; text: string; border: string; icon: string; badge: string }> = {
    blue:    { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    icon: 'text-blue-500',    badge: 'bg-blue-100 text-blue-700' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: 'text-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
    indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-indigo-200',  icon: 'text-indigo-500',  badge: 'bg-indigo-100 text-indigo-700' },
    purple:  { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200',  icon: 'text-purple-500',  badge: 'bg-purple-100 text-purple-700' },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   icon: 'text-amber-500',   badge: 'bg-amber-100 text-amber-700' },
    cyan:    { bg: 'bg-cyan-50',    text: 'text-cyan-700',    border: 'border-cyan-200',    icon: 'text-cyan-500',    badge: 'bg-cyan-100 text-cyan-700' },
    orange:  { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200',  icon: 'text-orange-500',  badge: 'bg-orange-100 text-orange-700' },
    violet:  { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200',  icon: 'text-violet-500',  badge: 'bg-violet-100 text-violet-700' },
    slate:   { bg: 'bg-slate-50',   text: 'text-slate-700',   border: 'border-slate-200',   icon: 'text-slate-500',   badge: 'bg-slate-100 text-slate-700' },
};

export default function ArchitecturePage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">

            {/* Header */}
            <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-lg shadow-slate-500/20">
                    <Network className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">System-Architektur</h1>
                    <p className="text-slate-500 text-sm mt-1">Gesamtübersicht über Datenflüsse, Backup-Typen, Technologie-Stack und Compliance.</p>
                </div>
            </div>

            {/* ===== DATENFLUSS-DIAGRAMM ===== */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-800">Datenfluss-Architektur</h2>
                    <p className="text-sm text-slate-500 mt-1">Wie Daten von den Quellen über die Backup-Engine zu den Sicherungszielen fließen.</p>
                </div>
                <div className="p-6 space-y-6">
                    {LAYERS.map((layer, li) => {
                        const lc = colorMap[layer.color];
                        return (
                            <div key={layer.title}>
                                {/* Layer Header */}
                                <div className="flex items-center gap-2 mb-3">
                                    <span className={`text-xs font-bold uppercase tracking-widest ${lc.text}`}>{layer.title}</span>
                                    <span className="text-xs text-slate-400">— {layer.subtitle}</span>
                                </div>

                                {/* Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    {layer.items.map(item => {
                                        const ic = colorMap[item.color];
                                        return (
                                            <div key={item.label} className={`rounded-xl border p-4 ${ic.bg} ${ic.border} transition-shadow hover:shadow-md`}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <item.icon className={`w-5 h-5 ${ic.icon}`} />
                                                    <span className={`text-sm font-bold ${ic.text}`}>{item.label}</span>
                                                </div>
                                                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Arrow between layers */}
                                {li < LAYERS.length - 1 && (
                                    <div className="flex justify-center py-3">
                                        <ArrowDown className="w-6 h-6 text-slate-300" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ===== BACKUP-TYPEN ===== */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-800">Backup-Typen im Detail</h2>
                    <p className="text-sm text-slate-500 mt-1">Jeder Typ steuert, wie rclone Daten kopiert und wie lange sie aufbewahrt werden.</p>
                </div>
                <div className="p-6 space-y-4">
                    {BACKUP_TYPES.map(bt => {
                        const c = colorMap[bt.color];
                        return (
                            <div key={bt.type} className={`rounded-xl border p-5 ${c.bg} ${c.border}`}>
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${c.text}`}>
                                                {bt.type === 'gobd' && <Shield className="w-4 h-4" />}
                                                {bt.label}
                                            </span>
                                            <code className={`text-xs px-2 py-0.5 rounded-full font-mono ${c.badge}`}>{bt.type}</code>
                                        </div>
                                        <p className="text-sm text-slate-600 leading-relaxed">{bt.desc}</p>
                                    </div>
                                    <div className="flex flex-col gap-1 text-right shrink-0 sm:min-w-[180px]">
                                        <div className="flex items-center gap-1.5 justify-end">
                                            <span className="text-xs text-slate-400">Befehl:</span>
                                            <code className="text-xs font-mono bg-white/70 px-2 py-0.5 rounded border border-slate-200">{bt.flags}</code>
                                        </div>
                                        <div className="flex items-center gap-1.5 justify-end">
                                            <span className="text-xs text-slate-400">Retention:</span>
                                            <span className="text-xs font-medium text-slate-700">{bt.retention}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* GoBD Compliance details */}
                                {bt.compliance && (
                                    <div className="mt-4 pt-4 border-t border-emerald-200/60">
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <Lock className="w-3.5 h-3.5 text-emerald-600" />
                                            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Compliance-Merkmale</span>
                                        </div>
                                        <ul className="space-y-1.5">
                                            {bt.compliance.map((item, i) => (
                                                <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ===== TECHNOLOGIE-STACK ===== */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-800">Technologie-Stack</h2>
                    <p className="text-sm text-slate-500 mt-1">Alle eingesetzten Technologien auf einen Blick.</p>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {TECH_STACK.map(stack => (
                            <div key={stack.layer} className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 hover:bg-white transition-colors">
                                <h4 className="text-sm font-bold text-slate-800 mb-3 pb-2 border-b border-slate-200">{stack.layer}</h4>
                                <ul className="space-y-1.5">
                                    {stack.items.map(item => (
                                        <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                                            <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ===== 3-2-1 REGEL ===== */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-6 h-6 text-blue-400" />
                    <h2 className="text-lg font-bold">Die 3-2-1 Backup-Regel</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                        <div className="text-3xl font-black text-blue-400 mb-2">3</div>
                        <h4 className="font-bold text-sm mb-1">Kopien</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">Mindestens drei Kopien deiner Daten: das Original plus zwei Backups.</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                        <div className="text-3xl font-black text-emerald-400 mb-2">2</div>
                        <h4 className="font-bold text-sm mb-1">Medientypen</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">Speichere auf mindestens zwei verschiedenen Medien (z.B. NAS + Cloud).</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                        <div className="text-3xl font-black text-amber-400 mb-2">1</div>
                        <h4 className="font-bold text-sm mb-1">Offsite-Kopie</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">Mindestens eine Kopie an einem externen Standort (Cloud) gegen Feuer, Diebstahl etc.</p>
                    </div>
                </div>
            </div>

            {/* ===== GoBD VERANTWORTUNGSTEILUNG ===== */}
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 overflow-hidden">
                <div className="p-6 border-b border-emerald-100 bg-emerald-50/50">
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-emerald-600" />
                        <h2 className="text-lg font-bold text-slate-800">GoBD — Verantwortungsteilung Steuerbüro / WAMOCON</h2>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">Wer sichert was? Übersicht der Zuständigkeiten für buchhaltungsrelevante Daten.</p>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Steuerbüro */}
                        <div className="rounded-xl border border-slate-200 p-5">
                            <h4 className="font-bold text-slate-800 mb-1">Steuerbüro (Simba-Datenbank)</h4>
                            <p className="text-xs text-slate-500 mb-3">Wird vom Steuerbüro verantwortet und gesichert</p>
                            <ul className="space-y-2">
                                {[
                                    'Simba-Datenbank: Lokale Sicherung + Datenzentrum',
                                    'Verarbeitete Buchungen und angehängte Belege',
                                    'Simba Direkt (Portal): Gehostet und gebackupt von Simba',
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                                <strong>Achtung:</strong> Nur verarbeitete Daten sind beim Steuerbüro gesichert. Alles was nicht verarbeitet wird, ist NICHT gesichert. Simba Direkt ist aktuell noch NICHT revisionssicher (Dokumente können gelöscht werden).
                            </div>
                        </div>

                        {/* WAMOCON */}
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-5">
                            <h4 className="font-bold text-slate-800 mb-1">WAMOCON (Eigene Sicherung)</h4>
                            <p className="text-xs text-slate-500 mb-3">Muss eigenverantwortlich gesichert werden</p>
                            <ul className="space-y-2">
                                {[
                                    'Eingangsrechnungen (PDF-Dateien)',
                                    'Ausgangsrechnungen',
                                    'E-Mails mit Rechnungen (Transportmedium = Pflicht laut GoBD)',
                                    'Belege und Quittungen',
                                    'Alle nicht vom Steuerbüro verarbeiteten Dokumente',
                                    'Dokumente aus Simba Direkt (bis Revisionssicherheit aktiv)',
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                        <ArrowRight className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-3 p-3 bg-emerald-100 border border-emerald-200 rounded-lg text-xs text-emerald-700">
                                <strong>Tipp:</strong> Nutze den Backup-Typ "GoBD" für diese Daten. Er erzwingt 10 Jahre Aufbewahrung und prüft die Datenintegrität per Checksumme.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

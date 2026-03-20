import { BookOpenText, DownloadSimple, ShieldCheck, HardDrives, ClockCounterClockwise, Fingerprint, GearSix, Desktop, ArrowsClockwise, CaretRight } from '@phosphor-icons/react';

const chapters = [
    { id: 'overview', number: '1', title: 'Systemübersicht' },
    { id: 'rule-321', number: '2', title: 'Die 3-2-1 Backup-Regel' },
    { id: 'backup-types', number: '3', title: 'Backup-Typen im Vergleich' },
    { id: 'rclone', number: '4', title: 'rclone konfigurieren' },
    { id: 'jobs', number: '5', title: 'Backup-Pläne erstellen & verwalten' },
    { id: 'urbackup', number: '6', title: 'Notebook-Sicherungen (UrBackup)' },
    { id: 'glossary', number: '7', title: 'Glossar' },
];

export default function ManualPage() {
    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            {/* Print-only title header */}
            <div className="hidden print:block mb-8 border-b-2 border-slate-300 pb-6">
                <div className="flex items-center gap-3 mb-2">
                    <HardDrives size={40} className="text-slate-700" />
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">BackupPilot</h1>
                        <p className="text-slate-500 text-sm">Benutzerhandbuch · Stand: März 2026</p>
                    </div>
                </div>
            </div>

            <div className="animate-in fade-in duration-500 max-w-5xl mx-auto pb-16 print:max-w-none print:pb-0">

                {/* Page Header */}
                <div className="flex items-start justify-between mb-10 print:hidden">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            <BookOpenText size={32} className="text-indigo-500" />
                            Benutzerhandbuch
                        </h1>
                        <p className="mt-3 text-slate-500 text-lg leading-relaxed max-w-2xl">
                            Vollständige Dokumentation von BackupPilot — Konzepte, Konfiguration und Schritt-für-Schritt-Anleitungen.
                        </p>
                    </div>
                    <button
                        onClick={handlePrint}
                        className="shrink-0 flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-500/20 transition-colors"
                        title="Handbuch als PDF speichern (Browser-Druckdialog öffnen)"
                    >
                        <DownloadSimple size={20} />
                        Als PDF speichern
                    </button>
                </div>

                {/* Table of Contents */}
                <nav className="bg-white border border-slate-200 rounded-2xl p-6 mb-10 shadow-sm print:border-2 print:border-slate-300 print:mb-8">
                    <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Inhaltsverzeichnis</h2>
                    <ol className="space-y-2">
                        {chapters.map(ch => (
                            <li key={ch.id}>
                                <a
                                    href={`#${ch.id}`}
                                    className="flex items-center gap-3 text-slate-700 hover:text-indigo-600 transition-colors group print:no-underline print:text-slate-800"
                                >
                                    <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-sm flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors print:bg-slate-100 print:text-slate-700">
                                        {ch.number}
                                    </span>
                                    <span className="font-medium">{ch.title}</span>
                                    <CaretRight size={16} className="text-slate-300 group-hover:text-indigo-400 transition-colors print:hidden" />
                                </a>
                            </li>
                        ))}
                    </ol>
                </nav>

                <div className="space-y-16 print:space-y-10">

                    {/* Chapter 1: Overview */}
                    <section id="overview" className="scroll-mt-28 print:break-before-page">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-4xl font-black text-slate-200 print:text-slate-300">1</span>
                            <h2 className="text-2xl font-bold text-slate-800">Systemübersicht</h2>
                        </div>
                        <div className="prose prose-slate max-w-none">
                            <p className="text-slate-600 leading-relaxed mb-4">
                                <strong>BackupPilot</strong> ist eine webbasierte Anwendung zur zentralen Verwaltung und Automatisierung von Datensicherungen in der WAMOCON-Infrastruktur. Das System läuft auf dem <strong>Mac Studio Server</strong> und stellt ein Dashboard zur Konfiguration, Überwachung und Protokollierung aller Backup-Aktivitäten bereit.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                                    <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                        <GearSix size={20} className="text-slate-500" />
                                        Kernkomponenten
                                    </h3>
                                    <ul className="text-sm text-slate-600 space-y-1.5">
                                        <li><strong>rclone:</strong> Überträgt Daten zu Cloud-Diensten (OneDrive, Google Drive etc.)</li>
                                        <li><strong>Node.js Backend:</strong> Verwaltet Jobs, Zeitpläne und Protokolle</li>
                                        <li><strong>React Frontend:</strong> Web-Oberfläche für Administration</li>
                                        <li><strong>UrBackup:</strong> Lösung für die Notebook-Vollsicherung</li>
                                    </ul>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                                    <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                                        <Desktop size={20} className="text-slate-500" />
                                        Gesicherte Systeme
                                    </h3>
                                    <ul className="text-sm text-slate-600 space-y-1.5">
                                        <li><strong>Mac Studio:</strong> Lokale Ordner und Laufwerke per rclone</li>
                                        <li><strong>Notebooks (Windows/macOS):</strong> Vollbackups via UrBackup-Client</li>
                                        <li><strong>Cloud-Ziele:</strong> Microsoft OneDrive, weitere rclone-Remotes</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Chapter 2: 3-2-1 Rule */}
                    <section id="rule-321" className="scroll-mt-28 print:break-before-page">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-4xl font-black text-slate-200 print:text-slate-300">2</span>
                            <h2 className="text-2xl font-bold text-slate-800">Die 3-2-1 Backup-Regel</h2>
                        </div>
                        <div className="bg-linear-to-br from-indigo-900 to-slate-900 rounded-3xl p-8 shadow-xl relative overflow-hidden print:bg-white print:border-2 print:border-slate-300 print:rounded-xl print:shadow-none">
                            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none print:hidden">
                                <ShieldCheck size={256} className="text-white" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-indigo-200 text-lg mb-8 max-w-3xl leading-relaxed print:text-slate-700">
                                    Um sich effektiv gegen Datenverlust durch Ransomware, Hardware-Defekte oder Diebstahl abzusichern, empfehlen IT-Experten die <strong>3-2-1 Regel</strong>:
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white/10 border border-white/20 p-6 rounded-2xl backdrop-blur-sm print:bg-slate-50 print:border-slate-200">
                                        <div className="text-5xl font-black text-white mb-3 opacity-50 print:text-slate-300">3</div>
                                        <h3 className="text-lg font-bold text-white mb-2 print:text-slate-800">Ausfertigungen</h3>
                                        <p className="text-indigo-200 text-sm leading-relaxed print:text-slate-600">Mindestens 3 Kopien der Daten vorhalten (1 Original + 2 Backups).</p>
                                    </div>
                                    <div className="bg-white/10 border border-white/20 p-6 rounded-2xl backdrop-blur-sm print:bg-slate-50 print:border-slate-200">
                                        <div className="text-5xl font-black text-white mb-3 opacity-50 print:text-slate-300">2</div>
                                        <h3 className="text-lg font-bold text-white mb-2 print:text-slate-800">Medien-Typen</h3>
                                        <p className="text-indigo-200 text-sm leading-relaxed print:text-slate-600">Mindestens 2 unterschiedliche Speichermedien verwenden (z.B. NAS + Cloud).</p>
                                    </div>
                                    <div className="bg-white/10 border border-white/20 p-6 rounded-2xl backdrop-blur-sm print:bg-slate-50 print:border-slate-200">
                                        <div className="text-5xl font-black text-white mb-3 opacity-50 print:text-slate-300">1</div>
                                        <h3 className="text-lg font-bold text-white mb-2 print:text-slate-800">Offsite-Kopie</h3>
                                        <p className="text-indigo-200 text-sm leading-relaxed print:text-slate-600">Mindestens 1 Kopie an einem anderen geografischen Ort (z.B. OneDrive).</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="mt-4 text-sm text-slate-500 leading-relaxed">
                            BackupPilot setzt diese Regel um: Lokale Daten auf dem Mac Studio (Kopie 1) werden per rclone zu OneDrive (Kopie 2, Offsite) synchronisiert. Notebook-Daten werden zusätzlich lokal via UrBackup gesichert (Kopie 3).
                        </p>
                    </section>

                    {/* Chapter 3: Backup Types */}
                    <section id="backup-types" className="scroll-mt-28 print:break-before-page">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-4xl font-black text-slate-200 print:text-slate-300">3</span>
                            <h2 className="text-2xl font-bold text-slate-800">Backup-Typen im Vergleich</h2>
                        </div>
                        <div className="space-y-5">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-5 items-start">
                                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                                    <HardDrives size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-slate-800 mb-2">Vollbackup (rclone sync)</h3>
                                    <p className="text-slate-600 mb-3 leading-relaxed text-sm">
                                        Kopiert <em>alle</em> Daten der Quelle ins Ziel. Das Ziel wird exakt gespiegelt — Dateien, die in der Quelle fehlen, werden auch im Ziel gelöscht.
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="bg-green-50 p-3 rounded-xl border border-green-100 text-sm">
                                            <strong className="text-green-700">Vorteile:</strong>
                                            <p className="text-slate-600 mt-1">Ziel ist stets konsistent. Einfache Wiederherstellung.</p>
                                        </div>
                                        <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-sm">
                                            <strong className="text-red-700">Nachteile:</strong>
                                            <p className="text-slate-600 mt-1">Versehentlich gelöschte Dateien verschwinden auch im Ziel. Hoher Bandbreiten-/Speicherverbrauch.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 border-l-4 border-l-blue-500 shadow-sm flex flex-col md:flex-row gap-5 items-start">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                    <ClockCounterClockwise size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-slate-800 mb-2">
                                        Inkrementelles Backup (rclone copy)
                                        <span className="ml-2 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Empfohlen für Cloud</span>
                                    </h3>
                                    <p className="text-slate-600 mb-3 leading-relaxed text-sm">
                                        Überträgt nur neue oder geänderte Dateien. Im Ziel wird niemals etwas gelöscht.
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="bg-green-50 p-3 rounded-xl border border-green-100 text-sm">
                                            <strong className="text-green-700">Vorteile:</strong>
                                            <p className="text-slate-600 mt-1">Schont Bandbreite und Cloud-Speicher. Versehentlich gelöschte Dateien bleiben im Ziel erhalten.</p>
                                        </div>
                                        <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-sm">
                                            <strong className="text-red-700">Nachteile:</strong>
                                            <p className="text-slate-600 mt-1">Speicher wächst über Zeit an, da nichts gelöscht wird. Erfordert manuelle Bereinigung oder Retention-Einstellung.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-5 items-start">
                                <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                                    <Fingerprint size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-slate-800 mb-2">Differenzielles Backup</h3>
                                    <p className="text-slate-600 mb-3 leading-relaxed text-sm">
                                        Speichert alle Änderungen seit dem letzten <em>Vollbackup</em>. Wächst mit jedem Lauf an, bis wieder ein Vollbackup erstellt wird. Wird von BackupPilot nicht direkt verwendet, aber von UrBackup für Notebook-Sicherungen eingesetzt.
                                    </p>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-sm text-slate-600">
                                        Mittelweg zwischen Vollbackup (einfache Wiederherstellung) und inkrementellen Backup (Effizienz).
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Chapter 4: rclone */}
                    <section id="rclone" className="scroll-mt-28 print:break-before-page">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-4xl font-black text-slate-200 print:text-slate-300">4</span>
                            <h2 className="text-2xl font-bold text-slate-800">rclone konfigurieren</h2>
                        </div>
                        <p className="text-slate-600 mb-6 leading-relaxed">
                            rclone ist das zentrale Werkzeug für Dateiübertragungen zu Cloud-Diensten. Jedes Backup-Ziel (z.B. OneDrive, Google Drive) muss einmalig als <em>Remote</em> auf dem Mac Studio eingerichtet werden.
                        </p>
                        <div className="space-y-5">
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 font-bold text-sm flex items-center justify-center">1</span>
                                    rclone installieren
                                </h3>
                                <p className="text-sm text-slate-600 mb-3">Terminal auf dem Mac Studio öffnen und ausführen:</p>
                                <pre className="bg-slate-900 text-green-400 font-mono text-sm p-4 rounded-xl overflow-x-auto">brew install rclone</pre>
                                <p className="text-xs text-slate-500 mt-2">Alternativ: Direktdownload von <strong>rclone.org</strong></p>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 font-bold text-sm flex items-center justify-center">2</span>
                                    Remote einrichten (Beispiel: OneDrive)
                                </h3>
                                <p className="text-sm text-slate-600 mb-3">Interaktiven Konfigurationsassistenten starten:</p>
                                <pre className="bg-slate-900 text-green-400 font-mono text-sm p-4 rounded-xl overflow-x-auto">rclone config</pre>
                                <ol className="mt-4 text-sm text-slate-600 space-y-2 list-decimal pl-5">
                                    <li>Wähle <code className="bg-slate-100 px-1 rounded">n</code> für „New remote"</li>
                                    <li>Vergib einen Namen, z.B. <code className="bg-slate-100 px-1 rounded">wmc-onedrive</code></li>
                                    <li>Wähle den Speichertyp: <code className="bg-slate-100 px-1 rounded">onedrive</code></li>
                                    <li>Folge den Anweisungen zur OAuth-Autorisierung im Browser</li>
                                    <li>Bestätige die Einstellungen mit <code className="bg-slate-100 px-1 rounded">y</code></li>
                                </ol>
                                <p className="text-xs text-slate-500 mt-3">Das Remote ist danach unter dem gewählten Namen (z.B. <code className="bg-slate-100 px-1 rounded">wmc-onedrive:</code>) in BackupPilot als Ziel auswählbar.</p>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 font-bold text-sm flex items-center justify-center">3</span>
                                    Verbindung testen
                                </h3>
                                <pre className="bg-slate-900 text-green-400 font-mono text-sm p-4 rounded-xl overflow-x-auto">rclone lsd wmc-onedrive:</pre>
                                <p className="text-sm text-slate-600 mt-3">Listet alle Ordner im Stammverzeichnis des OneDrive-Speichers auf. Bei Erfolg ist das Remote korrekt konfiguriert.</p>
                            </div>
                        </div>
                    </section>

                    {/* Chapter 5: Jobs */}
                    <section id="jobs" className="scroll-mt-28 print:break-before-page">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-4xl font-black text-slate-200 print:text-slate-300">5</span>
                            <h2 className="text-2xl font-bold text-slate-800">Backup-Pläne erstellen & verwalten</h2>
                        </div>
                        <div className="space-y-5">
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <ArrowsClockwise size={20} className="text-indigo-500" />
                                    Neuen Plan anlegen
                                </h3>
                                <ol className="text-sm text-slate-600 space-y-3 list-decimal pl-5">
                                    <li>Navigiere in der linken Seitenleiste zu <strong>„Backup-Pläne"</strong>.</li>
                                    <li>Klicke auf <strong>„Neuen Plan erstellen"</strong> (oben rechts).</li>
                                    <li>Vergib einen eindeutigen <strong>Titel</strong> für den Job.</li>
                                    <li>Wähle die <strong>Quelle</strong> — den lokalen Pfad auf dem Mac Studio, der gesichert werden soll.</li>
                                    <li>Wähle das <strong>Ziel</strong> — ein zuvor konfiguriertes rclone-Remote (z.B. <code className="bg-slate-100 px-1 rounded">wmc-onedrive:Backups/Projekte</code>).</li>
                                    <li>Wähle den <strong>Backup-Typ</strong>: <em>Copy (Inkrementell)</em> oder <em>Sync (Spiegelung)</em>.</li>
                                    <li>Trage den <strong>Cron-Zeitplan</strong> ein (z.B. <code className="bg-slate-100 px-1 rounded">0 20 * * *</code> für täglich 20:00 Uhr).</li>
                                    <li>Stelle optional die <strong>Aufbewahrungsdauer in Tagen</strong> ein.</li>
                                    <li>Speichern. Der Plan wird ab sofort im Scheduler berücksichtigt.</li>
                                </ol>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                                <h3 className="font-bold text-slate-800 mb-3">Cron-Zeitformat — Kurzreferenz</h3>
                                <div className="font-mono text-sm bg-white border border-slate-200 rounded-xl p-4 mb-4">
                                    <span className="text-blue-600">*</span>{' '}
                                    <span className="text-purple-600">*</span>{' '}
                                    <span className="text-green-600">*</span>{' '}
                                    <span className="text-orange-600">*</span>{' '}
                                    <span className="text-red-600">*</span>
                                    <div className="flex text-xs mt-2 gap-4 text-slate-500">
                                        <span className="text-blue-600">Minute</span>
                                        <span className="text-purple-600">Stunde</span>
                                        <span className="text-green-600">Tag</span>
                                        <span className="text-orange-600">Monat</span>
                                        <span className="text-red-600">Wochentag</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600">
                                    <div className="flex gap-2"><code className="bg-slate-100 px-2 py-0.5 rounded font-mono text-xs shrink-0">0 20 * * *</code> täglich um 20:00 Uhr</div>
                                    <div className="flex gap-2"><code className="bg-slate-100 px-2 py-0.5 rounded font-mono text-xs shrink-0">0 2 * * 0</code> jeden Sonntag um 02:00 Uhr</div>
                                    <div className="flex gap-2"><code className="bg-slate-100 px-2 py-0.5 rounded font-mono text-xs shrink-0">0 */6 * * *</code> alle 6 Stunden</div>
                                    <div className="flex gap-2"><code className="bg-slate-100 px-2 py-0.5 rounded font-mono text-xs shrink-0">0 3 1 * *</code> am 1. jeden Monats um 03:00 Uhr</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Chapter 6: UrBackup */}
                    <section id="urbackup" className="scroll-mt-28 print:break-before-page">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-4xl font-black text-slate-200 print:text-slate-300">6</span>
                            <h2 className="text-2xl font-bold text-slate-800">Notebook-Sicherungen (UrBackup)</h2>
                        </div>
                        <p className="text-slate-600 mb-6 leading-relaxed">
                            Für die vollständige und inkrementelle Sicherung von Mitarbeiter-Notebooks (Windows & macOS) wird <strong>UrBackup</strong> als eigenständiges System eingesetzt. Der Server läuft auf dem Mac Studio via Docker.
                        </p>
                        <div className="space-y-5">
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 font-bold text-sm flex items-center justify-center">1</span>
                                    Server-Setup via Docker Compose
                                </h3>
                                <p className="text-sm text-slate-600 mb-3">Erstelle eine <code className="bg-slate-100 px-1 rounded">docker-compose.yml</code> auf dem Mac Studio:</p>
                                <pre className="bg-slate-900 text-indigo-300 font-mono text-xs p-5 rounded-xl overflow-x-auto border border-slate-700">
{`version: '3'
services:
  urbackup:
    image: uroni/urbackup-server:latest
    container_name: urbackup-server
    restart: unless-stopped
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Europe/Berlin
    volumes:
      - /Volumes/UrBackupStorage/backups:/backups
      - /Volumes/UrBackupStorage/database:/var/urbackup
    ports:
      - "55413-55415:55413-55415"
      - "35623:35623/udp"`}
                                </pre>
                                <div className="mt-4 bg-amber-50 border border-amber-200 p-4 rounded-xl text-sm text-amber-800">
                                    <strong>Wichtig:</strong> Das Volume-Ziel muss auf einer <em>APFS (Groß-/Kleinschreibung)</em>-Partition liegen. Standard-APFS auf dem Mac ist case-insensitiv und führt zum Fehler <code className="bg-amber-100 px-1 rounded">err_file_system_case_insensitive</code>. Ein case-sensitives Volume lässt sich im Festplattendienstprogramm (Disk Utility) anlegen.
                                </div>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 font-bold text-sm flex items-center justify-center">2</span>
                                    Client-Geräte verbinden
                                </h3>
                                <ol className="text-sm text-slate-600 space-y-3 list-decimal pl-5">
                                    <li>UrBackup Client für Windows oder macOS herunterladen von <strong>urbackup.org/download.html</strong></li>
                                    <li>Client auf dem Notebook installieren</li>
                                    <li>Im UrBackup Web-Dashboard (Port <code className="bg-slate-100 px-1 rounded">55414</code>) unter <em>„Neuen Client hinzufügen" → „Internet/aktiver Client"</em> den Computernamen eintragen</li>
                                    <li>Das angezeigte Internet-Passwort kopieren</li>
                                    <li>Am Windows-Notebook: SHIFT+Rechtsklick auf UrBackup-Taskleisten-Icon → <em>„Internet-Server konfigurieren"</em> → Server-IP und Passwort eingeben</li>
                                    <li>Das Feld <strong>„HTTP(s) Proxy"</strong> muss zwingend <em>leer</em> bleiben</li>
                                </ol>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 font-bold text-sm flex items-center justify-center">3</span>
                                    Wichtige Ports
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200">
                                                <th className="py-2 px-3 font-semibold text-slate-700">Port</th>
                                                <th className="py-2 px-3 font-semibold text-slate-700">Protokoll</th>
                                                <th className="py-2 px-3 font-semibold text-slate-700">Verwendung</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-slate-600">
                                            <tr className="border-b border-slate-100"><td className="py-2 px-3 font-mono">55414</td><td className="py-2 px-3">TCP</td><td className="py-2 px-3">Web-Dashboard (Admin)</td></tr>
                                            <tr className="border-b border-slate-100"><td className="py-2 px-3 font-mono">55415</td><td className="py-2 px-3">TCP</td><td className="py-2 px-3">Internet-Backups (Client → Server)</td></tr>
                                            <tr className="border-b border-slate-100"><td className="py-2 px-3 font-mono">55413</td><td className="py-2 px-3">TCP</td><td className="py-2 px-3">Lokale Netzwerkerkennung</td></tr>
                                            <tr><td className="py-2 px-3 font-mono">35623</td><td className="py-2 px-3">UDP</td><td className="py-2 px-3">Automatische LAN-Erkennung</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Chapter 7: Glossary */}
                    <section id="glossary" className="scroll-mt-28 print:break-before-page">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-4xl font-black text-slate-200 print:text-slate-300">7</span>
                            <h2 className="text-2xl font-bold text-slate-800">Glossar</h2>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                            {[
                                { term: 'rclone', def: 'Kommandozeilen-Werkzeug zur Synchronisation von Dateien mit Cloud-Diensten. Unterstützt über 70 Anbieter.' },
                                { term: 'Remote', def: 'Eine konfigurierte Verbindung in rclone zu einem Cloud-Dienst oder Netzlaufwerk (z.B. wmc-onedrive:).' },
                                { term: 'Cron', def: 'Zeitplanformat unter Unix/Linux. Definiert wann ein Befehl oder Job automatisch ausgeführt wird.' },
                                { term: 'Retention', def: 'Aufbewahrungsdauer. Legt fest, wie viele Tage Backup-Daten erhalten bleiben, bevor sie automatisch gelöscht werden.' },
                                { term: 'rclone sync', def: 'Synchronisiert Quelle und Ziel identisch. Löscht Dateien im Ziel, die in der Quelle nicht mehr vorhanden sind.' },
                                { term: 'rclone copy', def: 'Kopiert neue und geänderte Dateien ins Ziel. Löscht niemals Daten im Ziel.' },
                                { term: 'UrBackup', def: 'Open-Source Backup-Server für Vollbackups und inkrementelle Backups von Windows- und macOS-Clients.' },
                                { term: 'Docker Compose', def: 'Werkzeug zur Definition und Ausführung von Multi-Container Docker-Anwendungen per YAML-Datei.' },
                                { term: 'APFS Case-Sensitive', def: 'Dateisystemformat auf macOS, das zwischen Groß- und Kleinschreibung unterscheidet. Pflicht für UrBackup-Volumes.' },
                                { term: 'Inkrementell', def: 'Backup-Strategie, bei der nur Änderungen seit dem letzten Lauf gesichert werden.' },
                            ].map(({ term, def }, idx) => (
                                <div key={idx} className={`flex gap-4 p-4 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} border-b border-slate-100 last:border-b-0`}>
                                    <dt className="font-bold text-slate-800 w-44 shrink-0 text-sm">{term}</dt>
                                    <dd className="text-sm text-slate-600 leading-relaxed">{def}</dd>
                                </div>
                            ))}
                        </div>
                    </section>

                </div>

                {/* Footer PDF Button */}
                <div className="mt-12 flex justify-center print:hidden">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-500/20 transition-colors text-lg"
                    >
                        <DownloadSimple size={24} />
                        Handbuch als PDF speichern
                    </button>
                </div>

            </div>
        </>
    );
}

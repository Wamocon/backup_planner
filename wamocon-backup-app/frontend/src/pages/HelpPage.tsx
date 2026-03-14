import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LifeBuoy, Info, BookOpen, Search, ChevronRight, MessageSquare, AlertTriangle } from 'lucide-react';

export default function HelpPage() {
    const [searchTerm, setSearchTerm] = useState('');

    const troubleshootingEntries = [
        {
            title: "Wie lege ich einen neuen Backup-Plan an?",
            content: "Navigiere in der linken Seitenleiste auf 'Backup-Pläne'. Klicke auf 'Neuen Plan erstellen'. Wähle einen Titel, deine Quelle (z.B. lokaler Pfad) und das Ziel (z.B. rclone-Remote). Danach legst du einen Cron-Zeitplan für die Automatisierung fest.",
            category: "Nutzung",
            keywords: ["job", "plan", "erstellen", "neu", "cron", "zeitplan"]
        },
        {
            title: "Was hat es mit Quelle und Ziel auf sich?",
            content: "Die Quelle ist der Ordner oder das Laufwerk auf dem WAMOCON Mac Studio, das gesichert werden soll. Das Ziel ist ein rclone-Remote, z.B. 'wmc-onedrive:'. Diese Remotes müssen vorher über das Terminal auf dem Server konfiguriert werden ('rclone config').",
            category: "Nutzung",
            keywords: ["quelle", "ziel", "rclone", "remote", "pfad", "wmc-onedrive"]
        },
        {
            title: "Was bedeutet die Cron-Syntax?",
            content: "Cron ist ein Standardformat für Zeitpläne. '* * * * *' steht für Minute, Stunde, Tag im Monat, Monat und Wochentag. Beispiele: '0 20 * * *' = täglich um 20:00 Uhr. '0 2 * * 0' = jeden Sonntag um 02:00 Uhr.",
            category: "Nutzung",
            keywords: ["cron", "syntax", "zeitplan", "uhrzeit", "planung", "intervall"]
        },
        {
            title: "Wo sehe ich, ob ein Backup erfolgreich war?",
            content: "Auf der Seite 'Protokolle' findest du ein ausführliches Protokoll aller bisherigen Ausführungen. Erfolgreiche Jobs sind grün markiert. Klicke auf das Detail-Icon eines rot markierten Jobs, um den genauen rclone-Output zur Fehlersuche einzusehen.",
            category: "Nutzung",
            keywords: ["logs", "fehler", "erfolg", "resultate", "protokoll", "fehlgeschlagen"]
        },
        {
            title: "Was ist der Unterschied zwischen Sync und Copy?",
            content: "Sync (Spiegelung) macht das Ziel exakt gleich zur Quelle – Dateien, die in der Quelle gelöscht werden, verschwinden auch im Ziel. Copy (Inkrementell) fügt nur neue oder geänderte Dateien hinzu, löscht jedoch nie etwas im Ziel. Für Cloud-Backups wird fast immer Copy empfohlen.",
            category: "Nutzung",
            keywords: ["sync", "copy", "unterschied", "löschen", "inkrementell", "voll", "cloud"]
        },
        {
            title: "Wie ändere ich die Aufbewahrungsdauer (Retention)?",
            content: "Beim Bearbeiten eines Backup-Plans gibt es ein Feld 'Aufbewahrung (Tage)'. Bei z.B. 30 Tagen sorgt das System dafür, dass gelöschte Dateien 30 Tage im Cloud-Papierkorb oder Backup-Ordner verbleiben.",
            category: "Nutzung",
            keywords: ["retention", "aufbewahrung", "löschen", "tage", "papierkorb"]
        },
        {
            title: "UrBackup Client verbindet sich nicht (Offline)",
            content: "Wenn der Windows/Mac Client im UrBackup-Dashboard als offline angezeigt wird, blockiert vermutlich eine Firewall die UDP-Erkennung. Lösung: Im UrBackup Server unter Einstellungen → Server auf 'Mache Internet-Backups' stellen und die Server-IP hinterlegen. Am Client (Windows) SHIFT+Rechtsklick auf das UrBackup-Symbol → 'Internet-Server konfigurieren' und dort die Server-IP eintragen. UrBackup nutzt dann Port 55415.",
            category: "Problemlösung",
            keywords: ["urbackup", "client", "offline", "verbindung", "internet", "port", "firewall", "windows", "mac"]
        },
        {
            title: "Fehler: Warte auf den lokalen Backup Server (UrBackup)",
            content: "Wenn der Client meldet 'Warte auf den lokalen Backup Server' oder 'Authentication failure: Unknown client', kennt der Server diesen PC noch nicht. Lösung: Im UrBackup Web-Dashboard (Port 55414) auf 'Neuen Client hinzufügen' → 'Internet/aktiver Client'. Als Name EXAKT den Computernamen aus der Fehlermeldung eingeben. Das angezeigte Internet-Passwort kopieren. Am Windows-Client SHIFT+Rechtsklick → 'Internet-Server konfigurieren' und Passwort eintragen. WICHTIG: Das Feld 'Internet server HTTP(s) proxy' MUSS leer bleiben!",
            category: "Problemlösung",
            keywords: ["urbackup", "warte", "server", "lokal", "authentication", "failure", "proxy", "passwort", "windows"]
        },
        {
            title: "Fehler am Server: err_file_system_case_insensitive (Mac)",
            content: "Dieser Fehler tritt auf, wenn Docker versucht, Backups auf einer normalen APFS-Partition zu speichern. Lösung: Öffne 'Festplattendienstprogramm', klicke auf '+' (Volume hinzufügen), nenne es z.B. 'UrBackupStorage' und wähle 'APFS (Groß-/Kleinschreibung)'. In der docker-compose.yml den Volume-Pfad auf das neue Volume anpassen und den Container neu starten.",
            category: "Problemlösung",
            keywords: ["urbackup", "error", "err_file_system_case_insensitive", "mac", "apfs", "case-sensitive", "docker", "volume"]
        },
        {
            title: "Fehler: No permission to access '/backups/...'",
            content: "Wenn UrBackup keine Schreibrechte auf das Backup-Verzeichnis hat, öffne das Terminal am Mac und gib nur den konkreten Ordnern Rechte: 'sudo chmod -R 777 /Volumes/DeinLaufwerk/backups' und 'sudo chmod -R 777 /Volumes/DeinLaufwerk/urbackup'. Danach UrBackup Docker-Container neu starten.",
            category: "Problemlösung",
            keywords: ["urbackup", "permission", "schreibrechte", "zugriff", "verweigert", "chmod", "operation not permitted", "mac", "docker"]
        }
    ];

    const filteredEntries = troubleshootingEntries.filter(entry => {
        const term = searchTerm.toLowerCase();
        return (
            entry.title.toLowerCase().includes(term) ||
            entry.content.toLowerCase().includes(term) ||
            entry.keywords.some(k => k.toLowerCase().includes(term))
        );
    });

    const categories = ['Nutzung', 'Problemlösung'];

    return (
        <div className="animate-in fade-in duration-500 max-w-5xl mx-auto space-y-10 pb-12">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                    <LifeBuoy className="w-8 h-8 text-blue-500" />
                    Hilfe & Support
                </h1>
                <p className="mt-3 text-slate-500 text-lg leading-relaxed">
                    Schnelle Antworten auf häufige Fragen zur App-Bedienung sowie Lösungen für bekannte Probleme.
                    Für tiefergehende Erklärungen zu Backup-Konzepten und Systemaufbau,{' '}
                    <Link to="/manual" className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />lies das Handbuch
                    </Link>.
                </p>
            </div>

            {/* Quick FAQ Cards */}
            <section>
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5 text-indigo-500" />
                    Häufige Fragen
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <h4 className="font-bold text-slate-800 mb-2 flex items-start gap-2">
                            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                            Was bedeutet "Aufbewahrung (Retention)"?
                        </h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Die Aufbewahrung gibt an, wie viele Tage Backups vorgehalten werden sollen, bevor sie automatisch gelöscht werden, um Speicherplatz zu sparen.
                        </p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <h4 className="font-bold text-slate-800 mb-2 flex items-start gap-2">
                            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                            Wie richte ich Quellen & Ziele ein?
                        </h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Remotes wie <code className="bg-slate-100 px-1 rounded">wmc-onedrive:</code> müssen vorher auf dem MacStudio-Server über die rclone-Kommandozeile (<code className="bg-slate-100 px-1 rounded">rclone config</code>) eingerichtet werden.
                        </p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                        <h4 className="font-bold text-slate-800 mb-2 flex items-start gap-2">
                            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                            Kann ich Jobs auch manuell starten?
                        </h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Ja. Auf dem Dashboard und unter "Backup-Pläne" kannst du über den "Starten"-Button jederzeit einen geplanten Lauf sofort auslösen.
                        </p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                        <h4 className="font-bold text-slate-800 mb-2 flex items-start gap-2">
                            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                            Was passiert, wenn ein Backup abbricht?
                        </h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Fehlschläge werden unter "Protokolle" mit rotem Status markiert. Sofern SMTP korrekt konfiguriert ist, verschickt das System automatisch eine Fehler-E-Mail.
                        </p>
                    </div>
                </div>
            </section>

            {/* Searchable Troubleshooting */}
            <section id="troubleshooting">
                <div className="bg-slate-900 rounded-3xl p-8 sm:p-10 shadow-xl overflow-hidden relative">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <AlertTriangle className="w-7 h-7 text-yellow-400" />
                                Problemlösung & Anleitungen
                            </h2>
                            <p className="text-slate-400 mt-2">Suche nach Stichworten, um schnelle Hilfe zu finden.</p>
                        </div>

                        <div className="relative mb-8 max-w-2xl">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-11 pr-4 py-4 border border-slate-700 rounded-2xl bg-slate-800/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                                placeholder="Suche nach Problem oder Stichwort (z.B. 'Cron', 'UrBackup', 'Offline')..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {categories.map(cat => {
                            const entries = filteredEntries.filter(e => e.category === cat);
                            if (entries.length === 0) return null;
                            return (
                                <div key={cat} className="mb-8">
                                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4" />
                                        {cat}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {entries.map((entry, idx) => (
                                            <div
                                                key={idx}
                                                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 hover:bg-slate-800 transition-colors group"
                                            >
                                                <h4 className="text-base font-bold text-white mb-2 flex items-start gap-2">
                                                    <ChevronRight className="w-5 h-5 text-blue-500 shrink-0 mt-0.5 group-hover:translate-x-1 transition-transform" />
                                                    {entry.title}
                                                </h4>
                                                <p className="text-slate-300 text-sm leading-relaxed pl-7">
                                                    {entry.content}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {filteredEntries.length === 0 && (
                            <div className="text-center py-12 bg-slate-800/20 rounded-2xl border border-slate-700/50 border-dashed">
                                <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-400 text-lg">Keine Einträge für "{searchTerm}" gefunden.</p>
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="mt-4 text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors"
                                >
                                    Suche zurücksetzen
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Link to Manual */}
            <section>
                <Link to="/manual" className="group flex items-center justify-between bg-linear-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl p-6 hover:from-indigo-100 hover:to-blue-100 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 text-lg">Handbuch öffnen</p>
                            <p className="text-slate-500 text-sm mt-0.5">Detailliertes Benutzerhandbuch mit allen Konzepten, Schritt-für-Schritt-Anleitungen und PDF-Download.</p>
                        </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-indigo-400 group-hover:translate-x-1 transition-transform shrink-0" />
                </Link>
            </section>

        </div>
    );
}

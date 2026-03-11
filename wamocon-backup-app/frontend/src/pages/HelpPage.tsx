import { useState } from 'react';
import { LifeBuoy, ShieldCheck, Database, History, Info, BookOpen, Fingerprint, Search, ChevronRight } from 'lucide-react';

export default function HelpPage() {
    const [searchTerm, setSearchTerm] = useState('');

    const manualEntries = [
        {
            title: "Wie lege ich einen neuen Backup-Plan an?",
            content: "Gehe navigiere in der linken Seitenleiste auf 'Backup Plans' oder direkt in den 'Kalender'. Klicke auf 'Neuen Plan erstellen'. Wähle einen Titel, deine zuvor konfigurierte Quelle (z.B. lokaler Pfad) und das Ziel (z.B. Cloud-Speicher). Danach legst du einen Cron-Zeitplan für die Automatisierung fest.",
            keywords: ["job", "plan", "erstellen", "neu", "cron", "zeitplan", "kalender"]
        },
        {
            title: "Was hat es mit Quelle und Ziel auf sich?",
            content: "Die Quelle ist der Ordner oder das Laufwerk auf dem WAMOCON Mac Studio, das gesichert werden soll. Das Ziel ist oft ein rclone-Remote, z.B. 'wmc-onedrive:'. Diese Remotes müssen vorher über das Terminal auf dem Server konfiguriert werden ('rclone config').",
            keywords: ["quelle", "ziel", "rclone", "remote", "pfad", "wmc-onedrive"]
        },
        {
            title: "Was bedeutet die Cron-Syntax?",
            content: "Cron ist ein Standardformat für Zeitpläne. '* * * * *' steht für Minute, Stunde, Tag im Monat, Monat, und Wochentag. Beispiele: '0 20 * * *' bedeutet jeden Tag um 20:00 Uhr. '0 2 * * 0' bedeutet jeden Sonntag um 02:00 Uhr.",
            keywords: ["cron", "syntax", "zeitplan", "uhrzeit", "planung", "intervall"]
        },
        {
            title: "Wo sehe ich, ob ein Backup erfolgreich war?",
            content: "Auf der Seite 'Logs & Results' findest du ein ausführliches Protokoll aller bisherigen Ausführungen. Erfolgreiche Jobs sind grün markiert. Wenn ein Job rot markiert ist, klicke auf das Detail-Icon, um den genauen rclone-Output zur Fehlersuche einzusehen.",
            keywords: ["logs", "fehler", "erfolg", "resultate", "protokoll", "fehlgeschlagen"]
        },
        {
            title: "Was ist der Unterschied zwischen Sync und Copy?",
            content: "Sync (Voll/Spiegelung) macht das Ziel exakt gleich zur Quelle – Dateien, die in der Quelle gelöscht werden, verschwinden auch im Ziel. Copy (Inkrementell) fügt nur neue oder geänderte Dateien hinzu, löscht jedoch im Ziel niemals etwas. Für Cloud-Backups wird fast immer Copy empfohlen.",
            keywords: ["sync", "copy", "unterschied", "löschen", "inkrementell", "voll", "cloud"]
        },
        {
            title: "Wie ändere ich die Aufbewahrungsdauer (Retention)?",
            content: "Beim Bearbeiten eines Backup-Plans gibt es ein Feld 'Aufbewahrung (Tage)'. Wenn hier z.B. 30 eintragen wird, sorgt das System dafür, dass gelöschte Dateien aus der Quelle noch 30 Tage im Cloud-Papierkorb oder Backup-Ordner verbleiben (abhängig von der rclone und Ziel-Konfiguration).",
            keywords: ["retention", "aufbewahrung", "löschen", "tage", "papierkorb"]
        }
    ];

    const filteredEntries = manualEntries.filter(entry => {
        const term = searchTerm.toLowerCase();
        return (
            entry.title.toLowerCase().includes(term) ||
            entry.content.toLowerCase().includes(term) ||
            entry.keywords.some(k => k.toLowerCase().includes(term))
        );
    });

    return (
        <div className="animate-in fade-in duration-500 max-w-5xl mx-auto space-y-10 pb-12">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                    <LifeBuoy className="w-8 h-8 text-blue-500" />
                    Hilfe & Erklärungen
                </h1>
                <p className="mt-3 text-slate-500 text-lg leading-relaxed">
                    Willkommen im integrierten Handbuch des WAMOCON Backup Planers. Hier erfährst du alles Wichtige über die Funktionsweise des Systems, verschiedene Backup-Strategien und Best-Practices für maximale Datensicherheit.
                </p>
            </div>

            {/* Die 3-2-1 Regel */}
            <section id="rule-321" className="scroll-mt-28 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <ShieldCheck className="w-64 h-64 text-white" />
                </div>
                <div className="relative z-10">
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                        Die goldene 3-2-1 Backup Regel
                    </h2>
                    <p className="text-indigo-200 text-lg mb-8 max-w-3xl">
                        Um sich effektiv gegen Datenverlust (wie z.B. durch Ransomware, Hardware-Defekte oder Diebstahl) abzusichern, empfehlen IT-Experten die sogenannte 3-2-1 Regel:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl">
                            <div className="text-5xl font-black text-white mb-2 opacity-50">3</div>
                            <h3 className="text-lg font-bold text-white mb-2">Ausfertigungen</h3>
                            <p className="text-indigo-200 text-sm leading-relaxed">Bewahre immer mindestens drei Kopien deiner wichtigen Daten auf (1 Original + 2 Backups).</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl">
                            <div className="text-5xl font-black text-white mb-2 opacity-50">2</div>
                            <h3 className="text-lg font-bold text-white mb-2">Medien-Typen</h3>
                            <p className="text-indigo-200 text-sm leading-relaxed">Verwende mindestens zwei unterschiedliche Speichermedien (z.B. NAS / externe Festplatte + Cloud-Speicher).</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl">
                            <div className="text-5xl font-black text-white mb-2 opacity-50">1</div>
                            <h3 className="text-lg font-bold text-white mb-2">Offsite-Kopie</h3>
                            <p className="text-indigo-200 text-sm leading-relaxed">Lagere mindestens eine Kopie an einem anderen geografischen Ort (z.B. Microsoft OneDrive, Google Drive).</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Backup-Arten erklärt */}
            <section id="backup-types" className="scroll-mt-28">
                <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Database className="w-6 h-6 text-indigo-500" />
                    Welcher Backup-Typ ist der richtige?
                </h2>
                <div className="space-y-6">

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                            <Database className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Vollbackup (Full)</h3>
                            <p className="text-slate-600 mb-3 leading-relaxed">
                                Beim Vollbackup werden <strong>alle Ausgewählten Daten</strong> unabhängig davon, ob sie verändert wurden oder nicht, in das Zielverzeichnis kopiert.
                            </p>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-600">
                                <strong>Vorteile:</strong> Sehr sicher und einfach wiederherzustellen.<br />
                                <strong>Nachteile:</strong> Benötigt bei jedem Lauf viel Speicherplatz und Zeit, besonders bei großen Datenmengen in der Cloud.
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 border-l-4 border-l-blue-500 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                            <History className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Inkrementelles Backup <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded ml-2">Empfohlen für Cloud</span></h3>
                            <p className="text-slate-600 mb-3 leading-relaxed">
                                Dieses Backup kopiert <strong>nur die Dateien, die sich seit dem letzten Lauf geändert haben oder neu hinzugekommen sind</strong>.
                            </p>
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 text-sm text-slate-700">
                                <strong>Anwendungsfall:</strong> Dies ist die effizienteste Methode für den WAMOCON Planer, wenn Daten zu OneDrive oder Google Drive synchronisiert werden, da Bandbreite und Speicher extrem geschont werden.
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                        <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                            <Fingerprint className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Differenzielles Backup</h3>
                            <p className="text-slate-600 mb-3 leading-relaxed">
                                Speichert alle Änderungen, die seit dem <em>letzten Vollbackup</em> gemacht wurden. Es wächst also mit jedem Lauf an, bis wieder ein Vollbackup gemacht wird.
                            </p>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-600">
                                Wird seltener genutzt, ist oft ein Mittelweg zwischen der Geschwindigkeit des inkrementellen und der einfachen Wiederherstellung des Vollbackups.
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* FAQ / How to Use */}
            <section id="faq" className="scroll-mt-28">
                <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-indigo-500" />
                    Häufige Fragen zur App-Nutzung
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h4 className="font-bold text-slate-800 mb-2 flex items-start gap-2">
                            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                            Was bedeutet "Aufbewahrung (Retention)"?
                        </h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Die Aufbewahrung gibt an, wie viele Tage lang Backups vorgehalten werden sollen, bevor sie automatisiert gelöscht werden, um Speicherplatz zu sparen. Stellst du 30 Tage ein, bereinigt das System bei jedem Lauf alte Daten.
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h4 className="font-bold text-slate-800 mb-2 flex items-start gap-2">
                            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                            Wie lege ich die Quellen & Ziele an?
                        </h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Die im Dropdown angegebenen Quellen wie <code className="bg-slate-100 px-1 rounded">wmc-onedrive:</code> müssen zuvor im Kernsystem des MacStudio Servers über die rclone Kommandozeile (`rclone config`) eingerichtet und autorisiert worden sein.
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h4 className="font-bold text-slate-800 mb-2 flex items-start gap-2">
                            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                            Kann ich Jobs auch manuell ausführen?
                        </h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Ja! Auf dem Dashboard und unter "Backup Plans" kannst du über den "Starten"-Button jederzeit einen geplanten Lauf vorziehen und sofort auslösen.
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h4 className="font-bold text-slate-800 mb-2 flex items-start gap-2">
                            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                            Was passiert wenn ein Backup abbbricht?
                        </h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Fehlschläge werden in der Ansicht "Logs & Ergebnisse" mit rotem Status markiert. Zudem verschickt das System (sofern das SMTP Postfach richtig konfiguriert ist) automatisch eine Fehler-E-Mail.
                        </p>
                    </div>

                </div>
            </section>

            {/* UrBackup Integration Section */}
            <section id="urbackup" className="scroll-mt-28 bg-indigo-900 rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Database className="w-64 h-64 text-indigo-300" />
                </div>
                <div className="relative z-10">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                        Notebook-Sicherungen (UrBackup)
                    </h2>
                    <p className="text-indigo-200 text-lg mb-8 max-w-3xl">
                        Für die vollständige und inkrementelle Sicherung von Mitarbeiter-Notebooks (Windows & macOS) verwenden wir das eigenständige System <strong>UrBackup</strong>.
                    </p>

                    <div className="space-y-6">
                        {/* Step 1 Server */}
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl">
                            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                                <span className="bg-indigo-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                                Server auf dem Mac Studio aufsetzen
                            </h3>
                            <p className="text-indigo-100 mb-4 text-sm leading-relaxed">
                                Da UrBackup nativ primär für Linux/Windows Server gedacht ist, betreiben wir ihn auf dem Mac Studio über <strong>Docker</strong> (empfohlen: OrbStack oder Docker Desktop). Nutze folgende <code>docker-compose.yml</code> um den Container zu starten:
                            </p>
                            <pre className="bg-slate-900/50 p-4 rounded-xl text-xs font-mono text-indigo-300 overflow-x-auto border border-white/10">
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
      - /path/to/mac/storage/backup:/backups
      - /path/to/mac/storage/database:/var/urbackup
    # Standard-Ports für Web-Interface und Client-Backups
    ports:
      - "55413-55415:55413-55415"
      - "35623:35623/udp"`}
                            </pre>
                            <p className="text-indigo-200 text-xs mt-3">Tipp: Ersetze die <code>/path/to/mac/storage/...</code> Pfade mit den echten Verzeichnissen oder externen Festplatten an deinem Mac Studio.</p>
                        </div>

                        {/* Step 2 Clients */}
                        <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl">
                            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                                <span className="bg-indigo-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                                Endgeräte (Clients) verbinden
                            </h3>
                            <ul className="list-disc pl-5 text-indigo-100 text-sm space-y-2 leading-relaxed">
                                <li>Lade den offiziellen Client für Windows oder macOS herunter: <a href="https://www.urbackup.org/download.html" target="_blank" rel="noreferrer" className="text-blue-300 hover:text-white underline outline-none">Download Seite</a>.</li>
                                <li>Installiere den Client auf dem entsprechenden Notebook.</li>
                                <li>Während der Installation sucht der Client (im selben LAN) automatisch nach dem passenden UrBackup Server.</li>
                                <li><strong>Internet-Backups:</strong> Damit Backups auch im Homeoffice funktionieren, muss in den Server-Einstellungen eine öffentliche IP / Domain oder ein internes VPN konfiguriert sein, die der Client erreichen kann.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Handbuch & Suche */}
            <section id="manual" className="scroll-mt-28 pb-12">
                <div className="bg-slate-900 rounded-3xl p-8 sm:p-10 shadow-xl overflow-hidden relative">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                                <BookOpen className="w-8 h-8 text-blue-400" />
                                Integriertes Handbuch
                            </h2>
                            <p className="text-slate-400 mt-2 text-lg">Suche nach Stichworten, um schnelle Hilfe zu bestimmten App-Funktionen zu finden.</p>
                        </div>

                        <div className="relative mb-10 max-w-2xl">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-11 pr-4 py-4 border border-slate-700 rounded-2xl leading-5 bg-slate-800/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-slate-800 transition-all font-medium"
                                placeholder="Suche in Anleitungen (z.B. 'Cron', 'Quelle', 'Zeitplan')..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredEntries.length > 0 ? (
                                filteredEntries.map((entry, idx) => (
                                    <div key={idx} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800 transition-colors group">
                                        <h3 className="text-lg font-bold text-white mb-3 flex items-start gap-2">
                                            <ChevronRight className="w-5 h-5 text-blue-500 shrink-0 mt-0.5 group-hover:translate-x-1 transition-transform" />
                                            {entry.title}
                                        </h3>
                                        <p className="text-slate-300 text-sm leading-relaxed pl-7">
                                            {entry.content}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-1 md:col-span-2 text-center py-12 bg-slate-800/20 rounded-2xl border border-slate-700/50 border-dashed">
                                    <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                    <p className="text-slate-400 text-lg">Keine passenden Anleitungen für "{searchTerm}" gefunden.</p>
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
                </div>
            </section>

        </div>
    );
}

import { LifeBuoy, ShieldCheck, Database, History, Info, BookOpen, Fingerprint } from 'lucide-react';

export default function HelpPage() {
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
            <section className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden">
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
            <section>
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
            <section>
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

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h4 className="font-bold text-slate-800 mb-2 flex items-start gap-2">
                            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                            Kann ich Jobs auch manuell ausführen?
                        </h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Ja! Auf dem Dashboard und unter "Backup Plans" kannst du über den "Starten"-Button jederzeit einen geplanten Lauf vorziehen und sofort auslösen.
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
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

        </div>
    );
}

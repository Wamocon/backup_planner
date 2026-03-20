# Lessons Learned – WAMOCON Backup Planner

> Wird nach jeder Korrektur durch den User aktualisiert.
> Ziel: Gleiche Fehler nie zweiter Mal machen.

---

## L-01 · Scope Creep ohne Plan-Modus (20.03.2026)

**Was passierte:**  
Features wie `CalendarPage`, `DevicesPage`, `macstudio/`, `urbackup/`, `ManualPage`, `HelpPage`, `ArchitecturePage` und der GoBD-Backup-Typ wurden implementiert — obwohl das Briefing (Abschnitt 14) diese explizit für v1.0 ausgeschlossen hat.

**Ursache:**  
Kein `tasks/todo.md` geführt. Kein Plan-Modus aktiviert. Features wurden direkt implementiert ohne vorherige Prüfung gegen den MVP-Scope.

**Regel für die Zukunft:**
- Vor jeder Implementierung: Briefing Abschnitt 14 prüfen ("Was NICHT in v1.0")
- Jede neue Komponente / jedes neue Modul gegen `tasks/todo.md` abgleichen
- Scope-Erweiterungen nur nach expliziter Bestätigung durch den User

---

## L-02 · Kein Task-Tracking geführt (20.03.2026)

**Was passierte:**  
`tasks/todo.md` und `tasks/lessons.md` existierten nicht. Kein Fortschritt dokumentiert, keine Planung nachvollziehbar.

**Regel für die Zukunft:**
- Jede Session beginnt mit: `tasks/todo.md` öffnen und lesen
- Vor dem Start einer Aufgabe: als "in Bearbeitung" markieren
- Direkt nach Abschluss: abhaken (`[x]`) — nie verzögert
- Nach User-Korrekturen: sofort hier in `lessons.md` eintragen

---

## L-03 · Keine Tests geschrieben (20.03.2026)

**Was passierte:**  
Null Test-Dateien im gesamten Projekt. Kein Unit-, Integration- oder E2E-Test. Das Briefing nennt explizit Tests für `auth.service`, `backup.service`, `rclone.service` (Tag 4).

**Regel für die Zukunft:**
- Kein Modul als "fertig" markieren ohne mindestens einen Unit-Test für den Happy Path
- Test-Dateiname: `<modul>.test.js` neben der Quelldatei
- Workflow: Code → Test schreiben → `node --test` ausführen → dann abhaken

---

## L-04 · Architektur-Abweichung nicht dokumentiert (20.03.2026)

**Was passierte:**  
SQLite wurde durch Supabase/PostgreSQL ersetzt, Hosting von lokal zu Vercel+Cloudflare geändert — beides ohne Eintrag in ein Architektur-Log. Diese Information wurde erst im Briefing-Update (Abschnitt 16) nachgereicht.

**Regel für die Zukunft:**
- Bewusste Architektur-Abweichungen sofort in `tasks/todo.md` unter "Review-Notizen" festhalten
- Änderungen, die das Briefing betreffen, im Briefing-Dokument selbst im Abschnitt "Aktueller Status" ergänzen

---

## L-05 · Backend-Startfehler lokal (Windows) nicht root-caused (20.03.2026)

**Was passierte:**  
`node src/index.js` schlug wiederholt fehl (Exit Code 1). Es wurde weiter versucht ohne den Fehler zu analysieren.

**Regel für die Zukunft:**
- Bei Exit Code ≠ 0: zuerst stderr/stdout lesen, bevor erneut gestartet wird
- Root Cause identifizieren (fehlende `.env`-Variablen, Abhängigkeiten, etc.) bevor retry
- Nie gleichen Befehl dreimal in Folge ohne Änderung wiederholen

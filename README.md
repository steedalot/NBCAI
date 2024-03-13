# NBCAI: Erweiterung der NBC um einen KI-Tutor

Dieses Userscript ist als technisches Entwicklungs- und Testsystem für die Niedersächische Bildungscloud (NBC) konzipiert. Es fügt eine Reihe von Funktionen hinzu, um die Interaktion mit dem KI-Tutor zu testen.

## Hauptfunktionen

1. **Preflight-Tests**: Überprüft die Verbindung und holt wichtige Informationen wie den Authentifizierungstoken, Benutzerdaten und die Board-ID.

2. **Systemvorbereitung**: Ruft wichtige Daten ab und speichert sie für die spätere Verwendung. Es registriert auch zusätzliche Menübefehle für das Starten des Overlays und das Testen des Systems.

3. **Modal Overlay**: Erstellt ein Modal-Overlay mit einem Chat-Interface, das es dem Benutzer ermöglicht, mit dem AI-Assistenten zu interagieren und Prompts und andere Einstellungen zu wählen.

Das Skript verwendet GM_xmlhttpRequest für API-Anfragen und manipuliert das DOM, um neue Elemente hinzuzufügen und bestehende zu ändern. Es verwendet auch Promises und asynchrone Funktionen, um sicherzustellen, dass alle notwendigen Daten abgerufen werden, bevor sie verwendet werden.
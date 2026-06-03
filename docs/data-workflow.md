# Adatfeldolgozási workflow

1. Forrás lokálisan vagy zöld zónában marad.
2. Hermes kivonatolja a releváns állításokat `extractions.json` formátumba.
3. Csak forrással bizonyított, tájegységhez köthető állítás kerül `atlas-data.json` adatjelöltként.
4. A UI-ban `pending_human_review` státusszal jelenik meg.
5. Jóváhagyás után a státusz `approved` lehet.

## Fontos szabály

Teljes könyv/PDF/OCR szöveg nem kerül public repóba. A repo csak strukturált kivonatokat, rövid idézeteket, forrásmetaadatot és review státuszt tartalmaz.

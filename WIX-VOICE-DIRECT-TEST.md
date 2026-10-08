# Manager Bottega: test dettatura direttamente nei campi Wix (V3)

**Stato:** sperimentale. Nessuna stampa e nessun invio automatico.
La vista standard NON cambia: il pannello vocale appare solo con `?voice-test=1` su Google Chrome.

## Architettura

```
Dashboard GitHub Pages (top-level, microfono Web Speech API)
  └── iframe: https://www.molinosantamarta.it/ordini-bottega
       ├── Wix Forms V2 (ordini 2026)
       ├── Velo, codice della pagina: integrations/wix-voice-page.js
       └── HTML Embed #htmlVoiceBridge: integrations/wix-voice-bridge.html
```

Non tentiamo mai di leggere direttamente i campi Wix dall'iframe GitHub (same-origin policy).
L'HTML Embed trasporta messaggi verso Velo tramite `postMessage` / `onMessage`.
La pagina Wix autorizza il collegamento al contenitore GitHub con il suo messaggio
`wixWindowFrontend.postMessage`. La dashboard accetta il canale solo dopo aver
verificato che l'approvazione arrivi dall'iframe Wix corretto.
L'audio viene riconosciuto tramite il servizio vocale del browser: **non è locale** e
il servizio non garantisce disponibilità e uso illimitato. Non ci sono API a pagamento configurate.

## Modulo individuato (lettura dello schema, senza dati clienti)

Il sito Wix collegato include `Ordini Bottega 2026 (nuovo)`,
ID schema `84af8f28-4f17-4b14-ab5d-714c22b1a8fb`.

| Reparto nel selettore | Wix Forms V2 field key | Etichetta di tag |
|---|---|---|
| Pane | `risposta_lunga_f2ce` | `PANE` |
| Banco | `form_field` | `BANCO` |
| Frutta e verdura | `form_field_1` | `FRUTTA & VERDURA` |
| Carne | `form_field_2` | `CARNE` |
| Altro | `form_field_3` | `ALTRO` |
| Note | `note_sull_ordine` | nessun tag |

Il campo dei tag è `selettore_tag_e443`. La pagina Velo seleziona il
reparto se necessario, attende la visualizzazione dei campi condizionali,
quindi **accoda** il testo, senza sovrascrivere ciò che c'è già.
Il salvataggio originale Wix non viene alterato.

## Due interventi nell'Editor Wix (manuali, perché il connettore Wix non modifica il codice delle pagine)

1. Aprire l'Editor Wix del sito Molino Santa Marta, pagina `/ordini-bottega`. Velo risulta già attivo.
2. Selezionare il componente **nuovo Wix Form**; in Proprietà e Eventi
   leggere il suo ID elemento. È spesso `#form1`, **non** è l'ID dello schema UUID.
3. Aggiungere un elemento **Incorpora HTML** (non un secondo modulo Wix),
   mettere il suo ID Velo a `htmlVoiceBridge`.
   Lasciare l'elemento effettivamente caricato nel DOM, anche se piccolissimo
   (ad es. 2×2 px in un angolo); non nasconderlo con `collapse()`.
4. In "Inserisci codice" dell'elemento HTML incollare tutto il file
   **[integrations/wix-voice-bridge.html](integrations/wix-voice-bridge.html)**.
5. Nel codice **della sola pagina** `/ordini-bottega`, integrare
   **[integrations/wix-voice-page.js](integrations/wix-voice-page.js)**.
   Sostituire `#form1` col vero ID del modulo.
   Se c'è un altro `$w.onReady()`, non eliminarlo; unificare il contenuto
   mantenendo gli handler preesistenti.
6. Pubblicare la pagina Wix.

**IMPORTANTE**: il connettore Wix può leggere lo schema ma non può salvare
questi due pezzi nel codice editor. Un operatore con accesso all'Editor deve
applicare i punti 1–6.

## Prova, SENZA usare ordini reali

Aprire in Chrome su Mac, da pagina HTTPS:

`https://molinosantamarta.github.io/bottega-master/master.html?voice-test=1#inserisci`

1. Pulsante **Dettatura TEST** in basso a destra.
2. **Avvia dettatura** → dettare un ordine **inventato** → **Termina dettatura**.
3. Verificare il testo. Selezionare **Carne** e premere
   **Inserisci nel campo selezionato**.
4. Controllare visivamente che sia comparso **solo** in `4) CARNE`,
   che il tag `CARNE` sia attivo e che il testo precedente sia preservato.
5. Ripetere con **Frutta e verdura** e **Note**.
6. **NON premere Invia** sul modulo Wix durante la prova: non devono essere
   creati ordini o attivate le automazioni.

Se appare `In attesa del collegamento Wix`, verificare che HTML Embed e Velo
siano pubblicati, gli ID corrispondano e non vi siano errori nella console.
Finché il ponte non risponde resta disponibile **Copia testo**.

## Controlli da fare prima dell'uso reale

- Chrome autorizza il microfono nel sito GitHub Pages.
- `wixWindowFrontend.postMessage` raggiunge realmente la dashboard
  attraverso l'iframe nel browser e nell'URL di produzione.
- L'HTML Embed riceve i messaggi nella pagina Wix pubblicata.
- `setFieldValues()` gestisce tag e campi condizionali anche quando
  inizialmente non sono visualizzati.
- Il test con testo già presente lo **accoda** senza perderlo.
- Non fare doppio click se la richiesta risulta `esito non confermato`:
  prima controllare il campo, per evitare ordini doppi.

## Come disattivare

La funzione lato GitHub è disattivata per impostazione predefinita:
senza `?voice-test=1` non appare alcuna UI e non registra audio.
Per rimuovere del tutto il ponte, eliminare HTML Embed e codice Velo
aggiunti alla pagina, e rimuovere `voice-wix-bridge.js` da `master.html`.
Nessuna migrazione di dati richiesta.

## Documentazione di riferimento

- [WixFormsV2 setFieldValues](https://dev.wix.com/docs/velo/velo-only-apis/$w/wix-forms-v2/set-field-values)
- [WixFormsV2 getFieldValues](https://dev.wix.com/docs/velo/velo-only-apis/$w/wix-forms-v2/get-field-values)
- [HTML Component messaging](https://dev.wix.com/docs/velo/velo-only-apis/$w/html-component/messaging-between-a-site-page-and-an-html-element)
- [Wix Window frontend postMessage](https://dev.wix.com/docs/velo/apis/wix-window-frontend/post-message)

# Esperimento dettatura vocale (opt-in)

Questa prova NON modifica Wix Forms, Google Sheets, gli ordini o la stampa.

## Come provarla
1. Usa Google Chrome aggiornato su macOS e apri il gestionale via HTTPS.
2. Aggiungi `?voice-test=1` all'URL di `master.html`, prima dell'eventuale `#inserisci`.
3. Apri la scheda **Inserisci**.
4. Clicca su **Dettatura TEST** in basso a destra e autorizza il microfono.
5. Clicca **Avvia dettatura**, parla in italiano, quindi **Termina dettatura**.
6. Verifica e correggi manualmente il testo, premi **Copia testo** e incolla nel campo corretto del modulo Wix con `⌘V`.

Per un URL GitHub Pages standard, esempio:
`https://molinosantamarta.github.io/bottega-master/master.html?voice-test=1#inserisci`

**Importante:** l'esempio presuppone che GitHub Pages pubblichi il branch `main`; verificare l'URL effettivo del sito. La feature resta invisibile senza `?voice-test=1`.

## Limiti e privacy
- La Web Speech API non è disponibile in tutti i browser; Chrome può inviare l'audio a un proprio servizio di riconoscimento vocale. Non equivale a una trascrizione locale.
- Il servizio non ha una garanzia contrattuale di gratuità o disponibilità illimitata per uso commerciale: è una prova con l'API offerta dal browser, senza costi API configurati nel gestionale.
- Il testo rimane soltanto in memoria nel browser, senza backup. Se ricarichi la pagina lo perdi.
- Il codice genitore non può scrivere nei campi dell'iframe Wix cross-origin. In questa versione si usa **Copia + Incolla**.
- Non dettare dati personali dei clienti in fase di test; preferire ordini inventati.
- La voce viene fermata cambiando scheda o mandando il browser in background; potrebbero servire permessi microfono al primo utilizzo.

## Criteri di prova
Confrontare 10 ordini inventati o anonimizzati, manuale vs dettatura, per:
- tempo totale fino al testo corretto;
- errori su quantità, prodotti e unità;
- facilità d'uso con rumore alla cassa;
- riconoscimento di termini alimentari italiani.

## Rimozione
Rimuovere le due inclusioni `voice-dictation-test.css` e `voice-dictation-test.js` da `master.html` (o ripristinare il commit precedente). Nessun dato migrato o schema alterato.

/* Esperimento opt-in: ?voice-test=1#inserisci
 * Non modifica moduli Wix, Google Sheets o ordini: testo solo in memoria della pagina.
 */
(() => {
  'use strict';
  if (new URLSearchParams(location.search).get('voice-test') !== '1') return;

  function initVoiceTest() {
    const insertView = document.getElementById('view-inserisci');
    if (!insertView || document.getElementById('voice-test-root')) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const root = document.createElement('div');
    root.id = 'voice-test-root';
    root.innerHTML = `
      <button type="button" class="voice-test-launch" aria-expanded="false" aria-controls="voice-test-panel" title="Prova la dettatura gratuita">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5m-4 0h8"/></svg>
        <span>Dettatura <small>TEST</small></span>
      </button>
      <section id="voice-test-panel" class="voice-test-panel" role="dialog" aria-labelledby="voice-test-heading" aria-modal="false" hidden>
        <div class="voice-test-head">
          <div><h2 id="voice-test-heading">Detta l'ordine</h2><p>Prova gratuita · italiano</p></div>
          <button type="button" class="voice-test-close" aria-label="Chiudi dettatura" title="Chiudi">×</button>
        </div>
        <p class="voice-test-info">La trascrizione è modificabile. Non salva ordini e non modifica Wix.</p>
        <label class="voice-test-label" for="voice-test-text">Testo dell'ordine</label>
        <textarea id="voice-test-text" rows="6" spellcheck="true" placeholder="Premi Avvia e detta, oppure scrivi qui."></textarea>
        <p class="voice-test-status" id="voice-test-status" role="status" aria-live="polite">Pronto per la dettatura.</p>
        <div class="voice-test-actions">
          <button type="button" class="voice-test-record">Avvia dettatura</button>
          <button type="button" class="voice-test-copy" disabled>Copia testo</button>
        </div>
        <p class="voice-test-footnote">Dopo aver copiato, incolla nel campo del modulo Wix. Chrome può inviare l'audio al proprio servizio vocale: non dettare dati sensibili durante la prova.</p>
      </section>`;
    document.body.appendChild(root);

    const launch = root.querySelector('.voice-test-launch');
    const panel = root.querySelector('.voice-test-panel');
    const close = root.querySelector('.voice-test-close');
    const record = root.querySelector('.voice-test-record');
    const copy = root.querySelector('.voice-test-copy');
    const textarea = root.querySelector('textarea');
    const status = root.querySelector('.voice-test-status');

    let recognition = null;
    let listening = false;
    let recognitionError = false;

    function setStatus(message, isError = false) {
      status.textContent = message;
      status.classList.toggle('is-error', isError);
    }
    function updateCopy() {
      copy.disabled = !textarea.value.trim();
    }
    function updateRecordingUI() {
      record.textContent = listening ? 'Termina dettatura' : 'Avvia dettatura';
      record.classList.toggle('is-recording', listening);
      record.setAttribute('aria-pressed', String(listening));
      textarea.readOnly = listening; // Evita sovrascritture mentre arrivano risultati intermedi.
    }
    function stopRecognition(discard = false) {
      if (!recognition) return;
      try {
        if (discard) recognition.abort();
        else recognition.stop();
      } catch (_) { /* sessione già terminata */ }
    }
    function hidePanel() {
      stopRecognition(true);
      panel.hidden = true;
      launch.setAttribute('aria-expanded', 'false');
      launch.focus();
    }
    function syncVisibility() {
      const active = insertView.classList.contains('active') && !insertView.hidden;
      root.hidden = !active;
      if (!active && !panel.hidden) {
        stopRecognition(true);
        panel.hidden = true;
        launch.setAttribute('aria-expanded', 'false');
      }
    }

    launch.addEventListener('click', () => {
      if (!panel.hidden) { hidePanel(); return; }
      panel.hidden = false;
      launch.setAttribute('aria-expanded', 'true');
      if (!SpeechRecognition) {
        record.disabled = true;
        setStatus('Riconoscimento vocale non disponibile. Prova con Google Chrome aggiornato.', true);
      }
      textarea.focus();
    });
    close.addEventListener('click', hidePanel);
    textarea.addEventListener('input', updateCopy);

    record.addEventListener('click', () => {
      if (listening) { setStatus('Termino la dettatura…'); stopRecognition(); return; }
      if (!SpeechRecognition) {
        setStatus('Browser non compatibile con la Web Speech API.', true);
        return;
      }
      const base = textarea.value.trimEnd();
      const separator = base ? '\n' : '';
      let session = null;
      try {
        session = new SpeechRecognition();
        session.lang = 'it-IT';
        session.interimResults = true;
        session.continuous = true;
        session.maxAlternatives = 1;
        recognitionError = false;

        session.onstart = () => {
          if (recognition !== session) return;
          listening = true;
          updateRecordingUI();
          setStatus('Ascolto attivo. Parla chiaramente; premi Termina quando hai finito.');
        };
        session.onresult = (event) => {
          if (recognition !== session) return;
          let finalText = '';
          let interimText = '';
          for (let i = 0; i < event.results.length; i++) {
            const spoken = event.results[i][0]?.transcript?.trim() || '';
            if (!spoken) continue;
            if (event.results[i].isFinal) finalText += (finalText ? ' ' : '') + spoken;
            else interimText += (interimText ? ' ' : '') + spoken;
          }
          textarea.value = base + separator + [finalText, interimText].filter(Boolean).join(' ');
          updateCopy();
        };
        session.onerror = (event) => {
          if (recognition !== session) return;
          recognitionError = true;
          const messages = {
            'not-allowed': 'Microfono negato: autorizza il sito nelle impostazioni del browser.',
            'service-not-allowed': 'Servizio vocale non autorizzato nel browser.',
            'no-speech': 'Nessuna voce rilevata. Riprova.',
            'audio-capture': 'Nessun microfono disponibile. Controlla il collegamento.',
            'network': 'Problema di rete del servizio vocale. Riprova.'
          };
          setStatus(messages[event.error] || 'Dettatura non riuscita: ' + event.error, true);
        };
        session.onend = () => {
          if (recognition !== session) return;
          recognition = null;
          listening = false;
          updateRecordingUI();
          if (!recognitionError && !panel.hidden) {
            setStatus(textarea.value.trim() ? 'Dettatura conclusa. Controlla il testo e copialo.' : 'Nessun testo riconosciuto. Riprova.');
          }
        };
        recognition = session;
        session.start();
        record.disabled = true; // impedisce doppio avvio mentre si attende onstart
        setTimeout(() => { if (recognition === session) record.disabled = false; }, 750);
      } catch (_) {
        recognition = null;
        listening = false;
        record.disabled = false;
        updateRecordingUI();
        setStatus('Impossibile avviare la dettatura. Controlla i permessi del microfono.', true);
      }
    });

    copy.addEventListener('click', async () => {
      const text = textarea.value;
      if (!text.trim()) return;
      try {
        if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
        await navigator.clipboard.writeText(text);
      } catch (_) {
        textarea.readOnly = false;
        textarea.focus();
        textarea.select();
        if (!document.execCommand('copy')) {
          setStatus('Copia non disponibile: seleziona il testo e premi ⌘C.', true);
          return;
        }
      }
      setStatus('Testo copiato. Incollalo nel modulo Wix con ⌘V.');
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !panel.hidden) hidePanel();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopRecognition();
    });
    new MutationObserver(syncVisibility).observe(insertView, { attributes: true, attributeFilter: ['class', 'hidden'] });
    syncVisibility();
    updateCopy();
    updateRecordingUI();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initVoiceTest);
  else initVoiceTest();
})();

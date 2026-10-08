/* Opt-in Wix Forms V2 bridge for ?voice-test=1.
 * Voice transcription remains local to the browser page until the operator
 * explicitly chooses a department and clicks Insert.
 * The trusted Wix page must approve an HTML component session before text
 * can be sent to that component. No automatic form submission.
 */
(() => {
  'use strict';
  if (new URLSearchParams(location.search).get('voice-test') !== '1') return;

  const CHANNEL = 'bottega:voice:v3';
  const WIX_ORIGIN = 'https://www.molinosantamarta.it';
  const DEPARTMENTS = [
    ['pane', 'Pane e prodotti da forno'],
    ['banco', 'Banco gastronomia'],
    ['ortofrutta', 'Frutta e verdura'],
    ['carne', 'Carne'],
    ['altro', 'Altro'],
    ['note', "Note sull'ordine"]
  ];

  function initialize() {
    const root = document.getElementById('voice-test-root');
    const view = document.getElementById('view-inserisci');
    const wixFrame = view?.querySelector('iframe');
    if (!root || !view || !wixFrame || root.querySelector('.voice-test-insert')) return;

    const actions = root.querySelector('.voice-test-actions');
    const textarea = root.querySelector('#voice-test-text');
    const copy = root.querySelector('.voice-test-copy');
    if (!actions || !textarea || !copy) return;

    const wrap = document.createElement('div');
    wrap.className = 'voice-test-transfer';
    wrap.innerHTML = `
      <label for="voice-test-department">Inserisci nel campo Wix</label>
      <select id="voice-test-department" aria-describedby="voice-test-bridge-status">
        ${DEPARTMENTS.map(([id, label]) => `<option value="${id}">${label}</option>`).join('')}
      </select>
      <p id="voice-test-bridge-status" class="voice-test-bridge-status" role="status" aria-live="polite">
        Collegamento al modulo Wix non ancora configurato. Puoi usare Copia testo.
      </p>
      <button type="button" class="voice-test-insert" disabled>Inserisci nel campo selezionato</button>
    `;
    actions.after(wrap);

    const department = wrap.querySelector('select');
    const insert = wrap.querySelector('.voice-test-insert');
    const bridgeStatus = wrap.querySelector('.voice-test-bridge-status');

    const candidates = new Map();
    const approvals = new Map();
    let trustedBridge = null;
    let pending = null;
    let timeoutId = null;

    function showState(message, failed = false) {
      bridgeStatus.textContent = message;
      bridgeStatus.classList.toggle('is-error', failed);
    }
    function syncButton() {
      insert.disabled = !trustedBridge || !textarea.value.trim() || textarea.readOnly || !!pending;
    }
    function validSession(session) {
      return typeof session === 'string' && /^[a-f0-9-]{36}$/i.test(session);
    }
    function chooseBridge(session) {
      const candidate = candidates.get(session);
      const approved = approvals.get(session);
      if (!candidate || !approved) return;
      if (Date.now() - candidate.time > 45000 || Date.now() - approved > 45000) return;
      trustedBridge = { ...candidate, session };
      showState('Collegato al modulo Wix. Scegli un reparto e inserisci il testo.');
      syncButton();
    }
    function clearBridge() {
      trustedBridge = null;
      candidates.clear();
      approvals.clear();
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = null;
      pending = null;
      showState('In attesa del collegamento Wix. Copia testo rimane disponibile.');
      syncButton();
    }

    window.addEventListener('message', (event) => {
      const data = event.data;
      if (!data || data.channel !== CHANNEL || !validSession(data.session)) return;
      const isFromWixPage = event.origin === WIX_ORIGIN && event.source === wixFrame.contentWindow;

      if (data.action === 'hello' && event.source && event.origin.startsWith('https://') && event.origin !== WIX_ORIGIN) {
        // Not trusted until the actual Wix iframe confirms the same random session.
        candidates.set(data.session, { source: event.source, origin: event.origin, time: Date.now() });
        if (candidates.size > 32) candidates.delete(candidates.keys().next().value);
        chooseBridge(data.session);
      } else if (data.action === 'approved' && isFromWixPage) {
        approvals.set(data.session, Date.now());
        if (approvals.size > 32) approvals.delete(approvals.keys().next().value);
        chooseBridge(data.session);
      } else if (data.action === 'result' && trustedBridge && pending &&
                 event.source === trustedBridge.source && event.origin === trustedBridge.origin &&
                 data.session === trustedBridge.session && data.requestId === pending.requestId) {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = null;
        pending = null;
        showState(data.ok
          ? 'Testo trasferito al modulo Wix. Controlla il campo prima di salvare.'
          : (data.error || 'Inserimento non riuscito: usa Copia testo.'), !data.ok);
        syncButton();
      }
    });

    wixFrame.addEventListener('load', clearBridge);

    insert.addEventListener('click', () => {
      if (insert.disabled || !trustedBridge) return;
      const text = textarea.value.trim();
      if (!text) return;
      const requestId = crypto.randomUUID();
      pending = { requestId, text, department: department.value };
      syncButton();
      showState('Invio del testo al campo selezionato…');
      try {
        trustedBridge.source.postMessage({
          channel: CHANNEL,
          action: 'fill',
          session: trustedBridge.session,
          requestId,
          department: department.value,
          text
        }, trustedBridge.origin);
      } catch (_) {
        pending = null;
        showState('Non riesco a contattare Wix. Usa Copia testo.', true);
        syncButton();
        return;
      }
      timeoutId = setTimeout(() => {
        timeoutId = null;
        pending = null;
        showState('Esito non confermato: controlla il campo Wix prima di riprovare, per evitare duplicati.', true);
        syncButton();
      }, 9000);
    });

    textarea.addEventListener('input', syncButton);
    department.addEventListener('change', syncButton);
    new MutationObserver(syncButton).observe(copy, { attributes: true, attributeFilter: ['disabled'] });
    new MutationObserver(syncButton).observe(textarea, { attributes: true, attributeFilter: ['readonly'] });
    syncButton();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();
})();

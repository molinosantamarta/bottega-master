// Incolla questo codice nella PAGINA Wix /ordini-bottega (Velo).
// Non sostituire altri handler $w.onReady già presenti: integra la logica nel
// loro interno, oppure mantieni questo unico $w.onReady aggiuntivo.
// Adatta gli ID #form1 e #htmlVoiceBridge a quelli mostrati nell'editor.
import wixWindowFrontend from 'wix-window-frontend';

const VOICE_CHANNEL = 'bottega:voice:v3';
const FIELD_MAP = Object.freeze({
  pane:       { key: 'risposta_lunga_f2ce', tag: 'PANE' },
  banco:      { key: 'form_field', tag: 'BANCO' },
  ortofrutta: { key: 'form_field_1', tag: 'FRUTTA & VERDURA' },
  carne:      { key: 'form_field_2', tag: 'CARNE' },
  altro:      { key: 'form_field_3', tag: 'ALTRO' },
  note:       { key: 'note_sull_ordine', tag: null }
});
const DEPARTMENT_TAG_KEY = 'selettore_tag_e443';

$w.onReady(() => {
  const form = $w('#form1'); // Controlla l'ID elemento del Wix Forms V2 in editor.
  const bridge = $w('#htmlVoiceBridge'); // ID HTML Embed da aggiungere alla pagina.
  const sessions = new Set();
  const handled = new Set();

  bridge.onMessage(async (event) => {
    const data = event.data;
    if (!data || data.channel !== VOICE_CHANNEL) return;
    if (typeof data.session !== 'string' || !/^[a-f0-9-]{36}$/i.test(data.session)) return;

    if (data.action === 'probe') {
      sessions.add(data.session);
      if (sessions.size > 32) sessions.delete(sessions.values().next().value);
      // Il messaggio al genitore GitHub parte direttamente dalla pagina Wix,
      // permettendogli di verificare l'origine prima di condividere il testo.
      wixWindowFrontend.postMessage({
        channel: VOICE_CHANNEL, action: 'approved', session: data.session
      }, 'parent');
      return;
    }

    if (data.action !== 'fill' || !sessions.has(data.session)) return;
    if (typeof data.requestId !== 'string' || !/^[a-f0-9-]{36}$/i.test(data.requestId)) return;
    if (handled.has(data.requestId)) return;
    const field = FIELD_MAP[data.department];
    const text = typeof data.text === 'string' ? data.text.trim() : '';
    if (!field || !text || text.length > 5000) return;
    handled.add(data.requestId);
    if (handled.size > 100) handled.delete(handled.values().next().value);

    try {
      const previous = form.getFieldValues() || {};
      const oldText = typeof previous[field.key] === 'string' ? previous[field.key] : '';
      const combined = oldText ? oldText.replace(/\s+$/, '') + '\n' + text : text;

      // Per le sezioni condizionali, prima abilita il reparto.
      if (field.tag) {
        const selected = Array.isArray(previous[DEPARTMENT_TAG_KEY]) ? previous[DEPARTMENT_TAG_KEY] : [];
        if (!selected.includes(field.tag)) {
          form.setFieldValues({ [DEPARTMENT_TAG_KEY]: [...selected, field.tag] });
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      form.setFieldValues({ [field.key]: combined });
      // Verifica che il testo sia effettivamente presente nel form.
      await new Promise(resolve => setTimeout(resolve, 250));
      if (form.getFieldValues()?.[field.key] !== combined) {
        throw new Error('Il campo non contiene la trascrizione attesa');
      }

      // Nessun submit. La persona verifica il testo e clicca Invia manualmente.
      bridge.postMessage({
        channel: VOICE_CHANNEL, action: 'result', session: data.session,
        requestId: data.requestId, ok: true
      });
    } catch (error) {
      bridge.postMessage({
        channel: VOICE_CHANNEL, action: 'result', session: data.session,
        requestId: data.requestId, ok: false,
        error: 'Impossibile aggiornare il modulo. Usa Copia testo.'
      });
    }
  });
});

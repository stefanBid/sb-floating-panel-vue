# Piano v3.0.0 — sb-floating-panel-vue

> File di contesto per riprendere il lavoro in una nuova sessione.
> Creato il 2026-10-18. Stato al 2026-10-19: **fasi 1–4 implementate sul branch `feat/v3-components-api`** (non committate). Lint, type check, 19 test e build verdi. Restano: verifica a mano nel browser del playground, commit e PR `feat!:`.

## 1. Contesto

- Libreria Vue 3 + TypeScript, build Vite 8 (lib mode), `vite-plugin-dts` 5, TypeScript 6.
- Versioni installate verificate: `@floating-ui/vue` **2.0.1**, `@floating-ui/dom` e `@floating-ui/core` **1.8.0**.
- Versione pubblicata: **2.0.0**. Release gestite da release-please (conventional commits, titolo PR lintato in CI).
- `CLAUDE.md` non è aggiornato: dice "Vite 6, @floating-ui/vue 1, vite-plugin-dts 4 / upgrade in progress", ma `package.json` è già su Vite 8, floating-ui 2 e dts 5. Va corretto.
- Fix `rootDir` per TypeScript 6 già rilasciato in 2.0.1 (#13).

### Codice attuale (v2)
- `src/composables/useSbFloatingPanel.ts`: composable esportato pubblicamente.
- `src/components/SbContainer.vue`: chiama il composable e passa refs e funzioni alla slot (l'utente deve scrivere `.value` nel template).
- `src/components/SbReference.vue`: trigger con prop `as` e `onClick`.
- `src/components/SbFloating.vue`: Teleport + Transition + freccia, con CSS scoped per le animazioni `fade` e `scale-fade`.
- Viene distribuito `dist/sb-floating-panel-vue.css` (export `./style.css`).

## 2. Decisioni prese

1. **Niente composable pubblica.** L'utente usa solo i componenti, senza conoscere la logica del floating. Il composable diventa interno (non più esportato da `src/index.ts`).
2. **I tre componenti restano** (`SbContainer`, `SbReference`, `SbFloating`) e diventano l'unica API pubblica, con un ricco assortimento di props.
3. **Freccia rimossa del tutto**: `hasArrow`, `floatingArrow`, `floatingArrowStyle`, `arrowDimensions`, middleware `arrow()`.
4. **Zero CSS distribuito.** La libreria deve essere camaleontica: si adatta al design dell'app che la usa. Nessun foglio di stile, nessuno stile visivo di default.
5. È un cambiamento incompatibile, quindi **3.0.0** con commit `feat!:` / `BREAKING CHANGE:`.
6. **Prefisso `sbf` (sb floating) per tutti i ganci di stile**: variabili CSS `--sbf-*` e attributi `data-sbf-*`. Il maintainer usa già altri prefissi `--sb-` e non devono confondersi; gli attributi senza prefisso (`data-state`, `data-side`) andrebbero in conflitto con Radix / Reka UI se usati nella stessa app.

## 3. Bug e problemi della v2 da risolvere

| # | Problema | Dove |
|---|---|---|
| B1 | `hasArrow` non fa niente; la freccia viene sempre renderizzata (default `() => ref(null)` sempre vero) | composable, `SbFloating.vue` |
| B2 | Le prop non sono reattive: `SbContainer` passa valori, non getter, a `useFloating` | `SbContainer.vue`, composable |
| B3 | `SbReference` come `<button>` dentro un `<form>` lo invia (manca `type="button"`) | `SbReference.vue` |
| B4 | A11y invertita: `role="button"` + `tabindex` su `button`/`a`, niente su `div`/`span` | `SbReference.vue` |
| B5 | `@click.stop` blocca la propagazione del click al codice dell'utente | `SbReference.vue` |
| B6 | `ResizeObserver` manuale: attivo anche a pannello chiuso, non osserva un nuovo riferimento, scrive `style.width` fuori dal ciclo di posizionamento | composable |
| B7 | Mancano ARIA (`aria-expanded`, `aria-controls`, `aria-haspopup`), Escape, click fuori | componenti |
| B8 | `animation: 'none'` produce `<transition name="">` | `SbFloating.vue` |
| B9 | `engines.node >=24.19.0` limita i consumatori della libreria | `package.json` |
| B10 | Nessun test | repo |

## 4. Best practice Floating UI — verificate

Fonti: floating-ui.com/docs/vue, /middleware, /autoUpdate, /flip, /shift, /size, /hide (lette il 2026-10-18) e i file `.d.ts` installati.

| Regola | Fonte | v2 la rispetta? |
|---|---|---|
| `whileElementsMounted: autoUpdate` + floating montato con `v-if` (non `v-show`/opacity) | docs/vue, docs/autoUpdate | ✅ |
| Passare `open` a `useFloating` per sincronizzare `isPositioned` | docs/vue | ✅ |
| Le opzioni `open`, `placement`, `strategy`, `middleware`, `transform` accettano ref **o getter** (`MaybeReadonlyRefOrGetter`) | `.d.ts` 2.0.1 (la pagina docs cita solo i Ref) | ❌ passa valori fissi |
| `offset()` sempre all'inizio dell'array; `arrow()` e `hide()` alla fine | docs/middleware, docs/hide | ✅ offset; ➖ hide assente |
| **Combinazione flip + shift**: per placement allineati (con `-`, es. `bottom-start`) `flip` prima di `shift`; per placement non allineati (`bottom`) `shift` prima di `flip`. Con `flip({ crossAxis: 'alignment', fallbackAxisSideDirection: 'end' })` | docs/flip, sezione "Combining with shift()" | ❌ sempre `flip, shift` senza opzioni |
| `flip`, `shift`, `size`, `hide` accettano le opzioni di `detectOverflow`, tra cui `padding` (default 0) | docs/flip, /shift, /size, /hide | ❌ padding 0 |
| `shift({ limiter: limitShift() })` evita che il pannello si stacchi dal riferimento | docs/shift | ❌ |
| `shift({ crossAxis: true })` può sovrapporre il riferimento: lasciarlo spento e usare `flip` | docs/shift | ✅ (default) |
| Larghezza uguale al riferimento con `size({ apply({ rects, elements }) { … } })`. Con fallback `bestFit` (default) `size()` va **dopo** `flip()`. Stesso `padding` in `flip` e `size` | docs/size | ❌ `ResizeObserver` manuale |
| `availableWidth`/`availableHeight` di `size()` possono essere negativi: clamp a 0 | docs/size | n/a |
| `autoUpdate` osserva già il resize di riferimento e floating (`elementResize`, default `true`) | docs/autoUpdate | ❌ duplicato |
| Ascoltatori attivi solo con elemento visibile ("severe performance degradation" altrimenti) | docs/autoUpdate | ❌ `ResizeObserver` sempre attivo |
| `transform` (default) è il posizionamento più performante. Per animare con transform: elemento esterno posizionato + elemento interno animato | docs/vue | ❌ `transform: false` |
| Il posizionamento è asincrono: focus/scroll solo dopo `isPositioned === true` | docs/vue | ➖ non serve oggi, serve in v3 |
| `hide()`: applicare `visibility: hidden` se `middlewareData.hide.referenceHidden` | docs/hide | ➖ assente |
| `hide`, `size`, `limitShift` sono riesportati da `@floating-ui/vue` | `.d.ts` 2.0.1 | — |

## 5. Piano operativo

### Fase 1 — Composable interno (`useSbFloatingPanel`)

File: `src/composables/useSbFloatingPanel.ts`. Non più esportato da `src/index.ts`; lo usa solo `SbContainer`.

- Opzioni come `MaybeRefOrGetter` (da `vue`), lette con `toValue()`; passate a `useFloating` come getter.
- `middleware` in un `computed`, costruito così:
  ```ts
  const middleware = computed(() => {
    const padding = toValue(opts.padding);
    const aligned = toValue(opts.placement).includes('-');
    const flipMw = flip({ padding, crossAxis: 'alignment', fallbackAxisSideDirection: 'end' });
    const shiftMw = shift({ padding, limiter: limitShift() });
    return [
      offset(toValue(opts.offset)),
      ...(aligned ? [flipMw, shiftMw] : [shiftMw, flipMw]),
      size({ padding, apply: applySize }), // sempre: espone variabili CSS, vedi Fase 3
      toValue(opts.hideWhenDetached) && hide({ padding }),
    ];
  });
  ```
  Da verificare sulla doc di `size` se va messo dopo `shift` oppure solo dopo `flip` (la doc parla solo di `flip`).
- `applySize` non scrive `width`: imposta variabili CSS sull'elemento posizionato (`--sbf-reference-width`, `--sbf-available-width`, `--sbf-available-height`, con clamp a 0). Con `matchWidth` imposta anche `width` o `min-width` (da decidere, vedi domande aperte).
- `transform` lasciato al default (`true`).
- `whileElementsMounted: autoUpdate`, `open: isOpen`.
- Rimossi: freccia, `ResizeObserver`, `floatingStyle` (copia inutile), `onMounted`/`onUnmounted`.
- Stato di apertura gestito da `SbContainer` (controllato/non controllato), il composable riceve `isOpen`.
- Restituisce: `reference`, `floating`, `floatingStyles` (+ `visibility` da `hide`), `placement` risolto, `side`, `align`, `isPositioned`, `update`.

### Fase 2 — I tre componenti pubblici

Collegamento tramite `provide`/`inject` con `InjectionKey` tipizzata: l'utente non passa più refs o stili a mano e non scrive `.value`.

**`SbContainer`** (root, senza elemento DOM: renderizza solo la slot, quindi zero CSS)
- Posizione: `placement` (default `bottom-start`), `strategy` (default `absolute`), `offset` (default 8), `padding` (default 8), `matchWidth`, `hideWhenDetached`.
- Stato: `v-model:open` (`defineModel`), `defaultOpen`, `disabled`.
- Interazione: `closeOnEscape` (default `true`), `closeOnClickOutside` (default `true`). Da decidere: `trigger` (`click` | `hover` | `focus` | `manual`), `openDelay`, `closeDelay`.
- Eventi: `update:open`, `open`, `close`.
- Slot props già "unwrappate": `{ isOpen, open, close, toggle, placement, side }`.
- `defineExpose({ open, close, toggle, update })`.
- Id per l'ARIA con `useId()` (Vue 3.5), compatibile con SSR/Nuxt.

**`SbReference`**
- `as` (default `button`); se `button` aggiunge `type="button"`.
- Su tag non interattivi: `role="button"`, `tabindex="0"`, Enter/Space. Su `button`/`a` niente di superfluo.
- ARIA: `aria-expanded`, `aria-controls` (id del floating), `aria-haspopup` (prop, default `dialog`).
- Niente `@click.stop`.
- Attributo `data-sbf-state="open|closed"` per lo stile dell'utente.

**`SbFloating`**
- Struttura a due livelli (best practice transform):
  - elemento esterno: solo posizionamento (`floatingStyles`, `z-index`, `visibility`, variabili CSS), mai stile visivo;
  - elemento interno (`as`, default `div`): riceve `class`, `style` e attrs dell'utente (`inheritAttrs: false`), più `id`, `role` (prop, default `dialog`), `data-sbf-state`, `data-sbf-side`, `data-sbf-align`.
- `<Transition :name="transition">` solo se l'utente passa `transition`; altrimenti nessuna animazione. Hook `after-enter`/`after-leave` riemessi.
- Teleport: `teleportTo` (default `body`), `teleportDisabled`.
- `zIndex` opzionale (inline sull'elemento esterno).
- Focus: se `autoFocus`, sposta il focus dentro il pannello solo dopo `isPositioned`; al close ritorna al trigger.

### Fase 3 — Zero CSS, libreria camaleontica

- Eliminare tutti i blocchi `<style>` dai componenti.
- Rimuovere l'export `./style.css` e il file CSS da `dist`; `sideEffects: false`.
- Inline solo stili strutturali indispensabili: quelli di Floating UI (`position`, `top`, `left`, `transform`), `z-index`, `visibility` di `hide`.
- Hook di personalizzazione offerti all'utente:
  - `class`/`style`/attrs sull'elemento interno di `SbFloating` e su `SbReference` (Tailwind, CSS modules, CSS normale);
  - attributi `data-sbf-state`, `data-sbf-side`, `data-sbf-align` per animazioni direzionali in CSS;
  - variabili CSS calcolate da `size()`: `--sbf-reference-width`, `--sbf-available-width`, `--sbf-available-height` (es. `max-height: var(--sbf-available-height)`);
  - nome di una `<Transition>` dell'utente.
- README: sezione "Styling" con esempi CSS normale, Tailwind e animazione direzionale con `data-sbf-side`.

#### Ganci di stile: come funzionano

La libreria non distribuisce CSS: scrive solo valori sugli elementi, e il CSS dell'utente li legge.

DOM generato da `SbFloating`:
```html
<div style="position:absolute; transform:translate(120px, 40px); --sbf-reference-width:180px; …">  <!-- esterno: solo posizione -->
  <div class="classe-utente" data-sbf-state="open" data-sbf-side="bottom" data-sbf-align="start">
    contenuto
  </div>
</div>
```

**Attributi `data-sbf-*`** (aggiornati dalla libreria):

| Attributo | Valori | Uso |
|---|---|---|
| `data-sbf-state` | `open` / `closed` | stile aperto/chiuso; presente anche su `SbReference` (es. ruotare un'icona) |
| `data-sbf-side` | `top` / `bottom` / `left` / `right` | lato reale dopo `flip` → animazioni direzionali |
| `data-sbf-align` | `start` / `end` / assente | parte del placement dopo il trattino |

```css
.mio-pannello[data-sbf-side="bottom"] { animation: scendi 150ms ease-out; }
.mio-pannello[data-sbf-side="top"]    { animation: sali 150ms ease-out; }
.mio-bottone[data-sbf-state="open"] .icona { transform: rotate(180deg); }
```
Tailwind: `data-[sbf-side=top]:animate-sali`, `data-[sbf-state=open]:rotate-180`.

**Variabili CSS** (scritte inline sull'elemento esterno da `size()`, ereditate dall'interno):

| Variabile | Significato |
|---|---|
| `--sbf-reference-width` | larghezza del trigger |
| `--sbf-available-width` | spazio orizzontale libero prima di uscire dal viewport |
| `--sbf-available-height` | spazio verticale libero prima di uscire dal viewport |

```css
.mio-dropdown {
  width: var(--sbf-reference-width);
  max-height: var(--sbf-available-height);
  overflow-y: auto;
}
```

Stesso schema di Radix / Reka UI (che usano `data-state`, `data-side` e variabili CSS), quindi familiare a chi le conosce; il prefisso `sbf` evita conflitti se convivono nella stessa app.

### Fase 4 — Contorno

- Test: vitest + `@vue/test-utils` + happy-dom. Testare il comportamento (apertura, chiusura, Escape, click fuori, ARIA, `v-model:open`), non le coordinate (in DOM simulato i rect sono 0). Aggiungere `npm test` alla CI.
- Playground riscritto sulla nuova API.
- README riscritto (skill `/sb-health:docs`).
- `package.json`: rimuovere o allargare `engines`, rimuovere `typesVersions`, aggiornare `description` e `keywords` (togliere `arrow`, `composable`).
- Aggiornare `CLAUDE.md` (versioni reali).
- PR `feat!: …` → release-please genera la 3.0.0.

## 6. Decisioni sulle domande aperte (2026-10-19)

1. `trigger`: solo `click` + `manual` nella 3.0; hover/focus in una 3.x.
2. `SbReference`: solo `as`; `asChild` dopo.
3. `matchWidth: boolean | 'min'` (`true` → `width`, `'min'` → `min-width`); `--sbf-reference-width` sempre presente.
4. Tipi esportati da `src/index.ts`.

## 7. Scelte fatte durante l'implementazione

- `size()` messo dopo `flip` **e** `shift` (la doc copre solo l'ordine rispetto a `flip`).
- Tipi pubblici locali `SbPlacement`, `SbSide`, `SbAlignment`, `SbStrategy`: con i tipi di Floating UI i `.d.ts` generati importavano `@floating-ui/utils` (dipendenza transitiva, rompe con pnpm strict).
- `v-model:open` con `defineModel` e default `undefined`: finché il genitore non lo lega vale `defaultOpen`.
- `SbFloating`: il `<Transition>` avvolge il pannello interno, non il wrapper; il wrapper resta montato finché finisce l'animazione di uscita. Senza `transition` usa `:css="false"`, quindi nessuna classe e rimozione immediata.
- Container annidati: un `SbContainer` dentro un altro si registra presso il genitore (inject della stessa chiave); click nel figlio non chiudono il genitore, Escape chiude prima il più interno.
- Il focus torna al trigger alla chiusura se era dentro il pannello (anche senza `autoFocus`).
- Blocco gestito di `CLAUDE.md` rigenerato con `/sb-core:context` il 2026-10-19 (Vite 8, senza Arrow, con Vitest, flip/shift/size/hide e Vue Test Utils).

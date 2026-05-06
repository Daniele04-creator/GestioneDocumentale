# AGENTS.md - Template Codex per Management as Code

## Contesto
Questo repository riguarda il modulo documentale collegato a Management as Code, piattaforma SaaS di Project Management in evoluzione da PoC/MVP verso prodotto.

Daniele è tirocinante L-31 e lavora **esclusivamente sulla gestione documentale**.

Decisione aggiornata del tutor:
- il modulo documentale ha un repository separato dedicato;
- `mac-ui` e `mac-be` sono repository di riferimento/scheletro per mantenere coerenza con frontend e backend MAC;
- il repository `mac-doc` resta documentazione tecnica e non va confuso con il repository applicativo del modulo documentale;
- la generazione dati/documenti da template è in un repository separato del collega/team e va trattata come servizio esterno o input.

## Stack aggiornato
- Backend di riferimento: Node.js 24 LTS + NestJS.
- Frontend di riferimento: React + Vite + TypeScript + MUI.
- Frontend legacy MAC: Vue.
- Next.js: possibile direzione/target da validare nel repository.
- Database: PostgreSQL, possibile JSONB.
- API contract: Swagger/OpenAPI.
- Client API preferito: fetch, non Axios salvo nuova decisione.
- Workflow Git: branch develop, feature branch e merge request.
- Repository MAC di riferimento: `mac-be`, `mac-ui`, `mac-doc`.
- Repository documentale: repository separato dedicato, nome/URL da validare.

## Prima di lavorare
- Analizza la struttura del repository documentale.
- Verifica branch corrente e base develop.
- Individua pattern, naming, cartelle e comandi.
- Cerca README, handbook, AGENTS.md e documentazione utile.
- Verifica package manager e script disponibili.
- Se necessario, confronta `mac-ui` e `mac-be` come riferimento tecnico, senza modificarli.
- Non modificare file senza prima aver capito il punto corretto di intervento.
- Se il task è ambiguo, dichiara assunzioni e proponi piano.

## Regole operative
- Non lavorare direttamente su main.
- Non creare architettura parallela rispetto a MAC senza motivazione.
- Non fare refactor massivi non richiesti.
- Non aggiungere dipendenze senza motivazione.
- Non usare Axios se il team ha confermato fetch.
- Non modificare `mac-ui` o `mac-be` salvo task esplicito.
- Non modificare schema database/migrazioni senza spiegare impatti.
- Segui best practice NestJS lato backend.
- Segui best practice React/TypeScript lato frontend.
- Tratta Vue come legacy da analizzare prima di migrare.
- Usa Swagger/OpenAPI come contratto API.
- Il server generato da Swagger può essere mock/scheletro, ma non sostituisce automaticamente NestJS.
- Mantieni codice semplice, leggibile, sicuro, testabile e manutenibile.
- Valida input e gestisci errori.
- Non loggare dati sensibili.

## Modulo documentale
Il modulo documentale gestisce documenti collegati al contesto progettuale.

Possibili contesti da validare:
- progetto;
- fase;
- sottopasso;
- WBS element;
- work package;
- task;
- elemento equivalente del modello MAC.

Non implementare generazione/stampa da template: è area separata e appartiene al repository del collega/team.

Puoi considerare solo integrazione minima: documenti o dati documentali generati possono entrare nel repository documentale come nuovo documento o nuova versione, ma la regola va validata.

Non implementare senza conferma:
- upload manuale;
- audit trail;
- ACL avanzate;
- versioning completo;
- anteprima;
- condivisione;
- esportazione avanzata;
- motore template;
- AI core MVP.

## Integrazione con generazione template
Il repository separato di generazione template deve essere trattato come produttore esterno.

Prima di integrare definire:
- payload minimo;
- metadati obbligatori;
- riferimento file/storage;
- contesto progettuale;
- stato iniziale;
- regola nuovo documento/nuova versione;
- errori principali.

## Swagger e models
- Se modifichi API, aggiorna OpenAPI.
- Se il team introduce una libreria shared models, non duplicare modelli in client/server.
- Se rigeneri client, preferire generatore fetch.
- Mantieni esempi JSON utili se richiesti dal team.
- Non modificare pesantemente file generati.
- Se serve logica applicativa, usa wrapper/service/adattatori.

## Mock JSON
- I JSON di esempio devono essere realistici e utilizzabili dal frontend.
- Devono restare coerenti con Swagger/OpenAPI.
- Non inserire dati sensibili nei mock.
- Se il contratto API cambia, aggiornare anche gli esempi.
- Distinguere dati mock/esempio da dati reali.

## AI
- Non usare AI come funzionalità core dell'MVP.
- Eventuali sperimentazioni AI devono restare separate.
- L'AI può supportare documentazione, analisi o conversioni sperimentali, ma il codice prodotto deve essere verificabile, mantenibile e comprensibile dal team.
- Non introdurre codice generato da AI senza review tecnica e test.

## Task e sprint
- Preferire macrotask chiari e verificabili rispetto a microtask eccessivamente frammentati.
- Ogni task deve avere input minimi: screenshot/Figma o API, obiettivo, dati di esempio e criterio di completamento.
- Il primo sprint di team è orientato soprattutto a Project/WBS, WBS/VBS Editor, Planner, Jailboard, EVM, Kanban e login.
- Il modulo documentale resta focus esclusivo di Daniele, ma eventuali integrazioni con MAC vanno coordinate con tutor/team.

## Documentazione
La documentazione formale non è priorità iniziale.

Aggiorna solo documentazione minima quando cambia:
- comportamento;
- API;
- struttura dati;
- requisito importante;
- mock JSON;
- decisione tecnica.

La documentazione finale sarà rifinita dopo il codice.

## Qualità
Alla fine di ogni task riporta:
- file modificati;
- motivazione;
- test/lint/build eseguiti;
- eventuali comandi falliti;
- rischi residui;
- verifiche manuali consigliate;
- indicazione se serve merge request.

## Comandi progetto
Completare dopo analisi repository reale:

```bash
# install
[DA DEFINIRE]

# run backend
[DA DEFINIRE]

# run frontend
[DA DEFINIRE]

# test
[DA DEFINIRE]

# lint
[DA DEFINIRE]

# build
[DA DEFINIRE]
```

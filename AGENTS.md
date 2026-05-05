# AGENTS.md - Istruzioni Codex per Management as Code

## Contesto
Questo repository riguarda Management as Code, piattaforma SaaS di Project Management in evoluzione da POC/MVP verso prodotto.

Daniele è tirocinante L-31 e lavora principalmente sul modulo documentale, sui mockup Figma della home documentale e su eventuale sviluppo su codebase esistente.

## Nota sul prototipo locale DOCUMENTALE
Nel prototipo locale attuale:
- `server/` è un mock server/prototipo operativo basato su OpenAPI;
- `client/` è un client TypeScript Fetch generato da OpenAPI;
- `docs/openapi/management-as-code-documents-openapi.json` è il contratto Swagger/OpenAPI;
- `database/` e `scripts/` contengono schema, seed e smoke test;
- il backend reale futuro nel repository ufficiale resta NestJS, quindi il server mock locale non va trattato come backend definitivo.


## Stack aggiornato
- Backend reale di riferimento: Node.js + NestJS.
- Frontend target storico: React + Next.js.
- Frontend/scaffolding emerso: Vite + React + TypeScript, da verificare nel repository.
- Frontend legacy/esistente: Vue.
- Database: PostgreSQL, possibile JSONB.
- API contract: Swagger/OpenAPI.
- Client API preferito: fetch, non Axios salvo nuova decisione.
- Workflow Git: branch `develop`, feature branch e merge request.

## Prima di lavorare
- Analizza la struttura del repository.
- Verifica branch corrente e base `develop`.
- Individua pattern, naming, cartelle e comandi.
- Cerca documentazione/handbook/README disponibili.
- Non modificare file senza prima aver capito il punto corretto di intervento.
- Se il task è ambiguo, dichiara assunzioni e proponi piano.

## Regole operative
- Non lavorare direttamente su `main`.
- Non creare architettura parallela.
- Non fare refactor massivi non richiesti.
- Non aggiungere dipendenze senza motivazione.
- Non usare Axios se il team ha confermato fetch.
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
Non implementare generazione/stampa da template: quella è area separata.
Puoi considerare solo integrazione minima: documenti generati possono entrare nel repository documentale come nuovo documento o nuova versione, ma la regola va validata.

Non implementare senza conferma:
- upload manuale;
- audit trail;
- ACL avanzate;
- versioning completo;
- anteprima;
- condivisione;
- esportazione avanzata.

## Swagger e models
- Se modifichi API, aggiorna OpenAPI.
- Se il team introduce una libreria shared models, non duplicare modelli in client/server.
- Se rigeneri client, preferire generatore fetch.
- Mantieni esempi JSON utili se richiesti dal team.



## Regole aggiuntive su codice generato OpenAPI

- Non modificare pesantemente il codice generato da Swagger/OpenAPI finché il contratto non è stabile.
- Se serve logica applicativa, preferire wrapper/service/adattatori esterni rispetto alla modifica diretta dei file generati.
- Se il client/server viene rigenerato, verificare che eventuali personalizzazioni non vadano perse.
- Il client generato deve preferire `fetch`, salvo nuova decisione del team.
- Il server generato resta mock/scheletro di supporto e non sostituisce automaticamente il backend NestJS.
- Se il contratto OpenAPI cambia, rieseguire build/test e aggiornare eventuali mock JSON collegati.

## Regole aggiuntive su mock JSON

- I JSON di esempio devono essere realistici e utilizzabili dal frontend.
- Devono restare coerenti con Swagger/OpenAPI.
- Non inserire dati sensibili nei mock.
- Se il contratto API cambia, aggiornare anche gli esempi.
- Distinguere sempre dati mock/esempio da dati reali o di produzione.

## Regole aggiuntive su AI

- Non usare AI come funzionalità core dell'MVP.
- Eventuali sperimentazioni AI devono restare separate e non confondere il team.
- L'AI può supportare documentazione, analisi o conversioni sperimentali, ma il codice prodotto deve essere verificabile, mantenibile e comprensibile dal team.
- Non introdurre codice generato da AI senza review tecnica, test e coerenza con repository/pattern esistenti.

## Regole aggiuntive su task e sprint

- Preferire macrotask chiari e verificabili rispetto a microtask eccessivamente frammentati.
- Ogni task deve avere input minimi: screenshot/Figma o API, obiettivo, dati di esempio e criterio di completamento.
- Il primo sprint di team è orientato soprattutto a Planner, Jailboard, EVM, Kanban e VBS Editor; il modulo documentale resta focus di Daniele ma va integrato nel repository ufficiale solo con coordinamento del tutor/team.

## Documentazione
La documentazione formale non è priorità iniziale.
Aggiorna solo documentazione minima quando cambia comportamento, API, struttura dati o requisito importante.
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

## Comandi progetto per prototipo locale

```bash
# install dipendenze root, server e client
npm install
npm --prefix server install
npm --prefix client install

# database
npm run db:schema
npm run db:seed

# build completo
npm run build

# avvio server mock/prototipo OpenAPI
npm start

# sviluppo con nodemon
npm run start:dev

# smoke test API, con server già avviato su localhost:3000
npm run test:api

# demo client TypeScript Fetch, con server già avviato
npm run client:demo
```

Dopo test che modificano `DOC-001`, rieseguire:

```bash
npm run db:seed
```

Nel repository ufficiale questi comandi vanno rivalidati rispetto agli script reali del team.

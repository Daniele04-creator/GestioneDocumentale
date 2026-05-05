# Management as Code - Modulo Documentale

Prototipo locale del modulo documentale per il progetto **Management as Code**.

Il progetto raccoglie un mock server basato su OpenAPI, un client TypeScript Fetch generato, uno schema PostgreSQL con dati demo e script di supporto per verificare le API documentali. Lo scopo e' supportare il lavoro di tirocinio curriculare di Informatica di Daniele sul modulo documentale, senza presentare questo repository come backend definitivo di produzione.

## Contesto

Il modulo documentale gestisce documenti collegati a un contesto progettuale. Nel prototipo la struttura principale e':

```text
Progetto -> Package -> Task -> Documento
```

Ogni documento e' associato a:

- un progetto;
- un package;
- una task;
- un owner/responsabile documentale;
- uno o piu' tag;
- un file locale usato per il download.

La generazione automatica o stampa da template non e' implementata direttamente in questo modulo. Eventuali documenti generati da servizi esterni sono trattati come documenti gia' disponibili nel repository documentale.

## Struttura del progetto

```text
.
|-- client/             # Client TypeScript Fetch generato da OpenAPI e script demo
|-- database/           # Schema SQL e seed PostgreSQL
|-- docs/openapi/       # File OpenAPI/Swagger JSON condivisibile
|-- scripts/            # Script per schema, seed e smoke test API
|-- server/             # Mock server/prototipo Node.js generato da OpenAPI
|-- storage/documents/  # File demo locali collegati ai documenti seed
|-- AGENTS.md           # Note operative del progetto per Codex
|-- nodemon.json        # Configurazione avvio in sviluppo
|-- package.json        # Script root di orchestrazione
`-- package-lock.json
```

Le cartelle `node_modules/` possono essere presenti dopo l'installazione delle dipendenze, ma non fanno parte del codice sorgente.

## Tecnologie confermate

- Node.js
- JavaScript lato server
- TypeScript lato client demo
- TypeScript Fetch client generato
- Swagger/OpenAPI
- PostgreSQL
- `pg` per l'accesso al database
- `oas3-tools` e `connect` per il mock server OpenAPI
- `nodemon` per l'avvio in sviluppo

## Swagger/OpenAPI e codice generato

Il contratto OpenAPI principale si trova in:

```text
docs/openapi/management-as-code-documents-openapi.json
```

Il server operativo locale del prototipo si trova in `server/` ed espone le API documentali project-scoped, tra cui:

```text
GET    /api/v1/health
GET    /api/v1/projects/{projectId}/documents
GET    /api/v1/projects/{projectId}/documents/{documentId}
GET    /api/v1/projects/{projectId}/documents/{documentId}/file
PATCH  /api/v1/projects/{projectId}/documents/{documentId}
DELETE /api/v1/projects/{projectId}/documents/{documentId}
```

Quando il server e' avviato, la Swagger UI locale e' disponibile su:

```text
http://localhost:3000/docs
```

Il client in `client/` e' un client TypeScript Fetch generato da OpenAPI e contiene uno script demo che chiama il server locale.

Nota: il server in `server/` e' un mock/prototipo operativo basato su OpenAPI. Il backend reale futuro del progetto Management as Code resta da allineare con le scelte del team e potra' essere implementato in NestJS.

## Database

Il database usa PostgreSQL. I file principali sono:

```text
database/schema.sql
database/seed.sql
```

Lo schema crea le tabelle principali:

- `projects`
- `packages`
- `tasks`
- `owners`
- `documents`
- `tags`
- `document_tags`

Il seed popola dati demo e documenti collegati a file locali in `storage/documents/`.

Gli script database usano le variabili di ambiente lette da `.env`, con fallback locali definiti negli script. Non inserire credenziali reali nel codice o nella documentazione.

## Installazione ed esecuzione

Prerequisiti consigliati:

- Node.js recente;
- PostgreSQL installato e avviato;
- database locale configurato in modo coerente con `.env` o con i fallback degli script.

Installare le dipendenze:

```bash
npm install
npm --prefix server install
npm --prefix client install
```

Applicare schema e dati demo:

```bash
npm run db:schema
npm run db:seed
```

Eseguire la build completa:

```bash
npm run build
```

Avviare il server:

```bash
npm start
```

Avvio in sviluppo con nodemon:

```bash
npm run start:dev
```

Con il server gia' avviato su `http://localhost:3000`, eseguire lo smoke test API:

```bash
npm run test:api
```

Eseguire il demo client TypeScript Fetch:

```bash
npm run client:demo
```

Alcuni test aggiornano o archiviano il documento demo `DOC-001`. Dopo l'esecuzione completa di smoke test o demo client, ripristinare i dati con:

```bash
npm run db:seed
```

## File locali e versionamento

Non devono essere versionati file locali o generati come:

- `.env` e altri file di configurazione contenenti segreti;
- `node_modules/`;
- `server/node_modules/`;
- `client/node_modules/`;
- log locali;
- build temporanee;
- storage locale se contiene file non demo o dati non condivisibili.

I file presenti in `storage/documents/` sono usati dal prototipo come file demo per testare il download. Prima di condividere il repository, verificare sempre che non contengano dati sensibili.

## Stato del progetto

Questo repository e' un **prototipo/MVP didattico** a supporto del tirocinio curriculare. Serve a validare:

- contratto API documentale;
- struttura dati di base;
- filtri della home documentale;
- tag e owner;
- download file;
- comportamento di update e archiviazione logica;
- client generato da OpenAPI.

Non include funzionalita' fuori scope come autenticazione, ACL, upload manuale, generazione template, audit trail avanzato, versioning storico, condivisione o esportazione avanzata.

## Prossimi sviluppi

Possibili evoluzioni realistiche, da confermare con tutor e team:

- riallineare il contratto OpenAPI con il backend reale del progetto;
- integrare la logica nel backend NestJS ufficiale quando disponibile;
- collegare il client generato al frontend della home documentale;
- consolidare esempi JSON e casi Postman/smoke test;
- definire una gestione versioni documentali solo se diventa requisito;
- valutare upload, anteprima o permessi solo dopo conferma di scope.

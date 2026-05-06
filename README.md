# Management as Code - Modulo Documentale

Prototipo locale del modulo documentale per il progetto **Management as Code**.

Il repository contiene il backend applicativo NestJS + TypeScript, un client TypeScript Fetch generato da OpenAPI, il contratto Swagger/OpenAPI, schema e seed PostgreSQL, script di supporto e file demo per il download documentale. Il lavoro supporta il tirocinio curriculare di Informatica di Daniele e non va presentato come prodotto definitivo di produzione.

## Contesto

Il modulo documentale gestisce documenti collegati a un contesto progettuale:

```text
Progetto -> Package -> Task -> Documento
```

Ogni documento e' associato a:

- un progetto;
- un package;
- una task;
- un owner/responsabile documentale;
- uno o piu' tag;
- un file locale demo usato per il download.

La generazione automatica o stampa da template non e' implementata direttamente in questo modulo. Eventuali documenti generati da servizi esterni sono trattati come documenti gia' disponibili nel repository documentale.

## Struttura del progetto

```text
.
|-- backend/            # Backend NestJS + TypeScript principale
|-- client/             # Client TypeScript Fetch generato da OpenAPI e demo client
|-- database/           # Schema SQL e seed PostgreSQL
|-- docs/openapi/       # Contratto OpenAPI/Swagger JSON
|-- scripts/            # Script per schema, seed e smoke test API
|-- storage/documents/  # File demo locali collegati ai documenti seed
|-- AGENTS.md           # Note operative del progetto per Codex
|-- package.json        # Script root di orchestrazione
`-- package-lock.json
```

Le cartelle `node_modules/`, `dist/` e `coverage/` sono artefatti locali e non fanno parte del codice sorgente.

## Tecnologie confermate

- Node.js
- NestJS + TypeScript
- TypeORM
- PostgreSQL
- `pg` e `dotenv` per gli script database root
- DTO con `class-validator` / `class-transformer`
- Jest per test backend
- Biome per check/formattazione backend
- Swagger/OpenAPI come contratto API
- Client TypeScript Fetch generato da OpenAPI

## Backend NestJS

Il backend applicativo principale si trova in `backend/`.

Endpoint principali:

```text
GET    /api/v1/health
GET    /api/v1/projects/{projectId}/document-tree
GET    /api/v1/projects/{projectId}/documents
GET    /api/v1/projects/{projectId}/documents/{documentId}
GET    /api/v1/projects/{projectId}/documents/{documentId}/file
PATCH  /api/v1/projects/{projectId}/documents/{documentId}
DELETE /api/v1/projects/{projectId}/documents/{documentId}
```

Il backend usa lo schema PostgreSQL esistente e mantiene `synchronize: false` in TypeORM. Il download usa `file_info.storagePath` internamente, ma non espone `storagePath` nelle response pubbliche.

## OpenAPI e client

Il contratto OpenAPI principale si trova in:

```text
docs/openapi/management-as-code-documents-openapi.json
```

Il client in `client/` e' un client TypeScript Fetch generato da OpenAPI. Serve come supporto tecnico e demo per chiamare il backend locale.

OpenAPI e client restano materiali di supporto: il backend applicativo mantenuto in questo repository e' `backend/`.

## Flusso home documentale

La home documentale usa un caricamento progressivo:

1. all'apertura, il frontend chiama `GET /api/v1/projects/{projectId}/document-tree`;
2. la UI mostra package e task con `documentCount`, `taskCount` e `statusSummary`;
3. quando l'utente espande un package, il frontend chiama `GET /api/v1/projects/{projectId}/documents?packageId=...`;
4. quando l'utente espande una task, il frontend chiama `GET /api/v1/projects/{projectId}/documents?taskId=...`;
5. per filtri globali come `tag`, `status` e `search`, il frontend usa `GET /api/v1/projects/{projectId}/documents` con query params.

In questo modo la pagina carica subito una struttura leggera e recupera i documenti completi solo quando servono.

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

Gli script database usano le variabili di ambiente lette da `.env`, con fallback locali definiti negli script. Copiare `.env.example` in `.env` e adattarlo alla propria installazione PostgreSQL. Non inserire credenziali reali nel codice o nella documentazione.

## Installazione ed esecuzione

Prerequisiti consigliati:

- Node.js recente;
- PostgreSQL installato e avviato;
- database locale configurato in modo coerente con `.env` o con i fallback degli script.

Preparare la configurazione locale:

```bash
copy .env.example .env
```

Su sistemi Unix-like:

```bash
cp .env.example .env
```

Installare le dipendenze:

```bash
npm install
npm --prefix backend install
npm --prefix client install
```

Applicare schema e dati demo:

```bash
npm run db:schema
npm run db:seed
```

Build backend:

```bash
npm run build
```

Avvio backend:

```bash
npm start
```

Avvio in sviluppo:

```bash
npm run start:dev
```

Test e check backend:

```bash
npm run backend:test
npm run backend:lint
```

Con il backend gia' avviato su `http://localhost:3000`, eseguire lo smoke test API:

```bash
npm run test:api
```

Eseguire il demo client TypeScript Fetch:

```bash
npm run client:demo
```

Alcuni test aggiornano o archiviano il documento demo `DOC-001`. Dopo smoke test o demo client, ripristinare i dati con:

```bash
npm run db:seed
```

## File locali e versionamento

Non devono essere versionati file locali o generati come:

- `.env` e altri file di configurazione contenenti segreti;
- `node_modules/`;
- `backend/node_modules/`;
- `client/node_modules/`;
- `dist/`;
- `backend/dist/`;
- `coverage/`;
- log locali;
- storage locale se contiene file non demo o dati non condivisibili.

I file presenti in `storage/documents/`, quando disponibili, sono usati dal prototipo come file demo per testare il download dei documenti seed. Prima di condividere il repository, verificare sempre che contengano solo dati fittizi e nessun dato reale o sensibile.

## Stato del progetto

Questo repository e' un **prototipo/MVP didattico** a supporto del tirocinio curriculare. La base backend attuale e' NestJS + TypeScript in `backend/`, riallineata allo stack tecnico di Management as Code.

Il progetto valida:

- contratto API documentale;
- struttura dati di base;
- filtri della home documentale;
- tag e owner;
- download file;
- update e archiviazione logica;
- client generato da OpenAPI.

Non include funzionalita' fuori scope come autenticazione, ACL, upload manuale, generazione template, audit trail avanzato, versioning storico, condivisione o esportazione avanzata.

## Prossimi sviluppi

Possibili evoluzioni realistiche, da confermare con tutor e team:

- validare il backend NestJS con il tutor prima di replicarlo nel repository aziendale;
- riallineare il contratto OpenAPI con il backend reale quando il team lo conferma;
- collegare il client generato al frontend della home documentale;
- consolidare smoke test e casi Postman;
- valutare upload, anteprima, permessi o versioning solo dopo conferma di scope.

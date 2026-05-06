# Management as Code - Modulo Documentale

Prototipo locale del modulo documentale per il progetto **Management as Code**.

Il repository contiene il backend applicativo NestJS + TypeScript, un client TypeScript Fetch generato da OpenAPI, il contratto Swagger/OpenAPI, migration TypeORM, seed PostgreSQL, script di supporto e file demo per il download documentale. Il lavoro supporta il tirocinio curriculare di Informatica di Daniele e non va presentato come prodotto definitivo di produzione.

## Contesto

Il modulo documentale gestisce documenti collegati a un contenitore generale:

```text
keyType + key -> subKey -> Documento
```

Ogni documento e' associato a:

- un `keyType`, cioe' il tipo del contenitore generale;
- una `key`, cioe' l'identificativo del contenitore generale;
- una `subKey`, cioe' il sotto-elemento documentale;
- un `documentKey`, cioe' la chiave logica del documento nel contesto `keyType + key + subKey`;
- un oggetto `metadata` JSONB con metadati descrittivi variabili, ad esempio `title`, `description`, `templateId` e `templateName`;
- un owner/responsabile documentale;
- uno o piu' tag;
- un file locale demo usato per il download.

`keyType` rende il modulo riusabile per piu' contesti, ad esempio portfolio, program o project, senza legare il dominio documentale a una sola entita'.

La generazione automatica o stampa da template non e' implementata direttamente in questo modulo. Eventuali documenti generati da servizi esterni entrano nel documentale tramite acquisizione multipart del file finale e dei metadati.

## Struttura del progetto

```text
.
|-- backend/            # Backend NestJS + TypeScript principale
|-- client/             # Client TypeScript Fetch generato da OpenAPI e demo client
|-- database/           # Seed PostgreSQL con dati demo
|-- docs/openapi/       # Contratto OpenAPI/Swagger JSON
|-- scripts/            # Script per seed e smoke test API
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
GET    /api/v1/document-keys/{keyType}/{key}/document-tree
GET    /api/v1/document-keys/{keyType}/{key}/documents
POST   /api/v1/document-keys/{keyType}/{key}/documents
GET    /api/v1/document-keys/{keyType}/{key}/documents/{documentId}
GET    /api/v1/document-keys/{keyType}/{key}/documents/{documentId}/file
GET    /api/v1/document-keys/{keyType}/{key}/documents/{documentId}/versions
GET    /api/v1/document-keys/{keyType}/{key}/documents/{documentId}/versions/{version}/file
PATCH  /api/v1/document-keys/{keyType}/{key}/documents/{documentId}
DELETE /api/v1/document-keys/{keyType}/{key}/documents/{documentId}
```

Il backend usa migration TypeORM versionate e mantiene `synchronize: false`. Il download usa `file_info.storagePath` internamente, ma non espone `storagePath` nelle response pubbliche.

Il `POST /documents` acquisisce in `multipart/form-data` il documento finale prodotto da un modulo esterno, salva fisicamente il file in `storage/documents/` e registra i metadati nel database. I metadati descrittivi entrano nel campo `metadata` JSONB; `file_info` resta separato per i dati tecnici del file. Non e' upload manuale libero da UI: e' l'ingresso tecnico del documento gia' generato dal processo applicativo.

`documentKey` non coincide con `metadata.templateId`: il `templateId` identifica il template sorgente, mentre `documentKey` identifica il documento logico generato nel contesto `keyType + key + subKey`. Se arriva lo stesso `documentKey` con lo stesso checksum SHA-256, il backend aggiorna solo i metadati. Se arriva lo stesso `documentKey` con contenuto diverso, crea una nuova versione, aggiorna il documento corrente e non sovrascrive i file precedenti.

## OpenAPI e client

Il contratto OpenAPI principale si trova in:

```text
docs/openapi/management-as-code-documents-openapi.json
```

Il client in `client/` e' un client TypeScript Fetch generato da OpenAPI. Serve come supporto tecnico e demo per chiamare il backend locale.

OpenAPI e client restano materiali di supporto: il backend applicativo mantenuto in questo repository e' `backend/`.

## Flusso home documentale

La home documentale usa un caricamento progressivo:

1. all'apertura, il frontend chiama `GET /api/v1/document-keys/{keyType}/{key}/document-tree`;
2. la UI mostra i `subKey` con `documentCount` e `statusSummary`;
3. quando l'utente espande un `subKey`, il frontend chiama `GET /api/v1/document-keys/{keyType}/{key}/documents?subKey=...`;
4. per filtri globali come `tag`, `status` e `search`, il frontend usa `GET /api/v1/document-keys/{keyType}/{key}/documents` con query params.

In questo modo la pagina carica subito una struttura leggera e recupera i documenti completi solo quando servono.

## Database

Il database usa PostgreSQL. Lo schema e' gestito da migration TypeORM versionate in:

```text
backend/src/database/migrations/
```

Il seed demo resta separato e si trova in:

```text
database/seed.sql
```

Le migration sono la fonte ufficiale dello schema DB; non usare `synchronize: true`.

La migration iniziale crea le tabelle principali:

- `document_keys`
- `document_sub_keys`
- `owners`
- `documents`
- `document_versions`
- `tags`
- `document_tags`

Il seed popola solo dati demo e documenti collegati a file locali in `storage/documents/`.

Gli identificativi pubblici dei documenti restano nel formato `DOC-001`, `DOC-020`, ecc. e sono generati tramite la sequence PostgreSQL `document_id_seq`, sincronizzata dal seed sui documenti demo esistenti.

La tabella `documents` contiene la versione corrente e il checksum SHA-256 corrente. La tabella `document_versions` mantiene lo storico dei file e dei checksum per ogni versione.

I dati descrittivi variabili del documento stanno in `documents.metadata` (`JSONB`). I campi core restano colonne strutturate: identificativi, `owner_id`, `status`, `file_info`, `checksum_sha256`, `version` e date tecniche. `file_info` resta un JSONB separato per i metadati tecnici del file. I tag restano in tabelle dedicate perche' sono il criterio principale di filtro e ricerca documentale. La tabella `owners` e `owner_id` restano presenti provvisoriamente finche' non viene confermata una gestione esterna degli owner.

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

Applicare migration e dati demo:

```bash
npm run db:migrate
npm run db:seed
```

Per azzerare l'ambiente locale dopo test mutanti e ricreare struttura + dati demo:

```bash
npm run db:reset
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

Alcuni test aggiornano o archiviano il documento demo `DOC-001`. Dopo smoke test o demo client, ripristinare struttura e dati demo con:

```bash
npm run db:reset
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
- acquisizione tecnica del documento finale e registrazione dei metadati;
- versionamento storico basato su `documentKey` e checksum SHA-256;
- tag e owner;
- download file;
- update e archiviazione logica;
- client generato da OpenAPI.

Non include funzionalita' fuori scope come autenticazione, ACL, upload manuale libero, generazione template, audit trail avanzato, condivisione o esportazione avanzata.

## Prossimi sviluppi

Possibili evoluzioni realistiche, da confermare con tutor e team:

- validare il backend NestJS con il tutor prima di replicarlo nel repository aziendale;
- riallineare il contratto OpenAPI con il backend reale quando il team lo conferma;
- collegare il client generato al frontend della home documentale;
- consolidare smoke test e casi Postman;
- valutare upload, anteprima, permessi o versioning solo dopo conferma di scope.

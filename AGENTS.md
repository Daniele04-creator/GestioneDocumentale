# AGENTS.md - Istruzioni Codex per Management as Code

## Contesto

Questo repository riguarda il prototipo locale del modulo documentale di Management as Code.
Daniele e' tirocinante L-31 e lavora principalmente sul modulo documentale, sui mockup della home documentale e sull'allineamento tecnico verso lo stack backend aziendale.

## Prototipo locale DOCUMENTALE

Nel prototipo locale attuale:

- `backend/` e' il backend operativo NestJS + TypeScript;
- `client/` e' un client TypeScript Fetch generato da OpenAPI;
- `docs/openapi/management-as-code-documents-openapi.json` e' il contratto Swagger/OpenAPI;
- `database/` e `scripts/` contengono schema, seed e smoke test;
- `storage/documents/` contiene solo file demo non sensibili per testare il download.

## Stack aggiornato

- Backend: Node.js + NestJS + TypeScript.
- Database: PostgreSQL.
- ORM: TypeORM.
- API contract: Swagger/OpenAPI.
- Client API preferito: fetch, non Axios salvo nuova decisione.
- Test/check backend: Jest e Biome.

## Regole operative

- Non lavorare direttamente su `main`.
- Non fare push automatico.
- Non aggiungere dipendenze senza motivazione.
- Non usare Axios se il team ha confermato fetch.
- Non modificare schema database o migrazioni senza spiegare impatti.
- Usa Swagger/OpenAPI come contratto API.
- Mantieni codice semplice, leggibile, sicuro, testabile e manutenibile.
- Valida input e gestisci errori.
- Non loggare dati sensibili.
- Non mettere mai segreti nel codice o nella documentazione.

## Modulo documentale

Il modulo documentale gestisce documenti collegati al contesto progettuale:

```text
Progetto -> Package -> Documento
```

Non implementare generazione/stampa da template: e' area separata.
Non implementare senza conferma:

- upload manuale;
- audit trail;
- ACL avanzate;
- versioning completo;
- anteprima;
- condivisione;
- esportazione avanzata;
- AI.

## Swagger e client generato

- Se modifichi API, aggiorna OpenAPI.
- Se rigeneri client, preferire generatore fetch.
- Non modificare pesantemente codice generato finche' il contratto non e' stabile.
- Se il contratto OpenAPI cambia, rieseguire build/test e aggiornare esempi collegati.

## Comandi progetto

```bash
# install dipendenze root, backend e client
npm install
npm --prefix backend install
npm --prefix client install

# database
npm run db:schema
npm run db:seed

# build backend
npm run build

# avvio backend NestJS
npm start

# sviluppo backend NestJS
npm run start:dev

# smoke test API, con backend gia' avviato su localhost:3000
npm run test:api

# demo client TypeScript Fetch, con backend gia' avviato
npm run client:demo
```

Dopo test che modificano `DOC-001`, rieseguire:

```bash
npm run db:seed
```

## Qualita'

Alla fine di ogni task riporta:

- file modificati;
- motivazione;
- test/lint/build eseguiti;
- eventuali comandi falliti;
- rischi residui;
- verifiche manuali consigliate;
- indicazione se serve merge request.

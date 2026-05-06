# Mapping MAC core -> modulo documentale

Questo file descrive il mapping tecnico tra il contratto MAC core `openapi_mac_v1.0.yaml` e il servizio documentale locale.

Il file `openapi_mac_v1.0.yaml` e' il contratto del MAC core/mac-doc. Non e' il contratto OpenAPI del modulo documentale e non deve sostituire `docs/openapi/management-as-code-documents-openapi.json`.

## Mapping dei riferimenti

| MAC core | Modulo documentale | Note |
| --- | --- | --- |
| `ItemType` | `keyType` | Valori attesi: `Portfolio`, `Program`, `Project`, `Activity`, `Template`, `Join`. |
| `itemId` | `key` | Identificativo dell'item MAC a cui collegare i documenti. |
| `WorkPackage.id` | `subKey` | Nodo o sotto-contesto documentale. |
| `WorkPackage.parentId` | `parentSubKey` | Snapshot opzionale per rappresentare la gerarchia locale demo. |
| `Resource` / owner | `metadata.owner` | Snapshot opzionale. Il documentale non gestisce owner locali. |

## Confini del servizio documentale

Il modulo documentale mantiene solo documenti, file, metadati, tag e riferimenti al contesto MAC.

Non gestisce direttamente:

- portfolio, program, project o activity come dominio applicativo;
- WBS e work package come fonte ufficiale;
- resources, owner o permessi;
- task, subtask, adaptive board, roadmap board;
- dashboard, plan o gantt.

Nel prototipo locale le tabelle `document_keys` e `document_sub_keys` sono snapshot/demo utili per validare gli endpoint senza dipendere dal MAC core. In integrazione reale va validato se il documentale deve mantenere una copia locale minima o ricevere sempre il contesto da MAC core/BFF.

Task e SubTask del contratto MAC appartengono ai moduli adaptive/roadmap. Se in futuro un documento dovra' essere collegato a un task o subtask, quel riferimento dovra' arrivare come `subKey` o dentro `metadata.source`, non come nuova tabella task del documentale senza conferma architetturale.

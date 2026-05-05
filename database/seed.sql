INSERT INTO projects (id, name)
VALUES
  ('project-001', 'Management as Code Demo'),
  ('project-002', 'Frontend Migration'),
  ('project-003', 'Document Module Validation')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name;

INSERT INTO packages (id, project_id, parent_package_id, name)
VALUES
  ('package-001', 'project-001', NULL, 'Documentazione requisiti'),
  ('package-002', 'project-001', NULL, 'Documentazione architettura'),
  ('package-007', 'project-001', 'package-001', 'Specifiche funzionali'),
  ('package-003', 'project-002', NULL, 'UI Mockup'),
  ('package-004', 'project-002', NULL, 'React Migration'),
  ('package-005', 'project-003', NULL, 'API Validation'),
  ('package-006', 'project-003', NULL, 'Test Documentation')
ON CONFLICT (id) DO UPDATE
SET
  project_id = EXCLUDED.project_id,
  parent_package_id = EXCLUDED.parent_package_id,
  name = EXCLUDED.name;

INSERT INTO tasks (id, package_id, name)
VALUES
  ('task-001', 'package-001', 'Redazione Specifica SRS'),
  ('task-002', 'package-001', 'Redazione panoramica architettura SRS'),
  ('task-003', 'package-001', 'Analisi rischi requisiti'),
  ('task-004', 'package-001', 'Verifica checklist integrazione requisiti'),
  ('task-005', 'package-002', 'Redazione note struttura WBS'),
  ('task-006', 'package-002', 'Validazione contratto API documentale'),
  ('task-007', 'package-007', 'Redazione specifiche funzionali'),
  ('task-008', 'package-003', 'Verbale kickoff frontend'),
  ('task-009', 'package-003', 'Note mockup home documentale'),
  ('task-010', 'package-003', 'Checklist integrazione UI'),
  ('task-011', 'package-004', 'Note consumo API frontend'),
  ('task-012', 'package-004', 'Mappatura pagine React'),
  ('task-013', 'package-004', 'Note gestione stato frontend'),
  ('task-014', 'package-004', 'Report validazione frontend'),
  ('task-015', 'package-005', 'Piano validazione API documentale'),
  ('task-016', 'package-006', 'Matrice test download'),
  ('task-017', 'package-006', 'Checklist test Postman'),
  ('task-018', 'package-006', 'Revisione tag documentali'),
  ('task-019', 'package-006', 'Riepilogo validazione finale')
ON CONFLICT (id) DO UPDATE
SET
  package_id = EXCLUDED.package_id,
  name = EXCLUDED.name;

INSERT INTO owners (id, name)
VALUES
  ('owner-001', 'Francesca R'),
  ('owner-002', 'Paolo V'),
  ('owner-003', 'Andrea B'),
  ('owner-004', 'Daniele'),
  ('owner-005', 'Document Team')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name;

INSERT INTO tags (name)
VALUES
  ('Requisiti'),
  ('Architettura'),
  ('Tecnico'),
  ('API'),
  ('UI'),
  ('QA'),
  ('Validazione'),
  ('Test'),
  ('Checklist'),
  ('WBS'),
  ('Rischi'),
  ('Frontend'),
  ('Download'),
  ('Postman'),
  ('Sintesi')
ON CONFLICT (name) DO NOTHING;

INSERT INTO documents (
  id,
  task_id,
  owner_id,
  title,
  description,
  status,
  file_info,
  version,
  created_at,
  updated_at,
  archived_at
)
VALUES
(
  'DOC-001',
  'task-001',
  'owner-001',
  'Specifica SRS',
  'Documento dei requisiti software per il prototipo documentale',
  'draft',
  '{"fileName":"project-plan.txt","mimeType":"text/plain","sizeBytes":136,"storagePath":"storage/documents/project-plan.txt"}'::jsonb,
  1,
  now(),
  NULL,
  NULL
),
(
  'DOC-002',
  'task-002',
  'owner-001',
  'SRS architecture overview',
  'Architecture overview used while preparing the SRS package',
  'approved',
  '{"fileName":"architecture-overview.txt","mimeType":"text/plain","sizeBytes":129,"storagePath":"storage/documents/architecture-overview.txt"}'::jsonb,
  1,
  now(),
  NULL,
  NULL
),
(
  'DOC-003',
  'task-003',
  'owner-002',
  'Risk register',
  'Risk register for the Management as Code demo',
  'in_review',
  '{"fileName":"risk-register.txt","mimeType":"text/plain","sizeBytes":120,"storagePath":"storage/documents/risk-register.txt"}'::jsonb,
  1,
  now(),
  NULL,
  NULL
),
(
  'DOC-004',
  'task-004',
  'owner-003',
  'Integration checklist',
  'Archived checklist for early integration checks',
  'archived',
  '{"fileName":"integration-checklist.txt","mimeType":"text/plain","sizeBytes":122,"storagePath":"storage/documents/integration-checklist.txt"}'::jsonb,
  1,
  now(),
  now(),
  now()
),
(
  'DOC-005',
  'task-005',
  'owner-002',
  'WBS structure notes',
  'Notes about package level work breakdown',
  'in_review',
  '{"fileName":"wbs-structure-notes.txt","mimeType":"text/plain","sizeBytes":141,"storagePath":"storage/documents/wbs-structure-notes.txt"}'::jsonb,
  1,
  now(),
  NULL,
  NULL
),
(
  'DOC-006',
  'task-006',
  'owner-004',
  'Document API contract',
  'API contract for package and task based document browsing',
  'approved',
  '{"fileName":"document-api-contract.txt","mimeType":"text/plain","sizeBytes":123,"storagePath":"storage/documents/document-api-contract.txt"}'::jsonb,
  1,
  now(),
  NULL,
  NULL
),
(
  'DOC-007',
  'task-007',
  'owner-001',
  'Functional requirements draft',
  'Draft document with functional requirements and architecture notes',
  'draft',
  '{"fileName":"requirements-analysis-draft.txt","mimeType":"text/plain","sizeBytes":137,"storagePath":"storage/documents/requirements-analysis-draft.txt"}'::jsonb,
  1,
  now(),
  NULL,
  NULL
),
(
  'DOC-008',
  'task-008',
  'owner-003',
  'Kickoff meeting minutes',
  'Minutes from the frontend migration kickoff meeting',
  'approved',
  '{"fileName":"kickoff-minutes.txt","mimeType":"text/plain","sizeBytes":120,"storagePath":"storage/documents/kickoff-minutes.txt"}'::jsonb,
  1,
  now(),
  NULL,
  NULL
),
(
  'DOC-009',
  'task-009',
  'owner-004',
  'Document home mockup notes',
  'Notes for the first document home mockup and task navigation',
  'draft',
  '{"fileName":"document-home-notes.txt","mimeType":"text/plain","sizeBytes":125,"storagePath":"storage/documents/document-home-notes.txt"}'::jsonb,
  1,
  now(),
  NULL,
  NULL
),
(
  'DOC-010',
  'task-010',
  'owner-005',
  'UI integration checklist',
  'Checklist for connecting the UI mockup to the backend',
  'in_review',
  '{"fileName":"ui-integration-checklist.txt","mimeType":"text/plain","sizeBytes":126,"storagePath":"storage/documents/ui-integration-checklist.txt"}'::jsonb,
  1,
  now(),
  NULL,
  NULL
),
(
  'DOC-011',
  'task-011',
  'owner-002',
  'API consumption notes',
  'Notes for consuming the grouped document API from a frontend client',
  'approved',
  '{"fileName":"api-consumption-notes.txt","mimeType":"text/plain","sizeBytes":113,"storagePath":"storage/documents/api-consumption-notes.txt"}'::jsonb,
  1,
  now(),
  NULL,
  NULL
),
(
  'DOC-012',
  'task-012',
  'owner-004',
  'React page mapping',
  'Draft mapping between possible React pages and backend calls',
  'draft',
  '{"fileName":"react-page-mapping.txt","mimeType":"text/plain","sizeBytes":131,"storagePath":"storage/documents/react-page-mapping.txt"}'::jsonb,
  1,
  now(),
  NULL,
  NULL
),
(
  'DOC-013',
  'task-013',
  'owner-003',
  'State management notes',
  'Notes about frontend state for filters and selected tasks',
  'in_review',
  '{"fileName":"state-management-notes.txt","mimeType":"text/plain","sizeBytes":127,"storagePath":"storage/documents/state-management-notes.txt"}'::jsonb,
  1,
  now(),
  NULL,
  NULL
),
(
  'DOC-014',
  'task-014',
  'owner-005',
  'Frontend validation report',
  'Archived validation report for the frontend migration demo',
  'archived',
  '{"fileName":"frontend-validation-report.txt","mimeType":"text/plain","sizeBytes":116,"storagePath":"storage/documents/frontend-validation-report.txt"}'::jsonb,
  1,
  now(),
  now(),
  now()
),
(
  'DOC-015',
  'task-015',
  'owner-001',
  'Document validation plan',
  'Plan for validating filters, grouping, summaries, and file downloads',
  'draft',
  '{"fileName":"document-validation-plan.txt","mimeType":"text/plain","sizeBytes":133,"storagePath":"storage/documents/document-validation-plan.txt"}'::jsonb,
  1,
  now(),
  NULL,
  NULL
),
(
  'DOC-016',
  'task-016',
  'owner-002',
  'Download test matrix',
  'Matrix for checking file downloads across projects and tasks',
  'in_review',
  '{"fileName":"download-test-matrix.txt","mimeType":"text/plain","sizeBytes":109,"storagePath":"storage/documents/download-test-matrix.txt"}'::jsonb,
  1,
  now(),
  NULL,
  NULL
),
(
  'DOC-017',
  'task-017',
  'owner-004',
  'Postman test checklist',
  'Checklist for validating Postman requests against the document API',
  'approved',
  '{"fileName":"document-home-notes.txt","mimeType":"text/plain","sizeBytes":125,"storagePath":"storage/documents/document-home-notes.txt"}'::jsonb,
  1,
  now(),
  NULL,
  NULL
),
(
  'DOC-018',
  'task-018',
  'owner-005',
  'Tag review',
  'Review of document tags used for classification and search',
  'approved',
  '{"fileName":"tag-review.txt","mimeType":"text/plain","sizeBytes":112,"storagePath":"storage/documents/tag-review.txt"}'::jsonb,
  1,
  now(),
  NULL,
  NULL
),
(
  'DOC-019',
  'task-019',
  'owner-005',
  'Final validation summary',
  'Archived summary of document module validation results',
  'archived',
  '{"fileName":"final-validation-summary.txt","mimeType":"text/plain","sizeBytes":112,"storagePath":"storage/documents/final-validation-summary.txt"}'::jsonb,
  1,
  now(),
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE
SET
  task_id = EXCLUDED.task_id,
  owner_id = EXCLUDED.owner_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  file_info = EXCLUDED.file_info,
  version = EXCLUDED.version,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at,
  archived_at = EXCLUDED.archived_at;

INSERT INTO document_tags (document_id, tag_name)
VALUES
  ('DOC-001', 'Requisiti'),
  ('DOC-001', 'Tecnico'),
  ('DOC-002', 'Architettura'),
  ('DOC-002', 'Tecnico'),
  ('DOC-003', 'Rischi'),
  ('DOC-003', 'Requisiti'),
  ('DOC-004', 'Checklist'),
  ('DOC-004', 'Validazione'),
  ('DOC-005', 'WBS'),
  ('DOC-005', 'Tecnico'),
  ('DOC-006', 'API'),
  ('DOC-006', 'Tecnico'),
  ('DOC-006', 'Architettura'),
  ('DOC-006', 'QA'),
  ('DOC-007', 'Requisiti'),
  ('DOC-007', 'Tecnico'),
  ('DOC-008', 'Frontend'),
  ('DOC-008', 'Sintesi'),
  ('DOC-009', 'UI'),
  ('DOC-009', 'Frontend'),
  ('DOC-010', 'UI'),
  ('DOC-010', 'Checklist'),
  ('DOC-011', 'API'),
  ('DOC-011', 'Frontend'),
  ('DOC-012', 'UI'),
  ('DOC-012', 'Frontend'),
  ('DOC-013', 'UI'),
  ('DOC-013', 'Frontend'),
  ('DOC-014', 'Frontend'),
  ('DOC-014', 'Validazione'),
  ('DOC-015', 'Validazione'),
  ('DOC-015', 'QA'),
  ('DOC-016', 'Download'),
  ('DOC-016', 'Test'),
  ('DOC-017', 'Postman'),
  ('DOC-017', 'Test'),
  ('DOC-017', 'Checklist'),
  ('DOC-018', 'Tecnico'),
  ('DOC-018', 'Validazione'),
  ('DOC-019', 'Sintesi'),
  ('DOC-019', 'Validazione')
ON CONFLICT (document_id, tag_name) DO NOTHING;

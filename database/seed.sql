INSERT INTO document_keys (key_type, key_value, name)
VALUES
  ('project', 'PRJ-001', 'Management as Code Demo'),
  ('program', 'PROG-001', 'Frontend Migration'),
  ('project', 'PRJ-002', 'Document Module Validation')
ON CONFLICT (key_type, key_value) DO UPDATE
SET name = EXCLUDED.name;

INSERT INTO document_sub_keys (key_type, key_value, sub_key, parent_sub_key, name)
VALUES
  ('project', 'PRJ-001', 'PKG-001', NULL, 'Documentazione requisiti'),
  ('project', 'PRJ-001', 'PKG-002', NULL, 'Documentazione architettura'),
  ('project', 'PRJ-001', 'PKG-007', 'PKG-001', 'Specifiche funzionali'),
  ('program', 'PROG-001', 'PKG-003', NULL, 'UI Mockup'),
  ('program', 'PROG-001', 'PKG-004', NULL, 'React Migration'),
  ('project', 'PRJ-002', 'PKG-005', NULL, 'API Validation'),
  ('project', 'PRJ-002', 'PKG-006', NULL, 'Test Documentation')
ON CONFLICT (key_type, key_value, sub_key) DO UPDATE
SET
  parent_sub_key = EXCLUDED.parent_sub_key,
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
  key_type,
  key_value,
  sub_key,
  document_key,
  owner_id,
  metadata,
  status,
  file_info,
  checksum_sha256,
  version,
  created_at,
  updated_at,
  archived_at
)
VALUES
(
  'DOC-001',
  'project',
  'PRJ-001',
  'PKG-001',
  'SRS-SPECIFICATION',
  'owner-001',
  '{"title":"Specifica SRS","description":"Documento dei requisiti software per il prototipo documentale","templateId":"TPL-SRS","templateName":"SRS specification template"}'::jsonb,
  'draft',
  '{"fileName":"document-key-plan.txt","mimeType":"text/plain","sizeBytes":136,"storagePath":"storage/documents/document-key-plan.txt"}'::jsonb,
  '3286318d7c501f31d48312f3226a78acd7619e716313ede1548047b476cdce3e',
  1,
  now(),
  NULL,
  NULL
),
(
  'DOC-002',
  'project',
  'PRJ-001',
  'PKG-001',
  'ARCHITECTURE-OVERVIEW',
  'owner-001',
  '{"title":"SRS architecture overview","description":"Architecture overview used while preparing the SRS subKey","templateId":"TPL-ARCHITECTURE","templateName":"Architecture overview template"}'::jsonb,
  'approved',
  '{"fileName":"architecture-overview.txt","mimeType":"text/plain","sizeBytes":129,"storagePath":"storage/documents/architecture-overview.txt"}'::jsonb,
  'a9ff4e193f65c0eb8e2c01e1782e1e00abaa65b367876da88ed9c04299bd4a0d',
  1,
  now(),
  NULL,
  NULL
),
(
  'DOC-003',
  'project',
  'PRJ-001',
  'PKG-001',
  'RISK-REGISTER',
  'owner-002',
  '{"title":"Risk register","description":"Risk register for the Management as Code demo","templateId":"TPL-RISK-REGISTER","templateName":"Risk register template"}'::jsonb,
  'in_review',
  '{"fileName":"risk-register.txt","mimeType":"text/plain","sizeBytes":120,"storagePath":"storage/documents/risk-register.txt"}'::jsonb,
  'ba9f14634a3efcce9dab65fbeac9b911f5dd5fca5629cc7cf7de10b16295b2b6',
  1,
  now(),
  NULL,
  NULL
),
(
  'DOC-004',
  'project',
  'PRJ-001',
  'PKG-001',
  'INTEGRATION-CHECKLIST',
  'owner-003',
  '{"title":"Integration checklist","description":"Archived checklist for early integration checks","templateId":"TPL-CHECKLIST","templateName":"Integration checklist template"}'::jsonb,
  'archived',
  '{"fileName":"integration-checklist.txt","mimeType":"text/plain","sizeBytes":122,"storagePath":"storage/documents/integration-checklist.txt"}'::jsonb,
  'a9ffee21e187e908b938cf526fc613e637c7f770318f56fa93213a413a0d8c63',
  1,
  now(),
  now(),
  now()
),
(
  'DOC-005',
  'project',
  'PRJ-001',
  'PKG-002',
  'WBS-STRUCTURE-NOTES',
  'owner-002',
  '{"title":"WBS structure notes","description":"Notes about subKey level work breakdown","templateId":"TPL-WBS-NOTES","templateName":"WBS notes template"}'::jsonb,
  'in_review',
  '{"fileName":"wbs-structure-notes.txt","mimeType":"text/plain","sizeBytes":141,"storagePath":"storage/documents/wbs-structure-notes.txt"}'::jsonb,
  '628e94d523b4b9e8e7143ba9ca63798e6ac1fec82ab7d4b001f6a86464997c32',
  1,
  now(),
  NULL,
  NULL
),
(
  'DOC-006',
  'project',
  'PRJ-001',
  'PKG-002',
  'DOCUMENT-API-CONTRACT',
  'owner-004',
  '{"title":"Document API contract","description":"API contract for subKey based document browsing","templateId":"TPL-API-CONTRACT","templateName":"API contract template"}'::jsonb,
  'approved',
  '{"fileName":"document-api-contract.txt","mimeType":"text/plain","sizeBytes":123,"storagePath":"storage/documents/document-api-contract.txt"}'::jsonb,
  'e5e73f634d76366ce4e2e39ced9a4e5679f22c1d1417e6f047035325e3c6a19e',
  1,
  now(),
  NULL,
  NULL
),
(
  'DOC-007',
  'project',
  'PRJ-001',
  'PKG-007',
  'FUNCTIONAL-REQUIREMENTS-DRAFT',
  'owner-001',
  '{"title":"Functional requirements draft","description":"Draft document with functional requirements and architecture notes","templateId":"TPL-REQUIREMENTS-DRAFT","templateName":"Requirements draft template"}'::jsonb,
  'draft',
  '{"fileName":"requirements-analysis-draft.txt","mimeType":"text/plain","sizeBytes":137,"storagePath":"storage/documents/requirements-analysis-draft.txt"}'::jsonb,
  'fad72b570d31a3598bd35c5cec0c36d63d7054672ce58676ec8d675eff214e39',
  1,
  now(),
  NULL,
  NULL
),
(
  'DOC-008',
  'program',
  'PROG-001',
  'PKG-003',
  'KICKOFF-MINUTES',
  'owner-003',
  '{"title":"Kickoff meeting minutes","description":"Minutes from the frontend migration kickoff meeting","templateId":"TPL-MEETING-MINUTES","templateName":"Meeting minutes template"}'::jsonb,
  'approved',
  '{"fileName":"kickoff-minutes.txt","mimeType":"text/plain","sizeBytes":120,"storagePath":"storage/documents/kickoff-minutes.txt"}'::jsonb,
  'bd2b8b5512c5a40431b70a410d05cdbb0e6671395be3e8a4b5589fceb7fb3bb2',
  1,
  now(),
  NULL,
  NULL
),
(
  'DOC-009',
  'program',
  'PROG-001',
  'PKG-003',
  'DOCUMENT-HOME-NOTES',
  'owner-004',
  '{"title":"Document home mockup notes","description":"Notes for the first document home mockup and subKey navigation","templateId":"TPL-MOCKUP-NOTES","templateName":"Mockup notes template"}'::jsonb,
  'draft',
  '{"fileName":"document-home-notes.txt","mimeType":"text/plain","sizeBytes":125,"storagePath":"storage/documents/document-home-notes.txt"}'::jsonb,
  '0c0bdd5f81c1c929bb68234fca489c8d118d04e3bb7064505bf385f7340bc738',
  1,
  now(),
  NULL,
  NULL
),
(
  'DOC-010',
  'program',
  'PROG-001',
  'PKG-003',
  'UI-INTEGRATION-CHECKLIST',
  'owner-005',
  '{"title":"UI integration checklist","description":"Checklist for connecting the UI mockup to the backend","templateId":"TPL-UI-CHECKLIST","templateName":"UI checklist template"}'::jsonb,
  'in_review',
  '{"fileName":"ui-integration-checklist.txt","mimeType":"text/plain","sizeBytes":126,"storagePath":"storage/documents/ui-integration-checklist.txt"}'::jsonb,
  'bf390867ccd81d7ad24c088944e420d627440c2cc0d5ac2775838946b6ff5714',
  1,
  now(),
  NULL,
  NULL
),
(
  'DOC-011',
  'program',
  'PROG-001',
  'PKG-004',
  'API-CONSUMPTION-NOTES',
  'owner-002',
  '{"title":"API consumption notes","description":"Notes for consuming the grouped document API from a frontend client","templateId":"TPL-API-NOTES","templateName":"API notes template"}'::jsonb,
  'approved',
  '{"fileName":"api-consumption-notes.txt","mimeType":"text/plain","sizeBytes":113,"storagePath":"storage/documents/api-consumption-notes.txt"}'::jsonb,
  '473aa2e68eca90701d60c9586bd4b8963884f83f5d4c623ed83572acb5fe2361',
  1,
  now(),
  NULL,
  NULL
),
(
  'DOC-012',
  'program',
  'PROG-001',
  'PKG-004',
  'REACT-PAGE-MAPPING',
  'owner-004',
  '{"title":"React page mapping","description":"Draft mapping between possible React pages and backend calls","templateId":"TPL-FRONTEND-MAPPING","templateName":"Frontend mapping template"}'::jsonb,
  'draft',
  '{"fileName":"react-page-mapping.txt","mimeType":"text/plain","sizeBytes":131,"storagePath":"storage/documents/react-page-mapping.txt"}'::jsonb,
  'd3799d88106cee39cd2b00466a4e4fffb1cc7499aaf517405b5d41d0e65fd7a2',
  1,
  now(),
  NULL,
  NULL
),
(
  'DOC-013',
  'program',
  'PROG-001',
  'PKG-004',
  'STATE-MANAGEMENT-NOTES',
  'owner-003',
  '{"title":"State management notes","description":"Notes about frontend state for filters and selected subKeys","templateId":"TPL-STATE-NOTES","templateName":"State notes template"}'::jsonb,
  'in_review',
  '{"fileName":"state-management-notes.txt","mimeType":"text/plain","sizeBytes":127,"storagePath":"storage/documents/state-management-notes.txt"}'::jsonb,
  'd59b67e1893bf6298502c16987317ba91a9627adb85bef2ebe3ac236d5b7748b',
  1,
  now(),
  NULL,
  NULL
),
(
  'DOC-014',
  'program',
  'PROG-001',
  'PKG-004',
  'FRONTEND-VALIDATION-REPORT',
  'owner-005',
  '{"title":"Frontend validation report","description":"Archived validation report for the frontend migration demo","templateId":"TPL-VALIDATION-REPORT","templateName":"Validation report template"}'::jsonb,
  'archived',
  '{"fileName":"frontend-validation-report.txt","mimeType":"text/plain","sizeBytes":116,"storagePath":"storage/documents/frontend-validation-report.txt"}'::jsonb,
  'd878ce6b1b7ea263b1d20c3e5ee14940949a581ae519f4584cbdb8075d985c56',
  1,
  now(),
  now(),
  now()
),
(
  'DOC-015',
  'project',
  'PRJ-002',
  'PKG-005',
  'DOCUMENT-VALIDATION-PLAN',
  'owner-001',
  '{"title":"Document validation plan","description":"Plan for validating filters, grouping, summaries, and file downloads","templateId":"TPL-VALIDATION-PLAN","templateName":"Validation plan template"}'::jsonb,
  'draft',
  '{"fileName":"document-validation-plan.txt","mimeType":"text/plain","sizeBytes":133,"storagePath":"storage/documents/document-validation-plan.txt"}'::jsonb,
  '2e538e30448af90b223ea24a1b5d4c9155bc7eaadbd0e9598e744fa1ad019b29',
  1,
  now(),
  NULL,
  NULL
),
(
  'DOC-016',
  'project',
  'PRJ-002',
  'PKG-006',
  'DOWNLOAD-TEST-MATRIX',
  'owner-002',
  '{"title":"Download test matrix","description":"Matrix for checking file downloads across document keys and subKeys","templateId":"TPL-TEST-MATRIX","templateName":"Test matrix template"}'::jsonb,
  'in_review',
  '{"fileName":"download-test-matrix.txt","mimeType":"text/plain","sizeBytes":109,"storagePath":"storage/documents/download-test-matrix.txt"}'::jsonb,
  'f31c67450a1b3cd22859b7a1e0c759b1a4c0b5d5d03791e444b16d879809a65a',
  1,
  now(),
  NULL,
  NULL
),
(
  'DOC-017',
  'project',
  'PRJ-002',
  'PKG-006',
  'POSTMAN-TEST-CHECKLIST',
  'owner-004',
  '{"title":"Postman test checklist","description":"Checklist for validating Postman requests against the document API","templateId":"TPL-POSTMAN-CHECKLIST","templateName":"Postman checklist template"}'::jsonb,
  'approved',
  '{"fileName":"document-home-notes.txt","mimeType":"text/plain","sizeBytes":125,"storagePath":"storage/documents/document-home-notes.txt"}'::jsonb,
  '0c0bdd5f81c1c929bb68234fca489c8d118d04e3bb7064505bf385f7340bc738',
  1,
  now(),
  NULL,
  NULL
),
(
  'DOC-018',
  'project',
  'PRJ-002',
  'PKG-006',
  'TAG-REVIEW',
  'owner-005',
  '{"title":"Tag review","description":"Review of document tags used for classification and search","templateId":"TPL-TAG-REVIEW","templateName":"Tag review template"}'::jsonb,
  'approved',
  '{"fileName":"tag-review.txt","mimeType":"text/plain","sizeBytes":112,"storagePath":"storage/documents/tag-review.txt"}'::jsonb,
  'c0979aea3c9dc6c03977ca9f5a8eefaaca75e559d072c849ab9dbca42990e65c',
  1,
  now(),
  NULL,
  NULL
),
(
  'DOC-019',
  'project',
  'PRJ-002',
  'PKG-006',
  'FINAL-VALIDATION-SUMMARY',
  'owner-005',
  '{"title":"Final validation summary","description":"Archived summary of document module validation results","templateId":"TPL-FINAL-SUMMARY","templateName":"Final summary template"}'::jsonb,
  'archived',
  '{"fileName":"final-validation-summary.txt","mimeType":"text/plain","sizeBytes":112,"storagePath":"storage/documents/final-validation-summary.txt"}'::jsonb,
  '55aca99eb2530bf625daa8bf2246716cbaeeb49360d7adf35643461b120053d8',
  1,
  now(),
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE
SET
  key_type = EXCLUDED.key_type,
  key_value = EXCLUDED.key_value,
  sub_key = EXCLUDED.sub_key,
  document_key = EXCLUDED.document_key,
  owner_id = EXCLUDED.owner_id,
  metadata = EXCLUDED.metadata,
  status = EXCLUDED.status,
  file_info = EXCLUDED.file_info,
  checksum_sha256 = EXCLUDED.checksum_sha256,
  version = EXCLUDED.version,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at,
  archived_at = EXCLUDED.archived_at;

INSERT INTO document_versions (document_id, version, file_info, checksum_sha256, created_at)
SELECT id, version, file_info, checksum_sha256, created_at
FROM documents
WHERE id IN ('DOC-001', 'DOC-002', 'DOC-003', 'DOC-004', 'DOC-005', 'DOC-006', 'DOC-007', 'DOC-008', 'DOC-009', 'DOC-010', 'DOC-011', 'DOC-012', 'DOC-013', 'DOC-014', 'DOC-015', 'DOC-016', 'DOC-017', 'DOC-018', 'DOC-019')
ON CONFLICT (document_id, version) DO UPDATE
SET
  file_info = EXCLUDED.file_info,
  checksum_sha256 = EXCLUDED.checksum_sha256,
  created_at = EXCLUDED.created_at;

SELECT setval(
  'document_id_seq',
  COALESCE(
    (
      SELECT MAX((substring(id FROM 5))::int)
      FROM documents
      WHERE id ~ '^DOC-[0-9]+$'
    ),
    0
  ),
  true
);

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

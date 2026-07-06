# Backup Import v0.7 Design

## Goal

Complete the single-user recovery loop by allowing an operator to import a previously downloaded GEO Pulse runtime backup JSON artifact, validate it, store it as a local backup entry, and restore from it.

## Current Gap

v0.6 can create, list, download, validate, and restore backups that already exist in the current runtime state. If the operator downloads a backup JSON and later loses the local state file, there is no UI/API path to import that downloaded artifact back into a fresh runtime.

## In Scope

- Import the existing `geo-pulse-runtime-backup` JSON artifact format produced by v0.6.
- Validate artifact shape, schema version, snapshot presence, checksum, and non-recursive snapshot boundary.
- Store imported artifacts as local backup entries with metadata and snapshot.
- Avoid duplicate IDs by generating a new local backup id while preserving the original artifact id in metadata.
- Add API routes for import validation and import.
- Add settings UI controls to paste/import a downloaded backup JSON artifact.
- Record audit events for `runtime.backup.import.validate` and `runtime.backup.import`.

## Out of Scope

- Cloud backup sync.
- Binary file upload streaming.
- Encrypted backup archives.
- Multi-user approval before import/restore.
- Importing arbitrary state JSON that is not wrapped in the v0.6 backup artifact format.

## Data Contract

Import payload:

```json
{
  "artifact": {
    "kind": "geo-pulse-runtime-backup",
    "schema_version": 1,
    "backup": {},
    "snapshot": {}
  },
  "name": "Optional imported backup name"
}
```

Validation result:

- `valid`: boolean.
- `issues`: string array.
- `source_backup_id`: backup id from the downloaded artifact.
- `checksum`: recalculated snapshot checksum.
- `expected_checksum`: checksum from artifact metadata.
- `counts`: captured object counts.

Imported backup metadata:

- New `id` with `bkp-*` prefix.
- `name` from request, artifact backup name, or generated import label.
- `imported: true`.
- `source_backup_id` from artifact backup metadata.
- `imported_at` timestamp.
- Existing backup metadata fields: `version`, `schema_version`, `checksum`, `size_bytes`, `counts`, `state_keys`, `created_at`.

## UI Contract

Add an "导入备份" compact area inside the existing "本地备份" settings section:

- A textarea for pasting downloaded backup JSON.
- A validate-import button.
- An import button.
- No raw imported snapshot is rendered after submission.
- Errors stay in existing notice/error flow.

The UI must remain dense and operational, using existing dark admin surfaces, table, info rows, textarea, and secondary button styling.

## Security Boundary

The import route accepts a full local runtime snapshot from the operator. It remains protected by mutation API-key auth. The UI must not echo the JSON payload back into tables or audit details. Audit events should include artifact metadata only, not full snapshot contents.

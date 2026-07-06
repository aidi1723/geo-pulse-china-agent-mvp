# Single-User Backup and Restore Design

## Goal

Make the single-user GEO Pulse runtime recoverable enough for local production-style operation: the operator can create a named state snapshot, list recent snapshots, download the JSON artifact, validate it, and restore the current runtime from it.

## In Scope

- Create runtime backups from the current local serializable state.
- Keep backup metadata in local runtime state so it persists with the existing persistence file.
- Exclude backup history from the snapshot payload to avoid recursive nested backups.
- List backups through data actions, HTTP API, runtime status, and settings UI.
- Download a backup JSON artifact intentionally as a local operator action.
- Validate a stored backup before restore.
- Restore from a stored backup and append a restore audit event after hydration.
- Record audit events for `runtime.backup.create`, `runtime.backup.validate`, and `runtime.backup.restore`.

## Out of Scope

- Cloud backup storage.
- Scheduled or automatic backups.
- Encrypted secret vaults.
- Multi-user approval workflows.
- Database migration tooling.

## Data Contract

Backup metadata:

- `id`: stable `bkp-*` identifier.
- `name`: operator-facing label.
- `created_at`: ISO timestamp.
- `version`: app schema/version marker.
- `checksum`: SHA-256 checksum of the snapshot payload.
- `size_bytes`: serialized payload size.
- `counts`: runtime object counts at capture time.
- `state_keys`: top-level state keys captured in the snapshot.

Download artifact:

- `kind`: `geo-pulse-runtime-backup`.
- `schema_version`: `1`.
- `backup`: backup metadata.
- `snapshot`: serializable runtime state excluding `runtimeBackups`.

Validation result:

- `valid`: boolean.
- `backup_id`: backup id.
- `checksum`: checksum recalculated from snapshot.
- `expected_checksum`: checksum stored in metadata.
- `issues`: human-readable issue list.
- `counts`: captured object counts.

## UI Contract

Add a compact "本地备份" area to the existing settings brand/runtime panel. It must use existing dense dark admin styles:

- Summary rows for backup count, latest backup, and checksum.
- Primary action: create backup.
- Table for recent backups with validate/download/restore actions.
- No raw backup JSON or secrets displayed in UI.
- Restore action must use a confirmation prompt.

## Security Boundary

Backups are local operator artifacts. The UI must not display raw state payloads, but the download route intentionally returns the full JSON snapshot because the operator requested export. Mutation auth continues to protect create, validate, and restore routes.

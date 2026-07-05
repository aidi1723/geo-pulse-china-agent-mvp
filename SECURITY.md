# Security Policy

## Supported Version

This repository currently supports the latest `main` branch only.

## Reporting a Vulnerability

Use GitHub private vulnerability reporting when it is enabled for the repository.

If private reporting is not available yet, open a public issue with only a minimal description, such as "Potential security issue in API authorization", and do not include exploit details, credentials, private URLs, logs with secrets, or reproduction payloads. A maintainer should then arrange a private channel.

## Security Boundaries

Current safeguards include:

- Local-only service binding by default.
- Explicit API key requirement for write APIs.
- Fixed API key requirement before remote access can be enabled.
- Audit logs for sensitive runtime actions.
- CSV formula neutralization for audit export.
- Connector-scoped permission metadata and action checks.
- Remote provider endpoint restrictions against loopback, private, and link-local targets.
- Request body size limits and mutation rate limits.

## Not Production Hardened

This is a mock-first MVP. Before public multi-user or internet-facing deployment, add a production authentication layer, database-backed persistence, backup policy, monitoring, dependency review, and incident response ownership.

# Multi-User Access v0.9 Design

## Goal

Move GEO Pulse from a v0.8 single-user controlled deployment to a v0.9 team-access deployment where multiple internal users can log in, use role-based permissions, and leave auditable access events.

This stage is not a complete SaaS conversion. It adds application-level access control for one organization using the existing local-first runtime model.

## Current Gap

v0.8 protects mutating API calls with `GEO_INTERNAL_API_KEY` and expects deployment-layer access control for users. The UI has a logout action, but it does not create or revoke a real authenticated user session. Teams need built-in login, session handling, role checks, and user administration before the app can be shared with multiple internal operators.

## In Scope

- Built-in username and password login.
- HTTP-only session cookie for browser access.
- Session validation for API reads and writes.
- Role-based permissions for `owner`, `admin`, `editor`, and `viewer`.
- Local user directory persisted in the existing runtime state model.
- Seed owner user for first local startup.
- User management in Settings for listing users, creating users, disabling users, and resetting temporary passwords.
- Audit events for login success, login failure, logout, permission denial, user creation, user disable, and password reset.
- Client-side login view shown before the admin workspace loads.
- Existing `GEO_INTERNAL_API_KEY` remains valid for system automation and local scripts.
- Documentation and launch preflight updates that mark built-in multi-user access as available while keeping SaaS gaps explicit.

## Out of Scope

- Multi-tenant organization isolation.
- Database-backed users or migrations.
- Email invitations.
- Password reset by email.
- OAuth, SSO, SAML, or social login.
- MFA.
- User profile editing beyond role/status/password reset.
- Fine-grained object-level permissions.
- External identity-provider synchronization.
- Public self-service signup.
- Billing per seat.

## Roles And Permissions

### Owner

The `owner` role is the top-level local administrator.

Allowed:
- All read and write operations.
- Create users.
- Disable users.
- Reset temporary passwords.
- Restore runtime backups.
- Reset runtime state.
- Change connector, model, channel, brand, scheduler, and international GEO settings.

### Admin

The `admin` role manages configuration and operations but is not the root owner.

Allowed:
- All operational content workflows.
- System configuration.
- Connector and model configuration.
- Backup create, validate, import, and download.
- Create users with `editor` or `viewer` role.
- Disable `editor` or `viewer` users.
- Reset passwords for `editor` or `viewer` users.

Denied:
- Create, disable, or reset `owner` users.
- Restore runtime backups.
- Reset runtime state.

### Editor

The `editor` role operates GEO workflows.

Allowed:
- Keyword jobs.
- Topic creation and editing.
- Article creation, editing, review submission, and approval workflows.
- Distribution tasks.
- International GEO audit and artifact generation.
- Visibility collection and marketing campaign runs.

Denied:
- User management.
- Runtime reset.
- Backup restore/import.
- Connector, provider, model, and channel credential configuration.
- Billing plan changes.

### Viewer

The `viewer` role is read-only.

Allowed:
- All non-sensitive read views needed for dashboard, keyword, content, distribution, analytics, International GEO, billing, and settings inspection.

Denied:
- All mutating API routes.
- Sensitive audit export.

## Authentication Flow

1. Browser loads the app.
2. Frontend calls `GET /api/v1/session/current`.
3. If no valid session exists, the app renders a compact login view.
4. User submits username and password to `POST /api/v1/session/login`.
5. Server verifies password hash and active status.
6. Server creates a session with expiry and sets an HTTP-only cookie.
7. Frontend loads the normal bootstrap data.
8. User can call `POST /api/v1/session/logout` to revoke the session and clear the cookie.

## Session Contract

Session cookie:

- Name: `geo_session`
- Flags: `HttpOnly`, `SameSite=Lax`, `Path=/`
- Add `Secure` when `NODE_ENV=production`
- Default TTL: 8 hours

Session response shape:

```json
{
  "authenticated": true,
  "user": {
    "id": "usr_owner",
    "username": "owner",
    "display_name": "Owner",
    "role": "owner",
    "status": "active",
    "last_login_at": "ISO timestamp"
  },
  "expires_at": "ISO timestamp"
}
```

Responses must never include password hashes, session tokens, raw cookies, or temporary password values except in the direct response to a password reset action requested by an authorized owner/admin.

## API Access Rules

Public without session:

- `GET /api/v1/session/current`
- `POST /api/v1/session/login`
- Static assets and GEO static files such as `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/favicon.ico`, and `/healthz`

Requires valid session:

- Normal API read routes used by the admin workspace.

Requires valid session with role permission or valid `GEO_INTERNAL_API_KEY`:

- Mutating API routes.

Sensitive read routes:

- Audit event reads and export require `admin` or `owner` when browser-session auth is used.
- Existing internal API key remains allowed for scripts and diagnostics.

Permission failures return `403 FORBIDDEN`. Missing or expired sessions return `401 UNAUTHENTICATED`.

## User Data Model

Users are stored in the existing local runtime state.

```json
{
  "id": "usr_owner",
  "username": "owner",
  "display_name": "Owner",
  "role": "owner",
  "status": "active",
  "password_hash": "sha256 or pbkdf2 encoded hash",
  "created_at": "ISO timestamp",
  "updated_at": "ISO timestamp",
  "last_login_at": "ISO timestamp",
  "password_changed_at": "ISO timestamp",
  "must_change_password": true
}
```

Use a per-user salt and a password hash generated with Node's built-in crypto APIs. The implementation must avoid new package dependencies.

## Seed Owner User

On first startup, if no user exists, create one owner user.

Default local bootstrap:

- Username: `owner`
- Temporary password: from `GEO_BOOTSTRAP_OWNER_PASSWORD` when provided.
- Development fallback: `geo-owner-change-me`
- `must_change_password`: true

Production guard:

- In `NODE_ENV=production`, startup fails if no users exist and `GEO_BOOTSTRAP_OWNER_PASSWORD` is missing or shorter than 12 characters.

The temporary password is documented as a bootstrap credential only. Operators must change it before real use.

## User Management UI

Add a compact Settings section using the existing dark admin style:

- Members table with username, display name, role, status, last login, and actions.
- Create user form for username, display name, role, and temporary password.
- Disable user action.
- Reset temporary password action.

The UI must not render password hashes. Temporary password output should appear only immediately after create/reset and should be short-lived in UI state.

## Frontend State

Add authentication state to the global store:

- `session.current`
- `session.loginForm`
- `session.temporaryPasswordNotice`

Bootstrap behavior:

- Load `session/current` first.
- If unauthenticated, render login.
- If authenticated, load existing bootstrap data.
- On logout, call logout route, clear session state, and render login.

## Audit Events

Record audit events for:

- `auth.login.success`
- `auth.login.failure`
- `auth.logout`
- `auth.permission_denied`
- `user.created`
- `user.disabled`
- `user.password_reset`

Audit details may include user id, username, role, target user id, target username, method, path, and remote address. Audit details must not include passwords, password hashes, session tokens, or API keys.

## Launch Preflight Updates

Add checks to the existing launch preflight:

- `user_auth`: at least one active owner exists and bootstrap password rules are satisfied.
- `session_security`: session cookie settings are active and production mode uses secure cookie behavior.

Overall preflight score should reflect warnings for development bootstrap credentials and failures for production startup misconfiguration.

## Documentation Updates

Update:

- `README.md`
- `CHANGELOG.md`
- `docs/API_REFERENCE.md`
- `docs/ARCHITECTURE.md`
- `docs/PRODUCTION_DEPLOYMENT.md`
- `docs/OPEN_SOURCE_RELEASE.md`
- `docs/ROADMAP.md`
- `docs/README.md`
- New `docs/STAGE_V0_9_CLOSEOUT.md`

The docs must state that v0.9 supports built-in multi-user access for one organization, but still does not include multi-tenant SaaS isolation, OAuth/SSO, MFA, database persistence, or seat billing.

## Testing Requirements

Add failing tests before implementation in `verify-mvp.mjs`.

Required behavior:

- Unauthenticated workspace API reads return `401`.
- `GET /api/v1/session/current` returns unauthenticated state when no session exists.
- Login with valid bootstrap owner credentials succeeds and returns safe user data.
- Login with invalid password fails and records an audit event.
- Authenticated reads succeed.
- Viewer mutating requests return `403`.
- Editor can execute operational content actions.
- Editor cannot change connector/model/system configuration.
- Admin can create an editor/viewer user.
- Admin cannot create or modify owner users.
- Owner can create admin/editor/viewer users.
- Logout revokes session and clears the cookie.
- User management responses never expose password hashes.
- Preflight includes user auth and session security checks.
- Login UI renders before bootstrap data when unauthenticated.

## Acceptance Criteria

v0.9 is complete when:

- The app requires login before showing the admin workspace.
- Browser sessions survive normal reloads until expiry or logout.
- Role permissions are enforced on the server.
- User management works for owner/admin boundaries.
- Audit logs show access and permission events without secrets.
- Existing API-key automation still works.
- `npm run check` passes.
- Static SEO scan reports 0 errors and 0 warnings.
- Browser smoke confirms login, dashboard load, viewer denial, and logout.

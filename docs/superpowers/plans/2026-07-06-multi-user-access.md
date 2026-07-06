# Multi-User Access v0.9 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add built-in multi-user login, session cookies, role-based permissions, user management, audit events, and launch preflight coverage for one-organization team access.

**Architecture:** Keep the zero-dependency Node.js server and local JSON runtime model. Add user/session domain helpers in `mock-data.mjs`, enforce access in `server.mjs` before route handlers, then update the vanilla frontend to render a login view before the admin workspace. Existing `GEO_INTERNAL_API_KEY` remains a system automation credential and continues to authorize scripted writes.

**Tech Stack:** Node.js ESM, built-in `crypto`, built-in HTTP server, existing vanilla frontend modules, `verify-mvp.mjs`, existing dark admin UI helpers.

---

## File Structure

- Modify `mock-data.mjs`
  - Add local user records, password hashing helpers, session-safe user sanitizers, user management actions, and persisted user state.
- Modify `server.mjs`
  - Add cookie parsing/setting, session registry, login/logout/current routes, request auth context, role permissions, and preflight auth checks.
- Modify `verify-mvp.mjs`
  - Add red tests for login/session/RBAC/user management/UI, then keep extending the assertions as implementation lands.
- Modify `prototype/src/api.js`
  - Add session/user-management API wrappers, cookie credentials, and authenticated bootstrap behavior.
- Modify `prototype/src/store.js`
  - Add session state and login form state.
- Modify `prototype/src/render.js`
  - Render login view when unauthenticated.
- Modify `prototype/src/components.js`
  - Render current user and role in the sidebar footer.
- Modify `prototype/src/events.js`
  - Wire login, create user, disable user, and reset password actions.
- Modify `prototype/src/main.js`
  - Load session before bootstrap, submit login, handle logout, and expose user-management actions.
- Modify `prototype/src/pages/settings.js`
  - Add compact user-management section using existing table/info/status patterns.
- Create `docs/STAGE_V0_9_CLOSEOUT.md`
  - Capture stage result, boundary, verification, and closing copy.
- Modify docs and version files
  - `package.json`, `README.md`, `CHANGELOG.md`, `docs/API_REFERENCE.md`, `docs/ARCHITECTURE.md`, `docs/PRODUCTION_DEPLOYMENT.md`, `docs/OPEN_SOURCE_RELEASE.md`, `docs/ROADMAP.md`, `docs/README.md`.

---

### Task 1: Red Tests For Multi-User Access

**Files:**
- Modify: `verify-mvp.mjs`

- [ ] **Step 1: Add cookie helpers for HTTP tests**

Add helpers near `httpRequest()`:

```js
function getCookieHeader(response) {
  const setCookie = response.headers?.["set-cookie"];
  return Array.isArray(setCookie)
    ? setCookie.map((item) => item.split(";")[0]).join("; ")
    : "";
}

async function loginHttp(port, username = "owner", password = "geo-owner-change-me") {
  const response = await httpRequest(port, "/api/v1/session/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password })
  });
  return {
    response,
    cookie: getCookieHeader(response)
  };
}
```

- [ ] **Step 2: Add access-control assertions**

Create `runMultiUserAccessHttpChecks()` after `runHttpSecurityChecks()` with assertions for:

```js
const unauthenticatedSession = await httpRequest(port, "/api/v1/session/current");
assert.equal(unauthenticatedSession.status, 200);
assert.equal(unauthenticatedSession.body?.data?.authenticated, false);

const unauthenticatedWorkspace = await httpRequest(port, "/api/v1/workspaces/current");
assert.equal(unauthenticatedWorkspace.status, 401);

const invalidLogin = await httpRequest(port, "/api/v1/session/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "owner", password: "wrong-password" })
});
assert.equal(invalidLogin.status, 401);

const ownerLogin = await loginHttp(port);
assert.equal(ownerLogin.response.status, 200);
assert.equal(ownerLogin.response.body?.data?.authenticated, true);
assert.equal(ownerLogin.response.body?.data?.user?.role, "owner");
assert.ok(ownerLogin.cookie.includes("geo_session="));
assert.doesNotMatch(JSON.stringify(ownerLogin.response.body?.data || {}), /password_hash|geo-owner-change-me/);

const authenticatedWorkspace = await httpRequest(port, "/api/v1/workspaces/current", {
  headers: { Cookie: ownerLogin.cookie }
});
assert.equal(authenticatedWorkspace.status, 200);
```

- [ ] **Step 3: Add RBAC and user-management assertions**

Continue the same test with owner/admin/editor/viewer flows:

```js
const createdViewer = await httpRequest(port, "/api/v1/users", {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: ownerLogin.cookie },
  body: JSON.stringify({
    username: "viewer1",
    display_name: "Viewer One",
    role: "viewer",
    temporary_password: "viewer-pass-1234"
  })
});
assert.equal(createdViewer.status, 201);
assert.equal(createdViewer.body?.data?.user?.role, "viewer");
assert.doesNotMatch(JSON.stringify(createdViewer.body?.data || {}), /password_hash/);

const viewerLogin = await loginHttp(port, "viewer1", "viewer-pass-1234");
const viewerWrite = await httpRequest(port, "/api/v1/topic-ideas", {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: viewerLogin.cookie },
  body: JSON.stringify({ title: "Viewer should not write" })
});
assert.equal(viewerWrite.status, 403);

const createdEditor = await httpRequest(port, "/api/v1/users", {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: ownerLogin.cookie },
  body: JSON.stringify({
    username: "editor1",
    display_name: "Editor One",
    role: "editor",
    temporary_password: "editor-pass-1234"
  })
});
assert.equal(createdEditor.status, 201);

const editorLogin = await loginHttp(port, "editor1", "editor-pass-1234");
const editorTopic = await httpRequest(port, "/api/v1/topic-ideas", {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: editorLogin.cookie },
  body: JSON.stringify({ title: "Editor-created GEO topic" })
});
assert.equal(editorTopic.status, 201);

const editorConfigWrite = await httpRequest(port, "/api/v1/model-configs", {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: editorLogin.cookie },
  body: JSON.stringify({ provider: "Editor blocked provider" })
});
assert.equal(editorConfigWrite.status, 403);
```

- [ ] **Step 4: Add admin boundary assertions**

Add admin checks:

```js
const createdAdmin = await httpRequest(port, "/api/v1/users", {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: ownerLogin.cookie },
  body: JSON.stringify({
    username: "admin1",
    display_name: "Admin One",
    role: "admin",
    temporary_password: "admin-pass-1234"
  })
});
assert.equal(createdAdmin.status, 201);

const adminLogin = await loginHttp(port, "admin1", "admin-pass-1234");
const adminCreatesEditor = await httpRequest(port, "/api/v1/users", {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: adminLogin.cookie },
  body: JSON.stringify({
    username: "editor2",
    display_name: "Editor Two",
    role: "editor",
    temporary_password: "editor-two-pass-1234"
  })
});
assert.equal(adminCreatesEditor.status, 201);

const adminCreatesOwner = await httpRequest(port, "/api/v1/users", {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: adminLogin.cookie },
  body: JSON.stringify({
    username: "owner2",
    display_name: "Owner Two",
    role: "owner",
    temporary_password: "owner-two-pass-1234"
  })
});
assert.equal(adminCreatesOwner.status, 403);
```

- [ ] **Step 5: Add logout, audit, and preflight assertions**

Add final assertions:

```js
const logout = await httpRequest(port, "/api/v1/session/logout", {
  method: "POST",
  headers: { Cookie: ownerLogin.cookie }
});
assert.equal(logout.status, 200);
assert.match(String(logout.headers["set-cookie"] || ""), /geo_session=;/);

const afterLogout = await httpRequest(port, "/api/v1/workspaces/current", {
  headers: { Cookie: ownerLogin.cookie }
});
assert.equal(afterLogout.status, 401);

const authAudit = await httpRequest(port, "/api/v1/audit-events?action=auth.login.failure", {
  headers: { Cookie: adminLogin.cookie }
});
assert.equal(authAudit.status, 200);
assert.equal(authAudit.body?.data?.items?.[0]?.action, "auth.login.failure");
assert.doesNotMatch(JSON.stringify(authAudit.body?.data || {}), /wrong-password|password_hash|geo_session/);

const preflight = await httpRequest(port, "/api/v1/system/preflight", {
  headers: { Cookie: adminLogin.cookie }
});
assert.ok(preflight.body?.data?.checks?.some((item) => item.id === "user_auth"));
assert.ok(preflight.body?.data?.checks?.some((item) => item.id === "session_security"));
```

- [ ] **Step 6: Add UI red assertions**

Import `renderApp` from `prototype/src/render.js` and add this helper near other UI test helpers:

```js
function renderAppToStringForTest(testStore) {
  const root = { innerHTML: "" };
  renderApp(root, testStore);
  return root.innerHTML;
}
```

Update `runSettingsAuditUiChecks()` or add `runAuthUiChecks()` to assert:

```js
const loginHtml = renderAppToStringForTest({
  ...minimalStore,
  session: { current: { authenticated: false }, loginForm: { username: "", password: "" } }
});
assert.match(loginHtml, /登录 GEO Pulse/);
assert.match(loginHtml, /data-action="login-session"/);
assert.doesNotMatch(loginHtml, /总览看板/);

const settingsHtml = renderSettings({
  ...settingsStore,
  session: { current: { user: { role: "owner" } } },
  data: {
    ...settingsStore.data,
    users: [{ id: "usr_owner", username: "owner", display_name: "Owner", role: "owner", status: "active" }]
  }
});
assert.match(settingsHtml, /用户管理/);
assert.match(settingsHtml, /data-action="create-user"/);
assert.match(settingsHtml, /data-action="reset-user-password"/);
```

- [ ] **Step 7: Run red check**

Run:

```bash
npm run check
```

Expected: FAIL because session routes, RBAC, and login UI do not exist yet.

---

### Task 2: User Domain In Runtime State

**Files:**
- Modify: `mock-data.mjs`
- Modify: `verify-mvp.mjs`

- [ ] **Step 1: Add direct mock-data red tests**

Import planned helpers in `verify-mvp.mjs`:

```js
  authenticateUserAction,
  createUserAction,
  disableUserAction,
  listUsers,
  resetUserPasswordAction,
  verifyUserPassword
```

Add assertions in `runMockDataChecks()`:

```js
const users = listUsers();
assert.ok(users.items.some((item) => item.role === "owner"));
assert.doesNotMatch(JSON.stringify(users), /password_hash/);
assert.equal(verifyUserPassword("owner", "geo-owner-change-me"), true);
assert.equal(verifyUserPassword("owner", "bad-password"), false);
```

Run `npm run check`. Expected: FAIL on missing exports.

- [ ] **Step 2: Add password helpers and seed owner**

In `mock-data.mjs`, import `crypto` at the top:

```js
import crypto from "node:crypto";
```

Add constants and helpers near the member seed data:

```js
const userRoles = ["owner", "admin", "editor", "viewer"];
const bootstrapOwnerPassword = process.env.GEO_BOOTSTRAP_OWNER_PASSWORD || "geo-owner-change-me";

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(String(password), salt, 120000, 32, "sha256").toString("hex");
  return `pbkdf2_sha256$120000$${salt}$${hash}`;
}

function verifyPassword(password, encoded = "") {
  const [scheme, rounds, salt, expected] = String(encoded).split("$");
  if (scheme !== "pbkdf2_sha256" || !rounds || !salt || !expected) return false;
  const actual = crypto.pbkdf2Sync(String(password), salt, Number(rounds), 32, "sha256").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

function sanitizeUser(user = {}) {
  const { password_hash, ...safe } = user;
  return deepClone(safe);
}
```

Replace or supplement `members` with `users`:

```js
const users = [
  {
    id: "usr_owner",
    username: "owner",
    display_name: "Owner",
    role: "owner",
    status: "active",
    password_hash: hashPassword(bootstrapOwnerPassword),
    created_at: nowIso(),
    updated_at: nowIso(),
    last_login_at: null,
    password_changed_at: null,
    must_change_password: true
  }
];
```

- [ ] **Step 3: Persist users**

Update `getSerializableState()`:

```js
users,
members,
```

Update `hydrateRuntimeState(payload)`:

```js
replaceArray(users, Array.isArray(payload.users) && payload.users.length ? payload.users : users);
replaceArray(members, payload.members ?? members);
```

- [ ] **Step 4: Add user actions**

Add exports near `listMembers()`:

```js
export function listUsers(query = {}) {
  let items = users.map(sanitizeUser);
  if (query.role) items = items.filter((item) => item.role === query.role);
  if (query.status) items = items.filter((item) => item.status === query.status);
  return paginate(items, query.page, query.page_size);
}

export function getUserById(userId) {
  const user = users.find((item) => item.id === userId);
  return user ? sanitizeUser(user) : null;
}

export function findRawUserByUsername(username) {
  return users.find((item) => item.username.toLowerCase() === String(username || "").toLowerCase()) || null;
}

export function verifyUserPassword(username, password) {
  const user = findRawUserByUsername(username);
  return Boolean(user && user.status === "active" && verifyPassword(password, user.password_hash));
}

export function authenticateUserAction(payload = {}, context = {}) {
  const username = String(payload.username || "").trim();
  const user = findRawUserByUsername(username);
  if (!user || user.status !== "active" || !verifyPassword(payload.password || "", user.password_hash)) {
    recordAuditEvent("auth.login.failure", "user", username || "unknown", {
      username,
      remote_address: context.remote_address || ""
    });
    persistState();
    return null;
  }
  user.last_login_at = nowIso();
  user.updated_at = nowIso();
  recordAuditEvent("auth.login.success", "user", user.id, {
    username: user.username,
    role: user.role,
    remote_address: context.remote_address || ""
  });
  persistState();
  return sanitizeUser(user);
}
```

Add create/disable/reset helpers:

```js
export function createUserAction(payload = {}, actor = {}) {
  const username = String(payload.username || "").trim().toLowerCase();
  const role = userRoles.includes(payload.role) ? payload.role : "viewer";
  if (!username || users.some((item) => item.username === username)) {
    return null;
  }
  const temporaryPassword = String(payload.temporary_password || crypto.randomBytes(9).toString("base64url"));
  const user = {
    id: uniqueId("usr"),
    username,
    display_name: String(payload.display_name || username).trim(),
    role,
    status: "active",
    password_hash: hashPassword(temporaryPassword),
    created_at: nowIso(),
    updated_at: nowIso(),
    last_login_at: null,
    password_changed_at: null,
    must_change_password: true
  };
  users.unshift(user);
  recordAuditEvent("user.created", "user", user.id, {
    username: user.username,
    role: user.role,
    actor_user_id: actor.id || ""
  });
  persistState();
  return { user: sanitizeUser(user), temporary_password: temporaryPassword };
}

export function disableUserAction(userId, actor = {}) {
  const user = users.find((item) => item.id === userId);
  if (!user) return null;
  user.status = "disabled";
  user.updated_at = nowIso();
  recordAuditEvent("user.disabled", "user", user.id, {
    username: user.username,
    actor_user_id: actor.id || ""
  });
  persistState();
  return sanitizeUser(user);
}

export function resetUserPasswordAction(userId, actor = {}) {
  const user = users.find((item) => item.id === userId);
  if (!user) return null;
  const temporaryPassword = crypto.randomBytes(9).toString("base64url");
  user.password_hash = hashPassword(temporaryPassword);
  user.must_change_password = true;
  user.updated_at = nowIso();
  recordAuditEvent("user.password_reset", "user", user.id, {
    username: user.username,
    actor_user_id: actor.id || ""
  });
  persistState();
  return { user: sanitizeUser(user), temporary_password: temporaryPassword };
}
```

- [ ] **Step 5: Run green check for mock-data slice**

Run:

```bash
npm run check
```

Expected: Still FAIL on server/frontend auth tests, but mock-data missing-export failures are gone.

- [ ] **Step 6: Checkpoint user domain**

Do not commit while the full suite is still red from subsequent auth/UI assertions. Confirm the missing-export failures are gone and continue to Task 3.

```bash
npm run check
```

---

### Task 3: Server Session And Permission Gate

**Files:**
- Modify: `server.mjs`
- Modify: `verify-mvp.mjs`

- [ ] **Step 1: Add imports from mock-data**

Add to the existing dynamic import destructuring:

```js
  authenticateUserAction,
  createUserAction,
  disableUserAction,
  getUserById,
  listUsers,
  resetUserPasswordAction
```

- [ ] **Step 2: Add session constants and registry**

Add after API key constants:

```js
const sessionCookieName = "geo_session";
const sessionTtlMs = Math.max(15 * 60 * 1000, Number(process.env.GEO_SESSION_TTL_MS || 8 * 60 * 60 * 1000));
const sessions = new Map();
```

Add startup guard:

```js
if (isProduction && !process.env.GEO_BOOTSTRAP_OWNER_PASSWORD) {
  console.error("NODE_ENV=production requires GEO_BOOTSTRAP_OWNER_PASSWORD for first owner bootstrap.");
  process.exit(1);
}
```

- [ ] **Step 3: Add cookie/session helpers**

Add before auth helper functions:

```js
function parseCookies(req) {
  return String(req.headers.cookie || "")
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((acc, pair) => {
      const index = pair.indexOf("=");
      if (index > -1) acc[pair.slice(0, index)] = decodeURIComponent(pair.slice(index + 1));
      return acc;
    }, {});
}

function sessionCookie(token, expiresAt) {
  const parts = [
    `${sessionCookieName}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Expires=${new Date(expiresAt).toUTCString()}`
  ];
  if (isProduction) parts.push("Secure");
  return parts.join("; ");
}

function clearSessionCookie() {
  return `${sessionCookieName}=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT${isProduction ? "; Secure" : ""}`;
}

function createSession(user) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + sessionTtlMs;
  sessions.set(token, { user_id: user.id, expires_at: expiresAt });
  return { token, expires_at: new Date(expiresAt).toISOString() };
}

function getSessionFromRequest(req) {
  const token = parseCookies(req)[sessionCookieName];
  const session = token ? sessions.get(token) : null;
  if (!session || session.expires_at <= Date.now()) {
    if (token) sessions.delete(token);
    return { authenticated: false };
  }
  const user = getUserById(session.user_id);
  if (!user || user.status !== "active") {
    sessions.delete(token);
    return { authenticated: false };
  }
  return {
    authenticated: true,
    token,
    user,
    expires_at: new Date(session.expires_at).toISOString()
  };
}
```

- [ ] **Step 4: Add role permission helpers**

Add route classification:

```js
const roleRank = { viewer: 0, editor: 1, admin: 2, owner: 3 };

function hasRoleAtLeast(user, role) {
  return roleRank[user?.role] >= roleRank[role];
}

function requiredRoleForMutation(method, pathname) {
  if (!isMutatingMethod(method)) return "viewer";
  if (pathname === "/users" || pathname.startsWith("/users/")) return "admin";
  if (pathname.includes("/restore") || pathname === "/system/runtime/reset") return "owner";
  if (
    pathname.startsWith("/automation-providers") ||
    pathname.startsWith("/automation-connectors") ||
    pathname.startsWith("/model-configs") ||
    pathname.startsWith("/channels") ||
    pathname.startsWith("/system/backups") ||
    pathname === "/brand-profile"
  ) {
    return "admin";
  }
  return "editor";
}

function canCreateTargetRole(actor, targetRole) {
  if (actor.role === "owner") return true;
  if (actor.role === "admin") return ["editor", "viewer"].includes(targetRole);
  return false;
}
```

- [ ] **Step 5: Replace auth gate**

Change `handleApi()` flow:

```js
const session = getSessionFromRequest(req);
const apiKeyAuthorized = req.headers["x-geo-api-key"] === internalApiKey;

if (isPublicApiPath(req.method, pathname)) {
  // allow
} else if (!session.authenticated && !apiKeyAuthorized) {
  recordAuthFailure(req, pathname, "missing_or_expired_session");
  sendJson(res, 401, error("UNAUTHENTICATED", "Login is required", 401).body);
  return;
} else if (!apiKeyAuthorized) {
  const requiredRole = requiredRoleForMutation(req.method, pathname);
  if (isSensitiveReadPath(req.method, pathname) && !hasRoleAtLeast(session.user, "admin")) {
    recordAuthFailure(req, pathname, "insufficient_role");
    sendJson(res, 403, error("FORBIDDEN", "Permission denied", 403).body);
    return;
  }
  if (!hasRoleAtLeast(session.user, requiredRole)) {
    recordAuthFailure(req, pathname, "insufficient_role");
    sendJson(res, 403, error("FORBIDDEN", "Permission denied", 403).body);
    return;
  }
}
```

Keep mutation rate limiting active for mutating requests regardless of user/session.

- [ ] **Step 6: Add session routes**

Before normal app routes:

```js
if (req.method === "GET" && pathname === "/session/current") {
  sendJson(res, 200, ok(session.authenticated ? session : { authenticated: false }));
  return;
}

if (req.method === "POST" && pathname === "/session/login") {
  const body = await parseBody(req).catch(() => null);
  const user = authenticateUserAction(body || {}, { remote_address: req.socket.remoteAddress || "" });
  if (!user) {
    sendJson(res, 401, error("UNAUTHENTICATED", "Invalid username or password", 401).body);
    return;
  }
  const nextSession = createSession(user);
  res.setHeader("Set-Cookie", sessionCookie(nextSession.token, Date.parse(nextSession.expires_at)));
  sendJson(res, 200, ok({ authenticated: true, user, expires_at: nextSession.expires_at }));
  return;
}

if (req.method === "POST" && pathname === "/session/logout") {
  if (session.token) sessions.delete(session.token);
  res.setHeader("Set-Cookie", clearSessionCookie());
  recordAuditEventAction("auth.logout", "user", session.user?.id || "anonymous", {
    username: session.user?.username || ""
  });
  sendJson(res, 200, ok({ success: true }));
  return;
}
```

- [ ] **Step 7: Add user routes**

Add:

```js
if (req.method === "GET" && pathname === "/users") {
  sendJson(res, 200, ok(listUsers(query)));
  return;
}

if (req.method === "POST" && pathname === "/users") {
  const body = await parseBody(req).catch(() => null);
  const targetRole = body?.role || "viewer";
  if (!apiKeyAuthorized && !canCreateTargetRole(session.user, targetRole)) {
    sendJson(res, 403, error("FORBIDDEN", "Permission denied", 403).body);
    return;
  }
  const result = createUserAction(body || {}, session.user || { id: "api-key" });
  if (!result) {
    sendJson(res, 400, error("VALIDATION_ERROR", "User could not be created").body);
    return;
  }
  sendJson(res, 201, ok(result));
  return;
}

if (req.method === "POST" && pathname.match(/^\/users\/[^/]+\/disable$/)) {
  const userId = decodeURIComponent(pathname.split("/")[2]);
  const result = disableUserAction(userId, session.user || { id: "api-key" });
  if (!result) {
    sendJson(res, 404, error("NOT_FOUND", "User not found", 404).body);
    return;
  }
  sendJson(res, 200, ok(result));
  return;
}

if (req.method === "POST" && pathname.match(/^\/users\/[^/]+\/reset-password$/)) {
  const userId = decodeURIComponent(pathname.split("/")[2]);
  const result = resetUserPasswordAction(userId, session.user || { id: "api-key" });
  if (!result) {
    sendJson(res, 404, error("NOT_FOUND", "User not found", 404).body);
    return;
  }
  sendJson(res, 200, ok(result));
  return;
}
```

- [ ] **Step 8: Update existing logout route**

Remove or replace the old `/session/logout` branch that calls `logoutSessionAction()` so there is only one logout route.

- [ ] **Step 9: Run server auth checks**

Run:

```bash
npm run check
```

Expected: Server auth tests should pass or expose route classification gaps. Fix only permission classification and session handling in this task.

- [ ] **Step 10: Checkpoint server auth**

Do not commit if frontend red tests are still failing. Confirm HTTP auth failures are fixed and continue to Task 4.

```bash
npm run check
```

---

### Task 4: Frontend Login Flow

**Files:**
- Modify: `prototype/src/api.js`
- Modify: `prototype/src/store.js`
- Modify: `prototype/src/render.js`
- Modify: `prototype/src/main.js`
- Modify: `prototype/src/events.js`
- Modify: `prototype/src/components.js`
- Modify: `verify-mvp.mjs`

- [ ] **Step 1: Add API wrappers**

In `prototype/src/api.js`, set fetch credentials for API calls:

```js
const fetchOptions = {
  credentials: "same-origin"
};
```

Use `credentials: "same-origin"` in `fetch()` calls for `request`, `requestJson`, and `getClientConfig`.

Add:

```js
export async function getCurrentSession() {
  return request("/api/v1/session/current");
}

export async function loginSession(payload) {
  return requestJson("/api/v1/session/login", "POST", payload);
}

export async function logoutSession(payload = {}) {
  return requestJson("/api/v1/session/logout", "POST", payload);
}
```

- [ ] **Step 2: Add session state**

In `prototype/src/store.js`, add:

```js
session: {
  current: { authenticated: false },
  loginForm: {
    username: "owner",
    password: ""
  },
  temporaryPasswordNotice: null
},
```

Add helpers:

```js
export function setSession(session) {
  store.session.current = session || { authenticated: false };
}

export function clearSession() {
  store.session.current = { authenticated: false };
}
```

- [ ] **Step 3: Render login before app shell**

In `prototype/src/render.js`, add `renderLogin(store)` and return it before the shell when unauthenticated:

```js
if (!isStaticPreview && !store.session?.current?.authenticated) {
  root.innerHTML = renderLogin(store);
  return;
}
```

Login markup:

```js
function renderLogin(store) {
  return `
    <main class="login-shell">
      <section class="surface panel login-panel">
        <div class="panel-head">
          <div>
            <h1 class="page-title">登录 GEO Pulse</h1>
            <div class="panel-note">使用团队账号进入 GEO 运营工作台。</div>
          </div>
        </div>
        ${store.ui.error ? `<div class="notice">${escapeHtml(store.ui.error)}</div>` : ""}
        <div class="form-grid">
          <div class="form-field full">
            <label>用户名</label>
            <input data-login-field="username" value="${escapeHtml(store.session.loginForm.username || "")}" />
          </div>
          <div class="form-field full">
            <label>密码</label>
            <input type="password" data-login-field="password" value="${escapeHtml(store.session.loginForm.password || "")}" />
          </div>
        </div>
        <div class="actions-row" style="margin-top:18px">
          <button class="primary-btn" data-action="login-session">登录</button>
        </div>
      </section>
    </main>
  `;
}
```

- [ ] **Step 4: Add login startup flow**

In `prototype/src/main.js`, import `getCurrentSession` and `loginSession`.

Replace final startup with:

```js
async function startApp() {
  try {
    setLoading(true);
    const session = await getCurrentSessionApi();
    setSession(session);
    if (session.authenticated) {
      await refreshData({ loading: true });
    } else {
      setLoading(false);
      rerender();
    }
  } catch (error) {
    setError(error instanceof Error ? error.message : "加载会话失败");
    setLoading(false);
    rerender();
  }
}

startApp();
```

Add action:

```js
async loginSession() {
  try {
    const session = await loginSessionApi(store.session.loginForm);
    setSession(session);
    store.session.loginForm.password = "";
    await refreshData({ loading: true });
    showNotice("已登录。");
  } catch (error) {
    setError("用户名或密码不正确");
    rerender();
  }
}
```

Update logout action to clear session and render login.

- [ ] **Step 5: Wire login events**

In `prototype/src/events.js`, handle:

```js
if (target.matches("[data-login-field]")) {
  store.session.loginForm[target.dataset.loginField] = target.value;
}
```

In action click handling:

```js
if (action === "login-session") {
  await actions.loginSession();
  return;
}
```

- [ ] **Step 6: Show user in sidebar**

Change `sidebarMarkup(currentPage)` to `sidebarMarkup(currentPage, session)` and display:

```js
const user = session?.user || {};
<div style="font-weight: 800">${escapeHtml(user.display_name || user.username || "未登录")}</div>
<div class="plan-badge">${escapeHtml(user.role || "visitor")}</div>
```

Update `renderApp()` call:

```js
${sidebarMarkup(store.page, store.session.current)}
```

- [ ] **Step 7: Run UI auth checks**

Run:

```bash
npm run check
```

Expected: Login UI checks pass. User-management UI checks may still fail until Task 5.

- [ ] **Step 8: Checkpoint login UI**

Do not commit if user-management UI tests are still failing. Confirm login UI failures are fixed and continue to Task 5.

```bash
npm run check
```

---

### Task 5: Settings User Management UI

**Files:**
- Modify: `prototype/src/api.js`
- Modify: `prototype/src/store.js`
- Modify: `prototype/src/main.js`
- Modify: `prototype/src/events.js`
- Modify: `prototype/src/pages/settings.js`
- Modify: `verify-mvp.mjs`

- [ ] **Step 1: Add user API wrappers**

In `prototype/src/api.js`:

```js
export async function createUser(payload) {
  return requestJson("/api/v1/users", "POST", payload);
}

export async function disableUser(userId) {
  return requestJson(`/api/v1/users/${encodeURIComponent(userId)}/disable`, "POST", {});
}

export async function resetUserPassword(userId) {
  return requestJson(`/api/v1/users/${encodeURIComponent(userId)}/reset-password`, "POST", {});
}
```

- [ ] **Step 2: Add user form state**

In `store.forms`:

```js
user: {
  username: "",
  display_name: "",
  role: "viewer",
  temporary_password: ""
}
```

- [ ] **Step 3: Include users in bootstrap**

In `bootstrapData()`, request:

```js
usersResult = request("/api/v1/users")
```

Return:

```js
users: extractItems(usersResult)
```

Keep existing `members` if other pages still use it.

- [ ] **Step 4: Render user management section**

In `prototype/src/pages/settings.js`, add `renderUserManagement(store)`:

```js
function renderUserManagement(store) {
  const users = store.data.users || [];
  const sessionUser = store.session?.current?.user || {};
  const canManage = ["owner", "admin"].includes(sessionUser.role);
  const rows = users.length
    ? users.map((user) => `
        <tr>
          <td><div class="cell-title">${escapeHtml(user.display_name || user.username)}</div><div class="cell-sub">${escapeHtml(user.username)}</div></td>
          <td>${statusMarkup(user.role)}</td>
          <td>${statusMarkup(user.status)}</td>
          <td>${escapeHtml(formatDateTime(user.last_login_at))}</td>
          <td>
            ${canManage ? `<button class="ghost-btn" data-action="reset-user-password" data-user-id="${escapeHtml(user.id)}">重置密码</button>` : ""}
            ${canManage && user.status === "active" ? `<button class="danger-btn" data-action="disable-user" data-user-id="${escapeHtml(user.id)}">停用</button>` : ""}
          </td>
        </tr>
      `)
    : [`<tr><td colspan="5"><div class="empty-state">暂无用户。</div></td></tr>`];

  return `
    <section class="surface panel" data-settings-panel="users">
      <div class="panel-head">
        <div>
          <h3 class="panel-title">用户管理</h3>
          <div class="panel-note">管理本组织内部访问账号、角色与状态。</div>
        </div>
      </div>
      ${store.session?.temporaryPasswordNotice ? `<div class="notice">${escapeHtml(store.session.temporaryPasswordNotice)}</div>` : ""}
      ${tableMarkup(["用户", "角色", "状态", "上次登录", "动作"], rows)}
      ${canManage ? renderCreateUserForm(store.forms.user) : ""}
    </section>
  `;
}
```

Add compact create form:

```js
function renderCreateUserForm(form = {}) {
  return `
    <div class="section-block" style="margin-top:18px">
      <div class="form-grid">
        <div class="form-field"><label>用户名</label><input data-user-field="username" value="${escapeHtml(form.username || "")}" /></div>
        <div class="form-field"><label>显示名</label><input data-user-field="display_name" value="${escapeHtml(form.display_name || "")}" /></div>
        <div class="form-field"><label>角色</label><select data-user-field="role">
          ${["viewer", "editor", "admin"].map((role) => `<option value="${role}" ${form.role === role ? "selected" : ""}>${role}</option>`).join("")}
        </select></div>
        <div class="form-field"><label>临时密码</label><input data-user-field="temporary_password" value="${escapeHtml(form.temporary_password || "")}" /></div>
      </div>
      <div class="actions-row" style="margin-top:14px"><button class="secondary-btn" data-action="create-user">创建用户</button></div>
    </div>
  `;
}
```

Render this section inside settings brand/runtime stack or add a Settings tab if a user tab already fits the existing tab system. Prefer inserting after "运行态与数据" to keep scope low.

- [ ] **Step 5: Wire form and actions**

In `events.js`:

```js
if (target.matches("[data-user-field]")) {
  store.forms.user[target.dataset.userField] = target.value;
}
```

Click actions:

```js
if (action === "create-user") await actions.createUser();
if (action === "disable-user") await actions.disableUser(actionButton.dataset.userId);
if (action === "reset-user-password") await actions.resetUserPassword(actionButton.dataset.userId);
```

In `main.js`, add action implementations that call API wrappers, refresh data, and show the temporary password once.

- [ ] **Step 6: Run UI checks**

Run:

```bash
npm run check
```

Expected: User-management UI tests pass.

- [ ] **Step 7: Commit multi-user access implementation**

```bash
npm run check
git add mock-data.mjs server.mjs verify-mvp.mjs prototype/src/api.js prototype/src/store.js prototype/src/render.js prototype/src/main.js prototype/src/events.js prototype/src/components.js prototype/src/pages/settings.js
git commit -m "feat: add multi-user access"
```

---

### Task 6: Launch Preflight And Client Config Updates

**Files:**
- Modify: `server.mjs`
- Modify: `verify-mvp.mjs`

- [ ] **Step 1: Add preflight auth checks**

Update `getLaunchPreflight()` with:

```js
const usersPage = listUsers({ page_size: 100 });
const activeOwners = usersPage.items.filter((item) => item.role === "owner" && item.status === "active");
checks.push(preflightCheck(
  "user_auth",
  "security",
  "用户认证",
  activeOwners.length > 0 ? "passed" : "failed",
  activeOwners.length > 0 ? "存在可用 owner 用户。" : "没有可用 owner 用户。",
  activeOwners.length > 0 ? "上线前确认已修改 bootstrap 临时密码。" : "创建至少一个 active owner 用户。"
));

checks.push(preflightCheck(
  "session_security",
  "security",
  "会话安全",
  isProduction ? "passed" : "warning",
  isProduction ? "生产环境会话 Cookie 启用 Secure。" : "开发环境会话 Cookie 未启用 Secure。",
  "生产部署使用 NODE_ENV=production、HTTPS 和固定 bootstrap 密码。"
));
```

- [ ] **Step 2: Remove browser exposure of mutation API key**

Update `/system/client-config` so authenticated browser sessions do not need the startup mutation key:

```js
mutation_api_key: allowRemoteAccess ? "" : internalApiKey
```

becomes:

```js
mutation_api_key: ""
```

Keep API-key authorization for scripts that already know `GEO_INTERNAL_API_KEY`.

- [ ] **Step 3: Update tests for client config**

Change old assertion:

```js
assert.ok(clientConfig.body?.data?.mutation_api_key)
```

to:

```js
assert.equal(clientConfig.body?.data?.mutation_api_key, "", "Client config should not expose mutation API key after built-in login");
```

For API-key automation tests, start the server with a known key:

```js
GEO_INTERNAL_API_KEY: "test-internal-key-1234567890"
```

and use that header explicitly.

- [ ] **Step 4: Run check**

Run:

```bash
npm run check
```

Expected: auth, preflight, and client-config tests pass.

- [ ] **Step 5: Commit preflight/client-config changes**

```bash
git add server.mjs verify-mvp.mjs
git commit -m "feat: update preflight for user auth"
```

---

### Task 7: Documentation And Version v0.9

**Files:**
- Modify: `package.json`
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/API_REFERENCE.md`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/PRODUCTION_DEPLOYMENT.md`
- Modify: `docs/OPEN_SOURCE_RELEASE.md`
- Modify: `docs/ROADMAP.md`
- Modify: `docs/README.md`
- Create: `docs/STAGE_V0_9_CLOSEOUT.md`

- [ ] **Step 1: Bump version**

Set `package.json`:

```json
"version": "0.9.0"
```

- [ ] **Step 2: Add changelog**

Add to `CHANGELOG.md`:

```md
## 0.9.0 - 2026-07-06

Built-in multi-user access for one-organization team deployment.

### Added

- Username/password login with HTTP-only browser sessions.
- Role-based permissions for owner, admin, editor, and viewer.
- Settings user management for creating, disabling, and resetting users.
- Access audit events for login, logout, permission denial, and user changes.
- Launch preflight checks for user authentication and session security.

### Changed

- Admin workspace API reads now require a valid session or system API key.
- Browser client config no longer exposes the startup mutation API key.

### Not Included

- Multi-tenant SaaS isolation, OAuth/SSO, MFA, database persistence, email invites, or per-seat billing.
```

- [ ] **Step 3: Document API routes**

In `docs/API_REFERENCE.md`, add:

```md
### Session

- `GET /session/current`
- `POST /session/login`
- `POST /session/logout`

### Users

- `GET /users`
- `POST /users`
- `POST /users/:id/disable`
- `POST /users/:id/reset-password`
```

Document that password hashes are never returned and temporary passwords only appear in create/reset responses.

- [ ] **Step 4: Update deployment docs**

In `docs/PRODUCTION_DEPLOYMENT.md`, add environment guidance:

```md
GEO_BOOTSTRAP_OWNER_PASSWORD=replace-with-at-least-12-characters
GEO_SESSION_TTL_MS=28800000
NODE_ENV=production
```

State that first login uses `owner` plus the bootstrap password and operators must reset it before use.

- [ ] **Step 5: Add closeout**

Create `docs/STAGE_V0_9_CLOSEOUT.md`:

```md
# v0.9 Stage Closeout

## Stage Result

GEO Pulse has reached the v0.9 multi-user access stage.

This stage adds built-in login, session cookies, role-based access control, user management, access audit events, and launch preflight checks for one-organization team use.

## Launch Boundary

Use v0.9 as a controlled single-organization deployment for internal teams.

It is still not a complete SaaS platform. It does not include tenant isolation, OAuth/SSO, MFA, database persistence, email invitations, seat billing, or external identity-provider integration.

## Verification

```bash
npm run check
```

Expected result:

```text
verify-mvp: OK
```
```

- [ ] **Step 6: Update roadmap and docs index**

Update roadmap current state from v0.8 to v0.9 and move "Real authentication and role-based authorization" out of the hardening list into completed scope, while keeping multi-tenant isolation and database persistence as future work.

- [ ] **Step 7: Run check and SEO scan**

Run:

```bash
npm run check
node /Users/aidi/.codex/skills/google-seo/scripts/check-static-seo.mjs .
```

Expected: `verify-mvp: OK`, SEO errors `0`, warnings `0`.

- [ ] **Step 8: Commit docs**

```bash
git add package.json README.md CHANGELOG.md docs/API_REFERENCE.md docs/ARCHITECTURE.md docs/PRODUCTION_DEPLOYMENT.md docs/OPEN_SOURCE_RELEASE.md docs/ROADMAP.md docs/README.md docs/STAGE_V0_9_CLOSEOUT.md
git commit -m "docs: close multi-user access v0.9"
```

Do not stage `docs/MAINTENANCE.md` unless the user explicitly asks.

---

### Task 8: Browser Smoke And Final Verification

**Files:**
- Modify only if smoke exposes defects.

- [ ] **Step 1: Run full check**

Run with permission to listen on local ports:

```bash
npm run check
```

Expected:

```text
verify-mvp: OK
```

- [ ] **Step 2: Run static SEO scan**

Run:

```bash
node /Users/aidi/.codex/skills/google-seo/scripts/check-static-seo.mjs .
```

Expected:

```text
Errors: 0
Warnings: 0
```

- [ ] **Step 3: Start local server for browser smoke**

Run:

```bash
PORT=3106 GEO_ENABLE_PERSISTENCE=0 npm run start
```

Expected:

```text
GEO Pulse MVP running at http://localhost:3106
```

- [ ] **Step 4: Browser smoke with Playwright CLI**

Use:

```bash
/Users/aidi/.codex/skills/playwright/scripts/playwright_cli.sh open 'http://localhost:3106/'
/Users/aidi/.codex/skills/playwright/scripts/playwright_cli.sh snapshot
```

Verify snapshot includes:

- `登录 GEO Pulse`
- username field
- password field
- login button

Fill:

```bash
# Run snapshot first, then use the username/password/button refs shown in that snapshot.
/Users/aidi/.codex/skills/playwright/scripts/playwright_cli.sh fill <username-ref> owner
/Users/aidi/.codex/skills/playwright/scripts/playwright_cli.sh fill <password-ref> geo-owner-change-me
/Users/aidi/.codex/skills/playwright/scripts/playwright_cli.sh click <login-button-ref>
/Users/aidi/.codex/skills/playwright/scripts/playwright_cli.sh snapshot
```

Verify snapshot includes:

- `总览看板`
- current user display in sidebar
- `退出登录`

Navigate to settings, verify:

- `用户管理`
- users table
- create user form for owner/admin

Click logout and verify login page returns.

- [ ] **Step 5: Clean smoke artifacts**

Stop server and remove Playwright temp files:

```bash
rm -rf .playwright-cli
```

- [ ] **Step 6: Final status check**

Run:

```bash
git status --short
git log --oneline -5
```

Expected:

- only pre-existing `docs/MAINTENANCE.md` remains unstaged.
- latest commits include v0.9 implementation and docs.

- [ ] **Step 7: Final report**

Report:

- commits created,
- verification commands and outputs,
- browser smoke result,
- remaining local-only files,
- whether GitHub push was done or still pending user instruction.

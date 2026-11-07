# Full Application Blueprint: Product, UX, Architecture, and Access Control

This document is a framework-agnostic blueprint for planning and building a
complete application. It covers product structure, user journeys, information
architecture, visual design, shared UI, domain features, administration,
application architecture, authentication, authorization, and operational
readiness.

The blueprint is informed by the reference application: a public company and
product experience with customer commerce and account features, plus a
permission-controlled staff workspace. Treat those domain-specific features as
examples, not mandatory modules. Replace them with the workflows, language,
roles, policies, and technology choices that fit the app being built.

## 1. Full application blueprint

### Product foundation

Before designing individual pages, agree on the product's purpose and
boundaries:

- **Product promise:** What user problem does the application solve, and what
  is the primary successful outcome?
- **Primary audiences:** Who uses the application, what are they trying to do,
  and what level of expertise or access do they have?
- **Core objects:** What important things does the application manage (for
  example, products, projects, bookings, documents, cases, or subscriptions)?
- **Primary journeys:** What are the three to five workflows that make the
  product valuable?
- **Business rules:** What must be true before users can create, edit, publish,
  approve, pay for, or delete core objects?
- **Boundaries:** Which capabilities are public, signed-in, staff-only, paid,
  region-specific, or explicitly out of scope?

Translate these into a short product brief, an initial page map, a domain model,
and acceptance criteria. Do not start from a list of screens alone: each screen
should support a known audience and a meaningful task.

### Personas and access areas

A flexible application often has some combination of these access areas. Merge
or omit them if the product does not need them:

| Area | Typical audience | Primary purpose |
|---|---|---|
| Public experience | Visitors and prospective users | Explain the product, publish public information, and help users discover the next action |
| Customer/member workspace | Signed-in end users | Manage their own profile, saved items, requests, purchases, activity, or documents |
| Staff workspace | Employees and operators | Process work, manage records, respond to users, and monitor operations |
| System/owner workspace | Trusted operators | Manage users, permissions, configuration, integrations, and audit history |

Use the smallest number of distinct workspaces that keeps navigation and
permissions understandable. A role is not a persona: one persona may hold
multiple capabilities, and a role name should not replace explicit resource or
action authorization.

### Information architecture and navigation

Organize the application around user tasks and domain concepts rather than
backend tables. A general structure is:

```text
Application
├─ Public
│  ├─ Home / overview
│  ├─ Discover / catalog / services
│  ├─ Domain detail pages
│  ├─ About / help / contact
│  └─ Sign in / join
├─ User workspace
│  ├─ Overview
│  ├─ My records / activity
│  ├─ Saved items / preferences
│  └─ Profile / security / notifications
└─ Staff workspace
   ├─ Operational overview
   ├─ Work queues / domain management
   ├─ People / communications
   ├─ Content / files / reports
   └─ Team / permissions / settings / audit
```

Treat this as a menu of patterns, not a required sitemap. Select only the
branches supported by the product. For each page, record its audience, purpose,
entry points, required data, primary action, permission, empty state, and
mobile behavior. Use breadcrumbs for deep work areas and provide a clear
active-location state in navigation.

### Capability map: public, user, and staff features

The reference application demonstrates the following reusable feature
families. A new application should choose the families relevant to its domain:

**Public and discovery experience**

- Landing page that explains the value proposition and directs visitors to
  the main action.
- Searchable or browsable catalog of domain objects, with category,
  collection, or taxonomy navigation.
- Detail pages with descriptive content, metadata, availability/status, and
  related items.
- Editorial and trust content, such as company information, project examples,
  testimonials, articles, FAQs, and contact channels.
- Public media and downloadable resources, with appropriate visibility and
  caching rules.

**Core user workflow**

- A discovery or selection tool, such as a product configurator, planner,
  estimator, booking selector, or saved-work builder.
- A persistent selection or saved-items experience, where useful.
- A guided request, checkout, booking, application, or submission flow.
- Clear confirmation, receipt/reference, next steps, and status tracking.
- A signed-in workspace for profile, addresses/preferences, history, saved
  work, requests, and account security.
- A support/contact flow and a channel for messages or status updates.

**Staff operations**

- Overview dashboards with useful workload and status summaries.
- Searchable tables or queues for the domain's operational records.
- Create, edit, review, approve, publish, cancel, or archive flows according
  to the domain's lifecycle.
- Inventory/capacity/resource management where the product has limited
  supplies, schedules, or allocations.
- Customer/member management with appropriate privacy and permission limits.
- Payment, billing, refund, invoice, or reconciliation screens when relevant.
- Content, media, messaging, reporting, and notification tools as needed.
- Team access, roles/permissions, system configuration, and audit history for
  trusted operators.

Avoid implementing every listed feature by default. Choose a coherent product
slice, then extend the application through explicit lifecycle and permission
decisions.

### End-to-end business journeys

Write each important journey from the user's goal through the final system
state. Use a structure like this:

```text
Discover -> inspect details -> select/configure -> submit or purchase
         -> receive confirmation -> track progress -> complete or get support

Staff queue -> open record -> verify context -> take authorized action
            -> notify affected user -> record outcome -> review history

Owner setup -> define workspace/team -> assign least privilege
            -> configure policies/integrations -> monitor activity -> audit
```

For every journey define:

1. **Entry point:** where the user starts, and whether the action is public,
   authenticated, or staff-only.
2. **Required context:** selected object, account, organization, location,
   currency, or other domain inputs.
3. **Validation:** client-side guidance plus authoritative server-side rules.
4. **Lifecycle transitions:** allowed status changes and who may trigger them.
5. **Failure and recovery:** network interruption, conflict, unavailable
   resource, duplicate submission, payment failure, or expired session.
6. **Completion:** durable record, visible confirmation, notification, and
   follow-up action.
7. **Auditability:** what must be recorded, by whom, and for how long.

The browser should not claim an operation succeeded until the server confirms
the durable result. For sensitive or financial operations, use idempotency and
an explicit state machine rather than relying on a single client-side button
state.

### Domain model and lifecycle design

Model the domain around its real business concepts. Typical records include
accounts, organizations, domain objects, child items/variants, requests or
orders, status history, payments, files, messages, settings, and audit events.
These are examples, not a schema to copy verbatim.

For each important record:

- Define its owner and organization/tenant boundary.
- Decide which fields are user-editable and which are server-controlled.
- Define its lifecycle and legal state transitions.
- Capture creation/update timestamps and actor identity where appropriate.
- Use explicit relations and constraints to prevent orphaned or duplicate data.
- Define retention, privacy, and deletion rules.
- Decide whether changes require an audit event or immutable history row.

Represent important workflows with explicit status values and validated
transitions. Do not infer sensitive business states solely from a collection of
nullable fields. Make ownership and tenancy part of database queries, not a
post-query UI filter.

### Application architecture and responsibility boundaries

Keep the implementation understandable by assigning one responsibility to
each layer:

| Layer | Responsibility |
|---|---|
| Route/page layer | Select data and compose the experience for a URL and audience |
| Shared UI/components | Render consistent interactions, forms, navigation, tables, feedback, and access-aware affordances |
| Client state | Hold temporary interaction state and safe session presentation; do not become the authority for permissions |
| API/service layer | Validate requests, enforce authentication/authorization, apply business rules, and return stable response shapes |
| Persistence layer | Enforce data relations, uniqueness, transactions, ownership, and durable lifecycle state |
| Integration layer | Encapsulate email, payments, storage, analytics, search, maps, or external identity providers |
| Operations layer | Manage secrets, logs, metrics, backups, rate limits, deployment, and incident response |

Keep business decisions in reusable server-side services rather than duplicating
them across page components or route handlers. Use shared request/response
schemas where practical. Centralize navigation metadata and permission
requirements so menus and pages do not drift, while still enforcing every
operation at the API/service boundary.

### Whole-app visual design system

Create one coherent visual language for the entire product, not just
authentication pages. Begin with the host brand or define a neutral brand
direction, then expose its choices through design tokens:

| Token family | Examples of purpose |
|---|---|
| Color | Canvas, elevated surfaces, primary/secondary text, borders, focus, actions, success/warning/error/info |
| Type | Display/title, section heading, body, labels, metadata, code/data, validation |
| Space | Page gutters, section gaps, control spacing, dense data spacing |
| Shape | Control radius, card radius, dialog radius, pill/badge shape |
| Elevation | Navigation, cards, menus, dialogs, popovers |
| Motion | Hover/focus, disclosure, loading, route/state transition |
| Layout | Content widths, grid breakpoints, sidebar width, table behavior |

Use semantic names so a brand refresh changes tokens rather than every
component. Maintain accessible contrast and visible keyboard focus in all
themes. Do not communicate status with color alone. Define type scale, spacing,
control heights, icon rules, and chart/table colors alongside the palette.

**Visual direction:** make the interface feel trustworthy, calm, and
purposeful. Use one dominant action per view, a clear heading and contextual
description, consistent alignment, and whitespace to group information.
Reserve strong color for the primary action and meaningful status. Keep brand
illustration or photography supportive, not a substitute for clear content.
Use restrained shadows and borders, and avoid using multiple competing card
styles or unrelated button treatments.

### Layout patterns and responsive rules

- **Public marketing/discovery:** editorial hero or intro, clear primary
  action, scannable content sections, deliberate image ratios, and a
  high-visibility global navigation. On mobile, collapse navigation accessibly
  and keep the main action easy to reach.
- **Catalog/search:** filter and sort controls with an obvious active-filter
  state, result count, usable cards/list rows, loading/empty/error states, and
  mobile-friendly filter disclosure. Preserve query state in the URL when
  useful.
- **Detail/configuration:** strong object identity, clear price/status/metadata
  hierarchy, primary next action, related information, and a persistent
  summary only when it does not crowd the small-screen experience.
- **Guided form/checkout:** one logical task per step, progress indication
  proportional to the actual workflow, review before irreversible submission,
  and clear recovery if payment or submission fails.
- **User workspace:** compact overview, task-oriented navigation, recent
  activity/status, profile/security separated from operational content.
- **Staff dashboard:** navigation/sidebar plus a content area, task queues,
  filters, table/list density appropriate to repeated work, and visible
  record-status/actions. On mobile, prioritize critical work and use responsive
  cards or contained horizontal scrolling for data tables.
- **Dialog/sheet:** reserve for short, contextual tasks. Use a full page for
  complex forms, deep workflows, or content that needs a stable URL.
- **Reports:** readable data labels, date/range context, summaries before
  charts, accessible tables or descriptions for chart values, and clear export
  permissions.

Set breakpoints based on content needs rather than device names. Test narrow
phones, large text/zoom, tablet widths, and wide desktop. Avoid fixed-width
layouts and overlays that trap users behind a keyboard or cover the primary
action.

### Shared whole-app components

Build and document shared components before repeating patterns:

- Global header, primary navigation, account menu, mobile menu, breadcrumbs,
  sidebar, page title/action area, footer, and notification center.
- Buttons, links, icon buttons, badges, tooltips, tabs, dialogs, drawers,
  dropdowns, alerts, toasts, skeletons, and empty states.
- Text/select/date/number/file/phone inputs, field labels, helper text,
  validation, form summary, and confirmation patterns.
- Search, filter chips, sortable table headers, pagination, bulk actions,
  result count, list/grid cards, status history, and activity feed.
- Domain-specific summary cards, price/currency displays, media previews,
  upload progress, and structured confirmation/review sections.
- Authentication and permission-aware components described in the later
  sections of this document.

Each component specification should cover purpose, variants, states,
responsive behavior, keyboard interaction, screen-reader semantics, and
examples of when not to use it. Prefer one consistent component API over
page-specific copies.

### Content, language, and communication

- Use plain language and consistent names for the same object and action
  throughout navigation, forms, status labels, emails, and support content.
- Write headings that state the task or content, not generic labels such as
  "Details" when a more descriptive title is available.
- Explain the consequence of an action before asking for confirmation.
- Localize dates, numbers, currency, units, and messages intentionally; do not
  concatenate translated fragments to create sentences.
- Support the product's required languages and text expansion; do not encode
  layout assumptions based on English string lengths.
- Define transactional notifications for important state transitions and
  user-facing system changes. Keep marketing preferences separate from
  required security or operational notices.
- Add search metadata, page titles, descriptions, structured data, and sharing
  previews for public content where discoverability matters.

### App-wide states and resilience

Every page and asynchronous operation should define:

| State | Product-wide presentation |
|---|---|
| Loading | Stable skeleton/progress; avoid blank views and protected-content flashes |
| Empty | Explain why there is no data and offer the most useful next action |
| Validation | Connect the error to the field or rule and preserve safe input |
| Unauthorized | Route to sign-in or refresh the session without losing safe context |
| Forbidden | Explain the restriction without disclosing inaccessible data |
| Not found | State that the requested item is unavailable and provide a safe route back |
| Conflict | Explain stale/duplicate/state-transition conflicts and allow a fresh read |
| Offline/network failure | Preserve recoverable input and offer retry where safe |
| Server failure | Use a calm message, avoid internal details, and expose a support path if needed |
| Success | Confirm the server result and explain what happens next |

Prevent duplicate submissions, make retry behavior explicit, and use idempotency
for operations that must not happen twice. Do not optimistically show success
for a consequential action before the server confirms it.

### Cross-cutting product concerns

Plan these across the whole application rather than retrofitting them per
screen:

- **Security and privacy:** authentication, authorization, resource ownership,
  secure defaults, data minimization, retention, CSRF, validation, and audit.
- **Accessibility:** keyboard, screen reader, contrast, zoom, reduced motion,
  semantic structure, and accessible charts/tables.
- **Performance:** page and API budgets, image optimization, caching rules,
  pagination, background work, and protection from expensive queries.
- **Reliability:** error boundaries, retries, idempotency, transactional
  updates, backups, monitoring, and user-visible degraded states.
- **Observability:** structured logs, correlation/request IDs, health checks,
  metrics, alerting, and redaction of passwords, tokens, payment data, and
  sensitive personal data.
- **Integrations:** explicit ownership of provider credentials, webhook
  verification, timeout behavior, retry policy, reconciliation, and failure
  queues.
- **Search and files:** access-aware indexing, file type/size checks, private
  versus public media policies, malware scanning where required, and lifecycle
  cleanup.
- **Compliance and governance:** legal content, consent history, export and
  deletion requests, accessibility obligations, and region-specific policies.

### Delivery sequence for a new app

Use an incremental delivery plan so the first release forms a complete usable
product rather than a collection of disconnected pages:

1. Define product promise, audiences, core objects, top journeys, and scope.
2. Draw the sitemap, access areas, state transitions, and permission boundary.
3. Define the core data model and API contracts around the journeys.
4. Establish the visual tokens, typography, layout primitives, and shared
   components.
5. Build the public shell and one complete core journey, including empty,
   error, and success states.
6. Add account/session behavior and resource-ownership checks if the journey
   needs an account.
7. Add staff operations for the same core records with explicit lifecycle
   actions and permissions.
8. Add secondary capabilities such as search, content, reporting, messaging,
   integrations, and notifications according to product priority.
9. Verify accessibility, responsive behavior, security boundaries, performance,
   logging/monitoring, backups, and deployment configuration.
10. Release, observe real usage and failures, then prioritize improvements
    based on evidence rather than adding every optional feature.

For every milestone, define testable acceptance criteria for user-visible
behavior, authorization, data integrity, and responsive/accessibility behavior.

### App blueprint handoff template

Before building another app, fill in this short product-specific brief:

```text
Product name and promise:
Primary audiences:
Core domain objects:
Top user journeys:
Public pages:
Signed-in workspace:
Staff/admin workspace:
Core lifecycle states:
Integrations:
Sign-in and account-recovery policy:
Roles/permissions and ownership boundaries:
Brand colors/type/voice:
Supported screens and devices:
Languages/locales:
Accessibility/compliance needs:
First-release scope:
Success measures:
```

## 2. Authentication, authorization, and access control

The application separates four related concerns:

1. **Authentication** establishes who the user is. A user signs in with an
   email address or phone number and a password, then completes email
   verification and, where required, a second factor.
2. **Session management** keeps the user signed in. A short-lived access JWT is
   sent as a bearer token. A longer-lived opaque refresh token is held in an
   HttpOnly cookie and rotated against a database record.
3. **Authorization** determines which operations the authenticated user may
   perform. The application stores permission grants per user, computes
   effective permissions from a central catalog, and checks those permissions
   on the server for protected API operations.
4. **Resource access control** determines which records the user may access.
   Authentication alone does not grant access to another person's data; each
   handler must scope database queries to the authenticated user or require an
   appropriate administrative permission.

The main reusable principle is:

> **The user interface can hide or explain unavailable actions, but only
> server-side checks decide whether an operation is authorized.**

## 3. How the current application is organized

### Authentication and sessions

- `app/api/auth/login/route.ts` validates credentials, handles verification and
  multi-factor challenges, creates a refresh session, and returns an access
  token.
- `lib/auth/jwt.ts` signs and verifies access tokens.
- `lib/auth/refresh-tokens.ts` creates, rotates, and revokes refresh sessions.
- `lib/auth/csrf.ts` protects cookie-authenticated refresh and logout requests.
- `lib/middleware/withAuth.ts` is the primary server-side authenticated-request
  guard.
- `contexts/auth-context.tsx`, `lib/token-store.ts`, and `lib/api-client.ts`
  restore the browser session and attach the access token to API calls.

### Permissions and authorization

- `lib/permissions/catalog.ts` defines permission codes, labels, descriptions,
  groupings, implied permissions, sensitive permissions, and example presets.
- `lib/permissions/core.ts` expands implied permissions and evaluates access.
- `lib/middleware/withPermission.ts` applies permission requirements to API
  handlers.
- `lib/permissions/assignment.ts` validates permission changes.
- `lib/permissions/permissions.ts` synchronizes grants and records grant/revoke
  events.
- `components/permission-gate.tsx` provides user-interface gating.
- `prisma/schema.prisma` contains the user, role, permission, permission-grant,
  permission-audit, and refresh-session records.

## 4. Account and authorization data model

The current data model has a user record with identity, password hash,
activation and email-verification state, login metadata, and multi-factor
configuration. Users can have role memberships and direct permission grants.
The relevant Prisma models are `User`, `Role`, `Permission`, `UserPermission`,
`PermissionLog`, and `RefreshToken` in `prisma/schema.prisma`.

The important distinction is that **roles and permissions are not the same
thing in this application**:

- A `Role` is a fixed-ID account classification, such as customer, support
  staff, or administrator.
- A `Permission` is a capability code, such as `orders.view` or
  `payments.refund`.
- `UserPermission` links a specific user directly to a permission. The schema
  does not have a role-to-permission join table.
- The permission presets in the catalog are templates for choosing grants;
  they do not themselves authorize requests.

This is best described as **user-level permissions with role-based account
classification**, rather than a conventional system where every role owns a
fixed permission set. Staff access is customized by assigning permission codes
to individual accounts.

For a new application, decide whether to retain direct user grants, use a
role-to-permission mapping, or combine both. A role-to-permission model is
usually easier to manage when many users share stable job functions. Direct
grants can still be useful for exceptional access, but should be audited and
kept limited.

## 5. Sign-up and account verification

Public registration in `app/api/auth/register/route.ts` follows this general
sequence:

1. Validate and normalize submitted data; the route uses a strict schema.
2. Check current legal-document acceptance and email eligibility.
3. Reject blocked, disposable, or non-deliverable email domains and detect
   duplicate email or phone numbers.
4. Hash the password with bcrypt before storing it.
5. Create the account as a customer. The role is selected by the server, not
   trusted from a submitted role field.
6. Assign the default customer permission set and record legal acceptances.
7. Send an email-verification link. The account does not receive an access
   token merely because registration succeeded.

The verification token is signed with an HMAC and expires after 24 hours. The
verification endpoint checks the signature and expiry, confirms that the
account and email still match, then marks the email as verified.

**Reusable guidance:** keep registration separate from staff provisioning.
Public users should receive the least-privileged account classification by
default. Grant staff privileges only through an authenticated administrative
workflow.

## 6. Sign-in, access tokens, and refresh sessions

### Sign-in

The login endpoint accepts an email address or phone number and a password. It
normalizes email addresses, checks the password hash, and uses a dummy bcrypt
comparison when the account lookup fails to reduce obvious timing differences.
After a valid password, it checks that the account is active and that its email
has been verified.

The backend then determines the account type, filters grants to the codes
allowed for that type, expands implied permissions, and returns the effective
permission list with the user summary.

### Access JWT

The access token is signed using HS256. Its verified claims include:

- `sub`: the user ID, represented as a string;
- `sessionId`: the database refresh-session row ID;
- `permissions`: the effective permission codes;
- issuer, audience, issued-at, and expiration claims.

The current access-token lifetime is **15 minutes**. The access-token secret
must be configured and at least 32 characters long. Verification restricts the
accepted algorithm, issuer, and audience; it also validates the user and
session IDs and the shape of the permission claim.

The browser sends this token in the `Authorization: Bearer ...` header. The
browser token store is in-memory rather than persistent browser storage, so a
page reload restores a session by calling the refresh endpoint.

### Refresh token and rotation

The refresh token is a cryptographically random opaque value. The raw token is
returned only in a cookie; the database stores a SHA-256 hash of it. A refresh
record includes the owning user, expiry, revocation time, token-family ID,
replacement record ID, and limited client metadata.

The refresh cookie is configured as:

- `HttpOnly`, so browser JavaScript cannot read it;
- `SameSite=Lax`;
- `Secure` in production;
- scoped to `/api/auth`;
- valid for one week.

On refresh, the server validates the cookie-backed request, locates the token
by its hash, checks the user and token status, revokes the old token, and creates
a replacement in the same family. Reuse outside the brief 10-second rotation
grace period revokes the remaining active tokens in that family. The refresh
endpoint returns a new short-lived access JWT and sets the replacement cookie.

Logout revokes the refresh-token family and clears the browser cookie. Password
changes, password resets, deactivation, and administrative password changes
also revoke that user's refresh sessions, so previously issued access tokens
will stop passing the server-side session check.

### Request restoration in the browser

`AuthProvider` attempts a refresh once when the application starts if its
in-memory token store is empty. The API client attaches the bearer token to
requests and coordinates concurrent refresh attempts through one shared
in-flight promise. If an API request receives an authentication failure, the
client attempts one refresh and retries the original request once.

## 7. Multi-factor authentication and password recovery

### Multi-factor authentication

Staff accounts are required to complete a second factor at login. If a staff
account has not configured another method, the login flow uses email OTP and
enables email-based two-factor authentication after successful verification.
Users can also enroll in email OTP or an authenticator application. Authenticator
secrets are encrypted at rest with AES-256-GCM; the encryption key is supplied
through configuration.

Email OTP and enrollment challenges are signed, time-limited, and bound to the
user and relevant account state. The login/email challenge lifetime is five
minutes. TOTP codes use a 30-second step and accept the adjacent step on either
side to accommodate small clock differences. Staff cannot disable two-factor
authentication through the self-service endpoint.

The current implementation does not expose a recovery-code flow in the
endpoints inspected. If the new application needs account recovery when a
second factor is lost, design that flow explicitly; do not silently bypass
second-factor verification.

### Password reset and change

Password reset requests return the same general message whether or not an
eligible account exists, reducing account enumeration. A signed reset challenge
expires after 30 minutes and is bound to the user's current password hash.
After a successful reset, the new bcrypt hash invalidates the old challenge,
and active refresh sessions are revoked.

Changing a password while signed in requires the current password and also
revokes refresh sessions. Password-change notifications are sent by email.

**Policy discrepancy to resolve when adapting:** public registration requires
at least eight characters, while the self-service password-change and
administrative staff-creation paths inspected allow a six-character minimum.
Choose one password policy and enforce it consistently in every account
creation, reset, change, and administrative workflow.

## 8. Server-side authorization checks

### Authentication guard

`withAuth` is the main API guard. It:

1. Reads a bearer token from the `Authorization` header.
2. Verifies the JWT signature and claims.
3. Loads the active user from the database.
4. Confirms that the referenced refresh-session row still exists, is not
   revoked, and has not expired.
5. Recomputes effective permissions from the current database grants and
   account type.
6. Compares the recomputed permission set with the token claim. A mismatch
   rejects the token, causing the client to refresh and obtain current claims.
7. Enforces current legal-document acceptance for protected API requests,
   returning HTTP 428 when acceptance is required (with explicit exclusions
   for logout and legal-management/acceptance endpoints).
8. Passes a trusted user object to the route handler.

This database check is important: a valid JWT alone does not prove that the
user is still active, the session is still valid, or the user's permissions
have not changed.

### Permission guard

`withPermission` wraps `withAuth` and checks one or more permission codes before
calling the handler. For an array of required permissions, the current helper
requires **all** listed permissions. A separate `hasAnyPermission` helper
supports **any-of** checks.

The permission evaluator expands implied capabilities before comparing. For
example, granting a broad management permission can imply its view, create,
update, or related capabilities. The `admin` code is treated as a full-access
grant. The catalog also marks high-impact permissions, such as pricing,
payments, user permissions, and settings, as sensitive for administrative
presentation and review.

### Record ownership

A successful `withAuth` check only proves who is making the request. It does
not automatically prove that the user owns the requested order, payment,
design, or other record. A handler for self-service data should derive the
user ID from the trusted authenticated context and include it in the database
filter, for example conceptually:

```ts
findFirst({
  where: {
    id: requestedRecordId,
    userId: authenticatedUser.id,
  },
});
```

Administrative reads or changes should instead require an appropriate
permission and still validate the requested resource and operation. Never use
a user ID supplied by the request body as the authority for a "my account" or
"my orders" operation.

## 9. Permission catalog and grant management

The catalog groups permissions into operational areas such as catalog,
inventory, orders, payments, customers/messages, content/media, blog, reports,
and users/access. Codes are stable identifiers; labels and descriptions are
human-readable metadata. Implied permissions are expanded transitively with a
visited set so repeated implications and cycles do not loop forever.

Grant-management endpoints apply additional controls:

- They validate that submitted codes are known, unique, and valid for the
  target account type.
- A non-administrator staff actor may grant only permissions that actor already
  possesses.
- Customer accounts can receive only customer permission codes.
- Permission changes run inside database transactions.
- New and removed grants are recorded with actor, target, code, and action.
- The user-management flow contains safeguards against self-deactivation and
  removing the actor's own user-management access.

The role presets in `lib/permissions/catalog.ts` are starting selections for
the administrative UI. They are not a substitute for checking each user's
actual permission grants on the server.

## 10. User-interface route and action gating

`ProtectedRoute` waits for session restoration, redirects unauthenticated
visitors to sign-in, and checks legal-document acceptance before displaying
protected page content. The admin layout also wraps its content in a
permission gate. Individual controls use `PermissionGate` to hide or explain
actions that the current user cannot perform.

This improves the user experience, but it is not the security boundary. A user
can call an API directly or alter browser state. The matching API handler must
still use `withAuth` and, for privileged operations, `withPermission`.

## 11. Adaptable authentication frontend flow

This section describes the user journey, not a particular visual style or
frontend framework. Keep the sequence and state transitions; adapt the names,
branding, page layout, input fields, and optional steps to your app.

### Screen map

An app can use separate pages or combine related steps into a single
multi-state page. A practical screen set is:

1. **Sign in** — identifier, password, submit, password-recovery link, and
   registration link when public registration is available.
2. **Second-factor verification** — one-time code input, delivery/method
   explanation, submit, and resend or restart action when supported.
3. **Registration** — account details, password, terms/privacy acceptance, and
   a clear successful-submission message.
4. **Verify email** — explain that the user must follow the message, offer
   resend where supported, and provide a clear path back to sign-in.
5. **Forgot password** — collect the account identifier and always show a
   generic confirmation that does not reveal whether the account exists.
6. **Reset password** — accept the reset link/token, collect and confirm a
   replacement password, then direct the user to sign in again.
7. **Protected application shell** — show a loading state during session
   restoration; then show the authenticated application only when access checks
   have completed.
8. **Access denied / unavailable** — explain that a page or action is not
   available, without exposing restricted data. Offer a safe return or support
   path.
9. **Account security settings** — optionally let a signed-in user change a
   password and enroll in or manage MFA. Ask for the current password before
   sensitive changes.

The current app implements the sign-in and MFA stages in the same login page,
while registration, verification, password recovery, and account settings have
their own routes. Another app can make the same stages separate screens, a
wizard, or modal panels as long as it preserves the transitions and security
checks below.

### Main sign-in journey

```text
Open sign-in
  ├─ Session restoration is still running -> show loading state
  ├─ An authenticated session is restored -> go to a safe intended destination
  └─ No session -> show identifier + password form
       ├─ Submit -> show progress and prevent duplicate submission
       ├─ Invalid credentials -> show a general error; keep the form usable
       ├─ Email verification needed -> show verification instructions
       ├─ Account disabled -> show a support/account-status message
       ├─ Second factor needed -> replace credentials step with code step
       │    ├─ Invalid/expired code -> show an inline error; retain the step
       │    ├─ Resend/restart -> request a new challenge and update its state
       │    └─ Valid code -> establish session
       └─ Successful sign-in -> store access state and continue to destination
```

Treat these server outcomes as distinct UI states rather than as one generic
success response. Never treat a two-factor challenge or an email-verification
notice as a signed-in session. The current app's sign-in page does this by
changing the form title and inputs to a code step and by routing verification
and disabled-account outcomes to dedicated screens.

### Registration, verification, and password recovery

```text
Registration form
  -> validate fields and required policy acceptance
  -> submit to server
     ├─ invalid/conflict -> show actionable field or form errors
     ├─ service unavailable -> retain entered fields and offer retry
     └─ account created -> show "check your email" confirmation
          -> verification link opens app
             ├─ valid -> show verified state and sign-in link
             └─ invalid/expired -> explain expiry and offer a safe retry path

Forgot password
  -> submit account identifier
  -> always show the same confirmation wording
  -> user follows email link to reset form
  -> validate new password + confirmation
  -> submit reset token
     ├─ invalid/expired -> explain that a new link is needed
     └─ success -> confirm reset and send user to sign-in
```

Do not show account-existence-specific wording on the forgot-password screen.
When a submitted form fails because of a temporary server error, avoid clearing
the user's input unless there is a specific security reason.

### Protected-page entry and return navigation

```text
User opens a protected page
  -> restore/check session
     ├─ no valid session -> send to sign-in with a safe return destination
     └─ valid session -> check any app-wide prerequisites
          ├─ prerequisite missing (for example, current terms) -> show required step
          └─ prerequisite complete -> render protected page
               -> check page/action permission
                    ├─ authorized -> show page/action
                    └─ not authorized -> hide or explain the restriction
```

The return destination should be restricted to safe same-application paths.
Do not redirect blindly to an arbitrary URL supplied in a query parameter.
After a successful sign-in, MFA, verification, or required acceptance step,
return the user to that destination when it remains valid; otherwise use a
safe default such as the account home page.

### Session-expiry and sign-out experience

- On application start, show a neutral loading state while the app attempts to
  restore the session using its refresh mechanism.
- During ordinary API calls, refresh an expired access credential once and
  retry the original request once. Avoid rendering repeated login prompts for
  concurrent failures while one refresh is already running.
- If refresh fails, clear local authenticated state, route to sign-in, and
  preserve only a safe return path if appropriate.
- On sign-out, request server-side session revocation and clear local
  authenticated state. If revocation fails, still clear local state, but tell
  the user that the server session could not be confirmed revoked.
- Do not store long-lived refresh secrets in JavaScript-accessible storage.

### Authorization in the application UI

For each page and action, decide which of these user experiences is intended:

- **Hide** — do not show an action that the user cannot perform.
- **Disabled with explanation** — show that the feature exists but is
  unavailable, optionally explaining why.
- **Access-denied page/message** — use for a directly opened restricted page.

Use one consistent permission-aware component or helper so navigation links,
buttons, forms, and destructive actions use the same policy vocabulary. For an
edit form, gate individual operations as needed: viewing a record does not
necessarily grant edit, publish, export, delete, or price-change rights.

The frontend permission state is a presentation hint, not proof of authority.
Every protected API request must authenticate and authorize again on the
server. Use a distinct backend error for unauthenticated versus authenticated
but unauthorized requests, then map those outcomes to sign-in or access-denied
UI respectively. Do not rely on hiding a button to protect its endpoint.

### Frontend state and interaction rules

For every async step, design for these states:

| State | Expected behavior |
|---|---|
| Initializing | Show a neutral loading state; do not flash protected content. |
| Ready | Enable only the fields and actions valid for the current step. |
| Submitting | Show progress and prevent accidental duplicate submissions. |
| Validation error | Identify the field or form problem and preserve safe input. |
| Authentication error | Use non-enumerating/general wording where needed. |
| Expired challenge | Explain how to restart or request a new challenge. |
| Network/server failure | Keep the user on the current step and provide retry. |
| Success | Confirm the outcome and navigate to the correct next step. |

Use semantic labels, keyboard-operable controls, visible focus states, and
announced status/error messages. Keep password and one-time-code entry
compatible with password managers and browser autocomplete. Avoid showing
technical stack traces, token values, permission internals, or private account
details in user-facing messages.

### Frontend-to-backend handoff

| Frontend event | Backend operation | Frontend result |
|---|---|---|
| Submit credentials | Login endpoint | Signed-in state, verification state, disabled state, MFA challenge, or generic error |
| Submit MFA code | Login endpoint with challenge | Signed-in state or inline challenge error |
| Refresh session | Refresh endpoint using protected cookie | New access state or signed-out state |
| Sign out | Logout endpoint | Clear local state and return to public/sign-in page |
| Register | Registration endpoint | Verification instructions or field/form errors |
| Verify email | Verification endpoint | Verified confirmation or expired-link recovery |
| Request reset | Forgot-password endpoint | Same confirmation regardless of account existence |
| Set new password | Reset endpoint | Success/sign-in or invalid/expired-link message |
| Open protected page/action | Authenticated API + permission guard | Data/action, sign-in flow, or access-denied experience |

### Current app screens used as reference

- Sign-in and MFA state: `app/[locale]/(public)/login/page.tsx`.
- Session restoration and sign-in state: `contexts/auth-context.tsx` and
  `lib/api-client.ts`.
- Protected-page loading, redirect, and legal-acceptance check:
  `components/protected-route.tsx`.
- Permission-aware controls: `components/permission-gate.tsx`.
- MFA setup and account security settings:
  `app/[locale]/(protected)/account/settings/page.tsx`.

## 12. Visual styling for authentication and access-control surfaces

The interface should feel like a coherent part of the host application rather
than a generic security portal. Define the brand's colors, typography, logo,
illustration style, and voice once, then apply them through semantic design
tokens. The examples below specify hierarchy and behavior without requiring a
specific palette, font, framework, or component library.

### Visual direction and design tokens

Use the host application's existing visual identity when available. For a new
app, choose a restrained, high-contrast system appropriate to its audience:
clear form surfaces, obvious primary actions, calm neutral backgrounds, and
consistent feedback colors. Avoid decorative elements that compete with the
task or obscure security instructions.

Create semantic tokens rather than hard-coding colors into individual screens:

| Token | Use |
|---|---|
| `page-background` | Main page canvas |
| `surface` / `surface-muted` | Form card, secondary panels, disabled areas |
| `text-primary` / `text-secondary` | Main content and supporting instructions |
| `border` / `focus-ring` | Input boundaries, dividers, keyboard focus |
| `action-primary` / `action-primary-foreground` | Main submit or confirm action |
| `action-secondary` | Cancel, resend, and less prominent actions |
| `feedback-success` | Verified, completed, or enabled states |
| `feedback-warning` | Expiring challenge or important prerequisite |
| `feedback-error` | Invalid input, failed request, or denied operation |
| `feedback-info` | Neutral delivery and next-step notices |

Define tokens for typography roles (page title, section title, body, helper,
label, and error), spacing, radii, shadows, and control heights. Keep heading
levels and spacing consistent across authentication pages. Use a readable
body size, short line lengths for instructions, and visible labels above
inputs. Use color together with text or iconography; color alone must not
communicate success, failure, or permission state.

If the host app supports dark mode, implement both themes through the same
semantic tokens and verify contrast in each. Do not make a theme switch part
of the authentication flow unless the product already has a global theme
setting.

### Page layout and responsive behavior

- Use a centered, narrow content column for sign-in, MFA, verification,
  recovery, reset, and account-security forms. Keep the form width comfortable
  for scanning rather than stretching fields across a desktop viewport.
- On wider screens, an optional brand/story panel may sit beside the form.
  Treat it as supplemental: hide or simplify it on small screens and never
  place essential instructions only in that panel.
- On small screens, use a single-column layout, safe page padding, full-width
  primary actions, and inputs that do not trigger unwanted mobile zoom.
- Keep the page usable with the virtual keyboard open. Place validation and
  primary controls close to the fields they apply to, and avoid fixed footers
  that cover the submit action.
- Protected application pages should use the host app's standard navigation
  shell. Do not create a visually disconnected admin portal unless the product
  has a clear reason to do so.
- Keep destructive or privilege-changing actions visually distinct from
  ordinary navigation, and ask for confirmation when an action is difficult
  to reverse.

### Reusable visual components

Build shared components once so pages behave consistently:

- **Auth page shell:** brand mark, page title, brief context, form region,
  alternate action links, and optional legal/help footer.
- **Form field:** persistent visible label, input, optional helper text,
  inline validation, and appropriate autocomplete/input mode.
- **Password field:** show/hide control with an accessible name; support
  password-manager autocomplete and never block paste.
- **One-time-code field:** six-digit numeric-friendly entry where appropriate,
  supports paste and keyboard navigation, announces errors, and does not rely
  on six individually inaccessible boxes.
- **Primary button:** one obvious main action per step, with idle, submitting,
  and disabled states.
- **Inline alert:** clear title/message for errors and important notices, with
  a next action when one is useful.
- **Success/verification panel:** confirms what happened and states the next
  step, such as checking email or returning to sign-in.
- **Permission gate:** a shared hide/disable/denied pattern for navigation,
  pages, and individual actions.
- **Loading state:** stable skeleton or progress indicator that avoids flashing
  protected content or shifting the entire page unexpectedly.

Keep visible button text stable during submission when possible and pair it
with a spinner or progress indicator. Do not make an icon the only label for a
security-critical action.

### Screen-by-screen visual specification

#### Sign-in

- Place the app mark and a concise welcome heading above the form.
- Show identifier and password fields with persistent labels; use
  `username` and `current-password` autocomplete semantics.
- Put password recovery near the password field and registration below the
  primary action when applicable.
- Make the primary action visually dominant. Keep support or alternate
  sign-in methods secondary.
- Show credential errors next to or immediately below the form, without
  stating whether a particular email or phone is registered.

#### Second-factor verification

- Clearly state that another verification step is required and identify the
  method in safe terms (for example, code sent to the masked email address or
  code from the authenticator app).
- Provide one accessible code input, a primary verify action, expiry/retry
  guidance, and a resend action only when supported by the server.
- Keep the code step visually related to sign-in but make it obvious that the
  credentials step has advanced.
- Provide a safe way to restart sign-in if the challenge expires or the user
  needs to change accounts. Do not display the challenge token.

#### Registration

- Group identity/contact fields and password fields logically.
- Explain password requirements before submission, and keep the same policy
  across registration, reset, and password change.
- Present required terms/privacy acceptance as readable links and an explicit
  consent control; do not pre-check required consent.
- Show field-level errors for correctable input and a clear account-created /
  email-sent confirmation after success.
- If account creation is unavailable due to a system issue, preserve safe form
  values and provide a retry path.

#### Email verification

- Use a calm status panel that explains whether verification succeeded, is
  pending, or the link is invalid/expired.
- Do not imply that the user is signed in unless a session was actually
  established.
- For a pending state, identify the destination address in masked form if
  available and provide resend/back-to-sign-in actions when supported.

#### Forgot password and reset password

- Keep the request screen minimal: identifier, submit, and return-to-sign-in.
- After submission, use the same confirmation wording for existing and
  non-existing accounts.
- On the reset screen, explain password requirements, include new-password
  and confirmation fields, and provide clear invalid/expired-link recovery.
- After successful reset, confirm completion and send the user to sign-in;
  do not automatically sign them in unless that is an explicit, reviewed
  product/security decision.

#### Protected shell, access denied, and action gating

- While restoring a session or checking required account prerequisites, show a
  neutral branded loading state rather than a blank page or protected data.
- For an unauthenticated visitor, route to sign-in with a safe return path.
- For an authenticated user without permission, use the host app's access
  denied state or hide the unavailable action according to the product's
  information-disclosure policy.
- When using a disabled action, explain what is needed without revealing
  sensitive data. Avoid suggesting that a user can self-grant permissions.
- Navigation should reflect effective permissions, but direct API requests
  must still be rejected server-side.

#### Account security settings

- Separate profile details from password, MFA, active sessions, and account
  deletion controls.
- Explain the effect of enabling or disabling MFA before confirmation.
- Ask for recent re-authentication before changing a password, MFA method,
  recovery method, or other sensitive setting.
- Show enrollment as a short guided flow: choose method, verify current
  credentials, scan/enter setup information, confirm a valid code, then show
  the enabled state.
- If offering recovery codes, show them only after a deliberate confirmation
  and explain that they should be stored privately.

#### Administrative user and permission management

- Separate the user summary from account status, assigned roles, and
  individual permissions.
- Group capabilities by application domain and describe each in plain
  language; do not expose raw permission codes as the only explanation.
- Distinguish preset roles from actual effective permissions. When a preset is
  used, show which permissions it expands to.
- Mark high-impact permissions and require deliberate confirmation for
  grants/revocations that affect billing, sensitive data, security settings,
  or user administration.
- Show who made permission changes and when, using an audit history where
  applicable.
- Warn before self-lockout and prevent privilege escalation in the backend,
  not only through disabled checkboxes.

### Interaction, motion, and accessibility

- Use motion sparingly for progress and state changes; respect reduced-motion
  preferences and never make animation the only indication of progress.
- On submit, prevent duplicate requests and announce progress to assistive
  technology. On completion, move focus appropriately or announce the result.
- Associate labels, helper text, and errors with their form controls. Put
  errors in text and focus or summarize the first invalid field after submit.
- Ensure all functions work with keyboard-only navigation, visible focus,
  screen readers, browser zoom, and high-contrast settings.
- Use appropriate autocomplete values and input modes. Permit password paste
  and browser password managers; code entry should accept pasted codes.
- Avoid timed UI dismissal for security errors or success instructions.
- Keep confirmation wording concise, respectful, and actionable. Never blame
  the user for an expired link, blocked account, or missing permission.

### Adaptation checklist for the design system

Before implementation, replace or decide:

1. Product name, logo, brand voice, and existing application design tokens.
2. Supported sign-in identifier(s) and authentication methods.
3. Whether registration is public, invite-only, or administrator-provisioned.
4. Whether MFA is optional, required for everyone, or required for selected
   account classes.
5. Account recovery and support paths, including lost MFA-device handling.
6. Theme support, localization, legal copy, and accessibility requirements.
7. Page-level and action-level permission behaviors: hide, disable, or deny.
8. The safe post-authentication destination for each account type.

## 13. CSRF, rate limiting, and operational configuration

Refresh and logout depend on a cookie, so their endpoints check both the
request `Origin` against the configured allowlist and the
`X-Requested-With: XMLHttpRequest` header. The browser API client sends that
header and uses credentialed requests. The access JWT itself is sent as a
bearer header, not as the refresh cookie.

Authentication endpoints and protected API wrappers use rate-limiting
middleware. **Do not copy the current limiter as a production distributed
limiter without replacing or fixing it.** It uses an in-process map, so limits
are not shared across instances or restarts, and its `>=` comparison rejects
the request that reaches the configured threshold. Use a shared store (such as
Redis or a database-backed limiter), define whether the window is fixed or
sliding, and test the exact number of allowed requests.

Configuration names used by the inspected flows include:

- `ACCESS_TOKEN_SECRET`: access JWT signing key, at least 32 characters;
- `OTP_SECRET`: HMAC key for email verification and stateless OTP/reset
  challenges, at least 32 characters;
- `TWO_FACTOR_ENCRYPTION_KEY`: 32-byte AES key represented as 64 hex
  characters;
- configured public site/API URLs and allowed origins for links and CSRF
  validation.

Supply secrets through a secret manager or deployment environment, use
different random values per environment, and rotate them deliberately. Do not
commit real secret values.

## 14. Authentication and access-control implementation checklist

The following is a portable design sequence, not a drop-in code patch:

1. **Model the identities and sessions.** Store a user ID, normalized unique
   login identifiers, password hash, active/verified state, and security
   timestamps. Store refresh-session hashes, expiry, revocation, replacement
   chain/family, and user ownership in a separate table.
2. **Centralize policy.** Define a typed permission catalog and account
   categories in one place. Decide whether permissions come from roles,
   individual grants, or both. Add implication rules only when their semantics
   are clear.
3. **Build credential flows.** Validate all request bodies, hash passwords
   with a modern password-hashing algorithm, verify email before enabling
   account access, make reset responses non-enumerating, and bind reset tokens
   to account state.
4. **Separate credentials by lifetime.** Use a short-lived access token
   and a longer-lived random refresh token. Store only a hash of the refresh
   token. Rotate it on every refresh and revoke the session family on detected
   reuse.
5. **Create one authenticated server guard.** Validate token signature,
   issuer, audience, expiry, active user, and live session. Recompute or
   otherwise validate current authorization state before sensitive operations.
6. **Create one permission guard.** Make the semantics explicit: all-of versus
   any-of. Require the guard at the API boundary, not just in page components.
7. **Scope queries to the subject.** For user-owned records, include the
   authenticated user ID in the query. For staff records, check the relevant
   permission and business rules.
8. **Audit authority changes.** Record who granted or revoked each capability,
   for whom, and when. Validate that the actor is allowed to delegate the
   requested privilege.
9. **Protect cookie-based endpoints.** Use HttpOnly, Secure-in-production,
   SameSite cookies, an exact origin allowlist, and a CSRF strategy suitable
   for the deployment. Keep bearer and cookie-based authentication roles clear.
10. **Test policy boundaries.** Test absent/expired/forged tokens, inactive
    accounts, revoked sessions, stale permissions, each permission implication,
    all-of/any-of behavior, cross-user record IDs, refresh rotation/reuse,
    CSRF rejection, and privilege self-escalation.

### Minimum endpoint shape

A practical first implementation usually needs:

- `POST /auth/register`
- `POST /auth/verify-email`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/change-password`
- MFA enrollment, confirmation, and disable endpoints if MFA is in scope
- administrative user/permission endpoints protected by explicit permissions

Keep the permission check close to the route handler so reviewers can see
which capability protects each operation. Avoid having several unrelated auth
helpers that disagree about token validity or what counts as staff.

## 15. Adaptation notes from this repository

- There is also a legacy NextAuth credentials route at
  `app/api/auth/[...nextauth]/route.ts`. It delegates to the application's
  login API but has a different session model and does not model the staged
  two-factor response in the same way. For a new app, select one canonical
  session architecture rather than copying both paths.
- `lib/auth/api-access.ts` and `lib/auth/require-staff.ts` are older helper
  implementations. The inspected app code has no call sites for them; use the
  central `withAuth` / `withPermission` path as the current pattern rather
  than mixing helpers with different session checks.
- Keep account classification and authorization policy separate. In this
  application, regular-versus-staff behavior is inferred from the customer
  role ID and permissions are direct user grants; a new app may prefer a
  different model.
- Reconcile the password minimum-length differences and replace the
  process-local rate limiter before adopting the design for production.
- Update legal-acceptance enforcement, email/domain rules, account identifiers,
  permission names, retention of IP/user-agent metadata, and MFA requirements
  to match the new application's legal and operational needs.

## Source files

- Authentication lifecycle: `app/api/auth/login/route.ts`,
  `app/api/auth/register/route.ts`, `app/api/auth/refresh/route.ts`,
  `app/api/auth/verify-email/route.ts`, and password/MFA routes under
  `app/api/auth/`.
- Token/session implementation: `lib/auth/jwt.ts`,
  `lib/auth/refresh-tokens.ts`, `lib/auth/csrf.ts`,
  `lib/auth/stateless-otp.ts`, and `lib/auth/totp.ts`.
- API and browser guards: `lib/middleware/withAuth.ts`,
  `lib/middleware/withPermission.ts`, `lib/api-client.ts`,
  `contexts/auth-context.tsx`, and `components/protected-route.tsx`.
- Authorization policy: `lib/permissions/catalog.ts`,
  `lib/permissions/core.ts`, `lib/permissions/assignment.ts`,
  `lib/permissions/permissions.ts`, and `components/permission-gate.tsx`.
- Persistence: `prisma/schema.prisma`.

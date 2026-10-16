# Mountain Ceramic: tile e-commerce website

Online store for Mountain Ceramic (Rwanda) selling floor and wall tiles.
Features: product catalog, cart, checkout, payments, inventory, tile visualizer, admin.

## Stack
- Next.js (App Router) + TypeScript + Tailwind + shadcn/ui (the ONLY UI library, see UI rules)
- Prisma 7 with MySQL/MariaDB (local dev database: `mcc_dev`)
- Prisma config lives in `prisma.config.ts`; schema is `prisma/schema.prisma`
- Generated client output: `src/lib/generated/prisma`. Import the client from there, never from `@prisma/client`
- Before writing any DB code, open the existing Prisma client setup file (look in `src/lib/`) and follow it exactly, including any driver adapter it uses

## Business rules (do not break)
- Access control uses PERMISSIONS ONLY (`Permission`, `UserPermission`). Never add roles or a `role` field. Check permissions with a helper such as `requirePermission("orders.manage")`
- Tiles are sold in BOXES. Cart and order quantities are boxes. Convert customer m² to boxes by rounding up (`ceil(sqm / sqmPerBox)`)
- A `Product` is a tile design. What is bought is a `ProductVariant` (size, finish, shade, price)
- Money is `Decimal` in RWF. Never use float or JS number math for money
- `OrderItem` and the order address are SNAPSHOTS. Copy name, price and address at purchase time
- Every stock change writes a `StockMovement` row and updates `Inventory`, inside one Prisma transaction
- Available stock = `onHandBoxes - reservedBoxes`. Never let checkout oversell
- Payments: MTN MoMo, Airtel Money, card, bank transfer, cash on delivery. `Payment.providerRef` is unique (idempotency)

## Code conventions
- Validate all input with zod
- Prefer server components and server actions or route handlers; keep secrets server-side
- Never return password hashes to the client
- Small, focused files; explain non-obvious logic with short comments

## Auth rules (custom, NO NextAuth / Auth.js / Clerk / Supabase Auth)
Do not install or use `next-auth`, `@auth/*`, or any auth SDK. Auth is custom, built on one axios instance.

**Token storage**
- ACCESS token (short-lived, ~15 min): kept in memory only. Never `localStorage`, `sessionStorage`, IndexedDB, non-httpOnly cookies, or URLs
- The access token lives in the root layout's `AuthProvider` (React state/context) and is mirrored into a module-level variable inside `lib/api.ts` so the axios interceptor can read it
- REFRESH token (long-lived, ~7-30 days): httpOnly cookie ONLY. Flags: `HttpOnly; Secure` (in production); `SameSite=Lax` (use `Strict` if the API is same-site); `Path=/api/auth` so it is only sent to auth endpoints. JavaScript must never be able to read it

**The axios instance (`src/lib/api.ts`), the ONLY way to call the backend**
- Create one instance: `baseURL` from env, `withCredentials: true` so the refresh cookie is sent
- Never call `fetch()` or a second axios instance for backend API calls. Every request goes through this instance
- Request interceptor: attach `Authorization: Bearer <accessToken>` if a token exists in memory
- Response interceptor on `401`: call `POST /api/auth/refresh` ONCE (single-flight: all concurrent 401s wait on the same refresh promise), store the new access token in memory, retry the original request once, and mark retried requests so they cannot loop
- If refresh fails: clear the in-memory token, reset auth state, redirect to `/login?next=...`
- The refresh call itself must skip the 401 interceptor (use a flag or a bare call on the same config) to avoid infinite loops
- Export typed helpers and keep error shapes consistent

**Session bootstrap (page load / hard refresh loses memory, by design)**
- On mount, `AuthProvider` silently calls `POST /api/auth/refresh`. If the cookie is valid it receives a new access token and the user profile; set `status` to `authenticated`, otherwise `anonymous`
- Expose `status: "loading" | "authenticated" | "anonymous"`. Do not render protected UI or redirect until the status is not `loading` (avoid login-page flicker). Show shadcn `Skeleton`s while loading
- Guard against React StrictMode double-invoking the bootstrap effect: dedupe refresh with the same single-flight promise

**Backend auth endpoints**
- `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me`
- Passwords hashed with argon2 (or bcrypt). Rate-limit login, register and refresh
- Refresh token ROTATION: each refresh issues a new refresh token and invalidates the old one. Store only a HASH of each refresh token in the database (add a `RefreshToken` table: userId, tokenHash, expiresAt, revokedAt, replacedById, userAgent, ip). If an already-used token is presented, revoke the whole token family (reuse detection). Allow a ~10 second grace window for legitimate double requests
- Logout revokes the refresh token server-side and clears the cookie
- The access token (JWT) contains the user id and PERMISSION codes (no roles). Verify the signature and expiry on every protected endpoint, and re-check sensitive permissions against the database for admin and payment actions
- CSRF: the refresh and logout endpoints use a cookie, so enforce: `SameSite` cookie, a check of the `Origin` header against the allowed site origin, and require a custom header (e.g. `X-Requested-With`) that axios sets. Never accept refresh via GET

**Next.js specifics**
- Public pages (catalog, product, SEO pages) are server-rendered and fetch public data on the server WITHOUT a token. Do not make public pages depend on login
- Protected pages (account, orders, admin) fetch their data client-side through the axios instance, because the access token exists only in the browser's memory
- `middleware.ts` cannot verify the access token (it is not in cookies). It may only do a cheap presence check on the refresh cookie to redirect obvious anonymous visitors. Real authorization always happens in the API and in the client guards
- Guest checkout and the public product/cart/checkout endpoints must work with NO token (see the agent-friendly rules). Auth only adds saved addresses, order history and wishlist
- Provide `useAuth()`, `<RequireAuth>` and `<RequirePermission code="orders.manage">` helpers built on shadcn components

## Security rules (secure by default)
**Deployment model**
- Serve the site and the API on the SAME site (same registrable domain, e.g. `mountainceramic.com` and `api.mountainceramic.com`, or same origin). Never use `SameSite=None` for the refresh cookie. Use `SameSite=Lax` (or `Strict`), `Secure`, `HttpOnly`, `Path=/api/auth`
- CORS: allow ONLY the exact site origin(s) from env with `credentials: true`. Never `*`, never reflect the request origin
- HTTPS only in production, with HSTS

**Passwords and tokens**
- Hash passwords with argon2id. Enforce a minimum length and block very common passwords. Give identical error messages for wrong email and wrong password. Compare in constant time
- Access JWT: ~15 min, signed with a strong secret from env (or an asymmetric key), with `iss`, `aud`, `exp`, `sub`. Pin the algorithm on verify. Never put secrets or sensitive data inside it
- Refresh tokens: random 256-bit values (`crypto.randomBytes(32)`), stored only as SHA-256 hashes in the `RefreshToken` table, rotated on every use, with `familyId` reuse detection and revoke-on-logout. Delete expired rows on a schedule
- Revoke all of a user's refresh tokens when their password changes or an admin disables the account (`isActive = false`)

**Abuse protection**
- Rate-limit login, register, refresh, password reset, checkout, and coupon endpoints (per IP and per account). Add progressive delay or temporary lockout after repeated failures. Use a shared store such as Redis in production
- Validate every request body, query, and param with zod. Reject unknown fields. Set request body size limits
- Authorization on every protected endpoint: check the permission code server-side. Check ownership (a customer can only read their own cart, addresses, orders, and designs). Never trust ids, prices, totals, or permissions sent by the client

**Checkout and payments**
- Recompute prices, totals, discounts, and shipping on the SERVER from the database. Ignore any price sent by the client
- Verify payment webhooks with the provider's signature and reject anything unsigned. Make webhook handling idempotent. Confirm the amount and currency match the order before marking it paid
- Never store card numbers or CVVs. Use the provider's hosted or tokenized flow
- Use `Idempotency-Key` on order and payment creation. Guest order-status links use long unguessable signed tokens with an expiry

**Web hardening**
- Set security headers in `next.config` or middleware: strict `Content-Security-Policy` (no `unsafe-inline` scripts, use nonces), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `frame-ancestors 'none'`
- Because the access token lives in memory, XSS is the main threat: never use `dangerouslySetInnerHTML` with untrusted content, sanitize any rich text, and avoid unnecessary third-party scripts
- Uploads (product images, catalogue files): check type and size on the server, generate random file names, never trust the original name or MIME type
- Do not leak details in errors: return generic messages to clients and log the details server-side. Never log passwords, tokens, or full payment payloads
- Keep secrets only in environment variables, never in the repo. Add `.env*` to `.gitignore`. Only `NEXT_PUBLIC_` values reach the browser, so never put secrets there
- Admin actions (price changes, stock adjustments, refunds, permission grants) are written to an audit log with who, what, and when
- Keep dependencies updated and run `npm audit` before releases. Use Prisma's parameterized queries only; never build SQL from strings

## UI rules: shadcn/ui ONLY
- Build every interface from shadcn/ui components (`npx shadcn@latest add <component>`) styled with Tailwind. Do NOT install or use any other UI library (no MUI, Chakra, Ant, Bootstrap, Mantine, DaisyUI, etc.)
- Icons: `lucide-react` only. Toasts: shadcn `sonner`. Forms: shadcn `Form` with react-hook-form + zod. Tables: shadcn `Table` / Data Table. Charts: shadcn `Chart`
- Use theme tokens (CSS variables) for colors; no hard-coded hex colors in components. Support light and dark mode
- Mobile-first and responsive. Most customers in Rwanda browse on phones over variable connections, so keep pages light

## SEO rules (every public page)
- Server-render all catalog pages. Never hide product content behind client-only fetching
- Use the Next.js Metadata API: unique `title`, `description`, canonical URL, Open Graph and Twitter tags per page (`generateMetadata` for products, categories, collections)
- Clean, stable, human-readable URLs: `/tiles/[category]`, `/tiles/[category]/[product-slug]`, `/collections/[slug]`. Always use `slug`, never raw ids
- JSON-LD structured data (schema.org) on pages: `Product` + `Offer` (price in RWF, availability from Inventory, sku, brand, images, aggregateRating from approved reviews) on product pages, `BreadcrumbList` on catalog pages, `Organization` and `LocalBusiness` site-wide
- Generate `app/sitemap.ts` and `app/robots.ts` (block `/admin`, `/cart`, `/checkout`, `/account`)
- Use `next/image` with real `alt` text, correct sizes, and lazy loading. Use `next/font`. Keep Core Web Vitals good (LCP, CLS, INP)
- One `<h1>` per page, logical heading order, descriptive link text
- Add `/llms.txt` describing the store, catalog entry points, and API for AI crawlers

## Accessibility rules (WCAG 2.2 AA)
- Use semantic HTML and landmarks (`header`, `nav`, `main`, `footer`). Add a "Skip to content" link
- shadcn/Radix already handles focus and ARIA; do not break it. Never remove focus outlines. Everything must work with keyboard only
- Every input has a visible `<label>`; errors are linked with `aria-describedby` and announced (`aria-live`)
- Color contrast at least 4.5:1 for text. Never rely on color alone (tile color swatches must also have a text name)
- Meaningful `alt` text for product images; decorative images use `alt=""`
- Respect `prefers-reduced-motion`. Touch targets at least 44x44px
- Visualizer and calculators must be operable by keyboard with text alternatives for results

## AI-agent-friendly commerce (agents must be able to buy easily)
- Guest checkout is always available. No forced signup, no CAPTCHA wall on the buying path
- Server-render the buying path with plain semantic forms: real `<form>`, `<button type="submit">`, proper `name`, `autocomplete`, and `<label>` on every field, so browsing agents can read and fill them
- Stable, descriptive identifiers on key controls: `data-testid` and clear `aria-label`s (e.g. `add-to-cart`, `quantity-boxes`, `checkout-submit`, `shipping-district`)
- Show price, availability, size, finish, m² per box, and boxes needed as visible TEXT, not only inside images or canvases
- Provide a clean public JSON API with an OpenAPI spec at `/api/openapi.json`:
  - `GET /api/products` (search/filter), `GET /api/products/[slug]`
  - `POST /api/cart`, `POST /api/checkout`, `GET /api/orders/[orderNumber]?token=...`
  - Use zod validation, clear error messages, and consistent JSON error shapes
- Checkout and payment endpoints accept an `Idempotency-Key` header so retries never create duplicate orders or charges
- Rate-limit by IP and key, but do not block legitimate automated shoppers. Protect payment and account endpoints properly; never expose secrets
- Order confirmation page and email show order number, items, totals and a tracking link. Guests get a signed order-status link
- Payment pages show clear instructions (e.g. the MoMo prompt flow) and status polling

## Polish and "cool" features (build after the core flow works)
- Tile visualizer: pick a room scene, apply tiles to floor/wall, change layout (straight, brick, herringbone) and grout color, save and share by link
- m² calculator: enter room size, get boxes needed with a waste allowance
- Command palette search (shadcn `Command`, press Ctrl+K) across products and collections
- Quick-view dialog, compare tiles side by side, wishlist, "complete the look" suggestions, product image zoom
- Request a free sample button; WhatsApp "order or ask us" button on product pages
- Skeleton loaders, optimistic cart updates, subtle animations, dark mode, order tracking page
- Dynamic Open Graph images for products and shared visualizer designs

## Safety rules for the AI agent
- NEVER run `prisma migrate reset`, `prisma db push --force-reset`, or any command that drops tables or data
- NEVER run `prisma db push` or `migrate` yourself. Tell me the command and I will run it
- Do not edit `prisma/schema.prisma` without asking first. Propose the change and explain it
- Do not delete files. Ask before large refactors
- After changes, run `npx tsc --noEmit` and report errors

## Schema
@./prisma/schema.prisma

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

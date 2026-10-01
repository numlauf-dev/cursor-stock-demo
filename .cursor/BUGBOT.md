# Code review guidance

Project conventions that reviews should enforce in this repo.

## Currency display (frontend)

All monetary values shown in the UI — prices, totals, cost basis, market
value, P&L — must be rendered with `formatCurrency` from
`frontend/utils/calculations.js`, which produces USD with two decimal places
and thousands separators (`$X,XXX.XX`).

Flag any of the following in `frontend/**/*.{js,jsx}`:

- Building a money string by hand, e.g. `` `$${value}` `` or
  `'$' + value.toFixed(2)`, instead of calling `formatCurrency`.
- Calling `.toFixed()` on a monetary value for display purposes. Rounding for
  display belongs in `formatCurrency`, not at the call site.
- Rounding monetary values before they are aggregated. Round once, at the
  point of display — rounding each row and then summing accumulates error
  across a portfolio.
- Accumulating money with `parseFloat` results in a `reduce` or loop, which
  compounds binary floating-point error.

## REST API conventions (backend)

When creating or modifying API endpoints under `backend/`:

- Use appropriate HTTP methods: `GET` for reads, `POST` for creates,
  `PUT`/`PATCH` for updates, `DELETE` for deletes.
- Return proper status codes:
  - `200 OK`, `201 Created` for success.
  - `400 Bad Request` / `422 Unprocessable Entity` for invalid input.
  - `401 Unauthorized` / `403 Forbidden` for auth and ownership failures.
  - `404 Not Found`, `409 Conflict`, `429 Too Many Requests` where applicable.
  - `500 Internal Server Error` for unexpected failures.
- Use consistent URL patterns: `/api/v1/resource` and `/api/v1/resource/:id`.
- Return consistent JSON shapes: `{ success: true, data: ... }` on success.
  Route errors through the shared error handler in `backend/utils/errors.js`
  and never leak stack traces, SQL, or upstream provider internals.
- Any route that accepts a resource id must verify that the authenticated
  user owns that resource before returning or mutating it. Authentication
  alone is not authorization.
- Include error handling with clear, actionable error messages.

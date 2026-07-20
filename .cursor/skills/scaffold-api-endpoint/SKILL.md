---
name: scaffold-api-endpoint
description: Scaffolds REST API endpoints for this Node/Express stock demo using route, controller, service, validator, middleware, and Jest test conventions. Use when adding backend functionality, creating a new API route, or modifying endpoint behavior.
---

# Scaffold API Endpoint

Use this skill when adding or changing backend API behavior in `backend/`.

## Endpoint Checklist

1. **Define the contract**
   - HTTP method and path under `/api/v1/...`
   - Auth requirement: public, authenticated, or ownership-protected
   - Request params/query/body and response shape
   - Success and error status codes

2. **Mirror nearby files**
   - Routes: `backend/routes/*Routes.js`
   - Controllers: `backend/controllers/*Controller.js`
   - Services: `backend/services/*Service.js`
   - Validators: `backend/validators/*Validators.js`
   - Tests: `tests/*.test.js`

3. **Implement in dependency order**
   - Add `express-validator` chains in `backend/validators/`
   - Add service logic in `backend/services/`
   - Add a thin controller in `backend/controllers/`
   - Wire the route in `backend/routes/`
   - Register a new route file in `backend/server.js` only when adding a new resource router

4. **Apply middleware**
   - Use `handleValidationErrors` after validators
   - Use existing auth middleware for protected resources
   - Use existing rate limiters for auth, expensive, or external-provider routes

5. **Return consistent JSON**
   - Success responses use `{ success: true, data: ... }`
   - Error responses should flow through `backend/utils/errors.js` and the global error handler
   - Do not leak stack traces, provider credentials, SQL, or raw third-party errors

6. **Test the API behavior**
   - Add or update Jest/Supertest coverage in `tests/`
   - Cover success, validation failure, and important provider/service failure cases
   - Assert status codes and response shape, not just that a request returns

## Route Pattern

```js
router.get(
  '/:symbol/example',
  stockDataLimiter,
  getExampleValidator,
  handleValidationErrors,
  stockController.getExample
);
```

## Controller Pattern

```js
export const getExample = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const result = await stockService.getExample(symbol);

    res.status(200).json({
      success: true,
      data: { result },
    });
  } catch (error) {
    next(error);
  }
};
```

## Validator Pattern

```js
export const getExampleValidator = [
  param('symbol')
    .trim()
    .notEmpty()
    .withMessage('Stock symbol is required')
    .matches(/^[A-Z0-9.]+$/i)
    .withMessage('Invalid stock symbol format'),
];
```

## Final Verification

Run focused tests for the changed API surface. For broad endpoint changes, run `npm test`; for quick checks during development, run the relevant Jest file when possible.

---
name: scaffold-api-endpoint
description: Scaffold REST API endpoints following project conventions. Use when creating new API routes, endpoints, controllers, services, or when the user wants to add backend functionality.
---

# Scaffold API Endpoint

Creates REST API endpoints following the project's established patterns and RESTful conventions.

## Quick Start

When scaffolding an endpoint, create files in this order:
1. **Validator** (`backend/validators/{resource}Validators.js`)
2. **Service** (`backend/services/{resource}Service.js`)
3. **Controller** (`backend/controllers/{resource}Controller.js`)
4. **Routes** (`backend/routes/{resource}Routes.js`)
5. **Register routes** in `backend/server.js`

## REST Conventions

Follow these conventions from `.cursorrules`:

| Operation | HTTP Method | URL Pattern | Status Code |
|-----------|-------------|-------------|-------------|
| List all | GET | `/api/v1/{resource}` | 200 |
| Get one | GET | `/api/v1/{resource}/:id` | 200 |
| Create | POST | `/api/v1/{resource}` | 201 |
| Update | PUT/PATCH | `/api/v1/{resource}/:id` | 200 |
| Delete | DELETE | `/api/v1/{resource}/:id` | 200 |

## File Templates

### 1. Validator Template

```javascript
import { body, param, query } from 'express-validator';

export const create{Resource}Validator = [
  body('fieldName')
    .trim()
    .notEmpty()
    .withMessage('Field name is required'),
];

export const get{Resource}Validator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid ID is required'),
];
```

### 2. Service Template

```javascript
import prisma from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import logger from '../utils/logger.js';

export const getAll = async () => {
  return prisma.{resource}.findMany();
};

export const getById = async (id) => {
  const item = await prisma.{resource}.findUnique({ where: { id } });
  if (!item) {
    throw new NotFoundError('{Resource}');
  }
  return item;
};

export const create = async (data) => {
  return prisma.{resource}.create({ data });
};

export const update = async (id, data) => {
  await getById(id); // Verify exists
  return prisma.{resource}.update({ where: { id }, data });
};

export const remove = async (id) => {
  await getById(id); // Verify exists
  return prisma.{resource}.delete({ where: { id } });
};
```

### 3. Controller Template

```javascript
import * as {resource}Service from '../services/{resource}Service.js';

export const getAll = async (req, res, next) => {
  try {
    const items = await {resource}Service.getAll();
    res.status(200).json({
      success: true,
      data: { items },
    });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await {resource}Service.getById(parseInt(id));
    res.status(200).json({
      success: true,
      data: { item },
    });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const item = await {resource}Service.create(req.body);
    res.status(201).json({
      success: true,
      data: { item },
    });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await {resource}Service.update(parseInt(id), req.body);
    res.status(200).json({
      success: true,
      data: { item },
    });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    await {resource}Service.remove(parseInt(id));
    res.status(200).json({
      success: true,
      message: '{Resource} deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
```

### 4. Routes Template

```javascript
import express from 'express';
import * as {resource}Controller from '../controllers/{resource}Controller.js';
import { authenticate } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';
import {
  create{Resource}Validator,
  get{Resource}Validator,
} from '../validators/{resource}Validators.js';

const router = express.Router();

// Apply auth to all routes (optional)
router.use(authenticate);

router.get('/', {resource}Controller.getAll);
router.get('/:id', get{Resource}Validator, handleValidationErrors, {resource}Controller.getById);
router.post('/', create{Resource}Validator, handleValidationErrors, {resource}Controller.create);
router.put('/:id', get{Resource}Validator, handleValidationErrors, {resource}Controller.update);
router.delete('/:id', get{Resource}Validator, handleValidationErrors, {resource}Controller.remove);

export default router;
```

### 5. Register Routes in server.js

Add to `backend/server.js`:

```javascript
import {resource}Routes from './routes/{resource}Routes.js';
// ...
app.use('/api/v1/{resources}', {resource}Routes);
```

## Response Format

All responses follow this structure:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message"
}
```

## Error Classes

Import from `backend/utils/errors.js`:

| Error Class | Status Code | Use Case |
|-------------|-------------|----------|
| `ValidationError` | 400 | Invalid input |
| `UnauthorizedError` | 401 | Auth required |
| `ForbiddenError` | 403 | No permission |
| `NotFoundError` | 404 | Resource not found |
| `AppError` | 500 | Server error |

## Checklist

Copy and track progress:

```
API Endpoint Progress:
- [ ] Create validator with input validation rules
- [ ] Create service with business logic
- [ ] Create controller with request handling
- [ ] Create routes file with REST endpoints
- [ ] Register routes in server.js
- [ ] Add tests to tests/ directory
```

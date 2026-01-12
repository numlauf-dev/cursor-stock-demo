import { validationResult } from 'express-validator';
import { ValidationError } from '../utils/errors.js';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg);
    throw new ValidationError(errorMessages.join(', '));
  }
  next();
};

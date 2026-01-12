import * as authService from '../services/authService.js';
import * as userService from '../services/userService.js';

export const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    const user = await authService.registerUser(email, password, firstName, lastName);

    res.status(201).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: { user: req.user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get or create default user for single-user mode
 */
export const getDefaultUser = async (req, res, next) => {
  try {
    const result = await userService.getOrCreateDefaultUser();

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

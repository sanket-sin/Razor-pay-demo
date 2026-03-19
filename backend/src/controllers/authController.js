import * as authService from '../services/authService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const register = asyncHandler(async (req, res) => {
  const { email, password, name, role } = req.validated.body;
  const result = await authService.register({ email, password, name, role });
  res.status(201).json({ success: true, data: result });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;
  const result = await authService.login({ email, password });
  res.json({ success: true, data: result });
});

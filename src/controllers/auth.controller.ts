import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response.util';
import authService from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { registerSchema, loginSchema, changePasswordSchema, updateProfileSchema } from '../validations/auth.validation';
import { ZodError } from 'zod';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const validated = registerSchema.parse(req.body);
      const result = await authService.register(
        validated.name,
        validated.email,
        validated.password,
        validated.role
      );
      sendSuccess(res, 201, 'User registered successfully', result);
    } catch (error) {
      if (error instanceof ZodError) {
        sendError(res, 400, 'Validation failed', undefined, error.errors);
        return;
      }
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      sendError(res, 400, errorMessage, error instanceof Error ? error : undefined);
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const validated = loginSchema.parse(req.body);
      const result = await authService.login(validated.email, validated.password);
      sendSuccess(res, 200, 'Login successful', result);
    } catch (error) {
      if (error instanceof ZodError) {
        sendError(res, 400, 'Validation failed', undefined, error.errors);
        return;
      }
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      sendError(res, 400, errorMessage, error instanceof Error ? error : undefined);
    }
  }

  async getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user?.userId) {
        sendError(res, 401, 'Unauthorized');
        return;
      }
      const user = await authService.getUserById(req.user.userId);
      sendSuccess(res, 200, 'User fetched successfully', user);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user';
      sendError(res, 400, errorMessage, error instanceof Error ? error : undefined);
    }
  }

  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const validated = updateProfileSchema.parse(req.body);
      if (!req.user?.userId) {
        sendError(res, 401, 'Unauthorized');
        return;
      }
      const user = await authService.updateProfile(req.user.userId, validated);
      sendSuccess(res, 200, 'Profile updated successfully', user);
    } catch (error) {
      if (error instanceof ZodError) {
        sendError(res, 400, 'Validation failed', undefined, error.errors);
        return;
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      sendError(res, 400, errorMessage, error instanceof Error ? error : undefined);
    }
  }

  async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const validated = changePasswordSchema.parse(req.body);
      if (!req.user?.userId) {
        sendError(res, 401, 'Unauthorized');
        return;
      }
      await authService.changePassword(
        req.user.userId,
        validated.currentPassword,
        validated.newPassword
      );
      sendSuccess(res, 200, 'Password changed successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        sendError(res, 400, 'Validation failed', undefined, error.errors);
        return;
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to change password';
      sendError(res, 400, errorMessage, error instanceof Error ? error : undefined);
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    sendSuccess(res, 200, 'Logout successful');
  }
}

export default new AuthController();
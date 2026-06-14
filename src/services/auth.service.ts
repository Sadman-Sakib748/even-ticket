import User from '../models/User.model';
import { hashPassword, comparePassword } from '../utils/password.util';
import { generateToken, generateRefreshToken } from '../utils/jwt.util';
import { AppError } from '../middleware/error.middleware';

export class AuthService {
  async register(name: string, email: string, password: string, role: string = 'user') {
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new AppError(409, 'Email already registered');
      }

      const hashedPassword = await hashPassword(password);

      const user = new User({
        name,
        email,
        password: hashedPassword,
        role: role || 'user',
        isActive: true,
        isVerified: true,
      });

      await user.save();

      const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      const refreshToken = generateRefreshToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      return {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
        refreshToken,
      };
    } catch (error) {
      throw error;
    }
  }

  async login(email: string, password: string) {
    try {
      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        throw new AppError(401, 'Invalid email or password');
      }

      if (!user.isActive) {
        throw new AppError(401, 'Account is deactivated');
      }

      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        throw new AppError(401, 'Invalid email or password');
      }

      user.lastLogin = new Date();
      await user.save();

      const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      const refreshToken = generateRefreshToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      return {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
        refreshToken,
      };
    } catch (error) {
      throw error;
    }
  }

  async getUserById(userId: string) {
    try {
      const user = await User.findById(userId).select('-password');
      if (!user) {
        throw new AppError(404, 'User not found');
      }
      return user;
    } catch (error) {
      throw error;
    }
  }

  async updateProfile(userId: string, updateData: any) {
    try {
      delete updateData.password;
      delete updateData.role;
      delete updateData.email;

      const user = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
      }).select('-password');

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    try {
      const user = await User.findById(userId).select('+password');

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      const isPasswordValid = await comparePassword(currentPassword, user.password);
      if (!isPasswordValid) {
        throw new AppError(401, 'Current password is incorrect');
      }

      user.password = await hashPassword(newPassword);
      await user.save();

      return { message: 'Password changed successfully' };
    } catch (error) {
      throw error;
    }
  }
}

export default new AuthService();
import jwt from 'jsonwebtoken';
import { User, IUser, UserRole } from '../users/user.model';

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    employeeId?: string | null;
  };
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}

export interface ResetPasswordInput {
  email: string;
  newPassword: string;
  confirmPassword?: string;
}

export class AuthService {
  private generateToken(user: IUser): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not defined');
    }
    return jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        employeeId: user.employeeId ? user.employeeId.toString() : null
      },
      secret,
      { expiresIn: '1d' }
    );
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    if (!input.email || !input.password) {
      const error: any = new Error('Email and password are required');
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findOne({ email: input.email.toLowerCase(), isActive: true }).select('+passwordHash');
    if (!user) {
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await user.comparePassword(input.password);
    if (!isMatch) {
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const token = this.generateToken(user);
    return {
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId ? user.employeeId.toString() : null
      }
    };
  }

  async getCurrentUser(userId: string) {
    const user = await User.findById(userId).select('-passwordHash');
    if (!user || !user.isActive) {
      const error: any = new Error('User not found or inactive');
      error.statusCode = 404;
      throw error;
    }
    return user;
  }

  async changePassword(userId: string, input: ChangePasswordInput): Promise<{ message: string }> {
    if (!input.currentPassword || typeof input.currentPassword !== 'string') {
      const error: any = new Error('Current password is required');
      error.statusCode = 400;
      throw error;
    }

    if (!input.newPassword || typeof input.newPassword !== 'string') {
      const error: any = new Error('New password is required');
      error.statusCode = 400;
      throw error;
    }

    if (input.confirmPassword !== undefined && input.newPassword !== input.confirmPassword) {
      const error: any = new Error('New passwords do not match');
      error.statusCode = 400;
      throw error;
    }

    if (input.newPassword.length < 6) {
      const error: any = new Error('New password must be at least 6 characters long');
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findById(userId).select('+passwordHash');
    if (!user || !user.isActive) {
      const error: any = new Error('User not found or inactive');
      error.statusCode = 404;
      throw error;
    }

    const isMatch = await user.comparePassword(input.currentPassword);
    if (!isMatch) {
      const error: any = new Error('Current password is incorrect');
      error.statusCode = 400;
      throw error;
    }

    user.passwordHash = input.newPassword;
    await user.save();

    return { message: 'Password changed successfully' };
  }

  async resetPassword(input: ResetPasswordInput): Promise<{ message: string }> {
    if (!input.email || typeof input.email !== 'string' || !input.email.trim()) {
      const error: any = new Error('Email address is required');
      error.statusCode = 400;
      throw error;
    }

    if (!input.newPassword || typeof input.newPassword !== 'string') {
      const error: any = new Error('New password is required');
      error.statusCode = 400;
      throw error;
    }

    if (input.confirmPassword !== undefined && input.newPassword !== input.confirmPassword) {
      const error: any = new Error('New passwords do not match');
      error.statusCode = 400;
      throw error;
    }

    if (input.newPassword.length < 6) {
      const error: any = new Error('New password must be at least 6 characters long');
      error.statusCode = 400;
      throw error;
    }

    const trimmedEmail = input.email.trim().toLowerCase();
    const user = await User.findOne({ email: trimmedEmail, isActive: true }).select('+passwordHash');
    if (!user) {
      const error: any = new Error('No active user account found with that email address');
      error.statusCode = 404;
      throw error;
    }

    user.passwordHash = input.newPassword;
    await user.save();

    return { message: 'Password has been reset successfully. You can now log in.' };
  }
}

export const authService = new AuthService();

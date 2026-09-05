import jwt from 'jsonwebtoken';
import { User, IUser, UserRole } from '../users/user.model';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  employeeId?: string;
}

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

  async register(input: RegisterInput): Promise<AuthResponse> {
    const existingUser = await User.findOne({ email: input.email.toLowerCase() });
    if (existingUser) {
      const error: any = new Error('User with this email already exists');
      error.statusCode = 400;
      throw error;
    }

    const user = new User({
      name: input.name,
      email: input.email,
      passwordHash: input.password,
      role: input.role || 'Employee',
      employeeId: input.employeeId || null
    });

    await user.save();

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
}

export const authService = new AuthService();

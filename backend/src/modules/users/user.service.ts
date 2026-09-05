import { User, IUser, UserRole } from './user.model';

export interface CreateUserInput {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  employeeId?: string | null;
  isActive?: boolean;
}

export class UserService {
  async createUser(input: CreateUserInput): Promise<IUser> {
    const existing = await User.findOne({ email: input.email.toLowerCase() });
    if (existing) {
      const error: any = new Error('User with this email already exists');
      error.statusCode = 400;
      throw error;
    }

    if (!input.password) {
      const error: any = new Error('Password is required when creating a user');
      error.statusCode = 400;
      throw error;
    }

    const user = new User({
      name: input.name,
      email: input.email,
      passwordHash: input.password,
      role: input.role,
      employeeId: input.employeeId || null,
      isActive: input.isActive !== undefined ? input.isActive : true
    });

    await user.save();
    const created = await User.findById(user._id).select('-passwordHash');
    return created!;
  }

  async getAllUsers(): Promise<IUser[]> {
    return User.find().select('-passwordHash').sort({ createdAt: -1 });
  }

  async getUserById(id: string): Promise<IUser> {
    const user = await User.findById(id).select('-passwordHash');
    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return user;
  }

  async updateUser(id: string, updates: Partial<CreateUserInput>): Promise<IUser> {
    const user = await User.findById(id);
    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    if (updates.name) user.name = updates.name;
    if (updates.email) user.email = updates.email;
    if (updates.role) user.role = updates.role;
    if (updates.employeeId !== undefined) user.employeeId = updates.employeeId as any;
    if (updates.isActive !== undefined) user.isActive = updates.isActive;
    if (updates.password) {
      user.passwordHash = updates.password;
    }

    await user.save();
    const updated = await User.findById(user._id).select('-passwordHash');
    return updated!;
  }

  async deleteUser(id: string): Promise<void> {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
  }
}

export const userService = new UserService();

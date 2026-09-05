import { UserRole } from '../modules/users/user.model';

export interface AuthUserPayload {
  userId: string;
  email: string;
  role: UserRole;
  employeeId?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRoutes from './routes/health';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import departmentRoutes from './modules/departments/department.routes';
import employeeRoutes from './modules/employees/employee.routes';
import contractRoutes from './modules/contracts/contract.routes';
import scheduleRoutes from './modules/schedules/schedule.routes';
import attendanceRoutes from './modules/attendance/attendance.routes';
import timeOffTypeRoutes from './modules/timeoff/type/timeoff-type.routes';
import timeOffAllocationRoutes from './modules/timeoff/allocation/timeoff-allocation.routes';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';

dotenv.config();

const app: Application = express();

app.use(cors());
app.use(express.json());

app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/attendances', attendanceRoutes);

// Time Off Types
app.use('/api/time-off/types', timeOffTypeRoutes);
app.use('/api/timeoff/types', timeOffTypeRoutes);

// Time Off Allocations
app.use('/api/time-off/allocations', timeOffAllocationRoutes);
app.use('/api/timeoff/allocations', timeOffAllocationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

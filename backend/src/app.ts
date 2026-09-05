import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRoutes from './routes/health';
import departmentRoutes from './modules/departments/department.routes';
import employeeRoutes from './modules/employees/employee.routes';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';

dotenv.config();

const app: Application = express();

app.use(cors());
app.use(express.json());

app.use('/api', healthRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/employees', employeeRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

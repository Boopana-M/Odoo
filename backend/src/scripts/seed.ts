import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../modules/users/user.model';
import { Department } from '../modules/departments/department.model';
import { Employee } from '../modules/employees/employee.model';
import { WorkingSchedule } from '../modules/schedules/schedule.model';
import { Contract } from '../modules/contracts/contract.model';
import { Attendance } from '../modules/attendance/attendance.model';
import { TimeOffType } from '../modules/timeoff/type/timeoff-type.model';
import { TimeOffAllocation } from '../modules/timeoff/allocation/timeoff-allocation.model';
import { TimeOffRequest } from '../modules/timeoff/request/request.model';
import { SalaryStructure } from '../modules/salary/structure/structure.model';
import { SalaryRule } from '../modules/salary/rule/rule.model';
import { Payrun } from '../modules/payrun/payrun.model';
import { Payslip, PayslipLine } from '../modules/payslip/payslip.model';
import { payslipService } from '../modules/payslip/payslip.service';

dotenv.config();

const DEFAULT_PASSWORD = 'Password123!';

async function seedDatabase() {
  console.log('=====================================================');
  console.log('🌱 SEEDING PEOPLEPAY360 SAMPLE TEST DATA 🌱');
  console.log('=====================================================');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/peoplepay360';
  await mongoose.connect(mongoUri);
  console.log('✓ Connected to MongoDB:', mongoUri);

  // Clear existing collections
  console.log('\n[1/11] Cleaning existing collections...');
  await PayslipLine.deleteMany({});
  await Payslip.deleteMany({});
  await Payrun.deleteMany({});
  await SalaryRule.deleteMany({});
  await SalaryStructure.deleteMany({});
  await TimeOffRequest.deleteMany({});
  await TimeOffAllocation.deleteMany({});
  await TimeOffType.deleteMany({});
  await Attendance.deleteMany({});
  await Contract.deleteMany({});
  await Employee.deleteMany({});
  await WorkingSchedule.deleteMany({});
  await Department.deleteMany({});
  await User.deleteMany({});
  console.log('✓ Existing collections cleared');

  // 1. Departments
  console.log('\n[2/10] Seeding Departments...');
  const engineeringDept = await Department.create({ name: 'Engineering' });
  const hrDept = await Department.create({ name: 'Human Resources' });
  const financeDept = await Department.create({ name: 'Finance & Accounting' });
  const salesDept = await Department.create({ name: 'Sales & Marketing' });
  console.log(`✓ Seeded 4 departments`);

  // 2. Working Schedules
  console.log('\n[3/10] Seeding Working Schedules...');
  const standard40Schedule = await WorkingSchedule.create({
    name: 'Standard 40 Hours',
    type: 'Standard',
    weeklyPattern: [
      { day: 'Monday', startTime: '09:00', endTime: '18:00', breakHours: 1 },
      { day: 'Tuesday', startTime: '09:00', endTime: '18:00', breakHours: 1 },
      { day: 'Wednesday', startTime: '09:00', endTime: '18:00', breakHours: 1 },
      { day: 'Thursday', startTime: '09:00', endTime: '18:00', breakHours: 1 },
      { day: 'Friday', startTime: '09:00', endTime: '18:00', breakHours: 1 }
    ],
    weeklyHours: 40
  });

  const flexible35Schedule = await WorkingSchedule.create({
    name: 'Flexible 35 Hours',
    type: 'Flexible',
    weeklyPattern: [
      { day: 'Monday', startTime: '09:00', endTime: '17:00', breakHours: 1 },
      { day: 'Tuesday', startTime: '09:00', endTime: '17:00', breakHours: 1 },
      { day: 'Wednesday', startTime: '09:00', endTime: '17:00', breakHours: 1 },
      { day: 'Thursday', startTime: '09:00', endTime: '17:00', breakHours: 1 },
      { day: 'Friday', startTime: '09:00', endTime: '17:00', breakHours: 1 }
    ],
    weeklyHours: 35
  });

  const partTime20Schedule = await WorkingSchedule.create({
    name: 'Part-Time 20 Hours',
    type: 'Part-Time',
    weeklyPattern: [
      { day: 'Monday', startTime: '09:00', endTime: '13:00', breakHours: 0 },
      { day: 'Tuesday', startTime: '09:00', endTime: '13:00', breakHours: 0 },
      { day: 'Wednesday', startTime: '09:00', endTime: '13:00', breakHours: 0 },
      { day: 'Thursday', startTime: '09:00', endTime: '13:00', breakHours: 0 },
      { day: 'Friday', startTime: '09:00', endTime: '13:00', breakHours: 0 }
    ],
    weeklyHours: 20
  });
  console.log(`✓ Seeded 3 working schedules`);

  // 3. Salary Structures & Salary Rules
  console.log('\n[4/10] Seeding Salary Structures & Rules...');
  const standardStructure = await SalaryStructure.create({
    name: 'Standard Employee Structure',
    code: 'STD_EMP_2026',
    isActive: true
  });

  const executiveStructure = await SalaryStructure.create({
    name: 'Executive Management Structure',
    code: 'EXEC_MGMT_2026',
    isActive: true
  });

  // Standard Rules
  await SalaryRule.create({
    salaryStructureId: standardStructure._id,
    name: 'Basic Salary',
    code: 'BASIC',
    category: 'Basic',
    sequence: 10,
    computationMethod: 'Fixed',
    amount: 6500
  });

  await SalaryRule.create({
    salaryStructureId: standardStructure._id,
    name: 'House Rent Allowance',
    code: 'HRA',
    category: 'Allowances',
    sequence: 20,
    computationMethod: 'Percentage',
    percentage: 40
  });

  await SalaryRule.create({
    salaryStructureId: standardStructure._id,
    name: 'Gross Salary',
    code: 'GROSS',
    category: 'Gross',
    sequence: 30,
    computationMethod: 'Formula',
    formulaExpression: 'BASIC + HRA'
  });

  await SalaryRule.create({
    salaryStructureId: standardStructure._id,
    name: 'Provident Fund',
    code: 'PF',
    category: 'Deductions',
    sequence: 40,
    computationMethod: 'Percentage',
    percentage: 12
  });

  await SalaryRule.create({
    salaryStructureId: standardStructure._id,
    name: 'Net Salary',
    code: 'NET',
    category: 'Net',
    sequence: 50,
    computationMethod: 'Formula',
    formulaExpression: 'GROSS - PF'
  });

  // Executive Rules
  await SalaryRule.create({
    salaryStructureId: executiveStructure._id,
    name: 'Executive Basic',
    code: 'BASIC',
    category: 'Basic',
    sequence: 10,
    computationMethod: 'Fixed',
    amount: 8500
  });

  await SalaryRule.create({
    salaryStructureId: executiveStructure._id,
    name: 'Management Allowance',
    code: 'MGMT_ALLOW',
    category: 'Allowances',
    sequence: 20,
    computationMethod: 'Fixed',
    amount: 2000
  });

  await SalaryRule.create({
    salaryStructureId: executiveStructure._id,
    name: 'Gross Salary',
    code: 'GROSS',
    category: 'Gross',
    sequence: 30,
    computationMethod: 'Formula',
    formulaExpression: 'BASIC + MGMT_ALLOW'
  });

  await SalaryRule.create({
    salaryStructureId: executiveStructure._id,
    name: 'Income Tax Deduction',
    code: 'TAX',
    category: 'Deductions',
    sequence: 40,
    computationMethod: 'Percentage',
    percentage: 20
  });

  await SalaryRule.create({
    salaryStructureId: executiveStructure._id,
    name: 'Net Executive Salary',
    code: 'NET',
    category: 'Net',
    sequence: 50,
    computationMethod: 'Formula',
    formulaExpression: 'GROSS - TAX'
  });
  console.log(`✓ Seeded 2 salary structures with 10 sequential salary rules`);

  // 4. Employees
  console.log('\n[5/10] Seeding Employees...');
  const johnDoeManager = await Employee.create({
    employeeCode: 'EMP001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@peoplepay360.com',
    departmentId: engineeringDept._id,
    jobPosition: 'Engineering Manager',
    scheduleId: standard40Schedule._id,
    employeeType: 'Full-Time',
    status: 'Active',
    bankDetails: {
      bankName: 'Chase Bank',
      accountNumber: '1234567890',
      accountHolderName: 'John Doe',
      routingNumber: 'CHASUS33',
      swiftCode: 'CHASUS33XXX'
    }
  });

  const janeSmithStaff = await Employee.create({
    employeeCode: 'EMP002',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@peoplepay360.com',
    departmentId: engineeringDept._id,
    managerId: johnDoeManager._id,
    scheduleId: standard40Schedule._id,
    jobPosition: 'Senior Software Engineer',
    employeeType: 'Full-Time',
    status: 'Active',
    bankDetails: {
      bankName: 'Bank of America',
      accountNumber: '9876543210',
      accountHolderName: 'Jane Smith',
      routingNumber: 'BOFAUS3N',
      swiftCode: 'BOFAUS3NXXX'
    }
  });

  const robertJohnsonHR = await Employee.create({
    employeeCode: 'EMP003',
    firstName: 'Robert',
    lastName: 'Johnson',
    email: 'robert.johnson@peoplepay360.com',
    departmentId: hrDept._id,
    scheduleId: standard40Schedule._id,
    jobPosition: 'HR Manager',
    employeeType: 'Full-Time',
    status: 'Active',
    bankDetails: {
      bankName: 'Wells Fargo',
      accountNumber: '5555666677',
      accountHolderName: 'Robert Johnson',
      routingNumber: 'WFBIUS6S'
    }
  });

  const emilyDavisFinance = await Employee.create({
    employeeCode: 'EMP004',
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.davis@peoplepay360.com',
    departmentId: financeDept._id,
    scheduleId: flexible35Schedule._id,
    jobPosition: 'Financial Analyst',
    employeeType: 'Full-Time',
    status: 'Active',
    bankDetails: {
      bankName: 'Citibank',
      accountNumber: '4444333322',
      accountHolderName: 'Emily Davis',
      routingNumber: 'CITIUS33'
    }
  });

  const michaelBrownSales = await Employee.create({
    employeeCode: 'EMP005',
    firstName: 'Michael',
    lastName: 'Brown',
    email: 'michael.brown@peoplepay360.com',
    departmentId: salesDept._id,
    scheduleId: partTime20Schedule._id,
    jobPosition: 'Sales Representative',
    employeeType: 'Part-Time',
    status: 'Active',
    bankDetails: {
      bankName: 'PNC Bank',
      accountNumber: '8888999900',
      accountHolderName: 'Michael Brown',
      routingNumber: 'PNCUS33'
    }
  });
  console.log(`✓ Seeded 5 employees`);

  // 5. Users
  console.log('\n[6/10] Seeding Users with Role-Based Access...');
  await User.create({
    name: 'Admin User',
    email: 'admin@peoplepay360.com',
    passwordHash: DEFAULT_PASSWORD,
    role: 'Admin',
    isActive: true
  });

  await User.create({
    name: 'Robert Johnson (HR)',
    email: 'hrmanager@peoplepay360.com',
    passwordHash: DEFAULT_PASSWORD,
    role: 'HR Manager',
    employeeId: robertJohnsonHR._id,
    isActive: true
  });

  await User.create({
    name: 'Payroll User',
    email: 'payrolluser@peoplepay360.com',
    passwordHash: DEFAULT_PASSWORD,
    role: 'HR Payroll User',
    isActive: true
  });

  await User.create({
    name: 'Payroll Manager',
    email: 'payrollmanager@peoplepay360.com',
    passwordHash: DEFAULT_PASSWORD,
    role: 'HR Payroll Manager',
    isActive: true
  });

  await User.create({
    name: 'John Doe',
    email: 'john.doe@peoplepay360.com',
    passwordHash: DEFAULT_PASSWORD,
    role: 'Employee',
    employeeId: johnDoeManager._id,
    isActive: true
  });

  await User.create({
    name: 'Jane Smith',
    email: 'jane.smith@peoplepay360.com',
    passwordHash: DEFAULT_PASSWORD,
    role: 'Employee',
    employeeId: janeSmithStaff._id,
    isActive: true
  });

  await User.create({
    name: 'Emily Davis',
    email: 'emily.davis@peoplepay360.com',
    passwordHash: DEFAULT_PASSWORD,
    role: 'Employee',
    employeeId: emilyDavisFinance._id,
    isActive: true
  });
  console.log(`✓ Seeded 7 users with default password: '${DEFAULT_PASSWORD}'`);

  // 6. Contracts
  console.log('\n[7/10] Seeding Employment Contracts...');
  await Contract.create({
    employeeId: johnDoeManager._id,
    startDate: new Date('2025-01-01'),
    departmentId: engineeringDept._id,
    jobPosition: 'Engineering Manager',
    wage: 8500,
    salaryStructureId: executiveStructure._id,
    status: 'Active'
  });

  await Contract.create({
    employeeId: janeSmithStaff._id,
    startDate: new Date('2025-06-01'),
    departmentId: engineeringDept._id,
    jobPosition: 'Senior Software Engineer',
    wage: 6500,
    salaryStructureId: standardStructure._id,
    status: 'Active'
  });

  await Contract.create({
    employeeId: robertJohnsonHR._id,
    startDate: new Date('2025-01-01'),
    departmentId: hrDept._id,
    jobPosition: 'HR Manager',
    wage: 7500,
    salaryStructureId: standardStructure._id,
    status: 'Active'
  });

  await Contract.create({
    employeeId: emilyDavisFinance._id,
    startDate: new Date('2025-03-01'),
    departmentId: financeDept._id,
    jobPosition: 'Financial Analyst',
    wage: 5500,
    salaryStructureId: standardStructure._id,
    status: 'Active'
  });

  await Contract.create({
    employeeId: michaelBrownSales._id,
    startDate: new Date('2025-09-01'),
    departmentId: salesDept._id,
    jobPosition: 'Sales Representative',
    wage: 3200,
    salaryStructureId: standardStructure._id,
    status: 'Active'
  });
  console.log(`✓ Seeded 5 contracts linked to salary structures`);

  // 7. Attendance Records
  console.log('\n[8/10] Seeding Attendance Records...');
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

  await Attendance.create({
    employeeId: janeSmithStaff._id,
    date: twoDaysAgo,
    checkIn: new Date(twoDaysAgo.setHours(9, 0, 0, 0)),
    checkOut: new Date(twoDaysAgo.setHours(17, 30, 0, 0)),
    workedHours: 8.5,
    status: 'Present'
  });

  await Attendance.create({
    employeeId: janeSmithStaff._id,
    date: yesterday,
    checkIn: new Date(yesterday.setHours(9, 15, 0, 0)),
    checkOut: new Date(yesterday.setHours(18, 15, 0, 0)),
    workedHours: 9.0,
    status: 'Overtime'
  });

  await Attendance.create({
    employeeId: johnDoeManager._id,
    date: yesterday,
    checkIn: new Date(yesterday.setHours(8, 45, 0, 0)),
    checkOut: new Date(yesterday.setHours(17, 45, 0, 0)),
    workedHours: 9.0,
    status: 'Present'
  });
  console.log(`✓ Seeded 3 attendance records`);

  // 8. Time Off Types
  console.log('\n[9/10] Seeding Time Off Types...');
  const paidVacationType = await TimeOffType.create({
    name: 'Paid Vacation',
    unit: 'Days',
    allocationRequired: true,
    approvalRequired: true,
    payrollIntegration: true
  });

  const sickLeaveType = await TimeOffType.create({
    name: 'Sick Leave',
    unit: 'Days',
    allocationRequired: true,
    approvalRequired: true,
    payrollIntegration: true
  });

  const personalLeaveType = await TimeOffType.create({
    name: 'Personal Leave',
    unit: 'Hours',
    allocationRequired: false,
    approvalRequired: true,
    payrollIntegration: false
  });
  console.log(`✓ Seeded 3 time off types`);

  // 9. Time Off Allocations & Requests
  console.log('\n[10/10] Seeding Time Off Allocations & Requests...');
  const janeVacationAlloc = await TimeOffAllocation.create({
    employeeId: janeSmithStaff._id,
    timeOffTypeId: paidVacationType._id,
    allocatedAmount: 15,
    takenAmount: 3,
    remainingAmount: 12,
    validFrom: new Date('2026-01-01'),
    validTo: new Date('2026-12-31'),
    approvalStatus: 'Approved'
  });

  await TimeOffAllocation.create({
    employeeId: janeSmithStaff._id,
    timeOffTypeId: sickLeaveType._id,
    allocatedAmount: 10,
    takenAmount: 0,
    remainingAmount: 10,
    validFrom: new Date('2026-01-01'),
    validTo: new Date('2026-12-31'),
    approvalStatus: 'Approved'
  });

  await TimeOffAllocation.create({
    employeeId: johnDoeManager._id,
    timeOffTypeId: paidVacationType._id,
    allocatedAmount: 20,
    takenAmount: 0,
    remainingAmount: 20,
    validFrom: new Date('2026-01-01'),
    validTo: new Date('2026-12-31'),
    approvalStatus: 'Approved'
  });

  // Seed Approved and Pending requests for Jane Smith
  await TimeOffRequest.create({
    employeeId: janeSmithStaff._id,
    timeOffTypeId: paidVacationType._id,
    allocationId: janeVacationAlloc._id,
    startDate: new Date('2026-06-01'),
    endDate: new Date('2026-06-03'),
    duration: 3,
    status: 'Approved'
  });

  await TimeOffRequest.create({
    employeeId: janeSmithStaff._id,
    timeOffTypeId: paidVacationType._id,
    allocationId: janeVacationAlloc._id,
    startDate: new Date('2026-10-15'),
    endDate: new Date('2026-10-16'),
    duration: 2,
    status: 'Pending'
  });
  console.log(`✓ Seeded 3 time off allocations and 2 requests`);

  // 10. Payruns & Payslips
  console.log('\n[11/11] Seeding Payruns & Computing Payslips...');
  const octoberPayrun = await Payrun.create({
    name: 'October 2026 Standard Payrun',
    salaryStructureId: standardStructure._id,
    periodStart: new Date('2026-10-01'),
    periodEnd: new Date('2026-10-31'),
    employeeIds: [janeSmithStaff._id, robertJohnsonHR._id, emilyDavisFinance._id, michaelBrownSales._id],
    status: 'Draft'
  });

  // Dynamically compute payslips for the payrun
  const seededPayslips = await payslipService.generatePayrunPayslips(octoberPayrun);
  console.log(`✓ Seeded 1 Payrun and generated ${seededPayslips.length} computed Payslips with detailed rule breakdown`);

  console.log('\n=====================================================');
  console.log('🎉 SAMPLE DATA SEEDING COMPLETE! 🎉');
  console.log('=====================================================');
  console.log('\nDefault Test Accounts:');
  console.log('  Admin:               admin@peoplepay360.com / Password123!');
  console.log('  HR Manager:          hrmanager@peoplepay360.com / Password123!');
  console.log('  HR Payroll Manager:  payrollmanager@peoplepay360.com / Password123!');
  console.log('  HR Payroll User:     payrolluser@peoplepay360.com / Password123!');
  console.log('  Employee 1:          john.doe@peoplepay360.com / Password123!');
  console.log('  Employee 2:          jane.smith@peoplepay360.com / Password123!');
  console.log('=====================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

seedDatabase().catch((err) => {
  console.error('❌ Seeding failed:', err);
  mongoose.disconnect();
  process.exit(1);
});

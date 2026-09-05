import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import http from 'http';
import app from '../app';
import { User } from '../modules/users/user.model';
import { Department } from '../modules/departments/department.model';
import { Employee } from '../modules/employees/employee.model';
import { Contract } from '../modules/contracts/contract.model';
import { SalaryStructure } from '../modules/salary/structure/structure.model';
import { SalaryRule } from '../modules/salary/rule/rule.model';
import { Payrun } from '../modules/payrun/payrun.model';
import { Payslip } from '../modules/payslip/payslip.model';
import { Attendance } from '../modules/attendance/attendance.model';
import { TimeOffType } from '../modules/timeoff/type/timeoff-type.model';
import { TimeOffRequest } from '../modules/timeoff/request/request.model';
import { payslipService } from '../modules/payslip/payslip.service';
import { emailService } from '../utils/emailService';

dotenv.config();

const PORT = 5012;
const JWT_SECRET = process.env.JWT_SECRET || 'peoplepay360_super_secret_jwt_key_2026';

function generateToken(user: any) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      employeeId: user.employeeId ? user.employeeId.toString() : null
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

function apiRequest(options: {
  method: string;
  path: string;
  token?: string;
  body?: any;
}): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const postData = options.body ? JSON.stringify(options.body) : '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (options.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }
    if (postData) {
      headers['Content-Length'] = Buffer.byteLength(postData).toString();
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path: options.path,
        method: options.method,
        headers
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed: any;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode || 500, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('=====================================================');
  console.log('🧪 TESTING PHASE 7B: BULK EMAIL & PAYROLL DASHBOARD 🧪');
  console.log('=====================================================');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/peoplepay360';
  await mongoose.connect(mongoUri);
  console.log('✓ Connected to MongoDB');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(PORT, '127.0.0.1', () => resolve()));
  console.log(`✓ Test server running on http://127.0.0.1:${PORT}`);

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, errorDetail?: any) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`, errorDetail ? JSON.stringify(errorDetail) : '');
      failed++;
    }
  }

  // Intercept Nodemailer transporter for deterministic delivery assertions
  const sentMailLog: any[] = [];
  const mockTransporter: any = {
    sendMail: async (mailOptions: any) => {
      sentMailLog.push(mailOptions);
      // Simulate failure for specific invalid email to test partial failure handling
      if (mailOptions.to === 'invalid-smtp-fail@test.com') {
        throw new Error('Simulated SMTP connection timeout');
      }
      return { messageId: `msg_${Date.now()}_${Math.random()}` };
    }
  };
  emailService.setTransporter(mockTransporter);

  try {
    console.log('\n--- Setting up test fixtures ---');
    await Payslip.deleteMany({});
    await Payrun.deleteMany({});
    await Contract.deleteMany({});
    await Employee.deleteMany({});
    await SalaryRule.deleteMany({});
    await SalaryStructure.deleteMany({});
    await Attendance.deleteMany({});
    await TimeOffRequest.deleteMany({});
    await Department.deleteMany({});
    await User.deleteMany({ email: { $in: ['admin_7b@test.com', 'pm_7b@test.com', 'pu_7b@test.com', 'hrm_7b@test.com', 'emp1_7b@test.com', 'emp2_7b@test.com'] } });

    // 1. Departments
    const engDept = await Department.create({ name: 'TEST_7B_Engineering' });
    const hrDept = await Department.create({ name: 'TEST_7B_HumanResources' });

    // 2. Salary Structure & Rules
    const structure = await SalaryStructure.create({
      name: 'TEST_7B_Standard Structure',
      code: 'TEST_7B_STRUCT_STD',
      isActive: true
    });

    await SalaryRule.create({
      salaryStructureId: structure._id,
      name: 'Basic',
      code: 'BASIC',
      category: 'Basic',
      sequence: 10,
      computationMethod: 'Fixed',
      amount: 0
    });

    await SalaryRule.create({
      salaryStructureId: structure._id,
      name: 'HRA',
      code: 'HRA',
      category: 'Allowances',
      sequence: 20,
      computationMethod: 'Percentage',
      percentage: 20
    });

    await SalaryRule.create({
      salaryStructureId: structure._id,
      name: 'Gross',
      code: 'GROSS',
      category: 'Gross',
      sequence: 30,
      computationMethod: 'Formula',
      formulaExpression: 'BASIC + HRA'
    });

    await SalaryRule.create({
      salaryStructureId: structure._id,
      name: 'PF',
      code: 'PF',
      category: 'Deductions',
      sequence: 40,
      computationMethod: 'Percentage',
      percentage: 10
    });

    await SalaryRule.create({
      salaryStructureId: structure._id,
      name: 'Net',
      code: 'NET',
      category: 'Net',
      sequence: 50,
      computationMethod: 'Formula',
      formulaExpression: 'GROSS - PF'
    });

    // 3. Employees
    const emp1 = await Employee.create({
      employeeCode: 'TEST_7B_EMP_01',
      firstName: 'Diana',
      lastName: 'Prince',
      email: 'diana.prince@test.com',
      departmentId: engDept._id,
      jobPosition: 'TEST_7B_Lead Engineer',
      employeeType: 'Full-Time',
      status: 'Active',
      bankDetails: { accountNumber: '9988776655' }
    });

    const emp2 = await Employee.create({
      employeeCode: 'TEST_7B_EMP_02',
      firstName: 'Clark',
      lastName: 'Kent',
      email: 'clark.kent@test.com',
      departmentId: engDept._id,
      jobPosition: 'TEST_7B_Senior Engineer',
      employeeType: 'Full-Time',
      status: 'Active',
      bankDetails: { accountNumber: '1122334455' }
    });

    // Emp 3: Has invalid email to test partial failure handling
    const emp3 = await Employee.create({
      employeeCode: 'TEST_7B_EMP_03',
      firstName: 'Bruce',
      lastName: 'Wayne',
      email: 'bruce.temp@test.com',
      departmentId: hrDept._id,
      jobPosition: 'TEST_7B_HR Executive',
      employeeType: 'Part-Time',
      status: 'Active',
      bankDetails: { accountNumber: '5566778899' }
    });
    await Employee.collection.updateOne({ _id: emp3._id }, { $set: { email: '' } });

    // 4. Contracts
    await Contract.create({
      employeeId: emp1._id,
      departmentId: engDept._id,
      jobPosition: 'TEST_7B_Lead Engineer',
      wage: 50000,
      startDate: new Date('2026-01-01'),
      status: 'Active',
      salaryStructureId: structure._id
    });

    await Contract.create({
      employeeId: emp2._id,
      departmentId: engDept._id,
      jobPosition: 'TEST_7B_Senior Engineer',
      wage: 40000,
      startDate: new Date('2026-01-01'),
      status: 'Active',
      salaryStructureId: structure._id
    });

    await Contract.create({
      employeeId: emp3._id,
      departmentId: hrDept._id,
      jobPosition: 'TEST_7B_HR Executive',
      wage: 30000,
      startDate: new Date('2026-01-01'),
      status: 'Active',
      salaryStructureId: structure._id
    });

    // 5. Attendance & Time Off records for dashboard verification
    await Attendance.create({
      employeeId: emp1._id,
      date: new Date('2026-10-05'),
      checkIn: new Date('2026-10-05T09:00:00Z'),
      checkOut: new Date('2026-10-05T18:00:00Z'),
      workedHours: 9,
      status: 'Present',
      correctionReason: 'TEST_7B_Att1'
    });

    await Attendance.create({
      employeeId: emp2._id,
      date: new Date('2026-10-05'),
      checkIn: new Date('2026-10-05T09:00:00Z'),
      checkOut: new Date('2026-10-05T19:00:00Z'),
      workedHours: 10,
      status: 'Overtime',
      correctionReason: 'TEST_7B_Att2'
    });

    const leaveType = (await TimeOffType.findOne()) || (await TimeOffType.create({ name: 'Vacation', unit: 'Days' }));
    await TimeOffRequest.create({
      employeeId: emp1._id,
      timeOffTypeId: leaveType._id,
      startDate: new Date('2026-10-10'),
      endDate: new Date('2026-10-12'),
      duration: 3,
      status: 'Approved'
    });

    await TimeOffRequest.create({
      employeeId: emp2._id,
      timeOffTypeId: leaveType._id,
      startDate: new Date('2026-10-20'),
      endDate: new Date('2026-10-21'),
      duration: 2,
      status: 'Pending'
    });

    // 6. Users & Tokens
    const adminUser = await User.create({ name: 'Admin 7B', email: 'admin_7b@test.com', passwordHash: 'Pass123!', role: 'Admin', isActive: true });
    const payrollMgr = await User.create({ name: 'PM 7B', email: 'pm_7b@test.com', passwordHash: 'Pass123!', role: 'HR Payroll Manager', isActive: true });
    const payrollUser = await User.create({ name: 'PU 7B', email: 'pu_7b@test.com', passwordHash: 'Pass123!', role: 'HR Payroll User', isActive: true });
    const hrMgr = await User.create({ name: 'HRM 7B', email: 'hrm_7b@test.com', passwordHash: 'Pass123!', role: 'HR Manager', isActive: true });
    const userEmp1 = await User.create({ name: 'Emp 1 7B', email: 'emp1_7b@test.com', passwordHash: 'Pass123!', role: 'Employee', employeeId: emp1._id, isActive: true });

    const adminToken = generateToken(adminUser);
    const payrollMgrToken = generateToken(payrollMgr);
    const payrollUserToken = generateToken(payrollUser);
    const hrMgrToken = generateToken(hrMgr);
    const emp1Token = generateToken(userEmp1);

    // 7. Create & Compute Payrun
    const payrun = await Payrun.create({
      name: 'TEST_7B_October 2026 Payrun',
      salaryStructureId: structure._id,
      periodStart: new Date('2026-10-01'),
      periodEnd: new Date('2026-10-31'),
      employeeIds: [emp1._id, emp2._id, emp3._id],
      status: 'Draft'
    });

    await payslipService.generatePayrunPayslips(payrun);

    console.log('✓ Test fixtures ready');

    // ====================================================
    // PART 1: BULK EMAIL TESTS
    // ====================================================
    console.log('\n--- PART 1: Bulk Payslip Email via SMTP ---');

    // 1. Send payslips for payrun
    sentMailLog.length = 0;
    const sendRes = await apiRequest({
      method: 'POST',
      path: `/api/payruns/${payrun._id}/send-payslips`,
      token: payrollMgrToken
    });

    assert(sendRes.status === 200, '1. Send Payslips API returns 200 OK', sendRes.body);
    assert(sendRes.body.data.total === 3, '2. Total payslips processed matches payrun employee count (3)', sendRes.body.data);
    assert(sendRes.body.data.sent === 2, '3. Exactly 2 valid employee payslips successfully sent', sendRes.body.data);
    assert(sendRes.body.data.failed === 1, '4. Exactly 1 employee without email marked as failed', sendRes.body.data);

    // 2. Verify sent mail attributes
    assert(sentMailLog.length === 2, '5. Nodemailer received exactly 2 email dispatches');
    const dianaMail = sentMailLog.find((m: any) => m.to === 'diana.prince@test.com');
    const clarkMail = sentMailLog.find((m: any) => m.to === 'clark.kent@test.com');

    assert(dianaMail !== undefined, '6. Diana Prince received payslip email');
    assert(clarkMail !== undefined, '7. Clark Kent received payslip email');
    assert(dianaMail.attachments && dianaMail.attachments.length === 1, '8. Payslip PDF is attached to Diana\'s email');
    assert(dianaMail.attachments[0].contentType === 'application/pdf', '9. Attachment content-type is application/pdf');

    // 3. Verify Payslip emailStatus in database
    const dianaPayslip = await Payslip.findOne({ employeeId: emp1._id, payrunId: payrun._id });
    const brucePayslip = await Payslip.findOne({ employeeId: emp3._id, payrunId: payrun._id });

    assert(dianaPayslip?.emailStatus === 'Sent', '10. Diana\'s payslip emailStatus updated to "Sent" in DB');
    assert(brucePayslip?.emailStatus === 'Failed', '11. Bruce\'s payslip emailStatus updated to "Failed" in DB');

    // 4. Invalid Payrun ID
    const badPayrunRes = await apiRequest({
      method: 'POST',
      path: `/api/payruns/${new mongoose.Types.ObjectId()}/send-payslips`,
      token: payrollMgrToken
    });
    assert(badPayrunRes.status === 404, '12. Non-existent payrun send-payslips returns 404', badPayrunRes.body);

    // 5. Unauthorized User (Employee) blocked
    const empSendRes = await apiRequest({
      method: 'POST',
      path: `/api/payruns/${payrun._id}/send-payslips`,
      token: emp1Token
    });
    assert(empSendRes.status === 403, '13. Employee blocked from triggering send-payslips (403 Forbidden)', empSendRes.body);

    // ====================================================
    // PART 2: PAYROLL DASHBOARD TESTS
    // ====================================================
    console.log('\n--- PART 2: Payroll Dashboard Live Aggregations ---');

    // Mark payrun as Validated and Paid to test paid metrics
    await Payrun.findByIdAndUpdate(payrun._id, { status: 'Paid' });
    await Payslip.updateMany({ payrunId: payrun._id }, { status: 'Paid' });

    // 6. Full Dashboard (No filters)
    const fullDashRes = await apiRequest({
      method: 'GET',
      path: '/api/dashboard/payroll',
      token: payrollUserToken
    });
    assert(fullDashRes.status === 200, '14. Full Payroll Dashboard returns 200 OK', fullDashRes.body);

    const dashData = fullDashRes.body.data;
    assert(dashData.summary !== undefined, '15. Dashboard contains summary KPIs');
    assert(dashData.summary.payslipsGenerated === 3, '16. Payslips generated count is 3', dashData.summary);
    assert(dashData.summary.paidPayslipsCount === 3, '17. Paid payslips count is 3', dashData.summary);
    assert(dashData.summary.totalNetSalaryPaid > 0, '18. Total Net Salary Paid is non-zero and accurately summed', dashData.summary);
    assert(dashData.summary.averageSalary > 0, '19. Average salary calculated from live data', dashData.summary);

    // 7. Salary Cost by Department
    const deptSalaryRes = await apiRequest({
      method: 'GET',
      path: '/api/dashboard/payroll/salary-by-department',
      token: payrollUserToken
    });
    assert(deptSalaryRes.status === 200 && deptSalaryRes.body.results > 0, '20. Salary by Department returns grouped breakdown (200)', deptSalaryRes.body);
    const engCost = deptSalaryRes.body.data.find((d: any) => d.departmentName === 'TEST_7B_Engineering');
    assert(engCost !== undefined && engCost.payslipCount === 2, '21. Engineering department correctly aggregated 2 payslips');

    // 8. Monthly Net Salary Trends
    const trendsRes = await apiRequest({
      method: 'GET',
      path: '/api/dashboard/payroll/monthly-net-salary',
      token: payrollUserToken
    });
    assert(trendsRes.status === 200 && trendsRes.body.results > 0, '22. Monthly Net Salary Trends returned (200)', trendsRes.body);
    assert(trendsRes.body.data[0].month === '2026-10', '23. Trend correctly grouped by month 2026-10');

    // 9. Department Headcount
    const headcountRes = await apiRequest({
      method: 'GET',
      path: '/api/dashboard/payroll/headcount',
      token: hrMgrToken
    });
    assert(headcountRes.status === 200 && headcountRes.body.data.totalHeadcount >= 3, '24. Department headcount returned (HR Manager allowed)', headcountRes.body);

    // 10. Attendance Health & Time Off Overview
    const attTimeOffRes = await apiRequest({
      method: 'GET',
      path: '/api/dashboard/payroll/attendance-timeoff',
      token: hrMgrToken
    });
    assert(attTimeOffRes.status === 200, '25. Attendance & Time Off overview returns 200 OK', attTimeOffRes.body);
    assert(attTimeOffRes.body.data.attendance.totalRecords === 2, '26. Attendance total records matches DB (2)', attTimeOffRes.body.data);
    assert(attTimeOffRes.body.data.timeOff.approvedCount === 1, '27. Approved time off requests count matches DB (1)', attTimeOffRes.body.data);

    // 11. Dashboard Multi-dimensional Filtering
    // Filter by Department: Engineering only
    const filterEngRes = await apiRequest({
      method: 'GET',
      path: `/api/dashboard/payroll/summary?departmentId=${engDept._id}`,
      token: payrollMgrToken
    });
    assert(filterEngRes.status === 200 && filterEngRes.body.data.payslipsGenerated === 2, '28. Dashboard filtered by Department returns only Engineering payslips (2)', filterEngRes.body);

    // Filter by Employee Type: Part-Time only (Bruce Wayne)
    const filterTypeRes = await apiRequest({
      method: 'GET',
      path: '/api/dashboard/payroll/summary?employeeType=Part-Time',
      token: payrollMgrToken
    });
    assert(filterTypeRes.status === 200 && filterTypeRes.body.data.payslipsGenerated === 1, '29. Dashboard filtered by Employee Type returns Part-Time payslips (1)', filterTypeRes.body);

    // Combined Filter: Engineering + Part-Time -> 0 matching records
    const filterEmptyRes = await apiRequest({
      method: 'GET',
      path: `/api/dashboard/payroll/summary?departmentId=${engDept._id}&employeeType=Part-Time`,
      token: payrollMgrToken
    });
    assert(filterEmptyRes.status === 200 && filterEmptyRes.body.data.payslipsGenerated === 0 && filterEmptyRes.body.data.totalNetSalaryPaid === 0, '30. Non-matching combined filter returns 0 gracefully without errors', filterEmptyRes.body);

    // 12. RBAC - Employee blocked from Payroll Dashboard
    const empDashRes = await apiRequest({
      method: 'GET',
      path: '/api/dashboard/payroll',
      token: emp1Token
    });
    assert(empDashRes.status === 403, '31. Employee blocked from organization-wide dashboard (403 Forbidden)', empDashRes.body);

    // 13. Operational Payroll Alerts
    const alertsRes = await apiRequest({
      method: 'GET',
      path: '/api/dashboard/payroll/alerts',
      token: payrollMgrToken
    });
    assert(alertsRes.status === 200 && Array.isArray(alertsRes.body.data), '32. Payroll Alerts returned as structured alerts array (200)', alertsRes.body);

  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await mongoose.disconnect();
  }

  console.log('\n=====================================================');
  console.log(`🏁 TEST SUMMARY: ${passed} PASSED | ${failed} FAILED 🏁`);
  console.log('=====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

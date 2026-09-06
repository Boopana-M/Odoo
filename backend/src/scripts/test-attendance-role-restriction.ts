import mongoose from 'mongoose';
import dotenv from 'dotenv';
import http from 'http';
import app from '../app';
import { User } from '../modules/users/user.model';
import { Employee } from '../modules/employees/employee.model';
import { Department } from '../modules/departments/department.model';
import { Attendance } from '../modules/attendance/attendance.model';

dotenv.config();

const PORT = 5022;

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
  console.log('================================================================');
  console.log('🧪 COMPREHENSIVE TEST: ATTENDANCE ROLE RESTRICTIONS & RBAC 🧪');
  console.log('================================================================');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/peoplepay360';
  await mongoose.connect(mongoUri);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(PORT, '127.0.0.1', () => resolve()));

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`, detail || '');
      failed++;
    }
  }

  try {
    // 1. Setup Department
    let dept = await Department.findOne({ name: 'Engineering' });
    if (!dept) {
      dept = await Department.create({ name: 'Engineering' });
    }

    // 2. Setup Employees
    let emp1 = await Employee.findOne({ employeeCode: 'EMP_ROLE_TEST_01' });
    if (!emp1) {
      emp1 = await Employee.create({
        employeeCode: 'EMP_ROLE_TEST_01',
        firstName: 'Alice',
        lastName: 'Employee',
        email: 'alice.test@peoplepay360.com',
        departmentId: dept._id,
        jobPosition: 'Developer',
        employeeType: 'Full-Time',
        status: 'Active'
      });
    }

    let emp2 = await Employee.findOne({ employeeCode: 'EMP_ROLE_TEST_02' });
    if (!emp2) {
      emp2 = await Employee.create({
        employeeCode: 'EMP_ROLE_TEST_02',
        firstName: 'Bob',
        lastName: 'Other',
        email: 'bob.test@peoplepay360.com',
        departmentId: dept._id,
        jobPosition: 'QA',
        employeeType: 'Full-Time',
        status: 'Active'
      });
    }

    // Clean up any existing attendance for test employees to have a clean state
    await Attendance.deleteMany({ employeeId: { $in: [emp1._id, emp2._id] } });

    // 3. Helper to create or update user
    async function getOrCreateUser(email: string, role: string, employeeId?: mongoose.Types.ObjectId) {
      let user = await User.findOne({ email });
      if (!user) {
        user = new User({
          name: `${role} User`,
          email,
          passwordHash: 'Password123!',
          role,
          employeeId,
          isActive: true
        });
        await user.save();
      } else {
        user.role = role as any;
        user.employeeId = employeeId;
        user.passwordHash = 'Password123!';
        await user.save();
      }
      // Login to get token
      const loginRes = await apiRequest({
        method: 'POST',
        path: '/api/auth/login',
        body: { email, password: 'Password123!' }
      });
      return loginRes.body.data.token;
    }

    const employeeToken = await getOrCreateUser('alice.test@peoplepay360.com', 'Employee', emp1._id);
    const hrManagerToken = await getOrCreateUser('hrmanager.test@peoplepay360.com', 'HR Manager');
    const adminToken = await getOrCreateUser('admin.test@peoplepay360.com', 'Admin');
    const payrollUserToken = await getOrCreateUser('payrolluser.test@peoplepay360.com', 'HR Payroll User');
    const payrollManagerToken = await getOrCreateUser('payrollmgr.test@peoplepay360.com', 'HR Payroll Manager');

    console.log('\n--- Section 1: Non-Employee Roles Must Be REJECTED on Check-In & Check-Out (403 Forbidden) ---');

    // 1.1 HR Manager Check-In
    const hrCheckIn = await apiRequest({
      method: 'POST',
      path: '/api/attendance/check-in',
      token: hrManagerToken,
      body: {}
    });
    assert(
      hrCheckIn.status === 403 && hrCheckIn.body?.message?.includes('Only employees can perform self-service check-in'),
      'HR Manager cannot self-service check-in (HTTP 403)',
      hrCheckIn
    );

    // 1.2 HR Manager Check-Out
    const hrCheckOut = await apiRequest({
      method: 'POST',
      path: '/api/attendance/check-out',
      token: hrManagerToken,
      body: {}
    });
    assert(
      hrCheckOut.status === 403 && hrCheckOut.body?.message?.includes('Only employees can perform self-service check-out'),
      'HR Manager cannot self-service check-out (HTTP 403)',
      hrCheckOut
    );

    // 1.3 Admin Check-In & Check-Out
    const adminCheckIn = await apiRequest({
      method: 'POST',
      path: '/api/attendance/check-in',
      token: adminToken,
      body: {}
    });
    assert(adminCheckIn.status === 403, 'Admin cannot self-service check-in (HTTP 403)', adminCheckIn);

    const adminCheckOut = await apiRequest({
      method: 'POST',
      path: '/api/attendance/check-out',
      token: adminToken,
      body: {}
    });
    assert(adminCheckOut.status === 403, 'Admin cannot self-service check-out (HTTP 403)', adminCheckOut);

    // 1.4 HR Payroll User Check-In & Check-Out
    const pyUserCheckIn = await apiRequest({
      method: 'POST',
      path: '/api/attendance/check-in',
      token: payrollUserToken,
      body: {}
    });
    assert(pyUserCheckIn.status === 403, 'HR Payroll User cannot self-service check-in (HTTP 403)', pyUserCheckIn);

    const pyUserCheckOut = await apiRequest({
      method: 'POST',
      path: '/api/attendance/check-out',
      token: payrollUserToken,
      body: {}
    });
    assert(pyUserCheckOut.status === 403, 'HR Payroll User cannot self-service check-out (HTTP 403)', pyUserCheckOut);

    // 1.5 HR Payroll Manager Check-In & Check-Out
    const pyMgrCheckIn = await apiRequest({
      method: 'POST',
      path: '/api/attendance/check-in',
      token: payrollManagerToken,
      body: {}
    });
    assert(pyMgrCheckIn.status === 403, 'HR Payroll Manager cannot self-service check-in (HTTP 403)', pyMgrCheckIn);

    const pyMgrCheckOut = await apiRequest({
      method: 'POST',
      path: '/api/attendance/check-out',
      token: payrollManagerToken,
      body: {}
    });
    assert(pyMgrCheckOut.status === 403, 'HR Payroll Manager cannot self-service check-out (HTTP 403)', pyMgrCheckOut);

    console.log('\n--- Section 2: Employee Role Self-Service Check-In & Check-Out Lifecycle ---');

    // 2.1 Check out before checking in should fail with 400
    const earlyCheckOut = await apiRequest({
      method: 'POST',
      path: '/api/attendance/check-out',
      token: employeeToken,
      body: {}
    });
    assert(
      earlyCheckOut.status === 400 && earlyCheckOut.body?.message?.includes('Cannot check out without an active check-in'),
      'Employee checkout without active check-in returns HTTP 400',
      earlyCheckOut
    );

    // 2.2 Employee valid check-in
    const empCheckIn = await apiRequest({
      method: 'POST',
      path: '/api/attendance/check-in',
      token: employeeToken,
      body: {
        // Even if client passes a spoofed employeeId, backend must use Alice's employeeId
        employeeId: emp2._id.toString()
      }
    });
    const returnedEmpId = empCheckIn.body?.data?.employeeId?._id || empCheckIn.body?.data?.employeeId;
    assert(
      empCheckIn.status === 201 && returnedEmpId === emp1._id.toString(),
      'Employee check-in succeeds (201) and securely derives employeeId from token',
      empCheckIn.body
    );
    assert(!empCheckIn.body?.data?.checkOut, 'New attendance checkOut is null (open)', empCheckIn.body?.data);

    // 2.3 Duplicate check-in should fail with 400
    const dupCheckIn = await apiRequest({
      method: 'POST',
      path: '/api/attendance/check-in',
      token: employeeToken,
      body: {}
    });
    assert(
      dupCheckIn.status === 400 && dupCheckIn.body?.message?.includes('Already checked in'),
      'Employee duplicate check-in is rejected with HTTP 400',
      dupCheckIn.body
    );

    // Wait 1.1 seconds so worked time is positive
    await new Promise((r) => setTimeout(r, 1100));

    // 2.4 Employee valid check-out
    const empCheckOut = await apiRequest({
      method: 'POST',
      path: '/api/attendance/check-out',
      token: employeeToken,
      body: {}
    });
    assert(
      empCheckOut.status === 200 && !!empCheckOut.body?.data?.checkOut,
      'Employee check-out succeeds (200) and sets checkOut timestamp',
      empCheckOut.body
    );
    assert(
      typeof empCheckOut.body?.data?.workedHours === 'number' && empCheckOut.body?.data?.workedHours >= 0,
      'Worked hours correctly calculated on check-out',
      empCheckOut.body?.data?.workedHours
    );

    // 2.5 Second check-out after already checked out should fail with 400
    const secondCheckOut = await apiRequest({
      method: 'POST',
      path: '/api/attendance/check-out',
      token: employeeToken,
      body: {}
    });
    assert(
      secondCheckOut.status === 400,
      'Subsequent check-out fails with HTTP 400 because there is no open check-in',
      secondCheckOut.body
    );

    console.log('\n--- Section 3: Management Permissions Preserved ---');

    // 3.1 HR Manager can list all attendance
    const listRes = await apiRequest({
      method: 'GET',
      path: '/api/attendance',
      token: hrManagerToken
    });
    assert(listRes.status === 200 && Array.isArray(listRes.body?.data), 'HR Manager can list employee attendance', listRes.body);

    // 3.2 HR Manager can correct an attendance record
    const recordId = empCheckIn.body.data._id;
    const correctRes = await apiRequest({
      method: 'PUT',
      path: `/api/attendance/${recordId}`,
      token: hrManagerToken,
      body: {
        status: 'Present',
        correctionReason: 'Verified by HR for testing'
      }
    });
    assert(
      correctRes.status === 200 && correctRes.body?.data?.isCorrected === true,
      'HR Manager can correct attendance records with audit reason',
      correctRes.body
    );

    // 3.3 Employee cannot correct attendance records
    const empCorrectRes = await apiRequest({
      method: 'PUT',
      path: `/api/attendance/${recordId}`,
      token: employeeToken,
      body: {
        status: 'Present',
        correctionReason: 'Hacked by employee'
      }
    });
    assert(empCorrectRes.status === 403, 'Employee cannot correct attendance records (HTTP 403)', empCorrectRes.body);

    // 3.4 Employee listing only returns their own records
    const empListRes = await apiRequest({
      method: 'GET',
      path: '/api/attendance',
      token: employeeToken
    });
    assert(
      empListRes.status === 200 &&
        empListRes.body?.data?.every(
          (item: any) => item.employeeId?._id?.toString() === emp1._id.toString() || item.employeeId?.toString() === emp1._id.toString()
        ),
      'Employee attendance list only returns own records',
      empListRes.body?.data?.length
    );

    console.log('\n================================================================');
    console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Unexpected error running tests:', error);
    process.exit(1);
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runTests();

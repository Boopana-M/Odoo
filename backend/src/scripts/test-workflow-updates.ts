import mongoose from 'mongoose';
import dotenv from 'dotenv';
import http from 'http';
import app from '../app';
import { User } from '../modules/users/user.model';
import { Employee } from '../modules/employees/employee.model';
import { Department } from '../modules/departments/department.model';

dotenv.config();

const PORT = 5012;

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
  console.log('🧪 TESTING WORKFLOW UPDATES & NEW FEATURES 🧪');
  console.log('=====================================================');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/peoplepay360';
  await mongoose.connect(mongoUri);
  console.log('✓ Connected to MongoDB');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(PORT, '127.0.0.1', () => resolve()));
  console.log(`✓ Test server running on http://127.0.0.1:${PORT}`);

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
    // 1. Ensure Admin exists and login
    let admin = await User.findOne({ email: 'admin@peoplepay360.com' });
    if (!admin) {
      admin = new User({
        name: 'System Admin',
        email: 'admin@peoplepay360.com',
        passwordHash: 'AdminPassword123!',
        role: 'Admin',
        isActive: true
      });
      await admin.save();
    }

    const adminLoginRes = await apiRequest({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'admin@peoplepay360.com', password: 'AdminPassword123!' }
    });
    assert(adminLoginRes.status === 200, 'Admin login successfully', adminLoginRes.body);
    const adminToken = adminLoginRes.body.data.token;

    // 2. Department Creation
    await Department.deleteMany({ name: 'Test Engineering Dept' });
    const deptRes = await apiRequest({
      method: 'POST',
      path: '/api/departments',
      token: adminToken,
      body: { name: 'Test Engineering Dept' }
    });
    assert(deptRes.status === 201, 'Admin can create department', deptRes.body);
    const deptId = deptRes.body.data._id;

    // 3. Employee User Creation (Atomic User + Employee)
    await User.deleteMany({ email: 'test.arun@example.com' });
    await Employee.deleteMany({ employeeCode: 'TEST_EMP001' });

    const createEmpRes = await apiRequest({
      method: 'POST',
      path: '/api/users',
      token: adminToken,
      body: {
        role: 'Employee',
        name: 'Arun Kumar',
        email: 'test.arun@example.com',
        password: 'InitialPassword123!',
        isActive: true,
        employee: {
          employeeCode: 'TEST_EMP001',
          firstName: 'Arun',
          lastName: 'Kumar',
          email: 'test.arun@example.com',
          departmentId: deptId,
          jobPosition: 'Software Engineer',
          employeeType: 'Full-Time',
          status: 'Active'
        }
      }
    });

    assert(createEmpRes.status === 201, 'Create Employee user created successfully', createEmpRes.body);
    const createdUser = createEmpRes.body.data;
    assert(!!createdUser.employeeId, 'User has linked employeeId');
    assert(createdUser.employeeId.employeeCode === 'TEST_EMP001', 'Linked Employee has correct code');

    // 4. Non-Employee User Creation (User only, employeeId is null)
    await User.deleteMany({ email: 'test.hr@example.com' });
    const createHrRes = await apiRequest({
      method: 'POST',
      path: '/api/users',
      token: adminToken,
      body: {
        role: 'HR Manager',
        name: 'Sarah HR',
        email: 'test.hr@example.com',
        password: 'HrPassword123!',
        isActive: true
      }
    });
    assert(createHrRes.status === 201, 'Create HR Manager user created successfully', createHrRes.body);
    assert(!createHrRes.body.data.employeeId, 'HR Manager user has null employeeId');

    // 5. Negative Test: Duplicate Employee Code
    const dupCodeRes = await apiRequest({
      method: 'POST',
      path: '/api/users',
      token: adminToken,
      body: {
        role: 'Employee',
        name: 'Another Employee',
        email: 'another@example.com',
        password: 'Password123!',
        employee: {
          employeeCode: 'TEST_EMP001',
          firstName: 'Another',
          lastName: 'Emp',
          email: 'another@example.com',
          departmentId: deptId,
          jobPosition: 'QA'
        }
      }
    });
    assert(dupCodeRes.status === 409 || dupCodeRes.status === 400, 'Duplicate employee code rejected');

    // 6. Negative Test: Duplicate User Email
    const dupEmailRes = await apiRequest({
      method: 'POST',
      path: '/api/users',
      token: adminToken,
      body: {
        role: 'HR Manager',
        name: 'Duplicate Email',
        email: 'test.arun@example.com',
        password: 'Password123!'
      }
    });
    assert(dupEmailRes.status === 400, 'Duplicate user email rejected');

    // 7. Employee Login
    const empLoginRes = await apiRequest({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'test.arun@example.com', password: 'InitialPassword123!' }
    });
    assert(empLoginRes.status === 200, 'Employee can log in with initial password', empLoginRes.body);
    const empToken = empLoginRes.body.data.token;

    // 8. Employee Change Password - Negative Test (Incorrect current password)
    const wrongPassRes = await apiRequest({
      method: 'PATCH',
      path: '/api/auth/change-password',
      token: empToken,
      body: {
        currentPassword: 'WrongPassword!',
        newPassword: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      }
    });
    assert(wrongPassRes.status === 400, 'Incorrect current password is rejected');

    // 9. Employee Change Password - Positive Test
    const changePassRes = await apiRequest({
      method: 'PATCH',
      path: '/api/auth/change-password',
      token: empToken,
      body: {
        currentPassword: 'InitialPassword123!',
        newPassword: 'NewSecretPassword123!',
        confirmPassword: 'NewSecretPassword123!'
      }
    });
    assert(changePassRes.status === 200, 'Employee changes password successfully', changePassRes.body);

    // 10. Verify Old Password Fails
    const oldLoginRes = await apiRequest({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'test.arun@example.com', password: 'InitialPassword123!' }
    });
    assert(oldLoginRes.status === 401, 'Old password no longer works');

    // 11. Verify New Password Works
    const newLoginRes = await apiRequest({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'test.arun@example.com', password: 'NewSecretPassword123!' }
    });
    assert(newLoginRes.status === 200, 'New password works for employee login');

    // Clean up test records
    await User.deleteMany({ email: { $in: ['test.arun@example.com', 'test.hr@example.com'] } });
    await Employee.deleteMany({ employeeCode: 'TEST_EMP001' });
    await Department.deleteMany({ name: 'Test Engineering Dept' });

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    server.close();
    await mongoose.disconnect();
    console.log('=====================================================');
    console.log(`📊 RESULTS: ${passed} Passed, ${failed} Failed`);
    console.log('=====================================================');
  }
}

runTests();

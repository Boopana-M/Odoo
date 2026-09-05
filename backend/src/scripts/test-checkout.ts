import mongoose from 'mongoose';
import dotenv from 'dotenv';
import http from 'http';
import app from '../app';
import { User } from '../modules/users/user.model';
import { Employee } from '../modules/employees/employee.model';
import { Department } from '../modules/departments/department.model';

dotenv.config();

const PORT = 5013;

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
  console.log('🧪 TESTING EMPLOYEE ATTENDANCE CHECK-OUT 🧪');
  console.log('=====================================================');

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
    // 1. Find or create an employee and user
    let dept = await Department.findOne();
    if (!dept) {
      dept = await Department.create({ name: 'Engineering' });
    }

    let emp = await Employee.findOne({ employeeCode: 'TEST_CHECKOUT_EMP' });
    if (!emp) {
      emp = await Employee.create({
        employeeCode: 'TEST_CHECKOUT_EMP',
        firstName: 'Checkout',
        lastName: 'Tester',
        email: 'checkout.tester@peoplepay360.com',
        departmentId: dept._id,
        jobPosition: 'QA Tester',
        employeeType: 'Full-Time',
        status: 'Active'
      });
    }

    let user = await User.findOne({ email: 'checkout.tester@peoplepay360.com' });
    if (!user) {
      user = new User({
        name: 'Checkout Tester',
        email: 'checkout.tester@peoplepay360.com',
        passwordHash: 'Password123!',
        role: 'Employee',
        employeeId: emp._id,
        isActive: true
      });
      await user.save();
    }

    // 2. Login as Employee
    const loginRes = await apiRequest({
      method: 'POST',
      path: '/api/auth/login',
      body: { email: 'checkout.tester@peoplepay360.com', password: 'Password123!' }
    });
    assert(loginRes.status === 200, 'Employee login successful', loginRes.body);
    const token = loginRes.body.data.token;

    // 3. Check in as Employee
    const now = new Date();
    const checkInRes = await apiRequest({
      method: 'POST',
      path: '/api/attendance',
      token,
      body: {
        employeeId: emp._id.toString(),
        date: now.toISOString().split('T')[0],
        checkIn: now.toISOString(),
        status: 'Present'
      }
    });
    assert(checkInRes.status === 201, 'Employee check-in successful', checkInRes.body);
    const attId = checkInRes.body.data._id;

    // 4. Check out as Employee (PUT /api/attendance/:id)
    const checkOutTime = new Date(Date.now() + 45000); // 45 seconds later
    const checkOutRes = await apiRequest({
      method: 'PUT',
      path: `/api/attendance/${attId}`,
      token,
      body: {
        checkOut: checkOutTime.toISOString()
      }
    });
    assert(checkOutRes.status === 200, 'Employee check-out successful via PUT', checkOutRes.body);
    assert(!!checkOutRes.body.data.checkOut, 'Check-out timestamp is set');
    assert(checkOutRes.body.data.isCorrected === false, 'isCorrected is false for normal self-checkout');

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    server.close();
    await mongoose.disconnect();
    console.log('=====================================================');
    console.log(`📊 RESULTS: ${passed} Passed, ${failed} Failed`);
    console.log('=====================================================');
  }
}

runTests();

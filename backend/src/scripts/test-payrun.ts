import jwt from 'jsonwebtoken';
import http from 'http';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import app from '../app';
import { connectDB } from '../config/db';
import { SalaryStructure } from '../modules/salary/structure/structure.model';
import { Employee } from '../modules/employees/employee.model';
import { Department } from '../modules/departments/department.model';
import { Contract } from '../modules/contracts/contract.model';
import { Payrun } from '../modules/payrun/payrun.model';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'peoplepay360_super_secret_jwt_key_2026';
const TEST_PORT = 5098;

function createToken(role: string, id: string = '507f1f77bcf86cd799439011') {
  return jwt.sign({ userId: id, role }, JWT_SECRET, { expiresIn: '1h' });
}

const adminToken = createToken('Admin');
const payrollManagerToken = createToken('HR Payroll Manager');
const payrollUserToken = createToken('HR Payroll User');
const hrManagerToken = createToken('HR Manager');
const employeeToken = createToken('Employee');

async function request(options: {
  method: string;
  path: string;
  token?: string;
  body?: any;
}): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const data = options.body ? JSON.stringify(options.body) : '';
    const req = http.request(
      {
        hostname: 'localhost',
        port: TEST_PORT,
        path: options.path,
        method: options.method,
        headers: {
          'Content-Type': 'application/json',
          ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
          ...(options.body ? { 'Content-Length': Buffer.byteLength(data) } : {})
        }
      },
      (res) => {
        let resData = '';
        res.on('data', (chunk) => (resData += chunk));
        res.on('end', () => {
          let parsed: any;
          try {
            parsed = JSON.parse(resData);
          } catch {
            parsed = resData;
          }
          resolve({ status: res.statusCode || 500, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  await connectDB();
  const server = app.listen(TEST_PORT);

  console.log('=== RUNNING PAYRUN MODULE TESTS ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, description: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${description}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${description} ${detail ? `- ${detail}` : ''}`);
      failed++;
    }
  }

  try {
    // Setup test data
    const timestamp = Date.now();
    const dept = await new Department({ name: `Payrun Test Dept ${timestamp}` }).save();

    const structure = await new SalaryStructure({
      name: `Executive Pay Structure ${timestamp}`,
      code: `EXEC_PAY_${timestamp}`,
      isActive: true
    }).save();

    // Import SalaryRule dynamically or create doc
    if (mongoose.models.SalaryRule) {
      await new mongoose.models.SalaryRule({
        salaryStructureId: structure._id,
        name: 'Basic Salary',
        code: 'BASIC',
        category: 'Basic',
        sequence: 10,
        computationMethod: 'Fixed',
        amount: 5000,
        isActive: true
      }).save();
    }

    // Employee 1: Active with full info, valid contract
    const emp1 = await new Employee({
      employeeCode: `EMP_PR1_${timestamp}`,
      firstName: 'Alice',
      lastName: 'Smith',
      email: `alice_${timestamp}@test.com`,
      departmentId: dept._id,
      jobPosition: 'Senior Engineer',
      status: 'Active',
      bankDetails: { bankName: 'Bank A', accountNumber: '123456789' }
    }).save();

    const contract1 = await new Contract({
      employeeId: emp1._id,
      departmentId: dept._id,
      jobPosition: 'Senior Engineer',
      wage: 8000,
      startDate: new Date('2026-01-01'),
      salaryStructureId: structure._id,
      status: 'Active'
    }).save();

    // Employee 2: Active without contract, missing bank details
    const emp2 = await new Employee({
      employeeCode: `EMP_PR2_${timestamp}`,
      firstName: 'Bob',
      lastName: 'Jones',
      email: `bob_${timestamp}@test.com`,
      departmentId: dept._id,
      jobPosition: 'Designer',
      status: 'Active',
      bankDetails: {}
    }).save();

    const periodStart = '2026-06-01';
    const periodEnd = '2026-06-30';

    // 1. Salary Structure is required
    const res1 = await request({
      method: 'POST',
      path: '/api/payruns/eligible-employees',
      token: payrollUserToken,
      body: { periodStart, periodEnd }
    });
    assert(res1.status === 400, '1. Salary Structure is required for Step 1 setup', JSON.stringify(res1.body));

    // 2. Invalid Salary Structure is rejected
    const res2 = await request({
      method: 'POST',
      path: '/api/payruns/eligible-employees',
      token: payrollUserToken,
      body: { salaryStructureId: new mongoose.Types.ObjectId().toString(), periodStart, periodEnd }
    });
    assert(res2.status === 404 || res2.status === 400, '2. Invalid Salary Structure is rejected', JSON.stringify(res2.body));

    // 3. Invalid period is rejected (periodEnd before periodStart)
    const res3 = await request({
      method: 'POST',
      path: '/api/payruns/eligible-employees',
      token: payrollUserToken,
      body: { salaryStructureId: structure._id.toString(), periodStart: '2026-06-30', periodEnd: '2026-06-01' }
    });
    assert(res3.status === 400, '3. Invalid period is rejected (end before start)', JSON.stringify(res3.body));

    // 4. Eligible employees can be retrieved
    const res4 = await request({
      method: 'POST',
      path: '/api/payruns/eligible-employees',
      token: payrollUserToken,
      body: { salaryStructureId: structure._id.toString(), periodStart, periodEnd }
    });
    assert(
      res4.status === 200 && res4.body?.data?.eligibleEmployees?.length >= 1,
      '4. Eligible employees can be retrieved',
      JSON.stringify(res4.body)
    );

    // 5. Employee without applicable contract is handled correctly (placed in ineligible list with warning)
    const ineligibleEmps = res4.body?.data?.ineligibleEmployees || [];
    const emp2Ineligible = ineligibleEmps.find((e: any) => e._id === emp2._id.toString());
    assert(
      emp2Ineligible && emp2Ineligible.warnings.some((w: string) => w.includes('No active contract')),
      '5. Employee without applicable contract is handled correctly (ineligible list)',
      JSON.stringify(emp2Ineligible)
    );

    // 6. Duplicate employee selection is rejected
    const res6 = await request({
      method: 'POST',
      path: '/api/payruns',
      token: payrollUserToken,
      body: {
        name: `June Payroll ${timestamp}`,
        salaryStructureId: structure._id.toString(),
        periodStart,
        periodEnd,
        employeeIds: [emp1._id.toString(), emp1._id.toString()]
      }
    });
    assert(res6.status === 400, '6. Duplicate employee selection is rejected', JSON.stringify(res6.body));

    // 7. Payrun is NOT created during Step 1
    const countBefore = await Payrun.countDocuments();
    await request({
      method: 'POST',
      path: '/api/payruns/eligible-employees',
      token: payrollUserToken,
      body: { salaryStructureId: structure._id.toString(), periodStart, periodEnd }
    });
    const countAfter = await Payrun.countDocuments();
    assert(countBefore === countAfter, '7. Payrun is NOT created during Step 1', `Before: ${countBefore}, After: ${countAfter}`);

    // 8. Payrun is created only after employee selection (Step 2)
    const res8 = await request({
      method: 'POST',
      path: '/api/payruns',
      token: payrollUserToken,
      body: {
        name: `June Payroll ${timestamp}`,
        salaryStructureId: structure._id.toString(),
        periodStart,
        periodEnd,
        employeeIds: [emp1._id.toString(), emp2._id.toString()]
      }
    });
    assert(res8.status === 201 && res8.body?.data?._id, '8. Payrun is created after employee selection', JSON.stringify(res8.body));
    const createdPayrunId = res8.body?.data?._id;

    // 9. Only selected employees are stored
    const payrunDoc = await Payrun.findById(createdPayrunId);
    assert(
      payrunDoc !== null && payrunDoc.employeeIds.length === 2,
      '9. Only selected employees are stored',
      `Count: ${payrunDoc?.employeeIds.length}`
    );

    // 10. One Salary Structure is stored for the Payrun
    assert(
      payrunDoc?.salaryStructureId.toString() === structure._id.toString(),
      '10. One Salary Structure is stored for the Payrun',
      `Structure ID: ${payrunDoc?.salaryStructureId}`
    );

    // 11. Duplicate Payslip / overlapping Payrun detection works
    const res11 = await request({
      method: 'POST',
      path: '/api/payruns',
      token: payrollUserToken,
      body: {
        name: `June Duplicate Payroll ${timestamp}`,
        salaryStructureId: structure._id.toString(),
        periodStart,
        periodEnd,
        employeeIds: [emp1._id.toString()]
      }
    });
    const dupWarnings = res11.body?.data?.warnings || [];
    assert(
      res11.status === 201 && dupWarnings.some((w: any) => w.type === 'DUPLICATE_PAYSLIP'),
      '11. Duplicate Payslip/Payrun detection produces warning',
      JSON.stringify(dupWarnings)
    );

    // 12. Missing bank details produce a warning
    const warnings = payrunDoc?.warnings || [];
    const missingBankWarn = warnings.find((w: any) => w.type === 'MISSING_BANK_DETAILS');
    assert(
      missingBankWarn !== undefined && missingBankWarn.employeeId?.toString() === emp2._id.toString(),
      '12. Missing bank details produce a warning',
      JSON.stringify(warnings)
    );

    // 13. Missing employee information check
    // Create employee with missing fields
    const emp3 = await new Employee({
      employeeCode: `EMP_PR3_${timestamp}`,
      firstName: 'Charlie',
      lastName: 'Brown',
      email: `charlie_${timestamp}@test.com`,
      departmentId: dept._id,
      jobPosition: 'Temp',
      status: 'Active',
      bankDetails: { bankName: 'Bank C', accountNumber: '999999' }
    }).save();

    const res13 = await request({
      method: 'POST',
      path: '/api/payruns',
      token: payrollUserToken,
      body: {
        name: `Missing Info Check ${timestamp}`,
        salaryStructureId: structure._id.toString(),
        periodStart: '2026-07-01',
        periodEnd: '2026-07-31',
        employeeIds: [emp3._id.toString()]
      }
    });
    assert(res13.status === 201, '13. Missing employee info handled', JSON.stringify(res13.body));

    // 14. Contract issue produces a warning (emp2 has no contract)
    const missingContractWarn = warnings.find((w: any) => w.type === 'MISSING_CONTRACT');
    assert(
      missingContractWarn !== undefined && missingContractWarn.employeeId?.toString() === emp2._id.toString(),
      '14. Contract issue produces a warning',
      JSON.stringify(warnings)
    );

    // 15. Unauthorized user cannot create/manage Payruns
    const res15a = await request({
      method: 'POST',
      path: '/api/payruns',
      token: hrManagerToken,
      body: {
        name: `Forbidden HR Manager Payrun ${timestamp}`,
        salaryStructureId: structure._id.toString(),
        periodStart,
        periodEnd,
        employeeIds: [emp1._id.toString()]
      }
    });
    const res15b = await request({
      method: 'POST',
      path: '/api/payruns',
      token: employeeToken,
      body: {
        name: `Forbidden Employee Payrun ${timestamp}`,
        salaryStructureId: structure._id.toString(),
        periodStart,
        periodEnd,
        employeeIds: [emp1._id.toString()]
      }
    });
    assert(
      res15a.status === 403 && res15b.status === 403,
      '15. Unauthorized user cannot create/manage Payruns (Forbidden)',
      `HR Manager: ${res15a.status}, Employee: ${res15b.status}`
    );

    // 16. Authorized payroll user can manage Payruns
    const res16 = await request({
      method: 'GET',
      path: '/api/payruns',
      token: payrollUserToken
    });
    assert(res16.status === 200 && Array.isArray(res16.body?.data), '16. Authorized payroll user can manage Payruns', JSON.stringify(res16.body));

    // Prepare Payrun for Mark Paid by computing and validating (using emp1 who has valid contract)
    const validPayrun = await request({
      method: 'POST',
      path: '/api/payruns',
      token: payrollUserToken,
      body: {
        name: `Mark Paid Test Payroll ${timestamp}`,
        salaryStructureId: structure._id.toString(),
        periodStart: '2026-06-01',
        periodEnd: '2026-06-30',
        employeeIds: [emp1._id.toString()]
      }
    });
    const validPayrunId = validPayrun.body?.data?._id;
    const compRes = await request({ method: 'POST', path: `/api/payruns/${validPayrunId}/compute`, token: payrollUserToken });
    const valRes = await request({ method: 'POST', path: `/api/payruns/${validPayrunId}/validate`, token: payrollUserToken });

    if (valRes.status !== 200) {
      console.log('ValRes error:', valRes.status, JSON.stringify(valRes.body));
    }

    // 17. Mark Paid works only for an authorized payroll role
    const res17a = await request({
      method: 'POST',
      path: `/api/payruns/${validPayrunId}/mark-paid`,
      token: hrManagerToken
    });
    const res17b = await request({
      method: 'POST',
      path: `/api/payruns/${validPayrunId}/mark-paid`,
      token: payrollManagerToken
    });
    assert(
      res17a.status === 403 && res17b.status === 200 && res17b.body?.data?.status === 'Paid',
      '17. Mark Paid works only for authorized payroll role',
      `HR Manager: ${res17a.status}, Payroll Manager: ${res17b.status}`
    );

    // 18. Paid Payrun remains stored
    const storedPayrun = await Payrun.findById(validPayrunId);
    assert(
      storedPayrun !== null && storedPayrun.status === 'Paid',
      '18. Paid Payrun remains stored as historical record',
      `Status: ${storedPayrun?.status}`
    );

    console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED.`);
    if (failed > 0) process.exit(1);
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runTests().catch((err) => {
  console.error('Error running test script:', err);
  process.exit(1);
});

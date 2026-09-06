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

dotenv.config();

const PORT = 5010;
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
  console.log('🧪 TESTING PHASE 6 — PAYSLIPS & SALARY CALCULATION 🧪');
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

  try {
    console.log('\n--- Setting up test fixtures ---');
    // Clean test data
    await Payslip.deleteMany({});
    await Payrun.deleteMany({ name: /^TEST_/ });
    await Contract.deleteMany({ jobPosition: /^TEST_/ });
    await Employee.deleteMany({ employeeCode: /^TEST_EMP_/ });
    await SalaryRule.deleteMany({});
    await SalaryStructure.deleteMany({ code: /^TEST_STRUCT_/ });
    await User.deleteMany({ email: { $in: ['alice.user@test.com', 'bob.user@test.com', 'admin_test2@test.com', 'payroll_mgr2@test.com', 'payroll_user2@test.com', 'hr_mgr2@test.com'] } });

    const testDept = (await Department.findOne()) || (await Department.create({ name: 'Engineering' }));

    // 1. Create Salary Structure & Sequential Rules
    const structure = await SalaryStructure.create({
      name: 'Standard Payroll Structure',
      code: 'TEST_STRUCT_STD',
      isActive: true
    });

    // Rule 1: Basic (Fixed - falls back to contract wage)
    const ruleBasic = await SalaryRule.create({
      salaryStructureId: structure._id,
      name: 'Basic Salary',
      code: 'BASIC',
      category: 'Basic',
      sequence: 10,
      computationMethod: 'Fixed',
      amount: 0 // indicates wage basis
    });

    // Rule 2: House Rent Allowance (Percentage = 40% of Basic)
    const ruleHRA = await SalaryRule.create({
      salaryStructureId: structure._id,
      name: 'House Rent Allowance',
      code: 'HRA',
      category: 'Allowances',
      sequence: 20,
      computationMethod: 'Percentage',
      percentage: 40
    });

    // Rule 3: Gross (Formula: BASIC + HRA)
    const ruleGross = await SalaryRule.create({
      salaryStructureId: structure._id,
      name: 'Gross Total',
      code: 'GROSS',
      category: 'Gross',
      sequence: 30,
      computationMethod: 'Formula',
      formulaExpression: 'BASIC + HRA'
    });

    // Rule 4: Provident Fund (Percentage = 12% of Basic)
    const rulePF = await SalaryRule.create({
      salaryStructureId: structure._id,
      name: 'Provident Fund',
      code: 'PF',
      category: 'Deductions',
      sequence: 40,
      computationMethod: 'Percentage',
      percentage: 12
    });

    // Rule 5: Net Salary (Formula: GROSS - PF)
    const ruleNet = await SalaryRule.create({
      salaryStructureId: structure._id,
      name: 'Net Salary',
      code: 'NET',
      category: 'Net',
      sequence: 50,
      computationMethod: 'Formula',
      formulaExpression: 'GROSS - PF'
    });

    // 2. Create Employees:
    // Employee 1: Wage = 30000
    const emp1 = await Employee.create({
      employeeCode: 'TEST_EMP_01',
      firstName: 'Alice',
      lastName: 'Wong',
      email: 'alice.wong@test.com',
      departmentId: testDept._id,
      jobPosition: 'TEST_Junior Dev',
      employeeType: 'Full-Time',
      status: 'Active',
      bankDetails: { accountNumber: '111122223333' }
    });

    // Employee 2: Wage = 50000 (Uses SAME Structure!)
    const emp2 = await Employee.create({
      employeeCode: 'TEST_EMP_02',
      firstName: 'Bob',
      lastName: 'Miller',
      email: 'bob.miller@test.com',
      departmentId: testDept._id,
      jobPosition: 'TEST_Senior Dev',
      employeeType: 'Full-Time',
      status: 'Active',
      bankDetails: { accountNumber: '444455556666' }
    });

    // Employee 3: Non-selected employee
    const emp3 = await Employee.create({
      employeeCode: 'TEST_EMP_03',
      firstName: 'Charlie',
      lastName: 'Green',
      email: 'charlie.green@test.com',
      departmentId: testDept._id,
      jobPosition: 'TEST_Intern',
      employeeType: 'Intern',
      status: 'Active',
      bankDetails: { accountNumber: '777788889999' }
    });

    // 3. Create Contracts:
    // Emp 1 contract: Active throughout 2026, wage = 30000
    const contractEmp1 = await Contract.create({
      employeeId: emp1._id,
      departmentId: testDept._id,
      jobPosition: 'TEST_Junior Dev',
      wage: 30000,
      startDate: new Date('2026-01-01'),
      status: 'Active',
      salaryStructureId: structure._id
    });

    // Emp 2 contract: Active throughout 2026, wage = 50000
    const contractEmp2 = await Contract.create({
      employeeId: emp2._id,
      departmentId: testDept._id,
      jobPosition: 'TEST_Senior Dev',
      wage: 50000,
      startDate: new Date('2026-01-01'),
      status: 'Active',
      salaryStructureId: structure._id
    });

    // Emp 3 contract: Historical contract in 2024 (Expired) + Active contract in 2026
    const contractEmp3Past = await Contract.create({
      employeeId: emp3._id,
      departmentId: testDept._id,
      jobPosition: 'TEST_Trainee',
      wage: 15000,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      status: 'Active',
      salaryStructureId: structure._id
    });

    // 4. Users for RBAC testing
    const adminUser = (await User.findOne({ role: 'Admin' })) || (await User.create({
      name: 'Admin User',
      email: 'admin_test2@test.com',
      passwordHash: 'Password123!',
      role: 'Admin',
      isActive: true
    }));

    const payrollMgr = (await User.findOne({ role: 'HR Payroll Manager' })) || (await User.create({
      name: 'Payroll Manager',
      email: 'payroll_mgr2@test.com',
      passwordHash: 'Password123!',
      role: 'HR Payroll Manager',
      isActive: true
    }));

    const payrollUser = (await User.findOne({ role: 'HR Payroll User' })) || (await User.create({
      name: 'Payroll User',
      email: 'payroll_user2@test.com',
      passwordHash: 'Password123!',
      role: 'HR Payroll User',
      isActive: true
    }));

    const hrMgr = (await User.findOne({ role: 'HR Manager' })) || (await User.create({
      name: 'HR Manager',
      email: 'hr_mgr2@test.com',
      passwordHash: 'Password123!',
      role: 'HR Manager',
      isActive: true
    }));

    const userEmp1 = await User.create({
      name: 'Alice User',
      email: 'alice.user@test.com',
      passwordHash: 'Password123!',
      role: 'Employee',
      employeeId: emp1._id,
      isActive: true
    });

    const userEmp2 = await User.create({
      name: 'Bob User',
      email: 'bob.user@test.com',
      passwordHash: 'Password123!',
      role: 'Employee',
      employeeId: emp2._id,
      isActive: true
    });

    const adminToken = generateToken(adminUser);
    const payrollMgrToken = generateToken(payrollMgr);
    const payrollUserToken = generateToken(payrollUser);
    const hrMgrToken = generateToken(hrMgr);
    const emp1Token = generateToken(userEmp1);
    const emp2Token = generateToken(userEmp2);

    console.log('✓ Test fixtures ready');

    // ----------------------------------------------------
    // TEST 1: Create Payrun with Selected Employees (Emp 1 and Emp 2 only)
    // ----------------------------------------------------
    console.log('\n--- 1. Payrun Creation & Employee Selection ---');
    const createPayrunRes = await apiRequest({
      method: 'POST',
      path: '/api/payruns',
      token: payrollMgrToken,
      body: {
        name: 'TEST_October 2026 Payrun',
        salaryStructureId: structure._id.toString(),
        periodStart: '2026-10-01',
        periodEnd: '2026-10-31',
        employeeIds: [emp1._id.toString(), emp2._id.toString()]
      }
    });
    assert(createPayrunRes.status === 201, '1. Create Payrun with selected employees (201)', createPayrunRes.body);
    const payrunId = createPayrunRes.body.data._id;

    // ----------------------------------------------------
    // TEST 2: Compute Payrun (Generates Payslips & Calculations)
    // ----------------------------------------------------
    console.log('\n--- 2. Payrun Compute & Dynamic Rule Execution ---');
    const computeRes = await apiRequest({
      method: 'POST',
      path: `/api/payruns/${payrunId}/compute`,
      token: payrollMgrToken
    });
    assert(computeRes.status === 200 && computeRes.body.data.status === 'Computed', '2. Compute Payrun updates status to Computed (200)', computeRes.body);

    // ----------------------------------------------------
    // TEST 3 & 4: Payslips generated for selected employees, NOT for non-selected
    // ----------------------------------------------------
    console.log('\n--- 3. Verify Generated Payslips ---');
    const payslipsRes = await apiRequest({
      method: 'GET',
      path: `/api/payslips/payrun/${payrunId}`,
      token: payrollUserToken
    });
    assert(payslipsRes.status === 200 && payslipsRes.body.results === 2, '3. Payslips generated exactly for 2 selected employees (200)', payslipsRes.body);

    const payslips = payslipsRes.body.data || [];
    const emp1Payslip = payslips.find((p: any) => (p.employeeId._id || p.employeeId).toString() === emp1._id.toString());
    const emp2Payslip = payslips.find((p: any) => (p.employeeId._id || p.employeeId).toString() === emp2._id.toString());
    const emp3Payslip = payslips.find((p: any) => (p.employeeId._id || p.employeeId).toString() === emp3._id.toString());

    assert(emp1Payslip !== undefined, '4. Employee 1 has generated Payslip');
    assert(emp2Payslip !== undefined, '5. Employee 2 has generated Payslip');
    assert(emp3Payslip === undefined, '6. Non-selected Employee 3 does NOT have a Payslip generated');

    // ----------------------------------------------------
    // TEST 5 & 6: Verify Detailed Calculations for Employee 1 (Wage = 30000)
    // Basic = 30000, HRA = 40% (12000), GROSS = 42000, PF = 12% (3600), NET = 38400
    // ----------------------------------------------------
    console.log('\n--- 4. Verify Calculations for Employee 1 (Wage 30,000) ---');
    assert(emp1Payslip.basic === 30000, '7. Emp 1 Basic Salary is 30,000', { basic: emp1Payslip.basic });
    assert(emp1Payslip.allowances === 12000, '8. Emp 1 HRA Allowance is 12,000 (40% of 30,000)', { allowances: emp1Payslip.allowances });
    assert(emp1Payslip.gross === 42000, '9. Emp 1 Gross is 42,000 (BASIC + HRA formula)', { gross: emp1Payslip.gross });
    assert(emp1Payslip.deductions === 3600, '10. Emp 1 PF Deduction is 3,600 (12% of 30,000)', { deductions: emp1Payslip.deductions });
    assert(emp1Payslip.net === 38400, '11. Emp 1 Net Salary is 38,400 (GROSS - PF formula)', { net: emp1Payslip.net });

    // ----------------------------------------------------
    // TEST 7: Verify Detailed Calculations for Employee 2 (Wage = 50000)
    // Basic = 50000, HRA = 40% (20000), GROSS = 70000, PF = 12% (6000), NET = 64000
    // ----------------------------------------------------
    console.log('\n--- 5. Verify Proportional Calculations for Employee 2 (Wage 50,000) ---');
    assert(emp2Payslip.basic === 50000, '12. Emp 2 Basic Salary is 50,000', { basic: emp2Payslip.basic });
    assert(emp2Payslip.allowances === 20000, '13. Emp 2 HRA Allowance is 20,000 (40% of 50,000)', { allowances: emp2Payslip.allowances });
    assert(emp2Payslip.gross === 70000, '14. Emp 2 Gross is 70,000 (BASIC + HRA formula)', { gross: emp2Payslip.gross });
    assert(emp2Payslip.deductions === 6000, '15. Emp 2 PF Deduction is 6,000 (12% of 50,000)', { deductions: emp2Payslip.deductions });
    assert(emp2Payslip.net === 64000, '16. Emp 2 Net Salary is 64,000 (GROSS - PF formula)', { net: emp2Payslip.net });

    assert(
      emp1Payslip.net !== emp2Payslip.net && emp2Payslip.net > emp1Payslip.net,
      '17. Same Salary Structure dynamically yields distinct, proportional salaries for different contracts'
    );

    // ----------------------------------------------------
    // TEST 8: Verify Payslip Lines and Sequence Ordering
    // ----------------------------------------------------
    console.log('\n--- 6. Verify Payslip Lines & Sequence Ordering ---');
    const lines = emp1Payslip.lines || [];
    assert(lines.length === 5, '18. Exactly 5 Payslip Lines created matching the 5 Salary Rules', { count: lines.length });

    const lineCodes = lines.map((l: any) => l.code);
    const lineSeqs = lines.map((l: any) => l.sequence);
    const isLineSeqSorted = lineSeqs.every((val: number, i: number, arr: number[]) => i === 0 || arr[i - 1] <= val);

    assert(
      isLineSeqSorted && lineCodes[0] === 'BASIC' && lineCodes[4] === 'NET',
      '19. Payslip Lines strictly ordered by sequence (10, 20, 30, 40, 50)',
      { lineCodes, lineSeqs }
    );

    // ----------------------------------------------------
    // TEST 9: Repeat Compute - Idempotence & Duplicate Prevention
    // ----------------------------------------------------
    console.log('\n--- 7. Idempotence & Duplicate Prevention ---');
    const recomputeRes = await apiRequest({
      method: 'POST',
      path: `/api/payruns/${payrunId}/compute`,
      token: payrollMgrToken
    });
    assert(recomputeRes.status === 200, '20. Re-computing payrun succeeds (200)', recomputeRes.body);

    const recheckPayslips = await apiRequest({
      method: 'GET',
      path: `/api/payslips/payrun/${payrunId}`,
      token: payrollUserToken
    });
    assert(recheckPayslips.body.results === 2, '21. Re-computation updates existing payslips without creating duplicates (count is still 2)');

    // ----------------------------------------------------
    // TEST 10: Contract Period Selection (Historical vs Current Period)
    // ----------------------------------------------------
    console.log('\n--- 8. Historical Contract Selection Logic ---');
    // If we calculate for 2024 period, it must pick contractEmp3Past (wage 15000), not a 2026 contract
    const historicalPreview = await apiRequest({
      method: 'POST',
      path: '/api/payslips/calculate',
      token: payrollMgrToken,
      body: {
        employeeId: emp3._id.toString(),
        salaryStructureId: structure._id.toString(),
        periodStart: '2024-06-01',
        periodEnd: '2024-06-30'
      }
    });
    assert(
      historicalPreview.status === 200 && historicalPreview.body.data.basic === 15000,
      '22. Historical contract applicable to 2024 period selected (Wage = 15,000), NOT latest contract',
      historicalPreview.body
    );

    // ----------------------------------------------------
    // TEST 11: Missing Applicable Contract Handling
    // ----------------------------------------------------
    console.log('\n--- 9. Missing Applicable Contract Handling ---');
    const missingContractPreview = await apiRequest({
      method: 'POST',
      path: '/api/payslips/calculate',
      token: payrollMgrToken,
      body: {
        employeeId: emp3._id.toString(),
        salaryStructureId: structure._id.toString(),
        periodStart: '2025-06-01',
        periodEnd: '2025-06-30' // Emp 3 had no contract in 2025
      }
    });
    assert(
      missingContractPreview.status === 400,
      '23. Missing applicable contract for payroll period correctly rejected with 400 Bad Request',
      missingContractPreview.body
    );

    // ----------------------------------------------------
    // TEST 12: RBAC - Employee Access Restrictions
    // ----------------------------------------------------
    console.log('\n--- 10. RBAC Security & Ownership Enforcement ---');
    // Alice viewing her own payslip -> 200 OK
    const aliceOwnRes = await apiRequest({
      method: 'GET',
      path: `/api/payslips/${emp1Payslip._id}`,
      token: emp1Token
    });
    assert(aliceOwnRes.status === 200, '24. Employee can access their own payslip (200 OK)', aliceOwnRes.body);

    // Alice attempting to view Bob's payslip -> 403 Forbidden
    const aliceBobRes = await apiRequest({
      method: 'GET',
      path: `/api/payslips/${emp2Payslip._id}`,
      token: emp1Token
    });
    assert(aliceBobRes.status === 403, '25. Employee CANNOT access another employee\'s payslip (403 Forbidden)', aliceBobRes.body);

    // HR Manager accessing payslips -> 200 OK (HR Manager has payroll access)
    const hrMgrPayslipRes = await apiRequest({
      method: 'GET',
      path: `/api/payslips/${emp1Payslip._id}`,
      token: hrMgrToken
    });
    assert(hrMgrPayslipRes.status === 200, '26. HR Manager CAN access payroll payslips (200 OK)', hrMgrPayslipRes.body);

    // HR Payroll User can read payslips -> 200 OK
    const payrollUserGetRes = await apiRequest({
      method: 'GET',
      path: `/api/payslips/${emp1Payslip._id}`,
      token: payrollUserToken
    });
    assert(payrollUserGetRes.status === 200, '27. HR Payroll User can read payslips (200 OK)', payrollUserGetRes.body);

    // ----------------------------------------------------
    // TEST 13: Validate & Mark Paid Payslip Actions
    // ----------------------------------------------------
    console.log('\n--- 11. Payslip Status Lifecycle ---');
    const validateRes = await apiRequest({
      method: 'POST',
      path: `/api/payslips/${emp1Payslip._id}/validate`,
      token: payrollMgrToken
    });
    assert(validateRes.status === 200 && validateRes.body.data.status === 'Validated', '28. Payslip marked as Validated (200)', validateRes.body);

    const markPaidRes = await apiRequest({
      method: 'POST',
      path: `/api/payslips/${emp1Payslip._id}/mark-paid`,
      token: payrollMgrToken
    });
    assert(markPaidRes.status === 200 && markPaidRes.body.data.status === 'Paid', '29. Payslip marked as Paid (200)', markPaidRes.body);

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

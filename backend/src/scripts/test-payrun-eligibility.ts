import mongoose from 'mongoose';
import dotenv from 'dotenv';
import http from 'http';
import app from '../app';
import jwt from 'jsonwebtoken';
import { SalaryStructure } from '../modules/salary/structure/structure.model';
import { SalaryRule } from '../modules/salary/rule/rule.model';
import { Employee } from '../modules/employees/employee.model';
import { Department } from '../modules/departments/department.model';
import { Contract } from '../modules/contracts/contract.model';
import { Payrun } from '../modules/payrun/payrun.model';
import { Payslip } from '../modules/payslip/payslip.model';

dotenv.config();

const PORT = 5025;
const JWT_SECRET = process.env.JWT_SECRET || 'peoplepay360_super_secret_jwt_key_2026';

function createToken(role: string, id: string = '507f1f77bcf86cd799439011') {
  return jwt.sign({ userId: id, role }, JWT_SECRET, { expiresIn: '1h' });
}

const payrollManagerToken = createToken('HR Payroll Manager');

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
  console.log('🧪 TESTING SALARY STRUCTURE & PERIOD EMPLOYEE ELIGIBILITY 🧪');
  console.log('================================================================\n');

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
      console.error(`  ❌ FAIL: ${testName}`, detail !== undefined ? JSON.stringify(detail) : '');
      failed++;
    }
  }

  try {
    const timestamp = Date.now();
    const dept = (await Department.findOne()) || (await Department.create({ name: 'Engineering' }));

    // 1. Create Structure A & Structure B
    const structA = await SalaryStructure.create({
      name: `Structure A ${timestamp}`,
      code: `STRUCT_A_${timestamp}`,
      isActive: true
    });

    await SalaryRule.create({
      salaryStructureId: structA._id,
      name: 'Basic Salary',
      code: 'BASIC',
      category: 'Basic',
      sequence: 10,
      computationMethod: 'Fixed',
      amount: 0,
      isActive: true
    });

    await SalaryRule.create({
      salaryStructureId: structA._id,
      name: 'Gross Salary',
      code: 'GROSS',
      category: 'Gross',
      sequence: 20,
      computationMethod: 'Formula',
      formulaExpression: 'BASIC',
      isActive: true
    });

    await SalaryRule.create({
      salaryStructureId: structA._id,
      name: 'Net Salary',
      code: 'NET',
      category: 'Net',
      sequence: 30,
      computationMethod: 'Formula',
      formulaExpression: 'GROSS',
      isActive: true
    });

    const structB = await SalaryStructure.create({
      name: `Structure B ${timestamp}`,
      code: `STRUCT_B_${timestamp}`,
      isActive: true
    });

    await SalaryRule.create({
      salaryStructureId: structB._id,
      name: 'Basic Salary',
      code: 'BASIC',
      category: 'Basic',
      sequence: 10,
      computationMethod: 'Fixed',
      amount: 0,
      isActive: true
    });

    await SalaryRule.create({
      salaryStructureId: structB._id,
      name: 'Gross Salary',
      code: 'GROSS',
      category: 'Gross',
      sequence: 20,
      computationMethod: 'Formula',
      formulaExpression: 'BASIC',
      isActive: true
    });

    await SalaryRule.create({
      salaryStructureId: structB._id,
      name: 'Net Salary',
      code: 'NET',
      category: 'Net',
      sequence: 30,
      computationMethod: 'Formula',
      formulaExpression: 'GROSS',
      isActive: true
    });

    // 2. Setup Employee A (Historical contracts: Contract 1 Jan-Jun Structure A ₹30k, Contract 2 Jul-Dec Structure B ₹40k)
    const empA = await Employee.create({
      employeeCode: `EMP_ELIG_A_${timestamp}`,
      firstName: 'EmpA',
      lastName: 'Historical',
      email: `empA_${timestamp}@test.com`,
      departmentId: dept._id,
      jobPosition: 'Developer',
      employeeType: 'Full-Time',
      status: 'Active',
      bankDetails: { accountNumber: '1234567890' }
    });

    const contract1A = await Contract.create({
      employeeId: empA._id,
      departmentId: dept._id,
      jobPosition: 'Developer',
      wage: 30000,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-06-30'),
      salaryStructureId: structA._id,
      status: 'Active'
    });

    const contract2A = await Contract.create({
      employeeId: empA._id,
      departmentId: dept._id,
      jobPosition: 'Developer',
      wage: 40000,
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-12-31'),
      salaryStructureId: structB._id,
      status: 'Active'
    });

    console.log('\n--- Section 1: Historical Contract Tests (Tests 1-4) ---');

    // TEST 1: Structure A, Period March 2026
    const test1Res = await apiRequest({
      method: 'POST',
      path: '/api/payruns/eligible-employees',
      token: payrollManagerToken,
      body: {
        salaryStructureId: structA._id.toString(),
        periodStart: '2026-03-01',
        periodEnd: '2026-03-31'
      }
    });
    const test1Eligible = (test1Res.body?.data?.eligibleEmployees || []).find((e: any) => e._id === empA._id.toString());
    assert(
      test1Res.status === 200 && test1Eligible !== undefined && test1Eligible.contract?.wage === 30000,
      'TEST 1: Employee A is eligible for Structure A in March 2026 with Contract 1 (Wage 30000)',
      test1Eligible
    );

    // Create payrun & compute for Test 1
    const payrun1 = await apiRequest({
      method: 'POST',
      path: '/api/payruns',
      token: payrollManagerToken,
      body: {
        name: `Payrun March Struct A ${timestamp}`,
        salaryStructureId: structA._id.toString(),
        periodStart: '2026-03-01',
        periodEnd: '2026-03-31',
        employeeIds: [empA._id.toString()]
      }
    });
    assert(payrun1.status === 201, 'Payrun for Structure A in March created successfully');

    const compute1 = await apiRequest({
      method: 'POST',
      path: `/api/payruns/${payrun1.body.data._id}/compute`,
      token: payrollManagerToken
    });
    const payslip1 = await Payslip.findOne({ payrunId: payrun1.body.data._id, employeeId: empA._id });
    assert(
      compute1.status === 200 && payslip1 !== null && payslip1.net === 30000,
      'Compute calculates payslip for March using Contract 1 (Wage 30000)',
      payslip1
    );

    // TEST 2: Structure B, Period September 2026
    const test2Res = await apiRequest({
      method: 'POST',
      path: '/api/payruns/eligible-employees',
      token: payrollManagerToken,
      body: {
        salaryStructureId: structB._id.toString(),
        periodStart: '2026-09-01',
        periodEnd: '2026-09-30'
      }
    });
    const test2Eligible = (test2Res.body?.data?.eligibleEmployees || []).find((e: any) => e._id === empA._id.toString());
    assert(
      test2Res.status === 200 && test2Eligible !== undefined && test2Eligible.contract?.wage === 40000,
      'TEST 2: Employee A is eligible for Structure B in Sept 2026 with Contract 2 (Wage 40000)',
      test2Eligible
    );

    const payrun2 = await apiRequest({
      method: 'POST',
      path: '/api/payruns',
      token: payrollManagerToken,
      body: {
        name: `Payrun Sept Struct B ${timestamp}`,
        salaryStructureId: structB._id.toString(),
        periodStart: '2026-09-01',
        periodEnd: '2026-09-30',
        employeeIds: [empA._id.toString()]
      }
    });
    assert(payrun2.status === 201, 'Payrun for Structure B in Sept created successfully');

    const compute2 = await apiRequest({
      method: 'POST',
      path: `/api/payruns/${payrun2.body.data._id}/compute`,
      token: payrollManagerToken
    });
    const payslip2 = await Payslip.findOne({ payrunId: payrun2.body.data._id, employeeId: empA._id });
    assert(
      compute2.status === 200 && payslip2 !== null && payslip2.net === 40000,
      'Compute calculates payslip for Sept using Contract 2 (Wage 40000)',
      payslip2
    );

    // TEST 3: Structure A, Period September 2026 -> Employee A must NOT appear
    const test3Res = await apiRequest({
      method: 'POST',
      path: '/api/payruns/eligible-employees',
      token: payrollManagerToken,
      body: {
        salaryStructureId: structA._id.toString(),
        periodStart: '2026-09-01',
        periodEnd: '2026-09-30'
      }
    });
    const test3Eligible = (test3Res.body?.data?.eligibleEmployees || []).find((e: any) => e._id === empA._id.toString());
    const test3Ineligible = (test3Res.body?.data?.ineligibleEmployees || []).find((e: any) => e._id === empA._id.toString());
    assert(
      test3Eligible === undefined && test3Ineligible !== undefined,
      'TEST 3: Employee A does NOT appear as eligible for Structure A in September 2026 (placed in ineligible)',
      { test3Eligible, test3Ineligible }
    );

    // Backend creation rejection for Test 3
    const test3PayrunAttempt = await apiRequest({
      method: 'POST',
      path: '/api/payruns',
      token: payrollManagerToken,
      body: {
        name: `Invalid Sept Struct A ${timestamp}`,
        salaryStructureId: structA._id.toString(),
        periodStart: '2026-09-01',
        periodEnd: '2026-09-30',
        employeeIds: [empA._id.toString()]
      }
    });
    assert(
      test3PayrunAttempt.status === 400 &&
        test3PayrunAttempt.body?.message?.includes('is not eligible for the selected salary structure and payroll period'),
      'Backend rejects Payrun creation with Employee A under Structure A for September (400)',
      test3PayrunAttempt.body
    );

    // TEST 4: Structure B, Period March 2026 -> Employee A must NOT appear
    const test4Res = await apiRequest({
      method: 'POST',
      path: '/api/payruns/eligible-employees',
      token: payrollManagerToken,
      body: {
        salaryStructureId: structB._id.toString(),
        periodStart: '2026-03-01',
        periodEnd: '2026-03-31'
      }
    });
    const test4Eligible = (test4Res.body?.data?.eligibleEmployees || []).find((e: any) => e._id === empA._id.toString());
    const test4Ineligible = (test4Res.body?.data?.ineligibleEmployees || []).find((e: any) => e._id === empA._id.toString());
    assert(
      test4Eligible === undefined && test4Ineligible !== undefined,
      'TEST 4: Employee A does NOT appear as eligible for Structure B in March 2026 (placed in ineligible)',
      { test4Eligible, test4Ineligible }
    );

    // Backend creation rejection for Test 4
    const test4PayrunAttempt = await apiRequest({
      method: 'POST',
      path: '/api/payruns',
      token: payrollManagerToken,
      body: {
        name: `Invalid March Struct B ${timestamp}`,
        salaryStructureId: structB._id.toString(),
        periodStart: '2026-03-01',
        periodEnd: '2026-03-31',
        employeeIds: [empA._id.toString()]
      }
    });
    assert(
      test4PayrunAttempt.status === 400 &&
        test4PayrunAttempt.body?.message?.includes('is not eligible for the selected salary structure and payroll period'),
      'Backend rejects Payrun creation with Employee A under Structure B for March (400)',
      test4PayrunAttempt.body
    );

    console.log('\n--- Section 2: Multiple Employee Eligibility Test (Section 17) ---');

    // Create Employee B -> Structure A
    const empB = await Employee.create({
      employeeCode: `EMP_ELIG_B_${timestamp}`,
      firstName: 'EmpB',
      lastName: 'StructA',
      email: `empB_${timestamp}@test.com`,
      departmentId: dept._id,
      jobPosition: 'QA Engineer',
      employeeType: 'Full-Time',
      status: 'Active',
      bankDetails: { accountNumber: '2222222222' }
    });

    await Contract.create({
      employeeId: empB._id,
      departmentId: dept._id,
      jobPosition: 'QA Engineer',
      wage: 35000,
      startDate: new Date('2026-01-01'),
      salaryStructureId: structA._id,
      status: 'Active'
    });

    // Create Employee C -> Structure B
    const empC = await Employee.create({
      employeeCode: `EMP_ELIG_C_${timestamp}`,
      firstName: 'EmpC',
      lastName: 'StructB',
      email: `empC_${timestamp}@test.com`,
      departmentId: dept._id,
      jobPosition: 'DevOps',
      employeeType: 'Full-Time',
      status: 'Active',
      bankDetails: { accountNumber: '3333333333' }
    });

    await Contract.create({
      employeeId: empC._id,
      departmentId: dept._id,
      jobPosition: 'DevOps',
      wage: 45000,
      startDate: new Date('2026-01-01'),
      salaryStructureId: structB._id,
      status: 'Active'
    });

    // Create Employee D -> Structure B
    const empD = await Employee.create({
      employeeCode: `EMP_ELIG_D_${timestamp}`,
      firstName: 'EmpD',
      lastName: 'StructB',
      email: `empD_${timestamp}@test.com`,
      departmentId: dept._id,
      jobPosition: 'Designer',
      employeeType: 'Full-Time',
      status: 'Active',
      bankDetails: { accountNumber: '4444444444' }
    });

    await Contract.create({
      employeeId: empD._id,
      departmentId: dept._id,
      jobPosition: 'Designer',
      wage: 42000,
      startDate: new Date('2026-01-01'),
      salaryStructureId: structB._id,
      status: 'Active'
    });

    // Fetch eligibility for Structure A in March 2026
    const multiResA = await apiRequest({
      method: 'POST',
      path: '/api/payruns/eligible-employees',
      token: payrollManagerToken,
      body: {
        salaryStructureId: structA._id.toString(),
        periodStart: '2026-03-01',
        periodEnd: '2026-03-31'
      }
    });

    const eligibleIdsA = (multiResA.body?.data?.eligibleEmployees || []).map((e: any) => e._id);
    assert(
      eligibleIdsA.includes(empA._id.toString()) && eligibleIdsA.includes(empB._id.toString()),
      'Employees A and B are included in eligible list for Structure A',
      eligibleIdsA
    );
    assert(
      !eligibleIdsA.includes(empC._id.toString()) && !eligibleIdsA.includes(empD._id.toString()),
      'Employees C and D (Structure B) are EXCLUDED from Structure A eligible list',
      eligibleIdsA
    );

    // Fetch eligibility for Structure B in March 2026
    const multiResB = await apiRequest({
      method: 'POST',
      path: '/api/payruns/eligible-employees',
      token: payrollManagerToken,
      body: {
        salaryStructureId: structB._id.toString(),
        periodStart: '2026-03-01',
        periodEnd: '2026-03-31'
      }
    });

    const eligibleIdsB = (multiResB.body?.data?.eligibleEmployees || []).map((e: any) => e._id);
    assert(
      eligibleIdsB.includes(empC._id.toString()) && eligibleIdsB.includes(empD._id.toString()),
      'Employees C and D are included in eligible list for Structure B',
      eligibleIdsB
    );
    assert(
      !eligibleIdsB.includes(empA._id.toString()) && !eligibleIdsB.includes(empB._id.toString()),
      'Employees A and B (Structure A in March) are EXCLUDED from Structure B eligible list',
      eligibleIdsB
    );

    console.log('\n--- Section 3: Expired Contract & No Contract Tests (Sections 18-20) ---');

    // Create Employee with Expired Contract (ended June 30, 2026)
    const empExpired = await Employee.create({
      employeeCode: `EMP_EXPIRED_${timestamp}`,
      firstName: 'EmpExpired',
      lastName: 'Contract',
      email: `expired_${timestamp}@test.com`,
      departmentId: dept._id,
      jobPosition: 'Intern',
      employeeType: 'Intern',
      status: 'Active',
      bankDetails: { accountNumber: '5555555555' }
    });

    await Contract.create({
      employeeId: empExpired._id,
      departmentId: dept._id,
      jobPosition: 'Intern',
      wage: 15000,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-06-30'),
      salaryStructureId: structA._id,
      status: 'Active'
    });

    // Check eligibility for September 2026 (contract is expired)
    const expiredCheck = await apiRequest({
      method: 'POST',
      path: '/api/payruns/eligible-employees',
      token: payrollManagerToken,
      body: {
        salaryStructureId: structA._id.toString(),
        periodStart: '2026-09-01',
        periodEnd: '2026-09-30'
      }
    });

    const expiredInEligible = (expiredCheck.body?.data?.eligibleEmployees || []).find(
      (e: any) => e._id === empExpired._id.toString()
    );
    const expiredInIneligible = (expiredCheck.body?.data?.ineligibleEmployees || []).find(
      (e: any) => e._id === empExpired._id.toString()
    );
    assert(
      expiredInEligible === undefined && expiredInIneligible !== undefined,
      'Active employee with expired contract is EXCLUDED from eligible list in September',
      { expiredInEligible, expiredInIneligible }
    );

    // Attempting to create Payrun with expired contract employee is rejected
    const expiredCreateAttempt = await apiRequest({
      method: 'POST',
      path: '/api/payruns',
      token: payrollManagerToken,
      body: {
        name: `Expired Contract Payrun ${timestamp}`,
        salaryStructureId: structA._id.toString(),
        periodStart: '2026-09-01',
        periodEnd: '2026-09-30',
        employeeIds: [empExpired._id.toString()]
      }
    });
    assert(
      expiredCreateAttempt.status === 400,
      'Backend rejects Payrun creation for employee with expired contract (400)',
      expiredCreateAttempt.body
    );
    const bypassPayrun = await Payrun.create({
      name: `Bypass Payrun ${timestamp}`,
      salaryStructureId: structA._id,
      periodStart: new Date('2026-09-01'),
      periodEnd: new Date('2026-09-30'),
      employeeIds: [empC._id], // empC has Structure B contract!
      status: 'Draft'
    });

    const computeMismatched = await apiRequest({
      method: 'POST',
      path: `/api/payruns/${bypassPayrun._id}/compute`,
      token: payrollManagerToken
    });
    assert(
      computeMismatched.status === 400 &&
        computeMismatched.body?.message?.includes('is not eligible for the selected salary structure and payroll period'),
      'Compute revalidates contract and strictly blocks payslip calculation for mismatched structure (400)',
      computeMismatched.body
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

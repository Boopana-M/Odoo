import jwt from 'jsonwebtoken';
import http from 'http';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import app from '../app';
import { connectDB } from '../config/db';
import { SalaryStructure } from '../modules/salary/structure/structure.model';
import { SalaryRule } from '../modules/salary/rule/rule.model';
import { Employee } from '../modules/employees/employee.model';
import { Department } from '../modules/departments/department.model';
import { Contract } from '../modules/contracts/contract.model';
import { Payrun } from '../modules/payrun/payrun.model';
import { Payslip } from '../modules/payslip/payslip.model';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'peoplepay360_super_secret_jwt_key_2026';
const TEST_PORT = 5097;

function createToken(role: string, id: string = '507f1f77bcf86cd799439011', employeeId?: string) {
  return jwt.sign({ userId: id, role, ...(employeeId ? { employeeId } : {}) }, JWT_SECRET, { expiresIn: '1h' });
}

async function request(options: {
  method: string;
  path: string;
  token?: string;
  body?: any;
}): Promise<{ status: number; body: any; rawBuffer?: Buffer }> {
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
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        res.on('end', () => {
          const rawBuffer = Buffer.concat(chunks);
          let parsed: any;
          try {
            parsed = JSON.parse(rawBuffer.toString('utf-8'));
          } catch {
            parsed = rawBuffer.toString('utf-8');
          }
          resolve({ status: res.statusCode || 500, body: parsed, rawBuffer });
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

  console.log('=== RUNNING PHASE 7A TESTS ===\n');
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
    const timestamp = Date.now();
    const adminToken = createToken('Admin');
    const payrollUserToken = createToken('HR Payroll User');
    const hrManagerToken = createToken('HR Manager');

    // 1. Setup Department, Salary Structure & Rules
    const dept = await new Department({ name: `Phase7A Dept ${timestamp}` }).save();

    const structure = await new SalaryStructure({
      name: `Phase7A Executive Structure ${timestamp}`,
      code: `P7A_EXEC_${timestamp}`,
      isActive: true
    }).save();

    await new SalaryRule({
      salaryStructureId: structure._id,
      name: 'Basic Salary',
      code: 'BASIC',
      category: 'Basic',
      sequence: 10,
      computationMethod: 'Formula',
      formulaExpression: 'contract.wage',
      isActive: true
    }).save();

    // Setup Employee 1 (with valid active contract)
    const emp1 = await new Employee({
      employeeCode: `EMP_P7A_1_${timestamp}`,
      firstName: 'Diana',
      lastName: 'Prince',
      email: `diana_${timestamp}@test.com`,
      departmentId: dept._id,
      jobPosition: 'Manager',
      status: 'Active',
      bankDetails: { bankName: 'Bank A', accountNumber: '111222333' }
    }).save();

    const emp1Token = createToken('Employee', '507f1f77bcf86cd799439099', emp1._id.toString());

    await new Contract({
      employeeId: emp1._id,
      departmentId: dept._id,
      jobPosition: 'Manager',
      wage: 9000,
      startDate: new Date('2026-01-01'),
      salaryStructureId: structure._id,
      status: 'Active'
    }).save();

    // Setup Employee 2 (without contract for blocking error test)
    const emp2 = await new Employee({
      employeeCode: `EMP_P7A_2_${timestamp}`,
      firstName: 'Evan',
      lastName: 'Wright',
      email: `evan_${timestamp}@test.com`,
      departmentId: dept._id,
      jobPosition: 'Specialist',
      status: 'Active'
    }).save();

    const emp2Token = createToken('Employee', '507f1f77bcf86cd799439088', emp2._id.toString());

    const periodStart = '2026-08-01';
    const periodEnd = '2026-08-31';

    // 1. Create Payrun 1 (Valid)
    const resCreate1 = await request({
      method: 'POST',
      path: '/api/payruns',
      token: payrollUserToken,
      body: {
        name: `August Valid Payroll ${timestamp}`,
        salaryStructureId: structure._id.toString(),
        periodStart,
        periodEnd,
        employeeIds: [emp1._id.toString()]
      }
    });
    assert(resCreate1.status === 201, 'Setup: Created Payrun 1', JSON.stringify(resCreate1.body));
    const payrun1Id = resCreate1.body?.data?._id;

    // Test 1: Mark Paid before Validate (Should fail with 400)
    const resMarkPaidBeforeVal = await request({
      method: 'POST',
      path: `/api/payruns/${payrun1Id}/mark-paid`,
      token: payrollUserToken
    });
    assert(resMarkPaidBeforeVal.status === 400, '3. Mark Paid before Validate fails with 400 Bad Request', JSON.stringify(resMarkPaidBeforeVal.body));

    // Test 2: Validate Draft Payrun without computation (Should fail with 400)
    const resValDraft = await request({
      method: 'POST',
      path: `/api/payruns/${payrun1Id}/validate`,
      token: payrollUserToken
    });
    assert(resValDraft.status === 400, '2a. Validate uncomputed Draft Payrun fails with 400', JSON.stringify(resValDraft.body));

    // Compute Payrun 1
    const resCompute1 = await request({
      method: 'POST',
      path: `/api/payruns/${payrun1Id}/compute`,
      token: payrollUserToken
    });
    assert(resCompute1.status === 200 && resCompute1.body?.data?.status === 'Computed', 'Setup: Computed Payrun 1', JSON.stringify(resCompute1.body));

    // Test 3: Validate valid Payrun (Should succeed, status becomes Validated)
    const resVal1 = await request({
      method: 'POST',
      path: `/api/payruns/${payrun1Id}/validate`,
      token: payrollUserToken
    });
    assert(
      resVal1.status === 200 && resVal1.body?.data?.status === 'Validated',
      '1. Validate valid Payrun succeeds (status Validated)',
      JSON.stringify(resVal1.body)
    );

    // Verify associated payslip status is updated to Validated
    const payslip1Doc = await Payslip.findOne({ payrunId: payrun1Id, employeeId: emp1._id });
    assert(payslip1Doc !== null && payslip1Doc.status === 'Validated', '1b. Associated payslip status updated to Validated', `Payslip status: ${payslip1Doc?.status}`);

    // Test 4: Mark Paid after Validate (Should succeed, status becomes Paid)
    const resPaid1 = await request({
      method: 'POST',
      path: `/api/payruns/${payrun1Id}/mark-paid`,
      token: payrollUserToken
    });
    assert(
      resPaid1.status === 200 && resPaid1.body?.data?.status === 'Paid',
      '4. Mark Paid after Validate succeeds (status Paid)',
      JSON.stringify(resPaid1.body)
    );

    // Verify associated payslip status is updated to Paid
    const payslip1PaidDoc = await Payslip.findOne({ payrunId: payrun1Id, employeeId: emp1._id });
    assert(payslip1PaidDoc !== null && payslip1PaidDoc.status === 'Paid', '4b. Associated payslip status updated to Paid', `Payslip status: ${payslip1PaidDoc?.status}`);

    // Test 5: Invalid status transition (Attempting to recompute or validate a Paid Payrun fails with 400)
    const resRecomputePaid = await request({
      method: 'POST',
      path: `/api/payruns/${payrun1Id}/compute`,
      token: payrollUserToken
    });
    assert(resRecomputePaid.status === 400, '5. Recomputing a Paid Payrun fails with 400 Bad Request', JSON.stringify(resRecomputePaid.body));

    // Test 6: Validate Payrun with blocking warning/error (Employee missing contract)
    const resCreate2 = await request({
      method: 'POST',
      path: '/api/payruns',
      token: payrollUserToken,
      body: {
        name: `Invalid Payroll Missing Contract ${timestamp}`,
        salaryStructureId: structure._id.toString(),
        periodStart,
        periodEnd,
        employeeIds: [emp2._id.toString()]
      }
    });
    const payrun2Id = resCreate2.body?.data?._id;

    // Try to validate payrun 2 (should fail because emp2 has no contract)
    const resVal2 = await request({
      method: 'POST',
      path: `/api/payruns/${payrun2Id}/validate`,
      token: payrollUserToken
    });
    assert(resVal2.status === 400, '2b. Validate Payrun with blocking missing contract error fails with 400', JSON.stringify(resVal2.body));

    // Test 7: Generate Payslip PDF
    const payslipId = payslip1PaidDoc!._id.toString();
    const resPdf = await request({
      method: 'GET',
      path: `/api/payslips/${payslipId}/pdf`,
      token: emp1Token
    });

    const isPdfBuffer = Boolean(resPdf.rawBuffer && resPdf.rawBuffer.toString('utf-8').includes('%PDF-1.4'));
    assert(
      resPdf.status === 200 && isPdfBuffer,
      '6. Generate Payslip PDF returns valid %PDF-1.4 document buffer',
      `Status: ${resPdf.status}`
    );

    // Verify pdfReference was saved in database
    const updatedPayslip = await Payslip.findById(payslipId);
    assert(
      Boolean(updatedPayslip?.pdfReference && updatedPayslip?.pdfReference?.includes('.pdf')),
      '6b. Payslip pdfReference updated in database',
      `pdfReference: ${updatedPayslip?.pdfReference}`
    );

    // Test 8: Unauthorized payroll access (HR Manager role attempting to manage Payruns fails with 403)
    const resUnauthorizedPayrun = await request({
      method: 'POST',
      path: `/api/payruns/${payrun1Id}/validate`,
      token: hrManagerToken
    });
    assert(resUnauthorizedPayrun.status === 403, '7. Unauthorized payroll access rejected (403 Forbidden)', JSON.stringify(resUnauthorizedPayrun.body));

    // Test 9: Employee attempting to access another employee's payslip PDF fails with 403 Forbidden
    const resEmp2AccessEmp1Pdf = await request({
      method: 'GET',
      path: `/api/payslips/${payslipId}/pdf`,
      token: emp2Token
    });
    assert(resEmp2AccessEmp1Pdf.status === 403, '8. Employee attempting to access another employee payslip PDF fails (403 Forbidden)', JSON.stringify(resEmp2AccessEmp1Pdf.body));

    console.log(`\nTEST SUMMARY: ${passed} PASSED, ${failed} FAILED.`);
    if (failed > 0) process.exit(1);
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runTests().catch((err) => {
  console.error('Error running Phase 7A test script:', err);
  process.exit(1);
});

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
import { payslipService } from '../modules/payslip/payslip.service';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'peoplepay360_super_secret_jwt_key_2026';
const TEST_PORT = 5096;

function createToken(role: string, id: string = '507f1f77bcf86cd799439011') {
  return jwt.sign({ userId: id, role }, JWT_SECRET, { expiresIn: '1h' });
}

const adminToken = createToken('Admin');

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
          'Content-Length': Buffer.byteLength(data),
          ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
        }
      },
      (res) => {
        let resData = '';
        res.on('data', (chunk) => (resData += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode || 500, body: JSON.parse(resData) });
          } catch {
            resolve({ status: res.statusCode || 500, body: resData });
          }
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runHistoricalContractTests() {
  console.log('\n=============================================================');
  console.log('--- RUNNING HISTORICAL CONTRACT BOUNDARY VALIDATION TESTS ---');
  console.log('=============================================================\n');

  await connectDB();

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(TEST_PORT, () => resolve()));
  console.log(`Test server running on port ${TEST_PORT}\n`);

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition: boolean, testName: string, failureDetails?: any) {
    totalTests++;
    if (condition) {
      console.log(`  PASS: ${testName}`);
      passedTests++;
    } else {
      console.error(`  FAIL: ${testName}`);
      if (failureDetails) {
        console.error('     Details:', failureDetails);
      }
    }
  }

  try {
    // 0. Clean up previous test entities
    const testEmailPrefix = 'hist_test_';
    await Employee.deleteMany({ email: new RegExp(`^${testEmailPrefix}`) });
    await Contract.deleteMany({ jobPosition: 'Historical Test Dev' });
    await Payrun.deleteMany({ name: new RegExp('^HistPayrun') });

    // Setup Department & Structure
    let dept: any = await Department.findOne({ name: 'Engineering' });
    if (!dept) {
      dept = await Department.create({ name: 'Engineering' });
    }

    const oldStructure = await SalaryStructure.findOne({ code: 'REG-HIST-01' });
    if (oldStructure) {
      await SalaryRule.deleteMany({ salaryStructureId: oldStructure._id });
      await SalaryStructure.deleteMany({ code: 'REG-HIST-01' });
    }

    const structure: any = await SalaryStructure.create({
      name: 'Historical Test Structure',
      code: 'REG-HIST-01',
      isActive: true
    });

      // Basic Salary Rule: BASIC = WAGE
      await SalaryRule.create({
        name: 'Basic Salary',
        code: 'BASIC',
        category: 'Basic',
        salaryStructureId: structure._id,
        sequence: 1,
        computationMethod: 'Percentage',
        percentage: 100,
        isActive: true
      });

      // Gross Rule: GROSS = BASIC
      await SalaryRule.create({
        name: 'Gross Salary',
        code: 'GROSS',
        category: 'Gross',
        salaryStructureId: structure._id,
        sequence: 10,
        computationMethod: 'Formula',
        formulaExpression: 'BASIC',
        isActive: true
      });

      // Net Rule: NET = GROSS
      await SalaryRule.create({
        name: 'Net Salary',
        code: 'NET',
        category: 'Net',
        salaryStructureId: structure._id,
        sequence: 100,
        computationMethod: 'Formula',
        formulaExpression: 'GROSS',
        isActive: true
      });

    // =========================================================================
    // SETUP: Employee A with 2 sequential contracts
    // Contract 1: 01-01-2026 to 30-06-2026, wage: 30000
    // Contract 2: 01-07-2026 to 31-12-2026, wage: 40000
    // =========================================================================
    const empA: any = await Employee.create({
      firstName: 'Employee',
      lastName: 'A',
      employeeCode: 'EMP-HIST-A',
      email: `${testEmailPrefix}a@test.com`,
      jobPosition: 'Historical Test Dev',
      departmentId: dept._id,
      bankDetails: { accountNumber: '1234567890', bankName: 'Test Bank' },
      status: 'Active'
    });

    const c1: any = await Contract.create({
      employeeId: empA._id,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-06-30'),
      jobPosition: 'Historical Test Dev',
      departmentId: dept._id,
      salaryStructureId: structure._id,
      wage: 30000,
      status: 'Active'
    });

    const c2: any = await Contract.create({
      employeeId: empA._id,
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-12-31'),
      jobPosition: 'Historical Test Dev',
      departmentId: dept._id,
      salaryStructureId: structure._id,
      wage: 40000,
      status: 'Active'
    });

    console.log('\n--- 1. TEST A: Single Contract 1 Period (March 2026) ---');
    {
      const marchStart = new Date('2026-03-01');
      const marchEnd = new Date('2026-03-31');

      // Direct service test
      const contract = await payslipService.findApplicableContract(empA._id, marchStart, marchEnd);
      assert(contract !== null && contract.wage === 30000, 'findApplicableContract returns Contract 1 (wage 30000) for March 2026');

      // API test
      const res = await request({
        method: 'GET',
        path: `/api/contracts/applicable?employeeId=${empA._id}&periodStart=2026-03-01&periodEnd=2026-03-31`,
        token: adminToken
      });
      assert(res.status === 200 && res.body.data.wage === 30000, 'GET /api/contracts/applicable returns Contract 1 for March 2026');

      // Payslip calculation
      const payslip = await payslipService.calculatePayslip(empA._id, {
        salaryStructureId: structure._id,
        periodStart: marchStart,
        periodEnd: marchEnd
      }, { persist: false });
      assert(payslip.basic === 30000 && payslip.contractId.toString() === c1._id.toString(), 'calculatePayslip correctly computes wage = 30000 with Contract 1 for March 2026');
    }

    console.log('\n--- 2. TEST B: Single Contract 2 Period (September 2026) ---');
    {
      const septStart = new Date('2026-09-01');
      const septEnd = new Date('2026-09-30');

      // Direct service test
      const contract = await payslipService.findApplicableContract(empA._id, septStart, septEnd);
      assert(contract !== null && contract.wage === 40000, 'findApplicableContract returns Contract 2 (wage 40000) for Sept 2026');

      // API test
      const res = await request({
        method: 'GET',
        path: `/api/contracts/applicable?employeeId=${empA._id}&periodStart=2026-09-01&periodEnd=2026-09-30`,
        token: adminToken
      });
      assert(res.status === 200 && res.body.data.wage === 40000, 'GET /api/contracts/applicable returns Contract 2 for Sept 2026');

      // Payslip calculation
      const payslip = await payslipService.calculatePayslip(empA._id, {
        salaryStructureId: structure._id,
        periodStart: septStart,
        periodEnd: septEnd
      }, { persist: false });
      assert(payslip.basic === 40000 && payslip.contractId.toString() === c2._id.toString(), 'calculatePayslip correctly computes wage = 40000 with Contract 2 for Sept 2026');
    }

    console.log('\n--- 3. TEST C: Spanning Two Contracts (June 01 to July 31, 2026) ---');
    {
      const spanStart = new Date('2026-06-01');
      const spanEnd = new Date('2026-07-31');

      // 3.1 findApplicableContract rejection
      let errService: any = null;
      try {
        await payslipService.findApplicableContract(empA._id, spanStart, spanEnd);
      } catch (e: any) {
        errService = e;
      }
      assert(
        errService !== null &&
        errService.statusCode === 400 &&
        errService.code === 'MULTIPLE_CONTRACTS_IN_PAYROLL_PERIOD' &&
        errService.message.includes('Employee Employee A has multiple contracts within the selected payroll period. Create separate Payruns for each contract period.') &&
        errService.contracts?.length === 2,
        'findApplicableContract throws 400 MULTIPLE_CONTRACTS_IN_PAYROLL_PERIOD with contract details',
        errService
      );

      // 3.2 Contract API rejection
      const resContractApi = await request({
        method: 'GET',
        path: `/api/contracts/applicable?employeeId=${empA._id}&periodStart=2026-06-01&periodEnd=2026-07-31`,
        token: adminToken
      });
      assert(
        resContractApi.status === 400 &&
        resContractApi.body.code === 'MULTIPLE_CONTRACTS_IN_PAYROLL_PERIOD' &&
        resContractApi.body.message.includes('multiple contracts within the selected payroll period') &&
        resContractApi.body.contracts?.length === 2,
        'GET /api/contracts/applicable responds 400 MULTIPLE_CONTRACTS_IN_PAYROLL_PERIOD',
        resContractApi.body
      );

      // 3.3 Payrun eligible-employees API check
      const resEligible = await request({
        method: 'GET',
        path: `/api/payruns/eligible-employees?salaryStructureId=${structure._id}&periodStart=2026-06-01&periodEnd=2026-07-31`,
        token: adminToken
      });
      const eligibleList = resEligible.body.data?.eligibleEmployees || [];
      const ineligibleList = resEligible.body.data?.ineligibleEmployees || [];
      const foundInEligible = eligibleList.some((e: any) => e._id.toString() === empA._id.toString());
      const foundInIneligible = ineligibleList.find((e: any) => e._id.toString() === empA._id.toString());

      assert(
        resEligible.status === 200 &&
        !foundInEligible &&
        foundInIneligible &&
        foundInIneligible.contractError === 'MULTIPLE_CONTRACTS_IN_PAYROLL_PERIOD' &&
        foundInIneligible.warnings?.some((w: string) => w.includes('multiple contracts within the selected payroll period')),
        'getEligibleEmployees excludes employee with multiple contracts and places in ineligible list',
        { foundInEligible, foundInIneligible }
      );

      // 3.4 Payrun creation rejection
      const resCreatePayrun = await request({
        method: 'POST',
        path: '/api/payruns',
        token: adminToken,
        body: {
          name: 'HistPayrun June-July',
          salaryStructureId: structure._id,
          periodStart: '2026-06-01',
          periodEnd: '2026-07-31',
          employeeIds: [empA._id.toString()]
        }
      });
      assert(
        resCreatePayrun.status === 400 &&
        resCreatePayrun.body.code === 'MULTIPLE_CONTRACTS_IN_PAYROLL_PERIOD' &&
        resCreatePayrun.body.message.includes('multiple contracts within the selected payroll period'),
        'POST /api/payruns rejects payrun creation spanning two contracts',
        resCreatePayrun.body
      );

      // 3.5 calculatePayslip direct call rejection
      let errCalcPayslip: any = null;
      try {
        await payslipService.calculatePayslip(empA._id, {
          salaryStructureId: structure._id,
          periodStart: spanStart,
          periodEnd: spanEnd
        });
      } catch (e: any) {
        errCalcPayslip = e;
      }
      assert(
        errCalcPayslip !== null &&
        errCalcPayslip.statusCode === 400 &&
        errCalcPayslip.code === 'MULTIPLE_CONTRACTS_IN_PAYROLL_PERIOD',
        'calculatePayslip rejects calculation without generating payslip or lines',
        errCalcPayslip
      );
    }

    console.log('\n--- 4. EDGE CASES & OVERLAPPING CONTRACTS ---');

    // Edge Case 1: Contract starts mid-period (e.g. June 15 to Dec 31)
    {
      const empMidStart: any = await Employee.create({
        firstName: 'MidStart',
        lastName: 'Emp',
        employeeCode: 'EMP-HIST-MID1',
        email: `${testEmailPrefix}mid1@test.com`,
        jobPosition: 'Historical Test Dev',
        departmentId: dept._id,
        bankDetails: { accountNumber: '111', bankName: 'Test Bank' },
        status: 'Active'
      });
      await Contract.create({
        employeeId: empMidStart._id,
        startDate: new Date('2026-06-15'),
        endDate: new Date('2026-12-31'),
        jobPosition: 'Historical Test Dev',
        departmentId: dept._id,
        salaryStructureId: structure._id,
        wage: 35000,
        status: 'Active'
      });

      const contract = await payslipService.findApplicableContract(
        empMidStart._id,
        new Date('2026-06-01'),
        new Date('2026-06-30')
      );
      assert(
        contract !== null && contract.wage === 35000,
        'Edge Case 1: Contract starting mid-period is successfully selected when it is the sole contract'
      );
    }

    // Edge Case 2: Contract ends mid-period (e.g. Jan 01 to June 15)
    {
      const empMidEnd: any = await Employee.create({
        firstName: 'MidEnd',
        lastName: 'Emp',
        employeeCode: 'EMP-HIST-MID2',
        email: `${testEmailPrefix}mid2@test.com`,
        jobPosition: 'Historical Test Dev',
        departmentId: dept._id,
        bankDetails: { accountNumber: '222', bankName: 'Test Bank' },
        status: 'Active'
      });
      await Contract.create({
        employeeId: empMidEnd._id,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-06-15'),
        jobPosition: 'Historical Test Dev',
        departmentId: dept._id,
        salaryStructureId: structure._id,
        wage: 32000,
        status: 'Active'
      });

      const contract = await payslipService.findApplicableContract(
        empMidEnd._id,
        new Date('2026-06-01'),
        new Date('2026-06-30')
      );
      assert(
        contract !== null && contract.wage === 32000,
        'Edge Case 2: Contract ending mid-period is successfully selected when it is the sole contract'
      );
    }

    // Edge Case 4: Payrun matching exactly one contract boundary
    {
      // Payrun matching exactly Contract 1 (01-01-2026 to 30-06-2026)
      const c1Match = await payslipService.findApplicableContract(
        empA._id,
        new Date('2026-01-01'),
        new Date('2026-06-30')
      );
      assert(
        c1Match !== null && c1Match.wage === 30000,
        'Edge Case 4a: Payrun exactly matching Contract 1 boundary selects Contract 1 (wage 30000)'
      );

      // Payrun matching exactly Contract 2 (01-07-2026 to 31-12-2026)
      const c2Match = await payslipService.findApplicableContract(
        empA._id,
        new Date('2026-07-01'),
        new Date('2026-12-31')
      );
      assert(
        c2Match !== null && c2Match.wage === 40000,
        'Edge Case 4b: Payrun exactly matching Contract 2 boundary selects Contract 2 (wage 40000)'
      );
    }

    // Edge Case 5: Payrun spanning 3 contracts
    {
      const emp3: any = await Employee.create({
        firstName: 'Triple',
        lastName: 'ContractEmp',
        employeeCode: 'EMP-HIST-TRI',
        email: `${testEmailPrefix}tri@test.com`,
        jobPosition: 'Historical Test Dev',
        departmentId: dept._id,
        bankDetails: { accountNumber: '333', bankName: 'Test Bank' },
        status: 'Active'
      });

      await Contract.create({
        employeeId: emp3._id,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-02-28'),
        jobPosition: 'Historical Test Dev',
        departmentId: dept._id,
        salaryStructureId: structure._id,
        wage: 25000,
        status: 'Active'
      });
      await Contract.create({
        employeeId: emp3._id,
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-04-30'),
        jobPosition: 'Historical Test Dev',
        departmentId: dept._id,
        salaryStructureId: structure._id,
        wage: 28000,
        status: 'Active'
      });
      await Contract.create({
        employeeId: emp3._id,
        startDate: new Date('2026-05-01'),
        endDate: new Date('2026-06-30'),
        jobPosition: 'Historical Test Dev',
        departmentId: dept._id,
        salaryStructureId: structure._id,
        wage: 32000,
        status: 'Active'
      });

      let err3: any = null;
      try {
        await payslipService.findApplicableContract(
          emp3._id,
          new Date('2026-01-01'),
          new Date('2026-06-30')
        );
      } catch (e: any) {
        err3 = e;
      }
      assert(
        err3 !== null &&
        err3.code === 'MULTIPLE_CONTRACTS_IN_PAYROLL_PERIOD' &&
        err3.contracts?.length === 3,
        'Edge Case 5: Payrun spanning 3 sequential contracts throws MULTIPLE_CONTRACTS_IN_PAYROLL_PERIOD with all 3 contracts',
        err3
      );
    }

    // Overlapping Contracts Test: OVERLAPPING_EMPLOYEE_CONTRACTS
    {
      const empOverlap: any = await Employee.create({
        firstName: 'Overlap',
        lastName: 'Emp',
        employeeCode: 'EMP-HIST-OVL',
        email: `${testEmailPrefix}ovl@test.com`,
        jobPosition: 'Historical Test Dev',
        departmentId: dept._id,
        bankDetails: { accountNumber: '444', bankName: 'Test Bank' },
        status: 'Active'
      });

      // Contract 1: 01-01-2026 to 31-07-2026
      await Contract.create({
        employeeId: empOverlap._id,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-07-31'),
        jobPosition: 'Historical Test Dev',
        departmentId: dept._id,
        salaryStructureId: structure._id,
        wage: 45000,
        status: 'Active'
      });

      // Contract 2: 01-07-2026 to 31-12-2026 (overlaps during July 2026!)
      await Contract.create({
        employeeId: empOverlap._id,
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-12-31'),
        jobPosition: 'Historical Test Dev',
        departmentId: dept._id,
        salaryStructureId: structure._id,
        wage: 50000,
        status: 'Active'
      });

      let errOverlap: any = null;
      try {
        await payslipService.findApplicableContract(
          empOverlap._id,
          new Date('2026-06-01'),
          new Date('2026-07-31')
        );
      } catch (e: any) {
        errOverlap = e;
      }
      assert(
        errOverlap !== null &&
        errOverlap.code === 'OVERLAPPING_EMPLOYEE_CONTRACTS' &&
        errOverlap.message.includes('has overlapping contracts. Resolve the contract dates before processing payroll.'),
        'Overlapping Contracts throws OVERLAPPING_EMPLOYEE_CONTRACTS with required message',
        errOverlap
      );
    }

    console.log(`\n=============================================================`);
    console.log(`HISTORICAL CONTRACT BOUNDARY TESTS SUMMARY: ${passedTests}/${totalTests} Passed`);
    console.log(`=============================================================\n`);

    if (passedTests !== totalTests) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.connection.close();
  }
}

runHistoricalContractTests();

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import http from 'http';
import app from '../app';
import { User } from '../modules/users/user.model';
import { SalaryStructure } from '../modules/salary/structure/structure.model';
import { SalaryRule } from '../modules/salary/rule/rule.model';

dotenv.config();

const PORT = 5009;
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
  console.log('🧪 TESTING PHASE 5 — SALARY RULES MODULE 🧪');
  console.log('=====================================================');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/peoplepay360';
  await mongoose.connect(mongoUri);
  console.log('✓ Connected to MongoDB');

  // Start test server
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
    // 0. Setup test users and structures
    console.log('\n--- Setting up test fixtures ---');
    await SalaryRule.deleteMany({});
    await SalaryStructure.deleteMany({ code: { $in: ['TEST_STRUCT_A', 'TEST_STRUCT_B'] } });

    const structureA = await SalaryStructure.create({
      name: 'Standard Executive Structure',
      code: 'TEST_STRUCT_A',
      isActive: true
    });

    const structureB = await SalaryStructure.create({
      name: 'Part-Time Hourly Structure',
      code: 'TEST_STRUCT_B',
      isActive: true
    });

    const adminUser = await User.findOne({ role: 'Admin' }) || await User.create({
      name: 'Admin Test',
      email: 'admin_test@peoplepay360.com',
      passwordHash: 'Password123!',
      role: 'Admin',
      isActive: true
    });

    const payrollManagerUser = await User.findOne({ role: 'HR Payroll Manager' }) || await User.create({
      name: 'Payroll Manager Test',
      email: 'payroll_mgr_test@peoplepay360.com',
      passwordHash: 'Password123!',
      role: 'HR Payroll Manager',
      isActive: true
    });

    const payrollUser = await User.findOne({ role: 'HR Payroll User' }) || await User.create({
      name: 'Payroll User Test',
      email: 'payroll_user_test@peoplepay360.com',
      passwordHash: 'Password123!',
      role: 'HR Payroll User',
      isActive: true
    });

    const hrManagerUser = await User.findOne({ role: 'HR Manager' }) || await User.create({
      name: 'HR Manager Test',
      email: 'hr_mgr_test@peoplepay360.com',
      passwordHash: 'Password123!',
      role: 'HR Manager',
      isActive: true
    });

    const employeeUser = await User.findOne({ role: 'Employee' }) || await User.create({
      name: 'Employee Test',
      email: 'employee_test@peoplepay360.com',
      passwordHash: 'Password123!',
      role: 'Employee',
      isActive: true
    });

    const adminToken = generateToken(adminUser);
    const payrollMgrToken = generateToken(payrollManagerUser);
    const payrollUserToken = generateToken(payrollUser);
    const hrMgrToken = generateToken(hrManagerUser);
    const employeeToken = generateToken(employeeUser);

    console.log('✓ Test fixtures ready');

    // 1. Create a Salary Rule under a Salary Structure
    console.log('\n--- 1. Salary Rule Creation ---');
    const createBasicRes = await apiRequest({
      method: 'POST',
      path: '/api/salary-rules',
      token: adminToken,
      body: {
        salaryStructureId: structureA._id.toString(),
        name: 'Basic Salary',
        code: 'BASIC',
        category: 'Basic',
        sequence: 10,
        computationMethod: 'Fixed',
        amount: 50000
      }
    });
    assert(createBasicRes.status === 201 && createBasicRes.body.data.code === 'BASIC', '1. Create Fixed Basic Salary Rule (201)', createBasicRes.body);

    const basicRuleId = createBasicRes.body.data._id;

    // Create Allowance (Percentage)
    const createAllowanceRes = await apiRequest({
      method: 'POST',
      path: '/api/salary-rules',
      token: payrollMgrToken,
      body: {
        salaryStructureId: structureA._id.toString(),
        name: 'House Rent Allowance',
        code: 'HRA',
        category: 'Allowances',
        sequence: 20,
        computationMethod: 'Percentage',
        percentage: 40
      }
    });
    assert(createAllowanceRes.status === 201 && createAllowanceRes.body.data.percentage === 40, '2. Create Percentage Allowance Rule (201)', createAllowanceRes.body);

    // Create Gross (Formula)
    const createGrossRes = await apiRequest({
      method: 'POST',
      path: '/api/salary-rules',
      token: adminToken,
      body: {
        salaryStructureId: structureA._id.toString(),
        name: 'Gross Total',
        code: 'GROSS',
        category: 'Gross',
        sequence: 30,
        computationMethod: 'Formula',
        formulaExpression: 'BASIC + HRA'
      }
    });
    assert(createGrossRes.status === 201 && createGrossRes.body.data.formulaExpression === 'BASIC + HRA', '3. Create Formula Gross Rule (201)', createGrossRes.body);

    // Create Deduction (Fixed)
    const createDeductionRes = await apiRequest({
      method: 'POST',
      path: '/api/salary-rules',
      token: payrollMgrToken,
      body: {
        salaryStructureId: structureA._id.toString(),
        name: 'Provident Fund',
        code: 'PF',
        category: 'Deductions',
        sequence: 40,
        computationMethod: 'Percentage',
        percentage: 12
      }
    });
    assert(createDeductionRes.status === 201 && createDeductionRes.body.data.code === 'PF', '4. Create Deduction Rule (201)', createDeductionRes.body);

    // Create Net (Formula)
    const createNetRes = await apiRequest({
      method: 'POST',
      path: '/api/salary-rules',
      token: adminToken,
      body: {
        salaryStructureId: structureA._id.toString(),
        name: 'Net Salary',
        code: 'NET',
        category: 'Net',
        sequence: 50,
        computationMethod: 'Formula',
        formulaExpression: 'GROSS - PF'
      }
    });
    assert(createNetRes.status === 201 && createNetRes.body.data.code === 'NET', '5. Create Net Salary Rule (201)', createNetRes.body);

    // 2 & 3. Get rules for a structure & confirm sequence order
    console.log('\n--- 2 & 3. Get Rules for Structure & Sequence Ordering ---');
    const getRulesRes = await apiRequest({
      method: 'GET',
      path: `/api/salary-rules/structure/${structureA._id}`,
      token: payrollUserToken
    });
    const rules = getRulesRes.body.data || [];
    const sequences = rules.map((r: any) => r.sequence);
    const isSorted = sequences.every((val: number, i: number, arr: number[]) => i === 0 || arr[i - 1] <= val);

    assert(
      getRulesRes.status === 200 && rules.length === 5 && isSorted && sequences[0] === 10 && sequences[4] === 50,
      '6. Retrieve rules for structure ordered by sequence (10, 20, 30, 40, 50)',
      { status: getRulesRes.status, sequences }
    );

    // 4. Update a rule
    console.log('\n--- 4. Update Salary Rule ---');
    const updateRes = await apiRequest({
      method: 'PATCH',
      path: `/api/salary-rules/${basicRuleId}`,
      token: payrollMgrToken,
      body: {
        name: 'Updated Basic Salary',
        amount: 55000
      }
    });
    assert(
      updateRes.status === 200 && updateRes.body.data.name === 'Updated Basic Salary' && updateRes.body.data.amount === 55000,
      '7. Update rule name and amount (200)',
      updateRes.body
    );

    // 5. Delete a rule
    console.log('\n--- 5. Delete Salary Rule ---');
    const tempRuleRes = await apiRequest({
      method: 'POST',
      path: '/api/salary-rules',
      token: adminToken,
      body: {
        salaryStructureId: structureA._id.toString(),
        name: 'Temporary Bonus',
        code: 'TEMP_BONUS',
        category: 'Allowances',
        sequence: 25,
        computationMethod: 'Fixed',
        amount: 1000
      }
    });
    const tempRuleId = tempRuleRes.body.data._id;
    const deleteRes = await apiRequest({
      method: 'DELETE',
      path: `/api/salary-rules/${tempRuleId}`,
      token: payrollMgrToken
    });
    assert(deleteRes.status === 200, '8. Delete salary rule where allowed (200)', deleteRes.body);

    const getDeletedRes = await apiRequest({
      method: 'GET',
      path: `/api/salary-rules/${tempRuleId}`,
      token: adminToken
    });
    assert(getDeletedRes.status === 404, '9. Deleted rule cannot be found (404)', getDeletedRes.body);

    // 6. Invalid Salary Structure reference
    console.log('\n--- 6. Invalid Salary Structure Reference ---');
    const invalidStructRes = await apiRequest({
      method: 'POST',
      path: '/api/salary-rules',
      token: adminToken,
      body: {
        salaryStructureId: new mongoose.Types.ObjectId().toString(),
        name: 'Ghost Rule',
        code: 'GHOST',
        category: 'Basic',
        computationMethod: 'Fixed',
        amount: 1000
      }
    });
    assert(invalidStructRes.status === 404, '10. Non-existent salary structure reference rejected (404)', invalidStructRes.body);

    const invalidIdRes = await apiRequest({
      method: 'POST',
      path: '/api/salary-rules',
      token: adminToken,
      body: {
        salaryStructureId: 'invalid-id-format',
        name: 'Bad ID Rule',
        code: 'BAD_ID',
        category: 'Basic',
        computationMethod: 'Fixed',
        amount: 1000
      }
    });
    assert(invalidIdRes.status === 400, '11. Invalid structure ID format rejected (400)', invalidIdRes.body);

    // 7. Duplicate rule code in same structure
    console.log('\n--- 7 & 8. Rule Code Uniqueness Checks ---');
    const duplicateCodeRes = await apiRequest({
      method: 'POST',
      path: '/api/salary-rules',
      token: adminToken,
      body: {
        salaryStructureId: structureA._id.toString(),
        name: 'Duplicate Basic',
        code: 'BASIC',
        category: 'Basic',
        computationMethod: 'Fixed',
        amount: 25000
      }
    });
    assert(duplicateCodeRes.status === 409, '12. Duplicate rule code in same structure rejected (409 Conflict)', duplicateCodeRes.body);

    // 8. Same rule code in different structure allowed
    const differentStructRes = await apiRequest({
      method: 'POST',
      path: '/api/salary-rules',
      token: adminToken,
      body: {
        salaryStructureId: structureB._id.toString(),
        name: 'Part-Time Basic',
        code: 'BASIC',
        category: 'Basic',
        sequence: 10,
        computationMethod: 'Fixed',
        amount: 20000
      }
    });
    assert(differentStructRes.status === 201 && differentStructRes.body.data.code === 'BASIC', '13. Same rule code in different structure allowed (201)', differentStructRes.body);

    // 9. Invalid category
    console.log('\n--- 9. Category Validation ---');
    const invalidCatRes = await apiRequest({
      method: 'POST',
      path: '/api/salary-rules',
      token: adminToken,
      body: {
        salaryStructureId: structureA._id.toString(),
        name: 'Bad Cat',
        code: 'BAD_CAT',
        category: 'UnknownCategory',
        computationMethod: 'Fixed',
        amount: 1000
      }
    });
    assert(invalidCatRes.status === 400, '14. Invalid salary rule category rejected (400)', invalidCatRes.body);

    // 10. Invalid computation method
    console.log('\n--- 10. Computation Method Validation ---');
    const invalidMethodRes = await apiRequest({
      method: 'POST',
      path: '/api/salary-rules',
      token: adminToken,
      body: {
        salaryStructureId: structureA._id.toString(),
        name: 'Bad Method',
        code: 'BAD_METHOD',
        category: 'Basic',
        computationMethod: 'Magic',
        amount: 1000
      }
    });
    assert(invalidMethodRes.status === 400, '15. Invalid computation method rejected (400)', invalidMethodRes.body);

    // 11. Fixed rule validation
    console.log('\n--- 11. Fixed Method Validation ---');
    const missingAmountRes = await apiRequest({
      method: 'POST',
      path: '/api/salary-rules',
      token: adminToken,
      body: {
        salaryStructureId: structureA._id.toString(),
        name: 'Missing Amount',
        code: 'NO_AMT',
        category: 'Basic',
        computationMethod: 'Fixed'
      }
    });
    assert(missingAmountRes.status === 400, '16. Fixed rule missing amount rejected (400)', missingAmountRes.body);

    const negativeAmountRes = await apiRequest({
      method: 'POST',
      path: '/api/salary-rules',
      token: adminToken,
      body: {
        salaryStructureId: structureA._id.toString(),
        name: 'Negative Amount',
        code: 'NEG_AMT',
        category: 'Basic',
        computationMethod: 'Fixed',
        amount: -500
      }
    });
    assert(negativeAmountRes.status === 400, '17. Fixed rule negative amount rejected (400)', negativeAmountRes.body);

    // 12. Percentage rule validation
    console.log('\n--- 12. Percentage Method Validation ---');
    const missingPercentRes = await apiRequest({
      method: 'POST',
      path: '/api/salary-rules',
      token: adminToken,
      body: {
        salaryStructureId: structureA._id.toString(),
        name: 'Missing Percent',
        code: 'NO_PCT',
        category: 'Allowances',
        computationMethod: 'Percentage'
      }
    });
    assert(missingPercentRes.status === 400, '18. Percentage rule missing percentage rejected (400)', missingPercentRes.body);

    const negativePercentRes = await apiRequest({
      method: 'POST',
      path: '/api/salary-rules',
      token: adminToken,
      body: {
        salaryStructureId: structureA._id.toString(),
        name: 'Negative Percent',
        code: 'NEG_PCT',
        category: 'Allowances',
        computationMethod: 'Percentage',
        percentage: -15
      }
    });
    assert(negativePercentRes.status === 400, '19. Percentage rule negative percentage rejected (400)', negativePercentRes.body);

    // 13 & 19. Formula rule validation & Safety check
    console.log('\n--- 13 & 19. Formula Validation & Security Checks ---');
    const emptyFormulaRes = await apiRequest({
      method: 'POST',
      path: '/api/salary-rules',
      token: adminToken,
      body: {
        salaryStructureId: structureA._id.toString(),
        name: 'Empty Formula',
        code: 'EMPTY_FORM',
        category: 'Gross',
        computationMethod: 'Formula',
        formulaExpression: '   '
      }
    });
    assert(emptyFormulaRes.status === 400, '20. Empty formula expression rejected (400)', emptyFormulaRes.body);

    const unsafeEvalRes = await apiRequest({
      method: 'POST',
      path: '/api/salary-rules',
      token: adminToken,
      body: {
        salaryStructureId: structureA._id.toString(),
        name: 'Unsafe Eval Rule',
        code: 'UNSAFE_EVAL',
        category: 'Gross',
        computationMethod: 'Formula',
        formulaExpression: 'eval("process.exit(1)")'
      }
    });
    assert(unsafeEvalRes.status === 400, '21. Dangerous code injection (eval/process) safely rejected (400)', unsafeEvalRes.body);

    // 14 & 15. HR Payroll User RBAC (Read OK, Write Forbidden)
    console.log('\n--- 14 & 15. HR Payroll User Permissions ---');
    const payrollUserReadRes = await apiRequest({
      method: 'GET',
      path: '/api/salary-rules',
      token: payrollUserToken
    });
    assert(payrollUserReadRes.status === 200, '22. HR Payroll User can read Salary Rules (200)', payrollUserReadRes.body);

    const payrollUserCreateRes = await apiRequest({
      method: 'POST',
      path: '/api/salary-rules',
      token: payrollUserToken,
      body: {
        salaryStructureId: structureA._id.toString(),
        name: 'Forbidden Rule',
        code: 'FORBIDDEN',
        category: 'Basic',
        computationMethod: 'Fixed',
        amount: 1000
      }
    });
    assert(payrollUserCreateRes.status === 403, '23. HR Payroll User CANNOT create Salary Rules (403 Forbidden)', payrollUserCreateRes.body);

    // 16. HR Payroll Manager RBAC (Write OK)
    console.log('\n--- 16. HR Payroll Manager Permissions ---');
    const payrollMgrCreateRes = await apiRequest({
      method: 'POST',
      path: '/api/salary-rules',
      token: payrollMgrToken,
      body: {
        salaryStructureId: structureA._id.toString(),
        name: 'Manager Created Rule',
        code: 'MGR_RULE',
        category: 'Allowances',
        sequence: 22,
        computationMethod: 'Fixed',
        amount: 2500
      }
    });
    assert(payrollMgrCreateRes.status === 201, '24. HR Payroll Manager CAN create Salary Rules (201 Created)', payrollMgrCreateRes.body);

    // 17. Employee RBAC (Forbidden)
    console.log('\n--- 17. Employee Permissions ---');
    const employeeAccessRes = await apiRequest({
      method: 'GET',
      path: '/api/salary-rules',
      token: employeeToken
    });
    assert(employeeAccessRes.status === 403, '25. Employee CANNOT access Salary Rules (403 Forbidden)', employeeAccessRes.body);

    // 18. HR Manager RBAC (Forbidden)
    console.log('\n--- 18. HR Manager Permissions ---');
    const hrMgrAccessRes = await apiRequest({
      method: 'GET',
      path: '/api/salary-rules',
      token: hrMgrToken
    });
    assert(hrMgrAccessRes.status === 403, '26. HR Manager CANNOT access Salary Rules (403 Forbidden)', hrMgrAccessRes.body);

    // 20. Integration with Developer A's Salary Structure API
    console.log('\n--- 20. Structure & Rule Integration ---');
    const populatedStructRes = await apiRequest({
      method: 'GET',
      path: `/api/salary-structures/${structureA._id}`,
      token: payrollUserToken
    });
    const attachedRules = populatedStructRes.body.data?.rules || [];
    assert(
      populatedStructRes.status === 200 && attachedRules.length > 0 && attachedRules[0].sequence <= attachedRules[attachedRules.length - 1].sequence,
      '27. Salary Structure endpoint successfully populates ordered Salary Rules',
      { status: populatedStructRes.status, count: attachedRules.length }
    );

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

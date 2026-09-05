import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../modules/users/user.model';
import { Employee } from '../modules/employees/employee.model';
import { Department } from '../modules/departments/department.model';
import { userService } from '../modules/users/user.service';

dotenv.config();

async function testCascadeDelete() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/peoplepay360';
  await mongoose.connect(mongoUri);

  try {
    let dept = await Department.findOne();
    if (!dept) {
      dept = await Department.create({ name: 'Test Dept' });
    }

    // 1. Create Employee User
    const user = await userService.createUser({
      role: 'Employee',
      name: 'Delete Test Employee',
      email: 'delete.tester@peoplepay360.com',
      password: 'Password123!',
      employee: {
        employeeCode: 'DEL_TEST_001',
        firstName: 'Delete',
        lastName: 'Tester',
        email: 'delete.tester@peoplepay360.com',
        departmentId: dept._id.toString(),
        jobPosition: 'Tester'
      }
    });

    console.log('✓ Created User:', user._id.toString());
    const empId = user.employeeId ? (user.employeeId as any)._id?.toString() || user.employeeId.toString() : null;
    console.log('✓ Associated Employee:', empId);

    // Verify employee exists in DB
    const empBefore = await Employee.findById(empId);
    console.log('✓ Employee exists before deletion:', !!empBefore);

    // 2. Delete User
    await userService.deleteUser(user._id.toString());
    console.log('✓ User deleted');

    // 3. Verify User is gone
    const userAfter = await User.findById(user._id);
    console.log('✓ User is gone:', userAfter === null);

    // 4. Verify Employee is also deleted
    const empAfter = await Employee.findById(empId);
    console.log('✓ Employee is gone:', empAfter === null);

    if (userAfter === null && empAfter === null) {
      console.log('✅ PASS: Cascade deletion succeeded!');
    } else {
      console.error('❌ FAIL: Cascade deletion failed!');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

testCascadeDelete();

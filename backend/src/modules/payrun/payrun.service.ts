import mongoose from 'mongoose';
import { Payrun, IPayrun, IPayrunWarning } from './payrun.model';
import {
  CreatePayrunDTO,
  UpdatePayrunDTO,
  validateEligibleEmployeesInput,
  validateCreatePayrunInput
} from './payrun.validation';
import { SalaryStructure } from '../salary/structure/structure.model';
import { Employee, IEmployee } from '../employees/employee.model';
import { Contract } from '../contracts/contract.model';
import { payslipService } from '../payslip/payslip.service';

export class PayrunService {
  async getEligibleEmployees(
    salaryStructureIdInput: string,
    periodStartInput: string | Date,
    periodEndInput: string | Date
  ) {
    const validated = validateEligibleEmployeesInput({
      salaryStructureId: salaryStructureIdInput,
      periodStart: periodStartInput,
      periodEnd: periodEndInput
    });

    // Check Salary Structure existence and active status
    const structure = await SalaryStructure.findById(validated.salaryStructureId);
    if (!structure) {
      const error: any = new Error('Salary structure not found');
      error.statusCode = 404;
      throw error;
    }

    if (!structure.isActive) {
      const error: any = new Error('Selected salary structure is inactive');
      error.statusCode = 400;
      throw error;
    }

    // Fetch active employees
    const activeEmployees = await Employee.find({
      status: { $ne: 'Terminated' }
    }).populate('departmentId', 'name');

    const eligibleEmployees: any[] = [];
    const ineligibleEmployees: any[] = [];
    const globalWarnings: IPayrunWarning[] = [];

    for (const emp of activeEmployees) {
      const empWarnings: string[] = [];

      // Check applicable contract
      const contract = await Contract.findOne({
        employeeId: emp._id,
        status: 'Active',
        startDate: { $lte: validated.periodEnd },
        $or: [{ endDate: null }, { endDate: { $gte: validated.periodStart } }]
      });

      let isEligible = true;

      if (!contract) {
        isEligible = false;
        empWarnings.push('No active contract applicable for the selected payroll period');
      } else {
        // Check if contract has salaryStructureId specified and if it matches
        if (
          contract.salaryStructureId &&
          contract.salaryStructureId.toString() !== validated.salaryStructureId.toString()
        ) {
          empWarnings.push(
            `Contract salary structure (${contract.salaryStructureId}) differs from payrun structure (${validated.salaryStructureId})`
          );
        }
      }

      // Check bank details
      if (
        !emp.bankDetails ||
        (!emp.bankDetails.accountNumber && !emp.bankDetails.iban)
      ) {
        empWarnings.push('Missing bank details for payroll transfer');
      }

      // Check required employee info
      if (!emp.employeeCode || !emp.email || !emp.jobPosition) {
        empWarnings.push('Missing required employee profile information');
      }

      // Check existing payslips / duplicate payruns for this employee & period
      const existingPayrun = await Payrun.findOne({
        employeeIds: emp._id,
        status: { $ne: 'Cancelled' },
        periodStart: { $lte: validated.periodEnd },
        periodEnd: { $gte: validated.periodStart }
      });

      if (existingPayrun) {
        empWarnings.push(
          `Employee already has a payrun (${existingPayrun.name}) for an overlapping period`
        );
      }

      // If Payslip model exists, check duplicate payslips
      if (mongoose.models.Payslip) {
        const existingPayslip = await mongoose.models.Payslip.findOne({
          employeeId: emp._id,
          status: { $ne: 'Cancelled' },
          periodStart: { $lte: validated.periodEnd },
          periodEnd: { $gte: validated.periodStart }
        });
        if (existingPayslip) {
          empWarnings.push('Employee already has a payslip generated for this period');
        }
      }

      const empData = {
        _id: emp._id,
        employeeCode: emp.employeeCode,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        jobPosition: emp.jobPosition,
        department: emp.departmentId,
        status: emp.status,
        contract: contract
          ? {
              _id: contract._id,
              wage: contract.wage,
              startDate: contract.startDate,
              endDate: contract.endDate,
              salaryStructureId: contract.salaryStructureId
            }
          : null,
        warnings: empWarnings,
        isEligible
      };

      if (isEligible) {
        eligibleEmployees.push(empData);
      } else {
        ineligibleEmployees.push(empData);
      }
    }

    return {
      salaryStructure: {
        _id: structure._id,
        name: structure.name,
        code: structure.code
      },
      periodStart: validated.periodStart,
      periodEnd: validated.periodEnd,
      totalActiveEmployees: activeEmployees.length,
      eligibleCount: eligibleEmployees.length,
      ineligibleCount: ineligibleEmployees.length,
      eligibleEmployees,
      ineligibleEmployees,
      warnings: globalWarnings
    };
  }

  async createPayrun(data: CreatePayrunDTO): Promise<IPayrun> {
    const validated = validateCreatePayrunInput(data);

    // Verify Salary Structure
    const structure = await SalaryStructure.findById(validated.salaryStructureId);
    if (!structure) {
      const error: any = new Error('Salary structure not found');
      error.statusCode = 404;
      throw error;
    }

    if (!structure.isActive) {
      const error: any = new Error('Selected salary structure is inactive');
      error.statusCode = 400;
      throw error;
    }

    // Verify selected employees exist
    const employees = await Employee.find({
      _id: { $in: validated.employeeIds }
    });

    if (employees.length !== validated.employeeIds.length) {
      const error: any = new Error('One or more selected employees do not exist');
      error.statusCode = 400;
      throw error;
    }

    // Evaluate warnings for selected employees
    const warnings: IPayrunWarning[] = [];

    for (const emp of employees) {
      // Contract check
      const contract = await Contract.findOne({
        employeeId: emp._id,
        status: 'Active',
        startDate: { $lte: validated.periodEnd },
        $or: [{ endDate: null }, { endDate: { $gte: validated.periodStart } }]
      });

      if (!contract) {
        warnings.push({
          type: 'MISSING_CONTRACT',
          message: `Employee ${emp.firstName} ${emp.lastName} (${emp.employeeCode}) has no active contract for the period`,
          employeeId: emp._id as mongoose.Types.ObjectId
        });
      } else if (
        contract.salaryStructureId &&
        contract.salaryStructureId.toString() !== validated.salaryStructureId.toString()
      ) {
        warnings.push({
          type: 'STRUCTURE_MISMATCH',
          message: `Employee ${emp.firstName} ${emp.lastName}'s contract structure differs from payrun structure`,
          employeeId: emp._id as mongoose.Types.ObjectId
        });
      }

      // Bank details check
      if (
        !emp.bankDetails ||
        (!emp.bankDetails.accountNumber && !emp.bankDetails.iban)
      ) {
        warnings.push({
          type: 'MISSING_BANK_DETAILS',
          message: `Employee ${emp.firstName} ${emp.lastName} (${emp.employeeCode}) is missing bank details`,
          employeeId: emp._id as mongoose.Types.ObjectId
        });
      }

      // Required employee info check
      if (!emp.employeeCode || !emp.email || !emp.jobPosition) {
        warnings.push({
          type: 'MISSING_EMPLOYEE_INFO',
          message: `Employee ${emp.firstName} ${emp.lastName} is missing required profile information`,
          employeeId: emp._id as mongoose.Types.ObjectId
        });
      }

      // Duplicate payrun / payslip check
      const existingPayrun = await Payrun.findOne({
        _id: { $ne: null },
        employeeIds: emp._id,
        status: { $ne: 'Cancelled' },
        periodStart: { $lte: validated.periodEnd },
        periodEnd: { $gte: validated.periodStart }
      });

      if (existingPayrun) {
        warnings.push({
          type: 'DUPLICATE_PAYSLIP',
          message: `Employee ${emp.firstName} ${emp.lastName} already exists in another payrun (${existingPayrun.name}) for an overlapping period`,
          employeeId: emp._id as mongoose.Types.ObjectId
        });
      }

      if (mongoose.models.Payslip) {
        const existingPayslip = await mongoose.models.Payslip.findOne({
          employeeId: emp._id,
          status: { $ne: 'Cancelled' },
          periodStart: { $lte: validated.periodEnd },
          periodEnd: { $gte: validated.periodStart }
        });
        if (existingPayslip) {
          warnings.push({
            type: 'DUPLICATE_PAYSLIP',
            message: `Employee ${emp.firstName} ${emp.lastName} already has a generated payslip for this period`,
            employeeId: emp._id as mongoose.Types.ObjectId
          });
        }
      }
    }

    const payrunDoc = new Payrun({
      name: validated.name,
      salaryStructureId: validated.salaryStructureId,
      periodStart: validated.periodStart,
      periodEnd: validated.periodEnd,
      employeeIds: validated.employeeIds,
      payslipIds: [],
      status: 'Draft',
      warnings
    });

    const saved = await payrunDoc.save();

    return (await Payrun.findById(saved._id)
      .populate('salaryStructureId', 'name code')
      .populate('employeeIds', 'firstName lastName employeeCode email jobPosition')) as IPayrun;
  }

  async getAllPayruns(): Promise<IPayrun[]> {
    return await Payrun.find()
      .populate('salaryStructureId', 'name code')
      .populate('employeeIds', 'firstName lastName employeeCode email jobPosition')
      .sort({ createdAt: -1 });
  }

  async getPayrunById(id: string): Promise<IPayrun> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid payrun ID format');
      error.statusCode = 400;
      throw error;
    }

    const payrun = await Payrun.findById(id)
      .populate('salaryStructureId', 'name code')
      .populate('employeeIds', 'firstName lastName employeeCode email jobPosition departmentId');

    if (!payrun) {
      const error: any = new Error('Payrun not found');
      error.statusCode = 404;
      throw error;
    }

    return payrun;
  }

  async updatePayrun(id: string, data: UpdatePayrunDTO): Promise<IPayrun> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid payrun ID format');
      error.statusCode = 400;
      throw error;
    }

    const payrun = await Payrun.findById(id);
    if (!payrun) {
      const error: any = new Error('Payrun not found');
      error.statusCode = 404;
      throw error;
    }

    if (payrun.status === 'Paid') {
      const error: any = new Error('Cannot update a paid payrun');
      error.statusCode = 400;
      throw error;
    }

    if (data.name) payrun.name = data.name.trim();
    if (data.status) {
      if (['Draft', 'Computed', 'Validated', 'Paid', 'Cancelled'].includes(data.status)) {
        payrun.status = data.status as any;
      }
    }

    if (data.employeeIds && Array.isArray(data.employeeIds)) {
      const seenStr = new Set<string>();
      const objectIds: mongoose.Types.ObjectId[] = [];
      for (const empId of data.employeeIds) {
        if (!mongoose.Types.ObjectId.isValid(empId)) {
          const error: any = new Error(`Invalid employee ID format: '${empId}'`);
          error.statusCode = 400;
          throw error;
        }
        if (seenStr.has(empId.toString())) {
          const error: any = new Error('Selected employee list contains duplicate employee IDs');
          error.statusCode = 400;
          throw error;
        }
        seenStr.add(empId.toString());
        objectIds.push(new mongoose.Types.ObjectId(empId));
      }
      payrun.employeeIds = objectIds;
    }

    await payrun.save();

    return (await Payrun.findById(id)
      .populate('salaryStructureId', 'name code')
      .populate('employeeIds', 'firstName lastName employeeCode email jobPosition')) as IPayrun;
  }

  async computePayrun(id: string): Promise<IPayrun> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid payrun ID format');
      error.statusCode = 400;
      throw error;
    }

    const payrun = await Payrun.findById(id);
    if (!payrun) {
      const error: any = new Error('Payrun not found');
      error.statusCode = 404;
      throw error;
    }

    if (payrun.status === 'Paid') {
      const error: any = new Error('Cannot compute a paid payrun');
      error.statusCode = 400;
      throw error;
    }

    // Generate/update payslips for all selected employees
    await payslipService.generatePayrunPayslips(payrun);

    return (await Payrun.findById(id)
      .populate('salaryStructureId', 'name code')
      .populate('employeeIds', 'firstName lastName employeeCode email jobPosition')
      .populate({
        path: 'payslipIds',
        populate: { path: 'employeeId', select: 'firstName lastName employeeCode email jobPosition' }
      })) as IPayrun;
  }

  async validatePayrun(id: string): Promise<IPayrun> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid payrun ID format');
      error.statusCode = 400;
      throw error;
    }

    const payrun = await Payrun.findById(id);
    if (!payrun) {
      const error: any = new Error('Payrun not found');
      error.statusCode = 404;
      throw error;
    }

    if (payrun.status === 'Paid') {
      const error: any = new Error('Cannot validate a paid payrun');
      error.statusCode = 400;
      throw error;
    }

    // Check for critical blocking issues in warnings
    const missingContractWarnings = payrun.warnings.filter((w) => w.type === 'MISSING_CONTRACT');
    if (missingContractWarnings.length === payrun.employeeIds.length && payrun.employeeIds.length > 0) {
      const error: any = new Error(
        'Payrun validation failed: None of the selected employees have an active contract'
      );
      error.statusCode = 400;
      throw error;
    }

    payrun.status = 'Validated';
    await payrun.save();

    return (await Payrun.findById(id)
      .populate('salaryStructureId', 'name code')
      .populate('employeeIds', 'firstName lastName employeeCode email jobPosition')) as IPayrun;
  }

  async markPaid(id: string): Promise<IPayrun> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid payrun ID format');
      error.statusCode = 400;
      throw error;
    }

    const payrun = await Payrun.findById(id);
    if (!payrun) {
      const error: any = new Error('Payrun not found');
      error.statusCode = 404;
      throw error;
    }

    payrun.status = 'Paid';
    await payrun.save();

    return (await Payrun.findById(id)
      .populate('salaryStructureId', 'name code')
      .populate('employeeIds', 'firstName lastName employeeCode email jobPosition')) as IPayrun;
  }
}

export const payrunService = new PayrunService();

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
import { hasAnyOverlappingContracts } from '../contracts/contract.boundary';
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

      // Check applicable contracts
      const matchingContracts = await Contract.find({
        employeeId: emp._id,
        status: 'Active',
        startDate: { $lte: validated.periodEnd },
        $or: [{ endDate: null }, { endDate: { $gte: validated.periodStart } }]
      }).sort({ startDate: 1 });

      let isEligible = true;
      let contract: any = null;
      let contractError: string | null = null;

      if (matchingContracts.length === 0) {
        isEligible = false;
        contractError = 'NO_ACTIVE_CONTRACT';
        empWarnings.push('No active contract applicable for the selected payroll period');
      } else if (matchingContracts.length > 1) {
        isEligible = false;
        const hasOverlap = hasAnyOverlappingContracts(matchingContracts);
        contractError = hasOverlap ? 'OVERLAPPING_EMPLOYEE_CONTRACTS' : 'MULTIPLE_CONTRACTS_IN_PAYROLL_PERIOD';
        const msg = hasOverlap
          ? `Employee ${emp.firstName} ${emp.lastName} has overlapping contracts. Resolve the contract dates before processing payroll.`
          : `Employee ${emp.firstName} ${emp.lastName} has multiple contracts within the selected payroll period. Create separate Payruns for each contract period.`;
        empWarnings.push(msg);
      } else {
        contract = matchingContracts[0];
        // Check if contract has salaryStructureId specified and if it matches
        if (!contract.salaryStructureId) {
          isEligible = false;
          contractError = 'NO_SALARY_STRUCTURE';
          empWarnings.push('Employee contract has no salary structure assigned');
        } else if (
          contract.salaryStructureId.toString() !== validated.salaryStructureId.toString()
        ) {
          isEligible = false;
          contractError = 'STRUCTURE_MISMATCH';
          empWarnings.push(
            `Contract salary structure differs from payrun structure`
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
        contracts: matchingContracts.map((c) => ({
          _id: c._id,
          wage: c.wage,
          startDate: c.startDate,
          endDate: c.endDate,
          status: c.status
        })),
        contractError,
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
      const matchingContracts = await Contract.find({
        employeeId: emp._id,
        status: 'Active',
        startDate: { $lte: validated.periodEnd },
        $or: [{ endDate: null }, { endDate: { $gte: validated.periodStart } }]
      }).sort({ startDate: 1 });

      if (matchingContracts.length === 0) {
        const otherContracts = await Contract.find({ employeeId: emp._id });
        if (otherContracts.length > 0) {
          const error: any = new Error(
            `Employee ${emp.firstName} ${emp.lastName} is not eligible for the selected salary structure and payroll period.`
          );
          error.statusCode = 400;
          throw error;
        }

        warnings.push({
          type: 'MISSING_CONTRACT',
          message: `Employee ${emp.firstName} ${emp.lastName} (${emp.employeeCode}) has no active contract for the period`,
          employeeId: emp._id as mongoose.Types.ObjectId
        });
      } else if (matchingContracts.length > 1) {
        const hasOverlap = hasAnyOverlappingContracts(matchingContracts);
        const code = hasOverlap ? 'OVERLAPPING_EMPLOYEE_CONTRACTS' : 'MULTIPLE_CONTRACTS_IN_PAYROLL_PERIOD';
        const msg = hasOverlap
          ? `Employee ${emp.firstName} ${emp.lastName} has overlapping contracts. Resolve the contract dates before processing payroll.`
          : `Employee ${emp.firstName} ${emp.lastName} has multiple contracts within the selected payroll period. Create separate Payruns for each contract period.`;

        const error: any = new Error(msg);
        error.statusCode = 400;
        error.code = code;
        error.employeeId = emp._id;
        error.contracts = matchingContracts.map((c) => ({
          _id: c._id,
          startDate: c.startDate,
          endDate: c.endDate,
          wage: c.wage,
          status: c.status,
          jobPosition: c.jobPosition,
          salaryStructureId: c.salaryStructureId
        }));
        throw error;
      } else {
        const contract = matchingContracts[0];
        if (
          !contract.salaryStructureId ||
          contract.salaryStructureId.toString() !== validated.salaryStructureId.toString()
        ) {
          const error: any = new Error(
            `Employee ${emp.firstName} ${emp.lastName} is not eligible for the selected salary structure and payroll period.`
          );
          error.statusCode = 400;
          throw error;
        }
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
      const error: any = new Error('Cannot modify or update a paid payrun');
      error.statusCode = 400;
      throw error;
    }

    if (payrun.status === 'Validated') {
      const error: any = new Error('Cannot update a validated payrun');
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

        // Validate contract boundary for payrun period
        const matchingContracts = await Contract.find({
          employeeId: new mongoose.Types.ObjectId(empId),
          status: 'Active',
          startDate: { $lte: payrun.periodEnd },
          $or: [{ endDate: null }, { endDate: { $gte: payrun.periodStart } }]
        }).sort({ startDate: 1 });

        if (matchingContracts.length === 0) {
          const otherContracts = await Contract.find({ employeeId: empId });
          if (otherContracts.length > 0) {
            const emp = await Employee.findById(empId);
            const employeeName = emp ? `${emp.firstName} ${emp.lastName}`.trim() : empId.toString();
            const error: any = new Error(
              `Employee ${employeeName} is not eligible for the selected salary structure and payroll period.`
            );
            error.statusCode = 400;
            throw error;
          }
        } else if (matchingContracts.length > 1) {
          const emp = await Employee.findById(empId);
          const employeeName = emp ? `${emp.firstName} ${emp.lastName}`.trim() : empId.toString();
          const hasOverlap = hasAnyOverlappingContracts(matchingContracts);
          const code = hasOverlap ? 'OVERLAPPING_EMPLOYEE_CONTRACTS' : 'MULTIPLE_CONTRACTS_IN_PAYROLL_PERIOD';
          const msg = hasOverlap
            ? `Employee ${employeeName} has overlapping contracts. Resolve the contract dates before processing payroll.`
            : `Employee ${employeeName} has multiple contracts within the selected payroll period. Create separate Payruns for each contract period.`;

          const error: any = new Error(msg);
          error.statusCode = 400;
          error.code = code;
          error.employeeId = empId;
          error.contracts = matchingContracts.map((c) => ({
            _id: c._id,
            startDate: c.startDate,
            endDate: c.endDate,
            wage: c.wage,
            status: c.status
          }));
          throw error;
        } else {
          const contract = matchingContracts[0];
          if (
            !contract.salaryStructureId ||
            contract.salaryStructureId.toString() !== payrun.salaryStructureId.toString()
          ) {
            const emp = await Employee.findById(empId);
            const employeeName = emp ? `${emp.firstName} ${emp.lastName}`.trim() : empId.toString();
            const error: any = new Error(
              `Employee ${employeeName} is not eligible for the selected salary structure and payroll period.`
            );
            error.statusCode = 400;
            throw error;
          }
        }

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
      const error: any = new Error('Cannot modify or recompute a paid payrun');
      error.statusCode = 400;
      throw error;
    }

    if (payrun.status === 'Validated') {
      const error: any = new Error('Cannot recompute a validated payrun');
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

    if (payrun.status === 'Draft' || !payrun.payslipIds || payrun.payslipIds.length === 0) {
      const error: any = new Error('Payrun must be computed and contain generated payslips before it can be validated');
      error.statusCode = 400;
      throw error;
    }

    // Check for critical blocking issues in warnings (e.g. missing contracts)
    const missingContractWarnings = payrun.warnings.filter((w) => w.type === 'MISSING_CONTRACT');
    if (missingContractWarnings.length > 0) {
      const error: any = new Error(
        `Payrun validation failed: ${missingContractWarnings.length} selected employee(s) lack an active contract for the period`
      );
      error.statusCode = 400;
      throw error;
    }

    payrun.status = 'Validated';
    await payrun.save();

    // Update associated payslips status to Validated
    if (mongoose.models.Payslip && payrun.payslipIds && payrun.payslipIds.length > 0) {
      await mongoose.models.Payslip.updateMany(
        { _id: { $in: payrun.payslipIds } },
        { status: 'Validated' }
      );
    }

    return (await Payrun.findById(id)
      .populate('salaryStructureId', 'name code')
      .populate('employeeIds', 'firstName lastName employeeCode email jobPosition')
      .populate('payslipIds')) as IPayrun;
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

    if (payrun.status !== 'Validated') {
      const error: any = new Error('Payrun must be in Validated status before it can be marked as Paid');
      error.statusCode = 400;
      throw error;
    }

    payrun.status = 'Paid';
    await payrun.save();

    // Update associated payslips status to Paid
    if (mongoose.models.Payslip && payrun.payslipIds && payrun.payslipIds.length > 0) {
      await mongoose.models.Payslip.updateMany(
        { _id: { $in: payrun.payslipIds } },
        { status: 'Paid' }
      );
    }

    return (await Payrun.findById(id)
      .populate('salaryStructureId', 'name code')
      .populate('employeeIds', 'firstName lastName employeeCode email jobPosition')
      .populate('payslipIds')) as IPayrun;
  }

  async deletePayrun(id: string): Promise<{ deleted: boolean; payrunId: string; payslipsDeleted: number }> {
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

    // Delete all associated generated payslips for this payrun
    let deletedPayslipCount = 0;
    if (mongoose.models.Payslip) {
      const delResult = await mongoose.models.Payslip.deleteMany({
        $or: [{ payrunId: id }, { _id: { $in: payrun.payslipIds || [] } }]
      });
      deletedPayslipCount = delResult.deletedCount || 0;
    }

    // Delete the payrun itself
    await Payrun.findByIdAndDelete(id);

    return {
      deleted: true,
      payrunId: id,
      payslipsDeleted: deletedPayslipCount
    };
  }
}

export const payrunService = new PayrunService();

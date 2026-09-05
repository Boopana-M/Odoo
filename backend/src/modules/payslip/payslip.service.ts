import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { Payslip, IPayslip, PayslipLine, IPayslipLine } from './payslip.model';
import { Payrun, IPayrun } from '../payrun/payrun.model';
import { SalaryStructure } from '../salary/structure/structure.model';
import { SalaryRule, ISalaryRule } from '../salary/rule/rule.model';
import { Contract, IContract } from '../contracts/contract.model';
import { Employee } from '../employees/employee.model';
import { Attendance } from '../attendance/attendance.model';
import {
  CalculatePayslipDTO,
  UpdatePayslipDTO,
  PayslipFilterQuery,
  evaluateSafeFormula,
  validateCalculatePayslipInput
} from './payslip.validation';
import { AuthUserPayload } from '../../types/express';
import { generatePayslipPdfBuffer } from '../../utils/pdfGenerator';

export class PayslipService {
  /**
   * Selects the contract applicable to the payroll period.
   * Ensures the contract was active during the period, not just the latest created contract.
   */
  async findApplicableContract(
    employeeId: string | mongoose.Types.ObjectId,
    periodStart: Date,
    periodEnd: Date
  ): Promise<IContract | null> {
    const contract = await Contract.findOne({
      employeeId: new mongoose.Types.ObjectId(employeeId),
      status: 'Active',
      startDate: { $lte: periodEnd },
      $or: [{ endDate: null }, { endDate: { $gte: periodStart } }]
    }).sort({ startDate: -1 });

    return contract;
  }

  /**
   * Calculates worked days for an employee during the period from attendance records.
   */
  async getWorkedDays(
    employeeId: string | mongoose.Types.ObjectId,
    periodStart: Date,
    periodEnd: Date
  ): Promise<number> {
    try {
      const attendances = await Attendance.find({
        employeeId: new mongoose.Types.ObjectId(employeeId),
        date: { $gte: periodStart, $lte: periodEnd },
        status: { $ne: 'Absent' }
      });

      if (attendances && attendances.length > 0) {
        // Unique attendance dates
        const dateSet = new Set(
          attendances.map((a) => new Date(a.date).toISOString().split('T')[0])
        );
        return dateSet.size;
      }
    } catch {
      // If attendance lookup fails, fallback to standard business days
    }

    // Default: calculate standard business days between periodStart and periodEnd
    let count = 0;
    const cur = new Date(periodStart);
    while (cur <= periodEnd) {
      const dayOfWeek = cur.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return count > 0 ? count : 22;
  }

  /**
   * Calculates and saves a single employee payslip using the dynamic Salary Rules from the Salary Structure.
   */
  async calculatePayslip(
    employeeIdInput: string | mongoose.Types.ObjectId,
    payrunInput: IPayrun | { _id?: any; salaryStructureId: any; periodStart: Date; periodEnd: Date },
    options: { persist?: boolean } = { persist: true }
  ): Promise<IPayslip> {
    const employeeId = new mongoose.Types.ObjectId(employeeIdInput);
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      const error: any = new Error('Employee not found');
      error.statusCode = 404;
      throw error;
    }

    const periodStart = new Date(payrunInput.periodStart);
    const periodEnd = new Date(payrunInput.periodEnd);

    // 1. Find applicable contract
    const contract = await this.findApplicableContract(employeeId, periodStart, periodEnd);
    if (!contract) {
      const error: any = new Error(
        `No active contract applicable for employee ${employee.firstName} ${employee.lastName} (${employee.employeeCode}) during period ${periodStart.toISOString().split('T')[0]} - ${periodEnd.toISOString().split('T')[0]}`
      );
      error.statusCode = 400;
      throw error;
    }

    // 2. Load Salary Structure
    const salaryStructureId = payrunInput.salaryStructureId;
    const structure = await SalaryStructure.findById(salaryStructureId);
    if (!structure) {
      const error: any = new Error('Referenced salary structure not found');
      error.statusCode = 404;
      throw error;
    }

    // 3. Load active Salary Rules ordered by sequence
    const rules = await SalaryRule.find({
      salaryStructureId: structure._id,
      isActive: true
    }).sort({ sequence: 1, createdAt: 1 });

    if (!rules || rules.length === 0) {
      const error: any = new Error(
        `Salary structure '${structure.name}' contains no active salary rules`
      );
      error.statusCode = 400;
      throw error;
    }

    // 4. Calculate worked days & approved time off
    const workedDays = await this.getWorkedDays(employeeId, periodStart, periodEnd);

    // Dynamic Leave Integration from TimeOffRequest
    let unpaidLeaveDays = 0;
    let paidLeaveDays = 0;
    try {
      if (mongoose.models.TimeOffRequest) {
        const leaves = await mongoose.models.TimeOffRequest.find({
          employeeId,
          status: 'Approved',
          startDate: { $lte: periodEnd },
          endDate: { $gte: periodStart }
        }).populate('timeOffTypeId');

        for (const req of leaves) {
          const tType: any = req.timeOffTypeId;
          if (tType && tType.payrollIntegration === 'Unpaid') {
            unpaidLeaveDays += Number(req.duration) || 0;
          } else {
            paidLeaveDays += Number(req.duration) || 0;
          }
        }
      }
    } catch {
      // Fallback if time-off query encounters error
    }

    // 5. Build calculation context
    const wage = Number(contract.wage) || 0;
    const context: Record<string, number> = {
      WAGE: wage,
      CONTRACT_WAGE: wage,
      WORKED_DAYS: workedDays,
      UNPAID_LEAVES: unpaidLeaveDays,
      PAID_LEAVES: paidLeaveDays,
      TOTAL_LEAVES: unpaidLeaveDays + paidLeaveDays
    };

    let basic = 0;
    let allowances = 0;
    let gross = 0;
    let deductions = 0;
    let net = 0;

    let hasExplicitGross = false;
    let hasExplicitNet = false;

    const lines: any[] = [];

    // 6. Execute rules in sequence
    for (const rule of rules) {
      let calculatedAmount = 0;

      if (rule.computationMethod === 'Fixed') {
        if (rule.amount !== null && rule.amount !== undefined && rule.amount > 0) {
          calculatedAmount = rule.amount;
        } else if (rule.code === 'BASIC' || rule.category === 'Basic') {
          // If fixed rule for Basic has no explicit amount, use contract wage
          calculatedAmount = wage;
        } else {
          calculatedAmount = Number(rule.amount) || 0;
        }
      } else if (rule.computationMethod === 'Percentage') {
        const percentage = Number(rule.percentage) || 0;
        let baseValue = wage;

        if (rule.category === 'Basic') {
          baseValue = wage;
        } else if (rule.category === 'Allowances') {
          baseValue = context['BASIC'] !== undefined ? context['BASIC'] : wage;
        } else if (rule.category === 'Deductions') {
          baseValue =
            context['BASIC'] !== undefined
              ? context['BASIC']
              : context['GROSS'] !== undefined
              ? context['GROSS']
              : wage;
        } else {
          baseValue = context['BASIC'] !== undefined ? context['BASIC'] : wage;
        }

        calculatedAmount = Math.round((baseValue * (percentage / 100) + Number.EPSILON) * 100) / 100;
      } else if (rule.computationMethod === 'Formula') {
        calculatedAmount = evaluateSafeFormula(rule.formulaExpression || '', context);
      }

      calculatedAmount = Math.round((calculatedAmount + Number.EPSILON) * 100) / 100;

      // Store in context for subsequent rules
      context[rule.code] = calculatedAmount;
      context[rule.code.toUpperCase()] = calculatedAmount;

      // Accumulate category totals
      if (rule.category === 'Basic') {
        basic += calculatedAmount;
        context['BASIC'] = basic;
      } else if (rule.category === 'Allowances') {
        allowances += calculatedAmount;
        context['ALLOWANCES'] = allowances;
      } else if (rule.category === 'Gross') {
        gross = calculatedAmount;
        context['GROSS'] = gross;
        hasExplicitGross = true;
      } else if (rule.category === 'Deductions') {
        deductions += calculatedAmount;
        context['DEDUCTIONS'] = deductions;
      } else if (rule.category === 'Net') {
        net = calculatedAmount;
        context['NET'] = net;
        hasExplicitNet = true;
      }

      lines.push({
        salaryRuleId: rule._id,
        name: rule.name,
        code: rule.code,
        category: rule.category,
        sequence: rule.sequence,
        calculatedAmount
      });
    }

    // Auto-calculate Gross / Net if not explicitly computed by a rule
    if (!hasExplicitGross) {
      gross = Math.round((basic + allowances + Number.EPSILON) * 100) / 100;
      context['GROSS'] = gross;
    }

    if (!hasExplicitNet) {
      net = Math.round((gross - deductions + Number.EPSILON) * 100) / 100;
      context['NET'] = net;
    }

    basic = Math.round((basic + Number.EPSILON) * 100) / 100;
    allowances = Math.round((allowances + Number.EPSILON) * 100) / 100;
    gross = Math.round((gross + Number.EPSILON) * 100) / 100;
    deductions = Math.round((deductions + Number.EPSILON) * 100) / 100;
    net = Math.round((net + Number.EPSILON) * 100) / 100;

    const payrunId = payrunInput._id ? new mongoose.Types.ObjectId(payrunInput._id) : null;

    if (!options.persist || !payrunId) {
      // Return unpersisted preview
      return new Payslip({
        employeeId,
        payrunId: payrunId || new mongoose.Types.ObjectId(),
        contractId: contract._id,
        salaryStructureId: structure._id,
        periodStart,
        periodEnd,
        status: 'Computed',
        workedDays,
        basic,
        allowances,
        gross,
        deductions,
        net,
        lines
      });
    }

    // 7. Upsert Payslip to prevent duplicates for same employee and payrun
    let payslip = await Payslip.findOne({ payrunId, employeeId });

    if (payslip) {
      payslip.contractId = contract._id as mongoose.Types.ObjectId;
      payslip.salaryStructureId = structure._id as mongoose.Types.ObjectId;
      payslip.periodStart = periodStart;
      payslip.periodEnd = periodEnd;
      payslip.status = 'Computed';
      payslip.workedDays = workedDays;
      payslip.basic = basic;
      payslip.allowances = allowances;
      payslip.gross = gross;
      payslip.deductions = deductions;
      payslip.net = net;
      payslip.lines = lines;
      await payslip.save();
    } else {
      payslip = await Payslip.create({
        employeeId,
        payrunId,
        contractId: contract._id,
        salaryStructureId: structure._id,
        periodStart,
        periodEnd,
        status: 'Computed',
        workedDays,
        basic,
        allowances,
        gross,
        deductions,
        net,
        lines
      });
    }

    // Synchronize standalone PayslipLine collection documents
    await PayslipLine.deleteMany({ payslipId: payslip._id });
    const lineDocs = lines.map((l) => ({
      ...l,
      payslipId: payslip!._id
    }));
    await PayslipLine.insertMany(lineDocs);

    return (await Payslip.findById(payslip._id)
      .populate('employeeId', 'firstName lastName employeeCode email jobPosition departmentId bankDetails')
      .populate('contractId', 'wage jobPosition startDate endDate')
      .populate('salaryStructureId', 'name code')
      .populate('payrunId', 'name status periodStart periodEnd')) as IPayslip;
  }

  /**
   * Generates or recalculates payslips for all selected employees in a Payrun.
   */
  async generatePayrunPayslips(payrun: IPayrun): Promise<IPayslip[]> {
    if (!payrun.employeeIds || payrun.employeeIds.length === 0) {
      const error: any = new Error('Payrun contains no selected employees');
      error.statusCode = 400;
      throw error;
    }

    const generatedPayslips: IPayslip[] = [];
    const payslipIds: mongoose.Types.ObjectId[] = [];

    for (const empId of payrun.employeeIds) {
      const payslip = await this.calculatePayslip(empId, payrun, { persist: true });
      generatedPayslips.push(payslip);
      payslipIds.push(payslip._id as mongoose.Types.ObjectId);
    }

    // Update Payrun with generated payslip IDs
    payrun.payslipIds = payslipIds;
    payrun.status = 'Computed';
    await payrun.save();

    return generatedPayslips;
  }

  async getAllPayslips(
    filterQuery: PayslipFilterQuery = {},
    currentUser?: AuthUserPayload
  ): Promise<IPayslip[]> {
    const query: Record<string, any> = {};

    // RBAC: Employee can only see their own payslips
    if (currentUser && currentUser.role === 'Employee') {
      let empId = currentUser.employeeId;
      if (!empId && currentUser.email) {
        const emp = await Employee.findOne({ email: currentUser.email.toLowerCase() });
        if (emp) {
          empId = emp._id.toString();
        }
      }

      if (!empId) {
        return [];
      }
      query.employeeId = new mongoose.Types.ObjectId(empId);
    } else if (filterQuery.employeeId) {
      if (mongoose.Types.ObjectId.isValid(filterQuery.employeeId)) {
        query.employeeId = new mongoose.Types.ObjectId(filterQuery.employeeId);
      }
    }

    if (filterQuery.payrunId) {
      if (mongoose.Types.ObjectId.isValid(filterQuery.payrunId)) {
        query.payrunId = new mongoose.Types.ObjectId(filterQuery.payrunId);
      }
    }

    if (filterQuery.status) {
      query.status = filterQuery.status;
    }

    if (filterQuery.periodStart) {
      query.periodStart = { $gte: new Date(filterQuery.periodStart) };
    }

    if (filterQuery.periodEnd) {
      query.periodEnd = { $lte: new Date(filterQuery.periodEnd) };
    }

    return await Payslip.find(query)
      .populate('employeeId', 'firstName lastName employeeCode email jobPosition departmentId')
      .populate('contractId', 'wage jobPosition startDate endDate')
      .populate('salaryStructureId', 'name code')
      .populate('payrunId', 'name status periodStart periodEnd')
      .sort({ createdAt: -1 });
  }

  async getPayslipById(id: string, currentUser?: AuthUserPayload): Promise<IPayslip> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid payslip ID format');
      error.statusCode = 400;
      throw error;
    }

    const payslip = await Payslip.findById(id)
      .populate('employeeId', 'firstName lastName employeeCode email jobPosition departmentId bankDetails')
      .populate('contractId', 'wage jobPosition startDate endDate')
      .populate('salaryStructureId', 'name code')
      .populate('payrunId', 'name status periodStart periodEnd');

    if (!payslip) {
      const error: any = new Error('Payslip not found');
      error.statusCode = 404;
      throw error;
    }

    // RBAC: Employee can only view their own payslip
    if (currentUser && currentUser.role === 'Employee') {
      const empIdStr = payslip.employeeId ? (payslip.employeeId as any)._id?.toString() || payslip.employeeId.toString() : '';
      if (!currentUser.employeeId || currentUser.employeeId.toString() !== empIdStr) {
        const error: any = new Error('Access forbidden: You can only view your own payslips');
        error.statusCode = 403;
        throw error;
      }
    }

    return payslip;
  }

  async generatePayslipPdf(id: string, currentUser?: AuthUserPayload): Promise<Buffer> {
    const payslip = await this.getPayslipById(id, currentUser);

    const empObj: any = payslip.employeeId || {};
    const contractObj: any = payslip.contractId || {};
    const structureObj: any = payslip.salaryStructureId || {};
    const payrunObj: any = payslip.payrunId || {};

    const pdfBuffer = generatePayslipPdfBuffer({
      payslipId: payslip._id.toString(),
      employeeName: `${empObj.firstName || ''} ${empObj.lastName || ''}`.trim() || 'Employee',
      employeeCode: empObj.employeeCode || '',
      jobPosition: empObj.jobPosition || contractObj.jobPosition || '',
      departmentName: empObj.departmentId?.name || '',
      payrunName: payrunObj.name || 'Payroll Batch',
      periodStart: payslip.periodStart ? new Date(payslip.periodStart).toISOString().split('T')[0] : '',
      periodEnd: payslip.periodEnd ? new Date(payslip.periodEnd).toISOString().split('T')[0] : '',
      salaryStructureName: structureObj.name || '',
      workedDays: payslip.workedDays || 0,
      basic: payslip.basic || 0,
      allowances: payslip.allowances || 0,
      gross: payslip.gross || 0,
      deductions: payslip.deductions || 0,
      net: payslip.net || 0,
      status: payslip.status || 'Computed',
      bankAccount: empObj.bankDetails?.accountNumber || empObj.bankDetails?.iban || '',
      lines: (payslip.lines || []).map((l: any) => ({
        name: l.name || '',
        code: l.code || '',
        category: l.category || '',
        calculatedAmount: l.calculatedAmount || 0
      }))
    });

    try {
      const uploadsDir = path.join(process.cwd(), 'uploads', 'payslips');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const filePath = path.join(uploadsDir, `payslip_${id}.pdf`);
      fs.writeFileSync(filePath, pdfBuffer);

      // Save pdfReference relative path
      const refPath = `/uploads/payslips/payslip_${id}.pdf`;
      if (payslip.pdfReference !== refPath) {
        payslip.pdfReference = refPath;
        await payslip.save();
      }
    } catch {
      // If disk write fails, continue serving generated PDF buffer
    }

    return pdfBuffer;
  }

  async getPayslipsByPayrunId(payrunId: string, currentUser?: AuthUserPayload): Promise<IPayslip[]> {
    if (!mongoose.Types.ObjectId.isValid(payrunId)) {
      const error: any = new Error('Invalid payrun ID format');
      error.statusCode = 400;
      throw error;
    }

    return await this.getAllPayslips({ payrunId }, currentUser);
  }

  async updatePayslip(id: string, data: UpdatePayslipDTO): Promise<IPayslip> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid payslip ID format');
      error.statusCode = 400;
      throw error;
    }

    const payslip = await Payslip.findById(id);
    if (!payslip) {
      const error: any = new Error('Payslip not found');
      error.statusCode = 404;
      throw error;
    }

    if (data.status) {
      if (['Draft', 'Computed', 'Validated', 'Paid', 'Cancelled'].includes(data.status)) {
        payslip.status = data.status as any;
      }
    }

    if (data.workedDays !== undefined) {
      payslip.workedDays = Number(data.workedDays) || 0;
    }

    if (data.pdfReference !== undefined) {
      payslip.pdfReference = data.pdfReference;
    }

    if (data.emailStatus !== undefined) {
      payslip.emailStatus = data.emailStatus;
    }

    await payslip.save();

    return (await Payslip.findById(id)
      .populate('employeeId', 'firstName lastName employeeCode email jobPosition departmentId bankDetails')
      .populate('contractId', 'wage jobPosition startDate endDate')
      .populate('salaryStructureId', 'name code')
      .populate('payrunId', 'name status periodStart periodEnd')) as IPayslip;
  }

  async deletePayslip(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error: any = new Error('Invalid payslip ID format');
      error.statusCode = 400;
      throw error;
    }

    const payslip = await Payslip.findById(id);
    if (!payslip) {
      const error: any = new Error('Payslip not found');
      error.statusCode = 404;
      throw error;
    }

    if (payslip.status === 'Paid') {
      const error: any = new Error('Cannot delete a paid payslip');
      error.statusCode = 400;
      throw error;
    }

    await PayslipLine.deleteMany({ payslipId: id });
    await Payslip.findByIdAndDelete(id);

    // Remove payslipId from parent payrun if referenced
    if (payslip.payrunId) {
      await Payrun.findByIdAndUpdate(payslip.payrunId, {
        $pull: { payslipIds: new mongoose.Types.ObjectId(id) }
      });
    }
  }
}

export const payslipService = new PayslipService();

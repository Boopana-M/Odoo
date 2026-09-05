import mongoose from 'mongoose';
import { Payslip } from '../payslip/payslip.model';
import { Payrun } from '../payrun/payrun.model';
import { Employee } from '../employees/employee.model';
import { Department } from '../departments/department.model';
import { Attendance } from '../attendance/attendance.model';
import { TimeOffRequest } from '../timeoff/request/request.model';
import { Contract } from '../contracts/contract.model';

export interface DashboardFilterQuery {
  periodStart?: string | Date;
  periodEnd?: string | Date;
  departmentId?: string;
  employeeType?: string;
}

export class DashboardService {
  /**
   * Helper to resolve matching employee IDs based on department and employeeType filters.
   */
  private async getFilteredEmployeeIds(
    filters: DashboardFilterQuery
  ): Promise<mongoose.Types.ObjectId[] | null> {
    const empQuery: Record<string, any> = {};

    if (filters.departmentId) {
      if (mongoose.Types.ObjectId.isValid(filters.departmentId)) {
        empQuery.departmentId = new mongoose.Types.ObjectId(filters.departmentId);
      }
    }

    if (filters.employeeType) {
      empQuery.employeeType = new RegExp(`^${filters.employeeType.trim()}$`, 'i');
    }

    // If no employee-specific filters, return null to avoid restricting
    if (Object.keys(empQuery).length === 0) {
      return null;
    }

    const employees = await Employee.find(empQuery, { _id: 1 });
    return employees.map((e) => e._id as mongoose.Types.ObjectId);
  }

  /**
   * Builds the MongoDB match query for Payslips based on all filters.
   */
  private async buildPayslipMatchQuery(filters: DashboardFilterQuery): Promise<Record<string, any>> {
    const match: Record<string, any> = {};

    if (filters.periodStart) {
      match.periodStart = { $gte: new Date(filters.periodStart) };
    }

    if (filters.periodEnd) {
      match.periodEnd = { $lte: new Date(filters.periodEnd) };
    }

    const filteredEmployeeIds = await this.getFilteredEmployeeIds(filters);
    if (filteredEmployeeIds !== null) {
      match.employeeId = { $in: filteredEmployeeIds };
    }

    return match;
  }

  /**
   * 1. High-level Summary KPI Metrics
   */
  async getPayrollSummary(filters: DashboardFilterQuery = {}) {
    const matchQuery = await this.buildPayslipMatchQuery(filters);

    // Aggregate payslip metrics
    const payslipAgg = await Payslip.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalGrossSalary: { $sum: '$gross' },
          totalNetSalary: { $sum: '$net' },
          totalBasicSalary: { $sum: '$basic' },
          totalAllowances: { $sum: '$allowances' },
          totalDeductions: { $sum: '$deductions' },
          totalPayslips: { $sum: 1 },
          totalNetSalaryPaid: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Paid'] }, '$net', 0]
            }
          },
          paidPayslipsCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Paid'] }, 1, 0]
            }
          },
          validatedPayslipsCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Validated'] }, 1, 0]
            }
          },
          draftPayslipsCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Draft'] }, 1, 0]
            }
          }
        }
      }
    ]);

    const stats = payslipAgg[0] || {
      totalGrossSalary: 0,
      totalNetSalary: 0,
      totalBasicSalary: 0,
      totalAllowances: 0,
      totalDeductions: 0,
      totalPayslips: 0,
      totalNetSalaryPaid: 0,
      paidPayslipsCount: 0,
      validatedPayslipsCount: 0,
      draftPayslipsCount: 0
    };

    const averageSalary =
      stats.totalPayslips > 0
        ? Math.round(((stats.totalGrossSalary / stats.totalPayslips) + Number.EPSILON) * 100) / 100
        : 0;

    // Count active employees in scope
    const empQuery: Record<string, any> = { status: 'Active' };
    if (filters.departmentId && mongoose.Types.ObjectId.isValid(filters.departmentId)) {
      empQuery.departmentId = new mongoose.Types.ObjectId(filters.departmentId);
    }
    if (filters.employeeType) {
      empQuery.employeeType = new RegExp(`^${filters.employeeType.trim()}$`, 'i');
    }
    const activeEmployeesCount = await Employee.countDocuments(empQuery);
    const totalDepartmentsCount = await Department.countDocuments();

    return {
      totalNetSalaryPaid: Math.round((stats.totalNetSalaryPaid + Number.EPSILON) * 100) / 100,
      totalGrossSalary: Math.round((stats.totalGrossSalary + Number.EPSILON) * 100) / 100,
      totalNetSalary: Math.round((stats.totalNetSalary + Number.EPSILON) * 100) / 100,
      totalBasicSalary: Math.round((stats.totalBasicSalary + Number.EPSILON) * 100) / 100,
      totalAllowances: Math.round((stats.totalAllowances + Number.EPSILON) * 100) / 100,
      totalDeductions: Math.round((stats.totalDeductions + Number.EPSILON) * 100) / 100,
      payslipsGenerated: stats.totalPayslips,
      totalPayslips: stats.totalPayslips,
      paidPayslips: stats.paidPayslipsCount,
      paidPayslipsCount: stats.paidPayslipsCount,
      validatedPayslips: stats.validatedPayslipsCount,
      validatedPayslipsCount: stats.validatedPayslipsCount,
      draftPayslips: stats.draftPayslipsCount,
      draftPayslipsCount: stats.draftPayslipsCount,
      averageSalary,
      avgSalary: averageSalary,
      activeEmployeesCount,
      totalDepartmentsCount
    };
  }

  /**
   * 2. Salary Expenditure by Department
   */
  async getSalaryByDepartment(filters: DashboardFilterQuery = {}) {
    const matchQuery = await this.buildPayslipMatchQuery(filters);

    const result = await Payslip.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'employees',
          localField: 'employeeId',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: '$employee' },
      {
        $lookup: {
          from: 'departments',
          localField: 'employee.departmentId',
          foreignField: '_id',
          as: 'department'
        }
      },
      { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$department._id',
          departmentName: { $first: '$department.name' },
          totalGross: { $sum: '$gross' },
          totalNet: { $sum: '$net' },
          totalBasic: { $sum: '$basic' },
          totalAllowances: { $sum: '$allowances' },
          totalDeductions: { $sum: '$deductions' },
          payslipCount: { $sum: 1 },
          employeeIds: { $addToSet: '$employeeId' }
        }
      },
      {
        $project: {
          _id: 1,
          departmentId: { $ifNull: ['$_id', 'unassigned'] },
          departmentName: { $ifNull: ['$departmentName', 'Unassigned'] },
          totalGross: { $round: ['$totalGross', 2] },
          totalNet: { $round: ['$totalNet', 2] },
          totalBasic: { $round: ['$totalBasic', 2] },
          totalAllowances: { $round: ['$totalAllowances', 2] },
          totalDeductions: { $round: ['$totalDeductions', 2] },
          payslipCount: 1,
          headcount: { $size: '$employeeIds' }
        }
      },
      { $sort: { totalGross: -1 } }
    ]);

    return result;
  }

  /**
   * 3. Monthly Net Salary Trends
   */
  async getMonthlyNetSalaryTrends(filters: DashboardFilterQuery = {}) {
    const matchQuery = await this.buildPayslipMatchQuery(filters);

    const result = await Payslip.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$periodStart' }
          },
          totalNet: { $sum: '$net' },
          totalGross: { $sum: '$gross' },
          totalBasic: { $sum: '$basic' },
          totalAllowances: { $sum: '$allowances' },
          totalDeductions: { $sum: '$deductions' },
          totalPaidNet: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Paid'] }, '$net', 0]
            }
          },
          payslipCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          month: '$_id',
          totalNet: { $round: ['$totalNet', 2] },
          totalGross: { $round: ['$totalGross', 2] },
          totalBasic: { $round: ['$totalBasic', 2] },
          totalAllowances: { $round: ['$totalAllowances', 2] },
          totalDeductions: { $round: ['$totalDeductions', 2] },
          totalPaidNet: { $round: ['$totalPaidNet', 2] },
          payslipCount: 1
        }
      },
      { $sort: { month: 1 } }
    ]);

    return result;
  }

  /**
   * 4. Department Headcount & Distribution
   */
  async getDepartmentHeadcount(filters: DashboardFilterQuery = {}) {
    const empQuery: Record<string, any> = {};

    if (filters.departmentId && mongoose.Types.ObjectId.isValid(filters.departmentId)) {
      empQuery.departmentId = new mongoose.Types.ObjectId(filters.departmentId);
    }

    if (filters.employeeType) {
      empQuery.employeeType = new RegExp(`^${filters.employeeType.trim()}$`, 'i');
    }

    // By Department
    const byDepartment = await Employee.aggregate([
      { $match: empQuery },
      {
        $lookup: {
          from: 'departments',
          localField: 'departmentId',
          foreignField: '_id',
          as: 'department'
        }
      },
      { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$department._id',
          departmentName: { $first: '$department.name' },
          activeCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] }
          },
          totalCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          departmentId: { $ifNull: ['$_id', 'unassigned'] },
          departmentName: { $ifNull: ['$departmentName', 'Unassigned'] },
          activeCount: 1,
          totalCount: 1
        }
      },
      { $sort: { totalCount: -1 } }
    ]);

    // By Employee Type
    const byType = await Employee.aggregate([
      { $match: empQuery },
      {
        $group: {
          _id: '$employeeType',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          type: { $ifNull: ['$_id', 'Unspecified'] },
          count: 1
        }
      },
      { $sort: { count: -1 } }
    ]);

    const totalHeadcount = await Employee.countDocuments(empQuery);

    return {
      totalHeadcount,
      byDepartment,
      byType
    };
  }

  /**
   * 5. Attendance Health & Time Off Overview
   */
  async getAttendanceTimeOffOverview(filters: DashboardFilterQuery = {}) {
    const filteredEmployeeIds = await this.getFilteredEmployeeIds(filters);

    // Attendance query
    const attQuery: Record<string, any> = {};
    if (filters.periodStart || filters.periodEnd) {
      attQuery.date = {};
      if (filters.periodStart) attQuery.date.$gte = new Date(filters.periodStart);
      if (filters.periodEnd) attQuery.date.$lte = new Date(filters.periodEnd);
    }
    if (filteredEmployeeIds !== null) {
      attQuery.employeeId = { $in: filteredEmployeeIds };
    }

    const attendanceAgg = await Attendance.aggregate([
      { $match: attQuery },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          presentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] }
          },
          overtimeCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Overtime'] }, 1, 0] }
          },
          lateCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] }
          },
          absentCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] }
          },
          halfDayCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Half Day'] }, 1, 0] }
          },
          missingCheckoutCount: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$status', 'Missing check-out'] },
                    { $eq: [{ $ifNull: ['$checkOut', null] }, null] }
                  ]
                },
                1,
                0
              ]
            }
          },
          manualEditCount: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$isCorrected', true] },
                    { $eq: ['$status', 'Manual edits'] }
                  ]
                },
                1,
                0
              ]
            }
          },
          overtimeHours: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'Overtime'] },
                '$workedHours',
                0
              ]
            }
          },
          totalWorkedHours: { $sum: '$workedHours' }
        }
      }
    ]);

    const attStats = attendanceAgg[0] || {
      totalRecords: 0,
      presentCount: 0,
      overtimeCount: 0,
      lateCount: 0,
      absentCount: 0,
      halfDayCount: 0,
      missingCheckoutCount: 0,
      manualEditCount: 0,
      overtimeHours: 0,
      totalWorkedHours: 0
    };

    const productiveRecords =
      attStats.presentCount + attStats.overtimeCount + attStats.lateCount + (attStats.halfDayCount || 0);
    const attendanceRate =
      attStats.totalRecords > 0
        ? Math.round(((productiveRecords / attStats.totalRecords) * 100 + Number.EPSILON) * 100) / 100
        : 100;

    // Time off query
    const timeOffQuery: Record<string, any> = {};
    if (filters.periodStart || filters.periodEnd) {
      timeOffQuery.startDate = {};
      if (filters.periodStart) timeOffQuery.startDate.$lte = new Date(filters.periodEnd || '2099-12-31');
      if (filters.periodEnd) timeOffQuery.endDate = { $gte: new Date(filters.periodStart || '1970-01-01') };
    }
    if (filteredEmployeeIds !== null) {
      timeOffQuery.employeeId = { $in: filteredEmployeeIds };
    }

    const timeOffAgg = await TimeOffRequest.aggregate([
      { $match: timeOffQuery },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          approvedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] }
          },
          pendingCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
          },
          refusedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Refused'] }, 1, 0] }
          },
          approvedDays: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Approved'] }, '$duration', 0]
            }
          },
          pendingDays: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Pending'] }, '$duration', 0]
            }
          }
        }
      }
    ]);

    const timeOffStats = timeOffAgg[0] || {
      totalRequests: 0,
      approvedCount: 0,
      pendingCount: 0,
      refusedCount: 0,
      approvedDays: 0,
      pendingDays: 0
    };

    const roundedApprovedDays = Math.round((timeOffStats.approvedDays + Number.EPSILON) * 100) / 100;
    const roundedOvertimeHours = Math.round((attStats.overtimeHours + Number.EPSILON) * 100) / 100;
    const roundedWorkedHours = Math.round((attStats.totalWorkedHours + Number.EPSILON) * 100) / 100;

    return {
      attendanceHealth: attendanceRate,
      approvedTimeOffDays: roundedApprovedDays,
      pendingTimeOffRequests: timeOffStats.pendingCount,
      presentCount: attStats.presentCount,
      lateCount: attStats.lateCount,
      absentCount: attStats.absentCount,
      halfDayCount: attStats.halfDayCount || 0,
      missingCheckoutCount: attStats.missingCheckoutCount || 0,
      manualEditCount: attStats.manualEditCount || 0,
      overtimeHours: roundedOvertimeHours,
      totalWorkedHours: roundedWorkedHours,
      attendance: {
        totalRecords: attStats.totalRecords,
        presentCount: attStats.presentCount,
        overtimeCount: attStats.overtimeCount,
        lateCount: attStats.lateCount,
        absentCount: attStats.absentCount,
        halfDayCount: attStats.halfDayCount || 0,
        missingCheckoutCount: attStats.missingCheckoutCount || 0,
        manualEditCount: attStats.manualEditCount || 0,
        overtimeHours: roundedOvertimeHours,
        totalWorkedHours: roundedWorkedHours,
        attendanceRate
      },
      timeOff: {
        totalRequests: timeOffStats.totalRequests,
        approvedCount: timeOffStats.approvedCount,
        pendingCount: timeOffStats.pendingCount,
        refusedCount: timeOffStats.refusedCount,
        approvedDays: roundedApprovedDays,
        pendingDays: Math.round((timeOffStats.pendingDays + Number.EPSILON) * 100) / 100
      }
    };
  }

  /**
   * 6. Operational Payroll Alerts
   */
  async getPayrollAlerts(filters: DashboardFilterQuery = {}) {
    const alerts: Array<{
      level: 'INFO' | 'WARNING' | 'CRITICAL';
      type: string;
      title: string;
      message: string;
      count?: number;
    }> = [];

    // Check draft / unvalidated payruns
    const pendingPayruns = await Payrun.countDocuments({
      status: { $in: ['Draft', 'Computed', 'Validated'] }
    });
    if (pendingPayruns > 0) {
      alerts.push({
        level: 'WARNING',
        type: 'UNPAID_PAYRUNS',
        title: 'Pending Pay Runs',
        message: `${pendingPayruns} pay run(s) are awaiting finalization or payment.`,
        count: pendingPayruns
      });
    }

    // Check employees missing bank accounts
    const empMissingBank = await Employee.countDocuments({
      status: 'Active',
      $or: [
        { bankDetails: null },
        { 'bankDetails.accountNumber': { $in: [null, ''] } }
      ]
    });
    if (empMissingBank > 0) {
      alerts.push({
        level: 'CRITICAL',
        type: 'MISSING_BANK_DETAILS',
        title: 'Missing Bank Details',
        message: `${empMissingBank} active employee(s) lack bank account details for direct disbursement.`,
        count: empMissingBank
      });
    }

    // Check employees without active contracts
    const activeEmployees = await Employee.find({ status: 'Active' }, { _id: 1 });
    const activeEmpIds = activeEmployees.map((e) => e._id);
    const contracts = await Contract.find(
      { employeeId: { $in: activeEmpIds }, status: 'Active' },
      { employeeId: 1 }
    );
    const contractedEmpIds = new Set(contracts.map((c) => c.employeeId.toString()));
    const uncontractedCount = activeEmpIds.filter((id) => !contractedEmpIds.has(id.toString())).length;

    if (uncontractedCount > 0) {
      alerts.push({
        level: 'CRITICAL',
        type: 'MISSING_CONTRACTS',
        title: 'Active Employees Without Contracts',
        message: `${uncontractedCount} active employee(s) do not have an active employment contract.`,
        count: uncontractedCount
      });
    }

    // Check pending leave requests
    const pendingLeaves = await TimeOffRequest.countDocuments({ status: 'Pending' });
    if (pendingLeaves > 0) {
      alerts.push({
        level: 'INFO',
        type: 'PENDING_TIMEOFF',
        title: 'Pending Time Off Requests',
        message: `${pendingLeaves} time off request(s) are awaiting managerial approval.`,
        count: pendingLeaves
      });
    }

    return alerts;
  }

  /**
   * 7. Full Unified Dashboard
   */
  async getFullDashboard(filters: DashboardFilterQuery = {}) {
    const [
      summary,
      salaryByDepartment,
      monthlyNetSalary,
      headcount,
      attendanceTimeOff,
      alerts
    ] = await Promise.all([
      this.getPayrollSummary(filters),
      this.getSalaryByDepartment(filters),
      this.getMonthlyNetSalaryTrends(filters),
      this.getDepartmentHeadcount(filters),
      this.getAttendanceTimeOffOverview(filters),
      this.getPayrollAlerts(filters)
    ]);

    return {
      summary,
      salaryByDepartment,
      monthlyNetSalary,
      headcount,
      attendanceTimeOff,
      alerts
    };
  }
}

export const dashboardService = new DashboardService();

# PeoplePay360 — Application Flow

## 1. Main navigation

The application starts with the main HR navigation:

Employees | Contracts | Attendance | Time Off | Payroll | Reports

The Employee module is the main starting point for employee-related work.

---

## 2. Employee flow

### Employee list

User opens Employees and can use:

- Kanban view.
- List view.
- Form view.

### Employee form

The employee record shows the main employee information:

- Department.
- Manager.
- Working Schedule.
- Job Position.
- Status.
- Employee Type.

The form also provides direct links to:

- Contracts.
- Attendance.
- Time Off.

---

## 3. Contract flow

Employee → Contracts → Contract Form

A contract contains the employee's employment terms for a specific period.

The contract includes:

- Start date.
- End date.
- Department.
- Job Position.
- Wage.
- Salary Structure.
- Status.

Historical contracts remain available.

When payroll is calculated, the system selects the contract that applies to the Payrun period.

---

## 4. Working Schedule flow

Working Schedules → Create / Edit Schedule

The user defines the weekly pattern:

Day → Start → End → Break

The system calculates total weekly hours from the configured pattern.

The schedule can then be assigned to an employee or contract.

---

## 5. Attendance flow

Employee / Attendance → Attendance Record

An attendance record contains:

- Employee.
- Check-in.
- Check-out.
- Worked hours.

The system can also show attendance exceptions and authorized corrections.

Attendance contributes to the employee's payroll context and dashboard information.

---

## 6. Time Off flow

### Step 1 — Configure Time Off Type

Time Off → Types

Configure:

- Unit: Days or Hours.
- Allocation requirement.
- Approval workflow.
- Payroll integration.

### Step 2 — Create Allocation

Time Off → Allocations

Select the employee and Time Off Type, then enter the allocation and validity period.

The allocation must be approved before the balance becomes available.

### Step 3 — Create Request

Time Off → Requests

The request contains:

- Employee.
- Time Off Type.
- Dates.
- Duration.
- Status.

### Step 4 — Approval

HR user reviews the request.

Possible request outcome:

- Approved.
- Refused.

When approved, the request deducts its duration from the applicable allocation.

---

## 7. Salary Structure flow

Salary Structures → Structure

A Salary Structure contains the Salary Rules used for payroll.

The structure controls:

- Which rules are included.
- Rule execution order.
- Active status.

A structure can be used by multiple employees through their contracts.

---

## 8. Salary Rule flow

Salary Structure → Salary Rules

Each rule contains:

- Name.
- Code.
- Category.
- Sequence.
- Computation method.

The computation method can be:

- Fixed.
- Percentage.
- Formula.

Rules run in sequence.

For example, a deduction rule can depend on an amount calculated by an earlier rule.

The actual rule result must be used in the Payslip calculation.

---

## 9. Payrun creation flow

Payroll → Payruns → New

Clicking New opens the Payrun setup wizard.

### Step 1 — Setup

User selects:

- Salary Structure.
- Period.

Click Continue.

**No Payrun is created yet.**

### Step 2 — Employee selection

The system shows eligible employees.

User can filter the list and explicitly select employees.

Click Create Payrun.

The backend now creates the Payrun with:

- Selected Salary Structure.
- Selected Period.
- Selected employees.

Only the selected employees are included.

### Salary Structure rule

One Payrun uses **one Salary Structure**.

If employees need another Salary Structure, create another Payrun for that structure.

---

## 10. Payrun processing flow

Payrun → Processing View

The Payrun shows:

- Run name.
- Salary Structure.
- Period.
- Status.
- Payslip summary.

Main actions:

1. Compute.
2. Review.
3. Validate.
4. Mark Paid.
5. Send Payslips.

---

## 11. Payslip generation flow

When Compute is run:

For each selected employee:

1. Find the contract applicable to the Payrun period.
2. Use the Salary Structure assigned to the Payrun.
3. Load its Salary Rules.
4. Execute rules in sequence.
5. Calculate the Payslip values.
6. Generate the Payslip breakdown.

The Payslip contains:

- Employee.
- Structure.
- Payrun.
- Period.
- Worked Days.
- Basic.
- Allowances.
- Gross.
- Deductions.
- Net.

---

## 12. Payroll warnings

Before finalization, the Payrun should check for issues such as:

- Missing bank details.
- Duplicate Payslips.
- Missing required employee information.
- Contract attention for the selected period.

The payroll user reviews these warnings before continuing.

---

## 13. Validate and pay

After review:

Payrun → Validate

The payroll data is finalized.

Then:

Payrun → Mark Paid

The Payrun and its Payslips remain available as historical payroll records.

---

## 14. Payslip PDF and email

### Individual PDF

Open a Payslip → Print Payslip

The system creates a printable PDF.

### Bulk email

Open a Payrun → Send Payslips

The system sends the generated Payslips to the selected employees using their stored email information.

---

## 15. Dashboard flow

Payroll Dashboard

The dashboard reads live information from:

- Employees.
- Contracts.
- Attendance.
- Time Off.
- Payroll.

Filters:

- Period.
- Department.
- Employee Type.

The dashboard displays:

### KPIs

- Total Net Salary Paid.
- Payslips Generated.
- Average Salary.
- Approved Time Off.
- Attendance Health.

### Charts

- Salary Cost by Department.
- Monthly Net Salary Trends.

### Operational information

- Payroll status.
- Missing information.
- Duplicate payslip warnings.
- Contract attention.
- Attendance overview.
- Time Off overview.
- Department headcount.
- Salary expenditure.

---

## 16. End-to-end flow

### Payroll scenario

Employee  
↓  
Contract  
↓  
Working Schedule  
↓  
Attendance / Time Off  
↓  
Salary Structure  
↓  
Salary Rules  
↓  
Payrun Setup  
↓  
Employee Selection  
↓  
Payslip Generation  
↓  
Review / Warnings  
↓  
Validate  
↓  
Mark Paid  
↓  
PDF / Bulk Email  
↓  
Dashboard

### Time Off scenario

Time Off Type  
↓  
Allocation  
↓  
Allocation Approval  
↓  
Available Balance  
↓  
Time Off Request  
↓  
Request Approval  
↓  
Allocation Deduction  
↓  
Updated Remaining Balance


---

## 17. Technology stack

- Frontend: React + JavaScript
- Backend: Node.js + Express + TypeScript
- Database: MongoDB

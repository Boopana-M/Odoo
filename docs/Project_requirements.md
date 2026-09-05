# PeoplePay360 — Project Requirements

## 1. Project overview

PeoplePay360 is an HR and Payroll platform built around the employee record.

The main goal is to connect the normal HR work with payroll instead of treating each module as a separate CRUD screen.

The main flow is:

Employee → Contract / Schedule → Attendance / Time Off → Salary Structure / Rules → Payrun → Payslip → Dashboard

The system should support the full flow with real records and business logic.

---

## 2. Main modules

### 2.1 Employees

The Employee module should provide:

- Kanban, List and Form views.
- Employee profile information.
- Department.
- Manager.
- Working Schedule.
- Job Position.
- Employee Status.
- Employee Type.
- Links to related Contracts, Attendance and Time Off records.

The employee form acts as the main HR hub.

---

### 2.2 Contracts

Contracts are linked to employees and must support historical contracts.

The system should show:

- Contract dates.
- Wage.
- Status.
- Department.
- Job Position.
- Salary Structure.

Payroll must use the contract that is applicable to the selected payroll period.

The system should also prevent or flag overlapping active contracts for the same employee.

---

### 2.3 Working Schedules

Working Schedules should support:

- Schedule name.
- Schedule type.
- Weekly hours.
- Weekly working pattern.
- Day.
- Start time.
- End time.
- Break time.

Weekly hours should be calculated automatically from the weekly pattern.

A schedule can be assigned to employees or contracts.

---

### 2.4 Attendance

Attendance should handle:

- Check-in.
- Check-out.
- Worked hours.
- Attendance corrections.
- Attendance exceptions.

Authorized users should be able to correct attendance records.

Attendance information should be available from the employee and dashboard views.

---

### 2.5 Time Off

Time Off should contain:

- Requests.
- Allocations.
- Time Off Types.

Time Off Types define:

- Whether the unit is days or hours.
- Whether allocation is required.
- Approval workflow.
- Payroll integration.

Allocations should be approved before the allocated balance becomes available.

The system should track:

- Allocated amount.
- Taken amount.
- Remaining amount.
- Validity period.

Approved Time Off Requests should automatically deduct from the related allocation.

Requests should show:

- Employee.
- Time Off Type.
- Dates.
- Duration.
- Status.

HR users should be able to approve or refuse requests.

---

## 3. Salary Structures and Salary Rules

### 3.1 Salary Structures

A Salary Structure is a container for the Salary Rules used during payroll calculation.

It should support:

- Structure name.
- Active status.
- Included salary rules.
- Rule execution sequence.
- Number of rules.
- Number of employees using the structure.

The selected Salary Structure controls which rules are used to calculate payslips.

### 3.2 Salary Rules

Salary Rules should support:

- Name.
- Code.
- Category.
- Sequence.
- Computation method.

Supported computation methods:

- Fixed amount.
- Percentage.
- Formula.

Salary Rule categories include:

- Basic.
- Allowances.
- Gross.
- Deductions.
- Net.

Rules must be executed in sequence because later rules can depend on earlier results.

Salary Rules must actively drive payslip calculations. They must not be static data shown only in the UI.

---

## 4. Payruns

A Payrun is the payroll batch for a specific period and selected employees.

Creating a Payrun must use a two-step flow.

### Step 1 — Payrun setup

The user selects:

- Salary Structure.
- Payroll Period.

Clicking Continue should move to employee selection without creating the Payrun yet.

### Step 2 — Employee selection

The user can:

- Filter eligible employees.
- Select the employees to include.
- Create the Payrun with the selected employees only.

### Salary Structure decision

PeoplePay360 will use **one Salary Structure per Payrun**.

If employees need different Salary Structures, they should be processed in separate Payruns.

This keeps the workflow aligned with the project flow where the Payrun selects a Salary Structure and the generated Payslips use that structure.

---

## 5. Payslips

A Payslip belongs to a Payrun and an employee.

It should contain:

- Employee.
- Salary Structure.
- Payrun.
- Payroll Period.
- Status.
- Worked Days.
- Basic.
- Allowances.
- Deductions.
- Gross.
- Net.

The calculation must use:

1. The employee's contract applicable to the payroll period.
2. The Salary Structure selected for the Payrun.
3. The Salary Rules included in that structure.

Payslips should support:

- Compute.
- Review.
- Validate.
- Mark Paid.
- Print Payslip as PDF.

The parent Payrun should provide a bulk Send Payslips action.

Warnings should be shown before finalization when required information is missing or duplicate payslips are detected.

---

## 6. Payroll actions

A Payrun should provide these actions:

- Compute.
- Validate.
- Mark Paid.
- Send Payslips.

The Payrun should display:

- Run name.
- Salary Structure.
- Period.
- Status.
- Payslip summary.

Finalized and paid Payruns must remain available as payroll history.

---

## 7. Dashboard

The Payroll Dashboard should use live data from:

- Employees.
- Contracts.
- Attendance.
- Time Off.
- Payroll.

Dashboard filters:

- Period.
- Department.
- Employee Type.

Main KPIs:

- Total Net Salary Paid.
- Payslips Generated.
- Average Salary.
- Approved Time Off.
- Attendance Health.

Charts:

- Salary Cost by Department.
- Monthly Net Salary Trends.

The dashboard should also show useful operational information such as:

- Payroll status.
- Missing required information.
- Duplicate payslip warnings.
- Contract attention.
- Attendance overview.
- Time Off overview.
- Department headcount.
- Salary expenditure.

Dashboard values must be calculated from actual records, not hardcoded values.

---

## 8. User roles

### Employee

Can:

- View own employee details.
- View own attendance.
- View leave balances.
- Create attendance entries.
- Create Time Off Requests.

Cannot access HR administration or payroll management.

### HR Manager

Can manage:

- Employees.
- Attendance.
- Contracts.
- Working Schedules.
- Time Off.

Can approve or refuse Time Off Requests.

Does not manage payroll.

### HR Payroll User

Has HR Manager permissions plus:

- Create Payruns.
- Read Payruns.
- Update Payruns.
- Create Payslips.
- Read Payslips.
- Update Payslips.
- Read Salary Structures.
- Read Salary Rules.

### HR Payroll Manager

Has HR Payroll User permissions plus full management of:

- Payruns.
- Payslips.
- Salary Structures.
- Salary Rules.

### Admin

Has full access to all modules and models, including:

- User management.
- Role management.
- Permission updates.
- Full administration.

---

## 9. Frontend navigation

Main navigation:

- Employees
- Contracts
- Attendance
- Time Off
- Payroll
- Reports

The Employee Form should provide direct access to related HR records.

Time Off Requests should be created from:

Time Off → Requests

---

## 10. End-to-end scenarios

The finished application must support at least these connected scenarios for the project walkthrough:

### Scenario 1 — Employee to Payslip

Employee → Contract → Salary Structure / Rules → Attendance → Payrun → Payslip → Validate → Paid → PDF / Email

### Scenario 2 — Leave Allocation to Request

Time Off Type → Allocation → Approval → Available Balance → Time Off Request → Approval → Allocation Deduction

The system should show the relationship between the records throughout the flow.


---

## 11. Technology stack

The project implementation will use the MERN stack:

- Frontend: React + JavaScript
- Backend: Node.js + Express + TypeScript
- Database: MongoDB

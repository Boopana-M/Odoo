# PeoplePay360 — HR & Payroll

An integrated HR and Payroll operations platform for managing employees, contracts, working schedules, attendance, time off, salary structures, salary rules, payruns, payslips, and payroll reporting.

## Workflow

```text
Employee
│
├── Contract
├── Working Schedule
├── Attendance
└── Time Off
│
↓
Payroll Period
│
↓
Payrun
│
├── Salary Structure
│   └── Salary Rules
│
↓
Payslip
│
├── Validate
├── Mark Paid
├── PDF
└── Email
│
↓
Dashboard
```

## Project Goal

Build a connected HR and Payroll workflow instead of separate CRUD modules.

The main flow is:

**Employee → Contract & Working Schedule → Attendance / Time Off → Salary Structure & Rules → Payrun → Payslip → PDF / Email**

The system should use the employee record as the central hub and maintain the relationships between HR and payroll data.

## Core Modules

### Employees

- Employee profiles
- Department, manager, job position, schedule, and status
- Kanban, List, and Form views
- Access to related Contracts, Attendance, Time Off, and Allocations

### Contracts

- Historical contracts linked to employees
- Contract dates, wage, department, position, and salary structure
- Active contract identification
- Payroll must use the contract applicable to the selected payroll period
- Prevent concurrent active contracts for the same payroll period

### Working Schedules

- Weekly working patterns
- Day, start time, end time, and break
- Automatic calculation of weekly hours
- Assignment to employees or contracts

### Attendance

- Check-in and check-out
- Worked hours
- Attendance status and exceptions
- Authorized manual corrections
- Attendance data available for payroll and dashboard reporting

### Time Off

- Configurable Time Off Types
- Allocations and leave balances
- Time Off Requests
- Approval/refusal workflow
- Units of days or hours
- Approved requests reduce the relevant allocation balance automatically

### Salary Structures

- Structures containing Salary Rules
- Active status and related rule information
- Rule execution sequence
- The selected structure determines the rules used for payslip calculation

### Salary Rules

- Salary components such as Basic, Allowances, Gross, Deductions, and Net
- Rule name, code, category, and sequence
- Fixed amount, percentage, and formula-based calculations
- Rules execute in sequence so later rules can depend on earlier calculations

### Payruns

- Create a Payrun through a two-step flow
- Step 1: select Salary Structure and payroll Period
- Step 2: select eligible employees
- Generate payslips for the selected employees
- Processing actions: Compute, Validate, Mark Paid, and Send Payslips
- Show payroll warnings before finalization
- Preserve finalized/paid Payruns as historical records

### Payslips

- Employee, Salary Structure, Payrun, Period, Status, and Worked Days
- Breakdown of Basic, Allowances, Deductions, Gross, and Net
- Calculation uses the applicable contract and Payrun's assigned Salary Structure
- Generate individual payslip PDFs
- Support bulk email delivery from the Payrun

### Payroll Dashboard

- Live data from Employees, Contracts, Attendance, Time Off, and Payroll
- Filters by Period, Department, and Employee Type
- KPIs including Total Net Salary Paid, Payslips Generated, Average Salary, Approved Time Off, and Attendance Health
- Salary Cost by Department
- Monthly Net Salary Trends
- Payroll and data-quality warnings
- Attendance and Time Off overviews
- Department headcount and salary expenditure

## User Roles

| Role | Access |
|---|---|
| Employee | View own employee details, attendance, and leave balances; create attendance entries and Time Off Requests |
| HR Manager | Full HR access to Employees, Attendance, Contracts, Working Schedules, and Time Off; approve/refuse Time Off Requests; no payroll access |
| HR Payroll User | HR Manager permissions plus Create/Read/Update access to Payruns and Payslips; read-only Salary Structures and Salary Rules |
| HR Payroll Manager | HR Payroll User permissions plus full CRUD access to Payruns, Payslips, Salary Structures, and Salary Rules |
| Admin | Full system access, user management, role assignment, permission updates, and administration |

## Payroll Flow

1. Select Salary Structure and payroll Period.
2. Select eligible employees.
3. Create the Payrun.
4. Compute payslips using the applicable contract and salary rules.
5. Review salary breakdowns and warnings.
6. Validate the Payrun.
7. Mark the Payrun as Paid.
8. Generate PDF payslips and send them to employees.

## Important Business Rules

- Contract selection must be based on the payroll period.
- Historical contracts must be preserved.
- Working schedule hours must be calculated automatically.
- Approved Time Off must update leave balances.
- Salary Rules must actually drive payslip calculations.
- Salary Rules must execute in their defined sequence.
- Duplicate payslips and incomplete required employee information should be identified before finalization.
- Dashboard values must come from live system data.
- Role permissions must be enforced for the different user roles.
- Finalized and paid payroll batches must remain available as historical records.

## Technology Stack

- **Frontend:** React + JavaScript
- **Backend:** Node.js + Express.js + TypeScript
- **Database:** MongoDB
- **ODM:** Mongoose

Additional libraries/services will be added only where required for authentication, PDF generation, email delivery, validation, and dashboard charts.

## Demo Scenarios

The final system should support an end-to-end demonstration of:

### 1. Employee → Payslip

- Employee and contract
- Working/attendance information
- Salary structure and rules
- Payrun creation
- Payslip computation and validation
- PDF generation / delivery

### 2. Leave Allocation → Time Off Request

- Time Off Type
- Allocation
- Employee request
- Approval
- Automatic balance update

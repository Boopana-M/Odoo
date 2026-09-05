# PeoplePay360 — Technical Requirements

## 1. Technology stack

The project will use the MERN stack:

- **Frontend:** React + JavaScript
- **Backend:** Node.js + Express + TypeScript
- **Database:** MongoDB
- **ODM:** Mongoose

The implementation should stay focused on the business flow from the project requirements.

---

## 2. General technical requirements

- Business rules must be implemented in the application logic.
- Important calculations must not be hardcoded only for the demo.
- Salary Rules must drive the actual Payslip calculation.
- Dashboard values must come from live database records.
- Historical payroll records must remain available after a Payrun is finalized or paid.
- Role permissions must be enforced by the backend, not only hidden in the frontend.
- Validation should happen before payroll finalization.
- The system should detect incomplete employee information and duplicate payslips where required by the workflow.

---

## 3. Frontend requirements

The React application should provide navigation for:

- Employees
- Contracts
- Attendance
- Time Off
- Payroll
- Reports

Required UI areas:

- Employee List / Kanban / Form.
- Contract List / Form.
- Attendance List / Form.
- Time Off Requests.
- Time Off Allocations.
- Time Off Types.
- Working Schedules.
- Salary Structures.
- Salary Rules.
- Payrun setup wizard.
- Payrun processing view.
- Payslip view.
- Payroll Dashboard.

The Employee Form should work as the operational hub and provide links to related records.

---

## 4. Payrun wizard

The Payrun creation flow must be handled as a two-step frontend flow.

### Step 1

Collect:

- Salary Structure.
- Period.

Do not create the Payrun at this point.

### Step 2

Show eligible employees and allow explicit selection.

Only after the user confirms the selection should the backend create the Payrun and initialize its Payslips.

Only one Salary Structure is selected for one Payrun.

---

## 5. Backend business logic

### Contract selection

When calculating a Payslip, the backend must find the employee contract applicable to the selected payroll period.

The system must not simply use the employee's latest contract.

Overlapping active contracts should be detected and prevented or flagged.

### Salary calculation

The backend should:

1. Load the Payrun.
2. Load its Salary Structure.
3. Load the structure's Salary Rules.
4. Order rules by sequence.
5. Load the employee's applicable contract.
6. Calculate each rule.
7. Build the Payslip breakdown.
8. Calculate totals such as Basic, Allowances, Gross, Deductions and Net.

Supported rule methods:

- Fixed.
- Percentage.
- Formula.

The result must be stored as a Payslip that can be reviewed later.

### Time Off calculation

When a Time Off Request is approved:

- Check the employee's available allocation.
- Deduct the approved duration from the applicable allocation.
- Update taken and remaining values.

An allocation should not become available before its required approval.

### Working Schedule

Weekly hours should be calculated from the configured daily schedule entries instead of manually entered as an unrelated value.

### Attendance

Worked hours should be based on check-in and check-out information.

Authorized corrections should be recorded so the attendance record remains understandable.

---

## 6. Payroll validation and warnings

Before a Payrun is finalized, the backend should check for required issues mentioned in the project requirements, including:

- Missing bank details.
- Duplicate payslips.
- Missing required employee information.
- Contract issues for the payroll period.

Warnings should be visible to the payroll user before finalization.

---

## 7. RBAC

The backend should implement the five project roles:

- Employee
- HR Manager
- HR Payroll User
- HR Payroll Manager
- Admin

Permissions should follow the project requirements.

For example:

- Employee users should only access their own permitted HR information.
- HR Manager should not access payroll management.
- HR Payroll User can process Payruns and Payslips but has read-only access to Salary Structures and Salary Rules.
- HR Payroll Manager can manage payroll configuration.
- Admin has full access.

Frontend visibility can improve UX, but backend authorization remains the final permission check.

---

## 8. API structure

The API can be organized by business module:

- `/api/auth`
- `/api/users`
- `/api/employees`
- `/api/departments`
- `/api/contracts`
- `/api/schedules`
- `/api/attendances`
- `/api/time-off/types`
- `/api/time-off/allocations`
- `/api/time-off/requests`
- `/api/salary-structures`
- `/api/salary-rules`
- `/api/payruns`
- `/api/payslips`
- `/api/dashboard`

Exact endpoint names can be adjusted during implementation as long as the business operations remain the same.

---

## 9. PDF and email

The system must support:

- Printing an individual Payslip as a PDF.
- Sending Payslips in bulk from the Payrun.

The email action should use the employee's stored email information.

---

## 10. Dashboard data

Dashboard calculations should query actual records and apply the selected filters:

- Period.
- Department.
- Employee Type.

The dashboard should update its KPIs, charts and operational summaries from the filtered data.

No static/demo-only values should be used for the final dashboard.

---

## 11. Data integrity

The backend should maintain the relationships between:

Employee → Contract → Salary Structure → Salary Rules → Payrun → Payslip

and

Employee → Time Off Type → Allocation → Request

The application should validate related records before creating or finalizing payroll data.

Payroll history should not depend on changing the current employee profile or current contract to understand what happened in a previous Payrun.

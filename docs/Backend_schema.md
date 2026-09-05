# PeoplePay360 — Backend Schema

## 1. Database

Database: **MongoDB**

ODM: **Mongoose**

The schema below is designed around the project relationships and the required payroll flow.

---

## 2. Users

Collection: `users`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `name` | String | User name |
| `email` | String | Login / contact email |
| `passwordHash` | String | Stored password hash |
| `role` | Enum | Employee, HR Manager, HR Payroll User, HR Payroll Manager, Admin |
| `employeeId` | ObjectId | Reference to employee when applicable |
| `isActive` | Boolean | User status |
| `createdAt` | Date | Timestamp |
| `updatedAt` | Date | Timestamp |

---

## 3. Departments

Collection: `departments`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `name` | String | Department name |
| `createdAt` | Date | Timestamp |
| `updatedAt` | Date | Timestamp |

Departments are used by Employees, Contracts and Dashboard filters.

---

## 4. Employees

Collection: `employees`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `employeeCode` | String | Employee reference |
| `firstName` | String | First name |
| `lastName` | String | Last name |
| `email` | String | Employee email |
| `departmentId` | ObjectId | Reference to Department |
| `managerId` | ObjectId | Self-reference to Employee |
| `scheduleId` | ObjectId | Reference to Working Schedule |
| `jobPosition` | String | Job position |
| `employeeType` | String | Used by dashboard filtering |
| `status` | String | Employee status |
| `bankDetails` | Object | Payment information needed for payroll checks |
| `createdAt` | Date | Timestamp |
| `updatedAt` | Date | Timestamp |

`bankDetails` should contain only the payment information needed by the application. The exact bank format can remain generic because the project statement does not specify a country-specific format.

---

## 5. Working Schedules

Collection: `workingSchedules`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `name` | String | Schedule name |
| `type` | String | Schedule type |
| `weeklyPattern` | Array | Daily schedule entries |
| `weeklyHours` | Number | Calculated total |
| `createdAt` | Date | Timestamp |
| `updatedAt` | Date | Timestamp |

Each `weeklyPattern` item:

```text
{
  day,
  startTime,
  endTime,
  breakHours
}
```

`weeklyHours` is calculated from the pattern.

---

## 6. Contracts

Collection: `contracts`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `employeeId` | ObjectId | Reference to Employee |
| `startDate` | Date | Contract start |
| `endDate` | Date | Contract end |
| `departmentId` | ObjectId | Department for contract |
| `jobPosition` | String | Position for contract |
| `wage` | Number | Contract wage |
| `salaryStructureId` | ObjectId | Reference to Salary Structure |
| `status` | String | Contract status |
| `createdAt` | Date | Timestamp |
| `updatedAt` | Date | Timestamp |

Important rule:

The backend must select the contract that is valid for the Payrun period. It must not simply select the latest contract.

Overlapping active contracts for the same employee should be detected by business validation.

---

## 7. Attendances

Collection: `attendances`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `employeeId` | ObjectId | Reference to Employee |
| `date` | Date | Attendance date |
| `checkIn` | Date | Check-in time |
| `checkOut` | Date | Check-out time |
| `workedHours` | Number | Calculated |
| `status` | String | Attendance status / exception |
| `isCorrected` | Boolean | Indicates manual correction |
| `correctedBy` | ObjectId | User who corrected it |
| `correctionReason` | String | Reason for correction |
| `createdAt` | Date | Timestamp |
| `updatedAt` | Date | Timestamp |

Worked hours should be calculated from check-in and check-out.

---

## 8. Time Off Types

Collection: `timeOffTypes`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `name` | String | Type name |
| `unit` | Enum | Days or Hours |
| `allocationRequired` | Boolean | Whether allocation is required |
| `approvalRequired` | Boolean | Approval workflow |
| `payrollIntegration` | Boolean | Payroll integration flag |
| `createdAt` | Date | Timestamp |
| `updatedAt` | Date | Timestamp |

---

## 9. Time Off Allocations

Collection: `timeOffAllocations`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `employeeId` | ObjectId | Reference to Employee |
| `timeOffTypeId` | ObjectId | Reference to Time Off Type |
| `allocatedAmount` | Number | Original allocation |
| `takenAmount` | Number | Used amount |
| `remainingAmount` | Number | Available amount |
| `validFrom` | Date | Validity start |
| `validTo` | Date | Validity end |
| `approvalStatus` | Enum | Pending / Approved |
| `createdAt` | Date | Timestamp |
| `updatedAt` | Date | Timestamp |

An allocation is available only after the required approval.

---

## 10. Time Off Requests

Collection: `timeOffRequests`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `employeeId` | ObjectId | Reference to Employee |
| `timeOffTypeId` | ObjectId | Reference to Time Off Type |
| `allocationId` | ObjectId | Related allocation |
| `startDate` | Date | Request start |
| `endDate` | Date | Request end |
| `duration` | Number | Requested duration |
| `status` | Enum | Pending / Approved / Refused |
| `createdAt` | Date | Timestamp |
| `updatedAt` | Date | Timestamp |

When an approved request uses an allocation, `takenAmount` increases and `remainingAmount` decreases.

---

## 11. Salary Structures

Collection: `salaryStructures`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `name` | String | Structure name |
| `code` | String | Structure reference |
| `isActive` | Boolean | Active status |
| `createdAt` | Date | Timestamp |
| `updatedAt` | Date | Timestamp |

Salary Rules belong to a Salary Structure through `salaryStructureId`.

The rules should be loaded and ordered by `sequence` when calculating payroll.

---

## 12. Salary Rules

Collection: `salaryRules`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `salaryStructureId` | ObjectId | Parent Salary Structure |
| `name` | String | Rule name |
| `code` | String | Rule code |
| `category` | Enum | Basic / Allowances / Gross / Deductions / Net |
| `sequence` | Number | Execution order |
| `computationMethod` | Enum | Fixed / Percentage / Formula |
| `amount` | Number | Fixed value where applicable |
| `percentage` | Number | Percentage where applicable |
| `formulaExpression` | String | Formula where applicable |
| `isActive` | Boolean | Rule status |
| `createdAt` | Date | Timestamp |
| `updatedAt` | Date | Timestamp |

Rules must be executed by sequence.

Formula execution should be controlled by backend business logic rather than executing arbitrary code.

---

## 13. Payruns

Collection: `payruns`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `name` | String | Payrun name |
| `salaryStructureId` | ObjectId | One Salary Structure for the Payrun |
| `periodStart` | Date | Payroll period start |
| `periodEnd` | Date | Payroll period end |
| `employeeIds` | [ObjectId] | Explicitly selected employees |
| `payslipIds` | [ObjectId] | Generated Payslips |
| `status` | String | Payrun processing status |
| `warnings` | Array | Validation warnings |
| `createdAt` | Date | Timestamp |
| `updatedAt` | Date | Timestamp |

### Payrun rule

One Payrun has one `salaryStructureId`.

If a different Salary Structure is required, create another Payrun.

---

## 14. Payslips

Collection: `payslips`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `employeeId` | ObjectId | Reference to Employee |
| `payrunId` | ObjectId | Parent Payrun |
| `contractId` | ObjectId | Contract used for calculation |
| `salaryStructureId` | ObjectId | Structure used for calculation |
| `periodStart` | Date | Payroll period |
| `periodEnd` | Date | Payroll period |
| `status` | String | Processing status |
| `workedDays` | Number | Worked days |
| `basic` | Number | Basic amount |
| `allowances` | Number | Allowances total |
| `gross` | Number | Gross amount |
| `deductions` | Number | Deductions total |
| `net` | Number | Net amount |
| `pdfReference` | String | Generated PDF reference |
| `emailStatus` | String | Email delivery status |
| `createdAt` | Date | Timestamp |
| `updatedAt` | Date | Timestamp |

The Payslip keeps the contract and Salary Structure references used during the calculation so the payroll record can be traced back to the source records.

---

## 15. Payslip Lines

Collection: `payslipLines`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `payslipId` | ObjectId | Parent Payslip |
| `salaryRuleId` | ObjectId | Rule that generated the line |
| `name` | String | Rule name at calculation time |
| `code` | String | Rule code |
| `category` | String | Rule category |
| `sequence` | Number | Rule execution sequence |
| `calculatedAmount` | Number | Result |
| `createdAt` | Date | Timestamp |

Payslip Lines are the detailed breakdown generated from the Salary Rules.

---

## 16. Main relationships

### Employee side

```text
Employee
 ├── Department
 ├── Manager → Employee
 ├── Working Schedule
 ├── Contracts
 ├── Attendances
 └── Time Off
      ├── Allocations
      └── Requests
```

### Payroll side

```text
Salary Structure
 └── Salary Rules

Employee
 └── Contract
      └── Salary Structure

Payrun
 ├── Salary Structure
 ├── Selected Employees
 └── Payslips
      ├── Employee
      ├── Applicable Contract
      ├── Salary Structure
      └── Payslip Lines
           └── Salary Rule
```

---

## 17. Important validation rules

### Contract

- Contract must belong to an employee.
- Payroll must use the contract applicable to the Payrun period.
- Overlapping active contracts should be detected.

### Time Off

- Allocation must be approved before it is available when allocation is required.
- Approved requests must update the allocation balance.
- Remaining balance must not become negative.

### Salary Rules

- Rules must belong to a Salary Structure.
- Rules execute in sequence.
- Rule calculations must produce actual Payslip values.

### Payrun

- Salary Structure is required.
- Period is required.
- At least the explicitly selected employees are included.
- Duplicate Payslips should be detected.
- Required employee information should be checked before finalization.

### Payslip

- Payslip must belong to a Payrun and employee.
- Contract used for the calculation must match the payroll period.
- Salary Structure must match the Payrun.
- Salary Rule results must be stored in Payslip Lines.

---

## 18. Indexes / uniqueness

Recommended database constraints:

- User email should be unique.
- Employee code should be unique.
- Salary Rule code should be unique within a Salary Structure.
- Payrun should be identifiable by its period and name.
- Payslips should be checked so the same employee is not generated twice for the same Payrun / payroll period.

Overlapping contract dates cannot be solved reliably with a normal unique MongoDB index, so that check belongs in backend business validation.


---

## 19. Application stack

- Frontend: React + JavaScript
- Backend: Node.js + Express + TypeScript
- Database: MongoDB
- ODM: Mongoose

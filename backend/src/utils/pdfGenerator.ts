export interface PayslipPdfInput {
  payslipId: string;
  employeeName: string;
  employeeCode: string;
  jobPosition: string;
  departmentName: string;
  payrunName: string;
  periodStart: string;
  periodEnd: string;
  salaryStructureName: string;
  workedDays: number;
  basic: number;
  allowances: number;
  gross: number;
  deductions: number;
  net: number;
  status: string;
  bankAccount?: string;
  lines?: Array<{
    name: string;
    code: string;
    category: string;
    calculatedAmount: number;
  }>;
}

export function generatePayslipPdfBuffer(data: PayslipPdfInput): Buffer {
  const sanitize = (str: string = ''): string => {
    return str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  };

  const formatCurr = (val: number = 0): string => {
    return `Rs. ${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const linesStream: string[] = [];
  let y = 750;

  // Header
  linesStream.push(`BT /F2 20 Tf 50 ${y} Td (PeoplePay360 - Official Payslip) Tj ET`);
  y -= 25;
  linesStream.push(`BT /F1 10 Tf 50 ${y} Td (Generated Date: ${new Date().toISOString().split('T')[0]}) Tj ET`);
  y -= 20;

  // Draw separator line
  linesStream.push(`0.5 w 50 ${y} m 562 ${y} l S`);
  y -= 25;

  // Employee & Payrun Information Block
  linesStream.push(`BT /F2 12 Tf 50 ${y} Td (Employee Information) Tj 300 0 Td (Payroll Details) Tj ET`);
  y -= 18;

  linesStream.push(
    `BT /F1 10 Tf 50 ${y} Td (Name: ${sanitize(data.employeeName)}) Tj 300 0 Td (Pay Run: ${sanitize(data.payrunName)}) Tj ET`
  );
  y -= 15;

  linesStream.push(
    `BT /F1 10 Tf 50 ${y} Td (Code: ${sanitize(data.employeeCode)}) Tj 300 0 Td (Period: ${sanitize(data.periodStart)} to ${sanitize(data.periodEnd)}) Tj ET`
  );
  y -= 15;

  linesStream.push(
    `BT /F1 10 Tf 50 ${y} Td (Position: ${sanitize(data.jobPosition)}) Tj 300 0 Td (Salary Structure: ${sanitize(data.salaryStructureName)}) Tj ET`
  );
  y -= 15;

  linesStream.push(
    `BT /F1 10 Tf 50 ${y} Td (Department: ${sanitize(data.departmentName)}) Tj 300 0 Td (Payslip Status: ${sanitize(data.status)}) Tj ET`
  );
  y -= 15;

  if (data.bankAccount) {
    linesStream.push(`BT /F1 10 Tf 50 ${y} Td (Bank Account: ${sanitize(data.bankAccount)}) Tj ET`);
    y -= 15;
  }

  y -= 15;
  linesStream.push(`0.5 w 50 ${y} m 562 ${y} l S`);
  y -= 25;

  // Salary Breakdown Table Header
  linesStream.push(`BT /F2 12 Tf 50 ${y} Td (Salary Calculation Summary) Tj ET`);
  y -= 20;

  linesStream.push(`BT /F1 10 Tf 50 ${y} Td (Worked Days: ${data.workedDays} days) Tj ET`);
  y -= 20;

  linesStream.push(`BT /F2 10 Tf 50 ${y} Td (Component) Tj 350 0 Td (Amount) Tj ET`);
  y -= 15;
  linesStream.push(`0.5 w 50 ${y} m 562 ${y} l S`);
  y -= 18;

  // Summary Rows
  linesStream.push(
    `BT /F1 10 Tf 50 ${y} Td (Basic Wage) Tj 350 0 Td (${sanitize(formatCurr(data.basic))}) Tj ET`
  );
  y -= 15;

  linesStream.push(
    `BT /F1 10 Tf 50 ${y} Td (Total Allowances) Tj 350 0 Td (${sanitize(formatCurr(data.allowances))}) Tj ET`
  );
  y -= 15;

  linesStream.push(
    `BT /F2 10 Tf 50 ${y} Td (Gross Salary) Tj 350 0 Td (${sanitize(formatCurr(data.gross))}) Tj ET`
  );
  y -= 15;

  linesStream.push(
    `BT /F1 10 Tf 50 ${y} Td (Total Deductions) Tj 350 0 Td (-${sanitize(formatCurr(data.deductions))}) Tj ET`
  );
  y -= 18;

  linesStream.push(`1 w 50 ${y} m 562 ${y} l S`);
  y -= 22;

  linesStream.push(
    `BT /F2 14 Tf 50 ${y} Td (Net Payable Amount: ${sanitize(formatCurr(data.net))}) Tj ET`
  );
  y -= 30;

  // Detailed Rule Breakdown Table (if lines exist)
  if (data.lines && data.lines.length > 0) {
    linesStream.push(`0.5 w 50 ${y} m 562 ${y} l S`);
    y -= 20;
    linesStream.push(`BT /F2 12 Tf 50 ${y} Td (Detailed Salary Rule Breakdown) Tj ET`);
    y -= 20;

    linesStream.push(
      `BT /F2 9 Tf 50 ${y} Td (Rule Code) Tj 150 0 Td (Rule Name) Tj 330 0 Td (Category) Tj 470 0 Td (Amount) Tj ET`
    );
    y -= 12;
    linesStream.push(`0.5 w 50 ${y} m 562 ${y} l S`);
    y -= 15;

    for (const line of data.lines) {
      if (y < 60) break; // Simple page boundary check
      linesStream.push(
        `BT /F1 9 Tf 50 ${y} Td (${sanitize(line.code)}) Tj 150 0 Td (${sanitize(line.name)}) Tj 330 0 Td (${sanitize(line.category)}) Tj 470 0 Td (${sanitize(formatCurr(line.calculatedAmount))}) Tj ET`
      );
      y -= 14;
    }
  }

  // Footer
  linesStream.push(`BT /F1 8 Tf 50 30 Td (This is a system generated document by PeoplePay360 HR & Payroll system. Confidential.) Tj ET`);

  const contentStream = linesStream.join('\n');
  const contentLength = Buffer.byteLength(contentStream, 'utf-8');

  // Build PDF Objects
  const objects: string[] = [];

  // Obj 1: Catalog
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');

  // Obj 2: Pages
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');

  // Obj 3: Page
  objects.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>\nendobj');

  // Obj 4: Resources
  objects.push('4 0 obj\n<< /Font << /F1 6 0 R /F2 7 0 R >> >>\nendobj');

  // Obj 5: Contents
  objects.push(`5 0 obj\n<< /Length ${contentLength} >>\nstream\n${contentStream}\nendstream\nendobj`);

  // Obj 6: Font Helvetica
  objects.push('6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');

  // Obj 7: Font Helvetica-Bold
  objects.push('7 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj');

  // Calculate Byte Offsets
  let pdf = '%PDF-1.4\n%\xFF\xFF\xFF\xFF\n';
  const xrefOffsets: number[] = [0];

  for (const obj of objects) {
    xrefOffsets.push(Buffer.byteLength(pdf, 'utf-8'));
    pdf += obj + '\n';
  }

  const xrefStart = Buffer.byteLength(pdf, 'utf-8');
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  for (let i = 1; i <= objects.length; i++) {
    const offsetStr = xrefOffsets[i].toString().padStart(10, '0');
    xref += `${offsetStr} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  return Buffer.from(pdf + xref + trailer, 'utf-8');
}

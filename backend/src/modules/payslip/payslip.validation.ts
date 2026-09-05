import mongoose from 'mongoose';
import { PAYSLIP_STATUSES, PayslipStatus } from './payslip.model';

export interface CalculatePayslipDTO {
  employeeId: string;
  salaryStructureId?: string;
  periodStart: string | Date;
  periodEnd: string | Date;
  payrunId?: string;
}

export interface UpdatePayslipDTO {
  status?: string;
  workedDays?: number;
  pdfReference?: string;
  emailStatus?: string;
}

export interface PayslipFilterQuery {
  payrunId?: string;
  employeeId?: string;
  status?: string;
  periodStart?: string | Date;
  periodEnd?: string | Date;
}

/**
 * Safe arithmetic expression evaluator without using eval() or Function().
 * Supports variables, +, -, *, /, (, ), integers and decimals.
 */
export function evaluateSafeFormula(
  formulaExpression: string,
  context: Record<string, number> = {}
): number {
  if (!formulaExpression || typeof formulaExpression !== 'string' || !formulaExpression.trim()) {
    return 0;
  }

  // Normalize variable keys in context to uppercase
  const normalizedContext: Record<string, number> = {};
  for (const key of Object.keys(context)) {
    normalizedContext[key.trim().toUpperCase()] = Number(context[key]) || 0;
  }

  const raw = formulaExpression.trim();

  // Tokenize the input string
  const tokens: string[] = [];
  let i = 0;
  while (i < raw.length) {
    const char = raw[i];

    if (/\s/.test(char)) {
      i++;
      continue;
    }

    if (char === '+' || char === '-' || char === '*' || char === '/' || char === '(' || char === ')') {
      tokens.push(char);
      i++;
      continue;
    }

    // Number literal
    if (/[0-9.]/.test(char)) {
      let numStr = '';
      while (i < raw.length && /[0-9.]/.test(raw[i])) {
        numStr += raw[i];
        i++;
      }
      tokens.push(numStr);
      continue;
    }

    // Variable or identifier (letters, digits, underscores)
    if (/[a-zA-Z_]/.test(char)) {
      let ident = '';
      while (i < raw.length && /[a-zA-Z0-9_]/.test(raw[i])) {
        ident += raw[i];
        i++;
      }
      tokens.push(ident.toUpperCase());
      continue;
    }

    // Unknown character - skip
    i++;
  }

  if (tokens.length === 0) {
    return 0;
  }

  // Convert tokens into Reverse Polish Notation (RPN) using Shunting-Yard
  const outputQueue: (number | string)[] = [];
  const operatorStack: string[] = [];

  const precedence: Record<string, number> = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2
  };

  let expectUnary = true;

  for (let j = 0; j < tokens.length; j++) {
    const token = tokens[j];

    if (!isNaN(Number(token))) {
      outputQueue.push(Number(token));
      expectUnary = false;
    } else if (token in normalizedContext) {
      outputQueue.push(normalizedContext[token]);
      expectUnary = false;
    } else if (/^[A-Z_][A-Z0-9_]*$/.test(token) && token !== '(' && token !== ')') {
      // Identifier not found in context defaults to 0
      outputQueue.push(0);
      expectUnary = false;
    } else if (token in precedence) {
      // Handle unary plus or minus
      if (expectUnary && (token === '+' || token === '-')) {
        outputQueue.push(0); // e.g. -5 becomes 0 - 5
      }

      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1] !== '(' &&
        precedence[operatorStack[operatorStack.length - 1]] >= precedence[token]
      ) {
        outputQueue.push(operatorStack.pop()!);
      }
      operatorStack.push(token);
      expectUnary = true;
    } else if (token === '(') {
      operatorStack.push(token);
      expectUnary = true;
    } else if (token === ')') {
      while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
        outputQueue.push(operatorStack.pop()!);
      }
      if (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] === '(') {
        operatorStack.pop();
      }
      expectUnary = false;
    }
  }

  while (operatorStack.length > 0) {
    const op = operatorStack.pop()!;
    if (op !== '(' && op !== ')') {
      outputQueue.push(op);
    }
  }

  // Evaluate RPN
  const evalStack: number[] = [];
  for (const item of outputQueue) {
    if (typeof item === 'number') {
      evalStack.push(item);
    } else if (typeof item === 'string' && item in precedence) {
      const b = evalStack.pop() ?? 0;
      const a = evalStack.pop() ?? 0;
      let res = 0;
      switch (item) {
        case '+':
          res = a + b;
          break;
        case '-':
          res = a - b;
          break;
        case '*':
          res = a * b;
          break;
        case '/':
          res = b !== 0 ? a / b : 0;
          break;
      }
      evalStack.push(res);
    }
  }

  const finalResult = evalStack.pop() ?? 0;
  return isNaN(finalResult) ? 0 : Math.round((finalResult + Number.EPSILON) * 100) / 100;
}

export function validateCalculatePayslipInput(data: CalculatePayslipDTO): {
  employeeId: mongoose.Types.ObjectId;
  salaryStructureId?: mongoose.Types.ObjectId;
  periodStart: Date;
  periodEnd: Date;
  payrunId?: mongoose.Types.ObjectId;
} {
  if (!data.employeeId || typeof data.employeeId !== 'string' || !data.employeeId.trim()) {
    const error: any = new Error('Employee ID is required');
    error.statusCode = 400;
    throw error;
  }
  if (!mongoose.Types.ObjectId.isValid(data.employeeId)) {
    const error: any = new Error('Invalid employee ID format');
    error.statusCode = 400;
    throw error;
  }

  if (!data.periodStart) {
    const error: any = new Error('Period start date is required');
    error.statusCode = 400;
    throw error;
  }
  const startDate = new Date(data.periodStart);
  if (isNaN(startDate.getTime())) {
    const error: any = new Error('Invalid period start date format');
    error.statusCode = 400;
    throw error;
  }

  if (!data.periodEnd) {
    const error: any = new Error('Period end date is required');
    error.statusCode = 400;
    throw error;
  }
  const endDate = new Date(data.periodEnd);
  if (isNaN(endDate.getTime())) {
    const error: any = new Error('Invalid period end date format');
    error.statusCode = 400;
    throw error;
  }

  if (startDate > endDate) {
    const error: any = new Error('Period start date cannot be after period end date');
    error.statusCode = 400;
    throw error;
  }

  let structureObjectId: mongoose.Types.ObjectId | undefined;
  if (data.salaryStructureId) {
    if (!mongoose.Types.ObjectId.isValid(data.salaryStructureId)) {
      const error: any = new Error('Invalid salary structure ID format');
      error.statusCode = 400;
      throw error;
    }
    structureObjectId = new mongoose.Types.ObjectId(data.salaryStructureId);
  }

  let payrunObjectId: mongoose.Types.ObjectId | undefined;
  if (data.payrunId) {
    if (!mongoose.Types.ObjectId.isValid(data.payrunId)) {
      const error: any = new Error('Invalid payrun ID format');
      error.statusCode = 400;
      throw error;
    }
    payrunObjectId = new mongoose.Types.ObjectId(data.payrunId);
  }

  return {
    employeeId: new mongoose.Types.ObjectId(data.employeeId),
    salaryStructureId: structureObjectId,
    periodStart: startDate,
    periodEnd: endDate,
    payrunId: payrunObjectId
  };
}

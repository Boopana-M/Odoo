import nodemailer, { Transporter } from 'nodemailer';
import mongoose from 'mongoose';
import { Payrun } from '../modules/payrun/payrun.model';
import { Payslip, IPayslip } from '../modules/payslip/payslip.model';
import { payslipService } from '../modules/payslip/payslip.service';

export interface EmailDeliveryDetail {
  payslipId: string;
  employeeId?: string;
  employeeName?: string;
  email?: string;
  status: 'Sent' | 'Failed' | 'Skipped';
  reason?: string;
  previewUrl?: string;
}

export interface BulkEmailResult {
  payrunId: string;
  payrunName: string;
  total: number;
  sent: number;
  sentCount: number;
  failed: number;
  failedCount: number;
  skipped: number;
  skippedCount: number;
  details: EmailDeliveryDetail[];
}

export class EmailService {
  private transporter: Transporter | null = null;
  private initializingPromise: Promise<Transporter> | null = null;

  /**
   * Initializes or returns a singleton Nodemailer SMTP transporter.
   * If no SMTP configuration is provided, automatically uses an Ethereal test account or JSON transporter.
   */
  async getTransporter(): Promise<Transporter> {
    if (this.transporter) {
      return this.transporter;
    }

    if (this.initializingPromise) {
      return this.initializingPromise;
    }

    this.initializingPromise = (async () => {
      const host = process.env.SMTP_HOST;
      const port = Number(process.env.SMTP_PORT) || 587;
      const secure = process.env.SMTP_SECURE === 'true' || port === 465;
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;

      // If a real SMTP host (other than default localhost without auth) is provided
      if (host && host !== 'localhost') {
        const transportOptions: any = {
          host,
          port,
          secure,
          tls: {
            rejectUnauthorized: false
          }
        };

        if (user && pass) {
          transportOptions.auth = { user, pass };
        }

        this.transporter = nodemailer.createTransport(transportOptions);
        return this.transporter;
      }

      // If user & pass are explicitly provided for localhost
      if (user && pass && host) {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: { user, pass },
          tls: { rejectUnauthorized: false }
        });
        return this.transporter;
      }

      // Development fallback: automatically provision an Ethereal test mailer
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        console.log(`[EmailService] Initialized Ethereal test mailer for ${testAccount.user}`);
      } catch (err: any) {
        console.warn(`[EmailService] Ethereal account creation skipped, using JSON dev transport:`, err.message);
        this.transporter = nodemailer.createTransport({
          jsonTransport: true
        });
      }

      return this.transporter;
    })();

    const resolved = await this.initializingPromise;
    this.initializingPromise = null;
    return resolved;
  }

  /**
   * Sets a custom transporter (useful for testing or customized transports).
   */
  setTransporter(customTransporter: Transporter) {
    this.transporter = customTransporter;
  }

  /**
   * Sends a single payslip email with the PDF attached.
   */
  async sendSinglePayslipEmail(options: {
    to: string;
    employeeName: string;
    employeeCode: string;
    periodStart: string;
    periodEnd: string;
    payrunName: string;
    pdfBuffer: Buffer;
    payslipId: string;
  }): Promise<{ success: boolean; messageId?: string; previewUrl?: string; error?: string }> {
    const fromAddress =
      process.env.SMTP_FROM || 'PeoplePay360 <noreply@peoplepay360.com>';

    const subject = `Your Payslip for Period ${options.periodStart} to ${options.periodEnd} - PeoplePay360`;

    const textBody = `Dear ${options.employeeName},

Please find attached your official payslip for the pay period ${options.periodStart} to ${options.periodEnd} (${options.payrunName}).

Summary:
- Employee: ${options.employeeName} (${options.employeeCode})
- Pay Run: ${options.payrunName}
- Period: ${options.periodStart} to ${options.periodEnd}

If you have any questions regarding your salary computation, please contact the Human Resources department.

Best regards,
PeoplePay360 Payroll Team`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">PeoplePay360 Payslip Notification</h2>
        <p>Dear <strong>${options.employeeName}</strong>,</p>
        <p>Your official payslip for the payroll period <strong>${options.periodStart}</strong> to <strong>${options.periodEnd}</strong> has been generated and is attached to this email.</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Employee Code:</strong> ${options.employeeCode}</p>
          <p style="margin: 5px 0;"><strong>Pay Run:</strong> ${options.payrunName}</p>
          <p style="margin: 5px 0;"><strong>Period:</strong> ${options.periodStart} to ${options.periodEnd}</p>
        </div>

        <p>Please review the attached PDF document for the complete itemized breakdown of your earnings, allowances, and deductions.</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px;">This is an automated notification from PeoplePay360 HR & Payroll. Please do not reply directly to this email.</p>
      </div>
    `;

    const attachmentFilename = `payslip_${options.employeeCode || options.payslipId}.pdf`;

    const mailOptions = {
      from: fromAddress,
      to: options.to,
      subject,
      text: textBody,
      html: htmlBody,
      attachments: [
        {
          filename: attachmentFilename,
          content: options.pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    try {
      const transporter = await this.getTransporter();
      const info = await transporter.sendMail(mailOptions);
      const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
      if (previewUrl) {
        console.log(`[EmailService] Payslip sent to ${options.to}. Preview URL: ${previewUrl}`);
      }
      return { success: true, messageId: info.messageId, previewUrl };
    } catch (err: any) {
      // Return error message cleanly without leaking sensitive auth info
      const cleanMessage = err.message || 'SMTP delivery failed';
      return { success: false, error: cleanMessage };
    }
  }

  /**
   * Bulk sends payslips to all employees in the given Payrun.
   */
  async sendPayrunBulkPayslips(payrunIdInput: string): Promise<BulkEmailResult> {
    if (!mongoose.Types.ObjectId.isValid(payrunIdInput)) {
      const error: any = new Error('Invalid payrun ID format');
      error.statusCode = 400;
      throw error;
    }

    const payrun = await Payrun.findById(payrunIdInput);
    if (!payrun) {
      const error: any = new Error('Payrun not found');
      error.statusCode = 404;
      throw error;
    }

    // Find all payslips strictly belonging to this Payrun
    const payslips = await Payslip.find({ payrunId: payrun._id })
      .populate('employeeId', 'firstName lastName employeeCode email')
      .populate('salaryStructureId', 'name code');

    if (!payslips || payslips.length === 0) {
      const error: any = new Error('No payslips found for this payrun. Please compute the payrun first.');
      error.statusCode = 400;
      throw error;
    }

    let sent = 0;
    let failed = 0;
    let skipped = 0;
    const details: EmailDeliveryDetail[] = [];

    const periodStartStr = new Date(payrun.periodStart).toISOString().split('T')[0];
    const periodEndStr = new Date(payrun.periodEnd).toISOString().split('T')[0];

    for (const payslip of payslips) {
      const emp: any = payslip.employeeId;
      const payslipIdStr = (payslip._id as mongoose.Types.ObjectId).toString();

      if (!emp) {
        payslip.emailStatus = 'Failed';
        await payslip.save();
        failed++;
        details.push({
          payslipId: payslipIdStr,
          status: 'Failed',
          reason: 'Referenced employee record not found'
        });
        continue;
      }

      const employeeIdStr = (emp._id as mongoose.Types.ObjectId).toString();
      const employeeName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee';
      const employeeCode = emp.employeeCode || 'EMP';
      const employeeEmail = emp.email ? emp.email.trim() : '';

      // Check if employee has an email address
      if (!employeeEmail || !/^\S+@\S+\.\S+$/.test(employeeEmail)) {
        payslip.emailStatus = 'Failed';
        await payslip.save();
        failed++;
        details.push({
          payslipId: payslipIdStr,
          employeeId: employeeIdStr,
          employeeName,
          email: employeeEmail || undefined,
          status: 'Failed',
          reason: 'Employee does not have a valid email address'
        });
        continue;
      }

      // Generate or load Payslip PDF buffer
      let pdfBuffer: Buffer;
      try {
        pdfBuffer = await payslipService.generatePayslipPdf(payslipIdStr);
      } catch (pdfErr: any) {
        payslip.emailStatus = 'Failed';
        await payslip.save();
        failed++;
        details.push({
          payslipId: payslipIdStr,
          employeeId: employeeIdStr,
          employeeName,
          email: employeeEmail,
          status: 'Failed',
          reason: `Failed to generate payslip PDF: ${pdfErr.message}`
        });
        continue;
      }

      // Send via SMTP / Ethereal
      const sendResult = await this.sendSinglePayslipEmail({
        to: employeeEmail,
        employeeName,
        employeeCode,
        periodStart: periodStartStr,
        periodEnd: periodEndStr,
        payrunName: payrun.name,
        pdfBuffer,
        payslipId: payslipIdStr
      });

      if (sendResult.success) {
        payslip.emailStatus = 'Sent';
        await payslip.save();
        sent++;
        details.push({
          payslipId: payslipIdStr,
          employeeId: employeeIdStr,
          employeeName,
          email: employeeEmail,
          status: 'Sent',
          previewUrl: sendResult.previewUrl
        });
      } else {
        payslip.emailStatus = 'Failed';
        await payslip.save();
        failed++;
        details.push({
          payslipId: payslipIdStr,
          employeeId: employeeIdStr,
          employeeName,
          email: employeeEmail,
          status: 'Failed',
          reason: sendResult.error || 'SMTP delivery failed'
        });
      }
    }

    return {
      payrunId: (payrun._id as mongoose.Types.ObjectId).toString(),
      payrunName: payrun.name,
      total: payslips.length,
      sent,
      sentCount: sent,
      failed,
      failedCount: failed,
      skipped,
      skippedCount: skipped,
      details
    };
  }
}

export const emailService = new EmailService();

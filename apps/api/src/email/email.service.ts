import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const host = this.config.get<string>('SMTP_HOST', 'localhost');
    const port = this.config.get<number>('SMTP_PORT', 1025);
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async sendMail(params: {
    to: string;
    subject: string;
    type: string;
    html: string;
    text?: string;
    metadata?: Record<string, any>;
  }) {
    const from = this.config.get<string>('SMTP_FROM', 'Brightloop <no-reply@brightloop.in>');
    let status = 'SENT';
    let errorMessage: string | null = null;

    try {
      await this.transporter.sendMail({
        from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text || params.subject,
      });
      this.logger.log(`Email sent [${params.type}] to ${params.to}`);
    } catch (err: any) {
      status = 'FAILED';
      errorMessage = err.message || 'Unknown email error';
      this.logger.warn(`Failed to send email to ${params.to}: ${errorMessage}`);
    }

    try {
      await this.prisma.emailLog.create({
        data: {
          to: params.to,
          subject: params.subject,
          type: params.type,
          body: params.html,
          status,
          error: errorMessage,
          metadata: params.metadata || {},
        },
      });
    } catch (e: any) {
      this.logger.error(`Failed to record email log: ${e.message}`);
    }
  }

  async sendWelcome(to: string, name: string) {
    await this.sendMail({
      to,
      subject: 'Welcome to Brightloop',
      type: 'WELCOME',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <h2 style="color: #2563EB;">Welcome to Brightloop, ${name}!</h2>
          <p>Your subscription management account has been created successfully.</p>
          <p>You can sign in to view your subscriptions, invoices, and payments anytime.</p>
          <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
          <p style="font-size: 12px; color: #64748B;">Brightloop Technologies Pvt. Ltd. · Asia/Kolkata</p>
        </div>
      `,
    });
  }

  async sendInvoiceCreated(to: string, name: string, invoiceNumber: string, totalFormatted: string, dueDate: string) {
    await this.sendMail({
      to,
      subject: `Invoice ${invoiceNumber} from Brightloop`,
      type: 'INVOICE_CREATED',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <h2 style="color: #2563EB;">New Invoice Generated</h2>
          <p>Dear ${name},</p>
          <p>A new invoice <strong>${invoiceNumber}</strong> for <strong>${totalFormatted}</strong> has been issued.</p>
          <p><strong>Payment Due Date:</strong> ${dueDate}</p>
          <p>Please log in to your portal to review the invoice and complete payment.</p>
          <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
          <p style="font-size: 12px; color: #64748B;">Brightloop Technologies Pvt. Ltd.</p>
        </div>
      `,
    });
  }

  async sendPaymentReceipt(to: string, name: string, paymentNumber: string, amountFormatted: string, invoiceNumber: string) {
    await this.sendMail({
      to,
      subject: `Payment Receipt ${paymentNumber} - Brightloop`,
      type: 'PAYMENT_RECEIPT',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <h2 style="color: #16A34A;">Payment Received</h2>
          <p>Dear ${name},</p>
          <p>We have successfully received your payment of <strong>${amountFormatted}</strong> against invoice <strong>${invoiceNumber}</strong>.</p>
          <p>Receipt Number: <strong>${paymentNumber}</strong></p>
          <p>Thank you for your business!</p>
          <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
          <p style="font-size: 12px; color: #64748B;">Brightloop Technologies Pvt. Ltd.</p>
        </div>
      `,
    });
  }

  async sendPasswordReset(to: string, resetLink: string) {
    await this.sendMail({
      to,
      subject: 'Reset your Brightloop password',
      type: 'PASSWORD_RESET',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <h2 style="color: #2563EB;">Password Reset Request</h2>
          <p>We received a request to reset your password. Click the link below to set a new password:</p>
          <p><a href="${resetLink}" style="background-color: #2563EB; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a></p>
          <p style="font-size: 12px; color: #64748B;">This link will expire in 1 hour. If you did not request this, you can ignore this email.</p>
        </div>
      `,
    });
  }
}

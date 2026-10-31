"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
const prisma_service_1 = require("../prisma/prisma.service");
let EmailService = EmailService_1 = class EmailService {
    config;
    prisma;
    logger = new common_1.Logger(EmailService_1.name);
    transporter;
    constructor(config, prisma) {
        this.config = config;
        this.prisma = prisma;
        const host = this.config.get('SMTP_HOST', 'localhost');
        const port = this.config.get('SMTP_PORT', 1025);
        const user = this.config.get('SMTP_USER');
        const pass = this.config.get('SMTP_PASS');
        this.transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: user && pass ? { user, pass } : undefined,
        });
    }
    async sendMail(params) {
        const from = this.config.get('SMTP_FROM', 'Brightloop <no-reply@brightloop.in>');
        let status = 'SENT';
        let errorMessage = null;
        try {
            await this.transporter.sendMail({
                from,
                to: params.to,
                subject: params.subject,
                html: params.html,
                text: params.text || params.subject,
            });
            this.logger.log(`Email sent [${params.type}] to ${params.to}`);
        }
        catch (err) {
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
        }
        catch (e) {
            this.logger.error(`Failed to record email log: ${e.message}`);
        }
    }
    async sendWelcome(to, name) {
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
    async sendInvoiceCreated(to, name, invoiceNumber, totalFormatted, dueDate) {
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
    async sendPaymentReceipt(to, name, paymentNumber, amountFormatted, invoiceNumber) {
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
    async sendPasswordReset(to, resetLink) {
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
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], EmailService);
//# sourceMappingURL=email.service.js.map
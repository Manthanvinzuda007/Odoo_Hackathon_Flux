import { PrismaClient, UserRole, BillingInterval, TaxType, DiscountType, SubscriptionStatus, InvoiceStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import * as argon2 from 'argon2';
import { addMonths, subMonths, addDays, subDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Brightloop database...');

  // ===== USERS =====
  const adminPassword = await argon2.hash('admin123');
  const staffPassword = await argon2.hash('staff123');
  const customerPassword = await argon2.hash('customer123');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@brightloop.dev' },
    update: {},
    create: {
      email: 'admin@brightloop.dev',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@brightloop.dev' },
    update: {},
    create: {
      email: 'staff@brightloop.dev',
      passwordHash: staffPassword,
      firstName: 'Staff',
      lastName: 'Member',
      role: UserRole.STAFF,
    },
  });

  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      passwordHash: customerPassword,
      firstName: 'Rajesh',
      lastName: 'Kumar',
      role: UserRole.CUSTOMER,
    },
  });

  console.log('✅ Users created');

  // ===== SEQUENCES =====
  const prefixes = ['CUS', 'INV', 'QUO', 'PAY'];
  for (const prefix of prefixes) {
    await prisma.sequence.upsert({
      where: { prefix },
      update: {},
      create: { prefix, nextValue: 1001 },
    });
  }

  // ===== TAXES =====
  const gst18 = await prisma.tax.create({ data: { name: 'GST 18%', rate: 1800, type: TaxType.GST } });
  const gst12 = await prisma.tax.create({ data: { name: 'GST 12%', rate: 1200, type: TaxType.GST } });
  const gst5 = await prisma.tax.create({ data: { name: 'GST 5%', rate: 500, type: TaxType.GST } });
  console.log('✅ Taxes created');

  // ===== PRODUCTS =====
  const productCRM = await prisma.product.create({
    data: {
      name: 'Brightloop CRM',
      sku: 'BL-CRM',
      description: 'Customer Relationship Management suite',
      variants: {
        create: [
          { name: 'CRM Basic', sku: 'BL-CRM-BASIC', pricePaise: 99900, billingInterval: BillingInterval.MONTHLY },
          { name: 'CRM Pro', sku: 'BL-CRM-PRO', pricePaise: 249900, billingInterval: BillingInterval.MONTHLY },
          { name: 'CRM Enterprise', sku: 'BL-CRM-ENT', pricePaise: 499900, billingInterval: BillingInterval.MONTHLY },
        ],
      },
    },
  });

  const productERP = await prisma.product.create({
    data: {
      name: 'Brightloop ERP',
      sku: 'BL-ERP',
      description: 'Enterprise Resource Planning solution',
      variants: {
        create: [
          { name: 'ERP Starter', sku: 'BL-ERP-START', pricePaise: 199900, billingInterval: BillingInterval.MONTHLY },
          { name: 'ERP Business', sku: 'BL-ERP-BIZ', pricePaise: 499900, billingInterval: BillingInterval.MONTHLY },
        ],
      },
    },
  });

  const productHR = await prisma.product.create({
    data: {
      name: 'Brightloop HRMS',
      sku: 'BL-HRMS',
      description: 'Human Resource Management System',
      variants: {
        create: [
          { name: 'HRMS Standard', sku: 'BL-HRMS-STD', pricePaise: 149900, billingInterval: BillingInterval.MONTHLY },
        ],
      },
    },
  });

  console.log('✅ Products created');

  // ===== PLANS =====
  const planBasic = await prisma.plan.create({
    data: {
      name: 'CRM Basic Monthly',
      description: 'Basic CRM with essential features',
      productId: productCRM.id,
      pricePaise: 99900,
      billingInterval: BillingInterval.MONTHLY,
      trialDays: 14,
      features: ['Contact Management', 'Email Integration', 'Basic Reports', '5 Users'],
      sortOrder: 1,
    },
  });

  const planPro = await prisma.plan.create({
    data: {
      name: 'CRM Pro Monthly',
      description: 'Professional CRM with advanced features',
      productId: productCRM.id,
      pricePaise: 249900,
      billingInterval: BillingInterval.MONTHLY,
      trialDays: 14,
      features: ['Everything in Basic', 'Pipeline Management', 'Custom Reports', 'API Access', '25 Users', 'Priority Support'],
      sortOrder: 2,
    },
  });

  const planEnterprise = await prisma.plan.create({
    data: {
      name: 'CRM Enterprise Monthly',
      description: 'Enterprise-grade CRM solution',
      productId: productCRM.id,
      pricePaise: 499900,
      billingInterval: BillingInterval.MONTHLY,
      features: ['Everything in Pro', 'Advanced Analytics', 'Custom Workflows', 'SSO', 'Unlimited Users', 'Dedicated Support', 'SLA'],
      sortOrder: 3,
    },
  });

  const planERPStarter = await prisma.plan.create({
    data: {
      name: 'ERP Starter Monthly',
      productId: productERP.id,
      pricePaise: 199900,
      billingInterval: BillingInterval.MONTHLY,
      features: ['Inventory', 'Accounting', 'Procurement', '10 Users'],
      sortOrder: 1,
    },
  });

  const planERPBiz = await prisma.plan.create({
    data: {
      name: 'ERP Business Yearly',
      productId: productERP.id,
      pricePaise: 4999900,
      billingInterval: BillingInterval.YEARLY,
      features: ['Everything in Starter', 'Manufacturing', 'Multi-warehouse', 'BI Reports', '50 Users'],
      sortOrder: 2,
    },
  });

  const planHRMS = await prisma.plan.create({
    data: {
      name: 'HRMS Standard Monthly',
      productId: productHR.id,
      pricePaise: 149900,
      billingInterval: BillingInterval.MONTHLY,
      features: ['Employee Records', 'Leave Management', 'Payroll', 'Attendance'],
      sortOrder: 1,
    },
  });

  console.log('✅ Plans created');

  // ===== DISCOUNTS =====
  await prisma.discount.create({
    data: {
      name: 'Early Bird 20%',
      code: 'EARLY20',
      type: DiscountType.PERCENTAGE,
      percentage: 2000,
      maxUsage: 100,
      maxPerCustomer: 1,
      endsAt: addMonths(new Date(), 3),
    },
  });

  await prisma.discount.create({
    data: {
      name: 'Flat ₹1000 Off',
      code: 'FLAT1000',
      type: DiscountType.FIXED,
      valuePaise: 100000,
      minPurchasePaise: 500000,
      maxUsage: 50,
    },
  });

  await prisma.discount.create({
    data: {
      name: 'Diwali Special 15%',
      code: 'DIWALI15',
      type: DiscountType.PERCENTAGE,
      percentage: 1500,
      maxUsage: 200,
      startsAt: new Date(),
      endsAt: addDays(new Date(), 30),
    },
  });

  console.log('✅ Discounts created');

  // ===== CUSTOMERS =====
  const customers = [];
  const customerData = [
    { contactName: 'Rajesh Kumar', companyName: 'TechIndia Solutions Pvt Ltd', email: 'rajesh@techindia.com', phone: '+91 98765 43210', gstin: '29AABCT1234F1ZP' },
    { contactName: 'Priya Sharma', companyName: 'CloudFirst Digital', email: 'priya@cloudfirst.io', phone: '+91 98765 43211' },
    { contactName: 'Amit Patel', companyName: 'Patel Enterprises', email: 'amit@patelent.com', phone: '+91 98765 43212', gstin: '24AABCP5678G1ZQ' },
    { contactName: 'Sneha Reddy', companyName: 'Innovate Labs', email: 'sneha@innovatelabs.in', phone: '+91 98765 43213' },
    { contactName: 'Vikram Singh', companyName: 'Singh Manufacturing', email: 'vikram@singhmfg.com', phone: '+91 98765 43214', gstin: '27AABCS9012H1ZR' },
    { contactName: 'Anjali Menon', companyName: 'Kerala Tech Hub', email: 'anjali@keralatechhub.com', phone: '+91 98765 43215' },
    { contactName: 'Suresh Iyer', companyName: 'Iyer Consulting', email: 'suresh@iyerconsulting.in', phone: '+91 98765 43216' },
    { contactName: 'Deepika Joshi', companyName: 'Joshi InfoTech', email: 'deepika@joshiit.com', phone: '+91 98765 43217' },
    { contactName: 'Rahul Gupta', companyName: 'Gupta Logistics', email: 'rahul@guptalog.com', phone: '+91 98765 43218' },
    { contactName: 'Meera Nair', companyName: 'Nair Healthcare', email: 'meera@nairhc.com', phone: '+91 98765 43219' },
  ];

  let cusNum = 1001;
  for (const cd of customerData) {
    const c = await prisma.customer.create({
      data: {
        customerNumber: `CUS-${String(cusNum++).padStart(6, '0')}`,
        ...cd,
        userId: cd.email === 'rajesh@techindia.com' ? customerUser.id : undefined,
      },
    });
    customers.push(c);
  }

  console.log('✅ Customers created');

  // ===== ACTIVE SUBSCRIPTIONS =====
  const now = new Date();
  const subscriptions = [];
  const subConfigs = [
    { customer: 0, plan: planBasic, interval: BillingInterval.MONTHLY, monthsAgo: 6 },
    { customer: 1, plan: planPro, interval: BillingInterval.MONTHLY, monthsAgo: 4 },
    { customer: 2, plan: planEnterprise, interval: BillingInterval.MONTHLY, monthsAgo: 8 },
    { customer: 3, plan: planERPStarter, interval: BillingInterval.MONTHLY, monthsAgo: 3 },
    { customer: 4, plan: planERPBiz, interval: BillingInterval.YEARLY, monthsAgo: 10 },
    { customer: 5, plan: planHRMS, interval: BillingInterval.MONTHLY, monthsAgo: 5 },
    { customer: 6, plan: planBasic, interval: BillingInterval.MONTHLY, monthsAgo: 2 },
    { customer: 7, plan: planPro, interval: BillingInterval.MONTHLY, monthsAgo: 7 },
  ];

  for (const sc of subConfigs) {
    const startDate = subMonths(now, sc.monthsAgo);
    const periodStart = subMonths(now, 1);
    const periodEnd = now;

    const intervalMonths: Record<string, number> = { MONTHLY: 1, QUARTERLY: 3, HALF_YEARLY: 6, YEARLY: 12 };
    const months = intervalMonths[sc.interval] || 1;
    const mrrPaise = Math.round(sc.plan.pricePaise / months);

    const sub = await prisma.subscription.create({
      data: {
        customerId: customers[sc.customer]!.id,
        status: SubscriptionStatus.ACTIVE,
        billingInterval: sc.interval,
        startDate,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        nextBillingDate: addMonths(periodEnd, 1),
        mrrPaise,
        renewalCount: sc.monthsAgo,
        lines: {
          create: [{
            planId: sc.plan.id,
            description: sc.plan.name,
            quantity: 1,
            unitPricePaise: sc.plan.pricePaise,
          }],
        },
      },
    });
    subscriptions.push(sub);
  }

  console.log('✅ Subscriptions created');

  // ===== INVOICES & PAYMENTS =====
  let invNum = 1001;
  let payNum = 1001;

  for (let i = 0; i < subscriptions.length; i++) {
    const sub = subscriptions[i]!;
    const sc = subConfigs[i]!;

    // Generate past invoices
    for (let m = sc.monthsAgo; m >= 1; m--) {
      const periodStart = subMonths(now, m);
      const periodEnd = subMonths(now, m - 1);
      const isPaid = m > 1; // Last month may be overdue
      const isOverdue = m === 1 && i % 3 === 0; // Some invoices overdue

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-${String(invNum++).padStart(6, '0')}`,
          customerId: sub.customerId,
          subscriptionId: sub.id,
          status: isOverdue ? InvoiceStatus.OVERDUE : isPaid ? InvoiceStatus.PAID : InvoiceStatus.ISSUED,
          subtotalPaise: sc.plan.pricePaise,
          taxPaise: Math.round((sc.plan.pricePaise * 1800) / 10000),
          totalPaise: sc.plan.pricePaise + Math.round((sc.plan.pricePaise * 1800) / 10000),
          amountPaidPaise: isPaid ? sc.plan.pricePaise + Math.round((sc.plan.pricePaise * 1800) / 10000) : 0,
          amountDuePaise: isPaid ? 0 : sc.plan.pricePaise + Math.round((sc.plan.pricePaise * 1800) / 10000),
          periodStart,
          periodEnd,
          issueDate: periodStart,
          dueDate: addDays(periodStart, 15),
          paidAt: isPaid ? addDays(periodStart, 5) : undefined,
          lines: {
            create: [{
              description: sc.plan.name,
              quantity: 1,
              unitPricePaise: sc.plan.pricePaise,
              taxId: gst18.id,
              taxRate: 1800,
              taxPaise: Math.round((sc.plan.pricePaise * 1800) / 10000),
              subtotalPaise: sc.plan.pricePaise,
              totalPaise: sc.plan.pricePaise + Math.round((sc.plan.pricePaise * 1800) / 10000),
            }],
          },
        },
      });

      // Create payment for paid invoices
      if (isPaid) {
        await prisma.payment.create({
          data: {
            paymentNumber: `PAY-${String(payNum++).padStart(6, '0')}`,
            invoiceId: invoice.id,
            customerId: sub.customerId,
            amountPaise: invoice.totalPaise,
            method: i % 2 === 0 ? PaymentMethod.UPI : PaymentMethod.BANK_TRANSFER,
            status: PaymentStatus.COMPLETED,
            paidAt: addDays(periodStart, 5),
          },
        });
      }
    }
  }

  // Update sequence counters
  await prisma.sequence.update({ where: { prefix: 'INV' }, data: { nextValue: invNum } });
  await prisma.sequence.update({ where: { prefix: 'PAY' }, data: { nextValue: payNum } });
  await prisma.sequence.update({ where: { prefix: 'CUS' }, data: { nextValue: cusNum } });

  console.log('✅ Invoices and Payments created');

  // ===== QUOTATION TEMPLATE =====
  await prisma.quotationTemplate.create({
    data: {
      name: 'Standard CRM Proposal',
      description: 'Standard proposal for CRM products',
      validDays: 30,
      notes: 'Thank you for considering Brightloop. This quotation is valid for 30 days.',
      lines: {
        create: [
          { planId: planPro.id, taxId: gst18.id, quantity: 1, description: 'CRM Pro Monthly' },
        ],
      },
    },
  });

  console.log('✅ Quotation templates created');

  // ===== AUDIT LOGS =====
  await prisma.auditLog.create({
    data: { actorId: admin.id, action: 'LOGIN', entity: 'User', entityId: admin.id, metadata: { source: 'seed' } },
  });

  console.log('✅ Seed data complete!');
  console.log('');
  console.log('📧 Login credentials:');
  console.log('   Admin:    admin@brightloop.dev / admin123');
  console.log('   Staff:    staff@brightloop.dev / staff123');
  console.log('   Customer: customer@example.com / customer123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings as SettingsIcon, Database, Mail, Globe, Shield, Bell } from 'lucide-react';

export default function SettingsPage() {
  const sections = [
    {
      icon: Globe,
      title: 'General',
      description: 'Company name, timezone, currency, date format',
      status: 'Configured',
      items: [
        { label: 'Company', value: 'Brightloop Technologies Pvt. Ltd.' },
        { label: 'Currency', value: 'INR (₹)' },
        { label: 'Timezone', value: 'Asia/Kolkata (IST)' },
        { label: 'Date Format', value: 'DD MMM YYYY' },
      ],
    },
    {
      icon: Database,
      title: 'Database',
      description: 'PostgreSQL connection and migrations',
      status: 'Connected',
      items: [
        { label: 'Engine', value: 'PostgreSQL 16+' },
        { label: 'ORM', value: 'Prisma 5' },
        { label: 'Schema Status', value: 'Up to date' },
      ],
    },
    {
      icon: Mail,
      title: 'Email',
      description: 'SMTP configuration for notifications',
      status: 'Development',
      items: [
        { label: 'Provider', value: 'MailHog (dev)' },
        { label: 'SMTP Host', value: 'localhost' },
        { label: 'SMTP Port', value: '1025' },
      ],
    },
    {
      icon: Shield,
      title: 'Security',
      description: 'Authentication and authorization settings',
      status: 'Configured',
      items: [
        { label: 'Auth Method', value: 'JWT + Refresh Tokens' },
        { label: 'Password Hashing', value: 'Argon2' },
        { label: 'Rate Limiting', value: '100 req/min' },
        { label: 'Lockout', value: 'After 5 failed attempts' },
      ],
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Email templates and notification preferences',
      status: 'Pending',
      items: [
        { label: 'Welcome Email', value: 'Configured' },
        { label: 'Invoice Notification', value: 'Configured' },
        { label: 'Overdue Reminder', value: 'Configured' },
      ],
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1000px] mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <SettingsIcon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">System configuration and preferences</p>
        </div>
      </div>

      <div className="grid gap-4">
        {sections.map((section) => (
          <Card key={section.title} className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <section.icon className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-base">{section.title}</CardTitle>
                    <CardDescription className="text-xs">{section.description}</CardDescription>
                  </div>
                </div>
                <Badge variant={section.status === 'Connected' || section.status === 'Configured' ? 'success' : 'secondary'}>
                  {section.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                {section.items.map((item) => (
                  <div key={item.label} className="flex justify-between py-1.5 border-b border-border/30 last:border-0">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

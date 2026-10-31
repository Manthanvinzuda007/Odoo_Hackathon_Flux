import DataPage from '@/components/data/DataPage';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/format';

export default function AuditLogsPage() {
  const columns = [
    { key: 'createdAt', label: 'Timestamp', render: (row: any) => formatDate(row.createdAt) },
    {
      key: 'action',
      label: 'Action',
      render: (row: any) => (
        <Badge variant={
          row.action === 'CREATE' ? 'success' :
          row.action === 'UPDATE' ? 'secondary' :
          row.action === 'DELETE' ? 'destructive' : 'outline'
        }>
          {row.action}
        </Badge>
      ),
    },
    { key: 'entityType', label: 'Entity', render: (row: any) => <span className="font-mono text-xs">{row.entityType}</span> },
    { key: 'entityId', label: 'Entity ID', render: (row: any) => <span className="font-mono text-xs truncate max-w-[120px] block">{row.entityId}</span> },
    {
      key: 'actor',
      label: 'Actor',
      render: (row: any) => row.actor ? `${row.actor.firstName} ${row.actor.lastName}` : '—',
    },
    {
      key: 'changes',
      label: 'Changes',
      render: (row: any) => {
        if (!row.changes) return '—';
        try {
          const changes = typeof row.changes === 'string' ? JSON.parse(row.changes) : row.changes;
          const keys = Object.keys(changes);
          if (keys.length === 0) return '—';
          return (
            <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
              {keys.slice(0, 3).join(', ')}{keys.length > 3 ? ` +${keys.length - 3} more` : ''}
            </span>
          );
        } catch {
          return '—';
        }
      },
    },
  ];

  return (
    <DataPage
      title="Audit Logs"
      description="Track all system changes and user actions"
      endpoint="audit-logs"
      columns={columns}
      queryKey="audit-logs"
    />
  );
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export interface Column<T = any> {
  key: string;
  header?: string;
  label?: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

export interface DataPageProps<T = any> {
  title: string;
  description?: string;
  endpoint: string;
  columns: Column<T>[];
  onAdd?: () => void;
  addLabel?: string;
  queryKey: string;
  filters?: Record<string, string | undefined>;
}

export function DataPage<T extends { id?: string }>({
  title,
  description,
  endpoint,
  columns,
  onAdd,
  addLabel = 'Add',
  queryKey,
  filters,
}: DataPageProps<T>) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const pageSize = 20;

  // Simple debounce
  const handleSearch = (val: string) => {
    setSearch(val);
    setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 300);
  };

  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    ...(debouncedSearch && { search: debouncedSearch }),
    ...filters,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: [queryKey, page, debouncedSearch, filters],
    queryFn: () =>
      fetch(`/api/v1/${endpoint}?${params}`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('bl_token') || ''}`,
        },
      }).then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      }),
  });

  const items: T[] = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, totalPages: 0 };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {onAdd && (
          <Button onClick={onAdd} className="cursor-pointer shrink-0">
            <Plus className="h-4 w-4 mr-2" /> {addLabel}
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 max-w-sm"
            />
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive">Failed to load data. Please try again.</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No records found.</p>
              {debouncedSearch && (
                <p className="text-sm text-muted-foreground mt-1">Try adjusting your search.</p>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {columns.map((col) => (
                        <th
                          key={col.key}
                          className={`text-left py-3 px-3 font-medium text-muted-foreground ${
                            col.className || ''
                          }`}
                        >
                          {col.header || col.label || col.key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row: any, rowIdx: number) => (
                      <tr
                        key={row.id || rowIdx}
                        className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                      >
                        {columns.map((col) => (
                          <td key={col.key} className={`py-3 px-3 ${col.className || ''}`}>
                            {col.render
                              ? col.render(row)
                              : ((row as Record<string, unknown>)[col.key] as string)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {items.map((row: any, rowIdx: number) => (
                  <div key={row.id || rowIdx} className="rounded-lg border p-3 space-y-2">
                    {columns.map((col) => (
                      <div key={col.key} className="flex justify-between items-center">
                        <span className="text-xs font-medium text-muted-foreground">
                          {col.header || col.label || col.key}
                        </span>
                        <span className="text-sm">
                          {col.render
                            ? col.render(row)
                            : ((row as Record<string, unknown>)[col.key] as string)}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  {meta.total} record{meta.total !== 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {meta.page} / {meta.totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!meta.hasNext}
                    onClick={() => setPage(page + 1)}
                    className="cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default DataPage;

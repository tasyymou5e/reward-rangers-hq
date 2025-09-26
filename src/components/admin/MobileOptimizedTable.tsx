import { useState } from 'react';
import { ChevronDown, ChevronRight, MoreVertical, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
  mobileRender?: (value: any, row: any) => React.ReactNode;
  priority?: 'high' | 'medium' | 'low'; // For responsive hiding
}

interface MobileOptimizedTableProps {
  data: any[];
  columns: Column[];
  actions?: Array<{
    label: string;
    onClick: (row: any) => void;
    variant?: 'default' | 'destructive';
  }>;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  onFilter?: (key: string, value: string) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export function MobileOptimizedTable({
  data,
  columns,
  actions,
  onSort,
  onFilter,
  loading,
  emptyMessage = 'No data available'
}: MobileOptimizedTableProps) {
  const isMobile = useIsMobile();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const toggleRowExpansion = (rowId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }
    setExpandedRows(newExpanded);
  };

  const handleSort = (key: string) => {
    const direction = sortConfig?.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
    onSort?.(key, direction);
  };

  const getVisibleColumns = () => {
    if (!isMobile) return columns;
    
    // On mobile, show only high priority columns in collapsed view
    return columns.filter(col => col.priority === 'high' || !col.priority);
  };

  const getSecondaryColumns = () => {
    if (!isMobile) return [];
    
    // Secondary columns shown in expanded view
    return columns.filter(col => col.priority === 'medium' || col.priority === 'low');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  // Mobile Card View
  if (isMobile) {
    return (
      <div className="space-y-3">
        {data.map((row, rowIndex) => {
          const rowId = row.id || rowIndex.toString();
          const isExpanded = expandedRows.has(rowId);
          const primaryColumns = getVisibleColumns();
          const secondaryColumns = getSecondaryColumns();

          return (
            <Card key={rowId} className="overflow-hidden">
              <Collapsible open={isExpanded} onOpenChange={() => toggleRowExpansion(rowId)}>
                <div className="p-4">
                  {/* Primary row content */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      {primaryColumns.slice(0, 2).map(column => {
                        const value = row[column.key];
                        const rendered = column.mobileRender 
                          ? column.mobileRender(value, row)
                          : column.render 
                            ? column.render(value, row) 
                            : value;

                        return (
                          <div key={column.key} className="mb-1">
                            {column.key === primaryColumns[0].key ? (
                              <div className="font-medium text-sm">{rendered}</div>
                            ) : (
                              <div className="text-xs text-muted-foreground">{rendered}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {/* Quick actions */}
                      {actions && actions.length > 0 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {actions.map((action, actionIndex) => (
                              <DropdownMenuItem
                                key={actionIndex}
                                onClick={() => action.onClick(row)}
                                className={action.variant === 'destructive' ? 'text-destructive' : ''}
                              >
                                {action.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}

                      {/* Expand button */}
                      {secondaryColumns.length > 0 && (
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      )}
                    </div>
                  </div>

                  {/* Secondary content (expandable) */}
                  {secondaryColumns.length > 0 && (
                    <CollapsibleContent className="mt-3 pt-3 border-t">
                      <div className="grid grid-cols-1 gap-2">
                        {secondaryColumns.map(column => {
                          const value = row[column.key];
                          const rendered = column.mobileRender 
                            ? column.mobileRender(value, row)
                            : column.render 
                              ? column.render(value, row) 
                              : value;

                          return (
                            <div key={column.key} className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">{column.label}:</span>
                              <span className="text-xs">{rendered}</span>
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  )}
                </div>
              </Collapsible>
            </Card>
          );
        })}
      </div>
    );
  }

  // Desktop Table View
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              {columns.map(column => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort(column.key)}
                        className="p-0 h-auto"
                      >
                        <ChevronDown 
                          className={`h-3 w-3 transition-transform ${
                            sortConfig?.key === column.key && sortConfig.direction === 'desc' 
                              ? 'rotate-180' 
                              : ''
                          }`} 
                        />
                      </Button>
                    )}
                    {column.filterable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto"
                      >
                        <Filter className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </th>
              ))}
              {actions && actions.length > 0 && (
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((row, rowIndex) => (
              <tr key={row.id || rowIndex} className="hover:bg-muted/50">
                {columns.map(column => {
                  const value = row[column.key];
                  const rendered = column.render ? column.render(value, row) : value;

                  return (
                    <td key={column.key} className="px-4 py-3 text-sm">
                      {rendered}
                    </td>
                  );
                })}
                {actions && actions.length > 0 && (
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {actions.map((action, actionIndex) => (
                          <DropdownMenuItem
                            key={actionIndex}
                            onClick={() => action.onClick(row)}
                            className={action.variant === 'destructive' ? 'text-destructive' : ''}
                          >
                            {action.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
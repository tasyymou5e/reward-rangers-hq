import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Activity, 
  Download, 
  Filter, 
  Calendar as CalendarIcon, 
  Search, 
  RefreshCw,
  Clock,
  Shield,
  Users,
  Mail,
  Settings,
  X,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ActivityLogsProps {
  familyId?: string;
  userId?: string;
  title?: string;
  className?: string;
}

interface ActivityFilter {
  dateFrom: Date | null;
  dateTo: Date | null;
  activityType: string;
  riskLevel: string;
  searchTerm: string;
}

export function EnhancedActivityLogs({ familyId, userId, title = "Activity Logs", className }: ActivityLogsProps) {
  const { toast } = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [exporting, setExporting] = useState(false);
  
  const [filters, setFilters] = useState<ActivityFilter>({
    dateFrom: null,
    dateTo: null,
    activityType: "all",
    riskLevel: "all",
    searchTerm: ""
  });

  const activityTypes = [
    { value: "all", label: "All Activities" },
    { value: "auth", label: "Authentication", icon: Shield },
    { value: "invitation", label: "Invitations", icon: Mail },
    { value: "member", label: "Member Changes", icon: Users },
    { value: "security", label: "Security Events", icon: AlertTriangle },
    { value: "system", label: "System Actions", icon: Settings }
  ];

  const riskLevels = [
    { value: "all", label: "All Levels" },
    { value: "low", label: "Low Risk", color: "bg-green-100 text-green-800" },
    { value: "medium", label: "Medium Risk", color: "bg-yellow-100 text-yellow-800" },
    { value: "high", label: "High Risk", color: "bg-orange-100 text-orange-800" },
    { value: "critical", label: "Critical", color: "bg-red-100 text-red-800" }
  ];

  const loadActivityLogs = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('security_audit_trail')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      // Apply family/user filters
      if (familyId) {
        query = query.or(`resource_id.eq.${familyId},family_context.eq.${familyId}`);
      }
      if (userId) {
        query = query.eq('user_id', userId);
      }

      // Apply date filters
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom.toISOString());
      }
      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDate.toISOString());
      }

      // Apply risk level filter
      if (filters.riskLevel !== "all") {
        query = query.eq('risk_level', filters.riskLevel);
      }

      // Apply activity type filter
      if (filters.activityType !== "all") {
        query = query.ilike('action_type', `%${filters.activityType}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      let filteredData = data || [];

      // Apply search filter (client-side for complex text search)
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        filteredData = filteredData.filter(log => 
          log.action_type?.toLowerCase().includes(searchLower) ||
          log.resource_type?.toLowerCase().includes(searchLower) ||
          log.metadata?.toString().toLowerCase().includes(searchLower)
        );
      }

      setLogs(filteredData);
    } catch (error) {
      console.error('Failed to load activity logs:', error);
      toast({
        title: "Error",
        description: "Failed to load activity logs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [familyId, userId, filters, toast]);

  // Load logs when filters change
  useEffect(() => {
    loadActivityLogs();
  }, [loadActivityLogs]);

  // Auto refresh functionality
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadActivityLogs, 30000); // Refresh every 30 seconds
      setRefreshInterval(interval);
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh, loadActivityLogs]);

  const exportLogs = async (format: 'json' | 'csv') => {
    try {
      setExporting(true);
      
      const dataToExport = logs.map(log => ({
        timestamp: new Date(log.created_at).toLocaleString(),
        action: log.action_type?.replace(/_/g, ' '),
        resource_type: log.resource_type,
        resource_id: log.resource_id,
        risk_level: log.risk_level,
        user_id: log.user_id,
        ip_address: log.ip_address,
        metadata: JSON.stringify(log.metadata || {})
      }));

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // CSV export
        const headers = Object.keys(dataToExport[0] || {});
        const csvContent = [
          headers.join(','),
          ...dataToExport.map(row => 
            headers.map(header => `"${row[header] || ''}"`).join(',')
          )
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }

      toast({
        title: "Export Complete",
        description: `Activity logs exported as ${format.toUpperCase()}`
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export activity logs",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: null,
      dateTo: null,
      activityType: "all",
      riskLevel: "all",
      searchTerm: ""
    });
  };

  const getActivityIcon = (actionType: string) => {
    if (actionType?.includes('auth') || actionType?.includes('login')) return Shield;
    if (actionType?.includes('invitation') || actionType?.includes('invite')) return Mail;
    if (actionType?.includes('member') || actionType?.includes('user')) return Users;
    if (actionType?.includes('security') || actionType?.includes('alert')) return AlertTriangle;
    return Settings;
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {title}
            {logs.length > 0 && (
              <Badge variant="secondary">{logs.length} events</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm">
              <Switch
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
                id="auto-refresh"
              />
              <Label htmlFor="auto-refresh">Auto-refresh</Label>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={loadActivityLogs}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Enhanced Filters */}
        <Card className="bg-muted/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search activities, resources, or metadata..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="pl-10"
              />
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Date From */}
              <div className="space-y-2">
                <Label>From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateFrom ? format(filters.dateFrom, "PPP") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateFrom || undefined}
                      onSelect={(date) => setFilters(prev => ({ ...prev, dateFrom: date || null }))}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date To */}
              <div className="space-y-2">
                <Label>To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateTo ? format(filters.dateTo, "PPP") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateTo || undefined}
                      onSelect={(date) => setFilters(prev => ({ ...prev, dateTo: date || null }))}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Activity Type */}
              <div className="space-y-2">
                <Label>Activity Type</Label>
                <Select value={filters.activityType} onValueChange={(value) => setFilters(prev => ({ ...prev, activityType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    {activityTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          {type.icon && <type.icon className="h-4 w-4" />}
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Risk Level */}
              <div className="space-y-2">
                <Label>Risk Level</Label>
                <Select value={filters.riskLevel} onValueChange={(value) => setFilters(prev => ({ ...prev, riskLevel: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    {riskLevels.map(level => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Label>Actions</Label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearFilters}
                    disabled={!filters.dateFrom && !filters.dateTo && filters.activityType === "all" && filters.riskLevel === "all" && !filters.searchTerm}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="sm" variant="outline" disabled={exporting || logs.length === 0}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-40">
                      <div className="space-y-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => exportLogs('csv')}
                          disabled={exporting}
                          className="w-full"
                        >
                          Export CSV
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => exportLogs('json')}
                          disabled={exporting}
                          className="w-full"
                        >
                          Export JSON
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Logs */}
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading activity logs...</p>
          </div>
        ) : logs.length > 0 ? (
          <div className="space-y-3">
            {logs.map((log, index) => {
              const ActivityIcon = getActivityIcon(log.action_type);
              return (
                <Card key={index} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">
                          <ActivityIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">
                              {log.action_type?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </p>
                            <Badge className={getRiskBadgeColor(log.risk_level)}>
                              {log.risk_level}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Resource: {log.resource_type || 'Unknown'} {log.resource_id && `(${log.resource_id.substring(0, 8)}...)`}
                          </p>
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <details className="mt-2">
                              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                View metadata
                              </summary>
                              <pre className="text-xs bg-muted/50 p-2 rounded mt-1 overflow-x-auto">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground ml-4">
                        <div className="flex items-center gap-1 mb-1">
                          <Clock className="h-3 w-3" />
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                        {log.ip_address && (
                          <div>IP: {log.ip_address}</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No activity logs found matching your filters.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
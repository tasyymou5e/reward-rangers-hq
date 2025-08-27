import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileImage, 
  Calendar as CalendarIcon 
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ExportFunctionalityProps {
  onExport: (format: string, dateRange: { from: Date; to: Date }, reportType: string) => void;
}

export function ExportFunctionality({ onExport }: ExportFunctionalityProps) {
  const [exportFormat, setExportFormat] = useState("pdf");
  const [reportType, setReportType] = useState("overview");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [isExporting, setIsExporting] = useState(false);

  const exportFormats = [
    { value: "pdf", label: "PDF Report", icon: FileText },
    { value: "csv", label: "CSV Data", icon: FileSpreadsheet },
    { value: "xlsx", label: "Excel Spreadsheet", icon: FileSpreadsheet },
    { value: "png", label: "Chart Images", icon: FileImage }
  ];

  const reportTypes = [
    { value: "overview", label: "System Overview" },
    { value: "user_analytics", label: "User Analytics" },
    { value: "family_engagement", label: "Family Engagement" },
    { value: "chore_completion", label: "Chore Completion" },
    { value: "system_performance", label: "System Performance" },
    { value: "financial", label: "Financial Report" }
  ];

  const handleExport = async () => {
    if (!dateFrom || !dateTo) {
      return;
    }

    setIsExporting(true);
    
    try {
      await onExport(exportFormat, { from: dateFrom, to: dateTo }, reportType);
    } finally {
      setIsExporting(false);
    }
  };

  const generateFileName = () => {
    const date = new Date().toISOString().split('T')[0];
    const type = reportType.replace('_', '-');
    return `chorequest-${type}-report-${date}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Report Type Selection */}
        <div className="space-y-2">
          <Label htmlFor="report-type">Report Type</Label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger>
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              {reportTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>From Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>To Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Format Selection */}
        <div className="space-y-2">
          <Label>Export Format</Label>
          <div className="grid grid-cols-2 gap-2">
            {exportFormats.map(format => {
              const Icon = format.icon;
              return (
                <Button
                  key={format.value}
                  variant={exportFormat === format.value ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => setExportFormat(format.value)}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {format.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* File Preview */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-muted-foreground">File will be saved as:</p>
          <p className="font-mono text-sm">{generateFileName()}.{exportFormat}</p>
        </div>

        {/* Export Button */}
        <Button 
          onClick={handleExport} 
          disabled={!dateFrom || !dateTo || isExporting}
          className="w-full"
        >
          {isExporting ? (
            <>
              <Download className="h-4 w-4 mr-2 animate-spin" />
              Generating Export...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </>
          )}
        </Button>

        {/* Quick Export Buttons */}
        <div className="border-t pt-4">
          <Label className="text-sm font-medium mb-2 block">Quick Exports</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const today = new Date();
                const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                setDateFrom(lastWeek);
                setDateTo(today);
                setReportType("overview");
                setExportFormat("pdf");
              }}
            >
              Last 7 Days
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const today = new Date();
                const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                setDateFrom(lastMonth);
                setDateTo(today);
                setReportType("overview");
                setExportFormat("pdf");
              }}
            >
              Last 30 Days
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
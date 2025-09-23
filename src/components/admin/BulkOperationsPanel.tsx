import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  Users, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Download,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BulkOperation {
  id: string;
  operation_type: string;
  initiated_by: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  total_items: number;
  processed_items: number;
  failed_items: number;
  operation_data: any;
  results: any;
  error_log: string[];
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

interface BulkOperationsPanelProps {
  operations: BulkOperation[];
  onBulkCreateFamilies: (familyData: Array<{
    name: string;
    parentEmail: string;
    parentName: string;
    children?: Array<{ name: string; password: string }>;
  }>) => Promise<any>;
}

export function BulkOperationsPanel({ operations, onBulkCreateFamilies }: BulkOperationsPanelProps) {
  const [csvData, setCsvData] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCsvData(content);
      };
      reader.readAsText(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV file",
        variant: "destructive"
      });
    }
  };

  const parseCsvData = (csvContent: string) => {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    if (!headers.includes('family_name') || !headers.includes('parent_email') || !headers.includes('parent_name')) {
      throw new Error('CSV must contain family_name, parent_email, and parent_name columns');
    }
    
    const families = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const family: any = {};
      
      headers.forEach((header, index) => {
        family[header] = values[index];
      });
      
      families.push({
        name: family.family_name,
        parentEmail: family.parent_email,
        parentName: family.parent_name,
        children: family.children ? JSON.parse(family.children) : []
      });
    }
    
    return families;
  };

  const handleBulkCreateFamilies = async () => {
    if (!csvData) {
      toast({
        title: "No Data",
        description: "Please upload a CSV file first",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const familyData = parseCsvData(csvData);
      const result = await onBulkCreateFamilies(familyData);
      
      if (result.success) {
        toast({
          title: "Bulk Operation Started",
          description: `Processing ${familyData.length} families. Check operations status below.`
        });
        setCsvData("");
        setSelectedFile(null);
      } else {
        throw new Error(result.error || 'Operation failed');
      }
    } catch (error) {
      toast({
        title: "Operation Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'running':
        return <Clock className="h-4 w-4 text-warning animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/20 text-success';
      case 'failed':
        return 'bg-destructive/20 text-destructive';
      case 'running':
        return 'bg-warning/20 text-warning';
      default:
        return 'bg-muted/20 text-muted-foreground';
    }
  };

  const downloadTemplate = () => {
    const template = `family_name,parent_email,parent_name,children
Smith Family,parent@example.com,John Smith,"[{""name"":""Child1"",""password"":""TempPass123!""}]"
Johnson Family,parent2@example.com,Jane Johnson,"[{""name"":""Child1"",""password"":""TempPass123!""},{""name"":""Child2"",""password"":""TempPass123!""}]"`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_families_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Bulk Family Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Family Creation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>
            <span className="text-sm text-muted-foreground">
              Download the CSV template to see the required format
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="csv-upload">Upload Family Data (CSV)</Label>
            <Input
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="cursor-pointer"
            />
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {selectedFile.name} ({selectedFile.size} bytes)
              </p>
            )}
          </div>

          {csvData && (
            <div className="space-y-2">
              <Label htmlFor="csv-preview">Data Preview</Label>
              <Textarea
                id="csv-preview"
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                placeholder="CSV data will appear here..."
                className="min-h-32 font-mono text-sm"
              />
            </div>
          )}

          <Button
            onClick={handleBulkCreateFamilies}
            disabled={!csvData || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Clock className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Start Bulk Family Creation
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Operations Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Operation History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {operations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No bulk operations yet. Start your first operation above.
              </p>
            ) : (
              operations.map((operation) => (
                <div key={operation.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(operation.status)}
                      <div>
                        <h4 className="font-medium">{operation.operation_type}</h4>
                        <p className="text-sm text-muted-foreground">
                          Started: {new Date(operation.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(operation.status)}>
                      {operation.status.toUpperCase()}
                    </Badge>
                  </div>

                  {operation.total_items > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{operation.processed_items} / {operation.total_items}</span>
                      </div>
                      <Progress 
                        value={(operation.processed_items / operation.total_items) * 100} 
                        className="h-2"
                      />
                      {operation.failed_items > 0 && (
                        <p className="text-sm text-destructive">
                          {operation.failed_items} failed items
                        </p>
                      )}
                    </div>
                  )}

                  {operation.error_log && operation.error_log.length > 0 && (
                    <div className="mt-3">
                      <details className="text-sm">
                        <summary className="cursor-pointer text-destructive">
                          View Error Log ({operation.error_log.length} errors)
                        </summary>
                        <div className="mt-2 p-2 bg-destructive/10 rounded border">
                          {operation.error_log.slice(0, 5).map((error, index) => (
                            <div key={index} className="text-xs text-destructive mb-1">
                              {error}
                            </div>
                          ))}
                          {operation.error_log.length > 5 && (
                            <div className="text-xs text-muted-foreground">
                              ... and {operation.error_log.length - 5} more errors
                            </div>
                          )}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
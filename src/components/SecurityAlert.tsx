import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, Info } from "lucide-react";

interface SecurityAlertProps {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  onDismiss?: () => void;
  actionButton?: {
    text: string;
    onClick: () => void;
  };
}

export function SecurityAlert({ 
  title, 
  description, 
  severity, 
  onDismiss, 
  actionButton 
}: SecurityAlertProps) {
  const getIcon = () => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <Shield className="h-4 w-4" />;
      case 'low':
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getVariant = () => {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <Alert variant={getVariant()}>
      {getIcon()}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2">
        {description}
        <div className="mt-3 flex gap-2">
          {actionButton && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={actionButton.onClick}
            >
              {actionButton.text}
            </Button>
          )}
          {onDismiss && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onDismiss}
            >
              Dismiss
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
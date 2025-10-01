import { Mail, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { parseTimestampedEmail } from "@/lib/utils";

interface EmailDisplayProps {
  email: string;
  showBothEmails?: boolean;
  className?: string;
}

export function EmailDisplay({ email, showBothEmails = true, className = "" }: EmailDisplayProps) {
  const { original, current, isTimestamped } = parseTimestampedEmail(email);

  if (!isTimestamped || !showBothEmails) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Mail className="h-4 w-4 text-muted-foreground" />
        <span className="font-mono text-sm">{email}</span>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Original Email - Primary Display */}
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-primary" />
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Original Email</p>
          <p className="font-mono text-sm font-medium">{original}</p>
        </div>
      </div>

      {/* System Email - Secondary Display */}
      <div className="flex items-center gap-2 pl-6">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">System Email</p>
                    <Badge variant="outline" className="text-xs">Test Account</Badge>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">{current}</p>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">
                This email includes a timestamp (+{current.match(/\+(\d+)@/)?.[1]}) to ensure uniqueness for test accounts. 
                All emails to this address will be routed to the original email.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

// Compact version for table cells
export function EmailDisplayCompact({ email, className = "" }: EmailDisplayProps) {
  const { original, isTimestamped } = parseTimestampedEmail(email);

  if (!isTimestamped) {
    return <span className={`font-mono text-sm ${className}`}>{email}</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`space-y-0.5 ${className}`}>
            <p className="font-mono text-sm font-medium">{original}</p>
            <Badge variant="outline" className="text-xs">Test Account</Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <p className="text-xs font-semibold">Original: {original}</p>
            <p className="text-xs text-muted-foreground">System: {email}</p>
            <p className="text-xs mt-2">Timestamp-based test account email</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

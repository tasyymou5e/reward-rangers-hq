import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "default";
  onConfirm: () => void;
  children?: ReactNode;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  onConfirm,
  children
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {children && <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className={variant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Hook for using confirm dialog programmatically
export function useConfirmDialog() {
  const confirm = (
    title: string,
    description: string,
    options?: {
      confirmText?: string;
      cancelText?: string;
      variant?: "destructive" | "default";
    }
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      const dialog = document.createElement('div');
      document.body.appendChild(dialog);
      
      const cleanup = () => {
        document.body.removeChild(dialog);
      };
      
      // Create a temporary React component to render the dialog
      import('react-dom/client').then(({ createRoot }) => {
        import('react').then(({ createElement, useState }) => {
          const ConfirmComponent = () => {
            const [open, setOpen] = useState(true);
            
            return createElement(ConfirmDialog, {
              open,
              onOpenChange: (newOpen: boolean) => {
                if (!newOpen) {
                  setOpen(false);
                  setTimeout(() => {
                    cleanup();
                    resolve(false);
                  }, 150);
                }
              },
              title,
              description,
              confirmText: options?.confirmText,
              cancelText: options?.cancelText,
              variant: options?.variant,
              onConfirm: () => {
                cleanup();
                resolve(true);
              }
            });
          };
          
          const root = createRoot(dialog);
          root.render(createElement(ConfirmComponent));
        });
      });
    });
  };
  
  return { confirm };
}
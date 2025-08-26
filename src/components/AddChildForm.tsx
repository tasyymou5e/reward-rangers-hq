import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, Mail, User, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useFamily } from "@/hooks/useFamily";
import { useAuth } from "@/contexts/AuthContext";

const childInviteSchema = z.object({
  childName: z.string().min(1, "Child's name is required").max(50, "Name too long"),
  childEmail: z.string().email("Invalid email address"),
});

type ChildInviteFormData = z.infer<typeof childInviteSchema>;

export function AddChildForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const { toast } = useToast();
  const { family, refetchFamily } = useFamily();
  const { session } = useAuth();

  const form = useForm<ChildInviteFormData>({
    resolver: zodResolver(childInviteSchema),
    defaultValues: {
      childName: "",
      childEmail: "",
    },
  });

  const onSubmit = async (data: ChildInviteFormData) => {
    if (!family?.id || !session?.access_token) {
      toast({
        title: "Error",
        description: "Please ensure you're logged in and have a family set up.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setInviteSuccess(false);

    try {
      const { data: result, error } = await supabase.functions.invoke("invite-child", {
        body: {
          childName: data.childName,
          childEmail: data.childEmail,
          familyId: family.id,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      if (result?.error) {
        throw new Error(result.error);
      }

      setInviteSuccess(true);
      
      toast({
        title: "🎉 Invitation Sent!",
        description: `${data.childName} has been invited to join your family. They should receive an email with login instructions.`,
      });

      // Reset form
      form.reset();
      
      // Refresh family data to show new member
      setTimeout(() => {
        refetchFamily();
      }, 1000);

      // Close dialog after a short delay
      setTimeout(() => {
        setIsOpen(false);
        setInviteSuccess(false);
      }, 3000);

    } catch (error: any) {
      console.error("Error inviting child:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setIsOpen(false);
      setInviteSuccess(false);
      form.reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="parents" className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add Child
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-parents-primary">
            <UserPlus className="h-5 w-5" />
            Invite Child to Family
          </DialogTitle>
        </DialogHeader>

        {inviteSuccess ? (
          <div className="text-center py-8 space-y-4">
            <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
            <div>
              <h3 className="text-lg font-semibold text-green-700">Invitation Sent!</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Your child will receive an email with their login credentials and instructions to join ChoreQuest.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="childName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Child's Full Name
              </Label>
              <Input
                id="childName"
                placeholder="e.g., Emma Johnson"
                disabled={isSubmitting}
                {...form.register("childName")}
              />
              {form.formState.errors.childName && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {form.formState.errors.childName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="childEmail" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Child's Email Address
              </Label>
              <Input
                id="childEmail"
                type="email"
                placeholder="emma@example.com"
                disabled={isSubmitting}
                {...form.register("childEmail")}
              />
              {form.formState.errors.childEmail && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {form.formState.errors.childEmail.message}
                </p>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Your child will receive an email invitation</li>
                <li>• The email includes temporary login credentials</li>
                <li>• They can start completing chores and earning points!</li>
                <li>• They'll be prompted to change their password on first login</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                variant="parents"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending Invitation...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AddFamilyMemberDialogProps {
  family: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddFamilyMemberDialog({ family, open, onOpenChange, onSuccess }: AddFamilyMemberDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [memberData, setMemberData] = useState({
    displayName: "",
    email: "",
    password: "",
    role: "kid" as "parent" | "kid"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create the user via edge function
      const { data: userData, error: createError } = await supabase.functions.invoke('admin-create-family-member', {
        body: {
          familyId: family.id,
          displayName: memberData.displayName,
          email: memberData.email,
          password: memberData.password,
          role: memberData.role
        }
      });

      if (createError) throw createError;

      // Log security event
      await supabase.rpc('log_security_audit', {
        p_action_type: 'admin_add_family_member',
        p_resource_type: 'family',
        p_resource_id: family.id,
        p_risk_level: 'medium',
        p_metadata: { 
          new_member_email: memberData.email, 
          new_member_role: memberData.role,
          family_name: family.name 
        }
      });

      toast({
        title: "Member Added",
        description: `${memberData.displayName} has been added to ${family.name}`,
      });

      // Reset form
      setMemberData({
        displayName: "",
        email: "",
        password: "",
        role: "kid"
      });

      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add family member",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Family Member
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={memberData.displayName}
              onChange={(e) => setMemberData({ ...memberData, displayName: e.target.value })}
              placeholder="Enter display name"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={memberData.email}
              onChange={(e) => setMemberData({ ...memberData, email: e.target.value })}
              placeholder="Enter email address"
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={memberData.password}
              onChange={(e) => setMemberData({ ...memberData, password: e.target.value })}
              placeholder="Enter password"
              required
            />
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={memberData.role} onValueChange={(value: "parent" | "kid") => setMemberData({ ...memberData, role: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="kid">Child</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Adding..." : "Add Member"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
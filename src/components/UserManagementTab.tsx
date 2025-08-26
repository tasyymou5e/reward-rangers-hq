import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/useAdmin";
import { UserPlus, Users, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function UserManagementTab() {
  const { createUser, createTestFamily } = useAdmin();
  const { toast } = useToast();
  
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showFamilyDialog, setShowFamilyDialog] = useState(false);
  
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    display_name: "",
    role: "parent" as "admin" | "parent" | "kid",
  });
  
  const [newFamily, setNewFamily] = useState({
    familyName: "",
    parentEmail: "",
    parentPassword: "",
    parentName: "",
    children: [{ name: "", email: "", password: "" }] as Array<{
      name: string;
      email: string;
      password: string;
    }>,
  });

  const handleCreateUser = async () => {
    try {
      await createUser(newUser);
      setShowUserDialog(false);
      setNewUser({ email: "", password: "", display_name: "", role: "parent" });
      toast({
        title: "Success",
        description: `${newUser.role} user created successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      });
    }
  };

  const handleCreateTestFamily = async () => {
    try {
      const result = await createTestFamily(newFamily);
      setShowFamilyDialog(false);
      setNewFamily({
        familyName: "",
        parentEmail: "",
        parentPassword: "",
        parentName: "",
        children: [{ name: "", email: "", password: "" }],
      });
      toast({
        title: "Success",
        description: `Test family created successfully with family code: ${result.family.family_code}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create test family",
        variant: "destructive",
      });
    }
  };

  const addChild = () => {
    setNewFamily(prev => ({
      ...prev,
      children: [...prev.children, { name: "", email: "", password: "" }]
    }));
  };

  const removeChild = (index: number) => {
    setNewFamily(prev => ({
      ...prev,
      children: prev.children.filter((_, i) => i !== index)
    }));
  };

  const updateChild = (index: number, field: string, value: string) => {
    setNewFamily(prev => ({
      ...prev,
      children: prev.children.map((child, i) => 
        i === index ? { ...child, [field]: value } : child
      )
    }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Individual User */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Create User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Create individual admin, parent, or kid users for testing and administration.
            </p>
            <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create New User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Create a new user account with specified role and credentials.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                  <div>
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                      id="display_name"
                      value={newUser.display_name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, display_name: e.target.value }))}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select value={newUser.role} onValueChange={(value: "admin" | "parent" | "kid") => setNewUser(prev => ({ ...prev, role: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="kid">Kid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowUserDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateUser}>
                    Create User
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Create Test Family */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Create Test Family
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Create a complete test family with parent and multiple children accounts, plus sample chores.
            </p>
            <Dialog open={showFamilyDialog} onOpenChange={setShowFamilyDialog}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Users className="mr-2 h-4 w-4" />
                  Create Test Family
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Test Family</DialogTitle>
                  <DialogDescription>
                    Create a complete family setup for testing with parent and children accounts.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Family Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Family Information</h3>
                    <div>
                      <Label htmlFor="familyName">Family Name</Label>
                      <Input
                        id="familyName"
                        value={newFamily.familyName}
                        onChange={(e) => setNewFamily(prev => ({ ...prev, familyName: e.target.value }))}
                        placeholder="The Smith Family"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Parent Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Parent Account</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="parentName">Parent Name</Label>
                        <Input
                          id="parentName"
                          value={newFamily.parentName}
                          onChange={(e) => setNewFamily(prev => ({ ...prev, parentName: e.target.value }))}
                          placeholder="John Smith"
                        />
                      </div>
                      <div>
                        <Label htmlFor="parentEmail">Parent Email</Label>
                        <Input
                          id="parentEmail"
                          type="email"
                          value={newFamily.parentEmail}
                          onChange={(e) => setNewFamily(prev => ({ ...prev, parentEmail: e.target.value }))}
                          placeholder="parent@example.com"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="parentPassword">Parent Password</Label>
                      <Input
                        id="parentPassword"
                        type="password"
                        value={newFamily.parentPassword}
                        onChange={(e) => setNewFamily(prev => ({ ...prev, parentPassword: e.target.value }))}
                        placeholder="Minimum 6 characters"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Children Info */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Children Accounts</h3>
                      <Button type="button" variant="outline" size="sm" onClick={addChild}>
                        Add Child
                      </Button>
                    </div>
                    {newFamily.children.map((child, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">Child {index + 1}</h4>
                          {newFamily.children.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeChild(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor={`childName-${index}`}>Name</Label>
                            <Input
                              id={`childName-${index}`}
                              value={child.name}
                              onChange={(e) => updateChild(index, 'name', e.target.value)}
                              placeholder="Emma Smith"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor={`childEmail-${index}`}>Email</Label>
                              <Input
                                id={`childEmail-${index}`}
                                type="email"
                                value={child.email}
                                onChange={(e) => updateChild(index, 'email', e.target.value)}
                                placeholder="emma@example.com"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`childPassword-${index}`}>Password</Label>
                              <Input
                                id={`childPassword-${index}`}
                                type="password"
                                value={child.password}
                                onChange={(e) => updateChild(index, 'password', e.target.value)}
                                placeholder="password123"
                              />
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowFamilyDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTestFamily}>
                    Create Test Family
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>User Management Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <strong>Admin Users:</strong> Full access to admin portal, can manage all users and families.
            </div>
            <div>
              <strong>Parent Users:</strong> Can create families, manage children, assign chores, and approve rewards.
            </div>
            <div>
              <strong>Kid Users:</strong> Can view and complete assigned chores, track progress, and request rewards.
            </div>
            <div>
              <strong>Test Families:</strong> Complete family setups with sample chores automatically created for testing workflows.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
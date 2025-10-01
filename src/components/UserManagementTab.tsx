import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAdminBridge } from "@/hooks/useAdminBridge";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Users, Trash2, UserMinus, UsersIcon, Eye, Key, Mail } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { UserDetailDialog } from "@/components/admin/UserDetailDialog";
import { UserPasswordResetDialog } from "@/components/admin/UserPasswordResetDialog";

interface UserManagementTabProps {
  searchTerm?: string;
  roleFilter?: string;
}

export function UserManagementTab({ searchTerm = "", roleFilter = "all" }: UserManagementTabProps) {
  const { createUser, createTestFamily, deleteUser, deleteFamily, fetchAllUsers, fetchAllFamilies } = useAdminBridge();
  const { toast } = useToast();
  
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showFamilyDialog, setShowFamilyDialog] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [families, setFamilies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    display_name: "",
    role: "parent" as "admin" | "full_admin" | "read_only_admin" | "report_admin" | "parent" | "kid",
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log('🔄 UserManagementTab: Starting data load...');
      
      // Test authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('👤 Auth check in loadData:', { 
        userId: user?.id, 
        email: user?.email,
        metadata: user?.user_metadata,
        authError 
      });
      
      if (!user) {
        throw new Error('Authentication required - please refresh the page');
      }

      // Try the secure admin functions first, with detailed error logging
      console.log('📊 Attempting to load users via secure admin function...');
      const usersResponse = await supabase.rpc('get_all_profiles_for_admin');
      
      console.log('Users RPC response:', {
        data: usersResponse.data?.length || 0,
        error: usersResponse.error?.message,
        details: usersResponse.error
      });
      
      console.log('🏠 Attempting to load families via secure admin function...');
      const familiesResponse = await supabase.rpc('get_all_families_for_admin');
      
      console.log('Families RPC response:', {
        data: familiesResponse.data?.length || 0,
        error: familiesResponse.error?.message,
        details: familiesResponse.error
      });

      // If RPC functions fail, fall back to direct table queries
      let usersData = usersResponse.data;
      let familiesData = familiesResponse.data;
      
      if (usersResponse.error || !usersData) {
        console.log('🔄 RPC failed for users, trying direct table query...');
        const directUsersResponse = await supabase
          .from('profiles')
          .select(`
            id, username, display_name, email, avatar_url, role, 
            points, level, streak_days, last_activity, 
            created_at, updated_at, email_verified, alternative_emails,
            email_alias, is_primary_designator, parent_email_designator
          `);
        
        console.log('Direct users query result:', {
          data: directUsersResponse.data?.length || 0,
          error: directUsersResponse.error?.message
        });
        
        if (directUsersResponse.error) {
          throw new Error(`Users query failed: ${directUsersResponse.error.message}`);
        }
        
        usersData = directUsersResponse.data;
      }

      if (familiesResponse.error || !familiesData) {
        console.log('🔄 RPC failed for families, trying direct table query...');
        const directFamiliesResponse = await supabase
          .from('families')
          .select(`
            id, parent_id, name, family_code, description, avatar_url,
            created_at, updated_at, settings, archived_at, created_by_primary_email,
            email_domain, family_email_domain, primary_email_designator,
            primary_email_designator_id,
            profiles!parent_id(display_name, email),
            family_members(user_id)
          `);
        
        console.log('Direct families query result:', {
          data: directFamiliesResponse.data?.length || 0,
          error: directFamiliesResponse.error?.message
        });
        
        if (directFamiliesResponse.error) {
          throw new Error(`Families query failed: ${directFamiliesResponse.error.message}`);
        }
        
        // Transform the data to match expected structure
        familiesData = directFamiliesResponse.data?.map(family => ({
          ...family,
          parent_display_name: family.profiles?.display_name || '',
          parent_email: family.profiles?.email || '',
          member_count: 0 // Will be calculated separately if needed
        }));
      }
      
      setUsers(usersData || []);
      setFamilies(familiesData || []);
      
      console.log('🎉 Data loaded successfully:', {
        users: usersData?.length || 0,
        families: familiesData?.length || 0
      });
      
      // Show success message if we have data
      if ((usersData?.length > 0) || (familiesData?.length > 0)) {
        toast({
          title: "Data Loaded",
          description: `Found ${usersData?.length || 0} users and ${familiesData?.length || 0} families`,
        });
      } else {
        setError('No data found - the database appears to be empty');
      }
      
    } catch (error) {
      console.error('💥 Critical error in loadData:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      setError(`Failed to load data: ${errorMessage}`);
      
      toast({
        title: "Data Loading Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      await createUser(newUser);
      setShowUserDialog(false);
      setNewUser({ email: "", password: "", display_name: "", role: "parent" });
      await loadData(); // Refresh data
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
      await loadData(); // Refresh data
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

  const canDeleteUser = (user: any) => {
    // Don't allow deletion of any admin users
    if (['admin', 'full_admin', 'read_only_admin', 'report_admin'].includes(user.role)) {
      return { canDelete: false, reason: "Admin users cannot be deleted" };
    }
    // Additional validation can be added here
    return { canDelete: true, reason: null };
  };

  const getUserFamilyInfo = (user: any) => {
    // Find which family this user belongs to
    for (const family of families) {
      // Check if user is the parent
      if (family.parent_id === user.id) {
        return { familyName: family.name, role: 'Parent' };
      }
      // Check if user is a family member (child)
      if (family.family_members?.some((member: any) => member.user_id === user.id)) {
        return { familyName: family.name, role: 'Child' };
      }
    }
    return { familyName: 'No Family', role: 'N/A' };
  };

  const handleDeleteUser = async (userId: string, displayName: string) => {
    try {
      import('@/utils/secureLogging').then(({ secureLog }) => {
        secureLog.info(`Starting deletion process for user: ${displayName}`, { userId });
      });
      setIsLoading(true);
      
      // Starting user deletion
      await deleteUser(userId);
      
      import('@/utils/secureLogging').then(({ secureLog }) => {
        secureLog.info('User deletion completed, refreshing data...');
      });
      
      // User deletion completed, refreshing data
      // Force a fresh fetch of all data
      const [usersData, familiesData] = await Promise.all([
        fetchAllUsers(),
        fetchAllFamilies()
      ]);
      
      import('@/utils/secureLogging').then(({ secureLog }) => {
        secureLog.info('Fresh data fetched successfully');
      });
      
      // Fetched fresh data successfully
      setUsers(usersData);
      setFamilies(familiesData);
      setIsLoading(false);
      
      toast({
        title: "Success",
        description: `User ${displayName} deleted successfully`,
      });
    } catch (error) {
      console.error('Error in handleDeleteUser:', error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: `Failed to delete user: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteFamily = async (familyId: string, familyName: string) => {
    try {
      // Starting family deletion
      await deleteFamily(familyId);
      
      // Family deletion completed, refreshing data
      // Force a fresh fetch of all data and clear existing state first
      setIsLoading(true);
      setFamilies([]); // Clear current families to force re-render
      setUsers([]); // Clear current users to force re-render
      
      const [usersData, familiesData] = await Promise.all([
        fetchAllUsers(),
        fetchAllFamilies()
      ]);
      
      // Fetched fresh data after family deletion successfully
      
      setUsers(usersData);
      setFamilies(familiesData);
      setIsLoading(false);
      
      toast({
        title: "Success",
        description: `Family ${familyName} and all members deleted successfully`,
      });
    } catch (error) {
      console.error('Error deleting family:', error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Failed to delete family",
        variant: "destructive",
      });
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-spin">⚙️</div>
          <p className="text-lg">Loading admin data...</p>
          <p className="text-sm text-muted-foreground">Fetching users and families...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="text-4xl">❌</div>
          <p className="text-lg font-semibold text-destructive">Data Loading Error</p>
          <p className="text-sm text-muted-foreground max-w-md">{error}</p>
          <Button onClick={loadData} variant="outline">
            Retry Loading Data
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create User Dialog */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Create a new user account with specified role and permissions.
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
                  placeholder="Secure password"
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
                <Select value={newUser.role} onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="kid">Kid</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="full_admin">Full Admin</SelectItem>
                    <SelectItem value="read_only_admin">Read Only Admin</SelectItem>
                    <SelectItem value="report_admin">Report Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUserDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateUser}>Create User</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Test Family Dialog */}
        <Dialog open={showFamilyDialog} onOpenChange={setShowFamilyDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Create Test Family
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Test Family</DialogTitle>
              <DialogDescription>
                Create a complete family with parent and children for testing purposes.
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
                <h3 className="text-lg font-semibold">Parent Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      placeholder="john@example.com"
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
                    placeholder="Secure password"
                  />
                </div>
              </div>

              <Separator />

              {/* Children Info */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Children</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addChild}>
                    Add Child
                  </Button>
                </div>
                {newFamily.children.map((child, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Child {index + 1}</h4>
                      {newFamily.children.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeChild(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`childName${index}`}>Name</Label>
                        <Input
                          id={`childName${index}`}
                          value={child.name}
                          onChange={(e) => updateChild(index, 'name', e.target.value)}
                          placeholder="Jane Smith"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`childEmail${index}`}>Email</Label>
                        <Input
                          id={`childEmail${index}`}
                          type="email"
                          value={child.email}
                          onChange={(e) => updateChild(index, 'email', e.target.value)}
                          placeholder="jane@example.com"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`childPassword${index}`}>Password</Label>
                      <Input
                        id={`childPassword${index}`}
                        type="password"
                        value={child.password}
                        onChange={(e) => updateChild(index, 'password', e.target.value)}
                        placeholder="Secure password"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowFamilyDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTestFamily}>Create Family</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* User and Family Management */}
      <div className="grid grid-cols-1 gap-6">
        {/* Existing Users - Enhanced with Email and Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserMinus className="h-5 w-5" />
              Manage Users ({users.filter(u => !['admin', 'full_admin', 'read_only_admin', 'report_admin'].includes(u.role) && 
                (u.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
                (roleFilter === "all" || u.role === roleFilter)).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Family</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users
                    .filter(user => !['admin', 'full_admin', 'read_only_admin', 'report_admin'].includes(user.role))
                    .filter(user => {
                      const matchesSearch = user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                           user.email?.toLowerCase().includes(searchTerm.toLowerCase());
                      const matchesRole = roleFilter === "all" || user.role === roleFilter;
                      return matchesSearch && matchesRole;
                    })
                    .map((user) => {
                    const familyInfo = getUserFamilyInfo(user);
                    const deleteValidation = canDeleteUser(user);
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.display_name}</p>
                            <p className="text-xs text-muted-foreground">{user.username}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-mono">{user.email}</span>
                          </div>
                          {user.email_alias && (
                            <p className="text-xs text-muted-foreground mt-1">Alias: {user.email_alias}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'parent' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{familyInfo.familyName}</p>
                            <p className="text-xs text-muted-foreground">{familyInfo.role}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserDetail(true);
                              }}
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowPasswordReset(true);
                              }}
                              title="Reset password"
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                            {deleteValidation.canDelete ? (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" title="Delete user">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete User</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete {user.display_name}? This action cannot be undone and will remove all associated data.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteUser(user.id, user.display_name)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete User
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            ) : (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                disabled
                                title={deleteValidation.reason || "Cannot delete this user"}
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {users.filter(user => {
                    const matchesSearch = user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesRole = roleFilter === "all" || user.role === roleFilter;
                    const isNotAdmin = !['admin', 'full_admin', 'read_only_admin', 'report_admin'].includes(user.role);
                    return matchesSearch && matchesRole && isNotAdmin;
                  }).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No users found matching the filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Existing Families */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5" />
              Manage Families ({families.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {families.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No families found
                </div>
              ) : (
                families.map((family) => (
                  <div key={family.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{family.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Parent: {family.parent_display_name} ({family.parent_email})
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Family Code: {family.family_code}
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Family
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Family</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{family.name}"? This will permanently delete the family and all its members. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteFamily(family.id, family.name)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete Family
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Detail Dialog */}
      {selectedUser && (
        <UserDetailDialog
          user={selectedUser}
          open={showUserDetail}
          onOpenChange={setShowUserDetail}
          onUpdate={loadData}
        />
      )}

      {/* Password Reset Dialog */}
      {selectedUser && (
        <UserPasswordResetDialog
          user={selectedUser}
          open={showPasswordReset}
          onOpenChange={setShowPasswordReset}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}

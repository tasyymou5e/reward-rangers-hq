import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Search, 
  Plus, 
  Eye,
  Edit,
  Trash2
} from "lucide-react";

export default function AdminFamilies() {
  const { profile } = useAdminAuth();
  const { toast } = useToast();
  const {
    fetchAllFamilies,
    createTestFamily,
    deleteFamily,
    loading
  } = useAdmin();

  // Permission helpers
  const isFullAdmin = () => ['admin', 'full_admin'].includes(profile?.role);
  const isReadOnlyAdmin = () => profile?.role === 'read_only_admin';
  const canModify = () => !isReadOnlyAdmin();

  const [families, setFamilies] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFamily, setSelectedFamily] = useState<any>(null);
  const [showFamilyDialog, setShowFamilyDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const [newTestFamily, setNewTestFamily] = useState({
    familyName: "",
    parentEmail: "",
    parentPassword: "",
    parentName: "",
    children: [
      { name: "", email: "", password: "" }
    ]
  });

  useEffect(() => {
    loadFamilies();
  }, []);

  const loadFamilies = async () => {
    try {
      const familiesData = await fetchAllFamilies();
      setFamilies(familiesData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load families",
        variant: "destructive",
      });
    }
  };

  const handleCreateTestFamily = async () => {
    try {
      await createTestFamily(newTestFamily);
      setShowCreateDialog(false);
      setNewTestFamily({
        familyName: "",
        parentEmail: "",
        parentPassword: "",
        parentName: "",
        children: [{ name: "", email: "", password: "" }]
      });
      await loadFamilies();
      toast({
        title: "Success",
        description: "Test family created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create test family",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFamily = async (familyId: string) => {
    const { confirm } = await import('@/components/ui/confirm-dialog').then(m => ({ confirm: m.useConfirmDialog().confirm }));
    const confirmed = await confirm(
      "Delete Family",
      "Are you sure you want to delete this family? This action cannot be undone.",
      { variant: "destructive", confirmText: "Delete Family" }
    );
    
    if (!confirmed) {
      return;
    }

    try {
      await deleteFamily(familyId);
      await loadFamilies();
      toast({
        title: "Success",
        description: "Family deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete family",
        variant: "destructive",
      });
    }
  };

  const addChild = () => {
    setNewTestFamily({
      ...newTestFamily,
      children: [...newTestFamily.children, { name: "", email: "", password: "" }]
    });
  };

  const removeChild = (index: number) => {
    const updatedChildren = newTestFamily.children.filter((_, i) => i !== index);
    setNewTestFamily({
      ...newTestFamily,
      children: updatedChildren
    });
  };

  const updateChild = (index: number, field: string, value: string) => {
    const updatedChildren = [...newTestFamily.children];
    updatedChildren[index] = { ...updatedChildren[index], [field]: value };
    setNewTestFamily({
      ...newTestFamily,
      children: updatedChildren
    });
  };

  const filteredFamilies = families.filter(family =>
    family.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    family.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-spin">⚙️</div>
          <p className="text-lg">Loading families...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-admin-primary flex items-center gap-2">
            <Users className="h-6 w-6" />
            Family Management
          </h1>
          <p className="text-admin-primary/70 mt-1">
            Manage family accounts and member relationships
          </p>
        </div>
        
        {canModify() && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-admin-primary hover:bg-admin-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Create Test Family
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Test Family</DialogTitle>
                <DialogDescription>
                  Create a test family with parent and children accounts for development.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="familyName">Family Name</Label>
                  <Input
                    id="familyName"
                    value={newTestFamily.familyName}
                    onChange={(e) => setNewTestFamily({...newTestFamily, familyName: e.target.value})}
                    placeholder="Smith Family"
                  />
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold">Parent Information</h3>
                  <div>
                    <Label htmlFor="parentName">Parent Name</Label>
                    <Input
                      id="parentName"
                      value={newTestFamily.parentName}
                      onChange={(e) => setNewTestFamily({...newTestFamily, parentName: e.target.value})}
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <Label htmlFor="parentEmail">Parent Email</Label>
                    <Input
                      id="parentEmail"
                      type="email"
                      value={newTestFamily.parentEmail}
                      onChange={(e) => setNewTestFamily({...newTestFamily, parentEmail: e.target.value})}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="parentPassword">Parent Password</Label>
                    <Input
                      id="parentPassword"
                      type="password"
                      value={newTestFamily.parentPassword}
                      onChange={(e) => setNewTestFamily({...newTestFamily, parentPassword: e.target.value})}
                      placeholder="Strong password"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Children</h3>
                    <Button type="button" onClick={addChild} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Child
                    </Button>
                  </div>
                  
                  {newTestFamily.children.map((child, index) => (
                    <div key={index} className="space-y-2 p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Child {index + 1}</span>
                        {newTestFamily.children.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeChild(index)}
                            size="sm"
                            variant="outline"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <Input
                        placeholder="Child name"
                        value={child.name}
                        onChange={(e) => updateChild(index, 'name', e.target.value)}
                      />
                      <Input
                        placeholder="Child email"
                        type="email"
                        value={child.email}
                        onChange={(e) => updateChild(index, 'email', e.target.value)}
                      />
                      <Input
                        placeholder="Child password"
                        type="password"
                        value={child.password}
                        onChange={(e) => updateChild(index, 'password', e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                <Button onClick={handleCreateTestFamily} className="w-full">
                  Create Test Family
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Families</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search families..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Families Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Families ({filteredFamilies.length})</span>
            <Badge variant="outline">{families.length} total families</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFamilies.map((family) => (
                <TableRow key={family.id}>
                  <TableCell className="font-medium">{family.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{family.code}</Badge>
                  </TableCell>
                  <TableCell>
                    {family.family_members?.length || 0} members
                  </TableCell>
                  <TableCell>
                    {new Date(family.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedFamily(family);
                          setShowFamilyDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canModify() && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteFamily(family.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Family Details Dialog */}
      <Dialog open={showFamilyDialog} onOpenChange={setShowFamilyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Family Details</DialogTitle>
          </DialogHeader>
          {selectedFamily && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Family Name</Label>
                  <p className="font-medium">{selectedFamily.name}</p>
                </div>
                <div>
                  <Label>Family Code</Label>
                  <Badge variant="outline">{selectedFamily.code}</Badge>
                </div>
                <div>
                  <Label>Created</Label>
                  <p className="font-medium">
                    {new Date(selectedFamily.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label>Members</Label>
                  <p className="font-medium">{selectedFamily.family_members?.length || 0}</p>
                </div>
              </div>
              
              {selectedFamily.family_members && selectedFamily.family_members.length > 0 && (
                <div>
                  <Label>Family Members</Label>
                  <div className="mt-2 space-y-2">
                    {selectedFamily.family_members.map((member: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <span>{member.profiles?.display_name || 'Unknown'}</span>
                        <Badge variant="secondary">{member.profiles?.role || 'Unknown'}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
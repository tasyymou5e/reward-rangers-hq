import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { useEnhancedErrorTracking } from "@/hooks/useEnhancedErrorTracking";
import { 
  Users, 
  Search, 
  Plus, 
  Eye,
  Edit,
  Trash2,
  ArrowUpDown,
  Filter,
  X,
  AlertTriangle,
  BarChart3
} from "lucide-react";
import { FamilyDetailDialog } from "@/components/admin/FamilyDetailDialog";
import { ContextualLoading, SkeletonList } from "@/components/ui/enhanced-loading";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DetailedErrorCard } from "@/components/admin/DetailedErrorCard";
import { ErrorAnalyticsDashboard } from "@/components/admin/ErrorAnalyticsDashboard";

function AdminFamiliesContent() {
  const { profile } = useAdminAuth();
  const { toast } = useToast();
  const {
    fetchAllFamilies,
    createTestFamily,
    deleteFamily,
    loading
  } = useAdmin();

  // Enhanced Error Tracking
  const {
    errors,
    errorHistory,
    metrics,
    trackError,
    trackSuccess,
    retryWithTracking,
    clearError,
    clearAllErrors,
    getError,
    hasError,
    getRecoverySuggestions,
    startOperation
  } = useEnhancedErrorTracking('AdminFamilies');

  // Permission helpers
  const isFullAdmin = () => ['admin', 'full_admin'].includes(profile?.role);
  const isReadOnlyAdmin = () => profile?.role === 'read_only_admin';
  const canModify = () => !isReadOnlyAdmin();

  const [families, setFamilies] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFamily, setSelectedFamily] = useState<any>(null);
  const [showFamilyDialog, setShowFamilyDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  
  // Enhanced search and filter state
  const [sortBy, setSortBy] = useState("name-asc");
  const [memberCountFilter, setMemberCountFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  
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
    const operationId = startOperation('loadFamilies', 'page_load');
    
    try {
      const familiesData = await retryWithTracking(
        () => fetchAllFamilies(),
        'loadFamilies',
        3,
        1000,
        'refresh_families_list'
      );
      
      console.log('Loaded families data:', familiesData);
      
      // Validate data structure
      const validatedData = Array.isArray(familiesData) ? familiesData : [];
      setFamilies(validatedData);
      
      trackSuccess(operationId, 'loadFamilies');
      
      // Clear any previous errors
      clearError('loadFamilies');
    } catch (error) {
      console.error('Error loading families:', error);
      
      trackError(error, 'loadFamilies', operationId, {
        attempted_retry: true,
        data_validation: 'array_check_failed'
      });
      
      toast({
        title: "Error",
        description: getError('loadFamilies')?.message || "Failed to load families",
        variant: "destructive",
      });
    }
  };

  const handleCreateTestFamily = async () => {
    const operationId = startOperation('createTestFamily', 'create_new_family', {
      family_name: newTestFamily.familyName,
      children_count: newTestFamily.children.length
    });
    
    try {
      await retryWithTracking(
        () => createTestFamily(newTestFamily),
        'createTestFamily',
        2,
        2000,
        'submit_family_creation_form'
      );
      
      setShowCreateDialog(false);
      setNewTestFamily({
        familyName: "",
        parentEmail: "",
        parentPassword: "",
        parentName: "",
        children: [{ name: "", email: "", password: "" }]
      });
      
      await loadFamilies();
      trackSuccess(operationId, 'createTestFamily');
      clearError('createTestFamily');
      
      toast({
        title: "Success",
        description: "Test family created successfully",
      });
    } catch (error) {
      trackError(error, 'createTestFamily', operationId, {
        form_data: {
          family_name: newTestFamily.familyName,
          parent_email: newTestFamily.parentEmail,
          children_count: newTestFamily.children.length
        }
      });
      
      toast({
        title: "Error",
        description: getError('createTestFamily')?.message || "Failed to create test family",
        variant: "destructive",
      });
    }
  };

  const [deleteConfirmFamily, setDeleteConfirmFamily] = useState<string | null>(null);

  const handleDeleteFamily = async (familyId: string) => {
    setDeleteConfirmFamily(familyId);
  };

  const confirmDeleteFamily = async () => {
    if (!deleteConfirmFamily) return;
    
    const operationId = startOperation('deleteFamily', 'confirm_delete_family', {
      family_id: deleteConfirmFamily
    });
    
    try {
      await retryWithTracking(
        () => deleteFamily(deleteConfirmFamily),
        'deleteFamily',
        2,
        1500,
        'confirm_family_deletion'
      );
      
      await loadFamilies();
      trackSuccess(operationId, 'deleteFamily');
      clearError('deleteFamily');
      
      toast({
        title: "Success",
        description: "Family deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting family:', error);
      
      trackError(error, 'deleteFamily', operationId, {
        family_id: deleteConfirmFamily,
        cascading_delete: true
      });
      
      toast({
        title: "Error",
        description: getError('deleteFamily')?.message || "Failed to delete family",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirmFamily(null);
    }
  };

  const handleFamilyClick = (family: any) => {
    setSelectedFamily(family);
    setShowDetailDialog(true);
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

  // Enhanced filtering and sorting logic with data validation
  const getFilteredAndSortedFamilies = () => {
    if (!Array.isArray(families)) {
      console.warn('Families is not an array:', families);
      return [];
    }

    let filtered = families.filter(family => {
      // Validate family object
      if (!family || typeof family !== 'object') {
        console.warn('Invalid family object:', family);
        return false;
      }

      // Search filter with null safety
      const familyName = family.name || '';
      const familyCode = family.family_code || family.code || '';
      const matchesSearch = familyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           familyCode.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Member count filter with proper fallback
      const memberCount = family.member_count || 0;
      const matchesMemberCount = memberCountFilter === "all" ||
        (memberCountFilter === "1-2" && memberCount >= 1 && memberCount <= 2) ||
        (memberCountFilter === "3-5" && memberCount >= 3 && memberCount <= 5) ||
        (memberCountFilter === "6+" && memberCount >= 6);
      
      // Date filter with validation
      let matchesDate = true;
      try {
        const createdDate = new Date(family.created_at);
        const now = new Date();
        if (isNaN(createdDate.getTime())) {
          console.warn('Invalid created_at date:', family.created_at);
        } else {
          matchesDate = dateFilter === "all" ||
            (dateFilter === "today" && createdDate.toDateString() === now.toDateString()) ||
            (dateFilter === "week" && (now.getTime() - createdDate.getTime()) <= 7 * 24 * 60 * 60 * 1000) ||
            (dateFilter === "month" && (now.getTime() - createdDate.getTime()) <= 30 * 24 * 60 * 60 * 1000) ||
            (dateFilter === "3months" && (now.getTime() - createdDate.getTime()) <= 90 * 24 * 60 * 60 * 1000);
        }
      } catch (error) {
        console.warn('Error processing date filter:', error);
      }
      
      return matchesSearch && matchesMemberCount && matchesDate;
    });

    // Sorting with safe comparisons
    filtered.sort((a, b) => {
      try {
        switch (sortBy) {
          case "name-asc":
            return (a.name || '').localeCompare(b.name || '');
          case "name-desc":
            return (b.name || '').localeCompare(a.name || '');
          case "date-newest":
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
          case "date-oldest":
            return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
          case "members-most":
            return (b.member_count || 0) - (a.member_count || 0);
          case "members-least":
            return (a.member_count || 0) - (b.member_count || 0);
          case "code-asc":
            return (a.family_code || a.code || '').localeCompare(b.family_code || b.code || '');
          default:
            return 0;
        }
      } catch (error) {
        console.warn('Error in sorting:', error);
        return 0;
      }
    });

    return filtered;
  };

  const filteredFamilies = getFilteredAndSortedFamilies();

  // Update active filters
  useEffect(() => {
    const filters = [];
    if (searchTerm) filters.push(`Search: "${searchTerm}"`);
    if (memberCountFilter !== "all") filters.push(`Members: ${memberCountFilter}`);
    if (dateFilter !== "all") filters.push(`Date: ${dateFilter}`);
    setActiveFilters(filters);
  }, [searchTerm, memberCountFilter, dateFilter]);

  const clearAllFilters = () => {
    setSearchTerm("");
    setMemberCountFilter("all");
    setDateFilter("all");
    setSortBy("name-asc");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Page Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <ContextualLoading 
              type="families" 
              message="Loading family management system..." 
              size="md"
            />
          </div>
        </div>
        
        {/* Content Skeleton */}
        <Card>
          <CardHeader>
            <CardTitle>Families</CardTitle>
          </CardHeader>
          <CardContent>
            <SkeletonList count={8} type="table" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {Object.keys(errors).length > 0 && (
        <div className="space-y-4">
          {Object.entries(errors).map(([operation, error]) => (
            <DetailedErrorCard
              key={error.id}
              error={error}
              onRetry={() => {
                switch (operation) {
                  case 'loadFamilies':
                    loadFamilies();
                    break;
                  case 'createTestFamily':
                    handleCreateTestFamily();
                    break;
                  case 'deleteFamily':
                    confirmDeleteFamily();
                    break;
                }
              }}
              onDismiss={() => clearError(operation)}
              suggestions={getRecoverySuggestions(operation)}
              showTechnicalDetails={profile?.role === 'admin'}
            />
          ))}
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="families" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="families" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Family Management
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Error Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="families" className="space-y-6">
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

          {/* Enhanced Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Search & Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by family name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Sort By */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Sort By</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-md">
                      <SelectItem value="name-asc">Name A-Z</SelectItem>
                      <SelectItem value="name-desc">Name Z-A</SelectItem>
                      <SelectItem value="date-newest">Newest First</SelectItem>
                      <SelectItem value="date-oldest">Oldest First</SelectItem>
                      <SelectItem value="members-most">Most Members</SelectItem>
                      <SelectItem value="members-least">Least Members</SelectItem>
                      <SelectItem value="code-asc">Code A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Member Count Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Member Count</Label>
                  <Select value={memberCountFilter} onValueChange={setMemberCountFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-md">
                      <SelectItem value="all">All Families</SelectItem>
                      <SelectItem value="1-2">1-2 Members</SelectItem>
                      <SelectItem value="3-5">3-5 Members</SelectItem>
                      <SelectItem value="6+">6+ Members</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Created</Label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All time" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-md">
                      <SelectItem value="all">All time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This week</SelectItem>
                      <SelectItem value="month">This month</SelectItem>
                      <SelectItem value="3months">Last 3 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={clearAllFilters}
                    className="w-full"
                    disabled={activeFilters.length === 0}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </div>

              {/* Active Filters Display */}
              {activeFilters.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {activeFilters.map((filter, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {filter}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-muted-foreground" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Families</p>
                    <p className="text-2xl font-bold">{families.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Filter className="h-8 w-8 text-muted-foreground" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Filtered Results</p>
                    <p className="text-2xl font-bold">{filteredFamilies.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Search className="h-8 w-8 text-muted-foreground" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Search Active</p>
                    <p className="text-2xl font-bold">{searchTerm ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Families Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Families
                <Badge variant="outline" className="ml-2">
                  {filteredFamilies.length} of {families.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredFamilies.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground">No families found</h3>
                  <p className="text-sm text-muted-foreground">
                    {families.length === 0 
                      ? "No families exist yet." 
                      : "Try adjusting your search or filter criteria."
                    }
                  </p>
                  {activeFilters.length > 0 && (
                    <Button variant="outline" onClick={clearAllFilters} className="mt-4">
                      <X className="h-4 w-4 mr-2" />
                      Clear all filters
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => setSortBy(sortBy === "name-asc" ? "name-desc" : "name-asc")}>
                        <div className="flex items-center gap-2">
                          Name
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => setSortBy(sortBy === "code-asc" ? "code-desc" : "code-asc")}>
                        <div className="flex items-center gap-2">
                          Code
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => setSortBy(sortBy === "members-most" ? "members-least" : "members-most")}>
                        <div className="flex items-center gap-2">
                          Members
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => setSortBy(sortBy === "date-newest" ? "date-oldest" : "date-newest")}>
                        <div className="flex items-center gap-2">
                          Created
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFamilies.map((family) => (
                      <TableRow 
                        key={family.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleFamilyClick(family)}
                      >
                        <TableCell className="font-medium">{family.name || 'Unnamed Family'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{family.family_code || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {family.member_count || 0} members
                            </span>
                            <div className="text-xs text-muted-foreground">
                              {family.parent_display_name || family.parent_email || 'Parent'} (Parent)
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {family.created_at ? new Date(family.created_at).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFamilyClick(family);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canModify() && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFamily(family.id);
                                }}
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <ErrorAnalyticsDashboard
            metrics={metrics}
            errorHistory={errorHistory}
            onRefresh={() => {
              loadFamilies();
              clearAllErrors();
            }}
            onExportData={() => {
              const exportData = {
                metrics,
                errorHistory: errorHistory.slice(0, 50),
                timestamp: new Date().toISOString()
              };
              
              const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
              });
              
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `admin-families-error-report-${new Date().toISOString().split('T')[0]}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              
              toast({
                title: "Export Complete",
                description: "Error analytics data exported successfully",
              });
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs moved outside of tabs to prevent rendering issues */}
      <ConfirmDialog
        open={deleteConfirmFamily !== null}
        onOpenChange={(open) => !open && setDeleteConfirmFamily(null)}
        title="Delete Family"
        description="Are you sure you want to delete this family? This action cannot be undone and will remove all associated data."
        confirmText="Delete Family"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmDeleteFamily}
      />

      <FamilyDetailDialog
        family={selectedFamily}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        onUpdate={loadFamilies}
      />
    </div>
  );
}

export default function AdminFamilies() {
  return (
    <ErrorBoundary componentName="AdminFamilies">
      <AdminFamiliesContent />
    </ErrorBoundary>
  );
}
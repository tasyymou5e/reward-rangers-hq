import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Search, Filter, Edit, Trash2, Trophy, Clock, Star, Users } from 'lucide-react';

interface ChoreTemplate {
  id: string;
  title: string;
  description: string | null;
  points_value: number;
  estimated_time_minutes: number | null;
  difficulty: string;
  category: string;
  autism_friendly: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export default function AdminChoreTemplates() {
  const [templates, setTemplates] = useState<ChoreTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAutismFriendly, setFilterAutismFriendly] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('title');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ChoreTemplate | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points_value: 10,
    estimated_time_minutes: 15,
    difficulty: 'easy',
    category: 'general',
    autism_friendly: false,
    is_active: true
  });

  const categories = [
    'general', 'bedroom', 'kitchen', 'bathroom', 'living-room', 'outdoor', 'pets', 'homework'
  ];

  const difficultyColors = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800'
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('chore_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to fetch chore templates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingTemplate) {
        const { error } = await supabase
          .from('chore_templates')
          .update(formData)
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast({ title: "Success", description: "Template updated successfully" });
      } else {
        const { error } = await supabase
          .from('chore_templates')
          .insert([formData]);

        if (error) throw error;
        toast({ title: "Success", description: "Template created successfully" });
      }

      await fetchTemplates();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('chore_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Template deleted successfully" });
      await fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive"
      });
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('chore_templates')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
      await fetchTemplates();
      toast({ 
        title: "Success", 
        description: `Template ${!isActive ? 'activated' : 'deactivated'} successfully` 
      });
    } catch (error) {
      console.error('Error toggling template status:', error);
      toast({
        title: "Error",
        description: "Failed to update template status",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      points_value: 10,
      estimated_time_minutes: 15,
      difficulty: 'easy',
      category: 'general',
      autism_friendly: false,
      is_active: true
    });
    setEditingTemplate(null);
  };

  const openEditDialog = (template: ChoreTemplate) => {
    setEditingTemplate(template);
    setFormData({
      title: template.title,
      description: template.description || '',
      points_value: template.points_value,
      estimated_time_minutes: template.estimated_time_minutes || 15,
      difficulty: template.difficulty,
      category: template.category,
      autism_friendly: template.autism_friendly,
      is_active: template.is_active
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getFilteredAndSortedTemplates = () => {
    let filtered = templates.filter(template => {
      const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesDifficulty = filterDifficulty === 'all' || template.difficulty === filterDifficulty;
      const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
      const matchesAutismFriendly = filterAutismFriendly === 'all' || 
                                  (filterAutismFriendly === 'true' && template.autism_friendly) ||
                                  (filterAutismFriendly === 'false' && !template.autism_friendly);

      return matchesSearch && matchesDifficulty && matchesCategory && matchesAutismFriendly;
    });

    // Sort templates
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'points':
          return b.points_value - a.points_value;
        case 'difficulty':
          const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        case 'category':
          return a.category.localeCompare(b.category);
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredTemplates = getFilteredAndSortedTemplates();
  const activeFiltersCount = [filterDifficulty, filterCategory, filterAutismFriendly].filter(f => f !== 'all').length;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Chore Templates</h1>
          <p className="text-muted-foreground">Manage default chore templates for families</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g., Make your bed"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Detailed instructions for completing this chore"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="points">Points</Label>
                  <Input
                    id="points"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.points_value}
                    onChange={(e) => setFormData({...formData, points_value: parseInt(e.target.value) || 10})}
                  />
                </div>
                <div>
                  <Label htmlFor="time">Time (minutes)</Label>
                  <Input
                    id="time"
                    type="number"
                    min="1"
                    max="240"
                    value={formData.estimated_time_minutes}
                    onChange={(e) => setFormData({...formData, estimated_time_minutes: parseInt(e.target.value) || 15})}
                  />
                </div>
                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={formData.difficulty} onValueChange={(value) => setFormData({...formData, difficulty: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="autism-friendly"
                    checked={formData.autism_friendly}
                    onCheckedChange={(checked) => setFormData({...formData, autism_friendly: checked})}
                  />
                  <Label htmlFor="autism-friendly">Autism-friendly</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  {editingTemplate ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount} active</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title">Title A-Z</SelectItem>
                <SelectItem value="points">Points (High-Low)</SelectItem>
                <SelectItem value="difficulty">Difficulty</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="created">Newest First</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
              <SelectTrigger>
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterAutismFriendly} onValueChange={setFilterAutismFriendly}>
              <SelectTrigger>
                <SelectValue placeholder="Accessibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Templates</SelectItem>
                <SelectItem value="true">Autism-friendly</SelectItem>
                <SelectItem value="false">Standard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Templates</p>
                <p className="text-2xl font-bold">{templates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{templates.filter(t => t.is_active).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Autism-friendly</p>
                <p className="text-2xl font-bold">{templates.filter(t => t.autism_friendly).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Time</p>
                <p className="text-2xl font-bold">
                  {Math.round(templates.reduce((acc, t) => acc + (t.estimated_time_minutes || 0), 0) / templates.length || 0)}m
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Showing {filteredTemplates.length} of {templates.length} templates
        </p>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No templates found matching your filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className={`transition-all hover:shadow-md ${!template.is_active ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg leading-tight">{template.title}</h3>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className={difficultyColors[template.difficulty]}>
                        {template.difficulty}
                      </Badge>
                      <Badge variant="outline">{template.category}</Badge>
                      {template.autism_friendly && (
                        <Badge variant="outline" className="text-blue-600">
                          <Star className="h-3 w-3 mr-1" />
                          Accessible
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => openEditDialog(template)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(template.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {template.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {template.description}
                  </p>
                )}
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <Trophy className="h-4 w-4 mr-1 text-yellow-600" />
                      {template.points_value} pts
                    </span>
                    {template.estimated_time_minutes && (
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-blue-600" />
                        {template.estimated_time_minutes}m
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={template.is_active ? "outline" : "default"}
                    onClick={() => toggleActive(template.id, template.is_active)}
                  >
                    {template.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
import { useState, useEffect, useMemo } from 'react';
import { Search, X, Clock, Star, Filter, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { supabase } from '@/integrations/supabase/client';

interface SearchResult {
  id: string;
  type: 'family' | 'user' | 'chore' | 'invitation';
  title: string;
  subtitle?: string;
  data: any;
  relevance: number;
}

interface SearchPreset {
  id: string;
  name: string;
  query: string;
  filters: SearchFilters;
  isDefault?: boolean;
}

interface SearchFilters {
  types: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  status?: string[];
  roles?: string[];
}

interface GlobalSearchSystemProps {
  onResultSelect?: (result: SearchResult) => void;
}

export function GlobalSearchSystem({ onResultSelect }: GlobalSearchSystemProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchPresets, setSearchPresets] = useState<SearchPreset[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    types: ['family', 'user', 'chore', 'invitation']
  });
  const [showFilters, setShowFilters] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Load saved searches and presets on mount
  useEffect(() => {
    loadSavedData();
    loadDefaultPresets();
  }, []);

  // Debounced search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (query.length >= 2) {
        performSearch();
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query, filters]);

  // Generate suggestions based on query
  useEffect(() => {
    if (query.length >= 1) {
      generateSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const loadSavedData = () => {
    const saved = localStorage.getItem('chatterbox-recent-searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  };

  const loadDefaultPresets = () => {
    const defaultPresets: SearchPreset[] = [
      {
        id: 'active-families',
        name: 'Active Families',
        query: '',
        filters: { types: ['family'], status: ['active'] },
        isDefault: true
      },
      {
        id: 'new-users',
        name: 'New Users (Last 7 days)',
        query: '',
        filters: { 
          types: ['user'],
          dateRange: {
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            end: new Date()
          }
        },
        isDefault: true
      },
      {
        id: 'pending-invitations',
        name: 'Pending Invitations',
        query: '',
        filters: { types: ['invitation'], status: ['pending'] },
        isDefault: true
      },
      {
        id: 'admin-users',
        name: 'Admin Users',
        query: '',
        filters: { types: ['user'], roles: ['admin'] },
        isDefault: true
      }
    ];

    setSearchPresets(defaultPresets);
  };

  const saveRecentSearch = (searchQuery: string) => {
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('chatterbox-recent-searches', JSON.stringify(updated));
  };

  const generateSuggestions = async () => {
    try {
      const suggestions: string[] = [];
      
      // Add common search terms
      const commonTerms = ['family', 'user', 'admin', 'parent', 'child', 'active', 'pending'];
      suggestions.push(...commonTerms.filter(term => 
        term.toLowerCase().includes(query.toLowerCase())
      ));

      // Add recent family names
      const { data: families } = await supabase
        .from('families')
        .select('name')
        .ilike('name', `%${query}%`)
        .limit(3);
      
      if (families) {
        suggestions.push(...families.map(f => f.name));
      }

      setSuggestions([...new Set(suggestions)].slice(0, 8));
    } catch (error) {
      console.error('Error generating suggestions:', error);
    }
  };

  const performSearch = async () => {
    setLoading(true);
    try {
      const searchResults: SearchResult[] = [];
      
      // Parse advanced operators
      const parsedQuery = parseAdvancedQuery(query);
      
      // Search families
      if (filters.types.includes('family')) {
        const { data: families } = await supabase
          .from('families')
          .select('id, name, description, parent_id, created_at')
          .or(`name.ilike.%${parsedQuery.terms.join('%')},description.ilike.%${parsedQuery.terms.join('%')}`)
          .limit(10);
        
        if (families) {
          searchResults.push(...families.map(family => ({
            id: family.id,
            type: 'family' as const,
            title: family.name,
            subtitle: family.description || 'Family',
            data: family,
            relevance: calculateRelevance(family.name, query)
          })));
        }
      }

      // Search users
      if (filters.types.includes('user')) {
        const { data: users } = await supabase
          .from('profiles')
          .select('id, display_name, email, role, created_at')
          .or(`display_name.ilike.%${parsedQuery.terms.join('%')},email.ilike.%${parsedQuery.terms.join('%')}`)
          .limit(10);
        
        if (users) {
          searchResults.push(...users.map(user => ({
            id: user.id,
            type: 'user' as const,
            title: user.display_name,
            subtitle: `${user.email} (${user.role})`,
            data: user,
            relevance: calculateRelevance(user.display_name + ' ' + user.email, query)
          })));
        }
      }

      // Search chores
      if (filters.types.includes('chore')) {
        const { data: chores } = await supabase
          .from('chores')
          .select('id, title, description, status, created_at')
          .or(`title.ilike.%${parsedQuery.terms.join('%')},description.ilike.%${parsedQuery.terms.join('%')}`)
          .limit(10);
        
        if (chores) {
          searchResults.push(...chores.map(chore => ({
            id: chore.id,
            type: 'chore' as const,
            title: chore.title,
            subtitle: `${chore.description} (${chore.status})`,
            data: chore,
            relevance: calculateRelevance(chore.title + ' ' + (chore.description || ''), query)
          })));
        }
      }

      // Sort by relevance
      searchResults.sort((a, b) => b.relevance - a.relevance);
      setResults(searchResults);
      
      // Save search if it has results
      if (searchResults.length > 0) {
        saveRecentSearch(query);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseAdvancedQuery = (query: string) => {
    // Parse operators like AND, OR, NOT
    const terms = query.split(/\s+/).filter(Boolean);
    const andTerms: string[] = [];
    const orTerms: string[] = [];
    const notTerms: string[] = [];
    
    let currentOperator = 'AND';
    
    for (let i = 0; i < terms.length; i++) {
      const term = terms[i].toUpperCase();
      
      if (term === 'AND' || term === 'OR' || term === 'NOT') {
        currentOperator = term;
        continue;
      }
      
      switch (currentOperator) {
        case 'AND':
          andTerms.push(terms[i]);
          break;
        case 'OR':
          orTerms.push(terms[i]);
          break;
        case 'NOT':
          notTerms.push(terms[i]);
          break;
      }
    }
    
    return {
      terms: andTerms.length > 0 ? andTerms : terms,
      orTerms,
      notTerms
    };
  };

  const calculateRelevance = (text: string, query: string): number => {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    
    // Exact match gets highest score
    if (lowerText === lowerQuery) return 100;
    
    // Starts with query gets high score
    if (lowerText.startsWith(lowerQuery)) return 80;
    
    // Contains query gets medium score
    if (lowerText.includes(lowerQuery)) return 60;
    
    // Word boundaries get some score
    const words = lowerQuery.split(' ');
    const matchingWords = words.filter(word => lowerText.includes(word));
    return (matchingWords.length / words.length) * 40;
  };

  const applyPreset = (preset: SearchPreset) => {
    setQuery(preset.query);
    setFilters(preset.filters);
    setShowFilters(false);
  };

  const saveCurrentAsPreset = () => {
    const presetName = prompt('Enter a name for this search preset:');
    if (presetName) {
      const newPreset: SearchPreset = {
        id: `custom-${Date.now()}`,
        name: presetName,
        query,
        filters
      };
      setSearchPresets(prev => [...prev, newPreset]);
    }
  };

  const typeIcons = {
    family: '👨‍👩‍👧‍👦',
    user: '👤',
    chore: '✅',
    invitation: '📧'
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search families, users, chores... (try: family AND active OR user NOT admin)"
          className="pl-10 pr-20"
        />
        
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          <Dialog open={showFilters} onOpenChange={setShowFilters}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Filter className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Search Filters & Presets</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Search Presets */}
                <div>
                  <h4 className="font-medium mb-2">Quick Presets</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {searchPresets.map(preset => (
                      <Button
                        key={preset.id}
                        variant="outline"
                        size="sm"
                        onClick={() => applyPreset(preset)}
                        className="justify-start"
                      >
                        {preset.isDefault && <Star className="h-3 w-3 mr-1" />}
                        {preset.name}
                      </Button>
                    ))}
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={saveCurrentAsPreset}
                    className="mt-2"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Save Current as Preset
                  </Button>
                </div>
                
                <Separator />
                
                {/* Content Types */}
                <div>
                  <h4 className="font-medium mb-2">Content Types</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(typeIcons).map(([type, icon]) => (
                      <label key={type} className="flex items-center space-x-2">
                        <Checkbox
                          checked={filters.types.includes(type)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilters(prev => ({
                                ...prev,
                                types: [...prev.types, type]
                              }));
                            } else {
                              setFilters(prev => ({
                                ...prev,
                                types: prev.types.filter(t => t !== type)
                              }));
                            }
                          }}
                        />
                        <span className="text-sm">{icon} {type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          {query && (
            <Button variant="ghost" size="sm" onClick={() => setQuery('')}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {(filters.types.length < 4 || filters.status?.length || filters.roles?.length) && (
        <div className="flex flex-wrap gap-2">
          {filters.types.map(type => (
            <Badge key={type} variant="secondary">
              {typeIcons[type as keyof typeof typeIcons]} {type}
            </Badge>
          ))}
          {filters.status?.map(status => (
            <Badge key={status} variant="outline">Status: {status}</Badge>
          ))}
          {filters.roles?.map(role => (
            <Badge key={role} variant="outline">Role: {role}</Badge>
          ))}
        </div>
      )}

      {/* Suggestions */}
      {query && suggestions.length > 0 && !loading && results.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {suggestions.map(suggestion => (
                <Button
                  key={suggestion}
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuery(suggestion)}
                  className="h-auto py-1 px-2"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Searches */}
      {!query && recentSearches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Searches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {recentSearches.slice(0, 5).map((search, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuery(search)}
                  className="h-auto py-1 px-2"
                >
                  {search}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Search Results ({results.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {results.map(result => (
                  <div
                    key={`${result.type}-${result.id}`}
                    className="p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => onResultSelect?.(result)}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg">{typeIcons[result.type]}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{result.title}</p>
                          <Badge variant="outline" className="text-xs">
                            {result.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {result.relevance}% match
                          </span>
                        </div>
                        {result.subtitle && (
                          <p className="text-sm text-muted-foreground truncate">
                            {result.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Searching...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {query && !loading && results.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No results found for "{query}"</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try different keywords or check your filters
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
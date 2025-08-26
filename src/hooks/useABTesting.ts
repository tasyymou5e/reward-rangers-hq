import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ABTest {
  id: string;
  name: string;
  description: string;
  feature_key: string;
  variants: Array<{
    name: string;
    config: any;
    weight?: number;
  }>;
  active: boolean;
  start_date: string;
  end_date?: string;
  target_audience: any;
}

interface ABTestAssignment {
  test_id: string;
  variant: string;
  assigned_at: string;
}

export function useABTesting() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserAssignments();
    }
  }, [user]);

  const loadUserAssignments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('ab_test_assignments')
        .select(`
          variant,
          ab_tests!inner (
            feature_key,
            active,
            start_date,
            end_date
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const assignmentMap: Record<string, string> = {};
      data?.forEach((assignment: any) => {
        const test = assignment.ab_tests;
        // Only include active tests within date range
        if (test.active && 
            new Date(test.start_date) <= new Date() &&
            (!test.end_date || new Date(test.end_date) > new Date())) {
          assignmentMap[test.feature_key] = assignment.variant;
        }
      });

      setAssignments(assignmentMap);
    } catch (error) {
      console.error('Error loading A/B test assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVariant = (featureKey: string, defaultVariant: string = 'control'): string => {
    return assignments[featureKey] || defaultVariant;
  };

  const isInVariant = (featureKey: string, variantName: string): boolean => {
    return getVariant(featureKey) === variantName;
  };

  // Admin functions
  const createABTest = async (testData: any) => {
    const { data, error } = await supabase
      .from('ab_tests')
      .insert({
        ...testData,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updateABTest = async (testId: string, updates: any) => {
    const { data, error } = await supabase
      .from('ab_tests')
      .update(updates)
      .eq('id', testId)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const assignUserToVariant = async (testId: string, userId: string, variant: string) => {
    const { data, error } = await supabase
      .from('ab_test_assignments')
      .upsert({
        test_id: testId,
        user_id: userId,
        variant,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const getAllTests = async () => {
    const { data, error } = await supabase
      .from('ab_tests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const getTestAssignments = async (testId: string) => {
    const { data, error } = await supabase
      .from('ab_test_assignments')
      .select(`
        *,
        profiles (display_name, email)
      `)
      .eq('test_id', testId);

    if (error) throw error;
    return data || [];
  };

  const getTestAnalytics = async (testId: string) => {
    const { data, error } = await supabase
      .from('ab_test_assignments')
      .select('variant')
      .eq('test_id', testId);

    if (error) throw error;

    // Count assignments per variant
    const variantCounts: Record<string, number> = {};
    data?.forEach(assignment => {
      variantCounts[assignment.variant] = (variantCounts[assignment.variant] || 0) + 1;
    });

    return {
      totalAssignments: data?.length || 0,
      variantDistribution: variantCounts,
    };
  };

  return {
    assignments,
    loading,
    getVariant,
    isInVariant,
    createABTest,
    updateABTest,
    assignUserToVariant,
    getAllTests,
    getTestAssignments,
    getTestAnalytics,
    refreshAssignments: loadUserAssignments,
  };
}
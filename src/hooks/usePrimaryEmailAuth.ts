import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmailMemberData {
  firstName: string;
  lastName: string;
  role: 'co_parent' | 'child' | 'guardian';
  birthDate?: string; // For children
}

export const usePrimaryEmailAuth = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createFamilyWithPrimaryEmail = useCallback(async (
    primaryEmail: string,
    familyName: string,
    primaryParentData: {
      firstName: string;
      lastName: string;
      password: string;
    }
  ) => {
    setLoading(true);
    try {
      // Create the primary parent account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: primaryEmail,
        password: primaryParentData.password,
        options: {
          data: {
            first_name: primaryParentData.firstName,
            last_name: primaryParentData.lastName,
          },
        },
      });

      if (authError) throw authError;

      // Create family with primary email designator
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .insert({
          name: familyName,
          parent_id: authData.user?.id,
          primary_email_designator: primaryEmail,
          created_by_primary_email: true,
        })
        .select()
        .single();

      if (familyError) throw familyError;

      // Add primary parent to family members
      await supabase.from('family_members').insert({
        family_id: familyData.id,
        user_id: authData.user?.id,
      });

      toast({
        title: "Family Created Successfully",
        description: `${familyName} family created with primary email ${primaryEmail}`,
      });

      return { success: true, family: familyData, user: authData.user };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create family';
      toast({
        title: "Error Creating Family",
        description: message,
        variant: "destructive",
      });
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const addFamilyMemberWithAlias = useCallback(async (
    familyId: string,
    memberData: EmailMemberData,
    aliasEmail: string,
    primaryEmail: string
  ) => {
    setLoading(true);
    try {
      // Create user account with alias email
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: aliasEmail,
        password: generateTemporaryPassword(),
        options: {
          data: {
            first_name: memberData.firstName,
            last_name: memberData.lastName,
            role: memberData.role,
          },
        },
      });

      if (authError) throw authError;

      // Add to family members
      await supabase.from('family_members').insert({
        family_id: familyId,
        user_id: authData.user?.id,
      });

      // Create email alias record
      await supabase.from('email_aliases').insert({
        family_id: familyId,
        user_id: authData.user?.id,
        alias_email: aliasEmail,
        primary_email: primaryEmail,
        role: memberData.role,
        is_active: true,
      });

      // Create age profile for children
      if (memberData.role === 'child' && memberData.birthDate) {
        await supabase.from('age_profiles').insert({
          user_id: authData.user?.id,
          birth_date: memberData.birthDate,
          age_group: calculateAgeGroup(memberData.birthDate),
        });
      }

      toast({
        title: "Family Member Added",
        description: `${memberData.firstName} added with email ${aliasEmail}`,
      });

      return { success: true, user: authData.user };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add family member';
      toast({
        title: "Error Adding Family Member",
        description: message,
        variant: "destructive",
      });
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const resolveToPrimaryEmail = useCallback(async (email: string) => {
    try {
      const { data, error } = await supabase.rpc('resolve_to_primary_email', {
        input_email: email,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error resolving primary email:', error);
      return email; // Fallback to original email
    }
  }, []);

  const getFamilyByEmail = useCallback(async (email: string) => {
    try {
      const { data, error } = await supabase.rpc('get_family_by_email', {
        input_email: email,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting family by email:', error);
      return null;
    }
  }, []);

  return {
    loading,
    createFamilyWithPrimaryEmail,
    addFamilyMemberWithAlias,
    resolveToPrimaryEmail,
    getFamilyByEmail,
  };
};

// Helper functions
function generateTemporaryPassword(): string {
  return Math.random().toString(36).slice(-8) + 'A1!';
}

function calculateAgeGroup(birthDate: string): string {
  const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
  if (age >= 3 && age <= 5) return '3-5';
  if (age >= 6 && age <= 10) return '6-10';
  if (age >= 11 && age <= 15) return '11-15';
  return '6-10'; // Default
}
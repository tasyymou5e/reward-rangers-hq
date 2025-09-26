import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmailMemberData {
  firstName: string;
  lastName: string;
  role: 'co_parent' | 'child' | 'guardian';
  birthDate?: string; // For children
}

/**
 * Primary Email Authentication Hook
 * Manages family email designators and alias resolution
 */
export const usePrimaryEmailAuth = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Resolve an email to its primary family designator
   */
  const resolveToPrimaryEmail = useCallback(async (email: string): Promise<string> => {
    try {
      const { data, error } = await supabase.rpc('resolve_to_primary_email_secure', {
        input_email: email
      });

      if (error) {
        console.warn('Email resolution failed:', error);
        return email; // Fallback to original email
      }

      return data || email;
    } catch (error) {
      console.warn('Email resolution error:', error);
      return email; // Fallback to original email
    }
  }, []);

  /**
   * Get family ID by email (supports both primary and alias emails)
   */
  const getFamilyByEmail = useCallback(async (email: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.rpc('get_family_by_email_secure', {
        input_email: email
      });

      if (error) {
        console.warn('Family lookup failed:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.warn('Family lookup error:', error);
      return null;
    }
  }, []);

  /**
   * Create a family with primary email designator
   */
  const createFamilyWithPrimaryEmail = useCallback(async (
    primaryEmail: string,
    familyName: string,
    primaryParentData: {
      firstName: string;
      lastName: string;
      password: string;
    },
    additionalMembers: EmailMemberData[] = []
  ) => {
    setLoading(true);
    
    try {
      // First create the parent account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: primaryEmail,
        password: primaryParentData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: primaryParentData.firstName,
            last_name: primaryParentData.lastName,
            role: 'parent'
          }
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // Create the family with primary email designator
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .insert({
          name: familyName,
          parent_id: authData.user.id,
          primary_email_designator: primaryEmail,
          created_by_primary_email: true
        })
        .select()
        .single();

      if (familyError) throw familyError;

      // Set up primary email designator
      const { error: designatorError } = await supabase.rpc('setup_primary_email_designator_secure', {
        p_family_id: familyData.id,
        p_primary_email: primaryEmail,
        p_primary_user_id: authData.user.id
      });

      if (designatorError) {
        console.warn('Failed to set up email designator:', designatorError);
      }

      toast({
        title: "Family Created Successfully",
        description: `Welcome to ${familyName}! Your primary email system is now active.`,
      });

      return {
        success: true,
        family: familyData,
        user: authData.user
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create family';
      
      toast({
        title: "Family Creation Failed",
        description: errorMessage,
        variant: "destructive",
      });

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Join a family using invitation code
   */
  const joinFamilyWithCode = useCallback(async (familyCode: string) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('join_family_with_code_secure', {
        family_code_input: familyCode
      });

      if (error) throw error;

      toast({
        title: "Successfully Joined Family",
        description: `Welcome to ${typeof data === 'object' && data && 'family_name' in data ? data.family_name : 'the family'}!`,
      });

      return {
        success: true,
        data
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join family';
      
      toast({
        title: "Failed to Join Family",
        description: errorMessage,
        variant: "destructive",
      });

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Check if an email is already associated with a family
   */
  const checkEmailAvailability = useCallback(async (email: string) => {
    try {
      const familyId = await getFamilyByEmail(email);
      const resolvedEmail = await resolveToPrimaryEmail(email);
      
      return {
        isAvailable: !familyId,
        hasFamily: !!familyId,
        familyId,
        resolvedEmail,
        isAlias: resolvedEmail !== email
      };
    } catch (error) {
      return {
        isAvailable: true, // Assume available on error
        hasFamily: false,
        familyId: null,
        resolvedEmail: email,
        isAlias: false
      };
    }
  }, [getFamilyByEmail, resolveToPrimaryEmail]);

  /**
   * Add a family member with email alias
   */
  const addFamilyMemberWithAlias = useCallback(async (
    familyId: string,
    memberData: EmailMemberData,
    aliasEmail: string,
    primaryEmail: string
  ) => {
    setLoading(true);
    
    try {
      // Create email alias for the member
      const { error: aliasError } = await supabase.rpc('create_family_email_alias_secure', {
        p_family_id: familyId,
        p_user_id: null, // Will be updated when user account is created
        p_display_name: `${memberData.firstName} ${memberData.lastName}`,
        p_member_type: memberData.role === 'child' ? 'child' : 'parent'
      });

      if (aliasError) {
        console.warn('Failed to create email alias:', aliasError);
      }

      toast({
        title: "Member Added",
        description: `${memberData.firstName} ${memberData.lastName} has been added to the family.`,
      });

      return {
        success: true
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add family member';
      
      toast({
        title: "Failed to Add Member",
        description: errorMessage,
        variant: "destructive",
      });

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    resolveToPrimaryEmail,
    getFamilyByEmail,
    createFamilyWithPrimaryEmail,
    joinFamilyWithCode,
    checkEmailAvailability,
    addFamilyMemberWithAlias,
    loading
  };
};
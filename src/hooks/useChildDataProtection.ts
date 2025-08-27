import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Enhanced data protection hook specifically for children's data privacy
 * Implements additional safeguards beyond standard RLS policies
 */
export function useChildDataProtection() {
  const { user, profile } = useAuth();
  const [parentalConsent, setParentalConsent] = useState<boolean>(false);
  const [dataAccessRestrictions, setDataAccessRestrictions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Checks if the current user can access child data
   * Implements COPPA-like protections
   */
  const canAccessChildData = async (childUserId: string): Promise<boolean> => {
    if (!user || !profile) return false;

    try {
      // Admins have restricted access with additional logging
      if (profile.role === 'admin') {
        await logChildDataAccess(childUserId, 'admin_access_attempt');
        return true;
      }

      // Parents can access their own children's data
      if (profile.role === 'parent') {
        const { data: familyCheck } = await supabase
          .rpc('validate_family_access', {
            family_id_param: null, // Will be checked by the function
            user_id_param: user.id,
            required_role: 'parent'
          });

        if (familyCheck) {
          // Verify the child belongs to this parent's family
          const { data: childInFamily } = await supabase
            .from('family_members')
            .select('family_id')
            .eq('user_id', childUserId)
            .single();

          if (childInFamily) {
            const { data: parentFamily } = await supabase
              .from('families')
              .select('id')
              .eq('parent_id', user.id)
              .eq('id', childInFamily.family_id)
              .single();

            if (parentFamily) {
              await logChildDataAccess(childUserId, 'parent_access_granted');
              return true;
            }
          }
        }
      }

      // Children can only access their own data
      if (profile.role === 'kid' && user.id === childUserId) {
        await logChildDataAccess(childUserId, 'self_access');
        return true;
      }

      await logChildDataAccess(childUserId, 'access_denied');
      return false;
    } catch (error) {
      await logChildDataAccess(childUserId, 'access_error', { error: String(error) });
      return false;
    }
  };

  /**
   * Logs all access attempts to children's data for audit purposes
   */
  const logChildDataAccess = async (
    childUserId: string, 
    accessType: string, 
    metadata?: any
  ) => {
    try {
      await supabase.rpc('log_security_event_with_rate_limit', {
        event_type: 'child_data_access',
        user_id_param: user?.id,
        metadata_param: {
          child_user_id: childUserId,
          access_type: accessType,
          timestamp: new Date().toISOString(),
          user_role: profile?.role,
          ...metadata
        }
      });
    } catch (error) {
      // Silently handle logging errors to not break functionality
      console.error('Failed to log child data access:', error);
    }
  };

  /**
   * Checks and updates parental consent status
   */
  const checkParentalConsent = async (familyId: string): Promise<boolean> => {
    try {
      const { data: aiSettings } = await supabase
        .from('family_ai_settings')
        .select('data_sharing_consent')
        .eq('family_id', familyId)
        .single();

      const consentGiven = aiSettings?.data_sharing_consent || false;
      setParentalConsent(consentGiven);

      if (!consentGiven) {
        setDataAccessRestrictions(prev => [
          ...prev,
          'data_sharing_restricted',
          'analytics_limited',
          'external_services_blocked'
        ]);
      }

      return consentGiven;
    } catch (error) {
      setParentalConsent(false);
      setDataAccessRestrictions(prev => [...prev, 'consent_check_failed']);
      return false;
    }
  };

  /**
   * Applies data minimization for child profiles
   * Removes or masks sensitive data based on access level
   */
  const minimizeChildData = (childData: any, accessLevel: 'parent' | 'admin' | 'self' | 'none') => {
    if (accessLevel === 'none') return null;

    const minimizedData = { ...childData };

    // Always remove internal IDs and timestamps for external access
    if (accessLevel !== 'admin') {
      delete minimizedData.created_at;
      delete minimizedData.updated_at;
    }

    // Mask email for non-parent access
    if (accessLevel !== 'parent' && accessLevel !== 'self') {
      if (minimizedData.email) {
        const [local, domain] = minimizedData.email.split('@');
        minimizedData.email = `${local.substring(0, 1)}***@${domain}`;
      }
    }

    // Remove sensitive metadata
    delete minimizedData.last_activity;
    if (accessLevel !== 'admin') {
      delete minimizedData.ip_address;
      delete minimizedData.user_agent;
    }

    return minimizedData;
  };

  /**
   * Updates data sharing consent (parent only)
   */
  const updateDataSharingConsent = async (familyId: string, consent: boolean): Promise<boolean> => {
    if (!user || profile?.role !== 'parent') {
      throw new Error('Only parents can update data sharing consent');
    }

    try {
      const { error } = await supabase
        .from('family_ai_settings')
        .upsert({
          family_id: familyId,
          data_sharing_consent: consent,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Log consent change
      await supabase.rpc('log_security_event', {
        event_type: 'child_data_consent_updated',
        user_id_param: user.id,
        metadata_param: {
          family_id: familyId,
          consent_granted: consent,
          timestamp: new Date().toISOString()
        }
      });

      setParentalConsent(consent);
      
      // Update restrictions based on new consent
      if (consent) {
        setDataAccessRestrictions(prev => 
          prev.filter(r => !r.includes('data_sharing'))
        );
      } else {
        setDataAccessRestrictions(prev => [
          ...prev,
          'data_sharing_restricted'
        ]);
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to update consent: ${error}`);
    }
  };

  useEffect(() => {
    const initializeDataProtection = async () => {
      if (!user || !profile) return;

      try {
        setLoading(true);

        // Check if user has family association
        if (profile.role === 'parent') {
          const { data: family } = await supabase
            .from('families')
            .select('id')
            .eq('parent_id', user.id)
            .single();

          if (family) {
            await checkParentalConsent(family.id);
          }
        } else if (profile.role === 'kid') {
          const { data: familyMember } = await supabase
            .from('family_members')
            .select('family_id')
            .eq('user_id', user.id)
            .single();

          if (familyMember) {
            await checkParentalConsent(familyMember.family_id);
          }
        }
      } catch (error) {
        setDataAccessRestrictions(['initialization_failed']);
      } finally {
        setLoading(false);
      }
    };

    initializeDataProtection();
  }, [user, profile]);

  return {
    canAccessChildData,
    parentalConsent,
    dataAccessRestrictions,
    minimizeChildData,
    updateDataSharingConsent,
    loading
  };
}
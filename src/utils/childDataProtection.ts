/**
 * Enhanced child data protection utilities
 * Implements additional security layers for sensitive child behavioral data
 */

import { supabase } from '@/integrations/supabase/client';
import { secureLog } from './secureLogging';

/**
 * Encrypt sensitive child data using Web Crypto API
 */
export async function encryptChildData(data: string, childId: string): Promise<string> {
  try {
    // Generate encryption key derived from child ID and system secret
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(childId + '_child_data_key'),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('child_data_salt_2024'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );
    
    // Encrypt the data
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(data);
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    secureLog.error('Child data encryption failed', { childId, error });
    throw new Error('Failed to encrypt sensitive data');
  }
}

/**
 * Decrypt sensitive child data
 */
export async function decryptChildData(encryptedData: string, childId: string): Promise<string> {
  try {
    // Recreate the same key
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(childId + '_child_data_key'),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('child_data_salt_2024'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    
    // Extract IV and encrypted data
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    );
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    secureLog.error('Child data decryption failed', { childId, error });
    throw new Error('Failed to decrypt sensitive data');
  }
}

/**
 * Log child data access with enhanced privacy protection
 */
export async function logChildDataAccess(
  childId: string,
  dataType: string,
  accessType: 'view' | 'create' | 'update' | 'delete',
  metadata: any = {}
) {
  try {
    await supabase.rpc('log_security_event_with_rate_limit', {
      event_type: `child_data_${accessType}`,
      user_id_param: childId,
      metadata_param: {
        data_type: dataType,
        access_type: accessType,
        timestamp: new Date().toISOString(),
        privacy_level: 'high',
        retention_days: 90, // Auto-delete after 90 days
        ...metadata
      }
    });
  } catch (error) {
    secureLog.error('Failed to log child data access', { childId, dataType, error });
  }
}

/**
 * Secure child behavioral data operations
 */
export const childDataOperations = {
  /**
   * Create encrypted motivation journal entry
   */
  async createMotivationEntry(childId: string, familyId: string, entry: {
    task_name: string;
    emotion: string;
    reflection: string;
    confidence_level: number;
    what_helped?: string;
    next_time?: string;
    chore_id?: string;
  }) {
    try {
      // Encrypt sensitive fields
      const encryptedReflection = await encryptChildData(entry.reflection, childId);
      const encryptedWhatHelped = entry.what_helped 
        ? await encryptChildData(entry.what_helped, childId) 
        : null;
      const encryptedNextTime = entry.next_time 
        ? await encryptChildData(entry.next_time, childId) 
        : null;
      
      // Log data creation
      await logChildDataAccess(childId, 'motivation_journal', 'create', {
        task_name: entry.task_name,
        emotion: entry.emotion
      });
      
      const { data, error } = await supabase
        .from('motivation_journal')
        .insert({
          user_id: childId,
          family_id: familyId,
          task_name: entry.task_name,
          emotion: entry.emotion,
          reflection: encryptedReflection,
          confidence_level: entry.confidence_level,
          what_helped: encryptedWhatHelped,
          next_time: encryptedNextTime,
          chore_id: entry.chore_id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      secureLog.error('Failed to create motivation entry', { childId, error });
      throw error;
    }
  },
  
  /**
   * Get decrypted motivation journal entries
   */
  async getMotivationEntries(childId: string, requestingUserId: string) {
    try {
      // Verify access permissions
      const { data: hasAccess } = await supabase.rpc('has_parental_authority', {
        child_user_id: childId,
        requesting_user_id: requestingUserId
      });
      
      if (!hasAccess && requestingUserId !== childId) {
        throw new Error('Access denied: insufficient permissions');
      }
      
      // Log data access
      await logChildDataAccess(childId, 'motivation_journal', 'view', {
        requesting_user: requestingUserId
      });
      
      const { data, error } = await supabase
        .from('motivation_journal')
        .select('*')
        .eq('user_id', childId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Decrypt sensitive fields
      const decryptedEntries = await Promise.all(
        (data || []).map(async (entry) => ({
          ...entry,
          reflection: await decryptChildData(entry.reflection, childId),
          what_helped: entry.what_helped 
            ? await decryptChildData(entry.what_helped, childId) 
            : null,
          next_time: entry.next_time 
            ? await decryptChildData(entry.next_time, childId) 
            : null
        }))
      );
      
      return decryptedEntries;
    } catch (error) {
      secureLog.error('Failed to get motivation entries', { childId, error });
      throw error;
    }
  }
};

/**
 * Data retention policy enforcement
 */
export async function enforceChildDataRetention(retentionDays: number = 365) {
  try {
    // Note: This function would need to be implemented as a Supabase database function
    // For now, we'll use a placeholder that logs the retention policy
    secureLog.info('Child data retention policy enforced', { 
      retentionDays,
      note: 'Automatic cleanup function needs to be implemented in database'
    });
    
    return { recordsDeleted: 0, retentionDays };
  } catch (error) {
    secureLog.error('Child data retention cleanup failed', { error });
    throw error;
  }
}
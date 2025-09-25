import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bell, Mail, Settings, Users, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NotificationPreferences {
  id: string;
  family_id: string;
  consolidate_to_primary: boolean;
  delegation_rules: any;
  created_at: string;
  updated_at: string;
}

interface NotificationRouting {
  id: string;
  notification_type: string;
  recipient_type: string;
  recipient_user_id: string | null;
  recipient_profile?: {
    display_name: string;
    username: string;
  };
}

interface NotificationConsolidationManagerProps {
  familyId: string;
  primaryEmail: string;
  familyMembers: any[];
  canManage?: boolean;
}

const NOTIFICATION_TYPES = [
  { value: 'chore_completion', label: 'Chore Completions', icon: '✅' },
  { value: 'chore_approval', label: 'Chore Approvals', icon: '👍' },
  { value: 'achievement_unlocked', label: 'Achievements', icon: '🏆' },
  { value: 'wishlist_approved', label: 'Wishlist Items', icon: '✨' },
  { value: 'family_announcement', label: 'Family Updates', icon: '📢' },
  { value: 'reward_redemption', label: 'Reward Claims', icon: '🎁' },
  { value: 'daily_summary', label: 'Daily Summaries', icon: '📊' },
];

export const NotificationConsolidationManager: React.FC<NotificationConsolidationManagerProps> = ({
  familyId,
  primaryEmail,
  familyMembers,
  canManage = false,
}) => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [routingRules, setRoutingRules] = useState<NotificationRouting[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotificationPreferences();
    fetchRoutingRules();
  }, [familyId]);

  const fetchNotificationPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('family_id', familyId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setPreferences(data);
      } else {
        // Create default preferences
        const { data: newPrefs, error: createError } = await supabase
          .from('notification_preferences')
          .insert({
            family_id: familyId,
            consolidate_to_primary: true,
            delegation_rules: {},
          })
          .select()
          .single();
        
        if (createError) throw createError;
        setPreferences(newPrefs);
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load notification preferences",
        variant: "destructive",
      });
    }
  };

  const fetchRoutingRules = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_routing')
        .select(`
          *,
          recipient_profile:profiles!notification_routing_recipient_user_id_fkey(
            display_name,
            username
          )
        `)
        .eq('family_id', familyId);

      if (error) throw error;
      setRoutingRules(data || []);
    } catch (error) {
      console.error('Error fetching routing rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateConsolidation = async (consolidate: boolean) => {
    if (!preferences) return;

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update({ consolidate_to_primary: consolidate })
        .eq('id', preferences.id);

      if (error) throw error;

      setPreferences({ ...preferences, consolidate_to_primary: consolidate });
      toast({
        title: "Settings Updated",
        description: `Notification consolidation ${consolidate ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error updating consolidation:', error);
      toast({
        title: "Error",
        description: "Failed to update consolidation settings",
        variant: "destructive",
      });
    }
  };

  const createDelegationRule = async (notificationType: string, recipientId: string) => {
    try {
      const { error } = await supabase
        .from('notification_routing')
        .insert({
          family_id: familyId,
          notification_type: notificationType,
          recipient_type: 'delegated_member',
          recipient_user_id: recipientId,
        });

      if (error) throw error;

      toast({
        title: "Delegation Rule Created",
        description: `${NOTIFICATION_TYPES.find(t => t.value === notificationType)?.label} notifications will be delegated`,
      });

      fetchRoutingRules();
    } catch (error) {
      console.error('Error creating delegation rule:', error);
      toast({
        title: "Error",
        description: "Failed to create delegation rule",
        variant: "destructive",
      });
    }
  };

  const removeDelegationRule = async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from('notification_routing')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      toast({
        title: "Delegation Rule Removed",
        description: "Notifications will now go to the primary parent",
      });

      fetchRoutingRules();
    } catch (error) {
      console.error('Error removing delegation rule:', error);
      toast({
        title: "Error",
        description: "Failed to remove delegation rule",
        variant: "destructive",
      });
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    return NOTIFICATION_TYPES.find(t => t.value === type)?.label || type;
  };

  const getNotificationTypeIcon = (type: string) => {
    return NOTIFICATION_TYPES.find(t => t.value === type)?.icon || '📧';
  };

  const getAvailableTypes = () => {
    return NOTIFICATION_TYPES.filter(type => 
      !routingRules.some(rule => rule.notification_type === type.value)
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">Loading notification settings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Consolidation Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Consolidation
          </CardTitle>
          <CardDescription>
            Control how family notifications are consolidated to your primary email: {primaryEmail}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">
                Consolidate all family notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Route all family notifications to the primary parent email instead of individual member emails
              </p>
            </div>
            {canManage && (
              <Switch
                checked={preferences?.consolidate_to_primary || false}
                onCheckedChange={updateConsolidation}
              />
            )}
          </div>
          
          {preferences?.consolidate_to_primary && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
              <Bell className="h-4 w-4" />
              All family notifications are being sent to {primaryEmail}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delegation Rules */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Notification Delegation
              </CardTitle>
              <CardDescription>
                Delegate specific notification types to other family members
              </CardDescription>
            </div>
            {canManage && getAvailableTypes().length > 0 && (
              <Select onValueChange={(type) => {
                const recipientId = familyMembers[0]?.user_id;
                if (recipientId) createDelegationRule(type, recipientId);
              }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Add delegation rule" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableTypes().map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {routingRules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No delegation rules configured</p>
              {canManage && (
                <p className="text-sm">All notifications go to the primary parent</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {routingRules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {getNotificationTypeIcon(rule.notification_type)}
                    </span>
                    <div>
                      <div className="font-medium">
                        {getNotificationTypeLabel(rule.notification_type)}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        Primary Parent <ArrowRight className="h-3 w-3" />
                        <Badge variant="secondary">
                          {rule.recipient_profile?.display_name || 'Delegated Member'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {canManage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDelegationRule(rule.id)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${preferences?.consolidate_to_primary ? 'bg-green-500' : 'bg-gray-400'}`} />
              Consolidation: {preferences?.consolidate_to_primary ? 'Active' : 'Disabled'}
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${routingRules.length > 0 ? 'bg-blue-500' : 'bg-gray-400'}`} />
              Delegation Rules: {routingRules.length}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
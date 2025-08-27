import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Users, 
  MessageSquare, 
  CheckCircle, 
  AlertCircle,
  Wifi,
  WifiOff,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RealTimeActivity {
  id: string;
  type: 'chore_completed' | 'user_joined' | 'message_sent' | 'family_created';
  message: string;
  timestamp: string;
  user?: string;
  family?: string;
}

export function RealTimeDashboard() {
  const [isConnected, setIsConnected] = useState(false);
  const [activities, setActivities] = useState<RealTimeActivity[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<number>(0);
  const [activeChores, setActiveChores] = useState<number>(0);
  const [recentMessages, setRecentMessages] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    // Set up real-time subscriptions
    const channel = supabase
      .channel('admin-dashboard')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'progress_logs'
        },
        (payload) => {
          const newActivity: RealTimeActivity = {
            id: payload.new.id,
            type: 'chore_completed',
            message: `Chore completed: ${payload.new.action}`,
            timestamp: new Date().toISOString(),
            user: payload.new.user_id
          };
          
          setActivities(prev => [newActivity, ...prev.slice(0, 49)]);
          setActiveChores(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'family_messages'
        },
        (payload) => {
          const newActivity: RealTimeActivity = {
            id: payload.new.id,
            type: 'message_sent',
            message: `New message in family chat`,
            timestamp: new Date().toISOString(),
            user: payload.new.user_id,
            family: payload.new.family_id
          };
          
          setActivities(prev => [newActivity, ...prev.slice(0, 49)]);
          setRecentMessages(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'families'
        },
        (payload) => {
          const newActivity: RealTimeActivity = {
            id: payload.new.id,
            type: 'family_created',
            message: `New family created: ${payload.new.name}`,
            timestamp: new Date().toISOString()
          };
          
          setActivities(prev => [newActivity, ...prev.slice(0, 49)]);
          
          toast({
            title: "New Family Registered!",
            description: `${payload.new.name} just joined ChoreQuest`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          const newActivity: RealTimeActivity = {
            id: payload.new.id,
            type: 'user_joined',
            message: `New user joined: ${payload.new.display_name}`,
            timestamp: new Date().toISOString(),
            user: payload.new.id
          };
          
          setActivities(prev => [newActivity, ...prev.slice(0, 49)]);
          setOnlineUsers(prev => prev + 1);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Load initial data
    loadInitialData();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const loadInitialData = async () => {
    try {
      // Get recent activities from the last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const [choresResult, messagesResult, usersResult] = await Promise.all([
        supabase
          .from('progress_logs')
          .select('*')
          .gte('created_at', oneHourAgo)
          .order('created_at', { ascending: false })
          .limit(10),
        
        supabase
          .from('family_messages')
          .select('*')
          .gte('created_at', oneHourAgo)
          .order('created_at', { ascending: false })
          .limit(10),
        
        supabase
          .from('profiles')
          .select('*')
          .gte('last_activity', oneHourAgo)
      ]);

      setActiveChores(choresResult.data?.length || 0);
      setRecentMessages(messagesResult.data?.length || 0);
      setOnlineUsers(usersResult.data?.length || 0);

      // Create activity feed from recent data
      const recentActivities: RealTimeActivity[] = [
        ...(choresResult.data || []).map(log => ({
          id: log.id,
          type: 'chore_completed' as const,
          message: `Chore completed: ${log.action}`,
          timestamp: log.created_at,
          user: log.user_id
        })),
        ...(messagesResult.data || []).map(msg => ({
          id: msg.id,
          type: 'message_sent' as const,
          message: 'New message in family chat',
          timestamp: msg.created_at,
          user: msg.user_id,
          family: msg.family_id
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setActivities(recentActivities.slice(0, 20));

    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'chore_completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'user_joined':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'message_sent':
        return <MessageSquare className="h-4 w-4 text-purple-600" />;
      case 'family_created':
        return <Activity className="h-4 w-4 text-orange-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-600" />
              )}
              Real-Time Dashboard
            </CardTitle>
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Real-Time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onlineUsers}</div>
            <p className="text-xs text-muted-foreground">Last hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Chores</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeChores}</div>
            <p className="text-xs text-muted-foreground">Completed recently</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentMessages}</div>
            <p className="text-xs text-muted-foreground">Last hour</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Live Activity Feed</CardTitle>
            <Button variant="outline" size="sm" onClick={loadInitialData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm">Activity will appear here in real-time</p>
              </div>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {activity.type.replace('_', ' ')}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
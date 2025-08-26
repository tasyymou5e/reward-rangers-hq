import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, Send, StickyNote, Megaphone, Clock } from 'lucide-react';
import { useFamilyChat } from '@/hooks/useFamilyChat';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export function FamilyChat() {
  const { user } = useAuth();
  const { messages, loading, sendMessage } = useFamilyChat();
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<'chat' | 'note' | 'announcement'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await sendMessage(newMessage, messageType);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'note':
        return <StickyNote className="h-4 w-4" />;
      case 'announcement':
        return <Megaphone className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'note':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'announcement':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const chatMessages = messages.filter(m => m.message_type === 'chat');
  const notes = messages.filter(m => m.message_type === 'note');
  const announcements = messages.filter(m => m.message_type === 'announcement');

  if (loading) {
    return (
      <Card className="bg-white">
        <CardContent className="p-6">
          <div className="text-center">Loading family communication...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-parents-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-parents-primary">
          <MessageCircle className="h-5 w-5" />
          Family Communication
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Chat ({chatMessages.length})
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <StickyNote className="h-4 w-4" />
              Notes ({notes.length})
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              Announcements ({announcements.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-4">
            <div className="h-64 overflow-y-auto border rounded-lg p-4 space-y-3 bg-muted/20">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex flex-col gap-1 ${
                    message.user_id === user?.id ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg ${
                      message.user_id === user?.id
                        ? 'bg-parents-primary text-white'
                        : 'bg-white border'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{message.user_profile?.display_name}</span>
                    <Clock className="h-3 w-3" />
                    <span>{format(new Date(message.created_at), 'HH:mm')}</span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <div className="h-64 overflow-y-auto space-y-3">
              {notes.map((note) => (
                <div key={note.id} className={`p-3 rounded-lg border ${getMessageColor(note.message_type)}`}>
                  <div className="flex items-start gap-2">
                    {getMessageIcon(note.message_type)}
                    <div className="flex-1">
                      <p className="text-sm">{note.content}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                        <span>{note.user_profile?.display_name}</span>
                        <span>{format(new Date(note.created_at), 'MMM d, HH:mm')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="announcements" className="space-y-4">
            <div className="h-64 overflow-y-auto space-y-3">
              {announcements.map((announcement) => (
                <div key={announcement.id} className={`p-3 rounded-lg border ${getMessageColor(announcement.message_type)}`}>
                  <div className="flex items-start gap-2">
                    {getMessageIcon(announcement.message_type)}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{announcement.content}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                        <span>{announcement.user_profile?.display_name}</span>
                        <span>{format(new Date(announcement.created_at), 'MMM d, HH:mm')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-3 mt-4 pt-4 border-t">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={messageType === 'chat' ? 'default' : 'outline'}
              onClick={() => setMessageType('chat')}
              className={messageType === 'chat' ? 'bg-parents-primary' : ''}
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              Chat
            </Button>
            <Button
              size="sm"
              variant={messageType === 'note' ? 'default' : 'outline'}
              onClick={() => setMessageType('note')}
              className={messageType === 'note' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
            >
              <StickyNote className="h-4 w-4 mr-1" />
              Note
            </Button>
            <Button
              size="sm"
              variant={messageType === 'announcement' ? 'default' : 'outline'}
              onClick={() => setMessageType('announcement')}
              className={messageType === 'announcement' ? 'bg-blue-500 hover:bg-blue-600' : ''}
            >
              <Megaphone className="h-4 w-4 mr-1" />
              Announce
            </Button>
          </div>
          <div className="flex gap-2">
            {messageType === 'chat' ? (
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
            ) : (
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Write a ${messageType}...`}
                className="flex-1 min-h-[80px]"
              />
            )}
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="bg-parents-primary hover:bg-parents-primary/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
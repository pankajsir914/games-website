import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  created_at: string;
  message_type: 'user' | 'system' | 'win';
  multiplier?: number;
  amount?: number;
}

interface LiveChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
}

const LiveChat = ({ messages, onSendMessage }: LiveChatProps) => {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to send messages",
        variant: "destructive",
      });
      return;
    }
    
    if (newMessage.trim()) {
      if (newMessage.trim().length > 200) {
        toast({
          title: "Message Too Long",
          description: "Messages must be 200 characters or less",
          variant: "destructive",
        });
        return;
      }
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const getPlayerInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'win': return 'text-gaming-success';
      case 'system': return 'text-primary';
      default: return 'text-foreground';
    }
  };

  const maskUsername = (username: string) => {
    if (username.length <= 3) return username;
    return username.substring(0, 2) + '*'.repeat(username.length - 3) + username.slice(-1);
  };

  return (
    <Card className="bg-slate-900/95 border-slate-700/50 h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          Live Chat
          <Badge variant="secondary" className="text-xs">
            {messages.length > 99 ? '99+' : messages.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="space-y-2 pb-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <div className="text-xs">No messages yet</div>
                <div className="text-xs mt-1">Start the conversation!</div>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="flex gap-2">
                  {msg.message_type !== 'system' && (
                    <Avatar className="w-6 h-6 mt-0.5">
                      <AvatarFallback className="text-xs bg-slate-700">
                        {getPlayerInitials(msg.username)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {msg.message_type !== 'system' && (
                        <span className="text-xs font-medium text-primary truncate">
                          {maskUsername(msg.username)}
                        </span>
                      )}
                      {msg.message_type === 'system' && (
                        <span className="text-xs font-medium text-primary truncate">
                          {msg.username}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatTime(msg.created_at)}
                      </span>
                      {msg.message_type === 'win' && (
                        <Badge className="bg-green-600 text-white text-xs">
                          WIN
                        </Badge>
                      )}
                    </div>
                    
                    <div className={`text-xs ${getMessageColor(msg.message_type)}`}>
                      {msg.message_type === 'win' && msg.multiplier && msg.amount ? (
                        <span className="font-medium">
                          won ₹{msg.amount.toLocaleString()} at {msg.multiplier.toFixed(2)}x! 🎉
                        </span>
                      ) : msg.message_type === 'system' ? (
                        <span className="italic">{msg.message}</span>
                      ) : (
                        msg.message
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-slate-700/50 p-4">
          {user ? (
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="bg-slate-800 border-slate-600 text-foreground text-xs"
                maxLength={200}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                size="sm"
                className="px-3"
              >
                <Send className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <div className="text-center py-2">
              <span className="text-xs text-muted-foreground">
                Sign in to join the chat
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveChat;
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: Date;
  type: 'message' | 'win' | 'system';
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

  const handleSendMessage = () => {
    if (newMessage.trim() && user) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const getPlayerInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
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
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-2 pb-4">
            {messages.map((msg) => (
              <div key={msg.id} className="flex gap-2">
                {msg.type !== 'system' && (
                  <Avatar className="w-6 h-6 mt-0.5">
                    <AvatarFallback className="text-xs bg-slate-700">
                      {getPlayerInitials(msg.user)}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {msg.type !== 'system' && (
                      <span className="text-xs font-medium text-primary truncate">
                        {msg.user.slice(0, 8)}***
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  
                  <div className={`text-xs ${getMessageColor(msg.type)}`}>
                    {msg.type === 'win' && msg.multiplier && msg.amount ? (
                      <span className="font-medium">
                        Won ₹{msg.amount.toFixed(2)} at {msg.multiplier.toFixed(2)}x! 🎉
                      </span>
                    ) : msg.type === 'system' ? (
                      <span className="italic">{msg.message}</span>
                    ) : (
                      msg.message
                    )}
                  </div>
                </div>
              </div>
            ))}

            {messages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <div className="text-xs">No messages yet</div>
                <div className="text-xs mt-1">Start the conversation!</div>
              </div>
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
                placeholder="Type a message..."
                className="bg-slate-800 border-slate-600 text-foreground text-xs"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                maxLength={100}
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
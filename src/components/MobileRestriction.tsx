import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MobileRestriction = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gaming-dark to-gaming-darker flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-gradient-card border-gaming-gold/20">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <Monitor className="h-16 w-16 text-gaming-gold" />
              <div className="absolute -bottom-2 -right-2 bg-gaming-danger rounded-full p-1">
                <Smartphone className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          <CardTitle className="text-xl font-bold text-gaming-gold">
            Desktop Access Required
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-2 text-gaming-danger">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Mobile Access Restricted</span>
          </div>
          
          <p className="text-muted-foreground leading-relaxed">
            The Master Admin Panel is only accessible on desktop devices for security and usability reasons.
          </p>
          
          <div className="bg-background/10 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-gaming-gold">To access the admin panel:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Use a desktop or laptop computer</li>
              <li>• Ensure screen width is at least 1024px</li>
              <li>• Use a modern web browser</li>
            </ul>
          </div>
          
          <div className="pt-4">
            <Button 
              onClick={() => navigate('/')}
              className="w-full bg-gaming-gold text-gaming-gold-foreground hover:bg-gaming-gold/90"
            >
              <Monitor className="h-4 w-4 mr-2" />
              Return to Main Site
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            For technical support, contact the system administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
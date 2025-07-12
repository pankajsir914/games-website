
import React from 'react';
import { Button } from "@/components/ui/button";
import { AlertTriangle } from 'lucide-react';

interface DisclaimerModalProps {
  isOpen: boolean;
  onAgree: () => void;
  onExit: () => void;
}

const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ isOpen, onAgree, onExit }) => {
  if (!isOpen) return null;

  const handleExit = () => {
    window.location.href = 'https://www.google.com';
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Semi-transparent background */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      {/* Modal content */}
      <div className="relative bg-background border border-border rounded-lg shadow-2xl max-w-md w-full mx-4 p-6">
        <div className="text-center space-y-6">
          {/* Warning icon */}
          <div className="flex justify-center">
            <div className="bg-gaming-warning/10 p-3 rounded-full">
              <AlertTriangle className="h-8 w-8 text-gaming-warning" />
            </div>
          </div>
          
          {/* Heading */}
          <h2 className="text-2xl font-bold text-foreground">
            Disclaimer
          </h2>
          
          {/* Message */}
          <p className="text-muted-foreground leading-relaxed">
            This platform offers real-money games. Users must be 18+ and responsible while playing. 
            We do not support gambling addiction.
          </p>
          
          {/* Age restriction notice */}
          <div className="bg-gaming-warning/5 border border-gaming-warning/20 rounded-lg p-3">
            <p className="text-sm text-gaming-warning font-medium">
              🔞 You must be 18 years or older to use this platform
            </p>
          </div>
          
          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={onAgree}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              I Agree & Continue
            </Button>
            <Button 
              onClick={handleExit}
              variant="outline"
              className="flex-1 border-gaming-warning text-gaming-warning hover:bg-gaming-warning/10"
            >
              Exit Site
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerModal;

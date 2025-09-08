import React, { useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { SimpleSportsDashboard } from '@/components/sports/SimpleSportsDashboard';

const Sports: React.FC = () => {
  useEffect(() => {
    document.title = 'Sports Dashboard — Live Matches & Betting';
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <Navigation />
      </header>
      <SimpleSportsDashboard />
    </div>
  );
};

export default Sports;
import React, { useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { SportsDashboard } from '@/components/sports/SportsDashboard';
import { SportsDataProvider } from '@/contexts/SportsDataContext';


const Sports: React.FC = () => {
  useEffect(() => {
    document.title = 'Sports Dashboard — Live Matches & Betting';
  }, []);

  return (
    <SportsDataProvider>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
          <Navigation />
        </header>
        <SportsDashboard />
      </div>
    </SportsDataProvider>
  );
};

export default Sports;
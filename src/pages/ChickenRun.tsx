import React, { useEffect } from 'react';
import { ChickenRoadGame } from '@/components/chickenRoad/ChickenRoadGame';

const ChickenRun = () => {
  useEffect(() => {
    document.title = 'Chicken Run India – Bet & Cross the Road';
    const metaDescId = 'meta-chicken-run-description';
    const canonicalId = 'link-chicken-run-canonical';

    let desc = document.querySelector(`meta[name="description"]#${metaDescId}`) as HTMLMetaElement | null;
    if (!desc) {
      desc = document.createElement('meta');
      desc.name = 'description';
      desc.id = metaDescId;
      document.head.appendChild(desc);
    }
    desc.content = 'Play Chicken Run India: place a bet, jump through sections, avoid fire traps, and cash out rewards. Fast, fun, and skill-based gameplay.';

    let canonical = document.querySelector(`link[rel="canonical"]#${canonicalId}`) as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      canonical.id = canonicalId;
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.href;

    return () => {
      // keep SEO tags; no cleanup to avoid flicker when navigating back
    };
  }, []);

  return <ChickenRoadGame />;
};

export default ChickenRun;
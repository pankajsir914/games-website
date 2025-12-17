import { useState, useEffect } from 'react';

export const useDeviceDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const userAgent = navigator.userAgent;

      // Check for mobile devices
      const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) || width < 768;
      
      // Check for tablet devices
      const tabletCheck = /iPad|Android/i.test(userAgent) && width >= 768 && width <= 1024;
      
      // Desktop is anything not mobile/tablet and width > 1024
      const desktopCheck = width > 1024 && !mobileCheck && !tabletCheck;

      setIsMobile(mobileCheck && !tabletCheck);
      setIsTablet(tabletCheck);
      setIsDesktop(desktopCheck);
    };

    // Check on mount
    checkDevice();

    // Check on resize
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop,
    deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
  };
};
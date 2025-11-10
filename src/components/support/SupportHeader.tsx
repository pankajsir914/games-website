import { Headphones } from "lucide-react";

export const SupportHeader = () => {
  return (
    <div className="text-center mb-8 sm:mb-12 animate-fade-in px-3 sm:px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-primary rounded-full mb-4 sm:mb-6">
        <Headphones className="h-8 w-8 sm:h-10 sm:w-10 text-primary-foreground" />
      </div>
      
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-primary bg-clip-text text-transparent">
        We're Here to Help
      </h1>
      
      <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-4 sm:mb-6 px-4">
        Our support team is available 24/7 to assist you with any questions or issues
      </p>
      
      <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-green-500/10 border border-green-500/20 rounded-full">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm font-medium text-green-600 dark:text-green-400">
          Support Online - Average response time: 3 minutes
        </span>
      </div>
    </div>
  );
};

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface ContactCardProps {
  platform: "telegram" | "whatsapp" | "email";
  title: string;
  description: string;
  link: string;
  icon: LucideIcon;
  color: string;
  isOnline: boolean;
  responseTime: string;
}

export const ContactCard = ({
  title,
  description,
  link,
  icon: Icon,
  color,
  isOnline,
  responseTime,
}: ContactCardProps) => {
  const handleClick = () => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 animate-fade-in">
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5 group-hover:opacity-10 transition-opacity`} />
      
      <CardContent className="p-4 sm:p-6 relative">
        <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
          {/* Icon */}
          <div className={`relative p-3 sm:p-4 rounded-2xl bg-gradient-to-br ${color} group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            {isOnline && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-card animate-pulse" />
            )}
          </div>
          
          {/* Content */}
          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground min-h-[40px]">
              {description}
            </p>
          </div>
          
          {/* Response Time */}
          <div className="px-3 py-1 bg-accent rounded-full">
            <span className="text-xs font-medium text-muted-foreground">
              Response: {responseTime}
            </span>
          </div>
          
          {/* Action Button */}
          <Button
            onClick={handleClick}
            className={`w-full bg-gradient-to-r ${color} hover:opacity-90 text-white shadow-md hover:shadow-lg transition-all duration-300 min-h-[48px] sm:min-h-[44px]`}
          >
            Contact Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

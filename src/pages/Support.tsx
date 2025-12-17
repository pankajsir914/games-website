import { SupportHeader } from "@/components/support/SupportHeader";
import { ContactCard } from "@/components/support/ContactCard";
import { FAQSection } from "@/components/support/FAQSection";
import { RegistrationForm } from "@/components/support/RegistrationForm";
import Navigation from "@/components/Navigation";
import { MessageCircle, Phone, Mail } from "lucide-react";

const Support = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/20">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-12">
        <SupportHeader />
        
        {/* Contact Methods */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 lg:mb-12">
          <ContactCard
            platform="telegram"
            title="Telegram Support"
            description="Chat with us on Telegram for instant support"
            link="https://t.me/YOUR_TELEGRAM_USERNAME"
            icon={MessageCircle}
            color="from-[#0088cc] to-[#0088cc]/80"
            isOnline={true}
            responseTime="~2 min"
          />
          
          <ContactCard
            platform="whatsapp"
            title="WhatsApp Support"
            description="Get help via WhatsApp messaging"
            link="https://wa.me/919876543210?text=Hello, I need help with GameZone"
            icon={Phone}
            color="from-[#25D366] to-[#25D366]/80"
            isOnline={true}
            responseTime="~5 min"
          />
          
          <ContactCard
            platform="email"
            title="Email Support"
            description="Send us an email for detailed queries"
            link="mailto:support@gamezone.com"
            icon={Mail}
            color="from-primary to-primary/80"
            isOnline={false}
            responseTime="~24 hours"
          />
        </div>

        {/* Registration Form */}
        <div className="mb-6 sm:mb-8 lg:mb-12">
          <div className="text-center mb-6 px-3 sm:px-4">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">New User? Register Here</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Get your gaming ID in minutes</p>
          </div>
          <RegistrationForm />
        </div>

        {/* FAQ Section */}
        <FAQSection />
      </div>
    </div>
  );
};

export default Support;

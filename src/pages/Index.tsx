import React, { useState, useEffect } from 'react';
import DisclaimerModal from '@/components/DisclaimerModal';
import Navigation from '@/components/Navigation';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  Play, 
  Trophy,
  Sparkles,
  Crown,
  Wallet,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  Phone,
  Clock,
  Shield,
  CreditCard
} from 'lucide-react';

const Index = () => {
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const [walletBalance] = useState(25000);

  // Show disclaimer when component mounts
  useEffect(() => {
    setIsDisclaimerOpen(true);
  }, []);

  const handleDisclaimerAgree = () => {
    setIsDisclaimerOpen(false);
  };

  const handleDisclaimerExit = () => {
    window.location.href = 'https://www.google.com';
  };

  const HeroSection = () => (
    <section className="relative bg-gradient-hero min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="w-full h-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fbbf24' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground">
              Win Real <span className="bg-gradient-primary bg-clip-text text-transparent">Money</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Play your favorite games and compete with millions of players worldwide. 
              Experience the thrill of real money gaming!
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="text-lg px-8 py-6 shadow-gaming">
              <Play className="mr-2 h-5 w-5" />
              Start Playing
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              <Trophy className="mr-2 h-5 w-5" />
              View Tournaments
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">10M+</div>
              <div className="text-muted-foreground">Active Players</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">₹500M+</div>
              <div className="text-muted-foreground">Prize Money</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">100+</div>
              <div className="text-muted-foreground">Game Variants</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">24/7</div>
              <div className="text-muted-foreground">Support</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const WalletSection = () => (
    <section className="bg-secondary/50 border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Wallet Balance</h3>
              <p className="text-2xl font-bold text-primary">₹{walletBalance.toLocaleString('en-IN')}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <Button className="shadow-gaming">
              <Plus className="mr-2 h-4 w-4" />
              Add Money
            </Button>
            <Button variant="outline">
              View History
            </Button>
          </div>
        </div>
      </div>
    </section>
  );

  const FeaturesSection = () => (
    <section className="py-16 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why Choose <span className="bg-gradient-primary bg-clip-text text-transparent">GameZone</span>?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Premium Experience</h3>
            <p className="text-muted-foreground">Enjoy smooth gameplay with premium graphics and immersive sound effects</p>
          </div>
          
          <div className="text-center p-6">
            <div className="bg-gaming-success/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-gaming-success" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Instant Withdrawals</h3>
            <p className="text-muted-foreground">Get your winnings instantly with our secure and fast withdrawal system</p>
          </div>
          
          <div className="text-center p-6">
            <div className="bg-gaming-gold/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-8 w-8 text-gaming-gold" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Daily Tournaments</h3>
            <p className="text-muted-foreground">Participate in exciting tournaments and compete for massive prize pools</p>
          </div>
        </div>
      </div>
    </section>
  );

  const Footer = () => (
    <footer className="bg-secondary/50 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-primary rounded-lg p-2">
                <Crown className="h-6 w-6 text-gaming-gold-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                GameZone
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              Experience the thrill of real money gaming with our premium collection of skill-based games. 
              Play responsibly and win big!
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="icon" className="hover:text-primary">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:text-primary">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:text-primary">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:text-primary">
                <Youtube className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Home</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Games</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Tournaments</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Leaderboard</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">How to Play</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Rewards</a></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Help Center</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Contact Us</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Responsible Gaming</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Fair Play</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Get in Touch</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>support@gamezone.com</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>24/7 Customer Support</span>
              </div>
            </div>
            
            {/* Trust Badges */}
            <div className="pt-4">
              <p className="text-xs text-muted-foreground mb-2">Trusted & Secure</p>
              <div className="flex space-x-2">
                <div className="bg-gaming-success/10 p-2 rounded">
                  <Shield className="h-4 w-4 text-gaming-success" />
                </div>
                <div className="bg-primary/10 p-2 rounded">
                  <CreditCard className="h-4 w-4 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-muted-foreground">
            © 2024 GameZone. All rights reserved.
          </div>
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <span>🔞 18+ Only</span>
            <span>Play Responsibly</span>
            <span>Licensed & Regulated</span>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            <strong>Disclaimer:</strong> This game involves an element of financial risk and may be addictive. 
            Please play responsibly and at your own risk. GameZone is committed to promoting responsible gaming.
          </p>
        </div>
      </div>
    </footer>
  );

  return (
    <div className="min-h-screen bg-background">
      <DisclaimerModal 
        isOpen={isDisclaimerOpen}
        onAgree={handleDisclaimerAgree}
        onExit={handleDisclaimerExit}
      />
      
      <Navigation />
      <HeroSection />
      <WalletSection />
      <FeaturesSection />
      <Footer />
    </div>
  );
};

export default Index;

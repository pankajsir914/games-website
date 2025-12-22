import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DisclaimerModal from '@/components/DisclaimerModal';
import Navigation from '@/components/Navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from '@/hooks/useAuth';
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
  CreditCard,
  Gamepad2,
  Users,
  Star,
  Gift,
  Zap,
  Target,
  TrendingUp,
  Award,
  Coins
} from 'lucide-react';

const Index = () => {
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const [walletBalance] = useState(25000);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect logged-in users to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

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
    <section className="relative bg-gradient-hero min-h-[400px] sm:min-h-[500px] md:min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="w-full h-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fbbf24' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-8 sm:py-12">
        <div className="space-y-8 sm:space-y-12">
          <div className="space-y-4 sm:space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
              Win Real <span className="bg-gradient-primary bg-clip-text text-transparent">Money</span>
            </h1>
            <p className="text-base sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto px-4 leading-relaxed">
              Play your favorite games and compete with millions of players worldwide. 
              Experience the thrill of real money gaming!
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center items-center px-4">
            <Button 
              size="lg" 
              className="text-base sm:text-lg px-8 py-5 sm:px-10 sm:py-7 shadow-gaming w-full sm:w-auto min-w-[200px]"
              onClick={() => navigate('/games')}
            >
              <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Start Playing
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-base sm:text-lg px-8 py-5 sm:px-10 sm:py-7 w-full sm:w-auto min-w-[200px]"
              onClick={() => navigate('/games')}
            >
              <Trophy className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              View Tournaments
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10 pt-8 sm:pt-12 px-4">
            <div className="text-center space-y-2">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">10M+</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Active Players</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">₹500M+</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Prize Money</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">100+</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Game Variants</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">24/7</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Support</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const WalletSection = () => (
    <section className="bg-secondary/50 border-y border-border">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="bg-primary/10 p-2 sm:p-3 rounded-lg">
              <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground">Wallet Balance</h3>
              <p className="text-xl sm:text-2xl font-bold text-primary">₹{walletBalance.toLocaleString('en-IN')}</p>
            </div>
          </div>
          <div className="flex gap-3 sm:gap-4 w-full md:w-auto">
            <Button 
              className="shadow-gaming flex-1 md:flex-initial"
              onClick={() => navigate('/wallet')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Money
            </Button>
            <Button 
              variant="outline"
              className="flex-1 md:flex-initial"
              onClick={() => navigate('/wallet')}
            >
              View History
            </Button>
          </div>
        </div>
      </div>
    </section>
  );

  const FeaturesSection = () => (
    <section className="py-12 sm:py-16 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Why Choose <span className="bg-gradient-primary bg-clip-text text-transparent">GameZone</span>?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="text-center p-4 sm:p-6">
            <div className="bg-primary/10 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Premium Experience</h3>
            <p className="text-sm sm:text-base text-muted-foreground">Enjoy smooth gameplay with premium graphics and immersive sound effects</p>
          </div>
          
          <div className="text-center p-4 sm:p-6">
            <div className="bg-gaming-success/10 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-gaming-success" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Instant Withdrawals</h3>
            <p className="text-sm sm:text-base text-muted-foreground">Get your winnings instantly with our secure and fast withdrawal system</p>
          </div>
          
          <div className="text-center p-4 sm:p-6">
            <div className="bg-gaming-gold/10 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-gaming-gold" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Daily Tournaments</h3>
            <p className="text-sm sm:text-base text-muted-foreground">Participate in exciting tournaments and compete for massive prize pools</p>
          </div>
        </div>
      </div>
    </section>
  );

  const GamesSection = () => (
    <section className="py-12 sm:py-16 bg-background">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Popular <span className="bg-gradient-primary bg-clip-text text-transparent">Games</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg">Choose from our exciting collection of skill-based games</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            { name: "Color Prediction", path: "/color-prediction", icon: Target, gradient: "from-red-500 to-pink-500" },
            { name: "Aviator", path: "/aviator", icon: Zap, gradient: "from-blue-500 to-cyan-500" },
            { name: "Ludo", path: "/ludo", icon: Gamepad2, gradient: "from-green-500 to-emerald-500" },
          ].map((game) => (
            <Card key={game.name} className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/20" onClick={() => navigate(game.path)}>
              <CardContent className="p-4 sm:p-6 text-center">
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r ${game.gradient} flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                  <game.icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold mb-2">{game.name}</h3>
                <Button variant="outline" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground text-xs sm:text-sm">
                  Play Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );

  const TestimonialsSection = () => (
    <section className="py-12 sm:py-16 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            What Players <span className="bg-gradient-primary bg-clip-text text-transparent">Say</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
          {[
            {
              name: "Rajesh Kumar",
              comment: "Amazing platform! Won ₹50,000 in just one week. Fast withdrawals and great support.",
              rating: 5,
              location: "Mumbai"
            },
            {
              name: "Priya Sharma",
              comment: "Love the variety of games. The interface is so smooth and user-friendly.",
              rating: 5,
              location: "Delhi"
            },
            {
              name: "Amit Patel",
              comment: "Best gaming platform in India. Reliable, secure, and entertaining!",
              rating: 5,
              location: "Bangalore"
            }
          ].map((testimonial, index) => (
            <Card key={index} className="p-4 sm:p-6">
              <CardContent className="p-0">
                <div className="flex items-center mb-3 sm:mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 sm:h-5 sm:w-5 text-gaming-gold fill-current" />
                  ))}
                </div>
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 italic">"{testimonial.comment}"</p>
                <div className="flex items-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center mr-2 sm:mr-3">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-xs sm:text-sm">{testimonial.name}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{testimonial.location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );

  const StatsSection = () => (
    <section className="py-12 sm:py-16 bg-background">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Platform <span className="bg-gradient-primary bg-clip-text text-transparent">Statistics</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
          {[
            { icon: Users, value: "2M+", label: "Registered Users", color: "text-blue-500" },
            { icon: Coins, value: "₹100Cr+", label: "Total Winnings", color: "text-gaming-gold" },
            { icon: Award, value: "500K+", label: "Daily Tournaments", color: "text-green-500" },
            { icon: Shield, value: "99.9%", label: "Secure Transactions", color: "text-gaming-success" }
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-3 sm:mb-4`}>
                <stat.icon className={`h-6 w-6 sm:h-8 sm:w-8 ${stat.color}`} />
              </div>
              <div className={`text-2xl sm:text-3xl font-bold ${stat.color} mb-1 sm:mb-2`}>{stat.value}</div>
              <div className="text-muted-foreground text-xs sm:text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const CTASection = () => (
    <section className="py-12 sm:py-16 bg-gradient-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 text-center">
        <div className="space-y-4 sm:space-y-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
            Ready to Start Winning?
          </h2>
          <p className="text-base sm:text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            Join millions of players and start your journey to big wins today. Sign up now and get a welcome bonus!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <Button 
              size="lg" 
              variant="secondary"
              className="text-base sm:text-lg px-6 py-4 sm:px-8 sm:py-6 w-full sm:w-auto"
              onClick={() => user ? navigate('/games') : navigate('/')}
            >
              <Gift className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              {user ? 'Play Now' : 'Sign Up & Get Bonus'}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );

  const Footer = () => (
    <footer className="bg-secondary/50 border-t border-border">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Company Info */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-primary rounded-lg p-1.5 sm:p-2">
                <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-gaming-gold-foreground" />
              </div>
              <span className="text-lg sm:text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                RRBExchange
              </span>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Experience the thrill of real money gaming with our premium collection of skill-based games. 
              Play responsibly and win big!
            </p>
            <div className="flex space-x-2 sm:space-x-4">
              <Button variant="ghost" size="icon" className="hover:text-primary h-8 w-8 sm:h-10 sm:w-10">
                <Facebook className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:text-primary h-8 w-8 sm:h-10 sm:w-10">
                <Twitter className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:text-primary h-8 w-8 sm:h-10 sm:w-10">
                <Instagram className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:text-primary h-8 w-8 sm:h-10 sm:w-10">
                <Youtube className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Quick Links</h3>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Home</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Games</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Tournaments</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Leaderboard</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">How to Play</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Rewards</a></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Support</h3>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Help Center</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Contact Us</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Responsible Gaming</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Fair Play</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Get in Touch</h3>
            <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>support@gamezone.com</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>+91 0000000000</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>24/7 Customer Support</span>
              </div>
            </div>
            
            {/* Trust Badges */}
            <div className="pt-3 sm:pt-4">
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-2">Trusted & Secure</p>
              <div className="flex space-x-2">
                <div className="bg-gaming-success/10 p-1.5 sm:p-2 rounded">
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-gaming-success" />
                </div>
                <div className="bg-primary/10 p-1.5 sm:p-2 rounded">
                  <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-6 sm:my-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-3 sm:space-y-4 md:space-y-0">
          <div className="text-xs sm:text-sm text-muted-foreground">
            © 2024 GameZone. All rights reserved.
          </div>
          <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
            <span>🔞 18+ Only</span>
            <span>Play Responsibly</span>
            <span>Licensed & Regulated</span>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-muted/30 rounded-lg">
          <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
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
      {user && <WalletSection />}
      <GamesSection />
      <FeaturesSection />
      <TestimonialsSection />
      <StatsSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;

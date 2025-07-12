
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Menu, X, Crown } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-background/95 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-gradient-primary rounded-lg p-2">
              <Crown className="h-6 w-6 text-gaming-gold-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              GameZone
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className={`transition-colors ${
                isActive('/') ? 'text-primary font-medium' : 'text-muted-foreground hover:text-primary'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/games" 
              className={`transition-colors ${
                isActive('/games') ? 'text-primary font-medium' : 'text-muted-foreground hover:text-primary'
              }`}
            >
              Games
            </Link>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Tournaments</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Support</a>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Login</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Login to GameZone</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="email" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="email">Email</TabsTrigger>
                    <TabsTrigger value="mobile">Mobile</TabsTrigger>
                  </TabsList>
                  <TabsContent value="email" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="Enter your email" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" type="password" placeholder="Enter your password" />
                    </div>
                    <Button className="w-full">Login</Button>
                  </TabsContent>
                  <TabsContent value="mobile" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="mobile">Mobile Number</Label>
                      <Input id="mobile" type="tel" placeholder="Enter your mobile number" />
                    </div>
                    <Button className="w-full">Send OTP</Button>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>

            <Dialog open={isSignupOpen} onOpenChange={setIsSignupOpen}>
              <DialogTrigger asChild>
                <Button>Sign Up</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Join GameZone</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="email" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="email">Email</TabsTrigger>
                    <TabsTrigger value="mobile">Mobile</TabsTrigger>
                  </TabsList>
                  <TabsContent value="email" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input id="signup-name" placeholder="Enter your full name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input id="signup-email" type="email" placeholder="Enter your email" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input id="signup-password" type="password" placeholder="Create a password" />
                    </div>
                    <Button className="w-full">Create Account</Button>
                  </TabsContent>
                  <TabsContent value="mobile" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name-mobile">Full Name</Label>
                      <Input id="signup-name-mobile" placeholder="Enter your full name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-mobile">Mobile Number</Label>
                      <Input id="signup-mobile" type="tel" placeholder="Enter your mobile number" />
                    </div>
                    <Button className="w-full">Send OTP</Button>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-background border-t border-border">
              <Link 
                to="/" 
                className={`block px-3 py-2 transition-colors ${
                  isActive('/') ? 'text-primary font-medium' : 'text-muted-foreground hover:text-primary'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/games" 
                className={`block px-3 py-2 transition-colors ${
                  isActive('/games') ? 'text-primary font-medium' : 'text-muted-foreground hover:text-primary'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Games
              </Link>
              <a href="#" className="block px-3 py-2 text-muted-foreground hover:text-primary">Tournaments</a>
              <a href="#" className="block px-3 py-2 text-muted-foreground hover:text-primary">Support</a>
              <div className="flex space-x-4 px-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setIsLoginOpen(true)}>
                  Login
                </Button>
                <Button className="flex-1" onClick={() => setIsSignupOpen(true)}>
                  Sign Up
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;

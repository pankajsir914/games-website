
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/auth/AuthModal";
import { WalletCard } from "@/components/wallet/WalletCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User, LogOut, Wallet } from "lucide-react";

const Navigation = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const { user, signOut, loading } = useAuth();
  const location = useLocation();

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/games", label: "Games" },
    { href: "/color-prediction", label: "Color Prediction" },
    { href: "/ludo", label: "Ludo" },
    { href: "/aviator", label: "Aviator" },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <>
      <nav className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  GameHub
                </span>
              </Link>
              
              <div className="hidden md:flex items-center space-x-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "bg-purple-100 text-purple-700"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWalletOpen(true)}
                    className="hidden md:flex items-center gap-2"
                  >
                    <Wallet className="h-4 w-4" />
                    Wallet
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuItem className="flex flex-col items-start">
                        <p className="text-sm font-medium">{user.user_metadata?.full_name || 'User'}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setWalletOpen(true)}>
                        <Wallet className="mr-2 h-4 w-4" />
                        <span>Wallet</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={signOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button 
                  onClick={() => setAuthModalOpen(true)}
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <User className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      
      {walletOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">My Wallet</h2>
              <Button variant="ghost" size="sm" onClick={() => setWalletOpen(false)}>
                ×
              </Button>
            </div>
            <WalletCard />
          </div>
        </div>
      )}
    </>
  );
};

export default Navigation;

import React from 'react';
import Navigation from '@/components/Navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from 'react-router-dom';
import { 
  Play, 
  Users, 
  Trophy,
  Star,
  Zap,
  Crown,
  Sparkles,
  Palette,
  Gamepad2
} from 'lucide-react';

const Games = () => {
  const games = [
    {
      id: 0,
      title: "Color Prediction",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
      players: "Unlimited",
      prize: "₹2,00,000",
      category: "Prediction Game",
      route: "/color-prediction",
      featured: true
    },
    {
      id: 1,
      title: "Ludo King",
      image: "https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400&h=300&fit=crop",
      players: "2-4 Players",
      prize: "₹10,000",
      category: "Board Game",
      route: "/ludo",
      featured: true
    },
    {
      id: 2,
      title: "Teen Patti",
      image: "https://via.placeholder.com/300x200?text=Teen+Patti",
      players: "3-6 Players", 
      prize: "₹50,000",
      category: "Card Game"
    },
    {
      id: 3,
      title: "Rummy",
      image: "https://via.placeholder.com/300x200?text=Rummy",
      players: "2-6 Players",
      prize: "₹25,000", 
      category: "Card Game"
    },
    {
      id: 4,
      title: "Aviator",
      image: "https://via.placeholder.com/300x200?text=Aviator",
      players: "Unlimited",
      prize: "₹1,00,000",
      category: "Crash Game"
    },
    {
      id: 5,
      title: "Poker",
      image: "https://via.placeholder.com/300x200?text=Poker",
      players: "2-9 Players",
      prize: "₹75,000",
      category: "Card Game"
    },
    {
      id: 6,
      title: "Blackjack",
      image: "https://via.placeholder.com/300x200?text=Blackjack",
      players: "1-7 Players",
      prize: "₹30,000",
      category: "Casino"
    },
    {
      id: 7,
      title: "Andar Bahar",
      image: "https://via.placeholder.com/300x200?text=Andar+Bahar",
      players: "Unlimited",
      prize: "₹40,000",
      category: "Card Game"
    },
    {
      id: 8,
      title: "Slots",
      image: "https://via.placeholder.com/300x200?text=Slots",
      players: "1 Player",
      prize: "₹2,00,000",
      category: "Casino"
    }
  ];

  const categories = ["All", "Prediction Game", "Card Game", "Board Game", "Casino", "Crash Game"];
  const [selectedCategory, setSelectedCategory] = React.useState("All");

  const filteredGames = selectedCategory === "All" 
    ? games 
    : games.filter(game => game.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header Section */}
      <section className="bg-gradient-hero py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Choose Your <span className="bg-gradient-primary bg-clip-text text-transparent">Game</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the thrill of real money gaming with our premium collection of skill-based games
            </p>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className="transition-all duration-200"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Games Grid */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {filteredGames.map((game) => (
              <Card
                key={game.id}
                className={`bg-gradient-card border transition-all duration-300 hover:scale-[1.02] group ${
                  game.featured ? 'border-primary shadow-gaming ring-1 ring-primary/20' : 'border-border hover:shadow-card-gaming'
                }`}
              >
                <CardHeader className="p-0">
                  <div className="relative overflow-hidden rounded-t-lg">
                    <img
                      src={game.image}
                      alt={game.title}
                      className="w-full h-36 sm:h-40 md:h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="bg-primary/90 text-primary-foreground text-xs px-2 py-0.5">
                        {game.category}
                      </Badge>
                    </div>
                    <div className="absolute top-2 right-2">
                      <div className="bg-gaming-success/90 text-gaming-success-foreground px-2 py-0.5 rounded text-xs font-medium">
                        {game.prize}
                      </div>
                    </div>
                    {game.featured && (
                      <div className="absolute bottom-2 left-2">
                        <Badge className="bg-gaming-gold text-gaming-gold-foreground text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          New
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                  <CardTitle className="text-base sm:text-lg mb-1 sm:mb-2 flex items-center">
                    {game.id === 0 && <Palette className="h-4 w-4 mr-2 text-primary" />}
                    {game.id === 1 && <Gamepad2 className="h-4 w-4 mr-2 text-primary" />}
                    {game.title}
                  </CardTitle>
                  <div className="flex items-center text-muted-foreground text-sm mb-2">
                    <Users className="h-4 w-4 mr-1" />
                    {game.players}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gaming-gold">
                      <Star className="h-4 w-4 mr-1" />
                      <span className="font-medium">4.8 Rating</span>
                    </div>
                    <div className="text-muted-foreground flex items-center">
                      <Zap className="h-4 w-4 mr-1" />
                      Quick Play
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-3 pt-0 sm:p-4 sm:pt-0">
                  {game.route ? (
                    <Link to={game.route} className="w-full">
                      <Button className="w-full text-sm py-2 shadow-gaming group-hover:shadow-glow transition-all duration-300">
                        <Play className="mr-2 h-4 w-4" />
                        Play Now
                      </Button>
                    </Link>
                  ) : (
                    <Button className="w-full text-sm py-2 shadow-gaming group-hover:shadow-glow transition-all duration-300">
                      <Play className="mr-2 h-4 w-4" />
                      Play Now
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Game <span className="bg-gradient-primary bg-clip-text text-transparent">Features</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Premium Graphics</h3>
              <p className="text-muted-foreground">Enjoy stunning visuals and smooth gameplay experience</p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-gaming-success/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-gaming-success" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real Money Prizes</h3>
              <p className="text-muted-foreground">Win real cash prizes and instant withdrawals</p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-gaming-gold/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-gaming-gold" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fair Play Guaranteed</h3>
              <p className="text-muted-foreground">Certified random number generation and fair gameplay</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Games;

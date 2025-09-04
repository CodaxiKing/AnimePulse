import { Link, useLocation } from "wouter";
import Logo from "./Logo";
import SearchBar from "./SearchBar";
import { User } from "lucide-react";

export default function Header() {
  const [location] = useLocation();

  const navItems = [
    { href: "/animes", label: "Animes" },
    { href: "/mangas", label: "Mangás" },
    { href: "/noticias", label: "Notícias" },
    { href: "/comunidade", label: "Comunidade" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" data-testid="link-home">
              <Logo />
            </Link>
            
            <nav className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`font-medium transition-colors ${
                    location === item.href
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                  data-testid={`link-nav-${item.label.toLowerCase()}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <SearchBar />
            
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#8A2BE2] to-[#FF4DD8] p-0.5" data-testid="avatar-user">
              <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
                <User className="w-4 h-4 text-foreground" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

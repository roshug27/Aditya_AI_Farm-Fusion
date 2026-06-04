import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Globe, User, LogOut, Home, Leaf, TrendingUp, CloudSun, FileText, BookOpen, Info, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';

interface NavigationProps {
  currentLang: string;
  onLanguageChange: (lang: string) => void;
}

const Navigation = ({ currentLang, onLanguageChange }: NavigationProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useLanguage();
  const { user, profile, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'home', label: t('home'), icon: Home },
    { id: 'recommend', label: t('recommend'), icon: Leaf },
    { id: 'predict', label: t('predict'), icon: TrendingUp },
    { id: 'weather-alerts', label: t('weatherAlerts'), icon: CloudSun },
    { id: 'schemes', label: t('schemes'), icon: FileText },
    { id: 'tutorials', label: t('tutorials'), icon: BookOpen },
    { id: 'about', label: t('about'), icon: Info },
    { id: 'contact', label: t('contact'), icon: Mail },
  ];

  const languages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
    { code: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
    { code: 'bn', label: 'বাংলা', flag: '🇧🇩' },
    { code: 'mr', label: 'मराठी', flag: '🇮🇳' },
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Farmer';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      isScrolled ? 'glass-nav shadow-lg py-2' : 'bg-transparent py-4'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2 animate-fade-slide-right">
            <div className="text-xl floating-animation">🌱</div>
            <h1 className="text-lg font-bold text-harvest-gradient tracking-tight">
              FarmFusion
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => scrollToSection(item.id)}
                className="text-white/90 hover:text-white hover:bg-white/10 transition-all duration-300 px-3 py-2 text-sm font-medium gap-1.5"
              >
                <item.icon size={14} />
                {item.label}
              </Button>
            ))}
          </div>

          {/* Language Selector, User & Mobile Menu */}
          <div className="flex items-center space-x-2">
            <Select value={currentLang} onValueChange={onLanguageChange}>
              <SelectTrigger className="w-auto min-w-[100px] bg-white/10 border-white/20 text-white backdrop-blur-sm hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center space-x-2">
                  <Globe size={16} />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-card/95 backdrop-blur-sm border-border/50">
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <div className="flex items-center space-x-2">
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="bg-white/10 border-white/20 text-white hover:bg-white/20 gap-2">
                    <User size={16} />
                    <span className="hidden sm:inline max-w-[100px] truncate">{displayName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-card/95 backdrop-blur-sm border-border/50">
                  <DropdownMenuItem className="text-muted-foreground text-sm">
                    {t('nav.welcome')}, {displayName}! 🌾
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
                    <LogOut size={16} className="mr-2" />
                    {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" className="bg-white/10 border-white/20 text-white hover:bg-white/20 gap-2">
                  <User size={16} />
                  <span className="hidden sm:inline">{t('nav.login')}</span>
                </Button>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-white hover:bg-white/10 transition-all duration-300"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden transition-all duration-500 overflow-hidden ${
          isMobileMenuOpen ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'
        }`}>
          <div className="glass-card rounded-xl p-4 space-y-1">
            {user && (
              <div className="px-3 py-2 text-white/80 text-sm border-b border-white/10 mb-2">
                👋 {t('nav.hello')}, {displayName}!
              </div>
            )}
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => scrollToSection(item.id)}
                className="w-full justify-start text-white/90 hover:text-white hover:bg-white/10 transition-all duration-300 gap-2"
              >
                <item.icon size={16} />
                {item.label}
              </Button>
            ))}
            {user ? (
              <Button
                variant="ghost"
                onClick={signOut}
                className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-white/10"
              >
                <LogOut className="mr-3" size={18} />
                {t('nav.logout')}
              </Button>
            ) : (
              <Link to="/auth" className="block">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white/90 hover:text-white hover:bg-white/10"
                >
                  <User className="mr-3" size={18} />
                  {t('nav.loginSignup')}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;

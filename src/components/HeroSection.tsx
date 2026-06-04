import { useEffect, useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroImage from '@/assets/hero-farm.jpg';
import { useLanguage } from '@/hooks/useLanguage';
const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);
  const { t } = useLanguage();
  const scrollToNext = () => {
    const element = document.getElementById('recommend');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section 
      id="home" 
      className="relative min-h-screen flex items-center justify-center section-bg overflow-hidden"
      style={{ backgroundImage: `url(${heroImage})` }}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 left-10 floating-animation opacity-20">
          <div className="text-6xl">🌾</div>
        </div>
        <div className="absolute top-40 right-20 floating-animation opacity-30" style={{ animationDelay: '1s' }}>
          <div className="text-4xl">🚜</div>
        </div>
        <div className="absolute bottom-40 left-20 floating-animation opacity-25" style={{ animationDelay: '2s' }}>
          <div className="text-5xl">🌽</div>
        </div>
        <div className="absolute bottom-20 right-10 floating-animation opacity-20" style={{ animationDelay: '0.5s' }}>
          <div className="text-3xl">🌱</div>
        </div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className={`transition-all duration-1000 ${isVisible ? 'animate-grow-in' : 'opacity-0'}`}>
          <div className="flex items-center justify-center mb-6">
            <Sparkles className="text-accent mr-4 animate-pulse" size={32} />
            <div className="text-7xl floating-animation">🌱</div>
            <Sparkles className="text-accent ml-4 animate-pulse" size={32} />
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold mb-6 text-white">
            Farm<span className="text-harvest-gradient">Fusion</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
            {t('heroSubtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="lg" 
              onClick={scrollToNext}
              className="farm-button text-lg px-8 py-4 group"
            >
              <span className="mr-2 group-hover:scale-110 transition-transform duration-300">🚀</span>
              {t('startJourney')}
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
              className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 px-8 py-4"
            >
              {t('learnMore')}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {[
              { emoji: '👨‍🌾', number: '10K+', label: t('heroStatFarmers') },
              { emoji: '🌾', number: '50+', label: t('heroStatCrops') },
              { emoji: '📈', number: '95%', label: t('heroStatAccuracy') },
              { emoji: '🏆', number: '25+', label: t('heroStatSchemes') },
            ].map((stat, index) => (
              <div 
                key={stat.label}
                className={`text-center transition-all duration-700 ${
                  isVisible ? 'animate-bounce-in' : 'opacity-0'
                }`}
                style={{ animationDelay: `${1 + index * 0.2}s` }}
              >
                <div className="text-4xl mb-2 floating-animation" style={{ animationDelay: `${index * 0.5}s` }}>
                  {stat.emoji}
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stat.number}</div>
                <div className="text-white/80 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <Button
          variant="ghost"
          size="icon"
          onClick={scrollToNext}
          className="text-white/70 hover:text-white transition-colors duration-300 rounded-full"
        >
          <ChevronDown size={32} />
        </Button>
      </div>
    </section>
  );
};

export default HeroSection;
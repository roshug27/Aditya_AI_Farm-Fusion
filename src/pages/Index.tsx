import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import CropRecommendationSection from '@/components/CropRecommendationSection';
import YieldPredictionSection from '@/components/YieldPredictionSection';
import WeatherAlertSection from '@/components/WeatherAlertSection';
import SchemesSection from '@/components/SchemesSection';
import TutorialsSection from '@/components/TutorialsSection';
import AboutSection from '@/components/AboutSection';
import ContactSection from '@/components/ContactSection';
import ScrollAnimations from '@/components/ScrollAnimations';
import FarmChatbot from '@/components/FarmChatbot';
import Footer from '@/components/Footer';
import { useLanguage } from '@/hooks/useLanguage';

const Index = () => {
  const { currentLang, changeLanguage } = useLanguage();
  const [yieldPredictionData, setYieldPredictionData] = useState<{
    crop_name: string;
    year: string;
    rainfall: string;
    temperature: string;
  } | null>(null);

  const handleUseForYieldPrediction = (cropName: string, rainfall: string, temperature: string) => {
    const currentYear = new Date().getFullYear();
    setYieldPredictionData({
      crop_name: cropName,
      year: currentYear.toString(),
      rainfall,
      temperature,
    });
    
    setTimeout(() => {
      document.getElementById('predict')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    
    const preloadImages = [
      '/src/assets/hero-farm.jpg',
      '/src/assets/crop-recommendation.jpg',
      '/src/assets/yield-prediction.jpg'
    ];
    
    preloadImages.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });

    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <div className="min-h-screen">
      <Navigation 
        currentLang={currentLang} 
        onLanguageChange={changeLanguage} 
      />
      
      <main>
        <HeroSection />
        <CropRecommendationSection onUseForYieldPrediction={handleUseForYieldPrediction} />
        <YieldPredictionSection preFilledData={yieldPredictionData} />
        <WeatherAlertSection />
        <SchemesSection />
        <TutorialsSection />
        <AboutSection />
        <ContactSection />
      </main>
      
      <Footer />
      
      <ScrollAnimations />
      <FarmChatbot />
    </div>
  );
};

export default Index;

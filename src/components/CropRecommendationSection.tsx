import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sprout, Beaker, Thermometer, Droplets, Activity, TrendingUp, TrendingDown, Minus, IndianRupee, MapPin, Navigation as NavIcon, Store, Truck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import cropImage from '@/assets/crop-recommendation-new.jpg';
import { useLanguage } from '@/hooks/useLanguage';
import { SoilAnalysisCard } from './SoilAnalysisCard';
import { supabase } from '@/integrations/supabase/client';

interface CropData {
  N: string;
  P: string;
  K: string;
  temperature: string;
  humidity: string;
  ph: string;
  rainfall: string;
}

interface CropRecommendationSectionProps {
  onUseForYieldPrediction?: (cropName: string, rainfall: string, temperature: string) => void;
}

interface MarketPrice {
  crop: string;
  currentPrice: number;
  avgPrice: number;
  trend: 'up' | 'down' | 'stable';
  bestSellTime: string;
  priceHistory: { month: string; price: number }[];
  recommendation: string;
}

interface NearbyMarket {
  name: string;
  type: string;
  location: string;
  distanceKm: number;
  avgPrice: number;
  priceRange: string;
  demand: 'Very High' | 'High' | 'Moderate' | 'Low';
  transport: string;
  netProfitScore: number;
  tip: string;
}

const CropRecommendationSection = ({ onUseForYieldPrediction }: CropRecommendationSectionProps) => {
  const [formData, setFormData] = useState<CropData>({
    N: '',
    P: '',
    K: '',
    temperature: '',
    humidity: '',
    ph: '',
    rainfall: ''
  });
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ crop: string; duration: string; durationDays: number } | null>(null);
  const [marketPrice, setMarketPrice] = useState<MarketPrice | null>(null);
  const [nearbyMarkets, setNearbyMarkets] = useState<NearbyMarket[]>([]);
  const [marketsLoading, setMarketsLoading] = useState(false);
  const { toast } = useToast();
  const { t, currentLang } = useLanguage();

  const langMap: Record<string, string> = {
    en: 'English', hi: 'Hindi', ta: 'Tamil', bn: 'Bengali', mr: 'Marathi'
  };

  const generateMarketPrice = (cropName: string): MarketPrice => {
    const marketData: Record<string, { basePrice: number; volatility: number; peakMonths: string[] }> = {
      'Rice': { basePrice: 2200, volatility: 0.15, peakMonths: ['Oct', 'Nov', 'Dec'] },
      'Wheat': { basePrice: 2400, volatility: 0.12, peakMonths: ['Mar', 'Apr', 'May'] },
      'Corn': { basePrice: 1800, volatility: 0.18, peakMonths: ['Sep', 'Oct'] },
      'Barley': { basePrice: 1600, volatility: 0.1, peakMonths: ['Apr', 'May'] },
      'Sugarcane': { basePrice: 350, volatility: 0.08, peakMonths: ['Nov', 'Dec', 'Jan'] },
      'Cotton': { basePrice: 6500, volatility: 0.2, peakMonths: ['Oct', 'Nov'] },
      'Tomato': { basePrice: 2500, volatility: 0.35, peakMonths: ['Jun', 'Jul', 'Dec'] },
      'Potato': { basePrice: 1200, volatility: 0.25, peakMonths: ['Feb', 'Mar', 'Aug'] },
    };

    const data = marketData[cropName] || { basePrice: 2000, volatility: 0.15, peakMonths: ['Oct', 'Nov'] };
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const priceHistory = months.map(month => ({
      month,
      price: Math.round(data.basePrice * (1 + (data.peakMonths.includes(month) ? 0.2 : -0.1) + (Math.random() - 0.5) * data.volatility))
    }));

    const currentMonth = months[new Date().getMonth()];
    const currentPrice = priceHistory.find(p => p.month === currentMonth)?.price || data.basePrice;
    const avgPrice = Math.round(priceHistory.reduce((sum, p) => sum + p.price, 0) / 12);
    
    const trend = currentPrice > avgPrice * 1.05 ? 'up' : currentPrice < avgPrice * 0.95 ? 'down' : 'stable';
    const bestSellMonth = priceHistory.reduce((best, p) => p.price > best.price ? p : best, priceHistory[0]);
    
    let recommendation = '';
    if (trend === 'up') {
      recommendation = `Prices are above average. Consider selling soon or wait for ${data.peakMonths[0]} peak.`;
    } else if (trend === 'down') {
      recommendation = `Prices are below average. Best to store and sell during ${data.peakMonths.join('/')}.`;
    } else {
      recommendation = `Stable prices. Peak selling months: ${data.peakMonths.join(', ')}.`;
    }

    return {
      crop: cropName,
      currentPrice,
      avgPrice,
      trend,
      bestSellTime: `${data.peakMonths.join('-')} (Peak: ${bestSellMonth.month})`,
      priceHistory,
      recommendation
    };
  };

  const inputFields = [
    { key: 'N', label: 'Nitrogen (N)', icon: Beaker, unit: 'ppm', color: 'text-blue-500' },
    { key: 'P', label: 'Phosphorus (P)', icon: Beaker, unit: 'ppm', color: 'text-purple-500' },
    { key: 'K', label: 'Potassium (K)', icon: Beaker, unit: 'ppm', color: 'text-orange-500' },
    { key: 'temperature', label: 'Temperature', icon: Thermometer, unit: '°C', color: 'text-red-500' },
    { key: 'humidity', label: 'Humidity', icon: Droplets, unit: '%', color: 'text-cyan-500' },
    { key: 'ph', label: 'pH Value', icon: Activity, unit: 'pH', color: 'text-green-500' },
    { key: 'rainfall', label: 'Rainfall', icon: Droplets, unit: 'mm', color: 'text-blue-600' },
  ];

  const handleInputChange = (key: keyof CropData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleAnalysisComplete = (data: { nitrogen: number; phosphorus: number; potassium: number; pH: number }) => {
    setFormData(prev => ({
      ...prev,
      N: data.nitrogen.toString(),
      P: data.phosphorus.toString(),
      K: data.potassium.toString(),
      ph: data.pH.toString()
    }));
  };

  const handleWeatherDataComplete = (data: { temperature: number; humidity: number; rainfall: number }) => {
    setFormData(prev => ({
      ...prev,
      temperature: data.temperature.toString(),
      humidity: data.humidity.toString(),
      rainfall: data.rainfall.toString()
    }));
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: t('crop.geolocationNotSupported'), variant: 'destructive' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          const place = data.address?.city || data.address?.town || data.address?.village || data.address?.county || '';
          const state = data.address?.state || '';
          setLocation(place && state ? `${place}, ${state}` : data.display_name || `${latitude},${longitude}`);
        } catch {
          setLocation(`${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);
        }
      },
      () => toast({ title: t('crop.couldNotGetLocation'), variant: 'destructive' })
    );
  };

  const fetchNearbyMarkets = async (cropName: string) => {
    if (!location.trim()) return;
    setMarketsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('find-markets', {
        body: { location, crop: cropName, language: langMap[currentLang] || 'English' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const markets = (data.markets || []).sort(
        (a: NearbyMarket, b: NearbyMarket) => (b.netProfitScore ?? 0) - (a.netProfitScore ?? 0)
      );
      setNearbyMarkets(markets);
    } catch (e: any) {
      toast({ title: t('crop.marketsUnavailable'), description: e.message || t('crop.couldNotFetchMarkets'), variant: 'destructive' });
    } finally {
      setMarketsLoading(false);
    }
  };

  const handleSubmit = async () => {
    const emptyFields = Object.entries(formData).filter(([_, value]) => !value.trim());
    if (emptyFields.length > 0) {
      toast({
        title: t('yield.missingInfo'),
        description: t('yield.fillAllFields'),
        variant: "destructive",
      });
      return;
    }
    if (!location.trim()) {
      toast({
        title: t('crop.locationRequired'),
        description: t('crop.locationRequiredDesc'),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setNearbyMarkets([]);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const cropData = [
        { crop: 'Rice', duration: '3-6 months', durationDays: 120 },
        { crop: 'Wheat', duration: '4-6 months', durationDays: 150 },
        { crop: 'Corn', duration: '2-3 months', durationDays: 75 },
        { crop: 'Barley', duration: '3-4 months', durationDays: 105 },
        { crop: 'Sugarcane', duration: '10-12 months', durationDays: 330 },
        { crop: 'Cotton', duration: '5-6 months', durationDays: 165 },
        { crop: 'Tomato', duration: '2-3 months', durationDays: 75 },
        { crop: 'Potato', duration: '3-4 months', durationDays: 105 },
      ];

      const recommendedCrop = cropData[Math.floor(Math.random() * cropData.length)];

      setResult(recommendedCrop);
      setMarketPrice(generateMarketPrice(recommendedCrop.crop));
      toast({
        title: t('crop.recommendationGenerated'),
        description: `${t('crop.basedOnSoil')} ${recommendedCrop.crop}.`,
      });

      fetchNearbyMarkets(recommendedCrop.crop);
    } catch (error) {
      toast({
        title: t('crop.error'),
        description: t('crop.errorDesc'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const demandColor = (d: string) => {
    switch (d) {
      case 'Very High': return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'High': return 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30';
      case 'Moderate': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      default: return 'bg-red-500/20 text-red-700 border-red-500/30';
    }
  };

  return (
    <section 
      id="recommend" 
      className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 section-bg relative overflow-hidden"
      style={{ backgroundImage: `url(${cropImage})` }}
    >
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16 animate-fade-slide-right">
          <div className="inline-flex items-center justify-center p-3 bg-accent/20 rounded-full mb-6 floating-animation">
            <Sprout className="text-accent" size={32} />
          </div>
          <h2 className="text-5xl font-bold text-white mb-6">
            🌾 {t('cropTitle')}
          </h2>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            {t('cropSubtitle')}
          </p>
        </div>

        <div className="max-w-6xl mx-auto mb-8">
          <SoilAnalysisCard 
            onAnalysisComplete={handleAnalysisComplete}
            onWeatherDataComplete={handleWeatherDataComplete}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Input Form */}
          <Card className="glass-card border-0 card-float">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-primary flex items-center justify-center gap-3">
                <Beaker className="text-accent" />
                {t('soilEnvData')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {inputFields.map((field, index) => (
                <div 
                  key={field.key}
                  className="space-y-2 animate-fade-slide-right"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <field.icon className={field.color} size={16} />
                    {field.label}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData[field.key as keyof CropData]}
                      onChange={(e) => handleInputChange(field.key as keyof CropData, e.target.value)}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      className="farm-input"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                      {field.unit}
                    </span>
                  </div>
                </div>
              ))}

              {/* Location for nearby markets */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <MapPin className="text-primary" size={16} />
                  {t('crop.yourLocation')} <span className="text-xs text-muted-foreground">({t('crop.forMarketPrices')})</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={t('crop.locationPlaceholder')}
                    className="farm-input flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={detectLocation}
                    title={t('crop.useCurrentLocation')}
                  >
                    <NavIcon size={16} />
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full farm-button mt-8"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t('crop.analyzingSoil')}
                  </>
                ) : (
                  <>
                    <Sprout className="mr-2 h-5 w-5" />
                    {t('btnRec')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results & Info */}
          <div className="space-y-6">
            {/* Result Card */}
            {result && (
              <Card className="glass-card border-0 pulse-glow animate-grow-in">
                <CardContent className="p-8 text-center">
                  <div className="text-6xl mb-4 floating-animation">🌾</div>
                  <h3 className="text-2xl font-bold text-primary mb-2">
                    {t('recommendedCrop')}
                  </h3>
                  <p className="text-4xl font-bold text-harvest-gradient mb-4">
                    {t(`cropName.${result.crop}`) || result.crop}
                  </p>
                  <div className="space-y-3 mt-6">
                    <div className="flex items-center justify-center gap-2 text-lg">
                      <span className="text-muted-foreground">⏱️ {t('crop.growthDuration')}:</span>
                      <span className="font-semibold text-primary">{result.duration}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <span>📅 {t('crop.approximately')} {result.durationDays} {t('crop.days')}</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-4">
                    {t('optimalForConditions')}
                  </p>
                  <Button
                    onClick={() => onUseForYieldPrediction?.(result.crop, formData.rainfall, formData.temperature)}
                    className="w-full farm-button mt-6"
                  >
                    📊 {t('crop.useForYield')}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Market Price Card */}
            {marketPrice && (
              <Card className="glass-card border-0 animate-grow-in" style={{ animationDelay: '0.2s' }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <IndianRupee className="text-green-500" size={20} />
                    {t('crop.marketInsights')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('crop.currentPrice')}</p>
                      <p className="text-2xl font-bold text-primary">₹{marketPrice.currentPrice}{t('crop.perQuintal')}</p>
                    </div>
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${
                      marketPrice.trend === 'up' ? 'bg-green-500/20 text-green-600' :
                      marketPrice.trend === 'down' ? 'bg-red-500/20 text-red-600' :
                      'bg-yellow-500/20 text-yellow-600'
                    }`}>
                      {marketPrice.trend === 'up' ? <TrendingUp size={16} /> :
                       marketPrice.trend === 'down' ? <TrendingDown size={16} /> :
                       <Minus size={16} />}
                      <span className="text-sm font-medium">
                        {marketPrice.trend === 'up' ? t('crop.trendUp') : marketPrice.trend === 'down' ? t('crop.trendDown') : t('crop.trendStable')}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-accent/5 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">{t('crop.avgPrice')}</p>
                      <p className="font-semibold text-primary">₹{marketPrice.avgPrice}</p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">{t('crop.bestSellTime')}</p>
                      <p className="font-semibold text-green-600 text-sm">{marketPrice.bestSellTime}</p>
                    </div>
                  </div>

                  {/* Price Chart */}
                  <div className="p-3 bg-accent/5 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">{t('crop.priceHistory')}</p>
                    <div className="flex items-end gap-1 h-16">
                      {marketPrice.priceHistory.map((item, idx) => {
                        const maxPrice = Math.max(...marketPrice.priceHistory.map(p => p.price));
                        const minPrice = Math.min(...marketPrice.priceHistory.map(p => p.price));
                        const height = ((item.price - minPrice) / (maxPrice - minPrice)) * 100;
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                            <div 
                              className={`w-full rounded-t ${
                                item.month === ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][new Date().getMonth()] 
                                  ? 'bg-primary' : 'bg-accent/40'
                              }`}
                              style={{ height: `${Math.max(height, 10)}%` }}
                              title={`${item.month}: ₹${item.price}`}
                            />
                            <span className="text-[8px] text-muted-foreground">{item.month.slice(0, 1)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <p className="text-sm font-medium text-primary mb-1">💡 {t('crop.recommendation')}</p>
                    <p className="text-sm text-muted-foreground">
                      {marketPrice.trend === 'up' ? t('crop.pricesAboveAvg') : marketPrice.trend === 'down' ? t('crop.pricesBelowAvg') : t('crop.pricesStable')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Nearby Markets & Buyers */}
            {result && (marketsLoading || nearbyMarkets.length > 0) && (
              <Card className="glass-card border-0 animate-grow-in" style={{ animationDelay: '0.3s' }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Store className="text-accent" size={20} />
                     {t('crop.nearbyMarkets')}
                    {location && (
                      <span className="text-xs font-normal text-muted-foreground ml-auto flex items-center gap-1">
                        <MapPin size={12} /> {location}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {marketsLoading && (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <Loader2 className="animate-spin mr-2" size={18} />
                      {t('crop.findingMarkets')}
                    </div>
                  )}
                  {!marketsLoading && nearbyMarkets.map((m, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-lg border border-border/40 bg-card/50 hover:bg-card/80 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <span className="text-lg font-bold text-harvest-gradient shrink-0">#{i + 1}</span>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-primary truncate">{m.name}</h4>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin size={10} /> {m.location} • {m.distanceKm} km
                            </p>
                          </div>
                        </div>
                        <Badge className={demandColor(m.demand)}>{m.demand}</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="p-2 bg-green-500/10 rounded">
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <IndianRupee size={10} /> {t('crop.avgPriceShort')}
                          </p>
                          <p className="text-sm font-bold text-green-700">₹{m.avgPrice}/qtl</p>
                          <p className="text-[10px] text-muted-foreground">{m.priceRange}</p>
                        </div>
                        <div className="p-2 bg-blue-500/10 rounded">
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Truck size={10} /> {t('crop.transport')}
                          </p>
                          <p className="text-xs text-blue-700 font-medium leading-tight">{m.transport}</p>
                        </div>
                      </div>

                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs text-muted-foreground flex-1">
                          <span className="font-medium">💡</span> {m.tip}
                        </p>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          <TrendingUp size={10} className="mr-1" /> {m.netProfitScore}/100
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  emoji: '🧪',
                  title: t('crop.soilAnalysis'),
                  description: t('crop.soilAnalysisDesc')
                },
                {
                  emoji: '🌡️',
                  title: t('crop.climateFactors'),
                  description: t('crop.climateFactorsDesc')
                },
                {
                  emoji: '💧',
                  title: t('crop.waterManagement'),
                  description: t('crop.waterManagementDesc')
                },
                {
                  emoji: '⚖️',
                  title: t('crop.phBalance'),
                  description: t('crop.phBalanceDesc')
                }
              ].map((info, index) => (
                <Card 
                  key={info.title}
                  className="glass-card border-0 card-float animate-bounce-in"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl mb-2">{info.emoji}</div>
                    <h4 className="font-semibold text-primary mb-1">{info.title}</h4>
                    <p className="text-sm text-muted-foreground">{info.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CropRecommendationSection;
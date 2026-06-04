import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Cloud, CloudRain, Sun, Wind, AlertTriangle, Thermometer, Droplets, MapPin, RefreshCw, Calendar, Sprout, Droplet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';

interface WeatherData {
  temperature: number;
  humidity: number;
  rainfall: number;
  location: string;
  forecast?: ForecastDay[];
  plantingSuggestions?: PlantingSuggestions;
}

interface ForecastDay {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  precipitationProbability: number;
  weatherCode: number;
}

interface CropSuggestion {
  crop: string;
  emoji: string;
  suitability: 'high' | 'medium' | 'low';
  reason: string;
  bestDays: string[];
}

interface PlantingSuggestions {
  crops: CropSuggestion[];
  bestPlantingDays: string[];
  overallAssessment: string;
  weekSummary: {
    avgTempMax: number;
    avgTempMin: number;
    totalRain: number;
    avgPrecipProb: number;
  };
}

interface IrrigationDay {
  date: string;
  needsIrrigation: boolean;
  reason: string;
  waterAmount: string;
  priority: 'high' | 'medium' | 'low' | 'none';
}

interface IrrigationSchedule {
  schedule: IrrigationDay[];
  weeklyWaterNeeds: string;
  soilMoisturePrediction: string;
  tips: string[];
}

const WeatherAlertSection = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [irrigationSchedule, setIrrigationSchedule] = useState<IrrigationSchedule | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  const generateIrrigationSchedule = (forecast: ForecastDay[]): IrrigationSchedule => {
    const schedule: IrrigationDay[] = forecast.map((day, index) => {
      const hasRain = day.precipitation > 5 || day.precipitationProbability > 60;
      const isHot = day.tempMax > 32;
      const isDry = day.precipitation < 2 && day.precipitationProbability < 30;
      
      let needsIrrigation = false;
      let reason = '';
      let waterAmount = '0 liters/m²';
      let priority: 'high' | 'medium' | 'low' | 'none' = 'none';

      if (hasRain) {
        reason = `Expected rainfall: ${day.precipitation}mm (${day.precipitationProbability}% probability)`;
        priority = 'none';
      } else if (isHot && isDry) {
        needsIrrigation = true;
        reason = `Hot & dry conditions (${day.tempMax}°C). Soil moisture will deplete rapidly.`;
        waterAmount = '8-10 liters/m²';
        priority = 'high';
      } else if (isDry) {
        needsIrrigation = true;
        reason = `No rainfall expected. Maintain soil moisture.`;
        waterAmount = '5-6 liters/m²';
        priority = 'medium';
      } else {
        reason = `Moderate conditions. Light irrigation if soil appears dry.`;
        waterAmount = '2-3 liters/m²';
        priority = 'low';
        needsIrrigation = index % 2 === 0;
      }

      return { date: day.date, needsIrrigation, reason, waterAmount, priority };
    });

    const totalRain = forecast.reduce((sum, day) => sum + day.precipitation, 0);
    const avgTemp = forecast.reduce((sum, day) => sum + day.tempMax, 0) / forecast.length;
    const dryDays = forecast.filter(d => d.precipitation < 2).length;

    let weeklyWaterNeeds = '';
    if (totalRain > 30) {
      weeklyWaterNeeds = 'Low - Sufficient rainfall expected';
    } else if (totalRain > 15) {
      weeklyWaterNeeds = 'Moderate - Supplement with 20-30 liters/m² weekly';
    } else {
      weeklyWaterNeeds = 'High - Need 40-50 liters/m² weekly irrigation';
    }

    let soilMoisturePrediction = '';
    if (dryDays >= 5 && avgTemp > 30) {
      soilMoisturePrediction = 'Critical - Soil moisture will drop significantly. Daily monitoring recommended.';
    } else if (dryDays >= 3) {
      soilMoisturePrediction = 'Moderate - Soil moisture may decrease. Check every 2 days.';
    } else {
      soilMoisturePrediction = 'Good - Adequate moisture expected. Regular monitoring sufficient.';
    }

    const tips = [
      'Water early morning (6-8 AM) to minimize evaporation',
      'Use drip irrigation for 30% water savings',
      'Apply mulch to retain soil moisture longer',
      avgTemp > 30 ? 'Consider shade nets during peak heat hours' : 'Monitor for signs of overwatering'
    ];

    return { schedule, weeklyWaterNeeds, soilMoisturePrediction, tips };
  };

  const getWeatherIcon = (temp: number, rainfall: number) => {
    if (rainfall > 5) return <CloudRain className="text-blue-500" size={48} />;
    if (temp > 35) return <Sun className="text-orange-500" size={48} />;
    if (temp < 10) return <Wind className="text-cyan-500" size={48} />;
    return <Cloud className="text-gray-400" size={48} />;
  };

  const getForecastIcon = (weatherCode: number) => {
    if (weatherCode >= 61 && weatherCode <= 67) return '🌧️';
    if (weatherCode >= 71 && weatherCode <= 77) return '❄️';
    if (weatherCode >= 80 && weatherCode <= 82) return '🌦️';
    if (weatherCode >= 95) return '⛈️';
    if (weatherCode >= 51 && weatherCode <= 57) return '🌧️';
    if (weatherCode >= 1 && weatherCode <= 3) return '⛅';
    return '☀️';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const analyzeWeatherRisks = (data: WeatherData) => {
    const risks: string[] = [];
    
    if (data.temperature > 35) {
      risks.push('🔥 High temperature alert! Consider irrigation and provide shade for crops.');
    }
    if (data.temperature < 10) {
      risks.push('❄️ Low temperature warning! Protect crops from frost damage.');
    }
    if (data.humidity > 85) {
      risks.push('💧 High humidity detected! Risk of fungal diseases. Monitor crops closely.');
    }
    if (data.rainfall > 50) {
      risks.push('🌧️ Heavy rainfall expected! Ensure proper drainage to prevent waterlogging.');
    }
    if (data.rainfall < 5 && data.humidity < 40) {
      risks.push('☀️ Dry conditions! Plan irrigation schedule to prevent crop stress.');
    }
    
    if (risks.length === 0) {
      risks.push('✅ Weather conditions are favorable for farming activities.');
    }
    
    return risks;
  };

  const fetchWeather = async () => {
    setIsLoading(true);
    try {
      if (!navigator.geolocation) {
        toast({
          title: "Location not available",
          description: "Please enable location services",
          variant: "destructive",
        });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          const { data, error } = await supabase.functions.invoke('get-weather', {
            body: { latitude, longitude, includeForecast: true }
          });

          if (error) throw error;

          setWeatherData(data);
          const risks = analyzeWeatherRisks(data);
          setAlerts(risks);
          
          if (data.forecast) {
            const irrigation = generateIrrigationSchedule(data.forecast);
            setIrrigationSchedule(irrigation);
          }
          
          toast({
            title: "Weather Updated! 🌤️",
            description: "7-day forecast, planting suggestions & irrigation schedule loaded",
          });
          setIsLoading(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast({
            title: "Location Error",
            description: "Could not get your location. Using default values.",
            variant: "destructive",
          });
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('Error fetching weather:', error);
      toast({
        title: "Error",
        description: "Failed to fetch weather data",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  return (
    <section 
      id="weather-alerts" 
      className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background via-background to-accent/5"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 animate-fade-slide-right">
          <div className="inline-flex items-center justify-center p-3 bg-accent/20 rounded-full mb-6 floating-animation">
            <Cloud className="text-accent" size={32} />
          </div>
          <h2 className="text-5xl font-bold text-primary mb-6">
            🌤️ Weather & Smart Planting Guide
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            7-day forecast with AI-powered optimal planting time suggestions
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Current Weather */}
          <Card className="glass-card border-2 border-accent/20 animate-grow-in">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="text-accent" size={20} />
                  Current Weather
                </CardTitle>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={fetchWeather}
                  disabled={isLoading}
                >
                  <RefreshCw className={isLoading ? "animate-spin" : ""} size={16} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {weatherData ? (
                <>
                  <div className="flex items-center justify-center mb-6">
                    {getWeatherIcon(weatherData.temperature, weatherData.rainfall)}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-4 rounded-lg bg-accent/10">
                      <Thermometer className="text-red-500 mx-auto mb-2" size={24} />
                      <div className="text-3xl font-bold text-primary">{weatherData.temperature}°C</div>
                      <div className="text-sm text-muted-foreground">Temperature</div>
                    </div>
                    
                    <div className="text-center p-4 rounded-lg bg-accent/10">
                      <Droplets className="text-blue-500 mx-auto mb-2" size={24} />
                      <div className="text-3xl font-bold text-primary">{weatherData.humidity}%</div>
                      <div className="text-sm text-muted-foreground">Humidity</div>
                    </div>
                  </div>

                  <div className="text-center p-4 rounded-lg bg-accent/10">
                    <CloudRain className="text-cyan-500 mx-auto mb-2" size={24} />
                    <div className="text-3xl font-bold text-primary">{weatherData.rainfall}mm</div>
                    <div className="text-sm text-muted-foreground">Rainfall (Today)</div>
                  </div>

                  <p className="text-center text-muted-foreground mt-4 flex items-center justify-center gap-2">
                    <MapPin size={16} />
                    {weatherData.location}
                  </p>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {isLoading ? 'Loading weather data...' : 'Click refresh to load weather data'}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weather Alerts */}
          <Card className="glass-card border-2 border-orange-500/20 animate-grow-in" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="text-orange-500" size={20} />
                Crop Protection Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {alerts.map((alert, index) => (
                <Alert 
                  key={index} 
                  className={`animate-bounce-in ${
                    alert.includes('✅') ? 'border-green-500/50 bg-green-500/5' : 
                    'border-orange-500/50 bg-orange-500/5'
                  }`}
                  style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                >
                  <AlertDescription className="text-sm">
                    {alert}
                  </AlertDescription>
                </Alert>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* 7-Day Forecast */}
        {weatherData?.forecast && (
          <Card className="glass-card border-2 border-accent/20 mb-8 animate-grow-in" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="text-accent" size={20} />
                7-Day Weather Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                {weatherData.forecast.map((day, index) => (
                  <div 
                    key={day.date}
                    className="text-center p-3 rounded-lg bg-accent/5 hover:bg-accent/10 transition-colors animate-bounce-in"
                    style={{ animationDelay: `${0.4 + index * 0.05}s` }}
                  >
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      {formatDate(day.date)}
                    </div>
                    <div className="text-2xl mb-1">{getForecastIcon(day.weatherCode)}</div>
                    <div className="text-sm font-bold text-primary">
                      {day.tempMax}°
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {day.tempMin}°
                    </div>
                    <div className="text-xs text-blue-500 mt-1">
                      💧 {day.precipitationProbability}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Planting Suggestions */}
        {weatherData?.plantingSuggestions && (
          <Card className="glass-card border-2 border-green-500/20 mb-8 animate-grow-in" style={{ animationDelay: '0.5s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sprout className="text-green-500" size={20} />
                🌱 Optimal Planting Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Overall Assessment */}
              <Alert className="mb-6 border-green-500/50 bg-green-500/5">
                <AlertDescription className="text-sm font-medium">
                  📊 {weatherData.plantingSuggestions.overallAssessment}
                </AlertDescription>
              </Alert>

              {/* Week Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-accent/10 rounded-lg">
                  <div className="text-lg font-bold text-primary">
                    {weatherData.plantingSuggestions.weekSummary.avgTempMax}°C
                  </div>
                  <div className="text-xs text-muted-foreground">Avg High</div>
                </div>
                <div className="text-center p-3 bg-accent/10 rounded-lg">
                  <div className="text-lg font-bold text-primary">
                    {weatherData.plantingSuggestions.weekSummary.avgTempMin}°C
                  </div>
                  <div className="text-xs text-muted-foreground">Avg Low</div>
                </div>
                <div className="text-center p-3 bg-accent/10 rounded-lg">
                  <div className="text-lg font-bold text-primary">
                    {weatherData.plantingSuggestions.weekSummary.totalRain}mm
                  </div>
                  <div className="text-xs text-muted-foreground">Total Rain</div>
                </div>
                <div className="text-center p-3 bg-accent/10 rounded-lg">
                  <div className="text-lg font-bold text-primary">
                    {weatherData.plantingSuggestions.weekSummary.avgPrecipProb}%
                  </div>
                  <div className="text-xs text-muted-foreground">Rain Chance</div>
                </div>
              </div>

              {/* Best Planting Days */}
              {weatherData.plantingSuggestions.bestPlantingDays.length > 0 && (
                <div className="mb-6 p-4 bg-green-500/10 rounded-lg">
                  <h4 className="font-semibold text-primary mb-2">📅 Best Days to Plant This Week:</h4>
                  <div className="flex flex-wrap gap-2">
                    {weatherData.plantingSuggestions.bestPlantingDays.map((date) => (
                      <Badge key={date} variant="secondary" className="bg-green-500/20 text-green-700">
                        {formatDate(date)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Crop Suggestions */}
              <h4 className="font-semibold text-primary mb-4">🌾 Recommended Crops:</h4>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {weatherData.plantingSuggestions.crops.map((crop, index) => (
                  <div 
                    key={crop.crop}
                    className="p-4 rounded-lg bg-accent/5 border border-accent/20 animate-bounce-in"
                    style={{ animationDelay: `${0.6 + index * 0.1}s` }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{crop.emoji}</span>
                      <span className="font-semibold text-primary">{crop.crop}</span>
                      <Badge 
                        variant={crop.suitability === 'high' ? 'default' : 'secondary'}
                        className={crop.suitability === 'high' ? 'bg-green-500' : 'bg-yellow-500'}
                      >
                        {crop.suitability === 'high' ? '✓ Ideal' : '○ Good'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{crop.reason}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Irrigation Schedule */}
        {irrigationSchedule && (
          <Card className="glass-card border-2 border-blue-500/20 mb-8 animate-grow-in" style={{ animationDelay: '0.6s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplet className="text-blue-500" size={20} />
                💧 Smart Irrigation Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Soil Moisture & Water Needs Summary */}
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <Alert className="border-blue-500/50 bg-blue-500/5">
                  <AlertDescription className="text-sm">
                    <span className="font-semibold">📊 Weekly Water Needs:</span><br />
                    {irrigationSchedule.weeklyWaterNeeds}
                  </AlertDescription>
                </Alert>
                <Alert className="border-cyan-500/50 bg-cyan-500/5">
                  <AlertDescription className="text-sm">
                    <span className="font-semibold">🌱 Soil Moisture Forecast:</span><br />
                    {irrigationSchedule.soilMoisturePrediction}
                  </AlertDescription>
                </Alert>
              </div>

              {/* Daily Irrigation Schedule */}
              <h4 className="font-semibold text-primary mb-4">📅 7-Day Irrigation Plan:</h4>
              <div className="space-y-3 mb-6">
                {irrigationSchedule.schedule.map((day, index) => (
                  <div 
                    key={day.date}
                    className={`p-3 rounded-lg border animate-bounce-in ${
                      day.priority === 'high' ? 'border-red-500/50 bg-red-500/5' :
                      day.priority === 'medium' ? 'border-yellow-500/50 bg-yellow-500/5' :
                      day.priority === 'low' ? 'border-blue-500/50 bg-blue-500/5' :
                      'border-green-500/50 bg-green-500/5'
                    }`}
                    style={{ animationDelay: `${0.7 + index * 0.05}s` }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-primary min-w-[80px]">{formatDate(day.date)}</span>
                        <Badge 
                          variant="secondary"
                          className={
                            day.priority === 'high' ? 'bg-red-500/20 text-red-700' :
                            day.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-700' :
                            day.priority === 'low' ? 'bg-blue-500/20 text-blue-700' :
                            'bg-green-500/20 text-green-700'
                          }
                        >
                          {day.needsIrrigation ? `💧 ${day.waterAmount}` : '✓ No irrigation needed'}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{day.reason}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Irrigation Tips */}
              <h4 className="font-semibold text-primary mb-3">💡 Irrigation Tips:</h4>
              <div className="grid sm:grid-cols-2 gap-2">
                {irrigationSchedule.tips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-green-500">✓</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weather Tips */}
        <Card className="glass-card border-2 border-accent/20 animate-grow-in" style={{ animationDelay: '0.8s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💡 Weather Protection Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="text-3xl mb-3">🌡️</div>
                <h4 className="font-semibold text-primary mb-2">Heat Protection</h4>
                <p className="text-sm text-muted-foreground">
                  Use mulching and shade nets during extreme heat. Schedule irrigation during cooler hours.
                </p>
              </div>
              
              <div className="text-center p-4">
                <div className="text-3xl mb-3">💧</div>
                <h4 className="font-semibold text-primary mb-2">Rainfall Management</h4>
                <p className="text-sm text-muted-foreground">
                  Ensure proper drainage systems. Avoid fertilizer application before heavy rains.
                </p>
              </div>
              
              <div className="text-center p-4">
                <div className="text-3xl mb-3">🌱</div>
                <h4 className="font-semibold text-primary mb-2">Crop Monitoring</h4>
                <p className="text-sm text-muted-foreground">
                  Check crops daily during adverse weather. Apply protective measures proactively.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default WeatherAlertSection;
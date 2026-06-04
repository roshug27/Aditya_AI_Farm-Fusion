import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, Calendar, Droplets, Bug, Thermometer, MapPin, History, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import yieldImage from '@/assets/yield-prediction.jpg';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface YieldData {
  crop_name: string;
  year: string;
  rainfall: string;
  pesticide: string;
  temperature: string;
  area: string;
}

interface PredictionResult {
  predicted_yield: number;
  confidence: number;
  factors: {
    rainfall_impact: string;
    temperature_impact: string;
    pesticide_impact: string;
  };
  recommendations: string[];
}

interface YieldHistory {
  id: string;
  crop_name: string;
  year: number;
  predicted_yield: number;
  confidence: number;
  created_at: string;
}

interface YieldPredictionSectionProps {
  preFilledData?: {
    crop_name: string;
    year: string;
    rainfall: string;
    temperature: string;
  } | null;
}

const YieldPredictionSection = ({ preFilledData }: YieldPredictionSectionProps) => {
  const [formData, setFormData] = useState<YieldData>({
    crop_name: '',
    year: '',
    rainfall: '',
    pesticide: '',
    temperature: '',
    area: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [history, setHistory] = useState<YieldHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();

  useEffect(() => {
    if (preFilledData) {
      setFormData(prev => ({
        ...prev,
        crop_name: preFilledData.crop_name,
        year: preFilledData.year,
        rainfall: preFilledData.rainfall,
        temperature: preFilledData.temperature,
      }));
      toast({
        title: "Data Auto-Filled! 🌾",
        description: "Crop data loaded from recommendation. Please add pesticide and area.",
      });
    }
  }, [preFilledData, toast]);

  // Fetch history when user is logged in
  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('yield_predictions')
      .select('id, crop_name, year, predicted_yield, confidence, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setHistory(data);
    }
  };

  const savePrediction = async (prediction: PredictionResult) => {
    if (!user) return;

    await supabase.from('yield_predictions').insert({
      user_id: user.id,
      crop_name: formData.crop_name,
      year: parseInt(formData.year),
      rainfall: parseFloat(formData.rainfall),
      pesticide: parseFloat(formData.pesticide),
      temperature: parseFloat(formData.temperature),
      area: parseFloat(formData.area),
      predicted_yield: prediction.predicted_yield,
      confidence: prediction.confidence,
      recommendations: prediction.recommendations
    });

    fetchHistory();
  };

  const deleteHistory = async (id: string) => {
    await supabase.from('yield_predictions').delete().eq('id', id);
    fetchHistory();
    toast({ title: "Deleted", description: "Prediction removed from history" });
  };

  const inputFields = [
    { key: 'crop_name', label: 'Crop Name', icon: TrendingUp, type: 'text', unit: '', color: 'text-green-500' },
    { key: 'year', label: 'Year', icon: Calendar, type: 'number', unit: '', color: 'text-blue-500' },
    { key: 'rainfall', label: 'Rainfall', icon: Droplets, type: 'number', unit: 'mm', color: 'text-cyan-500' },
    { key: 'pesticide', label: 'Pesticide Usage', icon: Bug, type: 'number', unit: 'kg/ha', color: 'text-orange-500' },
    { key: 'temperature', label: 'Temperature', icon: Thermometer, type: 'number', unit: '°C', color: 'text-red-500' },
    { key: 'area', label: 'Area', icon: MapPin, type: 'number', unit: 'hectares', color: 'text-purple-500' },
  ];

  const handleInputChange = (key: keyof YieldData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    const emptyFields = Object.entries(formData).filter(([_, value]) => !value.trim());
    if (emptyFields.length > 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('predict-yield', {
        body: formData
      });

      if (error) throw error;

      const prediction = data as PredictionResult;
      
      const predictedYield = `${prediction.predicted_yield.toFixed(0)} kg/hectare`;
      
      setResult(predictedYield);
      setConfidence(prediction.confidence);
      setRecommendations(prediction.recommendations || []);
      
      // Save to history if user is logged in
      await savePrediction(prediction);
      
      toast({
        title: "Yield Prediction Ready! 📈",
        description: `Expected yield: ${predictedYield} (${prediction.confidence}% confidence)`,
      });
    } catch (error) {
      console.error('Yield prediction error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to predict yield. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section 
      id="predict" 
      className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 section-bg relative overflow-hidden"
      style={{ backgroundImage: `url(${yieldImage})` }}
    >
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16 animate-fade-slide-right">
          <div className="inline-flex items-center justify-center p-3 bg-accent/20 rounded-full mb-6 floating-animation">
            <TrendingUp className="text-accent" size={32} />
          </div>
          <h2 className="text-5xl font-bold text-white mb-6">
            📈 {t('yieldTitle')}
          </h2>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            {t('yieldSubtitle')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Input Form */}
          <Card className="glass-card border-0 card-float">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-primary flex items-center justify-center gap-3">
                <TrendingUp className="text-accent" />
                {t('cropEnvData')}
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
                      type={field.type}
                      value={formData[field.key as keyof YieldData]}
                      onChange={(e) => handleInputChange(field.key as keyof YieldData, e.target.value)}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      className="farm-input"
                    />
                    {field.unit && (
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                        {field.unit}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full farm-button mt-8"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Calculating Yield...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-5 w-5" />
                    {t('btnYield')}
                  </>
                )}
              </Button>

              {/* History Toggle */}
              {user && history.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full mt-2"
                >
                  <History className="mr-2 h-4 w-4" />
                  {showHistory ? 'Hide History' : `View History (${history.length})`}
                </Button>
              )}

              {/* History List */}
              {showHistory && history.length > 0 && (
                <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                  <h4 className="text-sm font-semibold text-muted-foreground">Recent Predictions</h4>
                  {history.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm">
                      <div>
                        <span className="font-medium">{item.crop_name}</span>
                        <span className="text-muted-foreground ml-2">({item.year})</span>
                        <div className="text-xs text-muted-foreground">
                          {item.predicted_yield.toFixed(0)} kg/ha • {item.confidence}% confidence
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteHistory(item.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results & Analytics */}
          <div className="space-y-6">
            {/* Result Card */}
            {result && (
              <Card className="glass-card border-0 pulse-glow animate-grow-in">
                <CardContent className="p-8 text-center">
                  <div className="text-6xl mb-4 floating-animation">📊</div>
                  <h3 className="text-2xl font-bold text-primary mb-2">
                    {t('predictedYield')}
                  </h3>
                  <p className="text-4xl font-bold text-harvest-gradient mb-4">
                    {result}
                  </p>
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <TrendingUp size={20} />
                    <span className="text-sm">{`${confidence}% ${t('accuracyRate')}`}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Prediction Factors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { emoji: '🌧️', title: 'Weather Impact', description: 'Rainfall patterns affect growth cycles', value: '+15%' },
                { emoji: '🌡️', title: 'Temperature', description: 'Optimal temperature boosts yield', value: '+8%' },
                { emoji: '🧪', title: 'Pesticide Use', description: 'Proper pest control increases output', value: '+12%' },
                { emoji: '📏', title: 'Area Efficiency', description: 'Land utilization optimization', value: '+5%' }
              ].map((factor, index) => (
                <Card 
                  key={factor.title}
                  className="glass-card border-0 card-float animate-bounce-in"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-2xl">{factor.emoji}</div>
                      <span className="text-green-600 font-bold text-sm">{factor.value}</span>
                    </div>
                    <h4 className="font-semibold text-primary mb-1">{factor.title}</h4>
                    <p className="text-sm text-muted-foreground">{factor.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* AI Recommendations Card */}
            {recommendations.length > 0 && (
              <Card className="glass-card border-0 animate-grow-in">
                <CardContent className="p-6">
                  <h4 className="font-bold text-primary mb-3 flex items-center gap-2">
                    💡 AI-Powered Recommendations
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {recommendations.map((rec, idx) => (
                      <li key={idx}>• {rec}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default YieldPredictionSection;
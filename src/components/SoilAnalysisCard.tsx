import { useState, useRef } from "react";
import { Camera, Upload, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";

interface SoilAnalysis {
  soilType: string;
  moisture: string;
  pH: number;
  nitrogen: string;
  phosphorus: string;
  potassium: string;
  healthAssessment: string;
  recommendations: string;
}

interface SoilAnalysisCardProps {
  onAnalysisComplete: (data: { nitrogen: number; phosphorus: number; potassium: number; pH: number }) => void;
  onWeatherDataComplete?: (data: { temperature: number; humidity: number; rainfall: number }) => void;
}

export const SoilAnalysisCard = ({ onAnalysisComplete, onWeatherDataComplete }: SoilAnalysisCardProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const [analysis, setAnalysis] = useState<SoilAnalysis | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const convertToNumeric = (level: string): number => {
    const levelMap: { [key: string]: number } = {
      'Low': 20,
      'Medium': 50,
      'High': 80
    };
    return levelMap[level] || 50;
  };

  const analyzeSoilImage = async (imageBase64: string) => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-soil', {
        body: { imageBase64 }
      });

      if (error) throw error;

      setAnalysis(data);
      
      // Auto-fill the form with analyzed values
      onAnalysisComplete({
        nitrogen: convertToNumeric(data.nitrogen),
        phosphorus: convertToNumeric(data.phosphorus),
        potassium: convertToNumeric(data.potassium),
        pH: data.pH
      });

      toast({
        title: t('soilAnalysis.success') || "Analysis Complete!",
        description: t('soilAnalysis.successDesc') || "Soil data has been analyzed and filled in the form.",
      });
    } catch (error) {
      console.error("Error analyzing soil:", error);
      toast({
        title: t('soilAnalysis.error') || "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze soil image",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      analyzeSoilImage(result);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("NOT_SUPPORTED");
      }

      if (!window.isSecureContext && location.hostname !== 'localhost') {
        throw new Error("INSECURE_CONTEXT");
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        // Retry with basic constraints as a fallback
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (error: any) {
      console.error("Camera access error:", error);

      let errorMessage = "Could not access camera";

      if (error?.message === "NOT_SUPPORTED") {
        errorMessage = "Camera not supported in this browser. Please use the Upload Image option.";
      } else if (error?.message === "INSECURE_CONTEXT") {
        errorMessage = "Camera requires HTTPS. Open the app in a new tab over https or use Upload Image.";
      } else if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
        errorMessage = "Camera permission denied. Please allow access in your browser settings.";
      } else if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
        errorMessage = "No camera found on your device.";
      } else if (error?.name === 'NotReadableError' || error?.name === 'TrackStartError') {
        errorMessage = "Camera is already in use by another application.";
      } else if (error?.name === 'OverconstrainedError') {
        errorMessage = "Camera constraints not supported. Please try the Upload Image option.";
      }

      if (window.top !== window.self) {
        errorMessage += " Tip: In the in-editor preview, camera may be blocked. Open the app in a new tab.";
      }

      toast({
        title: t('soilAnalysis.cameraError') || "Camera Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);
    const imageBase64 = canvas.toDataURL('image/jpeg');
    
    setImagePreview(imageBase64);
    stopCamera();
    analyzeSoilImage(imageBase64);
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const getLocationWeather = async () => {
    setIsFetchingWeather(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { data, error } = await supabase.functions.invoke('get-weather', {
        body: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }
      });

      if (error) throw error;

      // Pass weather data to parent component
      if (onWeatherDataComplete && data) {
        onWeatherDataComplete({
          temperature: data.temperature,
          humidity: data.humidity,
          rainfall: data.rainfall
        });
      }

      toast({
        title: t('weather.success') || "Weather Data Retrieved!",
        description: t('weather.successDesc') || "Environmental data has been filled in the form.",
      });
    } catch (error) {
      toast({
        title: t('weather.error') || "Location Error",
        description: t('weather.errorDesc') || "Could not get your location",
        variant: "destructive",
      });
    } finally {
      setIsFetchingWeather(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          {t('soilAnalysis.title') || "AI Soil Analysis"}
        </CardTitle>
        <CardDescription>
          {t('soilAnalysis.description') || "Take a photo or upload an image of your soil for instant analysis"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={isCameraActive ? capturePhoto : startCamera}
            disabled={isAnalyzing}
            className="flex-1"
          >
            <Camera className="mr-2 h-4 w-4" />
            {isCameraActive ? t('soilAnalysis.capture') || "Capture" : t('soilAnalysis.camera') || "Use Camera"}
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            variant="outline"
            className="flex-1"
          >
            <Upload className="mr-2 h-4 w-4" />
            {t('soilAnalysis.upload') || "Upload Image"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        <Button
          onClick={getLocationWeather}
          disabled={isFetchingWeather}
          variant="secondary"
          className="w-full"
        >
          {isFetchingWeather ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <MapPin className="mr-2 h-4 w-4" />
          )}
          {t('soilAnalysis.getWeather') || "Get Weather Data from Location"}
        </Button>

        {isCameraActive && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg"
          />
        )}

        {imagePreview && !isCameraActive && (
          <img src={imagePreview} alt="Soil sample" className="w-full rounded-lg" />
        )}

        {isAnalyzing && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {analysis && (
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold">{t('soilAnalysis.results') || "Analysis Results"}</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="font-medium">{t('soilAnalysis.soilType') || "Soil Type"}:</span> {analysis.soilType}</div>
              <div><span className="font-medium">{t('soilAnalysis.moisture') || "Moisture"}:</span> {analysis.moisture}</div>
              <div><span className="font-medium">pH:</span> {analysis.pH}</div>
              <div><span className="font-medium">N-P-K:</span> {analysis.nitrogen}-{analysis.phosphorus}-{analysis.potassium}</div>
            </div>
            <p className="text-sm"><span className="font-medium">{t('soilAnalysis.health') || "Health"}:</span> {analysis.healthAssessment}</p>
            <p className="text-sm"><span className="font-medium">{t('soilAnalysis.recommendations') || "Recommendations"}:</span> {analysis.recommendations}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

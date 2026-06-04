import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, includeForecast } = await req.json();

    // Using Open-Meteo API with extended forecast data
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weathercode&timezone=auto&forecast_days=7`;

    console.log('Fetching weather from:', weatherUrl);

    const response = await fetch(weatherUrl);
    
    if (!response.ok) {
      throw new Error("Failed to fetch weather data");
    }

    const data = await response.json();
    
    const weatherData: any = {
      temperature: Math.round(data.current.temperature_2m),
      humidity: Math.round(data.current.relative_humidity_2m),
      rainfall: data.daily.precipitation_sum[0] || 0,
      location: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`
    };

    // Include 7-day forecast if requested
    if (includeForecast) {
      weatherData.forecast = data.daily.time.map((date: string, index: number) => ({
        date,
        tempMax: Math.round(data.daily.temperature_2m_max[index]),
        tempMin: Math.round(data.daily.temperature_2m_min[index]),
        precipitation: data.daily.precipitation_sum[index] || 0,
        precipitationProbability: data.daily.precipitation_probability_max[index] || 0,
        weatherCode: data.daily.weathercode[index]
      }));

      // Generate planting suggestions based on forecast
      weatherData.plantingSuggestions = generatePlantingSuggestions(weatherData.forecast);
    }

    console.log('Weather data fetched successfully');

    return new Response(JSON.stringify(weatherData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in get-weather function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

interface ForecastDay {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  precipitationProbability: number;
  weatherCode: number;
}

function generatePlantingSuggestions(forecast: ForecastDay[]) {
  const suggestions: any[] = [];
  
  // Analyze forecast patterns
  const avgTempMax = forecast.reduce((sum, day) => sum + day.tempMax, 0) / forecast.length;
  const avgTempMin = forecast.reduce((sum, day) => sum + day.tempMin, 0) / forecast.length;
  const totalRain = forecast.reduce((sum, day) => sum + day.precipitation, 0);
  const avgPrecipProb = forecast.reduce((sum, day) => sum + day.precipitationProbability, 0) / forecast.length;
  
  // Find best planting days (low rain probability, moderate temp)
  const bestDays = forecast.filter(day => 
    day.precipitationProbability < 30 && 
    day.tempMax < 38 && 
    day.tempMin > 12
  );

  // Crop-specific suggestions based on weather
  if (avgTempMax >= 25 && avgTempMax <= 35) {
    suggestions.push({
      crop: 'Rice',
      emoji: '🌾',
      suitability: 'high',
      reason: `Ideal temperature range (${Math.round(avgTempMin)}°C - ${Math.round(avgTempMax)}°C) for rice cultivation`,
      bestDays: bestDays.slice(0, 3).map(d => d.date)
    });
  }

  if (avgTempMax >= 20 && avgTempMax <= 30 && totalRain < 100) {
    suggestions.push({
      crop: 'Wheat',
      emoji: '🌾',
      suitability: avgTempMax <= 25 ? 'high' : 'medium',
      reason: `Moderate temperatures suitable for wheat. ${totalRain.toFixed(0)}mm expected rainfall`,
      bestDays: bestDays.slice(0, 3).map(d => d.date)
    });
  }

  if (avgTempMax >= 22 && avgTempMax <= 32) {
    suggestions.push({
      crop: 'Maize/Corn',
      emoji: '🌽',
      suitability: totalRain >= 20 ? 'high' : 'medium',
      reason: `Good temperature for maize. ${totalRain >= 20 ? 'Adequate' : 'Low'} moisture expected`,
      bestDays: bestDays.slice(0, 3).map(d => d.date)
    });
  }

  if (avgTempMax >= 18 && avgTempMax <= 30) {
    suggestions.push({
      crop: 'Vegetables',
      emoji: '🥬',
      suitability: avgPrecipProb < 50 ? 'high' : 'medium',
      reason: `Favorable conditions for leafy vegetables. ${avgPrecipProb < 50 ? 'Good' : 'Monitor'} for pest control`,
      bestDays: bestDays.slice(0, 3).map(d => d.date)
    });
  }

  if (avgTempMax >= 20 && avgTempMax <= 35) {
    suggestions.push({
      crop: 'Pulses',
      emoji: '🫘',
      suitability: totalRain < 80 ? 'high' : 'medium',
      reason: `Suitable for dal cultivation. ${totalRain < 80 ? 'Good drainage conditions' : 'Ensure proper drainage'}`,
      bestDays: bestDays.slice(0, 3).map(d => d.date)
    });
  }

  if (avgTempMax >= 25 && avgTempMax <= 35 && totalRain < 50) {
    suggestions.push({
      crop: 'Cotton',
      emoji: '🧵',
      suitability: 'high',
      reason: `Hot and relatively dry conditions ideal for cotton`,
      bestDays: bestDays.slice(0, 3).map(d => d.date)
    });
  }

  // Overall assessment
  let overallAssessment = '';
  if (avgPrecipProb > 60) {
    overallAssessment = 'Rainy week expected. Avoid planting seeds that need dry conditions. Good for rice transplanting.';
  } else if (avgTempMax > 38) {
    overallAssessment = 'Heat wave conditions expected. Plan irrigation and avoid mid-day field work.';
  } else if (avgTempMin < 10) {
    overallAssessment = 'Cold conditions expected. Protect seedlings and delay planting of warm-season crops.';
  } else {
    overallAssessment = 'Generally favorable conditions for most farming activities.';
  }

  return {
    crops: suggestions,
    bestPlantingDays: bestDays.slice(0, 3).map(d => d.date),
    overallAssessment,
    weekSummary: {
      avgTempMax: Math.round(avgTempMax),
      avgTempMin: Math.round(avgTempMin),
      totalRain: Math.round(totalRain),
      avgPrecipProb: Math.round(avgPrecipProb)
    }
  };
}
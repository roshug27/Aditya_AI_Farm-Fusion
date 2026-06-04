import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { MessageCircle, Send, X, Loader2, Volume2, VolumeX, Languages, Mic, MicOff, Settings2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type VoiceLanguage = 'en' | 'hi' | 'ta' | 'bn' | 'mr';

const VOICE_LANGUAGES: { code: VoiceLanguage; name: string; langCode: string; script: string }[] = [
  { code: 'en', name: 'English', langCode: 'en-US', script: 'Latin/English' },
  { code: 'hi', name: 'हिंदी', langCode: 'hi-IN', script: 'Devanagari/Hindi' },
  { code: 'ta', name: 'தமிழ்', langCode: 'ta-IN', script: 'Tamil' },
  { code: 'bn', name: 'বাংলা', langCode: 'bn-IN', script: 'Bengali' },
  { code: 'mr', name: 'मराठी', langCode: 'mr-IN', script: 'Devanagari/Marathi' },
];

const FarmChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceLanguage, setVoiceLanguage] = useState<VoiceLanguage>('en');
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [voiceSpeed, setVoiceSpeed] = useState(0.85);
  const [isListening, setIsListening] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const recognitionRef = useRef<any>(null);
  const streamingRef = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Load voices and initialize speech recognition
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setInput(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast({
            title: 'Microphone Access Denied',
            description: 'Please allow microphone access to use voice input.',
            variant: 'destructive',
          });
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [toast]);

  const startListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: 'Not Supported',
        description: 'Speech recognition is not supported in this browser.',
        variant: 'destructive',
      });
      return;
    }

    const selectedLang = VOICE_LANGUAGES.find(l => l.code === voiceLanguage);
    recognitionRef.current.lang = selectedLang?.langCode || 'en-US';
    
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error('Error starting recognition:', error);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const speakText = (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = voiceSpeed;
    utterance.pitch = 1.05;
    utterance.volume = 0.9;

    const selectedLang = VOICE_LANGUAGES.find(l => l.code === voiceLanguage);
    const langCode = selectedLang?.langCode || 'en-US';
    const langBase = langCode.split('-')[0].toLowerCase();
    
    // Use cached voices, fallback to fresh fetch
    let voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
    
    // If voices still not loaded, wait for them
    if (voices.length === 0) {
      const handleVoicesChanged = () => {
        voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
        assignVoiceAndSpeak(utterance, voices, langCode, langBase, utterance.text);
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      };
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
      return;
    }

    assignVoiceAndSpeak(utterance, voices, langCode, langBase, utterance.text);
  };

  const assignVoiceAndSpeak = (
    utterance: SpeechSynthesisUtterance, 
    voices: SpeechSynthesisVoice[], 
    langCode: string,
    langBase: string,
    fullText: string
  ) => {
    const femaleKeywords = ['female', 'woman', 'girl', 'zira', 'samantha', 'victoria', 'karen', 'moira', 'tessa', 'veena', 'lekha', 'fiona', 'alice', 'amelie', 'helena', 'heera', 'priya', 'neerja', 'kalpana', 'swara', 'meera'];
    const premiumKeywords = ['premium', 'enhanced', 'neural', 'natural'];
    
    const isFemale = (v: SpeechSynthesisVoice) => femaleKeywords.some(k => v.name.toLowerCase().includes(k));
    const isPremium = (v: SpeechSynthesisVoice) => premiumKeywords.some(k => v.name.toLowerCase().includes(k));

    // Log all available voices for this language for debugging
    console.log(`Looking for voices for ${langCode} (base: ${langBase}). Total voices: ${voices.length}`);

    // Match voices by exact lang code OR base language code
    const langVoices = voices.filter(v => {
      const vLang = v.lang.toLowerCase().replace(/_/g, '-'); // normalize underscores to hyphens
      return vLang === langCode.toLowerCase() || vLang.startsWith(langBase + '-') || vLang === langBase;
    });

    console.log(`Found ${langVoices.length} voices for ${langCode}:`, langVoices.map(v => `${v.name} (${v.lang})`));

    let preferredVoice: SpeechSynthesisVoice | undefined;
    let usingFallback = false;

    if (langVoices.length > 0) {
      // Priority: Google voice > Premium Female > Female > Any lang voice
      preferredVoice = langVoices.find(v => v.name.toLowerCase().includes('google') && isFemale(v))
        || langVoices.find(v => v.name.toLowerCase().includes('google'))
        || langVoices.find(v => isFemale(v) && isPremium(v))
        || langVoices.find(v => isFemale(v))
        || langVoices[0];
    } else {
      // No voice for this language — fall back to English voice
      usingFallback = true;
      const enVoices = voices.filter(v => v.lang.toLowerCase().startsWith('en'));
      preferredVoice = enVoices.find(v => isFemale(v) && isPremium(v))
        || enVoices.find(v => isFemale(v))
        || enVoices.find(v => v.name.toLowerCase().includes('google'))
        || enVoices[0]
        || voices[0];
      
      const selectedLang = VOICE_LANGUAGES.find(l => l.langCode === langCode);
      toast({
        title: `${selectedLang?.name || langCode} voice not available`,
        description: 'Your browser doesn\'t have a voice for this language. Text response is still in the correct language. Try Chrome on desktop for best voice support.',
      });
    }

    if (preferredVoice) {
      utterance.voice = preferredVoice;
      // Always set lang to the target langCode so the TTS engine tries to pronounce correctly
      utterance.lang = langCode;
      console.log(`Selected voice: ${preferredVoice.name} (${preferredVoice.lang}) for language: ${langCode}${usingFallback ? ' [FALLBACK]' : ''}`);
    } else {
      utterance.lang = langCode;
      console.log(`No voice found at all for ${langCode}`);
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      // Chrome has a bug where it fires 'interrupted' errors when cancelling — ignore those
      if (e.error === 'interrupted' || e.error === 'canceled') {
        setIsSpeaking(false);
        return;
      }
      console.error('Speech synthesis error:', e.error);
      setIsSpeaking(false);
    };

    speechSynthRef.current = utterance;

    // Chrome bug workaround: speech cuts out after ~15s on long texts
    // Split into sentences and speak sequentially
    const sentences = fullText.match(/[^.!?।\n]+[.!?।\n]*/g) || [fullText];
    const chunks: string[] = [];
    let current = '';
    for (const s of sentences) {
      if ((current + s).length > 200) {
        if (current) chunks.push(current.trim());
        current = s;
      } else {
        current += s;
      }
    }
    if (current.trim()) chunks.push(current.trim());

    if (chunks.length <= 1) {
      window.speechSynthesis.speak(utterance);
    } else {
      // Speak in chunks to avoid Chrome timeout
      let i = 0;
      const speakNext = () => {
        if (i >= chunks.length) {
          setIsSpeaking(false);
          return;
        }
        const chunk = new SpeechSynthesisUtterance(chunks[i]);
        chunk.voice = utterance.voice;
        chunk.lang = utterance.lang;
        chunk.rate = utterance.rate;
        chunk.pitch = utterance.pitch;
        chunk.volume = utterance.volume;
        chunk.onstart = () => setIsSpeaking(true);
        chunk.onend = () => {
          i++;
          if (i < chunks.length) {
            speakNext();
          } else {
            setIsSpeaking(false);
          }
        };
        chunk.onerror = (e) => {
          if (e.error !== 'interrupted' && e.error !== 'canceled') {
            console.error('Speech chunk error:', e.error);
          }
          setIsSpeaking(false);
        };
        speechSynthRef.current = chunk;
        window.speechSynthesis.speak(chunk);
      };
      speakNext();
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const streamChat = async (userMessage: string) => {
    if (streamingRef.current) return; // Prevent duplicate requests
    streamingRef.current = true;
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const selectedLang = VOICE_LANGUAGES.find(l => l.code === voiceLanguage);
      const langInstruction = voiceLanguage !== 'en' 
        ? `You MUST respond ONLY in ${selectedLang?.name} language using ${selectedLang?.script} script. Do NOT use English, Tamil, Hindi, or any other language. Ignore the language of previous messages in this conversation. Your ENTIRE response must be in ${selectedLang?.name} (${selectedLang?.script} script) only.` 
        : 'Please respond in English language only.';

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/farm-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            messages: newMessages,
            languagePreference: langInstruction 
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const lastMessage = prev[prev.length - 1];
                if (lastMessage?.role === 'assistant') {
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: assistantContent } : m
                  );
                }
                return [...prev, { role: 'assistant', content: assistantContent }];
              });
            }
          } catch (e) {
            console.error('JSON parse error:', e);
          }
        }
      }

      if (assistantContent) {
        speakText(assistantContent);
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      streamingRef.current = false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    await streamChat(userMessage);
  };

  const handleClose = () => {
    stopSpeaking();
    stopListening();
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[600px] flex flex-col shadow-2xl z-50 border-2">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <h3 className="font-semibold">Adiii - Farm Assistant</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowVoiceSettings(!showVoiceSettings);
              setShowLanguageSelector(false);
            }}
            className="h-8 w-8 hover:bg-primary/80"
            title="Voice settings"
          >
            <Settings2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowLanguageSelector(!showLanguageSelector);
              setShowVoiceSettings(false);
            }}
            className="h-8 w-8 hover:bg-primary/80"
            title="Change voice language"
          >
            <Languages className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (isSpeaking) {
                stopSpeaking();
              }
              setVoiceEnabled(!voiceEnabled);
            }}
            className="h-8 w-8 hover:bg-primary/80"
            title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
          >
            {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8 hover:bg-primary/80"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Voice Settings Panel */}
      {showVoiceSettings && (
        <div className="p-3 border-b bg-muted/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Voice Speed</span>
            <span className="text-xs text-muted-foreground">
              {voiceSpeed < 0.7 ? 'Slow' : voiceSpeed < 1.0 ? 'Normal' : voiceSpeed < 1.3 ? 'Fast' : 'Very Fast'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">🐢</span>
            <Slider
              value={[voiceSpeed]}
              onValueChange={(val) => setVoiceSpeed(val[0])}
              min={0.5}
              max={1.5}
              step={0.05}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground">🐇</span>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Adjust how fast Adiii speaks
          </p>
        </div>
      )}

      {/* Language Selector */}
      {showLanguageSelector && (
        <div className="p-3 border-b bg-muted/50">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Language:</span>
            <Select value={voiceLanguage} onValueChange={(val) => {
                  stopSpeaking(); // Cancel previous voice immediately
                  setVoiceLanguage(val as VoiceLanguage);
                }}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VOICE_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isSpeaking && (
              <Button variant="outline" size="sm" onClick={stopSpeaking} className="h-8">
                Stop
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm font-medium">Hi! I'm Adiii 🌱</p>
            <p className="text-sm">Ask me anything about farming!</p>
            <p className="text-xs mt-2">
              Crops • Weather • Pests • Soil • Techniques
            </p>
            <p className="text-xs mt-2 text-primary">
              🎤 Speak or type in 5 languages
            </p>
            <p className="text-xs text-muted-foreground">
              EN, हिंदी, தமிழ், বাংলা, मराठी
            </p>
          </div>
        )}
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Button
            type="button"
            variant={isListening ? "destructive" : "outline"}
            size="icon"
            onClick={isListening ? stopListening : startListening}
            disabled={isLoading}
            className="shrink-0"
            title={isListening ? 'Stop listening' : 'Start voice input'}
          >
            {isListening ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "Listening..." : "Ask Adiii about farming..."}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()} size="icon">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        {isListening && (
          <p className="text-xs text-center text-primary mt-2 animate-pulse">
            🎤 Listening... Speak now
          </p>
        )}
      </form>
    </Card>
  );
};

// Add type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default FarmChatbot;
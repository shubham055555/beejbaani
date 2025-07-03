'use client';

import type { WeatherAndSoilAdviceOutput } from '@/ai/flows/get-weather-and-soil-advice';
import { analyzeImageWithQuestion } from '@/ai/flows/analyze-image-with-question';
import { getWeatherAndSoilAdvice } from '@/ai/flows/get-weather-and-soil-advice';
import { answerAgriculturalQuestion } from '@/ai/flows/answer-agricultural-questions';

import * as React from 'react';
import { Bot, Image as ImageIcon, Leaf, Mic, Send, User, BrainCircuit, X } from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage, type Message } from '@/components/chat-message';
import { PlantLoader } from '@/components/loader';

export default function Home() {
  const { toast } = useToast();
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);
  const [pendingImage, setPendingImage] = React.useState<{data: string; preview: string} | null>(null);

  const speechRecognitionRef = React.useRef<any>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      speechRecognitionRef.current = new webkitSpeechRecognition();
      speechRecognitionRef.current.continuous = false;
      speechRecognitionRef.current.lang = 'hi-IN';
      speechRecognitionRef.current.onresult = (event: any) => {
        setInput(event.results[0][0].transcript);
        setIsRecording(false);
      };
      speechRecognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event);
        toast({ title: 'आवाज़ पहचानने में त्रुटि', description: 'कृपया दोबारा प्रयास करें।', variant: 'destructive' });
        setIsRecording(false);
      };
      speechRecognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, [toast]);
  
  React.useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleVoiceInput = () => {
    if (isRecording) {
      speechRecognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      speechRecognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const addMessage = (role: 'user' | 'bot', type: Message['type'], content: any, imageUrl?: string, isVoice?: boolean) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), role, type, content, imageUrl, isVoice }]);
  };

  const handleSendMessage = async () => {
    const question = input.trim();
    if (!question) {
        if (pendingImage) {
            toast({ title: 'सवाल आवश्यक है', description: 'कृपया संलग्न तस्वीर के बारे में एक सवाल पूछें।', variant: 'destructive' });
        }
        return;
    }

    const isVoice = isRecording;
    setInput('');
    setIsLoading(true);

    if (pendingImage) {
        addMessage('user', 'image-request', question, pendingImage.preview, isVoice);
        const imageDataUri = pendingImage.data;
        const previewUrl = pendingImage.preview;
        setPendingImage(null);

        try {
            const result = await analyzeImageWithQuestion({ photoDataUri: imageDataUri, question });
            addMessage('bot', 'text', result.answer);
        } catch (error) {
            console.error(error);
            addMessage('bot', 'text', 'माफ़ कीजिए, मैं इस तस्वीर का विश्लेषण नहीं कर सका।');
        } finally {
            URL.revokeObjectURL(previewUrl);
            setIsLoading(false);
        }
    } else {
        addMessage('user', 'text', question, undefined, isVoice);
        try {
            const result = await answerAgriculturalQuestion({ question });
            addMessage('bot', 'text', result.answer);
        } catch (error) {
            console.error(error);
            addMessage('bot', 'text', 'माफ़ कीजिए, मुझे आपका सवाल समझ नहीं आया।');
        } finally {
            setIsLoading(false);
        }
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const base64data = reader.result as string;
      const previewUrl = URL.createObjectURL(file);
      setPendingImage({ data: base64data, preview: previewUrl });
      toast({
        title: 'तस्वीर संलग्न है',
        description: 'अब आप अपना सवाल पूछ सकते हैं।',
      });
    };
    event.target.value = "";
  };
  
  const handleGetWeatherAdvice = async () => {
    addMessage('user', 'weather-request', 'कृपया मौसम और मिट्टी की सलाह दें।');
    setIsLoading(true);
    try {
      // Note: In a real app, region and crop would be dynamic
      const result = await getWeatherAndSoilAdvice({ region: 'उत्तर प्रदेश', crop: 'गेहूं' });
      addMessage('bot', 'weather-report', result);
    } catch (error) {
      console.error(error);
      addMessage('bot', 'text', 'माफ़ कीजिए, मैं अभी मौसम की जानकारी नहीं दे सकता।');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex flex-col items-center min-h-screen p-4 font-body bg-background text-foreground">
      <header className="flex items-center gap-3 mb-4">
        <Leaf className="w-10 h-10 text-primary" />
        <h1 className="text-4xl font-bold font-headline text-primary">बीज-बाणी</h1>
      </header>
      
      <Card className="w-full max-w-3xl mx-auto shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="w-8 h-8 text-primary" />
            <CardTitle className="font-headline">आपका कृषि सहायक</CardTitle>
          </div>
          <Button variant="outline" size="lg" onClick={handleGetWeatherAdvice} className="font-headline">
            <BrainCircuit className="w-5 h-5 mr-2" />
            मौसम सलाह
          </Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[55vh] pr-4" ref={scrollAreaRef}>
            <div className="space-y-6">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground">
                  नमस्ते! आप खेती-बाड़ी के बारे में कुछ भी पूछ सकते हैं।
                </div>
              )}
              {messages.map(msg => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {isLoading && (
                <div className="flex justify-center">
                   <PlantLoader />
                </div>
              )}
               <div />
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="pt-6 flex-col items-stretch gap-4">
          {pendingImage && (
            <div className="relative w-24">
                <p className="text-sm text-muted-foreground mb-1">संलग्न तस्वीर:</p>
                <Image src={pendingImage.preview} alt="Pending upload" width={80} height={80} className="rounded-md border" />
                <Button
                variant="destructive"
                size="icon"
                className="absolute -top-3 -right-3 h-7 w-7 rounded-full"
                onClick={() => {
                    URL.revokeObjectURL(pendingImage.preview);
                    setPendingImage(null);
                }}
                >
                <X className="h-4 w-4" />
                </Button>
            </div>
          )}
          <div className="flex w-full gap-2">
            <Button variant="outline" size="icon" className="h-12 w-12 shrink-0" onClick={() => fileInputRef.current?.click()}>
              <ImageIcon className="w-6 h-6" />
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex flex-grow gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={pendingImage ? "तस्वीर के बारे में पूछें..." : "अपना सवाल यहाँ लिखें..."}
                className="h-12 text-base"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" className="h-12 w-12 shrink-0" disabled={isLoading || !input.trim()}>
                <Send className="w-6 h-6" />
              </Button>
            </form>
            
            <Button
              variant={isRecording ? 'destructive' : 'outline'}
              size="icon"
              className="h-12 w-12 shrink-0"
              onClick={handleVoiceInput}
              disabled={!speechRecognitionRef.current}
            >
              <Mic className="w-6 h-6" />
            </Button>
          </div>
        </CardFooter>
      </Card>
      <footer className="mt-4 text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} बीज-बाणी - किसानों के लिए।
      </footer>
    </div>
  );
}

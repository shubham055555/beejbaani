'use client';

import type { WeatherAndSoilAdviceOutput } from '@/ai/flows/get-weather-and-soil-advice';
import { analyzeImageWithQuestion } from '@/ai/flows/analyze-image-with-question';
import { getWeatherAndSoilAdvice } from '@/ai/flows/get-weather-and-soil-advice';
import { answerAgriculturalQuestion } from '@/ai/flows/answer-agricultural-questions';

import * as React from 'react';
import { Bot, Image as ImageIcon, Leaf, Mic, Send, User, BrainCircuit, X, Plus, MessageSquare } from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage, type Message } from '@/components/chat-message';
import { PlantLoader } from '@/components/loader';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger, SidebarFooter } from '@/components/ui/sidebar';

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
}

export default function Home() {
  const { toast } = useToast();
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = React.useState<string | null>(null);

  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);
  const [pendingImage, setPendingImage] = React.useState<{data: string; preview: string} | null>(null);

  const speechRecognitionRef = React.useRef<any>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  const activeConversation = React.useMemo(() => 
    conversations.find(c => c.id === activeConversationId),
    [conversations, activeConversationId]
  );
  
  const handleNewChat = React.useCallback(() => {
    const newId = Date.now().toString();
    const newConversation: Conversation = { id: newId, title: "नई बातचीत", messages: [] };
    setConversations(prev => [newConversation, ...prev.filter(c => c.messages.length > 0)]); // Remove empty chats
    setActiveConversationId(newId);
    setInput('');
    setPendingImage(null);
  }, []);

  React.useEffect(() => {
    try {
      const savedConversations = localStorage.getItem('beej-baani-conversations');
      const savedActiveId = localStorage.getItem('beej-baani-active-id');

      if (savedConversations) {
        const parsedConvos = JSON.parse(savedConversations);
        if (Array.isArray(parsedConvos) && parsedConvos.length > 0) {
          setConversations(parsedConvos);
          const activeId = savedActiveId ? JSON.parse(savedActiveId) : parsedConvos[0].id;
          setActiveConversationId(activeId);
          return;
        }
      }
    } catch (error) {
      console.error("Failed to load conversations from localStorage", error);
    }
    handleNewChat();
  }, [handleNewChat]);

  React.useEffect(() => {
    try {
      if (conversations.length > 0) {
        localStorage.setItem('beej-baani-conversations', JSON.stringify(conversations.filter(c => c.messages.length > 0)));
      }
      if (activeConversationId) {
        localStorage.setItem('beej-baani-active-id', JSON.stringify(activeConversationId));
      }
    } catch (error) {
      console.error("Failed to save to localStorage", error);
    }
  }, [conversations, activeConversationId]);
  
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
  }, [activeConversation?.messages]);

  const addMessagesToActiveConversation = (newMessages: Message[], newTitle?: string) => {
    if (!activeConversationId) return;

    setConversations(prevConvos => 
      prevConvos.map(c => {
        if (c.id === activeConversationId) {
          const updatedConversation = { ...c, messages: [...c.messages, ...newMessages] };
          if (c.messages.length === 0 && newTitle) {
            updatedConversation.title = newTitle;
          }
          return updatedConversation;
        }
        return c;
      })
    );
  };

  const handleVoiceInput = () => {
    if (isRecording) {
      speechRecognitionRef.current?.stop();
    } else {
      speechRecognitionRef.current?.start();
      setIsRecording(true);
    }
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
        const userMessage: Message = { id: Date.now().toString(), role: 'user', type: 'image-request', content: question, imageUrl: pendingImage.preview, isVoice };
        const imageDataUri = pendingImage.data;
        const previewUrl = pendingImage.preview;
        setPendingImage(null);

        addMessagesToActiveConversation([userMessage], question.substring(0, 30));

        try {
            const result = await analyzeImageWithQuestion({ photoDataUri: imageDataUri, question });
            addMessagesToActiveConversation([{ id: Date.now().toString(), role: 'bot', type: 'text', content: result.answer }]);
        } catch (error) {
            console.error(error);
            addMessagesToActiveConversation([{ id: Date.now().toString(), role: 'bot', type: 'text', content: 'माफ़ कीजिए, मैं इस तस्वीर का विश्लेषण नहीं कर सका।' }]);
        } finally {
            URL.revokeObjectURL(previewUrl);
            setIsLoading(false);
        }
    } else {
        const userMessage: Message = { id: Date.now().toString(), role: 'user', type: 'text', content: question, isVoice };
        addMessagesToActiveConversation([userMessage], question.substring(0, 30));
        try {
            const result = await answerAgriculturalQuestion({ question });
            addMessagesToActiveConversation([{ id: Date.now().toString(), role: 'bot', type: 'text', content: result.answer }]);
        } catch (error) {
            console.error(error);
            addMessagesToActiveConversation([{ id: Date.now().toString(), role: 'bot', type: 'text', content: 'माफ़ कीजिए, मुझे आपका सवाल समझ नहीं आया।' }]);
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
    const userMessage: Message = { id: Date.now().toString(), role: 'user', type: 'weather-request', content: 'कृपया मौसम और मिट्टी की सलाह दें।'};
    addMessagesToActiveConversation([userMessage], 'मौसम और मिट्टी की सलाह');
    setIsLoading(true);
    try {
      // Note: In a real app, region and crop would be dynamic
      const result = await getWeatherAndSoilAdvice({ region: 'उत्तर प्रदेश', crop: 'गेहूं' });
      addMessagesToActiveConversation([{ id: Date.now().toString(), role: 'bot', type: 'weather-report', content: result}]);
    } catch (error) {
      console.error(error);
      addMessagesToActiveConversation([{ id: Date.now().toString(), role: 'bot', type: 'text', content: 'माफ़ कीजिए, मैं अभी मौसम की जानकारी नहीं दे सकता।'}]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar>
          <SidebarHeader className="items-center">
            <div className="flex items-center gap-2 flex-grow">
              <Leaf className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold font-headline text-primary">बीज-बाणी</h1>
            </div>
            <Button variant="outline" size="icon" onClick={handleNewChat}>
              <Plus />
            </Button>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {conversations.map(convo => (
                <SidebarMenuItem key={convo.id}>
                  <SidebarMenuButton
                    onClick={() => setActiveConversationId(convo.id)}
                    isActive={convo.id === activeConversationId}
                  >
                    <MessageSquare />
                    <span>{convo.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
             <p className="text-xs text-muted-foreground p-2">&copy; {new Date().getFullYear()} बीज-बाणी</p>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex flex-col p-4 max-h-screen">
          <Card className="w-full max-w-4xl mx-auto shadow-2xl flex flex-col flex-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="md:hidden" />
                <Bot className="w-8 h-8 text-primary" />
                <CardTitle className="font-headline">आपका कृषि सहायक</CardTitle>
              </div>
              <Button variant="outline" size="lg" onClick={handleGetWeatherAdvice} className="font-headline">
                <BrainCircuit className="w-5 h-5 mr-2" />
                मौसम सलाह
              </Button>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 pr-4 -mr-4" ref={scrollAreaRef}>
                <div className="space-y-6">
                  {(activeConversation?.messages || []).length === 0 && (
                    <div className="text-center text-muted-foreground py-10">
                      नमस्ते! आप खेती-बाड़ी के बारे में कुछ भी पूछ सकते हैं।
                    </div>
                  )}
                  {(activeConversation?.messages || []).map(msg => (
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
                <div className="relative w-24 self-start">
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
                  <Button type="submit" size="icon" className="h-12 w-12 shrink-0" disabled={isLoading || (!input.trim() && !pendingImage)}>
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
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

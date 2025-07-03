'use client';

import * as React from 'react';
import type { IdentifyCropDiseaseOutput, WeatherAndSoilAdviceOutput } from '@/ai/flows/identify-crop-disease';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, User, Volume2 } from "lucide-react";
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

export interface Message {
  id: string;
  role: 'user' | 'bot';
  type: 'text' | 'image-request' | 'disease-report' | 'weather-report' | 'weather-request';
  content: string | IdentifyCropDiseaseOutput | WeatherAndSoilAdviceOutput;
  imageUrl?: string;
  isVoice?: boolean;
}

interface ChatMessageProps {
  message: Message;
}

const renderContent = (message: Message) => {
  switch (message.type) {
    case 'text':
      return <p className="leading-relaxed">{message.content as string}</p>;
    case 'image-request':
      return (
        <div>
          <p className="mb-2">{message.content as string}</p>
          {message.imageUrl && (
            <Image
              src={message.imageUrl}
              alt="Uploaded crop"
              width={200}
              height={200}
              className="rounded-lg border-2 border-primary"
              data-ai-hint="crop plant"
            />
          )}
        </div>
      );
    case 'weather-request':
        return <p className="leading-relaxed">{message.content as string}</p>;
    case 'disease-report':
        const report = message.content as IdentifyCropDiseaseOutput;
        return (
            <div className="space-y-3">
                <h4 className="font-bold">फसल रोग की पहचान रिपोर्ट</h4>
                <p>
                    <Badge variant={report.diseaseIdentification.diseaseDetected ? "destructive" : "default"}>
                        {report.diseaseIdentification.diseaseDetected ? "रोग का पता चला" : "कोई रोग नहीं मिला"}
                    </Badge>
                </p>
                {report.diseaseIdentification.diseaseDetected && (
                    <>
                        <div>
                            <h5 className="font-semibold">संभावित रोग:</h5>
                            <ul className="list-disc pl-5">
                                {report.diseaseIdentification.likelyDiseases.map((disease, i) => (
                                    <li key={i}>{disease} (विश्वास: {(report.diseaseIdentification.confidenceLevels[i] * 100).toFixed(0)}%)</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h5 className="font-semibold">सिफारिशें:</h5>
                            <p>{report.recommendations}</p>
                        </div>
                    </>
                )}
            </div>
        );
    case 'weather-report':
        const weather = message.content as WeatherAndSoilAdviceOutput;
        return(
            <div className="space-y-3">
                <h4 className="font-bold">मौसम और मिट्टी की सलाह</h4>
                <div>
                    <h5 className="font-semibold">मौसम पूर्वानुमान:</h5>
                    <p>{weather.weatherForecast}</p>
                </div>
                <div>
                    <h5 className="font-semibold">मिट्टी की सलाह:</h5>
                    <p>{weather.soilAdvice}</p>
                </div>
            </div>
        )
    default:
      return null;
  }
};

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  const handlePlayVoice = () => {
    if ('speechSynthesis' in window && typeof message.content === 'string') {
      const utterance = new SpeechSynthesisUtterance(message.content);
      utterance.lang = 'hi-IN';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className={`flex items-start gap-4 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <Avatar className="w-10 h-10 border-2 border-primary">
          <AvatarFallback>
            <Bot />
          </AvatarFallback>
        </Avatar>
      )}
      <div className={`max-w-[75%] rounded-lg p-4 ${isUser ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
        <div className="flex items-center gap-2 mb-1">
          <p className="font-bold">{isUser ? 'आप' : 'सहायक'}</p>
          {isUser && message.isVoice && (
            <Button variant="ghost" size="icon" className="w-6 h-6 text-primary-foreground" onClick={handlePlayVoice}>
              <Volume2 className="w-4 h-4" />
            </Button>
          )}
        </div>
        {renderContent(message)}
      </div>
      {isUser && (
        <Avatar className="w-10 h-10 border-2 border-muted">
          <AvatarFallback>
            <User />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

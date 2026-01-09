"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MessageCircle,
  X,
  Minimize2,
  FolderTree,
  ShoppingCart,
  Receipt,
  FileText,
  BarChart3,
  Upload,
  Download,
  Package,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  type: "bot" | "user";
  translationKey: string;
  timestamp: Date;
}

interface Feature {
  id: string;
  icon: React.ReactNode;
  nameKey: string;
  descriptionKey: string;
  responseKey: string;
}

export function ChatWidget() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "bot",
      translationKey: "common.support.greeting",
      timestamp: new Date(),
    },
  ]);

  const features: Feature[] = [
    {
      id: "categories",
      icon: <FolderTree className="h-4 w-4" />,
      nameKey: "common.support.features.categories.name",
      descriptionKey: "common.support.features.categories.description",
      responseKey: "common.support.features.categories.response",
    },
    {
      id: "products",
      icon: <Package className="h-4 w-4" />,
      nameKey: "common.support.features.products.name",
      descriptionKey: "common.support.features.products.description",
      responseKey: "common.support.features.products.response",
    },
    {
      id: "quickSell",
      icon: <ShoppingCart className="h-4 w-4" />,
      nameKey: "common.support.features.quickSell.name",
      descriptionKey: "common.support.features.quickSell.description",
      responseKey: "common.support.features.quickSell.response",
    },
    {
      id: "services",
      icon: <Wrench className="h-4 w-4" />,
      nameKey: "common.support.features.services.name",
      descriptionKey: "common.support.features.services.description",
      responseKey: "common.support.features.services.response",
    },
    {
      id: "expenses",
      icon: <Receipt className="h-4 w-4" />,
      nameKey: "common.support.features.expenses.name",
      descriptionKey: "common.support.features.expenses.description",
      responseKey: "common.support.features.expenses.response",
    },
    {
      id: "debits",
      icon: <FileText className="h-4 w-4" />,
      nameKey: "common.support.features.debits.name",
      descriptionKey: "common.support.features.debits.description",
      responseKey: "common.support.features.debits.response",
    },
    {
      id: "analytics",
      icon: <BarChart3 className="h-4 w-4" />,
      nameKey: "common.support.features.analytics.name",
      descriptionKey: "common.support.features.analytics.description",
      responseKey: "common.support.features.analytics.response",
    },
    {
      id: "importExport",
      icon: (
        <div className="flex items-center gap-1">
          <Upload className="h-3 w-3" />
          <Download className="h-3 w-3" />
        </div>
      ),
      nameKey: "common.support.features.importExport.name",
      descriptionKey: "common.support.features.importExport.description",
      responseKey: "common.support.features.importExport.response",
    },
  ];

  const handleFeatureClick = (feature: Feature) => {
    // Add user message immediately
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: "user",
      translationKey: feature.nameKey,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Show thinking animation
    setIsThinking(true);

    // Add bot response after a delay (simulating thinking time)
    setTimeout(() => {
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        type: "bot",
        translationKey: feature.responseKey,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsThinking(false);
    }, 1500); // 1.5 second delay to show thinking animation
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsThinking(false);
    // Reset messages to initial greeting when closing
    setMessages([
      {
        id: "1",
        type: "bot",
        translationKey: "common.support.greeting",
        timestamp: new Date(),
      },
    ]);
  };

  const handleMinimize = () => {
    // Close chat and reset to beginning
    setIsOpen(false);
    setIsThinking(false);
    // Reset messages to initial greeting
    setMessages([
      {
        id: "1",
        type: "bot",
        translationKey: "common.support.greeting",
        timestamp: new Date(),
      },
    ]);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleOpen}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          aria-label={t("common.support.openChat")}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[90vw] max-w-md">
      <Card
        className="flex flex-col shadow-2xl transition-all duration-300 overflow-hidden h-[600px]"
      >
        <CardHeader className="flex flex-row items-center justify-between border-b pb-3 pt-4 transition-all duration-300 shrink-0">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">
              {t("common.support.title")}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleMinimize}
              className="h-8 w-8"
              aria-label={t("common.support.minimize")}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
              aria-label={t("common.support.close")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Messages */}
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex animate-in fade-in slide-in-from-bottom-2 duration-300",
                      message.type === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-4 py-2 text-sm",
                        message.type === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {t(message.translationKey)}
                    </div>
                  </div>
                ))}
                
                {/* Thinking Animation */}
                {isThinking && (
                  <div className="flex justify-start animate-in fade-in duration-200">
                    <div className="bg-muted text-muted-foreground rounded-lg px-4 py-3 text-sm">
                      <div className="flex items-center gap-1.5">
                        <span 
                          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: '0ms' }}
                        ></span>
                        <span 
                          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: '150ms' }}
                        ></span>
                        <span 
                          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: '300ms' }}
                        ></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Feature Options */}
              {messages.length <= 1 && (
                <div className="mt-6 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground mb-3">
                    {t("common.support.selectFeature")}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {features.map((feature) => (
                      <Button
                        key={feature.id}
                        variant="outline"
                        className="h-auto flex-col items-start justify-start gap-2 p-3 text-left hover:bg-accent"
                        onClick={() => handleFeatureClick(feature)}
                      >
                        <div className="flex items-center gap-2 w-full">
                          {feature.icon}
                          <span className="text-xs font-medium">
                            {t(feature.nameKey)}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground line-clamp-2">
                          {t(feature.descriptionKey)}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Show feature options again after a response */}
              {messages.length > 1 && (
                <div className="mt-4 space-y-2 border-t pt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-3">
                    {t("common.support.askAnother")}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {features.map((feature) => (
                      <Button
                        key={feature.id}
                        variant="outline"
                        size="sm"
                        className="h-auto flex-col items-start justify-start gap-1 p-2 text-left hover:bg-accent"
                        onClick={() => handleFeatureClick(feature)}
                      >
                        <div className="flex items-center gap-1.5 w-full">
                          {feature.icon}
                          <span className="text-xs font-medium">
                            {t(feature.nameKey)}
                          </span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
      </Card>
    </div>
  );
}


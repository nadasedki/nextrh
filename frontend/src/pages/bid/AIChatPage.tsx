import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User, Sparkles, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const suggestedQueries = [
  
  "Trouve-moi un ingénieur sécurité réseaux",
];

const AIChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll vers le bas à chaque nouveau message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (query: string) => {
    if (!query.trim()) return;

    const userMsg: ChatMessage = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: query, 
      timestamp: new Date().toISOString() 
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/rag/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: query }),
      });

      if (!response.ok) throw new Error('Erreur serveur');

      const data = await response.json();

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMsg]);

    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Désolé, je ne parviens pas à joindre le moteur d'IA. Vérifiez que Qdrant et Ollama sont actifs.",
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assistant RH Intelligent</h1>
          <p className="text-muted-foreground text-sm">Interrogez votre base de connaissances en langage naturel</p>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClearChat} className="text-destructive border-destructive/20 hover:bg-destructive/10">
            <Trash2 className="h-4 w-4 mr-2" />
            Effacer la conversation
          </Button>
        )}
      </div>

      {/* Main Chat Container - Largeur max augmentée */}
      <Card className="flex-1 flex flex-col overflow-hidden shadow-2xl border-primary/10 rounded-2xl bg-card">
        <CardHeader className="border-b bg-muted/20 px-6 py-4">
          <CardTitle className="flex items-center gap-2 text-md font-semibold text-primary">
            <Sparkles className="h-5 w-5" />
            Moteur de Recherche Sémantique
          </CardTitle>
        </CardHeader>

        {/* Message Area */}
        <CardContent 
          ref={scrollRef}
          className="flex-1 p-6 space-y-6 overflow-y-auto bg-background/30"
        >
          {messages.length === 0 && (
            <div className="text-center py-20 max-w-lg mx-auto space-y-6">
              <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto animate-bounce">
                <Bot className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Comment puis-je vous aider aujourd'hui ?</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Je peux analyser les compétences, projets et certifications de vos collaborateurs pour trouver le profil idéal.
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-4">
                {suggestedQueries.map((q, i) => (
                  <Button key={i} variant="outline" className="justify-start text-left text-sm py-5 hover:bg-primary/5 hover:text-primary transition-all duration-200" onClick={() => handleSend(q)}>
                    <Sparkles className="h-4 w-4 mr-2 text-primary shrink-0" />
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-4 items-start", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
              <Avatar className={cn("h-10 w-10 shrink-0 shadow-sm", msg.role === 'user' ? "border-2 border-primary/20" : "border-2 border-accent")}>
                <AvatarFallback className={msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'}>
                  {msg.role === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
              
              <div className={cn(
                "rounded-2xl p-5 shadow-sm leading-relaxed max-w-[80%]",
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-tr-none' 
                  : 'bg-muted text-foreground rounded-tl-none border border-muted-foreground/10'
              )}>
                {msg.role === 'user' ? (
                  <p className="text-sm font-medium">{msg.content}</p>
                ) : (
                  // Rendu Markdown pour les réponses de l'IA
                  <div className="text-sm space-y-2 select-text">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1 my-2" {...props} />,
                        li: ({ node, ...props }) => <li className="marker:text-primary" {...props} />,
                        strong: ({ node, ...props }) => <strong className="font-semibold text-primary dark:text-primary-foreground" {...props} />,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4">
              <Avatar className="h-10 w-10 border-2 border-accent">
                <AvatarFallback className="bg-accent text-accent-foreground"><Bot className="h-5 w-5" /></AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-2xl rounded-tl-none p-5 flex items-center gap-3 border border-muted-foreground/10">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground font-medium">L'IA parcourt la base vectorielle...</span>
              </div>
            </div>
          )}
        </CardContent>

        {/* Input Bar */}
        <div className="p-4 border-t bg-background">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="flex gap-2 max-w-5xl mx-auto">
            <Input 
              placeholder="Ex: Qui a travaillé sur le projet Ooredoo RNIA3 ?" 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              disabled={isLoading}
              className="py-6 px-4 text-sm shadow-inner focus-visible:ring-primary focus-visible:ring-2"
            />
            <Button type="submit" size="icon" className="h-12 w-12 rounded-full shadow-lg shrink-0" disabled={isLoading || !input.trim()}>
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default AIChatPage;
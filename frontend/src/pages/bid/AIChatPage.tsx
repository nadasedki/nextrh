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

// Realistic enterprise suggested queries
const suggestedQueries = [
  "Find a network security engineer with active certifications",
  "Who has experience with cloud architecture and microservices?",
  "Show me team members with telecom or banking project experience",
];

const AIChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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

      if (!response.ok) throw new Error('Service unavailable');

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
        content: "We're currently unable to connect to the talent search service. Please verify your connection or try again shortly.",
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
          <h1 className="text-2xl font-bold tracking-tight">Talent Search Copilot</h1>
          <p className="text-muted-foreground text-sm">
            Find qualified team members, expertise, and project experience instantly
          </p>
        </div>
        {messages.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearChat} 
            className="text-muted-foreground hover:text-destructive border-border hover:border-destructive/30"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Chat
          </Button>
        )}
      </div>

      {/* Main Container */}
      <Card className="flex-1 flex flex-col overflow-hidden shadow-xl border-border/80 rounded-2xl bg-card">
        <CardHeader className="border-b bg-muted/30 px-6 py-3.5">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Sparkles className="h-4 w-4" />
            Talent Intelligence Assistant
          </CardTitle>
        </CardHeader>

        {/* Message Area */}
        <CardContent 
          ref={scrollRef}
          className="flex-1 p-6 space-y-6 overflow-y-auto bg-background/40"
        >
          {messages.length === 0 && (
            <div className="text-center py-16 max-w-xl mx-auto space-y-6">
              <div className="p-4 bg-primary/10 rounded-2xl w-fit mx-auto shadow-sm">
                <Bot className="h-9 w-9 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                  Find the right talent for your next project
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Describe the required skills, certifications, or past project experience to discover matching profiles across your organization.
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2 text-left">
                {suggestedQueries.map((q, i) => (
                  <Button 
                    key={i} 
                    variant="outline" 
                    className="justify-start text-left text-xs sm:text-sm py-4 h-auto hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-all duration-150" 
                    onClick={() => handleSend(q)}
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-2.5 text-primary shrink-0" />
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-3.5 items-start", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
              <Avatar className={cn("h-9 w-9 shrink-0 shadow-xs", msg.role === 'user' ? "border border-primary/30" : "border border-border")}>
                <AvatarFallback className={msg.role === 'user' ? 'bg-primary text-primary-foreground text-xs' : 'bg-muted text-foreground text-xs'}>
                  {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-primary" />}
                </AvatarFallback>
              </Avatar>
              
              <div className={cn(
                "rounded-2xl p-4 sm:p-5 shadow-xs leading-relaxed max-w-[82%]",
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-tr-none' 
                  : 'bg-muted/70 text-foreground rounded-tl-none border border-border/60'
              )}>
                {msg.role === 'user' ? (
                  <p className="text-sm font-medium">{msg.content}</p>
                ) : (
                  <div className="text-sm space-y-2.5 select-text">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1.5 my-2" {...props} />,
                        li: ({ node, ...props }) => <li className="marker:text-primary text-foreground/90" {...props} />,
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
            <div className="flex gap-3.5 items-start">
              <Avatar className="h-9 w-9 border border-border">
                <AvatarFallback className="bg-muted"><Bot className="h-4 w-4 text-primary" /></AvatarFallback>
              </Avatar>
              <div className="bg-muted/70 rounded-2xl rounded-tl-none p-4 flex items-center gap-3 border border-border/60">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                  Analyzing team profiles and matching skills...
                </span>
              </div>
            </div>
          )}
        </CardContent>

        {/* Input Bar */}
        <div className="p-4 border-t bg-card">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="flex gap-2 max-w-5xl mx-auto">
            <Input 
              placeholder="Ask anything (e.g. 'Find an engineer with Kubernetes and AWS experience who worked on telecom projects')..." 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              disabled={isLoading}
              className="py-5 px-4 text-sm shadow-xs focus-visible:ring-primary focus-visible:ring-1"
            />
            <Button type="submit" size="icon" className="h-11 w-11 rounded-xl shadow-md shrink-0" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default AIChatPage;
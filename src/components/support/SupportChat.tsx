import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Minimize2, Maximize2 } from 'lucide-react';
import { chatWithAIStream } from '@/src/services/aiService';
import { cn } from '@/src/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  isStreaming?: boolean;
}

interface SupportChatProps {
  externalOpen?: boolean;
  onClose?: () => void;
}

export default function SupportChat({ externalOpen, onClose }: SupportChatProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = externalOpen !== undefined && onClose ? (val: boolean) => !val && onClose() : setInternalOpen;
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: 'আসসালামু আলাইকুম! আমি glixbd AI। আপনাকে কীভাবে সাহায্য করতে পারি?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const botMessageId = (Date.now() + 1).toString();
    const botMessage: Message = {
      id: botMessageId,
      role: 'model',
      content: '',
      isStreaming: true
    };

    setMessages(prev => [...prev, botMessage]);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));
      history.push({ role: 'user', parts: [{ text: input }] });

      let fullResponse = '';
      for await (const chunk of chatWithAIStream(history)) {
        fullResponse += chunk;
        setMessages(prev => prev.map(m => 
          m.id === botMessageId ? { ...m, content: fullResponse } : m
        ));
      }
      
      setMessages(prev => prev.map(m => 
        m.id === botMessageId ? { ...m, isStreaming: false } : m
      ));
    } catch (err) {
      console.error(err);
      setMessages(prev => prev.map(m => 
        m.id === botMessageId ? { ...m, content: 'দুঃখিত, আমি এই মুহূর্তে উত্তর দিতে পারছি না। আবার চেষ্টা করুন।', isStreaming: false } : m
      ));
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Button - Only show if not controlled externally */}
      {externalOpen === undefined && (
        <button 
          onClick={() => setIsOpen(true)}
          className={cn(
            "fixed bottom-24 right-6 z-50 w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group",
            isOpen && "scale-0 invisible"
          )}
        >
          <MessageCircle size={32} />
          <span className="absolute right-full mr-4 bg-white text-primary px-4 py-2 rounded-2xl shadow-xl font-black text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            glixbd সাপোর্ট
          </span>
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed inset-x-4 bottom-24 lg:inset-auto lg:right-6 lg:bottom-10 z-[60] lg:w-[400px] h-[550px] bg-white rounded-[40px] shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary p-6 flex items-center justify-between text-white shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <Bot size={28} />
                </div>
                <div>
                  <h3 className="font-black text-lg">glixbd AI</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Online Support</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <Minimize2 size={20} />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide bg-gray-50/50">
              {messages.map((m) => (
                <div key={m.id} className={cn("flex w-full", m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={cn(
                    "max-w-[85%] rounded-3xl px-5 py-3.5 text-sm font-medium shadow-sm leading-relaxed",
                    m.role === 'user' 
                      ? 'bg-primary text-white rounded-tr-sm shadow-primary/10' 
                      : 'bg-white text-text-main rounded-tl-sm border border-gray-100'
                  )}>
                    {m.content}
                    {m.isStreaming && (
                      <span className="inline-block w-1.5 h-4 bg-primary/30 animate-pulse ml-1 align-middle" />
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-6 bg-white border-t border-gray-50 flex gap-3">
              <input 
                type="text" 
                placeholder="কিছু লিখুন..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-gray-50 border-2 border-transparent focus:border-primary px-6 py-4 rounded-2xl font-bold outline-none transition-all placeholder:text-gray-400"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isTyping}
                className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 active:scale-90 transition-all disabled:opacity-50"
              >
                <Send size={24} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

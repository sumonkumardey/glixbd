import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, ShoppingCart, User, Heart, Bell, Menu, X, Truck, MessageCircle, Mic, MicOff, Camera, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, getBangladeshDateTime } from '@/src/lib/utils';
import { auth, db } from '@/src/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import SupportChat from '../support/SupportChat';
import NotificationCenter from './NotificationCenter';
import Logo from '../Logo';
import { ensureUserDocument, isProfileComplete } from '@/src/services/userService';
import { toast } from 'react-hot-toast';
import { analyzeImageForSearch } from '@/src/services/aiService';
import { initializeForegroundMessaging } from '@/src/services/pushNotificationService';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSupportChatOpen, setSupportChatOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [dateTime, setDateTime] = useState(getBangladeshDateTime());
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    initializeForegroundMessaging();
  }, []);

  useEffect(() => {
    // Capture referral code from URL
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      localStorage.setItem('referredBy', refCode);
      // Clean up URL without reload
      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }

    let profileUnsub: () => void = () => {};

    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        ensureUserDocument(user);
        
        // Check if profile is complete
        const complete = await isProfileComplete(user.uid);
        if (!complete && location.pathname !== '/complete-profile') {
          navigate('/complete-profile');
        }

        // Listen to real-time profile updates
        profileUnsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setUserProfile(data);
            
            // Re-check completion if data updates
            if (!data.phone && location.pathname !== '/complete-profile') {
              navigate('/complete-profile');
            }
          }
        });
      } else {
        setUserProfile(null);
        profileUnsub();
      }
    });

    const timer = setInterval(() => {
      setDateTime(getBangladeshDateTime());
    }, 1000);

    return () => {
      unsub();
      profileUnsub();
      clearInterval(timer);
    };
  }, [location.pathname, navigate]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error('আপনার ব্রাউজার ভয়েস সার্চ সাপোর্ট করে না।');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'bn-BD';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      toast('শুনছি... আপনার পছন্দের প্রোডাক্টটির নাম বলুন।', { icon: '🎙️' });
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setHeaderSearch(transcript);
      setIsListening(false);
      navigate(`/search?q=${encodeURIComponent(transcript)}`);
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      toast.error('ভয়েস কমান্ড বুঝতে পারিনি। আবার চেষ্টা করুন।');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleImageSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzingImage(true);
    toast('ছবি এনালাইজ করছি...', { icon: '🔍' });

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });
      const base64 = await base64Promise;
      const keywords = await analyzeImageForSearch(base64, file.type);
      
      if (keywords) {
        setHeaderSearch(keywords);
        navigate(`/search?q=${encodeURIComponent(keywords)}`);
        toast.success(`রেজাল্ট পাওয়া গেছে: ${keywords}`);
      } else {
        toast.error('ছবি থেকে কিছু খুঁজে পাইনি');
      }
    } catch (err) {
      console.error(err);
      toast.error('ভুল হয়েছে');
    } finally {
      setAnalyzingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (headerSearch.trim()) {
      navigate(`/search?q=${encodeURIComponent(headerSearch)}`);
    }
  };

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  // Check if we are on a product detail page or complete profile page to hide sidebar/nav
  const isProductPage = location.pathname.startsWith('/product/');
  const isCompleteProfilePage = location.pathname === '/complete-profile';

  if (isProductPage || isCompleteProfilePage) {
    return (
      <div className="min-h-screen bg-white">
        <main className="w-full font-bengali">
          {children}
        </main>
        {!isCompleteProfilePage && <SupportChat />}
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background font-bengali">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-100 flex-col sticky top-0 h-screen">
        <div className="p-6">
          <Logo onClick={() => navigate('/')} className="cursor-pointer" size="lg" />
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <SidebarItem to="/" icon={<Home size={20} />} label="হোম" />
          <SidebarItem to="/search" icon={<Search size={20} />} label="খুঁজুন" />
          <SidebarItem to="/wishlist" icon={<Heart size={20} />} label="পছন্দের তালিকা" />
          <SidebarItem to="/cart" icon={<ShoppingCart size={20} />} label="শপিং কার্ট" />
          <SidebarItem to="/tracking" icon={<Truck size={20} />} label="অর্ডার ট্র্যাকিং" />
          <SidebarItem to="/profile" icon={<User size={20} />} label="প্রোফাইল" />
        </nav>

        {currentUser && (
          <NavLink to="/profile" className="p-6 border-t border-gray-50 flex items-center gap-3 hover:bg-gray-50 transition-colors group">
            <div className="w-10 h-10 rounded-full border-2 border-primary/10 overflow-hidden shrink-0">
              <img src={userProfile?.photoURL || currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.displayName}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="Profile" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{userProfile?.name || currentUser.displayName}</p>
              <p className="text-[10px] text-text-muted truncate">সক্রিয় ইউজার</p>
            </div>
          </NavLink>
        )}

        <div className="p-6 bg-gray-50/50 mt-auto">
          <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">বাংলাদেশ সময়</p>
          <p className="text-xs font-bold text-primary">{dateTime.time}</p>
          <p className="text-[10px] text-text-muted mt-1">{dateTime.bangla}</p>
          <p className="text-[8px] text-text-muted opacity-50 mt-1">{dateTime.english}</p>
        </div>
      </aside>

      {/* Mobile Header / Top Bar */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className="sticky top-0 z-40 bg-white border-b border-gray-50 shadow-sm px-4 lg:px-8 h-16 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-text-muted hover:text-primary transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="lg:hidden flex flex-col">
              <Logo size="sm" onClick={() => navigate('/')} />
              <p className="text-[8px] font-bold text-text-muted ml-0.5">{dateTime.time} | {dateTime.bangla.split(',')[0]}</p>
            </div>
          </div>
            
            {/* Desktop Clock & Search */}
            <div className="hidden lg:flex items-center gap-6 overflow-hidden">
              <div className="flex flex-col border-r border-gray-100 pr-6">
                <p className="text-[10px] font-black text-primary uppercase tracking-wider">{dateTime.time}</p>
                <p className="text-[9px] font-bold text-text-muted whitespace-nowrap">{dateTime.bangla}</p>
              </div>
              <form onSubmit={handleHeaderSearch} className="flex items-center bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 w-64 group focus-within:border-primary/30 transition-all">
                <Search size={16} className="text-text-muted group-focus-within:text-primary" />
                <input 
                  type="text" 
                  value={headerSearch}
                  onChange={(e) => setHeaderSearch(e.target.value)}
                  placeholder="পণ্য খুঁজুন..." 
                  className="bg-transparent border-none outline-none ml-2 text-sm w-full" 
                />
                <div className="flex items-center gap-1.5 border-l border-gray-200 ml-2 pl-2">
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleImageSearch}
                    accept="image/*"
                    className="hidden"
                  />
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={analyzingImage}
                    className="text-text-muted hover:text-primary transition-colors"
                  >
                    {analyzingImage ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                  </button>
                  <button 
                    type="button" 
                    onClick={startVoiceSearch}
                    className={cn(
                      "p-1 rounded-full transition-all duration-300 relative overflow-hidden",
                      isListening ? "text-red-500" : "text-text-muted hover:text-primary"
                    )}
                  >
                    {isListening && (
                      <motion.div 
                        layoutId="header-listening-ripple"
                        initial={{ scale: 0.8, opacity: 0.5 }}
                        animate={{ scale: 3, opacity: 0 }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="absolute inset-0 bg-red-100 rounded-full"
                      />
                    )}
                    <div className="relative z-10">
                      {isListening ? <MicOff size={16} className="animate-pulse" /> : <Mic size={16} />}
                    </div>
                  </button>
                </div>
              </form>
            </div>
            
            <div className="flex items-center gap-2 lg:gap-4">
            <NotificationCenter />
            <NavLink to="/tracking" className="p-2 text-text-muted hover:text-primary transition-colors relative hidden sm:block" title="অর্ডার ট্র্যাকিং">
              <Truck size={22} />
            </NavLink>
            <NavLink to="/wishlist" className="p-2 text-text-muted hover:text-primary transition-colors relative hidden sm:block">
              <Heart size={22} />
            </NavLink>
            <NavLink to="/cart" className="p-2 text-text-muted hover:text-primary transition-colors relative">
              <ShoppingCart size={22} />
              <span className="absolute top-1 right-1 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-lg shadow-primary/20">0</span>
            </NavLink>
            <NavLink to="/profile" className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 overflow-hidden lg:ml-2 block group shrink-0">
              <img src={userProfile?.photoURL || currentUser?.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="User" />
            </NavLink>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 pb-20 lg:pb-8 p-4 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      <SupportChat externalOpen={isSupportChatOpen} onClose={() => setSupportChatOpen(false)} />

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 w-[280px] bg-white z-[101] shadow-2xl flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-gray-50">
                <Logo size="md" onClick={() => { setSidebarOpen(false); navigate('/'); }} />
                <button onClick={() => setSidebarOpen(false)} className="p-2 text-text-muted hover:bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-2">
                <SidebarItem to="/" icon={<Home size={20} />} label="হোম" />
                <SidebarItem to="/search" icon={<Search size={20} />} label="খুঁজুন" />
                <SidebarItem to="/wishlist" icon={<Heart size={20} />} label="পছন্দের তালিকা" />
                <SidebarItem to="/cart" icon={<ShoppingCart size={20} />} label="শপিং কার্ট" />
                <SidebarItem to="/tracking" icon={<Truck size={20} />} label="অর্ডার ট্র্যাকিং" />
                <SidebarItem to="/profile" icon={<User size={20} />} label="প্রোফাইল" />
              </nav>

              <div className="p-8 bg-gray-50/50 mt-auto border-t border-gray-100">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">বাংলাদেশ সময়</p>
                <p className="text-sm font-bold text-primary">{dateTime.time}</p>
                <p className="text-[10px] text-text-muted mt-1 font-bold">{dateTime.bangla}</p>
                <p className="text-[9px] text-text-muted opacity-60 mt-1">{dateTime.english}</p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Nav (Visible only on small screens) */}
      <nav className="fixed lg:hidden bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-lg border-t border-gray-100 px-6 h-16 flex items-center justify-between">
        <NavItem to="/" icon={<Home size={24} />} label="হোম" />
        <NavItem to="/search" icon={<Search size={24} />} label="খুঁজুন" />
        <NavItem to="/wishlist" icon={<Heart size={24} />} label="পছন্দ" />
        
        {/* AI Support Button in place of Notifications */}
        <button 
          onClick={() => setSupportChatOpen(true)}
          className={cn(
            "flex flex-col items-center gap-1 transition-all duration-300 relative",
            isSupportChatOpen ? "text-primary scale-110" : "text-text-muted opacity-80"
          )}
        >
          {isSupportChatOpen && (
            <motion.div 
              layoutId="nav-bg"
              className="absolute -top-1 w-10 h-10 bg-primary/10 rounded-full -z-10"
            />
          )}
          <MessageCircle size={24} className={isSupportChatOpen ? "animate-bounce" : ""} />
          <span className="text-[10px] font-bold">AI সাপোর্ট</span>
        </button>

        <NavItem to="/tracking" icon={<Truck size={24} />} label="ট্র্যাকিং" />
        <NavItem to="/profile" icon={<User size={24} />} label="প্রোফাইল" />
      </nav>
    </div>
  );
}

function SidebarItem({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
        isActive ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-text-muted hover:bg-gray-50 hover:text-text-main"
      )}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </NavLink>
  );
}

function NavItem({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => cn(
        "flex flex-col items-center gap-1 transition-all duration-300 relative",
        isActive ? "text-primary scale-110" : "text-text-muted opacity-80"
      )}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div 
              layoutId="nav-bg"
              className="absolute -top-1 w-10 h-10 bg-primary/10 rounded-full -z-10"
            />
          )}
          {icon}
          <span className="text-[10px] font-bold">{label}</span>
        </>
      )}
    </NavLink>
  );
}

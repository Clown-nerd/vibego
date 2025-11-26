import React, { useState, useEffect } from 'react';
import { UserPreferences, Coordinates, Venue, DateRange, CategoryFilter, Mood, GroupType } from './types';
import { getCurrentLocation } from './services/locationService';
import { getVibeRecommendations } from './services/geminiService';
import { PLACEHOLDER_COORDS } from './constants';
import { MOOD_IMAGES, CATEGORY_IMAGES } from './assets';
import Onboarding from './components/Onboarding';
import VenueCard from './components/VenueCard';
import TopBar from './components/TopBar';
import FilterBar from './components/FilterBar';
import Button from './components/Button';

// Dynamic Background Component
const DynamicBackground: React.FC<{ mood?: string; category?: string }> = ({ mood, category }) => {
  const [imageSrc, setImageSrc] = useState(MOOD_IMAGES['Default']);
  const [nextImageSrc, setNextImageSrc] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    let targetImage = MOOD_IMAGES['Default'];

    // Priority 1: Specific Category Filter (if selected and not All)
    if (category && category !== 'All' && CATEGORY_IMAGES[category]) {
      targetImage = CATEGORY_IMAGES[category];
    } 
    // Priority 2: Mood
    else if (mood && MOOD_IMAGES[mood]) {
      targetImage = MOOD_IMAGES[mood];
    }

    if (targetImage !== imageSrc) {
      // Preload image to prevent flicker
      const img = new Image();
      img.src = targetImage;
      img.onload = () => {
        setNextImageSrc(targetImage);
        setIsTransitioning(true);
      };
    }
  }, [mood, category, imageSrc]);

  useEffect(() => {
    if (isTransitioning && nextImageSrc) {
      const timer = setTimeout(() => {
        setImageSrc(nextImageSrc);
        setIsTransitioning(false);
        setNextImageSrc(null);
      }, 700); // Match CSS duration
      return () => clearTimeout(timer);
    }
  }, [isTransitioning, nextImageSrc]);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-vibe-dark">
      {/* Current Image Layer */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out scale-105"
        style={{ backgroundImage: `url(${imageSrc})` }}
      />

      {/* Next Image Layer (Fade In) */}
      <div 
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-in-out scale-105 ${isTransitioning ? 'opacity-100' : 'opacity-0'}`}
        style={{ backgroundImage: `url(${nextImageSrc || imageSrc})` }}
      />
      
      {/* Gradient Overlay - Optimized for Vibrancy */}
      {/* Light at top to show image, dark at bottom for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-vibe-dark/80 to-vibe-dark" />
      
      {/* Atmospheric Glows */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-purple-900/20 to-transparent mix-blend-overlay" />
    </div>
  );
};

const App: React.FC = () => {
  const [onboarded, setOnboarded] = useState(false);
  const [showWizard, setShowWizard] = useState(false); // New state to toggle Wizard vs Landing
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [userPrefs, setUserPrefs] = useState<UserPreferences | null>(null);
  
  // Filter State
  const [dateFilter, setDateFilter] = useState<DateRange>('Today');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All');
  
  // PWA Install State
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    // Attempt to get location on mount silently
    getCurrentLocation()
      .then(loc => setLocation(loc))
      .catch(err => {
        console.warn("Location denied or error, using placeholder", err);
        setLocation(PLACEHOLDER_COORDS);
      });

    // PWA Install Event Listener
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      setInstallPrompt(null);
    });
  };

  const handleOnboardingComplete = async (prefs: UserPreferences) => {
    setUserPrefs(prefs);
    setOnboarded(true);
    // Initial fetch with defaults
    await fetchRecommendations(prefs, dateFilter, categoryFilter);
  };

  const handleNearMe = () => {
    // Skip onboarding with generic "Social" preferences
    const genericPrefs: UserPreferences = {
      mood: Mood.SOCIAL,
      groupType: GroupType.FRIENDS,
      budget: 50,
      activities: ['Food', 'Nightlife']
    };
    handleOnboardingComplete(genericPrefs);
  };

  const handleTrendingClick = (category: string) => {
    // Skip onboarding focusing on specific category
    const trendingPrefs: UserPreferences = {
      mood: Mood.ENERGETIC,
      groupType: GroupType.FRIENDS,
      budget: 100,
      activities: [category]
    };
    setCategoryFilter(category as CategoryFilter);
    handleOnboardingComplete(trendingPrefs);
  };

  const fetchRecommendations = async (
    prefs: UserPreferences, 
    date: DateRange, 
    cat: CategoryFilter
  ) => {
    setLoading(true);
    setError(null);
    try {
      const loc = location || PLACEHOLDER_COORDS;
      const results = await getVibeRecommendations(prefs, loc, date, cat);
      setVenues(results);
    } catch (err) {
      console.error(err);
      setError("Failed to generate vibe. Please check your connection or API key.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = async (newDate: DateRange, newCat: CategoryFilter) => {
    setDateFilter(newDate);
    setCategoryFilter(newCat);
    if (userPrefs) {
      await fetchRecommendations(userPrefs, newDate, newCat);
    }
  };

  const handleReset = () => {
    setOnboarded(false);
    setShowWizard(false);
    setVenues([]);
    setUserPrefs(null);
    setDateFilter('Today');
    setCategoryFilter('All');
  };

  // Trending Categories Configuration
  const TRENDING_ITEMS = [
    { label: 'Music', category: 'Live Music', image: CATEGORY_IMAGES['Live Music'] },
    { label: 'Outdoors', category: 'Nature', image: CATEGORY_IMAGES['Nature'] },
    { label: 'Nightlife', category: 'Party', image: CATEGORY_IMAGES['Party'] },
    { label: 'Arts', category: 'Art', image: CATEGORY_IMAGES['Art'] },
  ];

  return (
    <div className="min-h-screen text-slate-100 font-sans selection:bg-pink-500 selection:text-white">
      <DynamicBackground mood={userPrefs?.mood} category={categoryFilter} />
      
      {!onboarded ? (
        <div className="relative z-10 flex flex-col min-h-screen backdrop-blur-[2px]">
           {/* Install button for landing screen */}
           {installPrompt && (
              <div className="absolute top-4 right-4 z-50">
                <Button variant="ghost" onClick={handleInstallClick} className="text-xs !px-3 !py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full">
                  <ion-icon name="download" className="mr-1"></ion-icon> Install
                </Button>
              </div>
           )}

           {showWizard ? (
             <div className="flex-1 flex flex-col justify-center animate-fade-in-up">
               <div className="absolute top-4 left-4 z-50">
                  <Button variant="ghost" onClick={() => setShowWizard(false)} className="text-white/70 hover:text-white">
                    <ion-icon name="arrow-back" className="mr-2"></ion-icon> Back
                  </Button>
               </div>
               <Onboarding onComplete={handleOnboardingComplete} />
             </div>
           ) : (
             <div className="flex-1 flex flex-col pt-16 pb-8 px-6">
               {/* Hero Section */}
               <div className="text-center mb-10 animate-fade-in-down">
                  <div className="inline-flex items-center justify-center gap-2 mb-4">
                    <ion-icon name="sparkles" className="text-3xl text-purple-400 animate-pulse-slow"></ion-icon>
                    <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-200 via-pink-200 to-amber-200 tracking-tighter">
                      VibeGo
                    </h1>
                  </div>
                  <p className="text-xl text-slate-200 font-medium max-w-xs mx-auto leading-relaxed text-balance drop-shadow-lg">
                    Discover concerts, events, and experiences that match your vibe
                  </p>
               </div>

               {/* Primary Actions */}
               <div className="flex flex-col gap-4 max-w-sm mx-auto w-full mb-16 animate-fade-in">
                 <Button 
                   onClick={() => setShowWizard(true)} 
                   className="rounded-2xl h-14 text-lg shadow-xl shadow-purple-500/20"
                 >
                   <ion-icon name="sparkles-outline" className="mr-2"></ion-icon>
                   Find My Vibe
                 </Button>
                 
                 <Button 
                   variant="secondary"
                   onClick={handleNearMe}
                   className="rounded-2xl h-14 text-lg border border-white/10 bg-black/40 hover:bg-black/60"
                 >
                   <ion-icon name="location-outline" className="mr-2"></ion-icon>
                   Near Me
                 </Button>
               </div>

               {/* Trending Section */}
               <div className="mt-auto animate-fade-in-up delay-200">
                 <div className="flex items-center justify-between mb-4 px-2">
                   <h2 className="text-2xl font-bold text-white tracking-tight">Trending Now</h2>
                   <span className="text-xs font-medium text-slate-400">Experiences awaiting you</span>
                 </div>
                 
                 {/* 
                    Mobile: Vertical Stack (grid-cols-1)
                    Desktop/Tablet (md): Horizontal Scroll (flex)
                 */}
                 <div className="grid grid-cols-1 gap-4 pb-6 md:flex md:overflow-x-auto md:no-scrollbar md:-mx-6 md:px-6 md:snap-x md:snap-mandatory">
                   {TRENDING_ITEMS.map((item) => (
                     <button
                       key={item.label}
                       onClick={() => handleTrendingClick(item.category)}
                       className="relative w-full h-32 md:flex-none md:w-40 md:h-48 rounded-3xl overflow-hidden group snap-center shadow-lg transition-transform hover:scale-105 active:scale-95"
                     >
                       <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url(${item.image})` }} />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                       <div className="absolute bottom-4 left-4 text-left">
                         <span className="inline-block px-2 py-1 rounded-lg bg-white/20 backdrop-blur-md border border-white/20 text-[10px] font-bold uppercase tracking-wider mb-1">
                           {item.label}
                         </span>
                       </div>
                     </button>
                   ))}
                 </div>
               </div>
             </div>
           )}
        </div>
      ) : (
        <div className="relative z-10 flex flex-col min-h-screen pb-24">
          <TopBar 
            onReset={handleReset} 
            showInstallButton={!!installPrompt}
            onInstall={handleInstallClick}
          />
          
          <div className="max-w-xl mx-auto w-full p-4 flex-1">
            {/* Filters */}
            <div className="mb-6 sticky top-[72px] z-20 -mx-4 px-4 py-2 backdrop-blur-xl bg-vibe-dark/30 border-b border-white/5 shadow-lg shadow-black/20">
               <FilterBar 
                 activeDate={dateFilter}
                 activeCategory={categoryFilter}
                 onDateChange={(d) => handleFilterChange(d, categoryFilter)}
                 onCategoryChange={(c) => handleFilterChange(dateFilter, c)}
                 disabled={loading}
               />
            </div>

            {/* Header Status */}
            <div className="mb-6 flex items-end justify-between px-2">
              <div>
                <h2 className="text-3xl font-bold text-white tracking-tight">Top Picks</h2>
                <p className="text-sm text-pink-200/80 font-medium mt-1 flex items-center gap-1">
                   <ion-icon name="location-outline"></ion-icon> {location ? 'Near You' : 'Default Loc'} • {userPrefs?.mood} Vibe
                </p>
              </div>
              <Button 
                variant="ghost" 
                onClick={() => userPrefs && fetchRecommendations(userPrefs, dateFilter, categoryFilter)}
                disabled={loading}
                className="!p-3 rounded-full hover:bg-white/10"
              >
                <ion-icon name="refresh" className={`text-xl ${loading ? 'animate-spin' : ''}`}></ion-icon>
              </Button>
            </div>

            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/5 h-64 rounded-3xl animate-pulse shadow-lg" />
                ))}
              </div>
            ) : error ? (
              <div className="p-8 bg-red-500/10 border border-red-500/20 backdrop-blur-md rounded-3xl text-center">
                <ion-icon name="alert-circle" className="text-4xl text-red-400 mb-2"></ion-icon>
                <p className="text-red-200 mb-6 font-medium">{error}</p>
                <Button onClick={() => userPrefs && fetchRecommendations(userPrefs, dateFilter, categoryFilter)}>Try Again</Button>
              </div>
            ) : venues.length === 0 ? (
              <div className="text-center py-24 opacity-60">
                <div className="bg-white/5 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ion-icon name="telescope-outline" className="text-4xl text-purple-300"></ion-icon>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No vibes found</h3>
                <p className="text-slate-300">Adjust your filters to find more events.</p>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in-up">
                {venues.map((venue, idx) => (
                  <div key={venue.id} style={{ animationDelay: `${idx * 100}ms` }} className="animate-fade-in-up">
                    <VenueCard 
                      venue={venue} 
                      userLocation={location || PLACEHOLDER_COORDS} 
                    />
                  </div>
                ))}
                
                <div className="text-center mt-12 mb-8">
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">
                    Powered by Gemini AI • Real-time Data
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
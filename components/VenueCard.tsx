import React, { useState } from 'react';
import { Venue, Coordinates } from '../types';
import Button from './Button';

interface VenueCardProps {
  venue: Venue;
  userLocation: Coordinates;
}

const VenueCard: React.FC<VenueCardProps> = ({ venue, userLocation }) => {
  const [showRideModal, setShowRideModal] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [shareLabel, setShareLabel] = useState('Share');

  const handleBookRide = () => {
    setShowRideModal(true);
  };

  const openUber = () => {
    const nickname = encodeURIComponent(venue.name);
    const address = encodeURIComponent(venue.address || '');
    let url = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${address}&dropoff[nickname]=${nickname}`;
    if (venue.coordinates) {
      url += `&dropoff[latitude]=${venue.coordinates.latitude}&dropoff[longitude]=${venue.coordinates.longitude}`;
    }
    window.location.href = url;
    setShowRideModal(false);
  };

  const openBolt = () => {
    if (venue.coordinates) {
      const name = encodeURIComponent(venue.name);
      window.location.href = `bolt://ride?action=setPickup&pickup=my_location&destination_lat=${venue.coordinates.latitude}&destination_lng=${venue.coordinates.longitude}&destination_name=${name}`;
    } else {
      window.location.href = 'bolt://';
    }
    setShowRideModal(false);
  };

  const handleBuyTickets = () => {
    const rawLink = venue.ticketLink?.trim() || '';
    const lowerLink = rawLink.toLowerCase();
    
    const getGoogleSearchUrl = (query: string) => 
      `https://www.google.com/search?q=${encodeURIComponent(query)}`;

    let targetUrl = '';
    const searchContext = `${venue.name} ${venue.type}`;

    if (lowerLink.includes('ticketsasa.com')) {
      targetUrl = getGoogleSearchUrl(`site:ticketsasa.com ${searchContext} tickets`);
    } else if (lowerLink.includes('kenyabuzz.com')) {
      targetUrl = getGoogleSearchUrl(`site:kenyabuzz.com ${searchContext} tickets`);
    } else if (lowerLink.includes('ticketyetu.com')) {
      targetUrl = getGoogleSearchUrl(`site:ticketyetu.com ${searchContext} tickets`);
    } else if (rawLink.startsWith('http') && !lowerLink.includes('none')) {
      targetUrl = rawLink;
    } else {
      const query = `${searchContext} tickets (site:ticketsasa.com OR site:kenyabuzz.com OR site:ticketyetu.com)`;
      targetUrl = getGoogleSearchUrl(query);
    }
    window.open(targetUrl, '_blank');
  };

  const handleShare = async () => {
    const shareText = `Check out ${venue.name} (${venue.type})! ${venue.description} \n\n📍 ${venue.address || 'View on Map'}`;
    let shareUrl = venue.googleMapsUri || window.location.href;
    if (venue.ticketLink && venue.ticketLink.startsWith('http')) {
      shareUrl = venue.ticketLink;
    }
    if (navigator.share) {
      try {
        await navigator.share({
          title: venue.name,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Error sharing', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${venue.name}\n${shareText}\n${shareUrl}`);
        setShareLabel('Copied!');
        setTimeout(() => setShareLabel('Share'), 2000);
      } catch (err) {
        setShareLabel('Error');
        setTimeout(() => setShareLabel('Share'), 2000);
      }
    }
  };

  const getEmbedUrl = () => {
    const origin = `${userLocation.latitude},${userLocation.longitude}`;
    const destination = encodeURIComponent(`${venue.name}, ${venue.address}`);
    return `https://maps.google.com/maps?saddr=${origin}&daddr=${destination}&hl=en&output=embed`;
  };

  const getTicketButtonLabel = () => {
    const link = venue.ticketLink?.toLowerCase() || '';
    if (link.includes('ticketsasa')) return 'Ticketsasa';
    if (link.includes('kenyabuzz')) return 'KenyaBuzz';
    if (link.includes('ticketyetu')) return 'TicketYetu';
    return 'Get Tickets';
  };

  return (
    <div className="group relative overflow-hidden rounded-3xl bg-black/40 border border-white/10 backdrop-blur-xl transition-all duration-300 hover:bg-black/50 hover:border-white/20 shadow-xl shadow-black/20">
      
      {/* Glow Effect on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="relative p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 pr-4">
            <span className="inline-block px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-pink-300 mb-2 backdrop-blur-md">
              {venue.type}
            </span>
            <h3 className="text-2xl font-black text-white leading-tight mb-2 tracking-tight drop-shadow-sm">
              {venue.name}
            </h3>
            
            <div className="flex items-center gap-3 text-sm">
              {venue.rating && (
                <div className="flex items-center text-yellow-400 font-bold bg-yellow-400/10 px-1.5 py-0.5 rounded">
                  <ion-icon name="star" className="mr-1"></ion-icon>
                  <span>{venue.rating}</span>
                </div>
              )}
              {venue.time && (
                <div className="flex items-center text-slate-300">
                  <ion-icon name="time-outline" className="mr-1 text-vibe-accent"></ion-icon>
                  <span>{venue.time}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
             <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-900/20 border border-emerald-500/30 px-3 py-1 rounded-lg text-emerald-300 font-mono text-sm font-bold shadow-lg">
               {venue.budgetLevel}
             </div>
          </div>
        </div>
        
        {/* Toggleable Map Section */}
        {showMap ? (
           <div className="my-5 rounded-2xl overflow-hidden border border-white/10 relative shadow-2xl animate-fade-in">
             <iframe
               width="100%"
               height="300"
               style={{ border: 0 }}
               loading="lazy"
               allowFullScreen
               src={getEmbedUrl()}
               title={`Map to ${venue.name}`}
               className="grayscale-[20%] invert-[90%] hue-rotate-180 contrast-[1.1] brightness-[0.85]"
             ></iframe>
             <button 
                onClick={() => setShowMap(false)}
                className="absolute top-3 right-3 bg-black/80 text-white p-2 rounded-full hover:bg-black hover:scale-110 transition-all z-10 border border-white/20"
             >
               <ion-icon name="close" className="text-lg"></ion-icon>
             </button>
           </div>
        ) : (
          <p className="text-slate-300 text-sm leading-relaxed mb-5 line-clamp-3 font-medium opacity-90">
            {venue.description}
          </p>
        )}

        <div className="flex items-center text-slate-400 text-xs mb-6 bg-white/5 p-2 rounded-lg border border-white/5">
          <ion-icon name="location" className="mr-2 text-lg text-vibe-accent"></ion-icon>
          <span className="truncate font-medium">{venue.address || "Location details available in map"}</span>
        </div>

        {/* Buttons Grid */}
        <div className="grid grid-cols-4 gap-3">
          {/* Map Toggle */}
          <Button 
            variant={showMap ? "primary" : "secondary"} 
            onClick={() => setShowMap(!showMap)} 
            className={`!p-0 flex items-center justify-center col-span-1 aspect-square rounded-2xl ${showMap ? 'ring-2 ring-white/50' : ''}`}
          >
            <ion-icon name={showMap ? "list" : "map"} className="text-2xl"></ion-icon>
          </Button>
          
          {/* Share */}
          <Button 
            variant="secondary" 
            onClick={handleShare} 
            className="!p-0 flex items-center justify-center col-span-1 aspect-square rounded-2xl"
          >
             <ion-icon name={shareLabel === 'Copied!' ? "checkmark" : "share-social"} className="text-xl"></ion-icon>
          </Button>

          {/* Go (Ride) */}
          <Button 
            variant="primary" 
            onClick={handleBookRide} 
            className="col-span-2 !py-0 flex items-center justify-center bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-900/40 rounded-2xl"
          >
            <span className="mr-2 text-xl"><ion-icon name="car-sport"></ion-icon></span> Go
          </Button>

          {/* Ticket Button (Full Width) */}
          {(venue.ticketLink || venue.type.toLowerCase().includes('event') || venue.type.toLowerCase().includes('concert') || venue.type.toLowerCase().includes('festival')) && (
            <div className="col-span-4 mt-1">
              <Button 
                variant="outline" 
                onClick={handleBuyTickets} 
                className="w-full py-3.5 border-amber-500/50 text-amber-400 hover:bg-amber-500/10 hover:border-amber-400 rounded-xl relative overflow-hidden group/ticket"
              >
                <div className="absolute inset-0 bg-amber-500/5 translate-y-full group-hover/ticket:translate-y-0 transition-transform duration-300" />
                <span className="mr-2 text-xl relative z-10"><ion-icon name="ticket"></ion-icon></span> 
                <span className="relative z-10 font-bold">{getTicketButtonLabel()}</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Ride Selection Modal */}
      {showRideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-8 border border-white/10 shadow-2xl animate-fade-in-up">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Select Ride</h3>
            <div className="space-y-4">
              <button onClick={openUber} className="w-full bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center hover:bg-slate-900 transition-all border border-slate-800 hover:scale-[1.02] active:scale-[0.98]">
                <span className="mr-2">Uber</span>
                <ion-icon name="arrow-forward"></ion-icon>
              </button>
              <button onClick={openBolt} className="w-full bg-[#34D186] text-white py-4 rounded-2xl font-bold flex items-center justify-center hover:bg-[#2eb875] transition-all shadow-lg shadow-green-900/20 hover:scale-[1.02] active:scale-[0.98]">
                <span className="mr-2">Bolt</span>
                <ion-icon name="flash"></ion-icon>
              </button>
            </div>
            <button 
              onClick={() => setShowRideModal(false)} 
              className="mt-6 w-full text-slate-400 py-2 hover:text-white font-medium text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VenueCard;
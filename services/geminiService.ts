import { GoogleGenAI } from "@google/genai";
import { UserPreferences, Coordinates, Venue, DateRange, CategoryFilter } from '../types';
import { MIN_VENUE_NAME_LENGTH, VENUE_LOADING_TEXT } from '../constants';

const getAiClient = () => {
  console.log('Environment check:', {
    hasProcessEnv: typeof process !== 'undefined',
    hasApiKey: !!process.env.API_KEY,
    apiKeyLength: process.env.API_KEY?.length
  });
  
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};


export const getVibeRecommendations = async (
  prefs: UserPreferences,
  location: Coordinates,
  dateRange: DateRange = 'Today',
  category: CategoryFilter = 'All',
  onVenueUpdate?: (venues: Venue[]) => void
): Promise<Venue[]> => {
  const ai = getAiClient();

  // Get current date string to help the model find relevant events
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const prompt = `
Context:
- Today's date: ${today}
- Group type: ${prefs.groupType}
- Current mood: ${prefs.mood}
- Budget: ${prefs.budget} (local currency)
- Interested in: ${prefs.activities.join(', ')}
- Location: ${location.latitude}, ${location.longitude}

SEARCH PARAMETERS:
- Timeframe: ${dateRange}
- Category: ${category === 'All' ? 'Curate a diverse mix matching our mood and interests' : category}

PRIMARY TASK:
Find 5 specific, real recommendations that match our criteria.

SEARCH STRATEGY:
1. First, search these event platforms for happenings during ${dateRange}:
   - KenyaBuzz.com
   - Ticketsasa.com
   - TicketYetu.com
   - Eventbrite.com
   - Gig.co.ke
   - nairobieventsguide.com
   - eventpass.ke

2. For events found on these platforms:
   - Extract the actual ticket price if listed
   - Note the source domain (e.g., "ticketsasa.com")
   - Only include direct URLs if you find them in search results—never construct or guess URLs

3. If no relevant events are found on these platforms, recommend:
   - Established venues (clubs, restaurants, lounges, parks)
   - Places with verified ratings and reviews
   - Options that match our mood: ${prefs.mood}

OUTPUT FORMAT:
Present each recommendation using this exact structure:

### [Name]
**Type**: [e.g., Live Concert, Rooftop Party, Restaurant, Park]
**Budget**: [Exact price if known (e.g., "KES 1,500") OR estimated range (e.g., "KES 2,000-3,500")]
**Time**: [For events: specific date & time | For venues: operating hours]
**Rating**: [Google rating if available, e.g., "4.5/5" OR "N/A"]
**Vibe**: [1-2 sentences explaining why this fits our ${prefs.mood} mood and interests]
**Address**: [Specific address or neighborhood]
**Coordinates**: [Latitude, Longitude]
**Tickets**: [Direct URL if found in search results | Domain only (e.g., "ticketsasa.com") | "Walk-in" for venues | "N/A"]

FINAL SUMMARY:
After all recommendations, provide a 2-3 sentence overview highlighting the best option for our ${prefs.mood} mood and any notable patterns in the suggestions.

IMPORTANT RULES:
- Be specific—use real venue names, actual events, and verified information
- Never invent URLs, prices, or details you haven't found
- Prioritize options within the ${prefs.budget} budget
- Ensure coordinates are accurate for navigation
- Match the ${prefs.mood} mood throughout your recommendations
- Don't show past events, show upcoming or happening now events
`;

  try {
    // Use streaming for progressive updates
    const streamResponse = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        // We use both googleMaps and googleSearch to get location data AND real-time event info
        tools: [{ googleMaps: {} }, { googleSearch: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: location.latitude,
              longitude: location.longitude,
            },
          },
        },
      },
    });

    let textBuffer = "";
    let lastVenueCount = 0;
    
    // Process stream chunks
    for await (const chunk of streamResponse) {
      const chunkText = chunk.text || "";
      textBuffer += chunkText;
      
      // Parse partial venues if callback is provided
      if (onVenueUpdate) {
        const partialVenues = parsePartialVenues(textBuffer);
        // Only update if we have new venues or updated content
        if (partialVenues.length > lastVenueCount) {
          lastVenueCount = partialVenues.length;
          onVenueUpdate(partialVenues);
        }
      }
    }
    
    // Final parse to get all venues
    const finalVenues = parseCompleteVenues(textBuffer);
    
    // Call onVenueUpdate one last time with final result if callback provided
    if (onVenueUpdate && finalVenues.length > 0) {
      onVenueUpdate(finalVenues);
    }
    
    return finalVenues;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

// Helper function to parse completed venue blocks from accumulated text
function parsePartialVenues(text: string): Venue[] {
  const venues: Venue[] = [];
  
  // Split by ### markers to find venue blocks
  const blocks = text.split('### ');
  
  // Process all blocks except the first (preamble)
  // Include the last block for progressive streaming - show as soon as we have minimal data
  for (let i = 1; i < blocks.length; i++) {
    const venue = parseVenueBlock(blocks[i], i - 1);
    if (venue) {
      venues.push(venue);
    }
  }
  
  return venues;
}

// Helper function to parse all complete venue blocks (including the last one)
function parseCompleteVenues(text: string): Venue[] {
  const venues: Venue[] = [];
  
  // Split by ### markers to find venue blocks
  const blocks = text.split('### ').slice(1); // Skip preamble
  
  blocks.forEach((block, index) => {
    const venue = parseVenueBlock(block, index);
    if (venue) {
      venues.push(venue);
    }
  });
  
  return venues;
}

// Parse a single venue block
function parseVenueBlock(block: string, index: number): Venue | null {
  const lines = block.split('\n');
  const name = lines[0].trim();
  
  // Require at least a name to show the venue
  if (!name || name.length < MIN_VENUE_NAME_LENGTH) return null;
  
  // Default values that will be shown while streaming
  let type = "Venue";
  let budgetLevel = "$$";
  let description = VENUE_LOADING_TEXT;
  let address = "";
  let time = "";
  let rating = "";
  let ticketLink = "";
  let coordinates: Coordinates | undefined;

  lines.forEach(line => {
    if (line.includes('**Type**:')) {
      const parsed = line.split('**Type**:')[1]?.trim();
      if (parsed) type = parsed;
    }
    if (line.includes('**Budget**:')) {
      const parsed = line.split('**Budget**:')[1]?.trim();
      if (parsed) budgetLevel = parsed;
    }
    if (line.includes('**Vibe**:')) {
      const parsed = line.split('**Vibe**:')[1]?.trim();
      if (parsed) description = parsed;
    }
    if (line.includes('**Address**:')) {
      const parsed = line.split('**Address**:')[1]?.trim();
      if (parsed) address = parsed;
    }
    if (line.includes('**Time**:')) {
      const parsed = line.split('**Time**:')[1]?.trim();
      if (parsed) time = parsed;
    }
    if (line.includes('**Rating**:')) {
      const parsed = line.split('**Rating**:')[1]?.trim();
      if (parsed) rating = parsed;
    }
    if (line.includes('**Tickets**:')) {
      const rawLink = line.split('**Tickets**:')[1]?.trim();
      if (rawLink) {
        const lowerLink = rawLink.toLowerCase();
        if (rawLink && lowerLink !== 'none' && lowerLink !== 'n/a') {
          ticketLink = rawLink;
        }
      }
    }
    if (line.includes('**Coordinates**:')) {
      const coordsStr = line.split('**Coordinates**:')[1]?.trim();
      if (coordsStr) {
        // Remove brackets if present and split
        const parts = coordsStr.replace(/[\[\]]/g, '').split(',');
        if (parts.length === 2) {
          const lat = parseFloat(parts[0].trim());
          const lng = parseFloat(parts[1].trim());
          if (!isNaN(lat) && !isNaN(lng)) {
            coordinates = { latitude: lat, longitude: lng };
          }
        }
      }
    }
  });

  // Construct a map URL
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + " " + address)}`;
  
  return {
    id: `venue-${index}`,
    name,
    type,
    budgetLevel,
    description,
    address,
    time,
    rating,
    ticketLink,
    coordinates,
    googleMapsUri: mapUrl
  };
}
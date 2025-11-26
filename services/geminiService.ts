import { GoogleGenAI } from "@google/genai";
import { UserPreferences, Coordinates, Venue, DateRange, CategoryFilter } from '../types';

const getAiClient = () => {
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
  category: CategoryFilter = 'All'
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
    const response = await ai.models.generateContent({
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

    const text = response.text || "";
    
    // Parse the text blocks we requested.
    const venues: Venue[] = [];
    
    // Simple regex-based parsing based on the requested format
    const venueBlocks = text.split('### ').slice(1); // Skip preamble

    venueBlocks.forEach((block, index) => {
      const lines = block.split('\n');
      const name = lines[0].trim();
      
      let type = "Venue";
      let budgetLevel = "$$";
      let description = "A cool place to check out.";
      let address = "";
      let time = "";
      let rating = "";
      let ticketLink = "";
      let coordinates: Coordinates | undefined;

      lines.forEach(line => {
        if (line.includes('**Type**:')) type = line.split('**Type**:')[1].trim();
        if (line.includes('**Budget**:')) budgetLevel = line.split('**Budget**:')[1].trim();
        if (line.includes('**Vibe**:')) description = line.split('**Vibe**:')[1].trim();
        if (line.includes('**Address**:')) address = line.split('**Address**:')[1].trim();
        if (line.includes('**Time**:')) time = line.split('**Time**:')[1].trim();
        if (line.includes('**Rating**:')) rating = line.split('**Rating**:')[1].trim();
        if (line.includes('**TicketLink**:')) {
          const rawLink = line.split('**TicketLink**:')[1].trim();
          if (rawLink && rawLink.toLowerCase() !== 'none') {
            ticketLink = rawLink;
          }
        }
        if (line.includes('**Coordinates**:')) {
          const coordsStr = line.split('**Coordinates**:')[1].trim();
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
      });

      // Construct a map URL
      let mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + " " + address)}`;
      
      venues.push({
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
      });
    });

    return venues;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
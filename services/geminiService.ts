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
    Context: Today is ${today}.
    I am a ${prefs.groupType} group feeling ${prefs.mood}.
    My budget is around ${prefs.budget} (local currency).
    We are interested in: ${prefs.activities.join(', ')}.
    
    TIMEFRAME: Look for things happening **${dateRange}**.
    CATEGORY FOCUS: ${category === 'All' ? 'Mix of best options based on mood' : `Strictly focus on ${category}`}.
    
    Current Location Lat/Lng: ${location.latitude}, ${location.longitude}.

    Task: Find 5 specific, real recommendations nearby matching the Timeframe and Category.
    
    CRITICAL SOURCE INSTRUCTION:
    You MUST search for upcoming events, gigs, and parties specifically on these websites:
    1. KenyaBuzz.com
    2. Ticketsasa.com
    3. TicketYetu.com
    
    If you find an event on these sites, extract the Price and the Domain Name (e.g., ticketsasa.com) for the tickets. 
    DO NOT GUESS THE FULL URL if you don't find a direct link in the search results, just provide the domain.

    If no events are found on these specific sites for ${dateRange}, fallback to suggesting the best general venues (clubs, restaurants, parks) matching the mood.

    OUTPUT FORMAT:
    Please present the results as a list. For each item, strictly follow this format:
    
    ### [Name of Place or Event]
    **Type**: [Type e.g. Concert, Festival, Nightclub, Dinner]
    **Budget**: [Specific Price if available, e.g. "KES 1500", or Estimate $$-$$$]
    **Time**: [Specific Date & Time for events, or Opening Hours]
    **Rating**: [Google Rating if available, e.g. 4.5/5]
    **Vibe**: [Short description of why it fits]
    **Address**: [Approximate address or area]
    **Coordinates**: [Latitude, Longitude] (e.g. -1.2921, 36.8219)
    **TicketLink**: [Direct URL if definitely known, or just the domain "ticketsasa.com" / "kenyabuzz.com" / "None"]
    
    Then provide a short summary at the end.
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
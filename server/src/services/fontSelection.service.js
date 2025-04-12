// Import ollama using dynamic import to handle ESM module
// For production, we use dynamic import to handle the ESM module
let ollamaPromise = null;

const getOllama = async () => {
  if (!ollamaPromise) {
    ollamaPromise = import('ollama').then(module => module.default);
  }
  return ollamaPromise;
};

// Font selection service
exports.selectFonts = async (brandDescription) => {
  try {
    console.log('Selecting fonts based on:', brandDescription);

    // Generate a prompt for the Ollama model to select fonts
    const prompt = `
      Select three fonts that would best represent a brand with the following description:
      "${brandDescription}"
      
      For each font, provide:
      1. The font name (choose from popular, accessible fonts)
      2. The font style (e.g., serif, sans-serif, display, script)
      3. Usage recommendation (e.g., headings, body text, accents)
      4. Why this font matches the brand's personality and values
      
      Format the response as a JSON object with an array of font objects.
    `;

    try {
      // Get the ollama module
      const ollama = await getOllama();

      console.log('Using Ollama with gemma3:12b model for font selection');

      // Make the API call to Ollama
      const response = await ollama.chat({
        model: 'gemma3:12b',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        format: 'json'
      });

      console.log('Received font selection response from Ollama');

      // Parse the response to extract the fonts
      let fonts;
      try {
        // The response might already be a JSON object or a string
        if (typeof response.message.content === 'string') {
          // Try to parse the JSON from the response content
          fonts = JSON.parse(response.message.content);
        } else {
          // If it's already an object, use it directly
          fonts = response.message.content;
        }

        // If fonts is an object with a fonts property, extract the array
        if (fonts && fonts.fonts && Array.isArray(fonts.fonts)) {
          fonts = fonts.fonts;
        }

        // Ensure we have an array of fonts
        if (!Array.isArray(fonts)) {
          throw new Error('Font selection response is not an array');
        }

        console.log('Successfully parsed font selection from Ollama response');
        return fonts;
      } catch (parseError) {
        console.error('Error parsing JSON from Ollama font response:', parseError);
        console.log('Font response content:', response.message.content);
        // Fall back to mock data if parsing fails
        throw new Error('Failed to parse font selection from AI model');
      }
    } catch (ollamaError) {
      console.error('Error calling Ollama API for font selection:', ollamaError);
      // If Ollama API call fails, fall back to mock data
      console.log('Falling back to mock font data due to Ollama API error');
      throw new Error('Failed to connect to Ollama API for font selection');
    }
  } catch (error) {
    console.error('Error selecting fonts:', error);

    // For demo purposes, return mock fonts when the API fails
    console.log('Using mock fonts as fallback');
    const mockFonts = [
      {
        name: 'Montserrat',
        style: 'Sans-serif',
        usage: 'Headings and titles',
        rationale: 'Modern, professional appearance with good readability that conveys confidence and contemporary design values'
      },
      {
        name: 'Merriweather',
        style: 'Serif',
        usage: 'Body text and paragraphs',
        rationale: 'Combines classic elegance with excellent readability, creating a trustworthy and established feeling'
      },
      {
        name: 'Caveat',
        style: 'Script',
        usage: 'Accents, quotes, and special elements',
        rationale: 'Adds a personal, creative touch to balance the more structured primary fonts'
      }
    ];

    return mockFonts;
  }
}; 
// Import ollama using dynamic import to handle ESM module
// For production, we use dynamic import to handle the ESM module
let ollamaPromise = null;

const getOllama = async () => {
  if (!ollamaPromise) {
    ollamaPromise = import('ollama').then(module => module.default);
  }
  return ollamaPromise;
};

// Logo prompt service
exports.generateLogoPrompt = async (brandName, brandDescription, colorTheme) => {
  try {
    console.log(`Generating logo prompt for brand: ${brandName}`);

    // Extract primary color for the logo from the color theme
    let primaryColor;
    if (colorTheme && colorTheme.colors && colorTheme.colors.length > 0) {
      primaryColor = colorTheme.colors.find(color => color.usage && color.usage.includes('Primary')) || colorTheme.colors[0];
    } else {
      // Default primary color if colorTheme is undefined or missing colors
      primaryColor = {
        name: 'Default Blue',
        hex: '#1A5F7A',
        usage: 'Primary brand color'
      };
    }

    // Generate a prompt for the Ollama model to create a logo prompt
    const prompt = `
      Create a detailed prompt for a typography-based logo design for a brand with the following details:
      
      Brand name: "${brandName}"
      Brand description: "${brandDescription}"
      Primary color: ${primaryColor.name} (${primaryColor.hex})
      
      The logo should focus on typography with minimal, elegant design elements.
      Include specific details about:
      1. Font style recommendations
      2. Layout and composition
      3. Use of color from the brand's palette
      4. Any minimal graphical elements that could enhance the typography
      5. The overall mood and feel the logo should convey

      Format your response using Markdown.
    `;

    try {
      // Get the ollama module
      const ollama = await getOllama();

      console.log('Using Ollama with gemma3:12b model for logo prompt generation');

      // Make the API call to Ollama
      const response = await ollama.chat({
        model: 'gemma3:12b',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5
      });

      console.log('Received logo prompt response from Ollama');

      // Return the raw text response directly
      const logoPrompt = response.message.content;
      console.log('Successfully received logo prompt text from Ollama response');
      return logoPrompt;
    } catch (ollamaError) {
      console.error('Error calling Ollama API for logo prompt:', ollamaError);
      // If Ollama API call fails, fall back to mock data
      console.log('Falling back to mock logo prompt due to Ollama API error');
      throw new Error('Failed to connect to Ollama API for logo prompt');
    }
  } catch (error) {
    console.error('Error generating logo prompt:', error);

    // Generate brand name if not available due to error
    const brandNameFallback = brandName || 'Brand';

    // For demo purposes, return a mock logo prompt when the API fails
    console.log('Using mock logo prompt as fallback');

    // Try to get a primary color from colorTheme if it exists
    let primaryColorHex = '#1A5F7A'; // Default fallback color
    try {
      if (colorTheme && colorTheme.colors && colorTheme.colors.length > 0) {
        const primaryColor = colorTheme.colors.find(color => color.usage.includes('Primary')) || colorTheme.colors[0];
        primaryColorHex = primaryColor.hex;
      }
    } catch (colorError) {
      console.error('Error extracting primary color:', colorError);
    }

    const mockLogoPrompt = `# Logo Design for "${brandNameFallback}"

## Typography
Create a minimalist, typography-focused logo using a clean, modern sans-serif font with subtle weight variations. Position the text centrally with balanced spacing between characters.

## Color Usage
Utilize the brand's primary color ${primaryColorHex} for the main text, with potential for a small accent in a complementary color.

## Graphical Elements
Add a subtle geometric element—perhaps a small line or dot—that complements the typography without overwhelming it. 

## Mood & Feel
The overall composition should convey professionalism with a contemporary edge, evoking the brand's core values while maintaining excellent scalability and recognition at different sizes.

The final logo should have clean lines, perfect balance, and a timeless quality that will remain effective across various applications from digital platforms to print materials.`;

    return mockLogoPrompt;
  }
}; 
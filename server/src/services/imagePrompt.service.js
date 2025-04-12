// Import ollama using dynamic import to handle ESM module
// For production, we use dynamic import to handle the ESM module
let ollamaPromise = null;

const getOllama = async () => {
  if (!ollamaPromise) {
    ollamaPromise = import('ollama').then(module => module.default);
  }
  return ollamaPromise;
};

// Image prompt service
exports.generateImagePrompts = async (brandDescription, colorTheme) => {
  try {
    console.log('Generating image prompts based on brand description');

    // Extract colors for reference in the prompts
    const primaryColor = colorTheme.colors.find(color => color.usage.includes('Primary')) || colorTheme.colors[0];
    const accentColor = colorTheme.colors.find(color => color.usage.includes('accent')) || colorTheme.colors[1];

    // Generate a prompt for the Ollama model to create image prompts
    const prompt = `
      Create three detailed image prompts for a brand with the following description:
      "${brandDescription}"
      
      The brand's primary color is ${primaryColor.name} (${primaryColor.hex}) and accent color is ${accentColor.name} (${accentColor.hex}).
      
      For each image prompt:
      1. Focus on a different aspect of the brand's identity or values
      2. Include specific details about composition, lighting, mood, and subject matter
      3. Incorporate the brand's color palette where appropriate
      4. Ensure the images would work well for marketing materials or social media
      5. Make the prompts detailed enough for an AI image generator to create high-quality, on-brand images
      
      Format the response as a JSON array of objects, where each object has a "title" and a "prompt" property.
    `;

    try {
      // Get the ollama module
      const ollama = await getOllama();

      console.log('Using Ollama with gemma3:12b model for image prompt generation');

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

      console.log('Received image prompt response from Ollama');

      // Parse the response to extract the image prompts
      let imagePrompts;
      try {
        // The response might already be a JSON object or a string
        if (typeof response.message.content === 'string') {
          // Try to parse the JSON from the response content
          imagePrompts = JSON.parse(response.message.content);
        } else {
          // If it's already an object, use it directly
          imagePrompts = response.message.content;
        }

        // Handle different possible response formats
        if (Array.isArray(imagePrompts)) {
          // Already an array, good to go
        } else if (imagePrompts && imagePrompts.prompts && Array.isArray(imagePrompts.prompts)) {
          // Extract the prompts array from the object
          imagePrompts = imagePrompts.prompts;
        } else if (imagePrompts && typeof imagePrompts === 'object') {
          // Convert object keys to an array if not already in expected format
          imagePrompts = Object.keys(imagePrompts).map(key => {
            // If the value is a string, create an object with title and prompt
            if (typeof imagePrompts[key] === 'string') {
              return {
                title: key,
                prompt: imagePrompts[key]
              };
            }
            // If value is already an object with a prompt property, add the key as title if missing
            else if (typeof imagePrompts[key] === 'object') {
              return {
                title: imagePrompts[key].title || key,
                prompt: imagePrompts[key].prompt || JSON.stringify(imagePrompts[key])
              };
            }
            return null;
          }).filter(Boolean); // Remove any null entries
        }

        // Ensure each prompt has both title and prompt properties
        imagePrompts = imagePrompts.map((prompt, index) => {
          if (typeof prompt === 'string') {
            return {
              title: `Brand Image ${index + 1}`,
              prompt: prompt
            };
          } else if (!prompt.title) {
            return {
              ...prompt,
              title: `Brand Image ${index + 1}`
            };
          } else if (!prompt.prompt && prompt.description) {
            return {
              title: prompt.title,
              prompt: prompt.description
            };
          }
          return prompt;
        });

        // Ensure we have an array of prompts
        if (!Array.isArray(imagePrompts) || imagePrompts.length === 0) {
          throw new Error('Image prompt response is not a valid array');
        }

        console.log('Successfully parsed image prompts from Ollama response');
        return imagePrompts;
      } catch (parseError) {
        console.error('Error parsing JSON from Ollama image prompt response:', parseError);
        console.log('Image prompt response content:', response.message.content);
        // Fall back to mock data if parsing fails
        throw new Error('Failed to parse image prompts from AI model');
      }
    } catch (ollamaError) {
      console.error('Error calling Ollama API for image prompts:', ollamaError);
      // If Ollama API call fails, fall back to mock data
      console.log('Falling back to mock image prompts due to Ollama API error');
      throw new Error('Failed to connect to Ollama API for image prompts');
    }
  } catch (error) {
    console.error('Error generating image prompts:', error);

    // Try to extract colors from colorTheme if available, otherwise use defaults
    let primaryColorHex = '#1A5F7A'; // Default primary color
    let accentColorHex = '#FFA500'; // Default accent color

    try {
      if (colorTheme && colorTheme.colors && colorTheme.colors.length > 0) {
        const primaryColor = colorTheme.colors.find(color => color.usage.includes('Primary')) || colorTheme.colors[0];
        primaryColorHex = primaryColor.hex;

        const accentColor = colorTheme.colors.find(color => color.usage.includes('accent')) ||
          (colorTheme.colors.length > 1 ? colorTheme.colors[1] : colorTheme.colors[0]);
        accentColorHex = accentColor.hex;
      }
    } catch (colorError) {
      console.error('Error extracting colors for fallback:', colorError);
    }

    // For demo purposes, return mock image prompts when the API fails
    console.log('Using mock image prompts as fallback');
    const mockImagePrompts = [
      {
        title: "Brand Values in Action",
        prompt: `A bright, airy workspace filled with natural light streaming through large windows. A diverse team collaborates around a modern table with subtle accents of ${primaryColorHex} in the furniture and ${accentColorHex} in small decorative elements. The scene captures innovation and teamwork in progress, with digital screens displaying creative work and people engaged in animated discussion. The mood is positive and energetic, with a clean, uncluttered aesthetic that emphasizes both professionalism and creativity.`
      },
      {
        title: "Product Showcase",
        prompt: `A minimalist product display against a clean ${primaryColorHex} gradient background. The product is centrally positioned with perfect lighting that creates subtle shadows, highlighting its form and design details. Small accent elements in ${accentColorHex} draw attention to key features. The composition is balanced and elegant, with negative space used intentionally to create a sense of premium quality. The perspective is slightly angled to create visual interest while maintaining clarity.`
      },
      {
        title: "Brand Lifestyle",
        prompt: `A carefully composed lifestyle scene that embodies the brand's values. A serene outdoor setting at golden hour with rich, warm lighting that complements the ${primaryColorHex} and ${accentColorHex} color themes subtly integrated into clothing and environment. The human subjects appear authentic and relatable, engaged in meaningful activity that reflects the brand's purpose. The depth of field is shallow, creating a soft bokeh effect in the background while keeping the foreground subjects in sharp focus. The overall mood is aspirational yet achievable.`
      }
    ];

    console.log('Mock image prompts created:', JSON.stringify(mockImagePrompts, null, 2));
    return mockImagePrompts;
  }
};

// Add logging wrapper to diagnose and fix the JSON string issue
const originalGenerateImagePrompts = exports.generateImagePrompts;

exports.generateImagePrompts = async function (brandDescription, colorTheme) {
  console.log('Starting enhanced generateImagePrompts with logging');

  try {
    // Call the original function
    const result = await originalGenerateImagePrompts(brandDescription, colorTheme);

    // Log details about the result
    console.log('Image prompts generated successfully');
    console.log('Result type:', typeof result);
    console.log('Is array:', Array.isArray(result));
    console.log('Number of prompts:', Array.isArray(result) ? result.length : 'N/A');

    // Check structure of result
    if (Array.isArray(result)) {
      console.log('First prompt structure:', JSON.stringify(result[0], null, 2));

      // Verify all entries have title and prompt
      const validStructure = result.every(item =>
        item && typeof item === 'object' && item.title && item.prompt);
      console.log('All prompts have valid structure:', validStructure);

      // Critical check - ensure we're not returning stringified JSON
      const resultStr = JSON.stringify(result);
      console.log('Result stringified length:', resultStr.length);
      console.log('Sample of stringified result:', resultStr.substring(0, 100) + '...');

      // Return the original result
      return result;
    } else {
      console.error('CRITICAL ERROR: Result is not an array!');
      console.log('Actual result:', JSON.stringify(result, null, 2));

      // Convert to array if needed
      if (typeof result === 'string' && result.startsWith('[')) {
        try {
          console.log('Attempting to parse string result as JSON');
          const parsed = JSON.parse(result);
          if (Array.isArray(parsed)) {
            console.log('Successfully converted string to array with', parsed.length, 'items');
            return parsed;
          }
        } catch (e) {
          console.error('Failed to parse string as JSON:', e);
        }
      }

      // If we reached here, we need to wrap the result in an array
      console.log('Wrapping non-array result in array');
      return Array.isArray(result) ? result : [result];
    }
  } catch (error) {
    console.error('Error in enhanced generateImagePrompts:', error);

    // Create emergency fallback
    const fallback = [
      {
        title: "Emergency Fallback Image 1",
        prompt: "A professional image representing innovation and quality."
      },
      {
        title: "Emergency Fallback Image 2",
        prompt: "A vibrant scene showing the product in use by satisfied customers."
      },
      {
        title: "Emergency Fallback Image 3",
        prompt: "An artistic representation of the brand values and mission."
      }
    ];

    console.log('Returning emergency fallback image prompts');
    return fallback;
  }
}; 
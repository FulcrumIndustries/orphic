// Import ollama using dynamic import to handle ESM module
// For production, we use dynamic import to handle the ESM module
let ollamaPromise = null;

const getOllama = async () => {
    if (!ollamaPromise) {
        ollamaPromise = import('ollama').then(module => module.default);
    }
    return ollamaPromise;
};

// Define schema for each individual color
const colorSchema = {
    type: "object",
    properties: {
        name: { type: "string" },
        hex: { type: "string" },
        rgb: { type: "string" },
        usage: { type: "string" },
        meaning: { type: "string" }
    },
    required: ["name", "hex", "rgb", "usage", "meaning"]
};

// Define full schema with the five color categories
const fullSchema = {
    type: "object",
    properties: {
        scheme_type: { type: "string" },
        primary: colorSchema,
        secondary: colorSchema,
        accent: colorSchema,
        background: colorSchema,
        text: colorSchema
    },
    required: ["scheme_type", "primary", "secondary", "accent", "background", "text"]
};

// Example to demonstrate the expected format
const example = {
    scheme_type: "complementary",
    primary: {
        name: "Cadet Grey",
        hex: "#91a3b0",
        rgb: "145,163,176",
        usage: "Primary brand color, headers, important buttons",
        meaning: "Represents trust and professionalism central to the brand"
    },
    secondary: {
        name: "Teal",
        hex: "#008080",
        rgb: "0,128,128",
        usage: "Secondary elements, highlights, accents",
        meaning: "Conveys balance and reliability in supporting contexts"
    },
    accent: {
        name: "Coral",
        hex: "#FF7F50",
        rgb: "255,127,80",
        usage: "Call-to-action buttons, highlights, alerts",
        meaning: "Creates energy and draws attention to important elements"
    },
    background: {
        name: "Off White",
        hex: "#FAFAFA",
        rgb: "250,250,250",
        usage: "Page backgrounds, content areas",
        meaning: "Provides clean and unobtrusive foundation for content"
    },
    text: {
        name: "Charcoal",
        hex: "#333333",
        rgb: "51,51,51",
        usage: "Body text, headings, content",
        meaning: "Ensures readability while being softer than pure black"
    }
};

/**
 * Generates a color theme based on brand description and optional parameters
 * @param {string} brandDescription - Description of the brand
 * @param {string} schemeType - Type of color scheme (e.g. 'complementary', 'analogous', 'triadic')
 * @param {string} baseColor - Optional base color to build the scheme around
 * @param {string} mood - Optional mood or theme for the color scheme
 * @returns {Promise<Object>} - The generated color theme
 */
exports.generateColorTheme = async (brandDescription, schemeType = 'complementary', baseColor = '', mood = '') => {
    try {
        console.log('Generating color theme based on:', brandDescription);
        console.log(`Scheme type: ${schemeType}, Base color: ${baseColor || 'none'}, Mood: ${mood || 'derived from description'}`);

        // Construct the prompt based on inputs
        let promptText = `Generate a cohesive ${schemeType} color scheme for a brand with the following description: "${brandDescription}".`;

        if (baseColor) {
            promptText += ` Use ${baseColor} as the base color to build the scheme around.`;
        }

        if (mood) {
            promptText += ` The color scheme should convey a ${mood} mood or atmosphere.`;
        }

        promptText += `
        Create five colors that work well together: primary, secondary, accent, background, and text.
        For each color, provide its name, hex code, RGB values, usage recommendations, and the meaning/psychology behind it.
        
        Make sure the colors have appropriate contrast relationships for accessibility.
        The primary and accent colors should be distinct but complementary.
        The background should provide good contrast with the text color.
        Include "${schemeType}" as the scheme_type in the output.
        `;

        // Format the final prompt for the AI model
        const formattedPrompt = `
        You must respond with valid JSON that follows this schema:
        ${JSON.stringify(fullSchema, null, 2)}
        
        Your response must ONLY contain valid JSON without any additional text, comments, or explanations outside the JSON structure.
        
        Here's an example of the expected format:
        ${JSON.stringify(example, null, 2)}
        
        Based on this information, generate a cohesive color scheme as specified:
        ${promptText}
        
        JSON response:
        `;

        try {
            // Get the ollama module
            const ollama = await getOllama();

            console.log('Using Ollama with gemma3:12b model');

            // Make the API call to Ollama
            const response = await ollama.chat({
                model: 'gemma3:12b',
                messages: [
                    {
                        role: 'user',
                        content: formattedPrompt
                    }
                ],
                format: 'json',
                temperature: 0.3
            });

            console.log('Received response from Ollama');

            // Parse the response to extract the color palette
            let colorTheme;
            try {
                // The response might already be a JSON object or a string
                if (typeof response.message.content === 'string') {
                    // Try to parse the JSON from the response content
                    colorTheme = JSON.parse(response.message.content);
                } else {
                    // If it's already an object, use it directly
                    colorTheme = response.message.content;
                }

                console.log('Successfully parsed color theme from Ollama response');

                // Transform the response to match the expected format in the frontend
                return transformColorThemeToExpectedFormat(colorTheme);
            } catch (parseError) {
                console.error('Error parsing JSON from Ollama response:', parseError);
                console.log('Response content:', response.message.content);
                // Fall back to mock data if parsing fails
                throw new Error('Failed to parse response from AI model');
            }
        } catch (ollamaError) {
            console.error('Error calling Ollama API:', ollamaError);
            // If Ollama API call fails, fall back to mock data
            console.log('Falling back to mock data due to Ollama API error');
            throw new Error('Failed to connect to Ollama API');
        }
    } catch (error) {
        console.error('Error generating color theme:', error);

        // For demo purposes, return a mock color palette when the API fails
        console.log('Using mock color palette as fallback');
        const mockColorTheme = {
            schemeType: schemeType || 'Complementary',
            colors: [
                {
                    name: 'Primary Blue',
                    hex: '#1A5F7A',
                    rgb: '26, 95, 122',
                    relation: 'Represents trust and professionalism central to the brand',
                    usage: 'Primary brand color, headers, important buttons'
                },
                {
                    name: 'Accent Orange',
                    hex: '#FFA500',
                    rgb: '255, 165, 0',
                    relation: 'Adds energy and creativity to balance the professional blue',
                    usage: 'Call to action, highlights, accent elements'
                },
                {
                    name: 'Light Gray',
                    hex: '#F5F5F5',
                    rgb: '245, 245, 245',
                    relation: 'Provides clean space and clarity',
                    usage: 'Backgrounds, spacing elements'
                },
                {
                    name: 'Dark Charcoal',
                    hex: '#333333',
                    rgb: '51, 51, 51',
                    relation: 'Grounds the palette with sophistication',
                    usage: 'Text, footers, secondary buttons'
                },
                {
                    name: 'Soft Teal',
                    hex: '#5FB0B7',
                    rgb: '95, 176, 183',
                    relation: 'Adds a creative, approachable touch',
                    usage: 'Secondary accents, decorative elements'
                }
            ]
        };

        return mockColorTheme;
    }
};

/**
 * Transforms the AI-generated color theme structure to match the expected format in the frontend
 * @param {Object} aiColorTheme - The color theme generated by the AI
 * @returns {Object} - The transformed color theme
 */
function transformColorThemeToExpectedFormat(aiColorTheme) {
    // Extract the colors into an array format
    const colorsArray = [
        {
            name: aiColorTheme.primary.name,
            hex: aiColorTheme.primary.hex,
            rgb: aiColorTheme.primary.rgb,
            relation: aiColorTheme.primary.meaning,
            usage: aiColorTheme.primary.usage
        },
        {
            name: aiColorTheme.secondary.name,
            hex: aiColorTheme.secondary.hex,
            rgb: aiColorTheme.secondary.rgb,
            relation: aiColorTheme.secondary.meaning,
            usage: aiColorTheme.secondary.usage
        },
        {
            name: aiColorTheme.accent.name,
            hex: aiColorTheme.accent.hex,
            rgb: aiColorTheme.accent.rgb,
            relation: aiColorTheme.accent.meaning,
            usage: aiColorTheme.accent.usage
        },
        {
            name: aiColorTheme.background.name,
            hex: aiColorTheme.background.hex,
            rgb: aiColorTheme.background.rgb,
            relation: aiColorTheme.background.meaning,
            usage: aiColorTheme.background.usage
        },
        {
            name: aiColorTheme.text.name,
            hex: aiColorTheme.text.hex,
            rgb: aiColorTheme.text.rgb,
            relation: aiColorTheme.text.meaning,
            usage: aiColorTheme.text.usage
        }
    ];

    // Return in the format expected by the frontend
    return {
        schemeType: aiColorTheme.scheme_type || 'Complementary',
        colors: colorsArray
    };
} 
import { useState, useMemo, useEffect } from "react";
import {
  ColorPaletteSkeleton,
  TypographySkeleton,
  LogoPromptSkeleton,
  ImagePromptsSkeleton,
} from "./SkeletonLoading";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Add a helper function to ensure markdown content is always a string
const ensureString = (content: any): string => {
  if (typeof content === "string") {
    return content;
  }
  if (content === null || content === undefined) {
    return "";
  }
  try {
    // Try to stringify if it's an object
    return JSON.stringify(content);
  } catch (e) {
    console.error("Error converting markdown content to string:", e);
    return String(content);
  }
};

// Helper function to convert font name to a format suitable for Google Fonts API
const formatFontNameForUrl = (fontName: string): string => {
  // Replace spaces with plus signs and remove special characters
  return fontName.replace(/\s+/g, "+").replace(/[^a-zA-Z0-9+]/g, "");
};

// Helper function to load Google Fonts
const loadGoogleFont = (fontName: string) => {
  if (!fontName || fontName === "Unknown Font" || fontName === "Not specified")
    return;

  const formattedName = formatFontNameForUrl(fontName);
  const link = document.createElement("link");
  link.href = `https://fonts.googleapis.com/css2?family=${formattedName}:wght@400;700&display=swap`;
  link.rel = "stylesheet";
  document.head.appendChild(link);

  console.log(`Loaded Google Font: ${fontName}`);
};

interface Color {
  name: string;
  hex: string;
  rgb: string;
  relation: string;
  usage: string;
}

interface Font {
  name: string;
  style: string;
  usage: string;
  rationale: string;
  font_name?: string;
  font_style?: string;
  usage_recommendation?: string;
  reasoning?: string;
}

interface ImagePrompt {
  title: string;
  prompt: string;
}

interface LogoPromptSection {
  title: string;
  details: string;
}

interface StructuredLogoPrompt {
  brandName: string;
  brandDescription: string;
  primaryColor: string;
  logoType: string;
  overallGoal: string;
  sections: LogoPromptSection[];
}

interface BrandResults {
  brandName: string;
  brandDescription: string;
  colorTheme?: {
    schemeType: string;
    colors: Color[];
  };
  fonts?: Font[];
  logoPrompt?: {
    prompt: string | StructuredLogoPrompt;
    primaryColor: string;
    secondaryColor?: string;
    accentColor?: string;
  };
  imagePrompts?: ImagePrompt[];
}

interface ResultsDisplayProps {
  results: Partial<BrandResults>;
  loading?: boolean;
  progress?: number;
  onReset: () => void;
  colors?: string[];
  gradients?: any[];
  fontPairs?: any[];
  logoPrompt?: string;
  formData?: {
    brandName: string;
    brandDescription: string;
    colorSchemeType?: string;
    baseColor?: string;
    mood?: string;
  };
}

// Add a common web-safe font fallbacks object
const webSafeFontFallbacks: Record<string, string> = {
  Arial: "Arial, Helvetica, sans-serif",
  Helvetica: "Helvetica, Arial, sans-serif",
  "Times New Roman": "'Times New Roman', Times, serif",
  Times: "'Times New Roman', Times, serif",
  "Courier New": "'Courier New', Courier, monospace",
  Courier: "'Courier New', Courier, monospace",
  Verdana: "Verdana, Geneva, sans-serif",
  Georgia: "Georgia, serif",
  Palatino: "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
  Garamond: "Garamond, serif",
  Bookman: "'Bookman Old Style', serif",
  Tahoma: "Tahoma, Geneva, sans-serif",
  "Trebuchet MS": "'Trebuchet MS', Helvetica, sans-serif",
  Geneva: "Geneva, Verdana, sans-serif",
  "Arial Black": "'Arial Black', Gadget, sans-serif",
  Impact: "Impact, Charcoal, sans-serif",
  "Century Gothic": "'Century Gothic', sans-serif",
  // Add more common font fallbacks as needed
};

// Utility function to generate proper font-family CSS value with fallbacks
const getFontFamilyValue = (fontName: string, fontStyle: string): string => {
  // Check if we have specific fallbacks for this font
  return (
    webSafeFontFallbacks[fontName] ||
    // If not, provide generic fallbacks based on font style
    (fontStyle.toLowerCase().includes("serif")
      ? `"${fontName}", Times, serif`
      : fontStyle.toLowerCase().includes("mono")
      ? `"${fontName}", "Courier New", monospace`
      : `"${fontName}", Arial, sans-serif`)
  );
};

// Component to display a font preview
interface FontPreviewProps {
  fontName: string;
  fontStyle: string;
}

const FontPreview = ({ fontName, fontStyle }: FontPreviewProps) => {
  return (
    <div className="font-preview">
      <span
        className="inline-block px-2 py-1 bg-gray-100 rounded mr-2"
        style={{ fontFamily: getFontFamilyValue(fontName, fontStyle) }}
      >
        {fontName}
      </span>
      <span className="text-sm text-gray-600">{fontStyle}</span>
    </div>
  );
};

const ResultsDisplay = ({
  results,
  loading = false,
  progress = 0,
  onReset,
  colors,
  gradients,
  fontPairs,
  logoPrompt,
  formData,
}: ResultsDisplayProps) => {
  const [activeTab, setActiveTab] = useState("parameters");
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());

  // Debug fonts data when the tab is active
  useEffect(() => {
    if (activeTab === "fonts" && results.fonts) {
      console.log("Fonts data in ResultsDisplay:", results.fonts);
      console.log("Fonts data type:", typeof results.fonts);
      console.log("Is Array:", Array.isArray(results.fonts));
      if (Array.isArray(results.fonts)) {
        console.log("Number of fonts:", results.fonts.length);
        if (results.fonts.length > 0) {
          console.log("First font item:", results.fonts[0]);
        }
      }
    }
  }, [activeTab, results.fonts]);

  // Load Google Fonts when fonts data is available
  useEffect(() => {
    if (Array.isArray(results.fonts) && results.fonts.length > 0) {
      results.fonts.forEach((font) => {
        const fontName = font.name || font.font_name || "";
        if (fontName && !loadedFonts.has(fontName)) {
          loadGoogleFont(fontName);
          setLoadedFonts((prev) => new Set(prev).add(fontName));
        }
      });
    }
  }, [results.fonts, loadedFonts]);

  // Helper function to copy text to clipboard
  const copyToClipboard = (text: string, identifier: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopiedText(identifier);
        setTimeout(() => setCopiedText(null), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  // Determine if a section is loaded based on progress
  const isSectionLoaded = useMemo(() => {
    return {
      colorTheme: progress >= 30 || !!results.colorTheme,
      fonts: progress >= 50 || !!results.fonts,
      logoPrompt: progress >= 70 || !!results.logoPrompt,
      imagePrompts: progress >= 90 || !!results.imagePrompts,
    };
  }, [progress, results]);

  // Function to get the text to copy for the logo prompt
  const getLogoPromptText = () => {
    if (!results.logoPrompt) return "";

    if (typeof results.logoPrompt.prompt === "string") {
      // Plain text with markdown formatting - return as is
      return results.logoPrompt.prompt;
    } else {
      // For structured prompts, create a well-formatted markdown text
      const prompt = results.logoPrompt.prompt as StructuredLogoPrompt;
      let text = `# ${prompt.brandName} Logo Design\n\n`;
      text += `## Overall Goal\n${prompt.overallGoal}\n\n`;

      prompt.sections?.forEach((section) => {
        text += `## ${section.title}\n${section.details}\n\n`;
      });

      text += `**Primary Color:** ${prompt.primaryColor}\n`;
      return text.trim();
    }
  };

  // Function to ensure imagePrompts is always an array of ImagePrompt objects
  const getImagePromptsArray = () => {
    if (!results.imagePrompts) {
      console.log("No imagePrompts data available");
      return [];
    }

    console.log("Raw imagePrompts data:", results.imagePrompts);

    // Define a type guard to check if the object has the expected shape
    const isImagesContainer = (
      obj: any
    ): obj is { title: string; prompt: string } => {
      return (
        obj &&
        typeof obj === "object" &&
        "title" in obj &&
        obj.title === "images" &&
        "prompt" in obj &&
        typeof obj.prompt === "string" &&
        obj.prompt.startsWith("[{")
      );
    };

    // If it's a single object with title "images" and a prompt that's a JSON string array
    if (
      !Array.isArray(results.imagePrompts) &&
      isImagesContainer(results.imagePrompts as any)
    ) {
      console.log(
        "Detected special case: object with 'images' title and JSON string in prompt"
      );
      try {
        const parsed = JSON.parse((results.imagePrompts as any).prompt);
        if (Array.isArray(parsed)) {
          console.log(
            "Successfully parsed nested JSON array with",
            parsed.length,
            "items"
          );
          return parsed;
        }
      } catch (e) {
        console.error("Error parsing JSON string in prompt field:", e);
      }
      // If parsing fails, return the object in an array
      return [results.imagePrompts];
    }

    // If it's already an array of ImagePrompt objects
    if (
      Array.isArray(results.imagePrompts) &&
      results.imagePrompts.length > 0 &&
      typeof results.imagePrompts[0] === "object" &&
      results.imagePrompts[0] !== null &&
      typeof results.imagePrompts[0].prompt === "string"
    ) {
      console.log(
        "imagePrompts is already an array of ImagePrompt objects with",
        results.imagePrompts.length,
        "items"
      );
      return results.imagePrompts;
    }

    // If it's a JSON string, parse it
    if (typeof results.imagePrompts === "string") {
      console.log("imagePrompts is a string, attempting to parse as JSON");
      try {
        // Try to parse the string as JSON
        const parsed = JSON.parse(results.imagePrompts);

        // Check if the parsed result is an array of image prompts
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (
            typeof parsed[0] === "object" &&
            parsed[0] !== null &&
            typeof parsed[0].prompt === "string"
          ) {
            console.log(
              "Successfully parsed imagePrompts into array with",
              parsed.length,
              "image prompt items"
            );
            return parsed;
          } else {
            // It's an array but not of ImagePrompt objects
            console.log(
              "Parsed JSON to array but not of ImagePrompt objects, returning as is"
            );
            return parsed;
          }
        }

        // Type guard for objects with imagePrompts array
        const hasImagePromptsArray = (
          obj: any
        ): obj is { imagePrompts: any[] } => {
          return (
            obj &&
            typeof obj === "object" &&
            "imagePrompts" in obj &&
            Array.isArray(obj.imagePrompts)
          );
        };

        // If parsed is a single object that might contain the array
        if (!Array.isArray(parsed) && hasImagePromptsArray(parsed)) {
          console.log(
            "Parsed object contains imagePrompts array, extracting it"
          );
          return parsed.imagePrompts;
        }

        // Default case, just return the parsed result
        console.log("Parsed JSON to:", parsed);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        console.error("Error parsing imagePrompts JSON:", e);
        // If parsing fails, it might be a string prompt or just plain text
        return [{ title: "Image Prompt", prompt: results.imagePrompts }];
      }
    }

    // If it's an array but not of ImagePrompt objects, it might need conversion
    if (Array.isArray(results.imagePrompts)) {
      // Check if it's an array of strings or other types that need to be converted
      const firstItem = results.imagePrompts[0];
      if (typeof firstItem === "string") {
        console.log("Converting array of strings to ImagePrompt objects");
        return results.imagePrompts.map((prompt, index) => ({
          title: `Prompt ${index + 1}`,
          prompt,
        }));
      }

      // Otherwise return the array as is
      return results.imagePrompts;
    }

    // If it's a single object that's not an array, wrap it
    console.log("imagePrompts is an object, wrapping in array");
    return [results.imagePrompts];
  };

  // Convert a string prompt to markdown format if it's not already
  const formatStringPrompt = (prompt: any) => {
    // First ensure we have a string
    const promptStr = ensureString(prompt);

    // Check if the prompt already contains markdown formatting
    if (
      promptStr.includes("#") ||
      promptStr.includes("**") ||
      promptStr.includes("- ")
    ) {
      return promptStr;
    }

    // Add basic markdown formatting
    // Split by double newlines to separate paragraphs
    const paragraphs = promptStr.split(/\n\n+/);

    // Convert the first paragraph to a heading if it's short
    if (paragraphs[0] && paragraphs[0].length < 100) {
      paragraphs[0] = `## ${paragraphs[0]}`;
    }

    // Process remaining paragraphs
    return paragraphs.join("\n\n");
  };

  // Component to display UI controls using the brand colors
  const UIControlsMock = ({ colors }: { colors: Color[] }) => {
    if (!colors || colors.length < 2) return null;

    const primaryColor = colors[0].hex;
    const accentColor = colors[1].hex;
    const textColor =
      colors.find((c) => c.usage.toLowerCase().includes("text"))?.hex ||
      "#333333";
    const backgroundColor =
      colors.find((c) => c.usage.toLowerCase().includes("background"))?.hex ||
      "#F5F5F5";

    return (
      <div className="mt-8 border rounded-lg p-6 bg-white shadow-sm">
        <h3
          className="text-lg font-semibold mb-4"
          style={{ color: primaryColor }}
        >
          UI Controls Preview
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Buttons */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Buttons</h4>
            <div className="space-y-2">
              <button
                className="w-full py-2 px-4 rounded-md font-medium text-white shadow-sm transition-colors"
                style={{
                  backgroundColor: primaryColor,
                  borderColor: primaryColor,
                }}
              >
                Primary Button
              </button>
              <button
                className="w-full py-2 px-4 rounded-md font-medium shadow-sm transition-colors border"
                style={{
                  color: primaryColor,
                  borderColor: primaryColor,
                  backgroundColor: "transparent",
                }}
              >
                Secondary Button
              </button>
              <button
                className="w-full py-2 px-4 rounded-md font-medium text-white shadow-sm transition-colors"
                style={{ backgroundColor: accentColor }}
              >
                Accent Button
              </button>
            </div>
          </div>

          {/* Form Controls */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Form Elements
            </h4>
            <div className="space-y-2">
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: textColor }}
                >
                  Text Input
                </label>
                <input
                  type="text"
                  className="w-full border rounded-md py-2 px-3 focus:ring-2 focus:outline-none transition-all"
                  placeholder="Enter text"
                  style={{
                    borderColor: `${primaryColor}40`,
                    backgroundColor: backgroundColor,
                  }}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="rounded"
                  style={{
                    accentColor: primaryColor,
                  }}
                />
                <span className="text-sm" style={{ color: textColor }}>
                  Checkbox
                </span>
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: textColor }}
                >
                  Select Menu
                </label>
                <select
                  className="w-full border rounded-md py-2 px-3 pr-8"
                  style={{
                    borderColor: `${primaryColor}40`,
                    backgroundColor: backgroundColor,
                    color: textColor,
                  }}
                >
                  <option>Option 1</option>
                  <option>Option 2</option>
                  <option>Option 3</option>
                </select>
              </div>
            </div>
          </div>

          {/* Additional UI Elements */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Alert/Card */}
            <div
              className="p-4 rounded-lg border-l-4 shadow-sm"
              style={{
                backgroundColor: `${primaryColor}10`,
                borderLeftColor: primaryColor,
              }}
            >
              <h5
                className="text-sm font-bold mb-1"
                style={{ color: primaryColor }}
              >
                Notification Alert
              </h5>
              <p className="text-sm" style={{ color: textColor }}>
                This is how your brand colors would appear in notification
                messages and alerts.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="flex flex-col justify-center">
              <h5
                className="text-sm font-bold mb-1"
                style={{ color: textColor }}
              >
                Progress Indicators
              </h5>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
                <div
                  className="h-2.5 rounded-full"
                  style={{
                    width: "75%",
                    backgroundColor: primaryColor,
                  }}
                ></div>
              </div>
              <div className="flex justify-between">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: primaryColor }}
                ></div>
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: accentColor }}
                ></div>
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: colors[2]?.hex || primaryColor }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-[6.6xl] mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      <div
        className="p-6 text-white"
        style={{
          backgroundColor: results.colorTheme?.colors?.[0]?.hex || "#333",
          color: results.colorTheme?.colors?.[1]?.hex || "white",
          backgroundImage: results.colorTheme?.colors
            ? `linear-gradient(135deg, ${
                results.colorTheme.colors[0].hex
              } 0%, ${
                results.colorTheme.colors.length > 1
                  ? results.colorTheme.colors[1].hex
                  : results.colorTheme.colors[0].hex
              } 100%)`
            : undefined,
        }}
      >
        <h2
          className="text-3xl font-bold mb-2"
          style={{
            color: "white",
            textShadow: "0px 1px 2px rgba(0,0,0,0.3)",
          }}
        >
          {formData?.brandName || results.brandName || "Your Brand"}{" "}
        </h2>
        <p
          className="text-gray-100"
          style={{
            maxWidth: "90%",
            lineHeight: "1.5",
          }}
        >
          {formData?.brandDescription ||
            results.brandDescription ||
            "Generating your brand identity"}
        </p>
      </div>

      {/* Tab Navigation */}
      <div
        className="flex border-b overflow-x-auto"
        style={{
          borderColor: results.colorTheme?.colors?.[0]?.hex || "#e5e7eb",
        }}
      >
        <button
          className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
            activeTab === "parameters"
              ? "border-b-2 text-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
          style={{
            borderColor:
              activeTab === "parameters"
                ? results.colorTheme?.colors?.[0]?.hex || "#3b82f6"
                : "transparent",
            color:
              activeTab === "parameters"
                ? results.colorTheme?.colors?.[0]?.hex || "#3b82f6"
                : undefined,
          }}
          onClick={() => setActiveTab("parameters")}
        >
          Parameters
        </button>
        <button
          className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
            activeTab === "colors"
              ? "border-b-2 text-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
          style={{
            borderColor:
              activeTab === "colors"
                ? results.colorTheme?.colors?.[0]?.hex || "#3b82f6"
                : "transparent",
            color:
              activeTab === "colors"
                ? results.colorTheme?.colors?.[0]?.hex || "#3b82f6"
                : undefined,
          }}
          onClick={() => setActiveTab("colors")}
        >
          Color Palette {!isSectionLoaded.colorTheme && "⏳"}
        </button>
        <button
          className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
            activeTab === "fonts"
              ? "border-b-2 text-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
          style={{
            borderColor:
              activeTab === "fonts"
                ? results.colorTheme?.colors?.[0]?.hex || "#3b82f6"
                : "transparent",
            color:
              activeTab === "fonts"
                ? results.colorTheme?.colors?.[0]?.hex || "#3b82f6"
                : undefined,
          }}
          onClick={() => setActiveTab("fonts")}
        >
          Typography {!isSectionLoaded.fonts && "⏳"}
        </button>
        <button
          className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
            activeTab === "logo"
              ? "border-b-2 text-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
          style={{
            borderColor:
              activeTab === "logo"
                ? results.colorTheme?.colors?.[0]?.hex || "#3b82f6"
                : "transparent",
            color:
              activeTab === "logo"
                ? results.colorTheme?.colors?.[0]?.hex || "#3b82f6"
                : undefined,
          }}
          onClick={() => setActiveTab("logo")}
        >
          Logo Prompt {!isSectionLoaded.logoPrompt && "⏳"}
        </button>
        <button
          className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
            activeTab === "images"
              ? "border-b-2 text-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
          style={{
            borderColor:
              activeTab === "images"
                ? results.colorTheme?.colors?.[0]?.hex || "#3b82f6"
                : "transparent",
            color:
              activeTab === "images"
                ? results.colorTheme?.colors?.[0]?.hex || "#3b82f6"
                : undefined,
          }}
          onClick={() => setActiveTab("images")}
        >
          Image Prompts {!isSectionLoaded.imagePrompts && "⏳"}
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Color Palette Tab */}
        {activeTab === "colors" && (
          <>
            {isSectionLoaded.colorTheme && results.colorTheme ? (
              <div>
                <h3
                  className="text-xl font-semibold mb-4"
                  style={{ color: results.colorTheme.colors[0].hex }}
                >
                  Color Palette - {results.colorTheme.schemeType}
                </h3>

                {/* Gradient display of all colors */}
                {results.colorTheme.colors.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-2">Color Flow</p>
                    <div
                      className="h-12 w-full rounded-lg shadow-inner"
                      style={{
                        background: `linear-gradient(to right, ${results.colorTheme.colors
                          .map((c) => c.hex)
                          .join(", ")})`,
                      }}
                    ></div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {results.colorTheme.colors.map((color, index) => (
                    <div
                      key={index}
                      className="border rounded-lg overflow-hidden shadow-sm"
                      style={{
                        borderColor: color.hex,
                        borderWidth: "1px",
                      }}
                    >
                      <div
                        className="h-24 w-full"
                        style={{ backgroundColor: color.hex }}
                      ></div>
                      <div className="p-3">
                        <h4 className="font-medium">{color.name}</h4>
                        <div className="flex items-center mb-1">
                          <p className="text-sm text-gray-600 mr-2">
                            {color.hex}
                          </p>
                          <button
                            onClick={() =>
                              copyToClipboard(color.hex, `color-hex-${index}`)
                            }
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded px-2 py-1 focus:outline-none transition-colors"
                            title="Copy hex code"
                          >
                            {copiedText === `color-hex-${index}` ? (
                              <span className="text-green-600">Copied!</span>
                            ) : (
                              <span>Copy</span>
                            )}
                          </button>
                        </div>
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <span className="mr-2">({color.rgb})</span>
                          <button
                            onClick={() =>
                              copyToClipboard(color.rgb, `color-rgb-${index}`)
                            }
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded px-2 py-1 focus:outline-none transition-colors"
                            title="Copy RGB value"
                          >
                            {copiedText === `color-rgb-${index}` ? (
                              <span className="text-green-600">Copied!</span>
                            ) : (
                              <span>Copy</span>
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {color.usage}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* UI Controls Mock using the brand colors */}
                <UIControlsMock colors={results.colorTheme.colors} />
              </div>
            ) : (
              <ColorPaletteSkeleton />
            )}
          </>
        )}

        {/* Typography Tab */}
        {activeTab === "fonts" && (
          <>
            {isSectionLoaded.fonts && results.fonts ? (
              <div>
                <h3
                  className="text-xl font-semibold mb-4"
                  style={{ color: results.colorTheme?.colors?.[0]?.hex }}
                >
                  Typography Selection
                </h3>
                {Array.isArray(results.fonts) && results.fonts.length > 0 ? (
                  <div className="space-y-6">
                    {results.fonts.map((font, index) => {
                      console.log(`Rendering font ${index}:`, font);

                      // Check if we have the original format (before normalization)
                      const isOriginalFormat =
                        font.font_name &&
                        font.font_style &&
                        font.usage_recommendation &&
                        font.reasoning;

                      // Get properties from either format
                      const fontName =
                        font.name || font.font_name || "Unknown Font";
                      const fontStyle =
                        font.style || font.font_style || "Not specified";
                      const fontUsage =
                        font.usage ||
                        font.usage_recommendation ||
                        "Not specified";
                      const fontRationale =
                        font.rationale ||
                        font.reasoning ||
                        "No rationale provided";

                      // Check if all required properties are available in some form
                      const hasRequiredProperties =
                        fontName !== "Unknown Font" &&
                        fontStyle !== "Not specified" &&
                        fontUsage !== "Not specified" &&
                        fontRationale !== "No rationale provided";

                      return (
                        <div key={index} className="border rounded-lg p-4">
                          <h4
                            className="text-lg font-bold mb-1"
                            style={{
                              fontFamily: getFontFamilyValue(
                                fontName,
                                fontStyle
                              ),
                            }}
                          >
                            {fontName}
                          </h4>
                          <div className="mb-2">
                            <FontPreview
                              fontName={fontName}
                              fontStyle={fontStyle}
                            />
                          </div>
                          <p className="text-sm font-medium mb-1">
                            Usage: {fontUsage}
                          </p>
                          <p className="text-sm text-gray-700">
                            {fontRationale}
                          </p>
                          {!hasRequiredProperties && (
                            <div className="mt-3 p-2 bg-yellow-50 text-yellow-700 text-xs rounded">
                              <p>
                                Warning: This font entry may be missing some
                                required properties.
                              </p>
                              <p className="font-mono mt-1">
                                Raw data: {JSON.stringify(font)}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-md">
                    <p className="text-yellow-700 mb-2">
                      <strong>Debug Info:</strong> Font data is available but
                      appears to be in an unexpected format or is empty.
                    </p>
                    <p className="text-yellow-600 text-sm">
                      <strong>Data received:</strong>{" "}
                      {JSON.stringify(results.fonts)}
                    </p>
                    <p className="text-yellow-600 text-sm mt-2">
                      <strong>Expected format:</strong> Array of font objects
                      with properties: name, style, usage, rationale
                    </p>
                    <p className="text-gray-600 text-sm mt-4">
                      If you're seeing this message, the application may need to
                      normalize the font data format. Please check the API
                      response format and update the data handling in App.tsx.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <TypographySkeleton />
            )}
          </>
        )}

        {/* Logo Prompt Tab */}
        {activeTab === "logo" && (
          <>
            {isSectionLoaded.logoPrompt && results.logoPrompt ? (
              <div>
                <h3
                  className="text-xl font-semibold mb-4"
                  style={{ color: results.colorTheme?.colors?.[0]?.hex }}
                >
                  Logo Design Prompt
                </h3>

                <div className="border rounded-lg overflow-hidden shadow-md">
                  <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
                    <h4 className="text-lg font-medium text-gray-800">
                      Logo Prompt
                    </h4>
                    <button
                      onClick={() =>
                        copyToClipboard(getLogoPromptText(), "logo")
                      }
                      className="flex items-center px-3 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 rounded border border-blue-200 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4 mr-1"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
                        />
                      </svg>
                      {copiedText === "logo" ? "Copied!" : "Copy"}
                    </button>
                  </div>

                  <div className="p-4 bg-white">
                    {typeof results.logoPrompt.prompt === "string" ? (
                      // String-based prompt with markdown formatting
                      <div className="prose prose-sm max-w-none text-gray-700 prose-headings:font-bold prose-headings:text-gray-800 prose-headings:pb-1 prose-headings:mb-3 prose-p:my-2 prose-strong:text-gray-900 prose-strong:font-semibold prose-li:my-1">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {formatStringPrompt(results.logoPrompt.prompt)}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      // Legacy format: structured prompt with sections using markdown
                      <div className="space-y-4">
                        {/* Render overall goal if available */}
                        {(results.logoPrompt.prompt as StructuredLogoPrompt)
                          .overallGoal && (
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-bold text-lg mb-2 text-gray-800 border-b pb-1">
                              Overall Goal
                            </h4>
                            <div className="prose prose-sm max-w-none text-gray-700 prose-headings:font-bold prose-headings:text-gray-800 prose-p:my-2 prose-strong:text-gray-900 prose-strong:font-semibold prose-li:my-1">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {ensureString(
                                  (
                                    results.logoPrompt
                                      .prompt as StructuredLogoPrompt
                                  ).overallGoal
                                )}
                              </ReactMarkdown>
                            </div>
                          </div>
                        )}
                        {/* Render all sections */}
                        {(
                          results.logoPrompt.prompt as StructuredLogoPrompt
                        ).sections?.map(
                          (section: LogoPromptSection, idx: number) => (
                            <div
                              key={idx}
                              className="bg-gray-50 p-4 rounded-lg"
                            >
                              <h4 className="font-bold text-lg mb-2 text-gray-800 border-b pb-1">
                                {section.title}
                              </h4>
                              <div className="prose prose-sm max-w-none text-gray-700 prose-headings:font-bold prose-headings:text-gray-800 prose-p:my-2 prose-strong:text-gray-900 prose-strong:font-semibold prose-li:my-1">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {ensureString(section.details)}
                                </ReactMarkdown>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-gray-50 border-t flex items-center">
                    <span className="mr-2">Primary Color:</span>
                    <div
                      className="w-6 h-6 rounded-full border"
                      style={{
                        backgroundColor: results.logoPrompt.primaryColor,
                      }}
                    ></div>
                    <span className="ml-2 text-sm text-gray-600">
                      {results.logoPrompt.primaryColor}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <LogoPromptSkeleton />
            )}
          </>
        )}

        {/* Image Prompts Tab */}
        {activeTab === "images" && (
          <>
            {isSectionLoaded.imagePrompts && results.imagePrompts ? (
              <div>
                <h3
                  className="text-xl font-semibold mb-4"
                  style={{ color: results.colorTheme?.colors?.[0]?.hex }}
                >
                  Brand Image Prompts
                </h3>
                <div className="space-y-8">
                  {(() => {
                    let imagePrompts = getImagePromptsArray();
                    console.log("Initial imagePrompts:", imagePrompts);

                    // NEW CASE: Handle the scenario where we have a single object with title "images" and a prompt that is a JSON string array
                    if (
                      imagePrompts.length === 1 &&
                      imagePrompts[0] &&
                      imagePrompts[0].title === "images" &&
                      typeof imagePrompts[0].prompt === "string" &&
                      imagePrompts[0].prompt.startsWith("[{")
                    ) {
                      try {
                        console.log(
                          "Detected nested JSON string array in prompt field"
                        );
                        const parsedPrompts = JSON.parse(
                          imagePrompts[0].prompt
                        );
                        if (Array.isArray(parsedPrompts)) {
                          console.log(
                            "Successfully parsed nested prompt JSON into array of",
                            parsedPrompts.length,
                            "items"
                          );
                          imagePrompts = parsedPrompts;
                        }
                      } catch (e) {
                        console.error(
                          "Error parsing nested JSON in prompt field:",
                          e
                        );
                      }
                    }
                    // Handle other cases (direct JSON string)
                    else if (
                      imagePrompts.length === 1 &&
                      typeof imagePrompts[0] === "string" &&
                      imagePrompts[0].startsWith("[{")
                    ) {
                      try {
                        const parsedPrompts = JSON.parse(imagePrompts[0]);
                        if (Array.isArray(parsedPrompts)) {
                          imagePrompts = parsedPrompts;
                          console.log(
                            "Successfully parsed JSON string into array:",
                            imagePrompts
                          );
                        }
                      } catch (e) {
                        console.error("Error parsing JSON string:", e);
                      }
                    }

                    return imagePrompts.map(
                      (imagePrompt: any, index: number) => {
                        console.log("Rendering image prompt:", imagePrompt);

                        // Check if this prompt has the expected structure
                        if (!imagePrompt) {
                          console.error(
                            "Invalid image prompt (null or undefined)"
                          );
                          return null;
                        }

                        // Handle different possible structures
                        let title = "";
                        let prompt = "";

                        if (typeof imagePrompt === "string") {
                          // If it's just a string, use it as the prompt
                          prompt = imagePrompt;
                          title = `Prompt ${index + 1}`;
                        } else if (typeof imagePrompt === "object") {
                          // Get title and prompt from object
                          title = imagePrompt.title || `Prompt ${index + 1}`;
                          prompt =
                            imagePrompt.prompt ||
                            JSON.stringify(imagePrompt, null, 2);
                        }

                        if (!prompt) {
                          console.error(
                            "Empty prompt in image prompt:",
                            imagePrompt
                          );
                          return null;
                        }

                        return (
                          <div
                            key={index}
                            className="border rounded-lg overflow-hidden shadow-md"
                          >
                            <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
                              <h4 className="text-lg font-medium text-gray-800">
                                {title}
                              </h4>
                              <button
                                onClick={() =>
                                  copyToClipboard(prompt, `image-${index}`)
                                }
                                className="flex items-center px-3 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 rounded border border-blue-200 transition-colors"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                  className="w-4 h-4 mr-1"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
                                  />
                                </svg>
                                {copiedText === `image-${index}`
                                  ? "Copied!"
                                  : "Copy"}
                              </button>
                            </div>
                            <div className="p-4 bg-white">
                              <p className="text-gray-700 whitespace-pre-line">
                                {prompt}
                              </p>
                            </div>
                          </div>
                        );
                      }
                    );
                  })()}
                </div>
              </div>
            ) : (
              <ImagePromptsSkeleton />
            )}
          </>
        )}

        {/* Parameters Tab */}
        {activeTab === "parameters" && (
          <div>
            <h3
              className="text-xl font-semibold mb-4"
              style={{ color: results.colorTheme?.colors?.[0]?.hex }}
            >
              Initial Parameters
            </h3>
            <div className="border rounded-lg overflow-hidden shadow-md">
              <div className="bg-gray-50 p-3 border-b">
                <h4 className="text-lg font-medium text-gray-800">
                  Brand Generation Parameters
                </h4>
              </div>
              <div className="p-4 space-y-4 bg-white">
                <div>
                  <h5 className="text-sm font-semibold text-gray-500 mb-1">
                    Brand Name
                  </h5>
                  <p className="text-gray-800 text-lg font-medium">
                    {formData?.brandName ||
                      results.brandName ||
                      "Not specified"}
                  </p>
                </div>

                <div>
                  <h5 className="text-sm font-semibold text-gray-500 mb-1">
                    Brand Description
                  </h5>
                  <p className="text-gray-700 whitespace-pre-line">
                    {formData?.brandDescription ||
                      results.brandDescription ||
                      "Not specified"}
                  </p>
                </div>

                {(formData?.colorSchemeType ||
                  formData?.baseColor ||
                  formData?.mood) && (
                  <div className="border-t pt-4 mt-4">
                    <h5 className="text-sm font-semibold text-gray-500 mb-3">
                      Additional Parameters
                    </h5>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {formData?.colorSchemeType && (
                        <div className="border rounded-md p-3 bg-gray-50">
                          <h6 className="text-xs font-semibold text-gray-500 mb-1">
                            Color Scheme Type
                          </h6>
                          <p className="text-gray-800 capitalize">
                            {formData.colorSchemeType}
                          </p>
                        </div>
                      )}

                      {formData?.baseColor && (
                        <div className="border rounded-md p-3 bg-gray-50">
                          <h6 className="text-xs font-semibold text-gray-500 mb-1">
                            Base Color
                          </h6>
                          <div className="flex items-center">
                            <div
                              className="w-5 h-5 rounded-full border mr-2"
                              style={{ backgroundColor: formData.baseColor }}
                            ></div>
                            <p className="text-gray-800">
                              {formData.baseColor}
                            </p>
                          </div>
                        </div>
                      )}

                      {formData?.mood && (
                        <div className="border rounded-md p-3 bg-gray-50">
                          <h6 className="text-xs font-semibold text-gray-500 mb-1">
                            Brand Mood
                          </h6>
                          <p className="text-gray-800 capitalize">
                            {formData.mood}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsDisplay;

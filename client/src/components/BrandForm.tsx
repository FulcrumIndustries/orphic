import { useState } from "react";

interface BrandFormProps {
  onSubmit: (
    brandName: string,
    brandDescription: string,
    colorSchemeType?: string,
    baseColor?: string,
    mood?: string
  ) => void;
  isLoading: boolean;
}

// Color scheme types
const colorSchemeTypes = [
  { value: "complementary", label: "Complementary" },
  { value: "analogous", label: "Analogous" },
  { value: "triadic", label: "Triadic" },
  { value: "monochromatic", label: "Monochromatic" },
  { value: "split-complementary", label: "Split Complementary" },
  { value: "tetradic", label: "Tetradic" },
];

// Mood options
const moodOptions = [
  { value: "", label: "Auto (derive from description)" },
  { value: "professional", label: "Professional" },
  { value: "playful", label: "Playful" },
  { value: "luxurious", label: "Luxurious" },
  { value: "energetic", label: "Energetic" },
  { value: "calm", label: "Calm" },
  { value: "sophisticated", label: "Sophisticated" },
  { value: "fresh", label: "Fresh" },
  { value: "trustworthy", label: "Trustworthy" },
  { value: "creative", label: "Creative" },
];

const BrandForm = ({ onSubmit, isLoading }: BrandFormProps) => {
  const [brandName, setBrandName] = useState("");
  const [brandDescription, setBrandDescription] = useState("");
  const [colorSchemeType, setColorSchemeType] = useState("complementary");
  const [baseColor, setBaseColor] = useState("");
  const [mood, setMood] = useState("");
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
    baseColor?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: {
      name?: string;
      description?: string;
      baseColor?: string;
    } = {};

    if (!brandName.trim()) {
      newErrors.name = "Brand name is required";
    }

    if (!brandDescription.trim()) {
      newErrors.description = "Brand description is required";
    } else if (brandDescription.trim().length < 15) {
      newErrors.description =
        "Please provide a more detailed description (at least 15 characters)";
    }

    // Validate base color if provided (should be a valid hex color)
    if (baseColor && !baseColor.match(/^#([0-9A-F]{3}){1,2}$/i)) {
      newErrors.baseColor = "Please enter a valid hex color (e.g., #3498db)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(brandName, brandDescription, colorSchemeType, baseColor, mood);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Create Your Brand Identity
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="brandName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Brand Name
          </label>
          <input
            type="text"
            id="brandName"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md ${
              errors.name ? "border-red-500" : "border-gray-300"
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="Enter your brand name"
            disabled={isLoading}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-500">{errors.name}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="brandDescription"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Brand Description
          </label>
          <textarea
            id="brandDescription"
            value={brandDescription}
            onChange={(e) => setBrandDescription(e.target.value)}
            rows={5}
            className={`w-full px-3 py-2 border rounded-md ${
              errors.description ? "border-red-500" : "border-gray-300"
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="Describe your brand's mission, values, target audience, and personality..."
            disabled={isLoading}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-500">{errors.description}</p>
          )}
        </div>

        <div>
          <button
            type="button"
            className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          >
            {showAdvancedOptions ? "Hide" : "Show"} Color Options ▾
          </button>
        </div>

        {showAdvancedOptions && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-md">
            <div>
              <label
                htmlFor="colorSchemeType"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Color Scheme Type
              </label>
              <select
                id="colorSchemeType"
                value={colorSchemeType}
                onChange={(e) => setColorSchemeType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                {colorSchemeTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="baseColor"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Base Color (optional)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  id="colorPicker"
                  value={baseColor || "#ffffff"}
                  onChange={(e) => setBaseColor(e.target.value)}
                  className="h-10 w-10 border border-gray-300 rounded cursor-pointer"
                  disabled={isLoading}
                />
                <input
                  type="text"
                  id="baseColor"
                  value={baseColor}
                  onChange={(e) => setBaseColor(e.target.value)}
                  className={`flex-1 px-3 py-2 border rounded-md ${
                    errors.baseColor ? "border-red-500" : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="#3498db (hex color)"
                  disabled={isLoading}
                />
              </div>
              {errors.baseColor && (
                <p className="mt-1 text-sm text-red-500">{errors.baseColor}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="mood"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Mood (optional)
              </label>
              <select
                id="mood"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                {moodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <button
          type="submit"
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            isLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          }`}
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Generate Brand Identity"}
        </button>
      </form>
    </div>
  );
};

export default BrandForm;

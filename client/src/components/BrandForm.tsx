import { useState } from "react";
import { motion } from "framer-motion";
import {
  ExclamationCircleIcon,
  PaintBrushIcon,
  SparklesIcon,
  IdentificationIcon,
  DocumentTextIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/solid";

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
  { value: "split-complementary", label: "Split" },
  { value: "tetradic", label: "Tetradic" },
];

// Mood options
const moodOptions = [
  { value: "", label: "Auto" },
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

// --- Reusable Styled Radio Component - Compact version ---
interface StyledRadioOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface StyledRadioGroupProps {
  options: StyledRadioOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  name: string;
  disabled?: boolean;
  columns?: number; // New prop for customizable columns
}

const StyledRadioGroup = ({
  options,
  selectedValue,
  onChange,
  name,
  disabled,
  columns = 5, // Default to 5 columns
}: StyledRadioGroupProps) => {
  // Use direct tailwind classes for grid columns instead of template string
  // This helps with proper class generation
  const getGridColsClass = () => {
    switch (columns) {
      case 2:
        return "grid-cols-2";
      case 3:
        return "grid-cols-3";
      case 4:
        return "grid-cols-4";
      case 5:
        return "grid-cols-5";
      case 6:
        return "grid-cols-6";
      default:
        return "grid-cols-5";
    }
  };

  return (
    <div className={`grid ${getGridColsClass()} gap-2`}>
      {options.map((option) => (
        <label
          key={option.value}
          className={`
            relative flex flex-col items-center justify-center p-2 border rounded-md cursor-pointer text-center text-xs transition-all duration-200 ease-in-out
            ${
              selectedValue === option.value
                ? "border-purple-500 ring-1 ring-purple-500/30 bg-purple-900/20"
                : "border-gray-700 hover:border-gray-500"
            }
            ${disabled ? "opacity-60 cursor-not-allowed" : ""}
          `}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={selectedValue === option.value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute opacity-0 w-0 h-0"
            disabled={disabled}
          />
          <span className="font-medium text-gray-200">{option.label}</span>
        </label>
      ))}
    </div>
  );
};

// FormSection component for consistent section styling
const FormSection = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="mb-4">
    <div className="flex items-center mb-2 pb-1 border-b border-gray-700">
      <div className="text-purple-400 mr-2">{icon}</div>
      <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">
        {title}
      </h3>
    </div>
    <div className="pl-1">{children}</div>
  </div>
);

const BrandForm = ({ onSubmit, isLoading }: BrandFormProps) => {
  const [brandName, setBrandName] = useState("");
  const [brandDescription, setBrandDescription] = useState("");
  const [colorSchemeType, setColorSchemeType] = useState("complementary");
  const [baseColor, setBaseColor] = useState("");
  const [mood, setMood] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
    baseColor?: string;
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};
    if (!brandName.trim()) newErrors.name = "Brand name is required";
    if (!brandDescription.trim())
      newErrors.description = "Brand description is required";
    else if (brandDescription.trim().length < 15)
      newErrors.description =
        "Please provide a more detailed description (at least 15 characters)";

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
    <div className="relative w-full bg-gray-900/70 text-white backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-400"></div>

      <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Left Column - Brand Identity Basics */}
            <div>
              <FormSection
                title="Brand Identity"
                icon={<IdentificationIcon className="h-4 w-4" />}
              >
                <div className="space-y-3">
                  {/* Brand Name */}
                  <div>
                    <label
                      htmlFor="brandName"
                      className="block text-sm font-medium text-gray-300 mb-1"
                    >
                      Brand Name
                    </label>
                    <input
                      type="text"
                      id="brandName"
                      value={brandName}
                      onChange={(e) => {
                        setBrandName(e.target.value);
                        errors.name && validateForm();
                      }}
                      className={`w-full px-3 py-2 text-sm bg-gray-800 border rounded-md focus:outline-none focus:ring-1 ${
                        errors.name
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-700 focus:border-purple-500 focus:ring-purple-500"
                      }`}
                      placeholder="e.g., Nova Solutions"
                      disabled={isLoading}
                    />
                    {errors.name && <InputError message={errors.name} />}
                  </div>

                  {/* Brand Description */}
                  <div>
                    <label
                      htmlFor="brandDescription"
                      className="block text-sm font-medium text-gray-300 mb-1 flex items-center"
                    >
                      <DocumentTextIcon className="h-4 w-4 mr-1 text-gray-400 inline" />
                      Brand Description
                    </label>
                    <textarea
                      id="brandDescription"
                      value={brandDescription}
                      rows={3}
                      onChange={(e) => {
                        setBrandDescription(e.target.value);
                        errors.description && validateForm();
                      }}
                      className={`w-full px-3 py-2 text-sm bg-gray-800 border rounded-md focus:outline-none focus:ring-1 ${
                        errors.description
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-700 focus:border-purple-500 focus:ring-purple-500"
                      }`}
                      placeholder="Describe your brand's mission, values, target audience..."
                      disabled={isLoading}
                    />
                    {errors.description && (
                      <InputError message={errors.description} />
                    )}
                  </div>

                  {/* Color Scheme Type - Moved here from the right column */}
                  <div className="pt-1">
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Color Scheme Type
                    </label>
                    <StyledRadioGroup
                      name="colorSchemeType"
                      options={colorSchemeTypes}
                      selectedValue={colorSchemeType}
                      onChange={setColorSchemeType}
                      disabled={isLoading}
                      columns={3}
                    />
                  </div>
                </div>
              </FormSection>
            </div>

            {/* Right Column - Visual Style */}
            <div>
              <FormSection
                title="Visual Style"
                icon={<PaintBrushIcon className="h-4 w-4" />}
              >
                <div className="space-y-3">
                  {/* Brand Mood - Moved from left column */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      <SparklesIcon className="h-4 w-4 mr-1 text-gray-400 inline" />
                      Brand Mood (optional)
                    </label>
                    <StyledRadioGroup
                      name="mood"
                      options={moodOptions}
                      selectedValue={mood}
                      onChange={setMood}
                      disabled={isLoading}
                      columns={2}
                    />
                  </div>

                  {/* Base Color */}
                  <div className="pt-1">
                    <label
                      htmlFor="baseColor"
                      className="block text-sm font-medium text-gray-300 mb-1"
                    >
                      Base Color (optional)
                    </label>
                    <div className="flex items-center space-x-2 bg-gray-800 border border-gray-700 rounded-md px-3 py-2 focus-within:ring-1 focus-within:ring-purple-500 focus-within:border-purple-500">
                      <input
                        type="color"
                        id="colorPicker"
                        value={
                          baseColor.match(/^#([0-9A-F]{3}){1,2}$/i)
                            ? baseColor
                            : "#8b5cf6"
                        }
                        onChange={(e) => {
                          setBaseColor(e.target.value);
                          errors.baseColor && validateForm();
                        }}
                        className="h-6 w-6 p-0 border-none rounded cursor-pointer flex-shrink-0 bg-transparent"
                        disabled={isLoading}
                      />
                      <input
                        type="text"
                        id="baseColor"
                        value={baseColor}
                        onChange={(e) => {
                          setBaseColor(e.target.value);
                          errors.baseColor && validateForm();
                        }}
                        className={`flex-1 p-0 border-none focus:ring-0 text-sm bg-transparent ${
                          errors.baseColor ? "text-red-400" : "text-gray-300"
                        }`}
                        placeholder="#8b5cf6 or leave blank"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.baseColor && (
                      <InputError message={errors.baseColor} isStatic />
                    )}
                  </div>
                </div>
              </FormSection>
            </div>
          </div>

          {/* Submit Button - Full Width */}
          <motion.button
            type="submit"
            className={`w-full py-3 px-4 text-base font-bold rounded-md text-white mt-5 ${
              isLoading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            } focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-lg transform transition-all duration-200`}
            disabled={isLoading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                Generate Brand Identity
                <ChevronRightIcon className="h-4 w-4 ml-2" />
              </div>
            )}
          </motion.button>
        </form>
      </div>
    </div>
  );
};

// Helper component for input errors
const InputError = ({
  message,
  isStatic = false,
}: {
  message: string;
  isStatic?: boolean;
}) => {
  if (isStatic) {
    return (
      <p className="mt-0.5 text-xs text-red-400 flex items-center">
        <ExclamationCircleIcon className="h-3 w-3 mr-1 inline" /> {message}
      </p>
    );
  }
  return (
    <motion.p
      className="mt-0.5 text-xs text-red-400 flex items-center"
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <ExclamationCircleIcon className="h-3 w-3 mr-1 inline" /> {message}
    </motion.p>
  );
};

export default BrandForm;

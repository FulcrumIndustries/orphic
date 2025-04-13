import React, { useEffect, useState } from "react";

interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  circleOneStroke?: string;
  circleTwoStroke?: string;
  baseColor?: string;
}

const CircularProgressBar: React.FC<CircularProgressProps> = ({
  progress,
  size = 180,
  strokeWidth = 12,
  circleOneStroke = "rgba(255, 255, 255, 0.2)",
  circleTwoStroke = "#FF6B00", // Default orange color
  baseColor,
}) => {
  const [progressValue, setProgressValue] = useState(0);

  // Calculate values for the progress circle
  const innerSize = size - 36; // Size of the inner SVG with progress circle
  const innerCenter = innerSize / 2;
  const innerRadius = innerCenter - strokeWidth / 2;
  const circumference = 2 * Math.PI * innerRadius;
  const fillPercent = (progressValue * circumference) / 100;
  const gradientOffset = circumference - fillPercent;

  // Generate a unique ID for the gradient
  const gradientId = `circleGradient-${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  // Define dynamic color based on baseColor prop or use default
  const getGradientColors = () => {
    if (baseColor) {
      return {
        color1: baseColor,
        color2: baseColor,
        color3: baseColor,
      };
    }

    // Default color gradient based on progress
    if (progress < 33) {
      return {
        color1: "#f07e6e", // Red-Orange
        color2: "#84cdfa", // Light Blue
        color3: "#5ad1cd", // Teal
      };
    } else if (progress < 66) {
      return {
        color1: "#FF4500", // OrangeRed
        color2: "#9370DB", // Medium Purple
        color3: "#20B2AA", // Light Sea Green
      };
    } else {
      return {
        color1: "#FF1493", // DeepPink
        color2: "#7B68EE", // Medium Slate Blue
        color3: "#00FA9A", // Medium Spring Green
      };
    }
  };

  const gradientColors = getGradientColors();

  // Animate progress value
  useEffect(() => {
    // Smooth animation for progress changes
    const timer = setInterval(() => {
      setProgressValue((prev) => {
        // Move 1% at a time toward target
        if (prev < progress) {
          return Math.min(prev + 1, progress);
        } else if (prev > progress) {
          return Math.max(prev - 1, progress);
        }
        clearInterval(timer);
        return prev;
      });
    }, 10);

    return () => clearInterval(timer);
  }, [progress]);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Base layer with gradient */}
      <div
        className="absolute w-full h-full rounded-full"
        style={{
          background: `linear-gradient(${gradientColors.color1}, ${gradientColors.color2}, ${gradientColors.color3})`,
          animation: "rotate 1.2s linear infinite",
        }}
      ></div>

      {/* Blurred layers for glow effect */}
      <div
        className="absolute w-full h-full rounded-full"
        style={{
          background: `linear-gradient(${gradientColors.color1}, ${gradientColors.color2}, ${gradientColors.color3})`,
          filter: "blur(5px)",
          animation: "rotate 1.2s linear infinite",
        }}
      ></div>
      <div
        className="absolute w-full h-full rounded-full"
        style={{
          background: `linear-gradient(${gradientColors.color1}, ${gradientColors.color2}, ${gradientColors.color3})`,
          filter: "blur(10px)",
          animation: "rotate 1.2s linear infinite",
        }}
      ></div>
      <div
        className="absolute w-full h-full rounded-full"
        style={{
          background: `linear-gradient(${gradientColors.color1}, ${gradientColors.color2}, ${gradientColors.color3})`,
          filter: "blur(25px)",
          animation: "rotate 1.2s linear infinite",
        }}
      ></div>

      {/* Inner circle - dark gray with white border */}
      <div
        className="absolute rounded-full bg-gray-800 z-10"
        style={{
          width: size - 20,
          height: size - 20,
          top: "10px",
          left: "10px",
          border: "10px solid white",
        }}
      ></div>

      {/* Progress circle */}
      <div
        className="absolute z-10"
        style={{
          width: innerSize,
          height: innerSize,
          top: `${(size - innerSize) / 2}px`,
          left: `${(size - innerSize) / 2}px`,
        }}
      >
        <svg
          className="transform -rotate-90"
          width={innerSize}
          height={innerSize}
          viewBox={`0 0 ${innerSize} ${innerSize}`}
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={gradientColors.color1} />
              <stop offset="50%" stopColor={gradientColors.color2} />
              <stop offset="100%" stopColor={gradientColors.color3} />
            </linearGradient>
          </defs>

          {/* Background circle */}
          <circle
            className="transition-all duration-300 ease-in-out"
            cx={innerCenter}
            cy={innerCenter}
            r={innerRadius}
            strokeWidth={strokeWidth}
            stroke={circleOneStroke}
            fill="transparent"
          />

          {/* Progress circle */}
          <circle
            className="transition-all duration-300 ease-in-out"
            cx={innerCenter}
            cy={innerCenter}
            r={innerRadius}
            strokeWidth={strokeWidth}
            stroke={`url(#${gradientId})`}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={gradientOffset}
            fill="transparent"
          />
        </svg>
      </div>

      {/* Percentage text */}
      <div className="absolute flex items-center justify-center text-white font-bold z-20">
        <span className="text-3xl">{progressValue}</span>
        <span className="text-xl">%</span>
      </div>

      {/* Global keyframes animation for rotation */}
      <style jsx global>{`
        @keyframes rotate {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default CircularProgressBar;

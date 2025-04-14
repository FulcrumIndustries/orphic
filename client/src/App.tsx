import { useState, useEffect, useRef, useCallback } from "react";
import BrandForm from "./components/BrandForm";
import StatusPanel from "./components/StatusPanel";
import ResultsDisplay from "./components/ResultsDisplay";
import ColorfulPerlinNoiseSwirl from "./components/ColorfulPerlinNoiseSwirl";
import "./index.css";

// Define the partial results type
interface PartialResults {
  brandName?: string;
  brandDescription?: string;
  colorTheme?: any;
  fonts?: any;
  logoPrompt?: any;
  imagePrompts?: any;
  [key: string]: any;
}

// Define the socket outside of the component to prevent multiple connections
// let socket: any;

function App() {
  const [currentView, setCurrentView] = useState<
    "form" | "processing" | "results" | "preview"
  >("form");
  const [processingStatus, setProcessingStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [results, setResults] = useState<any | null>(null);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [timeElapsed, setTimeElapsed] = useState<string | null>(null);
  const [autoReconnect, setAutoReconnect] = useState<boolean>(true);
  const [partialResults, setPartialResults] = useState<PartialResults>({});
  const [status, setStatus] = useState<string>("");
  const [timeStarted, setTimeStarted] = useState<Date | null>(null);
  const [colors, setColors] = useState<string[]>([]);
  const [gradients, setGradients] = useState<any[]>([]);
  const [fontPairs, setFontPairs] = useState<any[]>([]);
  const [logoPrompt, setLogoPrompt] = useState<string>("");
  const [formData, setFormData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tasksArray, setTasksArray] = useState<any[]>([]);

  // Track all SSE events for debugging
  const sseEventsRef = useRef<
    Array<{ time: string; data: any; timestamp: Date }>
  >([]);

  // Debug function to log all events when complete
  const logAllEvents = useCallback(() => {
    console.log("=== ALL RECORDED SSE EVENTS ===");
    sseEventsRef.current.forEach((event, i) => {
      console.log(`Event #${i + 1} at ${event.timestamp.toISOString()}:`);
      console.log(`  Status: ${event.data.status || "N/A"}`);
      console.log(`  Progress: ${event.data.progress || "N/A"}`);
      console.log(`  Time: ${event.data.time || "N/A"}`);
      console.log(`  Completed: ${event.data.completed || false}`);
    });
    console.log("=== END OF SSE EVENTS LOG ===");
  }, []);

  // Check for saved jobId on component mount
  useEffect(() => {
    // Don't auto-reconnect if the user has disabled it
    if (!autoReconnect) {
      console.log("Auto-reconnect is disabled, skipping job check");
      return;
    }

    const savedJobId = localStorage.getItem("brandJobId");
    if (savedJobId) {
      console.log(`Retrieved saved jobId from localStorage: ${savedJobId}`);

      // Try to retrieve the saved form data for this job
      const savedFormData = localStorage.getItem(`formData_${savedJobId}`);
      if (savedFormData) {
        try {
          const parsedFormData = JSON.parse(savedFormData);
          console.log(
            `Retrieved form data for jobId ${savedJobId}:`,
            parsedFormData
          );
          setFormData(parsedFormData);
        } catch (error) {
          console.error("Error parsing saved form data:", error);
        }
      }

      // Verify if the job is still valid before reconnecting
      async function checkJobValidity() {
        try {
          // Try to fetch status for this job
          const url = `http://localhost:5000/api/results/${savedJobId}`;
          console.log(`Checking if job is valid: ${url}`);
          const response = await fetch(url);

          // If we get a 404, the job doesn't exist anymore
          if (response.status === 404) {
            console.log(
              `Job ${savedJobId} no longer exists, removing from localStorage`
            );
            localStorage.removeItem("brandJobId");
            return;
          }

          // Job exists, set the jobId
          setJobId(savedJobId);

          // If we get a 200, the job is complete and we can show results
          if (response.status === 200) {
            const data = await response.json();
            if (data.success && data.results) {
              console.log(
                `Job ${savedJobId} is already complete, showing results`
              );
              setResults(data.results);
              setCurrentView("results");
              return;
            }
          }

          // If we're here, the job exists but isn't complete
          // If we're on the form view, attempt to reconnect to that job
          if (currentView === "form") {
            console.log(`Reconnecting to existing job: ${savedJobId}`);
            setCurrentView("processing");
            setProcessingStatus("Reconnecting to previous job...");
            setProgress(10);

            // Setup SSE connection to check status
            if (savedJobId) {
              connectToSSE(savedJobId);
            }
          }
        } catch (error) {
          console.error("Error checking job validity:", error);
          // On any error, clear the localStorage as a safety measure
          localStorage.removeItem("brandJobId");
          // Also clear any related form data
          localStorage.removeItem(`formData_${savedJobId}`);
        }
      }

      // Execute the check
      checkJobValidity();
    }
  }, [autoReconnect, currentView]);

  // Save jobId to localStorage whenever it changes
  useEffect(() => {
    if (jobId) {
      console.log(`Saving jobId to localStorage: ${jobId}`);
      localStorage.setItem("brandJobId", jobId);

      // Save form data along with jobId if available
      if (formData) {
        console.log(`Saving form data to localStorage for jobId: ${jobId}`);
        localStorage.setItem(`formData_${jobId}`, JSON.stringify(formData));
      }
    } else {
      console.log("Clearing jobId from localStorage");
      localStorage.removeItem("brandJobId");
    }
  }, [jobId, formData]);

  // Function to establish SSE connection
  const connectToSSE = (id: string) => {
    if (!id) {
      console.error("Cannot connect SSE: No job ID provided");
      return;
    }

    // Close any existing connection
    if (eventSource) {
      console.log("Closing existing SSE connection before creating a new one");
      eventSource.close();
      setEventSource(null);
    }

    try {
      console.log(`Creating new EventSource connection for jobId: ${id}`);
      const sseUrl = `http://localhost:5000/api/status?jobId=${id}`;
      console.log("SSE URL:", sseUrl);

      // Create a new EventSource connection
      const sse = new EventSource(sseUrl);

      // Store it immediately to prevent race conditions
      setEventSource(sse);

      // Initial connection status
      setProcessingStatus("Connecting to server...");

      // Listen for connection open
      sse.onopen = () => {
        console.log("SSE connection opened successfully");
        setProcessingStatus((prev) =>
          prev === "Connecting to server..." ||
          prev === "Reconnecting to previous job..."
            ? "Connected to server, waiting for job status..."
            : prev
        );
      };

      // Listen for updates
      sse.onmessage = (event) => {
        console.log("SSE message received:", event.data);
        try {
          const data = JSON.parse(event.data);
          console.log("Parsed SSE update:", data);

          // Special debug for image prompts
          if (data.status && data.status.includes("Image prompts created")) {
            console.log("❗ DETECTED IMAGE PROMPTS CREATED EVENT ❗");
            console.log("Status:", data.status);
            console.log("Progress:", data.progress);
            console.log("Time:", data.time);
            console.log("Completed:", data.completed);
          }

          // Record this event for debugging
          sseEventsRef.current.push({
            time: new Date().toISOString(),
            data: data,
            timestamp: new Date(),
          });

          // Store jobId from message if available
          if (data.jobId && !jobId) {
            console.log(`Received jobId from SSE: ${data.jobId}`);
            setJobId(data.jobId);
          }

          // Immediately update status and progress if provided
          if (data.status) {
            console.log(`Setting status: "${data.status}"`);
            setProcessingStatus(data.status);
            setStatus(data.status);
          }

          if (typeof data.progress === "number") {
            console.log(`Setting progress: ${data.progress}%`);
            setProgress(data.progress);
          }

          // Store the tasks array if available
          if (data.tasks && Array.isArray(data.tasks)) {
            console.log(
              `Received ${data.tasks.length} tasks from server:`,
              data.tasks
            );
            setTasksArray(data.tasks);
          }

          // Store the time value from SSE message if available
          if (data.time) {
            console.log(
              `Time value from SSE: ${data.time} (${typeof data.time})`
            );

            // Ensure it's treated as a string to avoid precision issues
            const timeStr = String(data.time);
            console.log(`Using time: ${timeStr}`);

            // Don't add "s" suffix - StatusPanel expects just the number
            setTimeElapsed(timeStr);
          }

          // Update partial results based on progress
          if (data.progress >= 30 && !partialResults.colorTheme) {
            fetchPartialResult(id, "colorTheme");
          }
          if (data.progress >= 50 && !partialResults.fonts) {
            fetchPartialResult(id, "fonts");
          }
          if (data.progress >= 70 && !partialResults.logoPrompt) {
            fetchPartialResult(id, "logoPrompt");
          }
          if (data.progress >= 90 && !partialResults.imagePrompts) {
            fetchPartialResult(id, "imagePrompts");
          }

          // When processing is complete, fetch the results
          if (data.completed) {
            console.log("Processing complete, fetching results");

            // Log all SSE events for debugging
            logAllEvents();

            // First check if we received a jobId in this message
            if (data.jobId) {
              console.log(`Using jobId from SSE message: ${data.jobId}`);
              fetchResults(data.jobId);
            }
            // Then fall back to the stored jobId
            else if (jobId) {
              console.log(`Using stored jobId for results: ${jobId}`);
              fetchResults(jobId);
            } else {
              console.error("No jobId available in state to fetch results");
              setProcessingStatus(
                "Error: No job ID available to fetch results"
              );
            }
          }
        } catch (error) {
          console.error("Error parsing SSE message:", error);
        }
      };

      sse.onerror = (error) => {
        console.error("SSE connection error:", error);
        // Don't close the connection on every error, as it might be recoverable
        if (sse.readyState === EventSource.CLOSED) {
          console.log("SSE connection is closed");
          setProcessingStatus((prev) =>
            prev.includes("Error") ? prev : "Error: Connection closed"
          );
        } else if (sse.readyState === EventSource.CONNECTING) {
          console.log("SSE connection is trying to reconnect");
          setProcessingStatus((prev) =>
            prev.includes("Error") ? prev : "Reconnecting..."
          );
        }
      };

      return sse;
    } catch (error) {
      console.error("Error creating SSE connection:", error);
      setProcessingStatus(
        `Error: Failed to connect to server - ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return null;
    }
  };

  // Handle form submission
  const handleSubmit = async (
    brandName: string,
    brandDescription: string,
    colorSchemeType?: string,
    baseColor?: string,
    mood?: string
  ) => {
    try {
      // Store the form data to be used in the results view
      setFormData({
        brandName,
        brandDescription,
        colorSchemeType,
        baseColor,
        mood,
      });

      // Reset any partial results from previous runs
      setPartialResults({
        brandName: brandName,
        brandDescription: brandDescription,
      });

      setCurrentView("processing");
      setProcessingStatus("Submitting request...");
      setProgress(5);

      console.log("Submitting brand request:", {
        brandName,
        brandDescription,
        colorSchemeType,
        baseColor,
        mood,
      });

      // API call to start processing
      const response = await fetch("http://localhost:5000/api/brand", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName: brandName,
          companyDescription: brandDescription,
          colorSchemeType: colorSchemeType || "complementary",
          baseColor: baseColor || "",
          mood: mood || "",
        }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Brand request response:", data);

      if (!data.success) {
        throw new Error(data.message || "Failed to start processing");
      }

      setJobId(data.jobId);
      setProcessingStatus("Processing started...");
      setProgress(10);

      // Establish SSE connection for real-time updates
      connectToSSE(data.jobId);
    } catch (error) {
      console.error("Error submitting brand info:", error);
      setProcessingStatus(
        `Error: ${
          error instanceof Error
            ? error.message
            : "Failed to start processing. Please try again."
        }`
      );
    }
  };

  // Handle event data from SSE
  const handleEventData = (data: any) => {
    console.log("Received SSE event data:", data);

    if (data.status) {
      setStatus(data.status);
      setProcessingStatus(data.status);
    }

    if (data.progress) {
      setProgress(data.progress);
    }

    // If the job has completed
    if (data.complete && data.jobId) {
      console.log("Job completed, fetching full results");

      // Ensure we've fetched final results
      if (data.jobId) {
        fetchResults(data.jobId);

        // Save the time information if provided
        if (data.time) {
          const timeStr = String(data.time);
          setTimeElapsed(timeStr);
        }
      }
    }

    // Handle partial results
    if (
      data.progress &&
      data.jobId &&
      ((data.progress >= 30 && !partialResults.colorTheme) ||
        (data.progress >= 50 && !partialResults.fonts) ||
        (data.progress >= 70 && !partialResults.logoPrompt) ||
        (data.progress >= 90 && !partialResults.imagePrompts))
    ) {
      // Determine which partial results to fetch based on progress
      if (data.progress >= 30 && !partialResults.colorTheme) {
        console.log("Fetching partial result: colorTheme");
        fetchPartialResult(data.jobId, "colorTheme");
      }
      if (data.progress >= 50 && !partialResults.fonts) {
        console.log("Fetching partial result: fonts");
        fetchPartialResult(data.jobId, "fonts");
      }
      if (data.progress >= 70 && !partialResults.logoPrompt) {
        console.log("Fetching partial result: logoPrompt");
        fetchPartialResult(data.jobId, "logoPrompt");
      }
      if (data.progress >= 90 && !partialResults.imagePrompts) {
        console.log("Fetching partial result: imagePrompts");
        fetchPartialResult(data.jobId, "imagePrompts");
      }
    }
  };

  // Function to fetch final results
  const fetchResults = async (id: string) => {
    if (!id) return;

    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:5000/api/results/${id}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.results) {
          console.log("Retrieved results:", data.results);

          // Process imagePrompts if present
          if (data.results.imagePrompts) {
            // ... existing code for imagePrompts ...
          }

          // Process fonts if present
          if (data.results.fonts) {
            let fontsData = data.results.fonts;

            // Parse if it's a string
            if (typeof fontsData === "string") {
              try {
                fontsData = JSON.parse(fontsData);
                console.log("Parsed fonts from JSON string:", fontsData);
              } catch (e) {
                console.error("Error parsing fonts JSON:", e);
              }
            }

            // Ensure it's an array
            if (!Array.isArray(fontsData)) {
              fontsData = [fontsData];
            }

            // Normalize font data fields to match expected interface
            data.results.fonts = fontsData.map((font: any) => {
              // Create a normalized object that will have both formats
              let normalizedFont: any = { ...font };

              // Handle the specific format from the example
              if (
                font.font_name &&
                font.font_style &&
                font.usage_recommendation &&
                font.reasoning
              ) {
                console.log(
                  "Detected specific font format from example, normalizing:",
                  font
                );
                // Assign values to the standard keys
                normalizedFont.name = font.font_name;
                normalizedFont.style = font.font_style;
                normalizedFont.usage = font.usage_recommendation;
                normalizedFont.rationale = font.reasoning;

                // Keep the original properties as well for maximum compatibility
                // (already there since we spread the original font object)
              } else {
                // General normalization - when using standard keys
                // Also assign values to the legacy format for compatibility
                normalizedFont.name = font.name || font.font_name || "";
                normalizedFont.style = font.style || font.font_style || "";
                normalizedFont.usage =
                  font.usage || font.usage_recommendation || "";
                normalizedFont.rationale =
                  font.rationale || font.reasoning || "";

                // Ensure the legacy properties are also set
                normalizedFont.font_name = normalizedFont.name;
                normalizedFont.font_style = normalizedFont.style;
                normalizedFont.usage_recommendation = normalizedFont.usage;
                normalizedFont.reasoning = normalizedFont.rationale;
              }

              console.log("Final normalized font object:", normalizedFont);
              return normalizedFont;
            });

            console.log(
              "Normalized fonts data in complete results:",
              data.results.fonts
            );
          }

          setResults(data.results);

          // Also update partial results with the full data
          const updatedPartialResults: PartialResults = {};
          Object.keys(data.results).forEach((key) => {
            updatedPartialResults[key] = data.results[key];
          });
          setPartialResults(updatedPartialResults);
        }
      }
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch partial results for a specific section
  const fetchPartialResult = async (id: string, section: string) => {
    if (!id) return;

    try {
      const url = `http://localhost:5000/api/results/${id}?section=${section}`;
      console.log(`Fetching partial results for ${section} from: ${url}`);

      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.results) {
          console.log(
            `Retrieved partial results for ${section}:`,
            data.results[section]
          );

          // Special handling for imagePrompts to ensure it's an array
          if (section === "imagePrompts") {
            let imagePromptsData = data.results[section];

            // Log the data structure for debugging
            console.log("Image prompts data type:", typeof imagePromptsData);
            console.log("Is Array?", Array.isArray(imagePromptsData));

            // Parse if it's a string
            if (typeof imagePromptsData === "string") {
              try {
                imagePromptsData = JSON.parse(imagePromptsData);
                console.log(
                  "Parsed imagePrompts from JSON string:",
                  imagePromptsData
                );
              } catch (e) {
                console.error("Error parsing imagePrompts JSON:", e);
              }
            }

            // Handle the case where imagePrompts is an array with a single item that is the actual array
            if (
              Array.isArray(imagePromptsData) &&
              imagePromptsData.length === 1 &&
              Array.isArray(imagePromptsData[0])
            ) {
              console.log(
                "imagePrompts is an array containing another array, extracting inner array"
              );
              imagePromptsData = imagePromptsData[0];
            }

            // Ensure it's an array
            const imagePromptsArray = Array.isArray(imagePromptsData)
              ? imagePromptsData
              : [imagePromptsData];

            console.log(
              "Final imagePrompts array structure:",
              imagePromptsArray
            );

            // Update the partial results
            setPartialResults((prev: PartialResults) => ({
              ...prev,
              [section]: imagePromptsArray,
            }));
          }
          // Special handling for fonts to normalize field names
          else if (section === "fonts") {
            let fontsData = data.results[section];
            console.log("Initial fonts data received:", fontsData);

            // Parse if it's a string
            if (typeof fontsData === "string") {
              try {
                fontsData = JSON.parse(fontsData);
                console.log("Parsed fonts from JSON string:", fontsData);
              } catch (e) {
                console.error("Error parsing fonts JSON:", e);
              }
            }

            // Ensure it's an array
            if (!Array.isArray(fontsData)) {
              fontsData = [fontsData];
              console.log("Wrapped non-array font data in array:", fontsData);
            }

            // Normalize font data fields to match expected interface
            const normalizedFonts = fontsData.map((font: any) => {
              // Create a normalized object that will have both formats
              let normalizedFont: any = { ...font };

              // Handle the specific format from the example
              if (
                font.font_name &&
                font.font_style &&
                font.usage_recommendation &&
                font.reasoning
              ) {
                console.log(
                  "Detected specific font format from example, normalizing:",
                  font
                );
                // Assign values to the standard keys
                normalizedFont.name = font.font_name;
                normalizedFont.style = font.font_style;
                normalizedFont.usage = font.usage_recommendation;
                normalizedFont.rationale = font.reasoning;

                // Keep the original properties as well for maximum compatibility
                // (already there since we spread the original font object)
              } else {
                // General normalization - when using standard keys
                // Also assign values to the legacy format for compatibility
                normalizedFont.name = font.name || font.font_name || "";
                normalizedFont.style = font.style || font.font_style || "";
                normalizedFont.usage =
                  font.usage || font.usage_recommendation || "";
                normalizedFont.rationale =
                  font.rationale || font.reasoning || "";

                // Ensure the legacy properties are also set
                normalizedFont.font_name = normalizedFont.name;
                normalizedFont.font_style = normalizedFont.style;
                normalizedFont.usage_recommendation = normalizedFont.usage;
                normalizedFont.reasoning = normalizedFont.rationale;
              }

              console.log("Final normalized font object:", normalizedFont);
              return normalizedFont;
            });

            console.log("Normalized fonts data:", normalizedFonts);

            // Update the partial results - make sure we're setting a valid array
            if (normalizedFonts && normalizedFonts.length > 0) {
              console.log("Setting fonts in partialResults:", normalizedFonts);
              setPartialResults((prev: PartialResults) => ({
                ...prev,
                [section]: normalizedFonts,
              }));
            } else {
              console.error("No valid font data to set after normalization");
            }
          } else {
            // For other sections, handle normally
            setPartialResults((prev: PartialResults) => ({
              ...prev,
              [section]: data.results[section],
            }));
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching partial results for ${section}:`, error);
    }
  };

  // Cleanup SSE connection when component unmounts
  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [eventSource]);

  // Reset the app to start a new brand
  const handleReset = () => {
    setCurrentView("form");
    setProcessingStatus("");
    setProgress(0);

    // Store the jobId before clearing it to remove the associated form data
    const currentJobId = jobId;
    setJobId(null);
    setResults(null);
    setTimeElapsed(null);
    setPartialResults({});
    setFormData(null);

    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }

    // Clear localStorage
    localStorage.removeItem("brandJobId");
    if (currentJobId) {
      localStorage.removeItem(`formData_${currentJobId}`);
    }
  };

  // Calculate time elapsed
  useEffect(() => {
    if (!timeStarted) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - timeStarted.getTime();
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeElapsed(`${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeStarted]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-0 py-0 relative">
      {/* Background Animation */}
      <div className="absolute inset-0 z-0 opacity-70">
        <ColorfulPerlinNoiseSwirl />
      </div>

      <div className="w-full max-w-6xl relative z-10">
        {currentView === "form" && (
          <div className="text-center mb-6">
            <h1
              className="text-8xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-white via-blue-300 to-purple-500 mb-0 leading-none"
              style={{
                textShadow:
                  "0 0 15px rgba(139, 92, 246, 0.5), 0 0 30px rgba(96, 165, 250, 0.3)",
              }}
            >
              ORPHIC
            </h1>
            <p className="text-gray-400 text-sm mt-2 mb-6 font-light tracking-wide uppercase">
              AI-Powered Brand Identity Generator
            </p>
            <BrandForm onSubmit={handleSubmit} isLoading={false} />
            <div className="mt-2 flex justify-center items-center">
              <label className="flex items-center space-x-2 text-xs text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoReconnect}
                  onChange={(e) => setAutoReconnect(e.target.checked)}
                  className="form-checkbox h-3 w-3 text-purple-600"
                />
                <span>Remember in-progress jobs</span>
              </label>
            </div>
          </div>
        )}

        {currentView === "processing" && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-4">
                <StatusPanel
                  status={processingStatus}
                  progress={progress}
                  jobId={jobId || undefined}
                  timeElapsed={timeElapsed ? `${timeElapsed}s` : undefined}
                  handleReset={handleReset}
                  time={timeElapsed || undefined}
                  tasks={tasksArray}
                />
              </div>

              <div className="hidden lg:block lg:col-span-8">
                <ResultsDisplay
                  results={partialResults}
                  loading={isLoading}
                  progress={progress}
                  onReset={handleReset}
                  formData={formData}
                />
              </div>
            </div>

            <div className="mt-4 lg:hidden text-center">
              <button
                onClick={() => setCurrentView("preview")}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                View Live Preview
              </button>
            </div>
          </div>
        )}

        {currentView === "preview" && (
          <div>
            <ResultsDisplay
              results={partialResults}
              loading={isLoading}
              progress={progress}
              onReset={() => setCurrentView("processing")}
              formData={formData}
            />
            <div className="mt-4 text-center">
              <button
                onClick={() => setCurrentView("processing")}
                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors"
              >
                Back to Status
              </button>
            </div>
          </div>
        )}

        {currentView === "results" && results && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4">
              <StatusPanel
                status="Brand identity complete"
                progress={100}
                jobId={jobId || undefined}
                timeElapsed={timeElapsed ? `${timeElapsed}s` : undefined}
                handleReset={handleReset}
                brandName={formData?.brandName}
                brandDescription={formData?.brandDescription}
                colorSchemeType={formData?.colorSchemeType}
                baseColor={formData?.baseColor}
                mood={formData?.mood}
                time={timeElapsed || undefined}
                tasks={tasksArray}
              />
            </div>
            <div className="lg:col-span-8">
              <ResultsDisplay
                results={results}
                onReset={handleReset}
                colors={colors}
                gradients={gradients}
                fontPairs={fontPairs}
                logoPrompt={logoPrompt}
                formData={formData}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

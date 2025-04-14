import CircularProgressBar from "./CircularProgressBar";
import TaskList from "./TaskList";
import { useMemo, useEffect, useState, useRef } from "react";

interface StatusPanelProps {
  status: string;
  progress: number;
  jobId?: string;
  timeElapsed?: string;
  handleReset: () => void;
  brandName?: string;
  brandDescription?: string;
  colorSchemeType?: string;
  baseColor?: string;
  mood?: string;
  time?: string; // Optional time property from backend
  tasks?: Task[]; // New property: tasks array from SSE
}

interface Task {
  id: number;
  name: string;
  completed: boolean;
  time?: string;
}

// Interface for tracking SSE events
interface SSEEvent {
  status: string;
  progress: number;
  time?: string;
  completed?: boolean;
  timestamp: Date;
  tasks?: Task[];
}

/**
 * Removes timing information from a status message for cleaner display.
 */
const getCleanStatus = (text: string): string => {
  if (!text) return "";

  // Clean different formats of time reporting:
  // "Color themes generated - 147.7s"
  // "Brand identity complete - Total: 147.7s"
  return text
    .replace(/\s+-\s+\d+\.\d+s$/, "") // Pattern: " - 147.7s" at end of string
    .replace(/\s+-\s+Total:\s+\d+\.\d+s$/, "") // Pattern: " - Total: 147.7s" at end
    .replace(/:\s+\d+\.\d+s$/, "") // Pattern: ": 147.7s" at end of string
    .trim();
};

const StatusPanel = ({
  status,
  progress,
  jobId,
  timeElapsed,
  handleReset,
  brandName,
  brandDescription,
  colorSchemeType,
  baseColor,
  mood,
  time,
  tasks: propTasks,
}: StatusPanelProps) => {
  const [totalTime, setTotalTime] = useState<string>("");

  // Track all SSE events for debugging
  const sseEvents = useRef<SSEEvent[]>([]);

  // Log raw props for debugging
  useEffect(() => {
    console.log("StatusPanel props:", {
      status,
      progress,
      time: time ? `[${typeof time}] ${time}` : "undefined",
      tasks: propTasks?.length || 0,
    });
  }, [status, progress, time, propTasks]);

  // Add the current SSE event to our tracking array
  useEffect(() => {
    if (status) {
      const newEvent: SSEEvent = {
        status: status,
        progress: progress,
        time: time,
        completed: progress === 100,
        timestamp: new Date(),
        tasks: propTasks,
      };

      sseEvents.current.push(newEvent);
      console.log(`Added SSE event #${sseEvents.current.length}:`, newEvent);

      // If we reach 100%, log all received events
      if (progress === 100) {
        console.log("=== ALL SSE EVENTS ===");
        sseEvents.current.forEach((event, index) => {
          console.log(
            `Event #${index + 1}: Status="${event.status}", Progress=${
              event.progress
            }, Time=${event.time || "N/A"}, Tasks=${event.tasks?.length || 0}`
          );
        });
        console.log("=== END SSE EVENTS ===");
      }
    }
  }, [status, progress, time, propTasks]);

  // Update total time when the final task is completed
  useEffect(() => {
    if (propTasks && propTasks.length === 6) {
      const finalTask = propTasks.find((t) => t.id === 6);
      if (finalTask?.completed && finalTask?.time) {
        setTotalTime(finalTask.time);
      }
    }
  }, [propTasks]);

  // Use tasks from props or create default tasks if none provided
  const tasks = useMemo(() => {
    // If we have tasks from props, use them
    if (propTasks && propTasks.length > 0) {
      console.log(`Using ${propTasks.length} tasks from props`);
      return propTasks;
    }

    // Otherwise, create default tasks based on progress
    console.log("Creating default tasks based on progress");
    return [
      {
        id: 1,
        name: "Analyzing brand requirements",
        completed: progress >= 20,
        time: progress >= 20 ? "0.1s" : undefined,
      },
      {
        id: 2,
        name: "Generating color themes",
        completed: progress >= 30,
        time: undefined,
      },
      {
        id: 3,
        name: "Selecting font combinations",
        completed: progress >= 45,
        time: undefined,
      },
      {
        id: 4,
        name: "Creating logo prompt",
        completed: progress >= 70,
        time: undefined,
      },
      {
        id: 5,
        name: "Building image prompts",
        completed: progress >= 90,
        time: undefined,
      },
      {
        id: 6,
        name: "Finalizing brand package",
        completed: progress >= 100,
        time: undefined,
      },
    ];
  }, [propTasks, progress]);

  // Display status without timing information for cleaner UI
  const displayStatus = getCleanStatus(status);

  // Use actual brand name, defaulting to "Your Brand" if not available
  const displayBrandName = brandName || "Your Brand";

  // Create appropriate header text based on completion status
  const headerText =
    progress === 100
      ? `${displayBrandName} identity complete`
      : `Creating ${displayBrandName} identity`;

  return (
    <div className="w-full max-w-[360px] lg:max-w-full mx-auto bg-gray-800 rounded-lg shadow-lg p-4 lg:p-5 text-white">
      <h1
        className="text-3xl lg:text-5xl text-center font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-white via-blue-300 to-purple-500 mb-2 leading-none"
        style={{
          textShadow:
            "0 0 15px rgba(139, 92, 246, 0.5), 0 0 30px rgba(96, 165, 250, 0.3)",
        }}
      >
        ORPHIC
      </h1>
      <h2 className="text-xl lg:text-2xl font-bold mb-5 text-center">
        {headerText}
      </h2>

      <div className="mb-4">
        <div className="flex justify-center items-center">
          <CircularProgressBar progress={progress} baseColor={baseColor} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-center">
          <h3 className="text-md font-semibold mb-1">Current Status:</h3>
          <p className="text-md">
            {displayStatus || "Connecting to server..."}
          </p>

          <p className="text-xs text-gray-500 mt-1">
            {totalTime && (
              <span>
                Total time: <span className="text-green-300">{totalTime}</span>
              </span>
            )}
          </p>
        </div>

        <div className="mt-4 bg-gray-700 p-3 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-semibold text-white">
              Processing Steps
            </h3>
            <span className="text-xs text-gray-300">Time</span>
          </div>
          <TaskList tasks={tasks} />
        </div>
      </div>
      <div className="mt-4 flex justify-center gap-4">
        <button
          onClick={handleReset}
          className="px-3 py-1.5 text-sm font-semibold text-white bg-red-600 rounded hover:bg-red-500"
        >
          {progress === 100 ? "Start New" : "Cancel and Start New"}
        </button>
      </div>
      {jobId && (
        <div className="mt-2 text-center">
          <p className="text-xs font-mono text-gray-400 p-1 rounded truncate">
            Job ID: {jobId}
          </p>
        </div>
      )}
    </div>
  );
};

export default StatusPanel;

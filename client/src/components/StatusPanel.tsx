import BlobAnimation from "./BlobAnimation";
import TaskList from "./TaskList";
import { useMemo, useEffect, useState } from "react";
import { extractTimeFromStatus, getCleanStatus } from "../utils/timeUtils";

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
}

interface TaskWithTime extends Task {
  time?: string;
}

interface Task {
  id: number;
  name: string;
  completed: boolean;
  time?: string;
}

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
}: StatusPanelProps) => {
  const [taskTimes, setTaskTimes] = useState<Record<number, string>>({});
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [totalTime, setTotalTime] = useState<string>("");
  const [currentStepTime, setCurrentStepTime] = useState<string | null>(null);

  // Debug logging
  useEffect(() => {
    console.log(
      `StatusPanel update - status: "${status}", progress: ${progress}`
    );

    if (status) {
      setDebugInfo((prev) => [
        ...prev.slice(-4),
        `${new Date().toLocaleTimeString()}: ${getCleanStatus(
          status
        )} (${progress}%)`,
      ]);
    }
  }, [status, progress]);

  // Extract and handle time from status message
  useEffect(() => {
    if (status) {
      const extractedTime = extractTimeFromStatus(status);

      if (extractedTime) {
        setCurrentStepTime(extractedTime);

        // If no timeElapsed was provided, set it for task display
        if (!timeElapsed) {
          // Map the current progress to the appropriate task
          const progressToTaskMap: Record<number, number> = {
            30: 2, // Color themes complete - 30% progress
            50: 3, // Font selection complete - 50% progress
            70: 4, // Logo prompt complete - 70% progress
            90: 5, // Image prompts complete - 90% progress
            100: 6, // Finalizing complete - 100% progress
          };

          // Get the taskId corresponding to the current progress value
          const taskId = progressToTaskMap[progress];

          if (taskId && extractedTime) {
            console.log(`Setting time for task ${taskId}: ${extractedTime}`);
            setTaskTimes((prev) => {
              // Update the time for the completed task
              return { ...prev, [taskId]: extractedTime };
            });
          }
        }

        // Check if this is the total time
        if (progress === 100) {
          setTotalTime(extractedTime);
        }
      }
    }
  }, [status, progress, timeElapsed]);

  // Log when taskTimes changes
  useEffect(() => {
    console.log("Task times updated:", taskTimes);
  }, [taskTimes]);

  // Define tasks based on progress
  const tasks = useMemo(
    () => [
      {
        id: 1,
        name: "Analyzing brand requirements",
        completed: progress >= 20,
        time: taskTimes[1],
      },
      {
        id: 2,
        name: "Generating color themes",
        completed: progress >= 30,
        time: taskTimes[2],
      },
      {
        id: 3,
        name: "Selecting font combinations",
        completed: progress >= 50,
        time: taskTimes[3],
      },
      {
        id: 4,
        name: "Creating logo prompt",
        completed: progress >= 70,
        time: taskTimes[4],
      },
      {
        id: 5,
        name: "Building image prompts",
        completed: progress >= 90,
        time: taskTimes[5],
      },
      {
        id: 6,
        name: "Finalizing brand package",
        completed: progress >= 100,
        time: taskTimes[6],
      },
    ],
    [progress, taskTimes]
  );

  // Display status without timing information for cleaner UI
  const displayStatus = getCleanStatus(status);

  return (
    <div className="w-full max-w-[360px] lg:max-w-full mx-auto bg-gray-800 rounded-lg shadow-lg p-4 lg:p-5 text-white">
      <h2 className="text-xl lg:text-2xl font-bold mb-3 text-center">
        Creating {brandName} identity
      </h2>

      <div className="mb-4">
        <BlobAnimation progress={progress} baseColor={baseColor} />
      </div>

      <div className="space-y-3">
        <div className="text-center">
          <h3 className="text-md font-semibold mb-1">Current Status:</h3>
          <p className="text-md">
            {displayStatus || "Connecting to server..."}
          </p>
          {currentStepTime && (
            <p className="text-sm text-yellow-300 mt-1">
              <span className="text-gray-400">Time for this step:</span>{" "}
              {currentStepTime}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Progress: {progress}%
            {totalTime && (
              <span className="ml-2">
                Total time: <span className="text-green-300">{totalTime}</span>
              </span>
            )}
          </p>
        </div>

        <div className="w-full bg-gray-700 rounded-full h-3 mt-3">
          <div
            className="bg-gradient-to-r from-orange-500 to-red-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
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

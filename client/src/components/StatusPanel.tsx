import CircularProgressBar from "./CircularProgressBar";
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
  time?: string; // Optional time property from backend
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
  time,
}: StatusPanelProps) => {
  const [taskTimes, setTaskTimes] = useState<Record<number, string>>({});
  const [totalTime, setTotalTime] = useState<string>("");
  const [currentStepTime, setCurrentStepTime] = useState<string | null>(null);
  const [lastProgressValue, setLastProgressValue] = useState<number>(0);

  // Log status to console
  useEffect(() => {
    if (status) {
      console.log(
        `Status Update: "${getCleanStatus(status)}" (${progress}%) ${
          time ? `- ${time}s` : ""
        }`
      );
    }
  }, [status, progress, time]);

  // Handle time updates from the backend 'time' property
  useEffect(() => {
    if (time) {
      // Time property is available from backend - format as seconds
      const timeValue = `${time}s`;
      console.log(`Time value from backend: ${timeValue}`);

      // Map progress values to task IDs for completed tasks
      const progressToTaskMap: Record<number, number> = {
        30: 2, // Color themes complete - 30% progress
        45: 3, // Font selection complete - 45% progress
        70: 4, // Logo prompt complete - 70% progress
        90: 5, // Image prompts complete - 90% progress
        100: 6, // Finalizing complete - 100% progress
      };

      // Store time for the completed task based on progress
      const taskId = progressToTaskMap[progress];
      if (taskId) {
        console.log(
          `Setting time for task ${taskId} (progress ${progress}): ${timeValue}`
        );
        setTaskTimes((prev) => ({
          ...prev,
          [taskId]: timeValue,
        }));

        // If this is a completion event (has time), update current step time
        if (progress < 100) {
          // For tasks in progress, show their time
          setCurrentStepTime(timeValue);
        } else {
          // For the final task, set total time and clear current step time
          setCurrentStepTime(null);
          setTotalTime(timeValue);
        }
      }
    }
  }, [time, progress]);

  // Extract time from status message as fallback if 'time' property isn't provided
  useEffect(() => {
    if (status && !time) {
      const extractedTime = extractTimeFromStatus(status);
      if (extractedTime) {
        console.log(
          `Extracted time from status: ${extractedTime} (fallback method)`
        );

        // Direct mapping of specific status messages to task IDs
        const statusToTaskMap: Record<string, number> = {
          "Color themes generated": 2,
          "Fonts selected": 3,
          "Logo prompt created": 4,
          "Image prompts created": 5,
          "Brand identity complete": 6,
        };

        // Match status message to task ID
        const cleanStatus = getCleanStatus(status);
        for (const [statusText, taskId] of Object.entries(statusToTaskMap)) {
          if (cleanStatus.includes(statusText)) {
            console.log(
              `Status "${cleanStatus}" matches "${statusText}" - assigning to task ${taskId}`
            );
            setTaskTimes((prev) => ({
              ...prev,
              [taskId]: extractedTime,
            }));

            // Update current step time based on progress
            if (progress < 100) {
              setCurrentStepTime(extractedTime);
            } else {
              setCurrentStepTime(null);
              setTotalTime(extractedTime);
            }
          }
        }
      }
    }
  }, [status, time, progress]);

  // Define tasks based on progress and task times
  const tasks = useMemo(() => {
    const tasksList = [
      {
        id: 1,
        name: "Analyzing brand requirements",
        completed: progress >= 20,
        time: taskTimes[1] || (progress >= 20 ? "0.1s" : undefined), // Always show 0.1s for first task when completed
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
        completed: progress >= 45, // Updated to match backend progress value
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
    ];

    console.log(
      "Tasks with times:",
      tasksList.map((t) => ({
        id: t.id,
        name: t.name,
        completed: t.completed,
        time: t.time,
      }))
    );

    return tasksList;
  }, [progress, taskTimes]);

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
          {currentStepTime && progress < 100 && (
            <p className="text-sm text-yellow-300 mt-1">
              <span className="text-gray-400">Time for this step:</span>{" "}
              {currentStepTime}
            </p>
          )}
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

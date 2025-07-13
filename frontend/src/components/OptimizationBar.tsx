'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, MapPin, Truck, Calendar, Loader2 } from 'lucide-react';

interface OptimizationBarProps {
  includedJobs: number;
  totalWorkers: number;
  isOptimizing: boolean;
  canOptimize: boolean;
  onOptimize: () => void;
  scenarioDate?: Date;
  solverTime: number;
}

export function OptimizationBar({
  includedJobs,
  totalWorkers,
  isOptimizing,
  canOptimize,
  onOptimize,
  scenarioDate,
  solverTime,
}: OptimizationBarProps) {
  const [progress, setProgress] = useState<number>(0);
  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (isOptimizing) {
      setProgress(0);
      const start = Date.now();
      const totalMs = (solverTime) * 1000;
      timerId = setInterval(() => {
        const elapsed = Date.now() - start;
        const pct = Math.min((elapsed / totalMs) * 100, 99);
        setProgress(Math.floor(pct));
      }, 100);
    } else {
      setProgress(-1);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isOptimizing, solverTime]);
  // While optimizing, render only a progress bar
  if (isOptimizing) {
    return (
      <div className="px-3 py-2 bg-white border rounded-md shadow-sm w-xl">
        <div className="w-full bg-gray-200 relative h-2 rounded overflow-hidden">
          <div
            className="bg-sky-600 h-2 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 px-3 py-2 bg-white border rounded-md shadow-sm">
      {/* Metrics Display */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <MapPin className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium">{includedJobs}</span>
        </div>
        <div className="flex items-center gap-1">
          <Truck className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium">{totalWorkers}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-medium">
            {(scenarioDate || new Date()).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>
      {/* Optimization Button */}
      <Button
        onClick={onOptimize}
        disabled={isOptimizing || !canOptimize}
        size="sm"
        className="ml-auto cursor-pointer bg-sky-600 text-white hover:bg-sky-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {isOptimizing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

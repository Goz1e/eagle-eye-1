'use client';

import { useState } from 'react';

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onChange: (startDate: Date, endDate: Date) => void;
}

const PRESET_RANGES = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'Last 6 months', days: 180 },
  { label: 'Last year', days: 365 },
];

export function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  const [isCustom, setIsCustom] = useState(false);

  const handlePresetChange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    onChange(start, end);
    setIsCustom(false);
  };

  const handleCustomStartChange = (dateString: string) => {
    const newStartDate = new Date(dateString);
    if (newStartDate <= endDate) {
      onChange(newStartDate, endDate);
    }
  };

  const handleCustomEndChange = (dateString: string) => {
    const newEndDate = new Date(dateString);
    if (newEndDate >= startDate) {
      onChange(startDate, newEndDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
        📅 Date Range
      </h3>
      
      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2">
        {PRESET_RANGES.map((preset) => {
          const isActive = !isCustom && 
            Math.abs((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) - preset.days) < 1;
          
          return (
            <button
              key={preset.days}
              onClick={() => handlePresetChange(preset.days)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
        
        <button
          onClick={() => setIsCustom(true)}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            isCustom
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
          }`}
        >
          Custom Range
        </button>
      </div>

      {/* Custom Date Inputs */}
      {isCustom && (
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={formatDate(startDate)}
              onChange={(e) => handleCustomStartChange(e.target.value)}
              max={formatDate(endDate)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={formatDate(endDate)}
              onChange={(e) => handleCustomEndChange(e.target.value)}
              min={formatDate(startDate)}
              max={formatDate(new Date())}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* Selected Range Display */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        <span className="font-medium">Selected Range:</span>{' '}
        {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
        <span className="ml-2 text-gray-500">
          ({Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days)
        </span>
      </div>
    </div>
  );
}

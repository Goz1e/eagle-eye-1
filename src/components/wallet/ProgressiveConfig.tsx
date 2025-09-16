"use client";

import { useState, useCallback } from "react";
import { DateRangePicker } from "../ui/DateRangePicker";
import { TokenSelector } from "../ui/TokenSelector";
import { AnalysisOptions } from "../ui/AnalysisOptions";

interface ProgressiveConfigProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: AdvancedConfig) => void;
  initialConfig?: Partial<AdvancedConfig>;
}

export interface AdvancedConfig {
  timeRange: {
    type: "preset" | "custom";
    preset?: "7d" | "30d" | "90d" | "1y";
    custom?: { start: Date; end: Date };
  };
  analysisDepth: {
    type: "quick" | "detailed" | "comprehensive";
    includeGasMetrics: boolean;
    includeTradingStats: boolean;
    includeUSDConversions: boolean;
  };
  tokenSelection: {
    type: "all" | "apt-only" | "stablecoins" | "custom";
    customTokens?: string[];
  };
  performance: {
    enableCaching: boolean;
    parallelProcessing: boolean;
    maxConcurrentRequests: number;
  };
}

export function ProgressiveConfig({
  isOpen,
  onClose,
  onSave,
  initialConfig,
}: ProgressiveConfigProps) {
  const [config, setConfig] = useState<AdvancedConfig>({
    timeRange: {
      type: "preset",
      preset: "30d",
    },
    analysisDepth: {
      type: "detailed",
      includeGasMetrics: true,
      includeTradingStats: true,
      includeUSDConversions: true,
    },
    tokenSelection: {
      type: "all",
    },
    performance: {
      enableCaching: true,
      parallelProcessing: true,
      maxConcurrentRequests: 5,
    },
    ...initialConfig,
  });

  const [activeTab, setActiveTab] = useState<
    "basic" | "advanced" | "performance"
  >("basic");

  const handleSave = useCallback(() => {
    onSave(config);
    onClose();
  }, [config, onSave, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Advanced Configuration
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Fine-tune your analysis parameters
            </p>
          </div>
          <button
            title="Close"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {(["basic", "advanced", "performance"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {tab === "basic" && "📊 Basic Settings"}
              {tab === "advanced" && "⚙️ Advanced Options"}
              {tab === "performance" && "🚀 Performance"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === "basic" && (
            <div className="space-y-6">
              {/* Time Range Configuration */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Time Range
                </h3>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    {(["7d", "30d", "90d", "1y"] as const).map((preset) => (
                      <button
                        key={preset}
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            timeRange: { type: "preset", preset },
                          }))
                        }
                        className={`px-4 py-2 rounded-lg border transition-colors ${
                          config.timeRange.type === "preset" &&
                          config.timeRange.preset === preset
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500"
                        }`}
                      >
                        {preset === "7d"
                          ? "7 Days"
                          : preset === "30d"
                          ? "30 Days"
                          : preset === "90d"
                          ? "90 Days"
                          : "1 Year"}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      title="Custom Time"
                      type="checkbox"
                      id="custom-time"
                      checked={config.timeRange.type === "custom"}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          timeRange: {
                            type: e.target.checked ? "custom" : "preset",
                            preset: e.target.checked ? undefined : "30d",
                          },
                        }))
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor="custom-time"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Custom date range
                    </label>
                  </div>

                  {config.timeRange.type === "custom" && (
                    <DateRangePicker
                      startDate={
                        config.timeRange.custom?.start ||
                        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                      }
                      endDate={config.timeRange.custom?.end || new Date()}
                      onChange={(start, end) =>
                        setConfig((prev) => ({
                          ...prev,
                          timeRange: { type: "custom", custom: { start, end } },
                        }))
                      }
                    />
                  )}
                </div>
              </div>

              {/* Analysis Depth */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Analysis Depth
                </h3>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    {(["quick", "detailed", "comprehensive"] as const).map(
                      (depth) => (
                        <button
                          key={depth}
                          onClick={() =>
                            setConfig((prev) => ({
                              ...prev,
                              analysisDepth: {
                                ...prev.analysisDepth,
                                type: depth,
                              },
                            }))
                          }
                          className={`px-4 py-2 rounded-lg border transition-colors ${
                            config.analysisDepth.type === depth
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500"
                          }`}
                        >
                          {depth.charAt(0).toUpperCase() + depth.slice(1)}
                        </button>
                      )
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={config.analysisDepth.includeGasMetrics}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            analysisDepth: {
                              ...prev.analysisDepth,
                              includeGasMetrics: e.target.checked,
                            },
                          }))
                        }
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Include gas metrics
                      </span>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={config.analysisDepth.includeTradingStats}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            analysisDepth: {
                              ...prev.analysisDepth,
                              includeTradingStats: e.target.checked,
                            },
                          }))
                        }
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Include trading statistics
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Token Selection */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Token Selection
                </h3>
                <TokenSelector
                  selectedTokens={config.tokenSelection.customTokens || []}
                  onChange={(tokens) =>
                    setConfig((prev) => ({
                      ...prev,
                      tokenSelection: { type: "custom", customTokens: tokens },
                    }))
                  }
                />
              </div>
            </div>
          )}

          {activeTab === "advanced" && (
            <div className="space-y-6">
              <AnalysisOptions
                options={config.analysisDepth}
                onChange={(options) =>
                  setConfig((prev) => ({
                    ...prev,
                    analysisDepth: { ...prev.analysisDepth, ...options },
                  }))
                }
              />

              {/* Additional Advanced Features */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Data Processing
                </h3>
                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={config.analysisDepth.includeUSDConversions}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          analysisDepth: {
                            ...prev.analysisDepth,
                            includeUSDConversions: e.target.checked,
                          },
                        }))
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Include USD conversions (requires additional API calls)
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === "performance" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Performance Settings
                </h3>
                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={config.performance.enableCaching}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          performance: {
                            ...prev.performance,
                            enableCaching: e.target.checked,
                          },
                        }))
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Enable result caching
                    </span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={config.performance.parallelProcessing}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          performance: {
                            ...prev.performance,
                            parallelProcessing: e.target.checked,
                          },
                        }))
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Enable parallel processing
                    </span>
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Concurrent Requests
                    </label>
                    <select
                      title="Max Concurrent Requests"
                      value={config.performance.maxConcurrentRequests}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          performance: {
                            ...prev.performance,
                            maxConcurrentRequests: Number(e.target.value),
                          },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={3}>3 (Conservative)</option>
                      <option value={5}>5 (Balanced)</option>
                      <option value={8}>8 (Aggressive)</option>
                      <option value={10}>10 (Maximum)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}

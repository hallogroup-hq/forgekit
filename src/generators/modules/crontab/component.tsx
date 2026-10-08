"use client";

import React, { useState, useMemo } from "react";
import { Calendar, Info, AlertTriangle } from "lucide-react";
import { CopyButton } from "@/components/shared/CopyButton";
import {
  validateCronExpression,
  explainCron,
  calculateNextRuns,
} from "./engine";

export default function CrontabGenerator() {
  const [minute, setMinute] = useState("*/15");
  const [hour, setHour] = useState("*");
  const [dayOfMonth, setDayOfMonth] = useState("*");
  const [month, setMonth] = useState("*");
  const [dayOfWeek, setDayOfWeek] = useState("*");

  const cronString = `${minute.trim()} ${hour.trim()} ${dayOfMonth.trim()} ${month.trim()} ${dayOfWeek.trim()}`;

  const validation = useMemo(() => validateCronExpression(cronString), [cronString]);
  const humanExplanation = useMemo(() => explainCron(cronString), [cronString]);

  const nextRuns = useMemo(() => {
    if (!validation.valid) return [];
    const runs = calculateNextRuns(cronString, 5);
    return runs.map((d) =>
      d.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    );
  }, [cronString, validation.valid]);

  const applyPreset = (m: string, h: string, dom: string, mon: string, dow: string) => {
    setMinute(m);
    setHour(h);
    setDayOfMonth(dom);
    setMonth(mon);
    setDayOfWeek(dow);
  };

  return (
    <div className="space-y-6">
      {/* Expression Display Card */}
      <div className="p-6 md:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Cron Expression
            </span>
            <div className={`font-mono text-2xl md:text-3xl font-extrabold ${validation.valid ? "text-blue-600 dark:text-blue-400" : "text-amber-500"}`}>
              {cronString}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CopyButton
              text={cronString}
              label="Copy Expression"
              variant="primary"
              size="md"
              triggerConfetti
            />
          </div>
        </div>

        {/* Human Language Translation Box */}
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
          validation.valid
            ? "bg-blue-50/60 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-800/40"
            : "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-800/40"
        }`}>
          {validation.valid ? (
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          )}
          <div>
            <div className={`text-xs font-semibold ${validation.valid ? "text-blue-900 dark:text-blue-300" : "text-amber-900 dark:text-amber-300"}`}>
              {validation.valid ? "Natural Language Schedule:" : "Invalid Expression:"}
            </div>
            <div className={`text-sm mt-0.5 font-medium ${validation.valid ? "text-blue-800 dark:text-blue-200" : "text-amber-800 dark:text-amber-200"}`}>
              {validation.valid ? `“${humanExplanation}”` : validation.error}
            </div>
          </div>
        </div>
      </div>

      {/* Visual 5-Field Editor */}
      <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Visual Fields Configuration
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Minute (0-59)
            </label>
            <input
              type="text"
              value={minute}
              onChange={(e) => setMinute(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-center"
            />
            <span className="block text-[10px] text-zinc-400 text-center mt-1">e.g. *, */15, 0</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Hour (0-23)
            </label>
            <input
              type="text"
              value={hour}
              onChange={(e) => setHour(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-center"
            />
            <span className="block text-[10px] text-zinc-400 text-center mt-1">e.g. *, 9, */2</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Day (1-31)
            </label>
            <input
              type="text"
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-center"
            />
            <span className="block text-[10px] text-zinc-400 text-center mt-1">e.g. *, 1, 15</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Month (1-12)
            </label>
            <input
              type="text"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-center"
            />
            <span className="block text-[10px] text-zinc-400 text-center mt-1">e.g. *, 1-12</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Weekday (0-6)
            </label>
            <input
              type="text"
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-center"
            />
            <span className="block text-[10px] text-zinc-400 text-center mt-1">0=Sun, 1-5=Mon-Fri</span>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="pt-2">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
            Common Workflow Presets
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Every 15 min", m: "*/15", h: "*", dom: "*", mon: "*", dow: "*" },
              { label: "Hourly", m: "0", h: "*", dom: "*", mon: "*", dow: "*" },
              { label: "Daily at Midnight", m: "0", h: "0", dom: "*", mon: "*", dow: "*" },
              { label: "Every Weekday at 9am", m: "0", h: "9", dom: "*", mon: "*", dow: "1-5" },
              { label: "Weekly on Sunday", m: "0", h: "0", dom: "*", mon: "*", dow: "0" },
              { label: "Monthly on 1st", m: "0", h: "0", dom: "1", mon: "*", dow: "*" },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p.m, p.h, p.dom, p.mon, p.dow)}
                className="px-2.5 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Simulated Upcoming Executions */}
      <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <Calendar className="w-4 h-4 text-emerald-500" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Next 5 Scheduled Runs (Simulation)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
          {nextRuns.length > 0 ? (
            nextRuns.map((time, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center space-y-1"
              >
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  Run #{idx + 1}
                </span>
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 pt-1">
                  {time}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-5 text-center py-4 text-xs text-zinc-400 italic">
              Fix expression errors to view upcoming execution timestamps.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

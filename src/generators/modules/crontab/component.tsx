"use client";

import React, { useState, useMemo } from "react";
import { Calendar, Info } from "lucide-react";
import { CopyButton } from "@/components/shared/CopyButton";

export default function CrontabGenerator() {
  const [minute, setMinute] = useState("*/15");
  const [hour, setHour] = useState("*");
  const [dayOfMonth, setDayOfMonth] = useState("*");
  const [month, setMonth] = useState("*");
  const [dayOfWeek, setDayOfWeek] = useState("*");

  const cronString = `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;

  // Human readable explainer
  const humanExplanation = useMemo(() => {
    let desc = "Runs ";

    // Minute
    if (minute === "*") desc += "every minute ";
    else if (minute.startsWith("*/")) desc += `every ${minute.replace("*/", "")} minutes `;
    else desc += `at minute ${minute} `;

    // Hour
    if (hour === "*") {
      // every hour
    } else if (hour.startsWith("*/")) {
      desc += `every ${hour.replace("*/", "")} hours `;
    } else {
      desc += `past hour ${hour}:00 `;
    }

    // Days of month
    if (dayOfMonth !== "*") desc += `on day ${dayOfMonth} of the month `;

    // Month
    if (month !== "*") desc += `in month ${month} `;

    // Day of week
    if (dayOfWeek === "*") {
      // all days
    } else if (dayOfWeek === "1-5") {
      desc += "on every weekday (Mon-Fri)";
    } else if (dayOfWeek === "0,6" || dayOfWeek === "6,0") {
      desc += "on weekends (Sat-Sun)";
    } else {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      desc += `on ${days[Number(dayOfWeek)] || `day ${dayOfWeek}`}`;
    }

    return desc.trim() + ".";
  }, [minute, hour, dayOfMonth, month, dayOfWeek]);

  // Compute next 5 simulated upcoming execution times
  const [nextRuns, setNextRuns] = useState<string[]>([]);

  React.useEffect(() => {
    const list: string[] = [];
    const now = new Date();

    // Simple forward simulation
    let cur = new Date(now.getTime() + 60000);
    cur.setSeconds(0);
    cur.setMilliseconds(0);

    let attempts = 0;
    while (list.length < 5 && attempts < 10000) {
      attempts++;
      const m = cur.getMinutes();
      const h = cur.getHours();
      const dom = cur.getDate();
      const mon = cur.getMonth() + 1;
      const dow = cur.getDay();

      const matchMinute = minute === "*" || (minute.startsWith("*/") && m % Number(minute.slice(2)) === 0) || Number(minute) === m;
      const matchHour = hour === "*" || (hour.startsWith("*/") && h % Number(hour.slice(2)) === 0) || Number(hour) === h;
      const matchDom = dayOfMonth === "*" || Number(dayOfMonth) === dom;
      const matchMon = month === "*" || Number(month) === mon;
      const matchDow = dayOfWeek === "*" || (dayOfWeek === "1-5" && dow >= 1 && dow <= 5) || Number(dayOfWeek) === dow;

      if (matchMinute && matchHour && matchDom && matchMon && matchDow) {
        list.push(cur.toLocaleString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }));
      }

      cur = new Date(cur.getTime() + 60000); // add 1 minute
    }

    setNextRuns(list);
  }, [minute, hour, dayOfMonth, month, dayOfWeek]);

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
      <div className="p-6 md:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Cron Expression
            </span>
            <div className="font-mono text-2xl md:text-3xl font-extrabold text-blue-600 dark:text-blue-400">
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
        <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-blue-900 dark:text-blue-300">
              Natural Language Meaning:
            </div>
            <div className="text-sm text-blue-800 dark:text-blue-200 mt-0.5 font-medium">
              &ldquo;{humanExplanation}&rdquo;
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
          {nextRuns.map((time, idx) => (
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
          ))}
        </div>
      </div>
    </div>
  );
}

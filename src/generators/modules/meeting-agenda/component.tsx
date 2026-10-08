"use client";

import React, { useState, useMemo } from "react";
import { Plus, Trash2, CalendarCheck, Clock, CheckCircle2, Download } from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";

interface AgendaTopic {
  id: string;
  title: string;
  durationMin: number;
  leader: string;
}

interface ActionItem {
  id: string;
  task: string;
  assignee: string;
  deadline: string;
}

export default function MeetingAgendaGenerator() {
  const [meetingTitle, setMeetingTitle] = useState("Product Architecture & Q3 Roadmap Alignment");
  const [date, setDate] = useState("2026-10-08");

  React.useEffect(() => {
    setDate(new Date().toISOString().split("T")[0]);
  }, []);
  const [time, setTime] = useState("10:00 AM - 10:45 AM");
  const [location, setLocation] = useState("Google Meet / Room 3B");
  const [goal, setGoal] = useState("Finalize technical milestones and owner assignments for Q3 deliverables.");
  const [attendees, setAttendees] = useState("Alex (Lead), Sarah (PM), David (Backend), Maya (Frontend)");

  const [topics, setTopics] = useState<AgendaTopic[]>([
    { id: "1", title: "Review Previous Action Items & Blockers", durationMin: 10, leader: "Sarah" },
    { id: "2", title: "API Gateway Migration Strategy & Timeline", durationMin: 20, leader: "David" },
    { id: "3", title: "Design System Tokens Sync with Mobile", durationMin: 10, leader: "Maya" },
    { id: "4", title: "Final Decisions & Q&A", durationMin: 5, leader: "Alex" },
  ]);

  const [actions, setActions] = useState<ActionItem[]>([
    { id: "1", task: "Publish benchmark report on GraphQL vs REST latency", assignee: "David", deadline: "Friday" },
    { id: "2", task: "Create PR for unified typography tokens in Tailwind config", assignee: "Maya", deadline: "Wednesday" },
  ]);

  const totalMinutes = useMemo(() => {
    return topics.reduce((acc, t) => acc + t.durationMin, 0);
  }, [topics]);

  const addTopic = () => {
    setTopics((prev) => [
      ...prev,
      { id: Date.now().toString(), title: "New Discussion Point", durationMin: 10, leader: "Team" },
    ]);
  };

  const removeTopic = (id: string) => {
    if (topics.length <= 1) return;
    setTopics((prev) => prev.filter((t) => t.id !== id));
  };

  const addAction = () => {
    setActions((prev) => [
      ...prev,
      { id: Date.now().toString(), task: "New action item", assignee: "Assignee", deadline: "Next Week" },
    ]);
  };

  const removeAction = (id: string) => {
    setActions((prev) => prev.filter((a) => a.id !== id));
  };

  const markdownAgenda = useMemo(() => {
    const topicsMd = topics
      .map((t, idx) => `${idx + 1}. **${t.title}** (${t.durationMin} min) — *Lead: ${t.leader}*`)
      .join("\n");

    const actionsMd = actions
      .map((a) => `- [ ] **${a.task}** (@${a.assignee}) — *Due: ${a.deadline}*`)
      .join("\n");

    return `# Meeting Agenda: ${meetingTitle}

📅 **Date:** ${date} | ⏰ **Time:** ${time} (${totalMinutes} mins total)  
📍 **Location:** ${location}  
👥 **Attendees:** ${attendees}

---

### 🎯 Primary Objective & Desired Outcome
> ${goal}

---

### ⏱️ Timeboxed Agenda Topics
${topicsMd}

---

### ✅ Action Items & Owners
${actionsMd}

---
*Created via ForgeKit Meeting Agenda Studio*
`;
  }, [meetingTitle, date, time, totalMinutes, location, attendees, goal, topics, actions]);

  const handleDownload = () => {
    downloadFile(markdownAgenda, "meeting-agenda.md", "text/markdown");
    confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Editor (Left) */}
      <div className="lg:col-span-6 space-y-5">
        <div className="space-y-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Meeting Title
            </label>
            <input
              type="text"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] text-zinc-500 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-500 mb-1">Time</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-500 mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-zinc-500 mb-1">Objective / Goal</label>
            <textarea
              rows={2}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
            />
          </div>
        </div>

        {/* Topics Builder */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>Agenda Topics ({totalMinutes} min)</span>
            </span>
            <button
              type="button"
              onClick={addTopic}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add Topic</span>
            </button>
          </div>

          <div className="space-y-2">
            {topics.map((topic, i) => (
              <div
                key={topic.id}
                className="flex items-center gap-2 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
              >
                <span className="w-5 text-center text-xs font-mono text-zinc-400">{i + 1}.</span>
                <input
                  type="text"
                  value={topic.title}
                  onChange={(e) => {
                    const copy = [...topics];
                    copy[i].title = e.target.value;
                    setTopics(copy);
                  }}
                  className="flex-1 px-2 py-1 text-xs font-medium rounded border border-transparent hover:border-zinc-300 focus:border-blue-500 bg-transparent text-zinc-800 dark:text-zinc-200"
                />
                <input
                  type="number"
                  min="1"
                  value={topic.durationMin}
                  onChange={(e) => {
                    const copy = [...topics];
                    copy[i].durationMin = Number(e.target.value);
                    setTopics(copy);
                  }}
                  className="w-14 text-center py-1 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-transparent"
                />
                <input
                  type="text"
                  value={topic.leader}
                  onChange={(e) => {
                    const copy = [...topics];
                    copy[i].leader = e.target.value;
                    setTopics(copy);
                  }}
                  className="w-20 px-1 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-500"
                />
                <button
                  type="button"
                  onClick={() => removeTopic(topic.id)}
                  disabled={topics.length <= 1}
                  className="p-1 text-zinc-400 hover:text-rose-500 disabled:opacity-20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Action Items Builder */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Action Items</span>
            </span>
            <button
              type="button"
              onClick={addAction}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add Action</span>
            </button>
          </div>

          <div className="space-y-2">
            {actions.map((act, i) => (
              <div
                key={act.id}
                className="flex items-center gap-2 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
              >
                <input
                  type="text"
                  value={act.task}
                  onChange={(e) => {
                    const copy = [...actions];
                    copy[i].task = e.target.value;
                    setActions(copy);
                  }}
                  placeholder="Task description"
                  className="flex-1 px-2 py-1 text-xs rounded border border-transparent hover:border-zinc-300 focus:border-blue-500 bg-transparent text-zinc-800 dark:text-zinc-200"
                />
                <input
                  type="text"
                  value={act.assignee}
                  onChange={(e) => {
                    const copy = [...actions];
                    copy[i].assignee = e.target.value;
                    setActions(copy);
                  }}
                  placeholder="Owner"
                  className="w-24 px-1.5 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-600 dark:text-zinc-400"
                />
                <input
                  type="text"
                  value={act.deadline}
                  onChange={(e) => {
                    const copy = [...actions];
                    copy[i].deadline = e.target.value;
                    setActions(copy);
                  }}
                  placeholder="Due date"
                  className="w-24 px-1.5 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-500"
                />
                <button
                  type="button"
                  onClick={() => removeAction(act.id)}
                  className="p-1 text-zinc-400 hover:text-rose-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Output Panel (Right) */}
      <div className="lg:col-span-6 flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/60 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            Markdown Document Preview
          </span>

          <div className="flex items-center gap-2">
            <CopyButton
              text={markdownAgenda}
              label="Copy Markdown"
              size="sm"
              variant="secondary"
              triggerConfetti
            />
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .md</span>
            </button>
          </div>
        </div>

        <div className="p-4 flex-1 max-h-[580px] overflow-y-auto">
          <pre className="font-mono text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap selection:bg-blue-500/20 leading-relaxed">
            {markdownAgenda}
          </pre>
        </div>
      </div>
    </div>
  );
}

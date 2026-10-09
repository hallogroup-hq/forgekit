"use client";

import React, { useState, useMemo } from "react";
import {
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  Download,
  AlertTriangle,
  FileText,
  MessageSquare,
} from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";
import {
  AgendaTopic,
  ActionItem,
  MeetingDetails,
  analyzeMeetingTimebox,
  formatAgendaMarkdown,
  formatAgendaSlack,
} from "./engine";

export default function MeetingAgendaGenerator() {
  const [meetingTitle, setMeetingTitle] = useState("Product Architecture & Q3 Roadmap Alignment");
  const [date, setDate] = useState("2026-10-08");

  React.useEffect(() => {
    setDate(new Date().toISOString().split("T")[0]);
  }, []);

  const [startTime, setStartTime] = useState("10:00 AM");
  const [plannedDurationMin, setPlannedDurationMin] = useState(45);
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

  const [activeTab, setActiveTab] = useState<"markdown" | "slack">("markdown");

  const timeboxAnalysis = useMemo(() => {
    return analyzeMeetingTimebox(startTime, plannedDurationMin, topics);
  }, [startTime, plannedDurationMin, topics]);

  const meetingDetails: MeetingDetails = useMemo(() => ({
    title: meetingTitle,
    date,
    startTime,
    plannedDurationMin,
    location,
    goal,
    attendees,
    topics,
    actions,
  }), [meetingTitle, date, startTime, plannedDurationMin, location, goal, attendees, topics, actions]);

  const markdownAgenda = useMemo(() => {
    return formatAgendaMarkdown(meetingDetails, timeboxAnalysis);
  }, [meetingDetails, timeboxAnalysis]);

  const slackAgenda = useMemo(() => {
    return formatAgendaSlack(meetingDetails, timeboxAnalysis);
  }, [meetingDetails, timeboxAnalysis]);

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

  const handleDownload = () => {
    downloadFile(markdownAgenda, `${meetingTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-agenda.md`, "text/markdown");
    confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Editor (Left) */}
      <div className="lg:col-span-6 space-y-5">
        {/* Meeting Metadata */}
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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
              <label className="block text-[11px] text-zinc-500 mb-1">Start Time</label>
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="10:00 AM"
                className="w-full px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-500 mb-1">Duration (Min)</label>
              <input
                type="number"
                min="5"
                step="5"
                value={plannedDurationMin}
                onChange={(e) => setPlannedDurationMin(Number(e.target.value) || 0)}
                className="w-full px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-500 mb-1">Location / Link</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-zinc-500 mb-1">Attendees</label>
            <input
              type="text"
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              className="w-full px-2.5 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
            />
          </div>

          <div>
            <label className="block text-[11px] text-zinc-500 mb-1">Primary Goal / Desired Outcome</label>
            <textarea
              rows={2}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
            />
          </div>
        </div>

        {/* Timebox Alert Status Banner */}
        {timeboxAnalysis.isOverflow ? (
          <div className="flex items-center gap-2 p-3 rounded-xl border border-amber-300 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <span className="font-semibold">Timebox Overrun!</span> Topics sum to{" "}
              <span className="font-mono font-bold">{timeboxAnalysis.totalTopicMinutes} min</span>, which exceeds your planned{" "}
              <span className="font-mono font-bold">{timeboxAnalysis.plannedMinutes} min</span> budget by{" "}
              <span className="font-bold underline">{timeboxAnalysis.diffMinutes} min</span>. Shorten or reassign topics.
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 text-xs">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Timebox within planned duration: {timeboxAnalysis.totalTopicMinutes} / {timeboxAnalysis.plannedMinutes} min</span>
            </span>
            <span className="font-mono text-[11px]">
              {timeboxAnalysis.plannedMinutes - timeboxAnalysis.totalTopicMinutes} min buffer
            </span>
          </div>
        )}

        {/* Topics Builder with Timeline Intervals */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Timeboxed Topics ({timeboxAnalysis.timeline.length})</span>
            </span>
            <button
              type="button"
              onClick={addTopic}
              className="flex items-center gap-1 text-xs font-medium text-zinc-900 dark:text-zinc-100 hover:underline cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add Topic</span>
            </button>
          </div>

          <div className="space-y-2">
            {timeboxAnalysis.timeline.map((topic, i) => (
              <div
                key={topic.id}
                className="flex items-center gap-2 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
              >
                <div className="w-6 text-center text-xs font-mono text-zinc-400 shrink-0">{i + 1}.</div>
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={topic.title}
                    onChange={(e) => {
                      const copy = [...topics];
                      copy[i].title = e.target.value;
                      setTopics(copy);
                    }}
                    className="w-full px-2 py-0.5 text-xs font-medium rounded border border-transparent hover:border-zinc-300 focus:border-zinc-500 bg-transparent text-zinc-800 dark:text-zinc-200"
                  />
                  <div className="px-2 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                    {topic.timeRangeFormatted}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <input
                    type="number"
                    min="1"
                    value={topic.durationMin}
                    onChange={(e) => {
                      const copy = [...topics];
                      copy[i].durationMin = Number(e.target.value);
                      setTopics(copy);
                    }}
                    title="Duration in minutes"
                    className="w-14 text-center py-1 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-transparent font-mono"
                  />
                  <span className="text-[11px] text-zinc-400">m</span>
                </div>
                <input
                  type="text"
                  value={topic.leader}
                  onChange={(e) => {
                    const copy = [...topics];
                    copy[i].leader = e.target.value;
                    setTopics(copy);
                  }}
                  title="Topic leader"
                  placeholder="Lead"
                  className="w-20 px-1 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-500 shrink-0"
                />
                <button
                  type="button"
                  onClick={() => removeTopic(topic.id)}
                  disabled={topics.length <= 1}
                  className="p-1 text-zinc-400 hover:text-rose-500 disabled:opacity-20 shrink-0"
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
              <span>Action Items ({actions.length})</span>
            </span>
            <button
              type="button"
              onClick={addAction}
              className="flex items-center gap-1 text-xs font-medium text-zinc-900 dark:text-zinc-100 hover:underline cursor-pointer"
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
                  className="flex-1 min-w-0 px-2 py-1 text-xs rounded border border-transparent hover:border-zinc-300 focus:border-zinc-500 bg-transparent text-zinc-800 dark:text-zinc-200"
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
                  className="w-20 px-1.5 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-600 dark:text-zinc-400"
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
                  className="w-20 px-1.5 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-500"
                />
                <button
                  type="button"
                  onClick={() => removeAction(act.id)}
                  className="p-1 text-zinc-400 hover:text-rose-500 shrink-0"
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
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg">
            <button
              onClick={() => setActiveTab("markdown")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                activeTab === "markdown"
                  ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Markdown</span>
            </button>
            <button
              onClick={() => setActiveTab("slack")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                activeTab === "slack"
                  ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Slack / Teams</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <CopyButton
              text={activeTab === "markdown" ? markdownAgenda : slackAgenda}
              label={activeTab === "markdown" ? "Copy Markdown" : "Copy Slack Text"}
              size="sm"
              variant="secondary"
              triggerConfetti
            />
            {activeTab === "markdown" && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-medium shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .md</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-4 flex-1 max-h-[620px] overflow-y-auto">
          <pre className="font-mono text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap selection:bg-zinc-200 dark:selection:bg-zinc-800 leading-relaxed">
            {activeTab === "markdown" ? markdownAgenda : slackAgenda}
          </pre>
        </div>
      </div>
    </div>
  );
}

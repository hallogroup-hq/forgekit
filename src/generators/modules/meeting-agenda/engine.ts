/**
 * Meeting Agenda & Timeboxing Engine
 * Calculates topic timeline intervals, detects timebox overflows,
 * and formats exports for Markdown, Slack, and Plain Text.
 */

export interface AgendaTopic {
  id: string;
  title: string;
  durationMin: number;
  leader: string;
}

export interface ActionItem {
  id: string;
  task: string;
  assignee: string;
  deadline: string;
}

export interface MeetingDetails {
  title: string;
  date: string;
  startTime: string; // e.g. "10:00" or "10:00 AM"
  plannedDurationMin: number;
  location: string;
  goal: string;
  attendees: string;
  topics: AgendaTopic[];
  actions: ActionItem[];
}

export interface TopicTimelineItem extends AgendaTopic {
  timeOffsetStart: number;
  timeOffsetEnd: number;
  timeRangeFormatted: string;
}

export interface TimeboxAnalysis {
  totalTopicMinutes: number;
  plannedMinutes: number;
  diffMinutes: number;
  isOverflow: boolean;
  isUnderflow: boolean;
  timeline: TopicTimelineItem[];
}

/**
 * Parses time strings like "10:00", "10:00 AM", "14:30" into total minutes from midnight.
 */
export function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return 600; // Default 10:00 AM (600 mins)

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3]?.toUpperCase();

  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

/**
 * Formats total minutes from midnight to a 12-hour AM/PM string.
 */
export function formatMinutesToTime(totalMins: number): string {
  const normalized = ((totalMins % 1440) + 1440) % 1440;
  const hours24 = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const meridiem = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  const padMins = minutes.toString().padStart(2, "0");
  return `${hours12}:${padMins} ${meridiem}`;
}

/**
 * Computes exact timeline intervals and timeboxing overflow status.
 */
export function analyzeMeetingTimebox(
  startTimeStr: string,
  plannedDurationMin: number,
  topics: AgendaTopic[]
): TimeboxAnalysis {
  const startMins = parseTimeToMinutes(startTimeStr);
  let currentOffset = 0;

  const timeline: TopicTimelineItem[] = topics.map((t) => {
    const itemStart = startMins + currentOffset;
    const itemEnd = itemStart + t.durationMin;
    const rangeFormatted = `${formatMinutesToTime(itemStart)} – ${formatMinutesToTime(itemEnd)}`;
    const timelineItem: TopicTimelineItem = {
      ...t,
      timeOffsetStart: currentOffset,
      timeOffsetEnd: currentOffset + t.durationMin,
      timeRangeFormatted: rangeFormatted,
    };
    currentOffset += t.durationMin;
    return timelineItem;
  });

  const totalTopicMinutes = currentOffset;
  const diffMinutes = totalTopicMinutes - plannedDurationMin;

  return {
    totalTopicMinutes,
    plannedMinutes: plannedDurationMin,
    diffMinutes,
    isOverflow: diffMinutes > 0,
    isUnderflow: diffMinutes < 0,
    timeline,
  };
}

/**
 * Generates Markdown format of the agenda.
 */
export function formatAgendaMarkdown(
  meeting: MeetingDetails,
  analysis: TimeboxAnalysis
): string {
  const topicsMd = analysis.timeline
    .map(
      (t, idx) =>
        `${idx + 1}. **${t.title}** (${t.timeRangeFormatted} • ${t.durationMin} min)\n   - *Lead:* ${t.leader}`
    )
    .join("\n");

  const actionsMd =
    meeting.actions.length > 0
      ? meeting.actions
          .map((a) => `- [ ] **${a.task}** (@${a.assignee}) | *Due: ${a.deadline}*`)
          .join("\n")
      : "_No action items specified._";

  const overflowNotice = analysis.isOverflow
    ? `\n> ⚠️ **Warning:** Topics sum to ${analysis.totalTopicMinutes} min, exceeding planned ${analysis.plannedMinutes} min by ${analysis.diffMinutes} min!\n`
    : "";

  return `# Meeting Agenda: ${meeting.title}

📅 **Date:** ${meeting.date}  
⏰ **Time:** ${meeting.startTime} (${analysis.totalTopicMinutes} min scheduled)  
📍 **Location:** ${meeting.location}  
👥 **Attendees:** ${meeting.attendees}
${overflowNotice}
---

### 🎯 Objective & Desired Outcome
> ${meeting.goal}

---

### ⏱️ Timeboxed Agenda
${topicsMd}

---

### ✅ Action Items & Owners
${actionsMd}
`;
}

/**
 * Generates Slack / Discord markdown formatted message.
 */
export function formatAgendaSlack(
  meeting: MeetingDetails,
  analysis: TimeboxAnalysis
): string {
  const topicsText = analysis.timeline
    .map(
      (t, idx) =>
        `*${idx + 1}. ${t.title}* (${t.timeRangeFormatted} • ${t.durationMin}m) - _Lead: ${t.leader}_`
    )
    .join("\n");

  const actionsText =
    meeting.actions.length > 0
      ? meeting.actions
          .map((a) => `• [ ] *${a.task}* (@${a.assignee}) - _Due: ${a.deadline}_`)
          .join("\n")
      : "_None_";

  return `*📋 MEETING AGENDA: ${meeting.title.toUpperCase()}*
*When:* ${meeting.date} at ${meeting.startTime} (${analysis.totalTopicMinutes} mins)
*Where:* ${meeting.location}
*Goal:* ${meeting.goal}

*Agenda Topics:*
${topicsText}

*Action Items:*
${actionsText}`;
}

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseTimeToMinutes,
  formatMinutesToTime,
  analyzeMeetingTimebox,
  formatAgendaMarkdown,
  formatAgendaSlack,
} from "./engine";

describe("Meeting Agenda Engine", () => {
  describe("parseTimeToMinutes & formatMinutesToTime", () => {
    it("should parse 10:00 AM correctly", () => {
      const mins = parseTimeToMinutes("10:00 AM");
      assert.equal(mins, 600);
      assert.equal(formatMinutesToTime(600), "10:00 AM");
    });

    it("should parse 2:30 PM correctly", () => {
      const mins = parseTimeToMinutes("2:30 PM");
      assert.equal(mins, 14 * 60 + 30);
      assert.equal(formatMinutesToTime(14 * 60 + 30), "2:30 PM");
    });
  });

  describe("analyzeMeetingTimebox", () => {
    it("should compute topic time ranges and flag overflow when topics exceed duration", () => {
      const topics = [
        { id: "1", title: "Intro", durationMin: 15, leader: "Sarah" },
        { id: "2", title: "Deep Dive", durationMin: 40, leader: "Alex" },
      ];
      // Planned for 45 mins, but topics total 55 mins -> overflow!
      const analysis = analyzeMeetingTimebox("10:00 AM", 45, topics);

      assert.equal(analysis.totalTopicMinutes, 55);
      assert.equal(analysis.plannedMinutes, 45);
      assert.equal(analysis.diffMinutes, 10);
      assert.equal(analysis.isOverflow, true);
      assert.equal(analysis.timeline[0].timeRangeFormatted, "10:00 AM – 10:15 AM");
      assert.equal(analysis.timeline[1].timeRangeFormatted, "10:15 AM – 10:55 AM");
    });

    it("should flag when within budget", () => {
      const topics = [{ id: "1", title: "Sync", durationMin: 30, leader: "Team" }];
      const analysis = analyzeMeetingTimebox("09:00 AM", 30, topics);
      assert.equal(analysis.isOverflow, false);
      assert.equal(analysis.diffMinutes, 0);
    });
  });

  describe("Formatters", () => {
    it("should format markdown agenda with warning notice on overflow", () => {
      const topics = [
        { id: "1", title: "Design", durationMin: 30, leader: "Maya" },
        { id: "2", title: "Review", durationMin: 20, leader: "John" },
      ];
      const analysis = analyzeMeetingTimebox("10:00 AM", 40, topics); // 50 mins > 40 mins
      const md = formatAgendaMarkdown(
        {
          title: "Sprint Alignment",
          date: "2026-10-08",
          startTime: "10:00 AM",
          plannedDurationMin: 40,
          location: "Google Meet",
          goal: "Plan Sprint 2",
          attendees: "Team",
          topics,
          actions: [{ id: "1", task: "Deploy test", assignee: "Maya", deadline: "Fri" }],
        },
        analysis
      );

      assert.ok(md.includes("# Meeting Agenda: Sprint Alignment"));
      assert.ok(md.includes("Topics sum to 50 min"));
      assert.ok(md.includes("10:00 AM – 10:30 AM"));
    });

    it("should format Slack message with bold headings", () => {
      const topics = [{ id: "1", title: "Sync", durationMin: 15, leader: "PM" }];
      const analysis = analyzeMeetingTimebox("11:00 AM", 15, topics);
      const slack = formatAgendaSlack(
        {
          title: "Quick Standup",
          date: "2026-10-08",
          startTime: "11:00 AM",
          plannedDurationMin: 15,
          location: "Huddle",
          goal: "Daily blockers",
          attendees: "All",
          topics,
          actions: [],
        },
        analysis
      );

      assert.ok(slack.includes("*📋 MEETING AGENDA: QUICK STANDUP*"));
      assert.ok(slack.includes("*1. Sync*"));
    });
  });
});

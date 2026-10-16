"use client";

import React, { useState } from "react";
import {
  FileText,
  Printer,
  Download,
  Plus,
  Trash2,
  Eye,
  Edit3,
  Check,
  Building,
  GraduationCap,
  Sparkles,
  User,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import {
  ResumeData,
  ExperienceItem,
  EducationItem,
  SkillCategory,
  ProjectItem,
  calculateAtsScore,
  getDefaultResumeData,
} from "./engine";

export default function AtsResumeBuilder() {
  const [data, setData] = useState<ResumeData>(getDefaultResumeData());
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  const atsAudit = calculateAtsScore(data);

  const handlePrint = () => {
    window.print();
  };

  const handleAddExperience = () => {
    const newItem: ExperienceItem = {
      id: "exp_" + Date.now(),
      position: "Software Engineer",
      company: "Company Name",
      location: "City, Country",
      startDate: "2023",
      endDate: "Present",
      isCurrent: true,
      bullets: ["Led implementation of core product features, increasing user engagement by 25%."],
    };
    setData((prev) => ({ ...prev, experiences: [...prev.experiences, newItem] }));
  };

  const handleRemoveExperience = (id: string) => {
    setData((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((e) => e.id !== id),
    }));
  };

  const handleUpdateExperience = (id: string, field: keyof ExperienceItem, val: unknown) => {
    setData((prev) => ({
      ...prev,
      experiences: prev.experiences.map((e) => (e.id === id ? { ...e, [field]: val } : e)),
    }));
  };

  const handleAddEducation = () => {
    const newItem: EducationItem = {
      id: "edu_" + Date.now(),
      degree: "Bachelor of Science",
      field: "Information Technology",
      school: "University Name",
      year: "2018 – 2022",
    };
    setData((prev) => ({ ...prev, education: [...prev.education, newItem] }));
  };

  const handleRemoveEducation = (id: string) => {
    setData((prev) => ({
      ...prev,
      education: prev.education.filter((e) => e.id !== id),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Header (Hidden in Print) */}
      <div className="print:hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            ATS Resume / CV Builder
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Bangun CV profesional yang teroptimasi lolos sistem ATS dengan ekspor PDF A4 bersih tanpa bayar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 p-0.5 text-xs">
            <button
              onClick={() => setActiveTab("edit")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                activeTab === "edit"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <Edit3 size={13} />
              Edit CV
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                activeTab === "preview"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <Eye size={13} />
              A4 Preview
            </button>
          </div>

          {/* Template Selector */}
          <div className="flex items-center gap-1 border-l border-zinc-200 dark:border-zinc-800 pl-2">
            {(
              [
                { id: "tech-ats", label: "Tech ATS" },
                { id: "executive", label: "Executive" },
                { id: "compact", label: "Compact" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setData((prev) => ({ ...prev, template: t.id }))}
                className={`px-2.5 py-1.5 rounded-md text-xs transition ${
                  data.template === t.id
                    ? "bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 font-medium"
                    : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Print / Save PDF Button */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 hover:opacity-90 transition shadow-sm ml-2"
          >
            <Printer size={14} />
            Cetak / Save PDF
          </button>
        </div>
      </div>

      {/* ATS Compliance Score bar (Print:hidden) */}
      <div className="print:hidden p-3.5 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 font-bold font-mono text-zinc-900 dark:text-zinc-100 flex items-center justify-center">
            {atsAudit.score}%
          </div>
          <div>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">
              ATS Compatibility Readiness
            </span>
            <span className="text-zinc-500 text-[11px]">
              {atsAudit.passedChecks} dari {atsAudit.totalChecks} parameter ATS terpenuhi dengan baik.
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] text-zinc-600 dark:text-zinc-400">
          {atsAudit.items.map((item, idx) => (
            <span
              key={idx}
              className={`px-2 py-0.5 rounded border ${
                item.passed
                  ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200"
                  : "bg-transparent border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-400"
              }`}
            >
              {item.passed ? "✓" : "○"} {item.label.split("(")[0]}
            </span>
          ))}
        </div>
      </div>

      {/* EDIT MODE (Print:hidden) */}
      {activeTab === "edit" && (
        <div className="print:hidden space-y-6 text-xs">
          {/* Contact Details */}
          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm block">
              1. Identitas & Kontak
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-zinc-500 block mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={data.fullName}
                  onChange={(e) => setData({ ...data, fullName: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-medium"
                />
              </div>
              <div>
                <label className="text-zinc-500 block mb-1">Target Jabatan / Title</label>
                <input
                  type="text"
                  value={data.title}
                  onChange={(e) => setData({ ...data, title: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                />
              </div>
              <div>
                <label className="text-zinc-500 block mb-1">Email</label>
                <input
                  type="email"
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                />
              </div>
              <div>
                <label className="text-zinc-500 block mb-1">Nomor Telepon</label>
                <input
                  type="text"
                  value={data.phone}
                  onChange={(e) => setData({ ...data, phone: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                />
              </div>
              <div>
                <label className="text-zinc-500 block mb-1">Lokasi (Kota, Negara)</label>
                <input
                  type="text"
                  value={data.location}
                  onChange={(e) => setData({ ...data, location: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                />
              </div>
              <div>
                <label className="text-zinc-500 block mb-1">LinkedIn URL / Username</label>
                <input
                  type="text"
                  value={data.linkedin}
                  onChange={(e) => setData({ ...data, linkedin: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                />
              </div>
              <div>
                <label className="text-zinc-500 block mb-1">GitHub / Portfolio</label>
                <input
                  type="text"
                  value={data.github}
                  onChange={(e) => setData({ ...data, github: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                />
              </div>
              <div>
                <label className="text-zinc-500 block mb-1">Website Pribadi</label>
                <input
                  type="text"
                  value={data.website}
                  onChange={(e) => setData({ ...data, website: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                />
              </div>
            </div>
          </div>

          {/* Professional Summary */}
          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm block">
              2. Ringkasan Profesional (Summary)
            </span>
            <textarea
              rows={3}
              value={data.summary}
              onChange={(e) => setData({ ...data, summary: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 leading-relaxed"
              placeholder="Deskripsikan keahlian utama, pengalaman tahun kerja, dan pencapaian spesifik..."
            />
          </div>

          {/* Work Experiences */}
          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                3. Pengalaman Kerja (Work Experience)
              </span>
              <button
                onClick={handleAddExperience}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <Plus size={12} /> Tambah Pengalaman
              </button>
            </div>

            <div className="space-y-4">
              {data.experiences.map((exp, idx) => (
                <div
                  key={exp.id}
                  className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      #{idx + 1} {exp.position || "Jabatan"} @ {exp.company || "Perusahaan"}
                    </span>
                    <button
                      onClick={() => handleRemoveExperience(exp.id)}
                      className="p-1 text-zinc-400 hover:text-zinc-600"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <input
                      type="text"
                      value={exp.position}
                      onChange={(e) => handleUpdateExperience(exp.id, "position", e.target.value)}
                      placeholder="Posisi / Jabatan"
                      className="px-2.5 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                    />
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => handleUpdateExperience(exp.id, "company", e.target.value)}
                      placeholder="Nama Perusahaan"
                      className="px-2.5 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                    />
                    <input
                      type="text"
                      value={exp.location}
                      onChange={(e) => handleUpdateExperience(exp.id, "location", e.target.value)}
                      placeholder="Lokasi"
                      className="px-2.5 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={exp.startDate}
                        onChange={(e) =>
                          handleUpdateExperience(exp.id, "startDate", e.target.value)
                        }
                        placeholder="Mulai"
                        className="w-16 px-1.5 py-1.5 text-center rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                      />
                      <span>-</span>
                      <input
                        type="text"
                        value={exp.endDate}
                        onChange={(e) => handleUpdateExperience(exp.id, "endDate", e.target.value)}
                        placeholder="Selesai"
                        className="w-20 px-1.5 py-1.5 text-center rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-500 block mb-1">
                      Poin Prestasi & Tanggung Jawab (1 baris per poin)
                    </label>
                    <textarea
                      rows={3}
                      value={exp.bullets.join("\n")}
                      onChange={(e) =>
                        handleUpdateExperience(
                          exp.id,
                          "bullets",
                          e.target.value.split("\n").filter((b) => b.trim().length > 0)
                        )
                      }
                      className="w-full px-2.5 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 leading-relaxed font-sans"
                      placeholder="• Meningkatkan performa sistem...\n• Memimpin migrasi arsitektur..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Education & Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Education */}
            <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                  4. Pendidikan
                </span>
                <button
                  onClick={handleAddEducation}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  <Plus size={12} /> Tambah
                </button>
              </div>
              {data.education.map((edu) => (
                <div
                  key={edu.id}
                  className="p-2.5 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) =>
                        setData({
                          ...data,
                          education: data.education.map((item) =>
                            item.id === edu.id ? { ...item, degree: e.target.value } : item
                          ),
                        })
                      }
                      placeholder="Gelar / Degree"
                      className="font-medium px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 w-1/2"
                    />
                    <button
                      onClick={() => handleRemoveEducation(edu.id)}
                      className="p-1 text-zinc-400 hover:text-zinc-600"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={edu.school}
                    onChange={(e) =>
                      setData({
                        ...data,
                        education: data.education.map((item) =>
                          item.id === edu.id ? { ...item, school: e.target.value } : item
                        ),
                      })
                    }
                    placeholder="Nama Universitas / Institusi"
                    className="w-full px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={edu.year}
                      onChange={(e) =>
                        setData({
                          ...data,
                          education: data.education.map((item) =>
                            item.id === edu.id ? { ...item, year: e.target.value } : item
                          ),
                        })
                      }
                      placeholder="Tahun Lulus"
                      className="px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono"
                    />
                    <input
                      type="text"
                      value={edu.gpa || ""}
                      onChange={(e) =>
                        setData({
                          ...data,
                          education: data.education.map((item) =>
                            item.id === edu.id ? { ...item, gpa: e.target.value } : item
                          ),
                        })
                      }
                      placeholder="IPK / Honors (opsional)"
                      className="px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Skills */}
            <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm block">
                5. Keahlian & Teknologi
              </span>
              {data.skills.map((s) => (
                <div key={s.id} className="space-y-1">
                  <span className="text-zinc-500 font-medium">{s.category}</span>
                  <input
                    type="text"
                    value={s.skills}
                    onChange={(e) =>
                      setData({
                        ...data,
                        skills: data.skills.map((item) =>
                          item.id === s.id ? { ...item, skills: e.target.value } : item
                        ),
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* A4 DOCUMENT PREVIEW & PRINT STAGE */}
      <div
        className={`bg-white text-zinc-900 p-8 sm:p-12 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 max-w-4xl mx-auto ${
          activeTab === "edit" ? "hidden print:block" : "block"
        }`}
      >
        {/* Header */}
        <div className="border-b-2 border-zinc-900 pb-3 mb-5 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 uppercase">
            {data.fullName}
          </h1>
          <p className="text-sm font-medium text-zinc-700 mt-0.5">{data.title}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-600 mt-2 font-mono">
            {data.email && <span>{data.email}</span>}
            {data.phone && <span>• {data.phone}</span>}
            {data.location && <span>• {data.location}</span>}
            {data.linkedin && <span>• {data.linkedin}</span>}
            {data.github && <span>• {data.github}</span>}
            {data.website && <span>• {data.website}</span>}
          </div>
        </div>

        {/* Summary */}
        {data.summary && (
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 border-b border-zinc-300 pb-1 mb-2">
              Professional Summary
            </h2>
            <p className="text-xs text-zinc-800 leading-relaxed text-justify">{data.summary}</p>
          </div>
        )}

        {/* Work Experience */}
        {data.experiences.length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 border-b border-zinc-300 pb-1 mb-3">
              Work Experience
            </h2>
            <div className="space-y-4">
              {data.experiences.map((exp) => (
                <div key={exp.id} className="text-xs">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-baseline font-bold text-zinc-900">
                    <span>
                      {exp.position} — <span className="font-semibold text-zinc-800">{exp.company}</span>
                    </span>
                    <span className="font-mono text-[11px] text-zinc-600 font-normal">
                      {exp.startDate} – {exp.endDate} | {exp.location}
                    </span>
                  </div>
                  <ul className="list-disc list-outside pl-4 mt-1.5 space-y-1 text-zinc-700 leading-relaxed">
                    {exp.bullets.map((bullet, idx) => (
                      <li key={idx}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 border-b border-zinc-300 pb-1 mb-2">
              Education
            </h2>
            <div className="space-y-2">
              {data.education.map((edu) => (
                <div key={edu.id} className="text-xs flex justify-between items-baseline">
                  <div>
                    <span className="font-bold text-zinc-900">
                      {edu.degree} in {edu.field}
                    </span>
                    <span className="text-zinc-700">, {edu.school}</span>
                    {edu.gpa && <span className="text-zinc-500 text-[11px]"> ({edu.gpa})</span>}
                  </div>
                  <span className="font-mono text-zinc-600 text-[11px]">{edu.year}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {data.skills.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 border-b border-zinc-300 pb-1 mb-2">
              Skills & Technologies
            </h2>
            <div className="space-y-1.5 text-xs">
              {data.skills.map((s) => (
                <div key={s.id} className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                  <span className="font-semibold text-zinc-900 min-w-[170px]">{s.category}:</span>
                  <span className="text-zinc-700">{s.skills}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

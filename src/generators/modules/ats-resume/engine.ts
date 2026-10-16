export interface ExperienceItem {
  id: string;
  position: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  bullets: string[];
}

export interface EducationItem {
  id: string;
  degree: string;
  field: string;
  school: string;
  year: string;
  gpa?: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  tech: string;
  description: string;
}

export interface SkillCategory {
  id: string;
  category: string;
  skills: string;
}

export interface ResumeData {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  website: string;
  summary: string;
  experiences: ExperienceItem[];
  education: EducationItem[];
  skills: SkillCategory[];
  projects: ProjectItem[];
  template: "tech-ats" | "executive" | "compact";
}

export interface AtsChecklistResult {
  score: number; // 0 - 100
  passedChecks: number;
  totalChecks: number;
  items: { label: string; passed: boolean }[];
}

/**
 * Evaluates resume against standard ATS parseability heuristics
 */
export function calculateAtsScore(data: ResumeData): AtsChecklistResult {
  const checks = [
    {
      label: "Full Name & Professional Title specified",
      passed: Boolean(data.fullName.trim() && data.title.trim()),
    },
    {
      label: "Complete contact info (Email & Phone)",
      passed: Boolean(data.email.trim() && data.phone.trim()),
    },
    {
      label: "Location specified (City/Country)",
      passed: Boolean(data.location.trim()),
    },
    {
      label: "Professional Summary provided",
      passed: Boolean(data.summary.trim().length >= 40),
    },
    {
      label: "Work Experience with bullet achievements",
      passed:
        data.experiences.length > 0 &&
        data.experiences.some((e) => e.bullets.length > 0 && e.bullets[0].trim().length > 0),
    },
    {
      label: "Formal Education section present",
      passed: data.education.length > 0 && Boolean(data.education[0].degree.trim()),
    },
    {
      label: "Categorized Technical or Domain Skills",
      passed: data.skills.length > 0 && Boolean(data.skills[0].skills.trim()),
    },
  ];

  const passedChecks = checks.filter((c) => c.passed).length;
  const score = Math.round((passedChecks / checks.length) * 100);

  return {
    score,
    passedChecks,
    totalChecks: checks.length,
    items: checks,
  };
}

export function getDefaultResumeData(): ResumeData {
  return {
    fullName: "Rizky Ramadhan",
    title: "Senior Full-Stack Engineer",
    email: "rizky.ramadhan@email.com",
    phone: "+62 812-8890-1234",
    location: "Jakarta, Indonesia",
    linkedin: "linkedin.com/in/rizky-ramadhan",
    github: "github.com/rizkyramadhan",
    website: "rizkyramadhan.dev",
    summary:
      "Full-Stack Engineer with 6+ years of experience designing scalable distributed web architectures, high-performance TypeScript microservices, and React/Next.js client applications. Passionate about local-first software, performance optimization, and developer tooling.",
    experiences: [
      {
        id: "exp1",
        position: "Senior Software Engineer",
        company: "Mandiri Capital Fintech",
        location: "Jakarta, ID",
        startDate: "2022",
        endDate: "Present",
        isCurrent: true,
        bullets: [
          "Architected real-time payment reconciliation microservice processing 1.4M transactions daily with 99.99% uptime.",
          "Reduced Next.js frontend bundle sizes by 42% through code-splitting and native WebAssembly compression.",
          "Mentored team of 8 junior and mid-level engineers in test-driven development and TypeScript best practices.",
        ],
      },
      {
        id: "exp2",
        position: "Frontend Software Engineer",
        company: "Bukalapak Tech",
        location: "Jakarta, ID",
        startDate: "2019",
        endDate: "2022",
        isCurrent: false,
        bullets: [
          "Engineered core merchant dashboard using React, Redux, and Tailwind CSS, serving 250k active stores.",
          "Decreased page First Contentful Paint (FCP) from 2.8s to 0.9s via image optimization pipelines.",
        ],
      },
    ],
    education: [
      {
        id: "edu1",
        degree: "Bachelor of Science",
        field: "Computer Science",
        school: "Universitas Indonesia",
        year: "2015 – 2019",
        gpa: "GPA 3.82 / 4.00 (Cum Laude)",
      },
    ],
    skills: [
      {
        id: "s1",
        category: "Languages & Frameworks",
        skills: "TypeScript, JavaScript, Python, Go, React, Next.js, Node.js, Express",
      },
      {
        id: "s2",
        category: "Databases & Cloud",
        skills: "PostgreSQL, Redis, MongoDB, Docker, Kubernetes, AWS (S3, ECS, Lambda)",
      },
      {
        id: "s3",
        category: "Methodologies & Tools",
        skills: "CI/CD (GitHub Actions), Microservices, REST & GraphQL APIs, TDD, Agile/Scrum",
      },
    ],
    projects: [
      {
        id: "p1",
        title: "FastCache Engine",
        tech: "Go, Redis, Docker",
        description:
          "Open-source in-memory caching proxy yielding 25k ops/sec with sub-millisecond p99 latency.",
      },
    ],
    template: "tech-ats",
  };
}

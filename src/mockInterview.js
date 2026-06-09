const SKILL_KEYWORDS = [
  "Java",
  "Spring Boot",
  "Redis",
  "MySQL",
  "PostgreSQL",
  "React",
  "Vue",
  "Node",
  "Python",
  "Docker",
  "Kubernetes",
  "Kafka",
  "RabbitMQ",
  "TypeScript",
  "AWS"
];

function detectSkills(resumeText) {
  const lower = resumeText.toLowerCase();
  const skills = SKILL_KEYWORDS.filter((skill) => lower.includes(skill.toLowerCase()));
  return skills.length ? skills : ["Project delivery", "Problem solving", "System design"];
}

function detectProjects(resumeText) {
  const lower = resumeText.toLowerCase();
  const projects = [];

  if (lower.includes("order")) {
    projects.push({
      name: "Order System",
      summary: "Resume mentions order-related backend work.",
      highlights: ["business workflow", "performance", "reliability"]
    });
  }

  if (lower.includes("payment")) {
    projects.push({
      name: "Payment Integration",
      summary: "Resume mentions payment callback or integration work.",
      highlights: ["idempotency", "callback handling", "failure recovery"]
    });
  }

  if (lower.includes("cache") || lower.includes("redis")) {
    projects.push({
      name: "Caching Optimization",
      summary: "Resume mentions cache or Redis optimization.",
      highlights: ["cache strategy", "consistency", "hot key handling"]
    });
  }

  return projects.length
    ? projects
    : [
        {
          name: "Main Resume Project",
          summary: "Primary project inferred from the resume content.",
          highlights: ["technical ownership", "delivery", "tradeoffs"]
        }
      ];
}

export function createMockProfile({ resumeText, targetRole }) {
  const skills = detectSkills(resumeText);
  const projects = detectProjects(resumeText);

  return {
    target_role: targetRole,
    seniority: resumeText.match(/\b[3-9]\s*(years|年)/i) ? "3+ years" : "not specified",
    skills,
    projects,
    risk_points: [
      "Project impact needs concrete metrics",
      "Technical tradeoffs should be explained clearly",
      "Failure handling and edge cases may be challenged"
    ]
  };
}

function referenceAnswer(topic, targetRole) {
  return (
    `A strong ${targetRole} answer should start with the business context, then describe the concrete problem, ` +
    `the technical decision, and the measured result. For ${topic}, the candidate should explain implementation ` +
    "details, tradeoffs, failure modes, and how the result was validated in production or testing."
  );
}

export function createMockQuestions(profile) {
  const primarySkill = profile.skills[0] || "core technical skill";
  const project = profile.projects[0] || { name: "main project" };
  const targetRole = profile.target_role;

  const topics = [
    {
      question: `Your resume mentions ${project.name}. What problem did this project solve, and what was your specific responsibility?`,
      intent: "Verify project ownership and business understanding."
    },
    {
      question: `You listed ${primarySkill}. Please explain one difficult technical decision you made with it.`,
      intent: "Evaluate depth of hands-on technical experience."
    },
    {
      question: "Describe a performance bottleneck you found and how you proved the optimization worked.",
      intent: "Evaluate measurement-driven performance optimization."
    },
    {
      question: "How did you handle failures, retries, or idempotency in one production workflow?",
      intent: "Evaluate reliability and production thinking."
    },
    {
      question: "If traffic doubled for the system in your resume, which part would you inspect first and why?",
      intent: "Evaluate system design and prioritization."
    },
    {
      question: "Tell me about a bug or incident in this project and how you resolved it.",
      intent: "Evaluate debugging process and ownership."
    },
    {
      question: "How did you collaborate with product, QA, or other engineers during this project?",
      intent: "Evaluate communication and delivery habits."
    },
    {
      question: "Which part of your resume project would you redesign if you had more time?",
      intent: "Evaluate reflection, tradeoffs, and engineering maturity."
    }
  ];

  return topics.map((topic, index) => ({
    id: `q${index + 1}`,
    question: topic.question,
    intent: topic.intent,
    difficulty: index < 2 ? "medium" : "medium-hard",
    reference_answer: referenceAnswer(topic.question, targetRole),
    scoring_rubric: [
      "Connects answer to resume experience",
      "Explains context, action, and result",
      "Includes technical details and tradeoffs",
      "Mentions metrics or validation where possible",
      "Avoids vague claims without evidence"
    ],
    follow_up_questions: [
      "What metric proved this approach worked?",
      "What would break first if the scale increased?"
    ]
  }));
}

export function createMockFeedback({ question, candidateAnswer }) {
  const answer = candidateAnswer.toLowerCase();
  const hasMetric = /\d|qps|latency|ms|percent|%|cost|error/.test(answer);
  const hasTradeoff = /tradeoff|权衡|cost|risk|consistency|一致|failure|失败/.test(answer);
  const score = Math.min(10, 5 + (hasMetric ? 2 : 0) + (hasTradeoff ? 2 : 0) + (candidateAnswer.length > 120 ? 1 : 0));

  return {
    score,
    strengths: [
      "The answer connects to the interview question.",
      candidateAnswer.length > 80 ? "The answer provides some concrete explanation." : "The answer is concise and direct."
    ],
    weaknesses: [
      hasMetric ? "Metrics are mentioned, but the before-and-after comparison can be clearer." : "Add concrete metrics or before-and-after evidence.",
      hasTradeoff ? "Tradeoffs are mentioned; explain why this option was chosen." : "Explain technical tradeoffs, risks, and failure handling."
    ],
    improved_answer:
      `${candidateAnswer.trim()} A stronger version would add the original context, the exact technical decision, ` +
      "the tradeoff considered, and a measurable result. It should also mention how edge cases or failures were handled.",
    follow_up_question: question.follow_up_questions?.[0] || "What evidence shows your solution worked?"
  };
}

export function createMockReport({ targetRole, answers }) {
  const scores = answers.map((item) => Number(item.feedback?.score || 0));
  const average =
    scores.length === 0 ? 0 : Math.round((scores.reduce((total, score) => total + score, 0) / scores.length) * 10) / 10;
  const weakAreas = answers.flatMap((item) => item.feedback?.weaknesses || []).slice(0, 6);
  const strengths = answers.flatMap((item) => item.feedback?.strengths || []).slice(0, 6);

  return {
    target_role: targetRole,
    average_score: average,
    strengths,
    weak_areas: weakAreas,
    practice_suggestions: [
      "Prepare one STAR-style story for each major project.",
      "Add before-and-after metrics for performance and reliability claims.",
      "Practice explaining tradeoffs, failure modes, and follow-up improvements."
    ]
  };
}

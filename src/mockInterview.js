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
  return skills.length ? skills : ["项目交付", "问题定位", "系统设计"];
}

function detectProjects(resumeText) {
  const lower = resumeText.toLowerCase();
  const projects = [];

  if (lower.includes("order") || resumeText.includes("订单")) {
    projects.push({
      name: "订单系统",
      summary: "简历中提到了订单相关的后端项目经验。",
      highlights: ["业务流程", "性能优化", "稳定性"]
    });
  }

  if (lower.includes("payment") || resumeText.includes("支付")) {
    projects.push({
      name: "支付集成",
      summary: "简历中提到了支付回调或支付链路集成经验。",
      highlights: ["幂等处理", "回调处理", "异常恢复"]
    });
  }

  if (lower.includes("cache") || lower.includes("redis") || resumeText.includes("缓存")) {
    projects.push({
      name: "缓存优化",
      summary: "简历中提到了缓存或 Redis 优化经验。",
      highlights: ["缓存策略", "一致性", "热点 key 处理"]
    });
  }

  return projects.length
    ? projects
    : [
        {
          name: "核心简历项目",
          summary: "根据简历内容推断出的主要项目经验。",
          highlights: ["技术负责", "项目交付", "方案权衡"]
        }
      ];
}

export function createMockProfile({ resumeText, targetRole }) {
  const skills = detectSkills(resumeText);
  const projects = detectProjects(resumeText);

  return {
    target_role: targetRole,
    seniority: resumeText.match(/\b[3-9]\s*(years|年)/i) ? "3 年以上" : "简历未明确",
    skills,
    projects,
    risk_points: [
      "项目影响需要补充具体数据",
      "技术方案权衡需要讲清楚",
      "异常处理和边界场景可能会被追问"
    ]
  };
}

function referenceAnswer(topic, targetRole) {
  return (
    `一个优秀的 ${targetRole} 回答应该先说明业务背景，再讲清楚遇到的具体问题、你的职责、` +
    `采用的技术方案和最终结果。针对「${topic}」，建议补充实现细节、方案权衡、异常场景，` +
    "以及你如何通过数据、测试或线上指标验证效果。"
  );
}

export function createMockQuestions(profile) {
  const primarySkill = profile.skills[0] || "核心技术能力";
  const project = profile.projects[0] || { name: "核心项目" };
  const targetRole = profile.target_role;

  const topics = [
    {
      question: `你的简历里提到了「${project.name}」。这个项目主要解决了什么问题？你在其中具体负责什么？`,
      intent: "考察项目真实性、职责边界和业务理解。"
    },
    {
      question: `你简历里写到了「${primarySkill}」。请结合一个真实场景说明你做过的一次关键技术决策。`,
      intent: "考察技术栈是否真正用过，以及是否能解释方案选择。"
    },
    {
      question: "请讲一个你发现性能瓶颈并完成优化的例子。你是怎么定位问题，又怎么证明优化有效的？",
      intent: "考察性能优化思路、指标意识和结果验证能力。"
    },
    {
      question: "在你参与的线上流程里，失败重试、幂等或异常恢复是怎么处理的？",
      intent: "考察稳定性设计和生产环境经验。"
    },
    {
      question: "如果你简历中的系统流量翻倍，你会优先检查哪个环节？为什么？",
      intent: "考察系统设计、容量评估和优先级判断。"
    },
    {
      question: "请讲一次你在项目中遇到的线上问题或复杂 bug。你是如何定位并解决的？",
      intent: "考察排障过程、责任心和复盘能力。"
    },
    {
      question: "这个项目里你是如何和产品、测试或其他研发同事协作的？",
      intent: "考察沟通方式、推进能力和交付习惯。"
    },
    {
      question: "如果有机会重构你简历里的一个项目，你最想改哪一部分？为什么？",
      intent: "考察反思能力、技术权衡和工程成熟度。"
    }
  ];

  return topics.map((topic, index) => ({
    id: `q${index + 1}`,
    question: topic.question,
    intent: topic.intent,
    difficulty: index < 2 ? "中等" : "中高",
    reference_answer: referenceAnswer(topic.question, targetRole),
    scoring_rubric: [
      "回答能和简历经历对应起来",
      "能说明背景、行动和结果",
      "包含技术细节和方案权衡",
      "尽量补充指标或验证方式",
      "避免只有笼统结论而没有证据"
    ],
    follow_up_questions: [
      "你用什么指标证明这个方案是有效的？",
      "如果规模继续扩大，哪个环节最可能先出问题？"
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
      "回答能回应当前面试问题。",
      candidateAnswer.length > 80 ? "回答中有一定的具体说明。" : "回答比较简洁直接。"
    ],
    weaknesses: [
      hasMetric ? "已经提到指标，但前后对比可以再讲清楚。" : "建议补充具体指标或优化前后的对比证据。",
      hasTradeoff ? "已经提到权衡，可以进一步解释为什么选择这个方案。" : "建议补充技术权衡、风险和异常处理。"
    ],
    improved_answer:
      `${candidateAnswer.trim()} 更完整的表达可以补充：当时的业务背景、原始问题、你做出的具体技术决策、` +
      "为什么这样取舍、最终带来了什么可量化结果，以及边界场景或异常情况是如何处理的。",
    follow_up_question: question.follow_up_questions?.[0] || "你有什么证据证明这个方案确实有效？"
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
      "为每个核心项目准备一个 STAR 结构的回答：背景、任务、行动、结果。",
      "为性能、稳定性和交付成果补充优化前后的量化指标。",
      "练习解释方案权衡、失败场景和后续改进计划。"
    ]
  };
}

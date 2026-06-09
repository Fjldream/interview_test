import { getConfig } from "./config.js";
import { createJsonResponse } from "./openaiClient.js";
import {
  createMockFeedback,
  createMockProfile,
  createMockQuestions,
  createMockReport
} from "./mockInterview.js";
import { validateFeedbackRequest, validateGenerateRequest } from "./validation.js";

const profileSchema = {
  name: "candidate_profile",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["target_role", "seniority", "skills", "projects", "risk_points"],
    properties: {
      target_role: { type: "string" },
      seniority: { type: "string" },
      skills: { type: "array", items: { type: "string" } },
      projects: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "summary", "highlights"],
          properties: {
            name: { type: "string" },
            summary: { type: "string" },
            highlights: { type: "array", items: { type: "string" } }
          }
        }
      },
      risk_points: { type: "array", items: { type: "string" } }
    }
  }
};

const questionsSchema = {
  name: "interview_questions",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["questions"],
    properties: {
      questions: {
        type: "array",
        minItems: 8,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["id", "question", "intent", "difficulty", "reference_answer", "scoring_rubric", "follow_up_questions"],
          properties: {
            id: { type: "string" },
            question: { type: "string" },
            intent: { type: "string" },
            difficulty: { type: "string" },
            reference_answer: { type: "string" },
            scoring_rubric: { type: "array", items: { type: "string" } },
            follow_up_questions: { type: "array", items: { type: "string" } }
          }
        }
      }
    }
  }
};

const feedbackSchema = {
  name: "answer_feedback",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["score", "strengths", "weaknesses", "improved_answer", "follow_up_question"],
    properties: {
      score: { type: "number" },
      strengths: { type: "array", items: { type: "string" } },
      weaknesses: { type: "array", items: { type: "string" } },
      improved_answer: { type: "string" },
      follow_up_question: { type: "string" }
    }
  }
};

function toArray(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
}

export function normalizeInterviewQuestions(rawQuestions) {
  const questions = Array.isArray(rawQuestions) ? rawQuestions : [];
  return questions.map((question, index) => ({
    id: question.id || `q${index + 1}`,
    question: question.question || question.text || question["面试问题"] || "",
    intent: question.intent || question["考察点"] || question.criteria || "考察候选人与简历相关的真实经验。",
    difficulty: question.difficulty || question["难度"] || "中等",
    reference_answer:
      question.reference_answer ||
      question.standard_answer ||
      question.standardAnswer ||
      question.answer ||
      question["标准答案"] ||
      "",
    scoring_rubric: toArray(question.scoring_rubric || question.criteria || question.rubric || question["评分标准"]).length
      ? toArray(question.scoring_rubric || question.criteria || question.rubric || question["评分标准"])
      : ["回答是否结合简历经历、是否有技术细节、是否说明结果和权衡。"],
    follow_up_questions: toArray(question.follow_up_questions || question.followUp || question.follow_up || question["追问"]).length
      ? toArray(question.follow_up_questions || question.followUp || question.follow_up || question["追问"])
      : ["如果面试官继续深挖，你会补充哪些数据或细节？"]
  }));
}

export function normalizeAnswerFeedback(rawFeedback) {
  const feedback = rawFeedback || {};
  return {
    score: Number(feedback.score ?? feedback["分数"] ?? 0),
    strengths: toArray(feedback.strengths || feedback.highlights || feedback["亮点"]),
    weaknesses: toArray(feedback.weaknesses || feedback.missingPoints || feedback.missing_points || feedback["缺失点"]),
    improved_answer: feedback.improved_answer || feedback.improvedAnswer || feedback["优化版回答"] || "",
    follow_up_question: feedback.follow_up_question || feedback.followUp || feedback.follow_up || feedback["追问"] || ""
  };
}

function canUseLlm(config) {
  return Boolean((config.apiKey || config.openaiApiKey) && !config.useMockLlm);
}

function llmRequestOptions(config) {
  return {
    provider: config.provider || "openai",
    apiKey: config.apiKey || config.openaiApiKey,
    baseUrl: config.baseUrl,
    model: config.model || config.openaiModel
  };
}

async function extractProfile({ resumeText, targetRole, config }) {
  if (!canUseLlm(config)) {
    return createMockProfile({ resumeText, targetRole });
  }

  return createJsonResponse({
    ...llmRequestOptions(config),
    schema: profileSchema,
    instructions: "你是一名资深技术招聘专家和面试设计师。必须只返回合法 JSON，所有可读文本字段都使用中文。",
    input:
      `请从下面的简历中提取结构化候选人画像。\n\n` +
      `目标岗位：${targetRole}\n\n简历：\n${resumeText}`
  });
}

async function generateQuestions({ resumeText, profile, config }) {
  if (!canUseLlm(config)) {
    return createMockQuestions(profile);
  }

  const result = await createJsonResponse({
    ...llmRequestOptions(config),
    schema: questionsSchema,
    instructions:
      "你是一名资深面试官。请基于简历生成模拟面试题和标准答案。必须只返回合法 JSON，所有可读文本字段都使用中文。",
    input:
      "请生成 8 到 10 个面试问题。每个问题必须包含标准答案、评分标准和可能追问。" +
      "标准答案要像真实面试里的优秀回答，不要写成教材定义，并尽量结合候选人的简历经历。\n\n" +
      `候选人画像：\n${JSON.stringify(profile, null, 2)}\n\n简历：\n${resumeText}`
  });

  return normalizeInterviewQuestions(result.questions || result);
}

export async function generateInterview(input, options = {}) {
  const request = validateGenerateRequest(input);
  const config = options.config || getConfig();
  const profile = await extractProfile({ ...request, config });
  const questions = await generateQuestions({ resumeText: request.resumeText, profile, config });

  return { profile, questions };
}

export async function evaluateAnswer(input, options = {}) {
  const request = validateFeedbackRequest(input);
  const config = options.config || getConfig();

  if (!canUseLlm(config)) {
    return normalizeAnswerFeedback(createMockFeedback(request));
  }

  const result = await createJsonResponse({
    ...llmRequestOptions(config),
    schema: feedbackSchema,
    instructions: "你是一名面试官和职业教练。反馈要具体、实用、公平。必须只返回合法 JSON，所有可读文本字段都使用中文。",
    input:
      `面试问题：\n${request.question.question}\n\n` +
      `标准答案：\n${request.question.reference_answer}\n\n` +
      `评分标准：\n${JSON.stringify(request.question.scoring_rubric || [])}\n\n` +
      `候选人回答：\n${request.candidateAnswer}`
  });
  return normalizeAnswerFeedback(result);
}

export async function createFinalReport(input) {
  return createMockReport({
    targetRole: input?.targetRole || "目标岗位",
    answers: Array.isArray(input?.answers) ? input.answers : []
  });
}

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

function canUseOpenAI(config) {
  return Boolean(config.openaiApiKey && !config.useMockLlm);
}

async function extractProfile({ resumeText, targetRole, config }) {
  if (!canUseOpenAI(config)) {
    return createMockProfile({ resumeText, targetRole });
  }

  return createJsonResponse({
    apiKey: config.openaiApiKey,
    model: config.openaiModel,
    schema: profileSchema,
    instructions: "You are a senior technical recruiter and interview designer. Return valid JSON only.",
    input:
      `Extract a structured candidate profile from this resume.\n\n` +
      `Target role: ${targetRole}\n\nResume:\n${resumeText}`
  });
}

async function generateQuestions({ resumeText, profile, config }) {
  if (!canUseOpenAI(config)) {
    return createMockQuestions(profile);
  }

  const result = await createJsonResponse({
    apiKey: config.openaiApiKey,
    model: config.openaiModel,
    schema: questionsSchema,
    instructions:
      "You are a senior interviewer. Generate resume-specific mock interview questions with reference answers. Return valid JSON only.",
    input:
      "Generate 8 to 10 interview questions. Each question must include a reference answer, scoring rubric, and follow-up questions. " +
      "Reference answers should sound like strong interview responses, not textbook definitions.\n\n" +
      `Candidate profile:\n${JSON.stringify(profile, null, 2)}\n\nResume:\n${resumeText}`
  });

  return result.questions;
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

  if (!canUseOpenAI(config)) {
    return createMockFeedback(request);
  }

  return createJsonResponse({
    apiKey: config.openaiApiKey,
    model: config.openaiModel,
    schema: feedbackSchema,
    instructions: "You are an interviewer and career coach. Be specific, practical, and fair. Return valid JSON only.",
    input:
      `Question:\n${request.question.question}\n\n` +
      `Reference answer:\n${request.question.reference_answer}\n\n` +
      `Scoring rubric:\n${JSON.stringify(request.question.scoring_rubric || [])}\n\n` +
      `Candidate answer:\n${request.candidateAnswer}`
  });
}

export async function createFinalReport(input) {
  return createMockReport({
    targetRole: input?.targetRole || "Target Role",
    answers: Array.isArray(input?.answers) ? input.answers : []
  });
}

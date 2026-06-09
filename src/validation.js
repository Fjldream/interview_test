const MIN_RESUME_LENGTH = 80;

function readString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateGenerateRequest(input) {
  const resumeText = readString(input?.resumeText);
  const targetRole = readString(input?.targetRole);

  if (resumeText.length < MIN_RESUME_LENGTH) {
    throw new Error(`Resume must contain at least ${MIN_RESUME_LENGTH} characters.`);
  }

  if (!targetRole) {
    throw new Error("Target role is required.");
  }

  return { resumeText, targetRole };
}

export function validateFeedbackRequest(input) {
  const question = input?.question;
  const candidateAnswer = readString(input?.candidateAnswer);

  if (!question || typeof question !== "object") {
    throw new Error("Question is required.");
  }

  if (!readString(question.question)) {
    throw new Error("Question text is required.");
  }

  if (!readString(question.reference_answer)) {
    throw new Error("Question reference answer is required.");
  }

  if (!candidateAnswer) {
    throw new Error("Candidate answer is required.");
  }

  return { question, candidateAnswer };
}

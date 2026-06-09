const MIN_RESUME_LENGTH = 80;

function readString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateGenerateRequest(input) {
  const resumeText = readString(input?.resumeText);
  const targetRole = readString(input?.targetRole);

  if (resumeText.length < MIN_RESUME_LENGTH) {
    throw new Error(`简历内容至少需要 ${MIN_RESUME_LENGTH} 个字符。`);
  }

  if (!targetRole) {
    throw new Error("请填写目标岗位。");
  }

  return { resumeText, targetRole };
}

export function validateFeedbackRequest(input) {
  const question = input?.question;
  const candidateAnswer = readString(input?.candidateAnswer);

  if (!question || typeof question !== "object") {
    throw new Error("缺少面试问题。");
  }

  if (!readString(question.question)) {
    throw new Error("缺少面试问题文本。");
  }

  if (!readString(question.reference_answer)) {
    throw new Error("缺少标准答案。");
  }

  if (!candidateAnswer) {
    throw new Error("请先填写你的回答。");
  }

  return { question, candidateAnswer };
}

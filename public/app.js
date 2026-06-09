const state = {
  profile: null,
  questions: [],
  answers: [],
  currentIndex: 0,
  targetRole: ""
};

const elements = {
  setupForm: document.querySelector("#setupForm"),
  targetRole: document.querySelector("#targetRole"),
  resumeText: document.querySelector("#resumeText"),
  generateButton: document.querySelector("#generateButton"),
  profilePanel: document.querySelector("#profilePanel"),
  profileContent: document.querySelector("#profileContent"),
  emptyState: document.querySelector("#emptyState"),
  questionWorkspace: document.querySelector("#questionWorkspace"),
  progressText: document.querySelector("#progressText"),
  questionText: document.querySelector("#questionText"),
  difficultyText: document.querySelector("#difficultyText"),
  intentText: document.querySelector("#intentText"),
  answerText: document.querySelector("#answerText"),
  prevButton: document.querySelector("#prevButton"),
  nextButton: document.querySelector("#nextButton"),
  submitAnswerButton: document.querySelector("#submitAnswerButton"),
  answerPanel: document.querySelector("#answerPanel"),
  scoreText: document.querySelector("#scoreText"),
  referenceAnswerText: document.querySelector("#referenceAnswerText"),
  improvedAnswerText: document.querySelector("#improvedAnswerText"),
  strengthList: document.querySelector("#strengthList"),
  weaknessList: document.querySelector("#weaknessList"),
  followUpText: document.querySelector("#followUpText"),
  reportPanel: document.querySelector("#reportPanel"),
  averageScoreText: document.querySelector("#averageScoreText"),
  reportStrengths: document.querySelector("#reportStrengths"),
  reportWeakAreas: document.querySelector("#reportWeakAreas"),
  reportSuggestions: document.querySelector("#reportSuggestions"),
  toast: document.querySelector("#toast")
};

function sampleResume() {
  return [
    "后端开发工程师，4 年经验，主要使用 Java、Spring Boot、Redis、MySQL。",
    "负责订单系统、支付回调、缓存优化、消息队列消费、接口性能优化和生产问题排查。",
    "在订单查询场景中使用 Redis 缓存降低数据库压力，参与慢 SQL 优化和监控告警建设。"
  ].join("\n");
}

function showToast(message, type = "info") {
  elements.toast.textContent = message;
  elements.toast.className = `toast ${type === "error" ? "error" : ""}`;
  elements.toast.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    elements.toast.hidden = true;
  }, 3200);
}

async function api(path, payload) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error || "请求失败");
  }

  return body;
}

function setBusy(isBusy, label = "生成面试") {
  elements.generateButton.disabled = isBusy;
  elements.submitAnswerButton.disabled = isBusy;
  elements.generateButton.textContent = isBusy ? "处理中..." : label;
}

function renderList(element, items) {
  element.innerHTML = "";
  for (const item of items.filter(Boolean)) {
    const li = document.createElement("li");
    li.textContent = item;
    element.append(li);
  }
}

function renderProfile() {
  const profile = state.profile;
  elements.profilePanel.hidden = !profile;
  if (!profile) return;

  const rows = [
    ["目标岗位", profile.target_role],
    ["年限", profile.seniority],
    ["技能", profile.skills.join(" / ")],
    ["风险点", profile.risk_points.join("；")]
  ];

  elements.profileContent.innerHTML = rows
    .map(([label, value]) => `<div class="profile-row"><strong>${label}</strong><span>${value}</span></div>`)
    .join("");
}

function currentQuestion() {
  return state.questions[state.currentIndex];
}

function currentAnswer() {
  return state.answers[state.currentIndex] || null;
}

function renderFeedback(answer) {
  elements.answerPanel.hidden = !answer;
  if (!answer) return;

  const question = currentQuestion();
  elements.scoreText.textContent = `${answer.feedback.score}/10`;
  elements.referenceAnswerText.textContent = question.reference_answer;
  elements.improvedAnswerText.textContent = answer.feedback.improved_answer;
  elements.followUpText.textContent = answer.feedback.follow_up_question;
  renderList(elements.strengthList, answer.feedback.strengths || []);
  renderList(elements.weaknessList, answer.feedback.weaknesses || []);
}

function renderQuestion() {
  const question = currentQuestion();
  const answer = currentAnswer();

  elements.emptyState.hidden = true;
  elements.questionWorkspace.hidden = false;
  elements.reportPanel.hidden = true;

  elements.progressText.textContent = `第 ${state.currentIndex + 1} / ${state.questions.length} 题`;
  elements.questionText.textContent = question.question;
  elements.difficultyText.textContent = question.difficulty;
  elements.intentText.textContent = question.intent;
  elements.answerText.value = answer?.candidateAnswer || "";
  elements.answerText.disabled = Boolean(answer);
  elements.submitAnswerButton.disabled = Boolean(answer);
  elements.submitAnswerButton.textContent = answer ? "已提交" : "提交回答";
  elements.prevButton.disabled = state.currentIndex === 0;
  elements.nextButton.textContent = state.currentIndex === state.questions.length - 1 ? "生成报告" : "下一题";
  renderFeedback(answer);
}

async function generateInterview(event) {
  event.preventDefault();
  setBusy(true);

  try {
    state.targetRole = elements.targetRole.value.trim();
    const result = await api("/api/generate", {
      targetRole: state.targetRole,
      resumeText: elements.resumeText.value
    });

    state.profile = result.profile;
    state.questions = result.questions;
    state.answers = Array.from({ length: result.questions.length }, () => null);
    state.currentIndex = 0;
    renderProfile();
    renderQuestion();
    showToast("面试问题已生成");
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setBusy(false);
  }
}

async function submitAnswer() {
  const question = currentQuestion();
  const candidateAnswer = elements.answerText.value.trim();

  if (!candidateAnswer) {
    showToast("请先填写你的回答", "error");
    return;
  }

  elements.submitAnswerButton.disabled = true;
  elements.submitAnswerButton.textContent = "评分中...";

  try {
    const feedback = await api("/api/evaluate", { question, candidateAnswer });
    state.answers[state.currentIndex] = { question, candidateAnswer, feedback };
    renderQuestion();
    showToast("本题反馈已生成");
  } catch (error) {
    elements.submitAnswerButton.disabled = false;
    elements.submitAnswerButton.textContent = "提交回答";
    showToast(error.message, "error");
  }
}

async function showReport() {
  const answered = state.answers.filter(Boolean);

  if (answered.length < state.questions.length) {
    showToast("还有题目没有提交回答", "error");
    return;
  }

  try {
    const report = await api("/api/report", {
      targetRole: state.targetRole,
      answers: answered
    });

    elements.reportPanel.hidden = false;
    elements.averageScoreText.textContent = `${report.average_score}/10`;
    renderList(elements.reportStrengths, report.strengths || []);
    renderList(elements.reportWeakAreas, report.weak_areas || []);
    renderList(elements.reportSuggestions, report.practice_suggestions || []);
    elements.reportPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    showToast(error.message, "error");
  }
}

function goNext() {
  if (state.currentIndex === state.questions.length - 1) {
    showReport();
    return;
  }

  state.currentIndex += 1;
  renderQuestion();
}

function goPrevious() {
  if (state.currentIndex === 0) return;
  state.currentIndex -= 1;
  renderQuestion();
}

elements.resumeText.value = sampleResume();
elements.setupForm.addEventListener("submit", generateInterview);
elements.submitAnswerButton.addEventListener("click", submitAnswer);
elements.nextButton.addEventListener("click", goNext);
elements.prevButton.addEventListener("click", goPrevious);

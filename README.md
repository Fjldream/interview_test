# 简历模拟面试 MVP

一个根据简历生成面试问题的模拟面试应用。用户逐题作答，提交后立即看到标准答案、评分、亮点、缺失点、优化版回答和追问。

## 环境要求

应用只使用 Node.js 内置 API，没有外部依赖。

如果本机 Homebrew 依赖异常，系统 `node` 可能不可用。可以使用 Codex 自带的 Node：

```bash
/Users/fengjinlong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
```

## 运行测试

```bash
/Users/fengjinlong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/*.test.js
```

## 启动应用

```bash
/Users/fengjinlong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node src/server.js
```

然后打开：

```text
http://localhost:3000
```

如果想稳定本地测试、不调用 OpenAI：

```bash
USE_MOCK_LLM=true /Users/fengjinlong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node src/server.js
```

## 简历输入

目前支持两种方式：

- 直接粘贴简历文本。
- 上传 `.txt` 或 `.md` 简历文件，页面会自动读取并填入文本框。

PDF 和 DOCX 解析需要额外依赖，当前零依赖 MVP 暂不内置。

## 可选环境变量

```bash
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-5-mini
PORT=3000
USE_MOCK_LLM=false
```

如果没有配置 `OPENAI_API_KEY`，或者设置了 `USE_MOCK_LLM=true`，应用会使用本地 mock 面试数据，方便直接体验。

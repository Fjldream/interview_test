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

## 启动桌面端

当前桌面端优先支持 macOS，使用 Electron 复用现有 Web 应用。

```bash
/Users/fengjinlong/.bun/bin/bun run desktop:mock
```

如果要连接真实大模型生成题目和点评：

```bash
OPENAI_API_KEY=your_api_key /Users/fengjinlong/.bun/bin/bun run desktop
```

桌面端回答框旁边有“语音输入”按钮，默认尝试使用运行环境提供的中文语音识别能力，语言为 `zh-CN`。如果当前 Electron/macOS 权限环境不支持应用内语音识别，界面会提示不可用；这时仍可以使用 macOS 系统听写或输入法语音输入到回答框。

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

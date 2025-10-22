# Comprehensive Guide to Accessing Reasoning Stream Data from AI Models on AIMLAPI.com

## Introduction
AIMLAPI.com is a unified platform providing access to over 300 AI models from various providers through a single API endpoint. This guide focuses on models that support **reasoning streaming**, where intermediate reasoning steps (e.g., chain-of-thought or CoT processes) can be streamed in real-time via the API. Reasoning streaming allows developers to display progressive "thinking" in applications, enhancing user experience for complex tasks like problem-solving, math, coding, or analysis.

Key concepts:
- **Reasoning Data**: Refers to step-by-step thoughts, logical breakdowns, or internal processes (e.g., tagged as `<think>` or explicit CoT steps) generated before or alongside the final output.
- **Streaming**: Enabled by setting `stream: true` in API requests, delivering responses as Server-Sent Events (SSE) chunks. This allows real-time parsing of partial reasoning without waiting for completion.
- **API Endpoint**: All models use the OpenAI-compatible `POST /v1/chat/completions` at `https://api.aimlapi.com/v1/chat/completions`.
- **Prerequisites**:
  - Sign up at https://aimlapi.com/app/sign-up to obtain an API key.
  - Free Developer tier available (limited requests); upgrade for higher quotas.
  - Pricing is token-based; check https://aimlapi.com/ai-ml-api-pricing.
  - Use prompts to trigger reasoning (e.g., "Think step-by-step") if no dedicated parameters exist.
- **General Process**:
  1. Authenticate with `Authorization: Bearer <YOUR_API_KEY>`.
  2. Construct a request body with `model`, `messages`, and `stream: true`.
  3. Handle SSE streams: Parse chunks for `delta.content` to accumulate reasoning/output.
  4. Token usage includes reasoning tokens; monitor via `usage` in final chunk.
- **Limitations**: Not all models expose raw internal thoughts; some hide them (e.g., o1-preview). Streaming increases latency for long reasoning.

This guide covers models with documented reasoning/streaming support as of October 17, 2025. Models are selected based on platform docs and features like hybrid modes, CoT, or thinking parameters. For each, we include: overview, model ID, enabling reasoning/streaming, API parameters, code examples (Python and JavaScript), and response handling.

## 1. Zhipu GLM-4.5
### Overview
GLM-4.5 is a hybrid reasoning model from Zhipu, supporting "thinking" mode for complex reasoning/tool use and "non-thinking" mode for quick responses. It generates reasoning tokens (e.g., step-by-step breakdowns, potentially tagged as `<think>`) that can be streamed. Ideal for math, logic, and agentic tasks. Context window: Not specified, but supports up to 200 max_completion_tokens in examples.

### Model ID
`zhipu/glm-4.5`

### Process to Get Reasoning Stream Data
1. **Enable Reasoning**: Use complex prompts (e.g., "Solve step by step") or set `tool_choice: "auto"` to trigger thinking mode. No explicit "thinking" param; modes activate based on prompt/tool needs.
2. **Enable Streaming**: Set `stream: true` in the request. Reasoning chunks (partial thoughts) arrive incrementally.
3. **Request**: POST to `/v1/chat/completions` with JSON body.
4. **Handle Response**: Parse SSE for `data:` lines; accumulate `choices[0].delta.content` for real-time display. Reasoning may include tags like `<think>`.
5. **Best Practices**: Limit `max_completion_tokens` to bound reasoning depth. Use for tasks needing transparency.

### Key API Parameters for Reasoning/Streaming
- `model`: `"zhipu/glm-4.5"` (required).
- `messages`: Array of `{role: "user/assistant", content: string}` (required; prompt here triggers reasoning).
- `stream`: `true` (for SSE chunks with partial reasoning).
- `tool_choice`: `"auto"` (enables tools/reasoning), `"none"` (non-thinking), or specific function.
- `max_completion_tokens`: Integer (e.g., 200; includes reasoning tokens).
- `top_p`, `frequency_penalty`, etc.: Tune randomness/repetition to refine reasoning quality.

### Code Examples
#### Python (Using requests for Streaming)
```python
import requests
import json

url = "https://api.aimlapi.com/v1/chat/completions"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
payload = {
    "model": "zhipu/glm-4.5",
    "messages": [{"role": "user", "content": "Solve 15 * 23 step by step."}],
    "stream": True,
    "tool_choice": "auto",
    "max_completion_tokens": 200
}

response = requests.post(url, headers=headers, json=payload, stream=True)
full_reasoning = ""
for line in response.iter_lines():
    if line:
        decoded = line.decode('utf-8')
        if decoded.startswith("data: "):
            data = decoded[6:]
            if data == "[DONE]": break
            chunk = json.loads(data)
            if "choices" in chunk and chunk["choices"][0]["delta"].get("content"):
                content = chunk["choices"][0]["delta"]["content"]
                full_reasoning += content
                print(content, end="")  # Display reasoning in real-time
print("\nFull Reasoning:", full_reasoning)
```

#### JavaScript (Using Fetch for Streaming)
```javascript
async function streamGLMReasoning() {
  const response = await fetch('https://api.aimlapi.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'zhipu/glm-4.5',
      messages: [{ role: 'user', content: 'Solve 15 * 23 step by step.' }],
      stream: true,
      tool_choice: 'auto',
      max_completion_tokens: 200
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullReasoning = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') break;
        const parsed = JSON.parse(data);
        if (parsed.choices[0].delta.content) {
          fullReasoning += parsed.choices[0].delta.content;
          console.log(parsed.choices[0].delta.content);  // Stream to UI
        }
      }
    }
  }
  console.log('Full Reasoning:', fullReasoning);
}

streamGLMReasoning();
```

### Example Response Handling
Chunks might look like: `{"choices": [{"delta": {"content": "First, 15 * 20 = 300..."}}]}`. Aggregate for full CoT. Final chunk includes `usage` with `completion_tokens` (includes reasoning).

## 2. DeepSeek V3.2-Exp Thinking
### Overview
An advanced hybrid reasoning model from DeepSeek, optimized for multi-step CoT and deep cognitive tasks. Supports explicit intermediate steps in thinking mode. Context window: 128K tokens. Excels in math, coding, and long-context analysis.

### Model ID
`deepseek/deepseek-v3-2-exp-thinking` (inferred from docs; confirm in playground).

### Process to Get Reasoning Stream Data
1. **Enable Reasoning**: Activate "thinking mode" via prompts like "Think step-by-step" or complex queries. No dedicated param; CoT generates explicitly.
2. **Enable Streaming**: `stream: true` for real-time reasoning chunks.
3. **Request**: Standard chat completions.
4. **Handle Response**: Parse deltas for progressive thoughts.
5. **Best Practices**: Use for tasks needing explainability; sparse attention reduces costs for long contexts.

### Key API Parameters for Reasoning/Streaming
- `model`: `"deepseek/deepseek-v3-2-exp-thinking"` (required).
- `messages`: Prompt to trigger CoT.
- `stream`: `true`.
- `max_tokens`: Bounds output including reasoning.

### Code Examples
Similar to GLM-4.5; replace `model` and prompt. E.g., in Python: Change model to `"deepseek/deepseek-v3-2-exp-thinking"`.

## 3. Google Gemini 2.5 Flash
### Overview
Multimodal reasoning model with adjustable "thinking" depth. Supports CoT for math/science/coding. Context window: 1M tokens. Streaming enabled for real-time outputs, with improved performance in thinking mode (e.g., AIME: 78.3%).

### Model ID
`google/gemini-2-5-flash`

### Process to Get Reasoning Stream Data
1. **Enable Reasoning**: Use prompts for "thinking" (e.g., "Use thinking mode"). Adjustable depth implied but no explicit param.
2. **Enable Streaming**: `stream: true`.
3. **Request**: Include multimodal if needed.
4. **Handle Response**: Chunks include logical steps.
5. **Best Practices**: Higher latency in thinking mode; use for visual/reasoning hybrids.

### Key API Parameters for Reasoning/Streaming
- `model`: `"google/gemini-2-5-flash"`.
- `messages`: CoT-prompted.
- `stream`: `true`.

### Code Examples
Adapt from GLM-4.5; replace model.

## 4. DeepSeek V3.1 Terminus Reasoning
### Overview
Hybrid MoE model for CoT in agentic workflows. Supports thinking mode for tool planning/multi-step reasoning. Context window: 128K tokens. Optimized for coding/search.

### Model ID
`deepseek/deepseek-v3-1-terminus-reasoning`

### Process to Get Reasoning Stream Data
1. **Enable Reasoning**: Prompt for thinking mode; hybrid modes switch based on task.
2. **Enable Streaming**: `stream: true` (implied support via platform).
3. **Request**: Use tools for enhanced CoT.
4. **Handle Response**: Streamed steps in agent tasks.
5. **Best Practices**: Reduced token use (20-50%) in reasoning mode.

### Key API Parameters for Reasoning/Streaming
- `model`: `"deepseek/deepseek-v3-1-terminus-reasoning"`.
- `messages`: Complex prompts.
- `stream`: `true`.

### Code Examples
Similar to above.

## 5. OpenAI o1-preview
### Overview
Advanced reasoning model with built-in CoT for science/coding/math. High accuracy (e.g., IMO: 83%). However, **streaming is NOT supported** in beta phase.

### Model ID
`openai/o1-preview`

### Process to Get Reasoning Stream Data
1. **Enable Reasoning**: Automatic "thinks before answers"; no `reasoning_effort` param mentioned.
2. **Streaming**: Not available; use non-streaming for full CoT in response.
3. **Request**: Standard, but expect longer times.
4. **Handle Response**: Single response with CoT in content.
5. **Best Practices**: For non-real-time apps; check OpenAI docs for updates.

### Key API Parameters
- `model`: `"openai/o1-preview"`.
- No `stream` support.

### Code Examples (Non-Streaming)
Python:
```python
response = requests.post(url, headers=headers, json={
    "model": "openai/o1-preview",
    "messages": [{"role": "user", "content": "Reason step-by-step: Integrate x^2."}]
})
print(response.json()["choices"][0]["message"]["content"])  # Includes CoT
```

## 6. Anthropic Claude-3.5-Sonnet (and Variants)
### Overview
Based on platform's 300+ models, Claude supports thinking parameters for CoT. Assumed available; excels in ethical/reasoning tasks.

### Model ID
`anthropic/claude-3-5-sonnet-20240620`

### Process to Get Reasoning Stream Data
1. **Enable Reasoning**: Use `thinking: {"budget_tokens": 1024, "type": "enabled"}` for <thinking> blocks.
2. **Enable Streaming**: `stream: true`.
3. **Request**: Include thinking param.
4. **Handle Response**: Chunks with <thinking> tags.
5. **Best Practices**: For precise, safe reasoning.

### Key API Parameters
- `model`: As above.
- `thinking`: Object for mode.
- `stream`: `true`.

### Code Examples
Add `"thinking": {"budget_tokens": 1024, "type": "enabled"}` to payload.

## Conclusion
This guide provides a step-by-step process for each model. Test in AIMLAPI's playground. For updates, visit docs.aimlapi.com. If a model lacks native params, rely on prompts. Contact support via Discord for custom integrations.

1. OpenAI GPT-5
Overview
OpenAI's GPT-5 is a multimodal, advanced reasoning model optimized for complex tasks like math, coding, and multi-turn conversations. It features an integrated "thinking" mode that generates step-by-step reasoning (CoT) for tasks requiring deep analysis. The model uses a router to auto-select reasoning depth based on the prompt (e.g., "think hard" increases CoT complexity). Streaming is supported, allowing real-time delivery of reasoning steps. Context window: Up to 128K tokens. Token usage reports include reasoning tokens, making it suitable for apps displaying progressive logic.
Model ID
openai/gpt-5
Process to Get Reasoning Stream Data

Enable Reasoning: Trigger CoT via prompts like "Think step-by-step" or "Explain your reasoning." The model's router dynamically adjusts reasoning depth; no explicit thinking parameter is required.
Enable Streaming: Set stream: true in the request body to receive SSE chunks containing partial reasoning (e.g., intermediate steps like "First, consider..." or "Evaluating option X...").
Request: POST to /v1/chat/completions with JSON body including model, messages, and streaming flag.
Handle Response: Parse SSE chunks for choices[0].delta.content to extract and display reasoning in real-time. The final chunk includes usage with prompt_tokens, completion_tokens (including reasoning), and total_tokens.
Best Practices:

Use max_completion_tokens to limit reasoning/output length (e.g., 500 tokens).
For complex tasks, include multi-turn messages to refine reasoning.
Monitor token usage, as reasoning tokens increase costs.
Suitable for educational tools, coding assistants, or apps needing transparent problem-solving.



Key API Parameters for Reasoning/Streaming

model: "openai/gpt-5" (required).
messages: Array of {role: "user/assistant/system", content: string} (required; use prompts like "Solve step-by-step: What is 15 * 23?" to trigger CoT).
stream: true (enables SSE for real-time reasoning chunks).
max_completion_tokens: Integer (e.g., 500; bounds reasoning + output tokens).
temperature: Float (0-2, default ~1; lower for deterministic reasoning).
top_p: Float (0.01-1; nucleus sampling for response diversity).
frequency_penalty / presence_penalty: Float (-2 to 2; reduces repetition, encourages new topics).

Code Examples
Python (Using OpenAI SDK for Streaming)
pythonfrom openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="https://api.aimlapi.com/v1"
)

stream = client.chat.completions.create(
    model="openai/gpt-5",
    messages=[
        {"role": "system", "content": "You are a math tutor. Provide step-by-step reasoning."},
        {"role": "user", "content": "Solve 15 * 23 step by step."}
    ],
    stream=True,
    max_completion_tokens=500,
    temperature=0.7
)

full_reasoning = ""
for chunk in stream:
    if chunk.choices[0].delta.content is not None:
        content = chunk.choices[0].delta.content
        full_reasoning += content
        print(content, end="", flush=True)  # Display reasoning in app UI
    if chunk.choices[0].finish_reason:  # Final chunk
        print("\nToken Usage:", chunk.usage)  # Includes reasoning tokens
print("\nFull Reasoning:", full_reasoning)
JavaScript (Using Fetch for Streaming)
javascriptasync function streamGPT5Reasoning() {
  const response = await fetch('https://api.aimlapi.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'openai/gpt-5',
      messages: [
        { role: 'system', content: 'You are a math tutor. Provide step-by-step reasoning.' },
        { role: 'user', content: 'Solve 15 * 23 step by step.' }
      ],
      stream: true,
      max_completion_tokens: 500,
      temperature: 0.7
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullReasoning = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') break;
        const parsed = JSON.parse(data);
        if (parsed.choices[0].delta.content) {
          fullReasoning += parsed.choices[0].delta.content;
          console.log(parsed.choices[0].delta.content);  // Update UI in real-time
        }
        if (parsed.choices[0].finish_reason) {
          console.log('Token Usage:', parsed.usage);  // Includes reasoning tokens
        }
      }
    }
  }
  console.log('Full Reasoning:', fullReasoning);
}

streamGPT5Reasoning();
Example Response Handling

Chunk Example: {"id": "cmpl-123", "object": "chat.completion.chunk", "choices": [{"delta": {"content": "Step 1: Break down 23 into 20 + 3..."}}]}
Accumulation: Append delta.content to a string for progressive display.
Final Chunk: Includes finish_reason: "stop" and usage (e.g., {"prompt_tokens": 50, "completion_tokens": 200, "total_tokens": 250}).
Reasoning Detection: Look for phrases like "Step X" or logical transitions in content. No explicit <thinking> tags unless prompted.


2. DeepSeek R1
Overview
DeepSeek R1 is a high-performance model optimized for low-temperature reasoning, excelling in coding, data analysis, and logical tasks. It supports explicit CoT when prompted (e.g., "Explain your reasoning step-by-step"). Streaming delivers incremental reasoning steps, making it ideal for applications needing real-time logic display. Context window: Up to 128K tokens. Known for efficiency in reasoning-heavy tasks.
Model ID
deepseek/deepseek-r1
Process to Get Reasoning Stream Data

Enable Reasoning: Use prompts to trigger CoT (e.g., "Provide a step-by-step explanation"). No dedicated thinking parameter; relies on prompt engineering.
Enable Streaming: Set stream: true for SSE chunks containing partial reasoning.
Request: POST to /v1/chat/completions with model, messages, and streaming.
Handle Response: Parse choices[0].delta.content for reasoning steps (e.g., "First, analyze the input..."). Final chunk reports token usage.
Best Practices:

Use low temperature (e.g., 0.3) for precise reasoning.
Suitable for coding assistants or data analysis tools.
Monitor token costs, as CoT increases completion_tokens.



Key API Parameters for Reasoning/Streaming

model: "deepseek/deepseek-r1" (required).
messages: Prompt for CoT (e.g., "Write a Python function to sort an array, explaining each step.").
stream: true.
max_tokens: Integer (e.g., 1000; includes reasoning tokens).
temperature: Float (0-2; use ~0.3 for deterministic CoT).
top_p: Float (0.01-1; default ~1).

Code Examples
Python (Using OpenAI SDK)
pythonfrom openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="https://api.aimlapi.com/v1"
)

stream = client.chat.completions.create(
    model="deepseek/deepseek-r1",
    messages=[
        {"role": "user", "content": "Write a Python function to sort an array, explaining each step."}
    ],
    stream=True,
    max_tokens=1000,
    temperature=0.3
)

full_reasoning = ""
for chunk in stream:
    if chunk.choices[0].delta.content is not None:
        content = chunk.choices[0].delta.content
        full_reasoning += content
        print(content, end="", flush=True)  # Stream to app
    if chunk.choices[0].finish_reason:
        print("\nToken Usage:", chunk.usage)
print("\nFull Reasoning:", full_reasoning)
JavaScript (Using Fetch)
javascriptasync function streamR1Reasoning() {
  const response = await fetch('https://api.aimlapi.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'deepseek/deepseek-r1',
      messages: [
        { role: 'user', content: 'Write a Python function to sort an array, explaining each step.' }
      ],
      stream: true,
      max_tokens: 1000,
      temperature: 0.3
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullReasoning = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') break;
        const parsed = JSON.parse(data);
        if (parsed.choices[0].delta.content) {
          fullReasoning += parsed.choices[0].delta.content;
          console.log(parsed.choices[0].delta.content);  // Stream to UI
        }
        if (parsed.choices[0].finish_reason) {
          console.log('Token Usage:', parsed.usage);
        }
      }
    }
  }
  console.log('Full Reasoning:', fullReasoning);
}

streamR1Reasoning();
Example Response Handling

Chunk Example: {"choices": [{"delta": {"content": "Step 1: Choose bubble sort for simplicity..."}}]}
Accumulation: Concatenate delta.content for real-time display.
Final Chunk: Includes finish_reason: "stop" and usage (e.g., 300 completion tokens for reasoning + code).
Reasoning Detection: Look for "Step X" or code comments in content.


3. Alibaba Qwen3-235b-a22b-thinking-2507
Overview
Qwen3-235b-a22b-thinking-2507 is a high-precision reasoning model from Alibaba, optimized for math, logic, and academic tasks. It supports explicit CoT with a dedicated enable_thinking parameter, allowing streamed reasoning steps up to a specified token limit. Context window: Not explicitly stated, but supports large contexts (assume ~128K based on similar models). Ideal for multilingual or academic applications requiring transparent reasoning.
Model ID
alibaba/qwen3-235b-a22b-thinking-2507
Process to Get Reasoning Stream Data

Enable Reasoning: Set "enable_thinking": true and optionally max_reasoning_tokens (e.g., 512) to control CoT depth. Alternatively, use prompts like "Reason step-by-step."
Enable Streaming: Set stream: true for SSE delivery of reasoning steps (e.g., "Reasoning: Hypothesis 1...").
Request: POST to /v1/chat/completions with thinking parameters.
Handle Response: Parse delta.content for <thinking> tags or CoT steps. Final chunk includes token usage.
Best Practices:

Use enable_thinking for explicit reasoning control.
Suitable for apps needing multilingual reasoning or academic rigor.
Test in AIMLAPI playground to optimize max_reasoning_tokens.



Key API Parameters for Reasoning/Streaming

model: "alibaba/qwen3-235b-a22b-thinking-2507" (required).
messages: Prompt for CoT (e.g., "Prove the Pythagorean theorem step-by-step.").
stream: true.
enable_thinking: true (enables CoT mode).
max_reasoning_tokens: Integer (e.g., 512; limits reasoning tokens).
max_tokens: Integer (e.g., 1000; total output including reasoning).
temperature: Float (0-2; use ~0.5 for precise reasoning).

Code Examples
Python (Using OpenAI SDK)
pythonfrom openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="https://api.aimlapi.com/v1"
)

stream = client.chat.completions.create(
    model="alibaba/qwen3-235b-a22b-thinking-2507",
    messages=[
        {"role": "user", "content": "Prove the Pythagorean theorem step-by-step."}
    ],
    stream=True,
    enable_thinking=True,
    max_reasoning_tokens=512,
    max_tokens=1000,
    temperature=0.5
)

full_reasoning = ""
for chunk in stream:
    if chunk.choices[0].delta.content is not None:
        content = chunk.choices[0].delta.content
        full_reasoning += content
        print(content, end="", flush=True)  # Stream to app
    if chunk.choices[0].finish_reason:
        print("\nToken Usage:", chunk.usage)
print("\nFull Reasoning:", full_reasoning)
JavaScript (Using Fetch)
javascriptasync function streamQwenReasoning() {
  const response = await fetch('https://api.aimlapi.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'alibaba/qwen3-235b-a22b-thinking-2507',
      messages: [
        { role: 'user', content: 'Prove the Pythagorean theorem step-by-step.' }
      ],
      stream: true,
      enable_thinking: true,
      max_reasoning_tokens: 512,
      max_tokens: 1000,
      temperature: 0.5
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullReasoning = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') break;
        const parsed = JSON.parse(data);
        if (parsed.choices[0].delta.content) {
          fullReasoning += parsed.choices[0].delta.content;
          console.log(parsed.choices[0].delta.content);  // Stream to UI
        }
        if (parsed.choices[0].finish_reason) {
          console.log('Token Usage:', parsed.usage);
        }
      }
    }
  }
  console.log('Full Reasoning:', fullReasoning);
}

streamQwenReasoning();
Example Response Handling

Chunk Example: {"choices": [{"delta": {"content": "<thinking>Step 1: Consider a right triangle...</thinking>"}}]}
Accumulation: Append delta.content; detect <thinking> tags or "Step X" for UI separation.
Final Chunk: Includes finish_reason: "stop" and usage (e.g., 400 reasoning tokens + 100 output).
AI Builder Documentation: Using AIMLAPI for Text Models
This documentation provides a comprehensive guide for developers using the AI/ML API (AIMLAPI) to integrate text models into applications. AIMLAPI offers access to over 300 AI models, including text-based large language models (LLMs), through an OpenAI-compatible API. This allows for cost-efficient, scalable integration with features like completions, streaming, and more. The API is designed for low latency and high performance, making it suitable for building AI-powered apps.
For official details, refer to the AIMLAPI documentation portal.
Introduction
AIMLAPI is a unified API that provides access to a wide range of AI models, including popular text models from providers like OpenAI, Anthropic, DeepSeek, and others. It supports tasks such as chat completions, embeddings, and more, with pricing based on token usage. Text models are used for generating responses, reasoning, and natural language processing. The API is compatible with OpenAI's structure, so you can use existing OpenAI SDKs by updating the base URL and API key.
Key features include:

Ultra-fast streaming responses.
Support for over 200 text models with varying context lengths (e.g., up to 1,000,000 tokens).
Usage-based pricing starting at $0.0004 per token.
Enterprise-grade uptime and throughput.

Getting Started: Connecting and Authenticating
Prerequisites

Create an account at https://aimlapi.com/app/sign-up.
Generate an API key from your dashboard at https://aimlapi.com/app/keys. Ensure the key is enabled.
Note: Third-party API keys (e.g., from OpenAI) are not compatible; use only AIMLAPI keys.
For SDK usage: Install required libraries (e.g., pip install openai for Python).

Authentication
Use your API key for authentication. Set the base URL to https://api.aimlapi.com/v1 (or https://api.aimlapi.com). Do not share your API key, as it grants access to your account.
Python Example (Using OpenAI SDK)
pythonfrom openai import OpenAI

api_key = "<YOUR_AIMLAPI_KEY>"
base_url = "https://api.aimlapi.com/v1"

client = OpenAI(api_key=api_key, base_url=base_url)
Node.js Example (Using OpenAI SDK)
javascriptconst { OpenAI } = require("openai");

const apiKey = "<YOUR_AIMLAPI_KEY>";
const baseURL = "https://api.aimlapi.com/v1";

const client = new OpenAI({ apiKey, baseURL });
For REST API calls, include the key in the Authorization header: Bearer <YOUR_AIMLAPI_KEY>.
Making Completions
AIMLAPI supports chat completions for text models, where you provide messages (system, user, assistant roles) and receive generated responses. Select a model ID from the available text models (e.g., "gpt-4o", "mistralai/Mistral-7B-Instruct-v0.2").
Available Text Models
Text models are categorized by provider with context lengths indicating maximum tokens:

OpenAI: Models like gpt-4o (128,000 tokens).
Anthropic: Claude models (200,000 tokens).
DeepSeek: 128,000 tokens (some coming soon).
Others: Alibaba Cloud (up to 1,000,000 tokens), MiniMax, etc.

View all models at https://aimlapi.com/models/ for filtering by task or capabilities.
Chat Completions Example (Python with OpenAI SDK)
pythoncompletion = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Explain quantum computing."}
    ],
    temperature=0.7,
    max_tokens=256
)

response = completion.choices[0].message.content
print(response)
REST API Example (JavaScript with fetch)
javascriptfetch("https://api.aimlapi.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": "Bearer <YOUR_AIMLAPI_KEY>",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: "gpt-4o",
    messages: [{"role": "user", "content": "What is AIMLAPI?"}],
    max_tokens: 512
  })
})
.then(res => res.json())
.then(console.log);
Parameters include model, messages, temperature, max_tokens, etc.
Streaming Responses
Streaming allows real-time response generation, delivering chunks as the model processes. Set stream=True in requests. This is useful for interactive apps to show "thinking" progress.
Python Streaming Example (OpenAI SDK)
pythonstream = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Tell a story."}],
    stream=True
)

for chunk in stream:
    if chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end="")
For REST, handle the response as a stream (e.g., using res.body in Node.js).
Error Handling
Errors return JSON with message, path, requestId, statusCode, and timestamp. Common codes:

200-204: Success.
400: Bad request (invalid params).
401: Unauthorized (invalid key).
429: Rate limit exceeded (e.g., free-tier limit; upgrade at https://aimlapi.com/app/billing/).
500+: Server errors (retry later).

Best practices: Check status codes, use requestId for support, monitor rate limits.
Example Error:
json{
  "message": "Free-tier limit reached. Upgrade to continue.",
  "statusCode": "429"
}
Token Counting
Tokens are the basic units of text processed by models (approx. 4 chars = 1 token, 75 words = 100 tokens). AIMLAPI pricing is token-based.
To count tokens before API calls (to avoid limits), use libraries like Tiktoken (OpenAI-compatible):
pythonimport tiktoken

encoding = tiktoken.encoding_for_model("gpt-4o")
tokens = len(encoding.encode("Your text here"))
print(tokens)
Practical estimates:

1-2 sentences: ~30 tokens.
Paragraph: ~100 tokens.

API responses include usage data (e.g., completion.usage.prompt_tokens).
Chain of Thought (Think Out Loud)
Chain of Thought (CoT) is a prompting technique to improve reasoning by encouraging the model to "think out loud" step-by-step. It's not an API parameter but part of your prompt design.
Example Prompt:
json{"role": "user", "content": "Solve 2+2. Think step by step."}
Response might: "First, 2 is a number. Second, adding another 2. Result: 4."
Use in completions to handle complex tasks like math or logic.
Other Features

Embeddings: Generate vector representations of text via client.embeddings.create.
Supported SDKs: OpenAI, AIMLAPI's Python library (pip install aiml_api), REST.
Integrations: Compatible with LangChain, Promptfoo, etc.
Solutions: Pre-built tools like AI Search Engine or OpenAI Assistants for app building.

Building an App with AIMLAPI
To build an app:

Authenticate and select a text model.
Use chat completions for user interactions.
Implement streaming for real-time UI updates.
Handle errors gracefully (e.g., retry on 5xx).
Monitor tokens to optimize costs.
Apply CoT for advanced reasoning.

Example App Structure (Python Flask):

Endpoint for user queries: Call completions and return response.
Add streaming for live typing effect.

Test in the sandbox at AIMLAPI.com before deployment.
For more, visit https://docs.aimlapi.com/ or the API docs on GitHub. If you encounter issues, check the FAQ or contact support.29 web pages4.1sre crete doc for using with react and not pythonThought for 35sAI Builder Documentation: Using AIMLAPI for Text Models with React
This documentation provides a comprehensive guide for developers using the AI/ML API (AIMLAPI) to integrate text models into React applications. AIMLAPI offers access to over 300 AI models, including text-based large language models (LLMs), through an OpenAI-compatible API. This allows for cost-efficient, scalable integration with features like completions, streaming, and more. The API is designed for low latency and high performance, making it suitable for building AI-powered apps.
For official details, refer to the AIMLAPI documentation portal.
Introduction
AIMLAPI is a unified API that provides access to a wide range of AI models, including popular text models from providers like OpenAI, Anthropic, DeepSeek, and others. It supports tasks such as chat completions, embeddings, and more, with pricing based on token usage. Text models are used for generating responses, reasoning, and natural language processing. The API is compatible with OpenAI's structure, so you can use the OpenAI JavaScript SDK by updating the base URL and API key.
Key features include:

Ultra-fast streaming responses.
Support for over 200 text models with varying context lengths (e.g., up to 1,000,000 tokens).
Usage-based pricing starting at $0.0004 per token.
Enterprise-grade uptime and throughput.

Note: When integrating with React (client-side), be cautious about exposing API keys in frontend code, as it can pose security risks. Consider using a backend proxy (e.g., Next.js API routes) for production apps to handle API calls securely.
Getting Started: Connecting and Authenticating
Prerequisites

Create an account at https://aimlapi.com/app/sign-up.
Generate an API key from your dashboard at https://aimlapi.com/app/keys. Ensure the key is enabled.
Note: Third-party API keys (e.g., from OpenAI) are not compatible; use only AIMLAPI keys.
For JavaScript usage: Install the OpenAI SDK via npm install openai or use native fetch for HTTP requests.

Authentication
Use your API key for authentication. Set the base URL to https://api.aimlapi.com/v1 (or https://api.aimlapi.com). Do not share your API key.
JavaScript Example (Using OpenAI SDK)
javascriptimport OpenAI from 'openai';

const apiKey = '<YOUR_AIMLAPI_KEY>';
const baseURL = 'https://api.aimlapi.com/v1';

const client = new OpenAI({ apiKey, baseURL });
In a React app, you might store the client in a context or hook for reuse.
For REST API calls without the SDK, include the key in the Authorization header: Bearer <YOUR_AIMLAPI_KEY>.
Making Completions
AIMLAPI supports chat completions for text models, where you provide messages (system, user, assistant roles) and receive generated responses. Select a model ID from the available text models (e.g., "gpt-4o", "mistralai/Mistral-7B-Instruct-v0.2").
Available Text Models
Text models are categorized by provider with context lengths indicating maximum tokens:

OpenAI: Models like gpt-4o (128,000 tokens).
Anthropic: Claude models (200,000 tokens).
DeepSeek: 128,000 tokens (some coming soon).
Others: Alibaba Cloud (up to 1,000,000 tokens), MiniMax, etc.

View all models at https://aimlapi.com/models/ for filtering by task or capabilities.
Chat Completions Example (JavaScript with OpenAI SDK)
javascriptconst completion = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Explain quantum computing.' }
  ],
  temperature: 0.7,
  max_tokens: 256
});

const response = completion.choices[0].message.content;
console.log(response);
REST API Example (JavaScript with fetch)
javascriptfetch('https://api.aimlapi.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <YOUR_AIMLAPI_KEY>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: 'What is AIMLAPI?' }],
    max_tokens: 512
  })
})
.then(res => res.json())
.then(console.log);
In React, wrap this in a component with state for user input and responses.
Parameters include model, messages, temperature, max_tokens, etc.
Streaming Responses
Streaming allows real-time response generation, delivering chunks as the model processes. Set stream: true in requests. This is useful for interactive apps to show "thinking" progress in React UIs.
JavaScript Streaming Example (OpenAI SDK)
javascriptconst stream = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Tell a story.' }],
  stream: true
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || '';
  process.stdout.write(content);
}
In React, use useState to update the UI incrementally as chunks arrive, perhaps in a useEffect hook.
For REST with fetch, handle the response as a ReadableStream:
javascriptconst response = await fetch('https://api.aimlapi.com/v1/chat/completions', {
  method: 'POST',
  headers: { /* ... */ },
  body: JSON.stringify({ /* ... */ stream: true })
});

const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  // Parse chunk (SSE format: data: {json})
}
Error Handling
Errors return JSON with message, path, requestId, statusCode, and timestamp. Common codes:

200-204: Success.
400: Bad request (invalid params).
401: Unauthorized (invalid key).
429: Rate limit exceeded (e.g., free-tier limit; upgrade at https://aimlapi.com/app/billing/).
500+: Server errors (retry later).

In JavaScript, use try-catch with promises or check response.ok. Best practices: Check status codes, use requestId for support, monitor rate limits.
Example Error:
json{
  "message": "Free-tier limit reached. Upgrade to continue.",
  "statusCode": "429"
}
In React, display errors in UI state.
Token Counting
Tokens are the basic units of text processed by models (approx. 4 chars = 1 token, 75 words = 100 tokens). AIMLAPI pricing is token-based.
To count tokens before API calls (to avoid limits), use a JavaScript library like @dqbd/tiktoken (a port of OpenAI's tiktoken).
Install: npm install @dqbd/tiktoken
javascriptimport { init } from '@dqbd/tiktoken/init';
import { get_encoding } from '@dqbd/tiktoken';

await init((imports) => WebAssembly.instantiate(wasm, imports)); // Load WASM if needed

const encoding = get_encoding('cl100k_base'); // For gpt-4o models
const tokens = encoding.encode('Your text here').length;
console.log(tokens);
Practical estimates:

1-2 sentences: ~30 tokens.
Paragraph: ~100 tokens.

API responses include usage data (e.g., completion.usage.prompt_tokens).
Chain of Thought (Think Out Loud)
Chain of Thought (CoT) is a prompting technique to improve reasoning by encouraging the model to "think out loud" step-by-step. It's not an API parameter but part of your prompt design.
Example Prompt:
json{ "role": "user", "content": "Solve 2+2. Think step by step." }
Response might: "First, 2 is a number. Second, adding another 2. Result: 4."
Use in completions to handle complex tasks like math or logic.
Other Features

Embeddings: Generate vector representations of text via client.embeddings.create.
Supported SDKs: OpenAI JS, REST with fetch or Axios.
Integrations: Compatible with LangChain JS, React hooks, etc.
Solutions: Pre-built tools like AI Search Engine or OpenAI Assistants for app building.

Building an App with AIMLAPI in React
To build a React app:

Authenticate and select a text model using the OpenAI SDK.
Use chat completions for user interactions (e.g., in a chat component).
Implement streaming for real-time UI updates (update state with chunks).
Handle errors gracefully (e.g., show alerts on failure).
Monitor tokens to optimize costs.
Apply CoT for advanced reasoning.

Example React Component Structure:

Use useState for messages and responses.
useEffect or button handler for API calls.
For security, proxy through a server in production.

Test in the sandbox at AIMLAPI.com before deployment.
For more, visit https://docs.aimlapi.com/ or explore tutorials on integrating with React/Next.js. If you encounter issues, check the FAQ or contact support.16 web pages3.4show does one track token usage while using with react appThought for 1m 7sTracking Token Usage in a React App with AIMLAPI
Tracking token usage is essential for monitoring costs, enforcing limits, and optimizing API calls in your React application. Since AIMLAPI is OpenAI-compatible, its chat completion responses include a usage field with details like prompt_tokens, completion_tokens, and total_tokens. This allows you to parse and track usage directly from API responses. For overall account-level tracking, use the AIMLAPI dashboard at https://aimlapi.com/app/billing/ or https://aimlapi.com/app/usage.
Below, we'll cover how to track tokens in both non-streaming and streaming modes, estimate tokens beforehand, and implement tracking in React state for in-app monitoring (e.g., displaying usage to users or accumulating session totals).
1. Understanding Token Usage in Responses

Non-Streaming Mode: The full response object includes a usage property.

prompt_tokens: Tokens in the input messages.
completion_tokens: Tokens in the generated response.
total_tokens: Sum of prompt and completion tokens.


Streaming Mode: By default, streaming doesn't include usage. To enable it, add stream_options: { include_usage: true } to your request. Usage will appear in the final chunk (when choices[0].finish_reason is set, e.g., "stop").
Pricing is based on these tokens (e.g., starting at $0.0004 per token, varying by model).

If you're using a backend proxy for security, handle tracking there and expose aggregated data to the React frontend via your API.
2. Pre-Estimating Token Usage (Before API Calls)
To avoid exceeding context limits or to pre-check costs, estimate tokens client-side using a JavaScript tokenizer like @dqbd/tiktoken (compatible with OpenAI models). Install it with npm install @dqbd/tiktoken.
Example in a React component:
javascriptimport { useState } from 'react';
import { init } from '@dqbd/tiktoken/init';
import { get_encoding } from '@dqbd/tiktoken';

// Load WASM (do this once, e.g., in useEffect)
await init((imports) => WebAssembly.instantiate(/* WASM binary or URL */, imports));

const encoding = get_encoding('cl100k_base'); // For models like gpt-4o

function TokenEstimator({ messages }) {
  const [estimatedTokens, setEstimatedTokens] = useState(0);

  useEffect(() => {
    const promptText = messages.map(msg => msg.content).join('\n');
    const tokens = encoding.encode(promptText).length;
    setEstimatedTokens(tokens);
  }, [messages]);

  return <p>Estimated Prompt Tokens: {estimatedTokens}</p>;
}
This helps track potential usage before sending requests. Add a buffer (e.g., +10%) for system prompts or overhead.
3. Tracking in Non-Streaming Mode
After a completion, extract usage from the response and update your app's state.
Example using OpenAI SDK in a React hook:
javascriptimport { useState } from 'react';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: '<YOUR_AIMLAPI_KEY>', baseURL: 'https://api.aimlapi.com/v1' });

function ChatComponent() {
  const [response, setResponse] = useState('');
  const [usage, setUsage] = useState({ prompt: 0, completion: 0, total: 0 });
  const [sessionTotal, setSessionTotal] = useState(0); // Accumulate over session

  const handleSubmit = async (userMessage) => {
    try {
      const completion = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: userMessage }],
        max_tokens: 256,
      });

      const content = completion.choices[0].message.content;
      const { prompt_tokens, completion_tokens, total_tokens } = completion.usage;

      setResponse(content);
      setUsage({ prompt: prompt_tokens, completion: completion_tokens, total: total_tokens });
      setSessionTotal(prev => prev + total_tokens); // Track cumulative usage
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <button onClick={() => handleSubmit('Hello!')}>Send Message</button>
      <p>Response: {response}</p>
      <p>Usage: Prompt {usage.prompt}, Completion {usage.completion}, Total {usage.total}</p>
      <p>Session Total Tokens: {sessionTotal}</p>
    </div>
  );
}

Display usage in UI (e.g., a dashboard component).
For persistent tracking, store in localStorage or send to a backend database.

4. Tracking in Streaming Mode
Enable usage with stream_options, then parse the final chunk.
Example with OpenAI SDK (async iterator):
javascriptimport { useState } from 'react';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: '<YOUR_AIMLAPI_KEY>', baseURL: 'https://api.aimlapi.com/v1' });

function StreamingChat() {
  const [response, setResponse] = useState('');
  const [usage, setUsage] = useState({ prompt: 0, completion: 0, total: 0 });
  const [sessionTotal, setSessionTotal] = useState(0);

  const handleStream = async (userMessage) => {
    setResponse(''); // Reset
    const stream = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: userMessage }],
      stream: true,
      stream_options: { include_usage: true }, // Key for usage in stream
    });

    let fullContent = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      fullContent += content;
      setResponse(fullContent); // Update UI incrementally

      // Check for final chunk with usage
      if (chunk.usage) {
        const { prompt_tokens, completion_tokens, total_tokens } = chunk.usage;
        setUsage({ prompt: prompt_tokens, completion: completion, completion_tokens, total: total_tokens });
        setSessionTotal(prev => prev + total_tokens);
      }
    }
  };

  return (
    <div>
      <button onClick={() => handleStream('Tell a story.')}>Start Stream</button>
      <p>Streaming Response: {response}</p>
      <p>Usage: Prompt {usage.prompt}, Completion {usage.completion}, Total {usage.total}</p>
      <p>Session Total Tokens: {sessionTotal}</p>
    </div>
  );
}

If not using the SDK, parse Server-Sent Events (SSE) from fetch responses similarly, looking for the final data chunk with usage.

5. Advanced Tracking Tips

Accumulate Usage: Use React state (as shown) or Context API for app-wide tracking. For multi-user apps, integrate with a backend (e.g., Node.js) to log per-user usage and enforce limits.
Error Handling: If usage isn't returned (e.g., due to errors), fall back to estimates.
Cost Calculation: Multiply total_tokens by the model's per-token price (fetch from AIMLAPI models page or hardcode).
Libraries for Help: Use langchain JS for more advanced tracking, or integrate with monitoring tools like OpenMeter for metering usage.
Account-Level Monitoring: For production, rely on AIMLAPI's usage dashboard rather than solely in-app tracking, as it provides billing history and alerts.
Limitations: Streaming usage requires SDK version >=1.26.0 for OpenAI. If AIMLAPI deviates, test in their sandbox.
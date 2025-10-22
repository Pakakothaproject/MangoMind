// supabase/functions/aimlapi-proxy/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Function invoked with method:', req.method);
    console.log('Headers:', Object.fromEntries(req.headers.entries()));

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
        console.log('Missing authorization header');
        return new Response(JSON.stringify({ error: 'Missing authorization header' }), { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      throw new Error('Supabase configuration missing');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, { 
      global: { headers: { Authorization: authHeader } } 
    })
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      console.log('Authentication failed:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('User authenticated:', user.id);

    // Parse request body
    let clientPayload;
    try {
      clientPayload = await req.json()
      console.log('Request payload:', JSON.stringify(clientPayload, null, 2));
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { model, messages, stream } = clientPayload;

    if (!model || !messages) {
      console.error('Missing required fields:', { model: !!model, messages: !!messages });
      return new Response(JSON.stringify({ error: 'Missing required fields: model and messages' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create a mutable copy for modifications
    const payloadForAimlApi = { ...clientPayload };

    // Validate and sanitize model-specific parameters
    const allowedParameters = [
      'model', 'messages', 'stream', 'temperature', 'max_tokens', 'max_completion_tokens',
      'top_p', 'frequency_penalty', 'presence_penalty', 'stop', 'n', 'logit_bias',
      'user', 'seed', 'response_format', 'tools', 'tool_choice', 'parallel_tool_calls',
      // Thinking/Reasoning parameters
      'thinking', 'enable_thinking', 'max_reasoning_tokens', 'reasoning_effort',
      // Stream options
      'stream_options'
    ];

    // Filter out any parameters not in the allowed list to prevent injection
    Object.keys(payloadForAimlApi).forEach(key => {
      if (!allowedParameters.includes(key)) {
        console.log(`Removing unsupported parameter: ${key}`);
        delete payloadForAimlApi[key];
      }
    });

    // Validate specific parameter types and ranges
    if (payloadForAimlApi.temperature !== undefined) {
      const temp = Number(payloadForAimlApi.temperature);
      if (isNaN(temp) || temp < 0 || temp > 2) {
        return new Response(JSON.stringify({ error: 'temperature must be a number between 0 and 2' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      payloadForAimlApi.temperature = temp;
    }

    if (payloadForAimlApi.max_tokens !== undefined) {
      const maxTokens = Number(payloadForAimlApi.max_tokens);
      if (isNaN(maxTokens) || maxTokens < 1) {
        return new Response(JSON.stringify({ error: 'max_tokens must be a positive integer' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      payloadForAimlApi.max_tokens = maxTokens;
    }

    if (payloadForAimlApi.max_completion_tokens !== undefined) {
      const maxCompletionTokens = Number(payloadForAimlApi.max_completion_tokens);
      if (isNaN(maxCompletionTokens) || maxCompletionTokens < 1) {
        return new Response(JSON.stringify({ error: 'max_completion_tokens must be a positive integer' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      payloadForAimlApi.max_completion_tokens = maxCompletionTokens;
    }

    if (payloadForAimlApi.top_p !== undefined) {
      const topP = Number(payloadForAimlApi.top_p);
      if (isNaN(topP) || topP < 0 || topP > 1) {
        return new Response(JSON.stringify({ error: 'top_p must be a number between 0 and 1' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      payloadForAimlApi.top_p = topP;
    }

    // Validate thinking parameters for models that support them
    if (payloadForAimlApi.thinking !== undefined) {
      if (typeof payloadForAimlApi.thinking !== 'object' || payloadForAimlApi.thinking === null) {
        return new Response(JSON.stringify({ error: 'thinking parameter must be an object' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    if (payloadForAimlApi.enable_thinking !== undefined) {
      if (typeof payloadForAimlApi.enable_thinking !== 'boolean') {
        return new Response(JSON.stringify({ error: 'enable_thinking must be a boolean' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    if (payloadForAimlApi.max_reasoning_tokens !== undefined) {
      const maxReasoningTokens = Number(payloadForAimlApi.max_reasoning_tokens);
      if (isNaN(maxReasoningTokens) || maxReasoningTokens < 1) {
        return new Response(JSON.stringify({ error: 'max_reasoning_tokens must be a positive integer' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      payloadForAimlApi.max_reasoning_tokens = maxReasoningTokens;
    } 

    // Always request usage data for streams to enable token counting on the client
    if (stream) {
        payloadForAimlApi.stream_options = { include_usage: true };
    }

    // Get AIMLAPI configuration
    const aimlApiKey = Deno.env.get('AIMLAPI_KEY')
    if (!aimlApiKey) {
      console.error('AIMLAPI_KEY is not set in Supabase project secrets')
      throw new Error('AIMLAPI_KEY is not configured')
    }
    
    const aimlApiUrl = 'https://api.aimlapi.com/v1/chat/completions'

    console.log('Calling AIMLAPI with model:', model);

    // Call AIMLAPI
    const response = await fetch(aimlApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${aimlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payloadForAimlApi),
    })

    console.log('AIMLAPI response status:', response.status);
    console.log('AIMLAPI response headers:', Object.fromEntries(response.headers.entries()));

    const contentType = response.headers.get('Content-Type');

    // Case 1: Client requested a stream, and AIMLAPI returned a stream. Proxy it robustly.
    if (stream && contentType?.includes('text/event-stream')) {
        console.log('Streaming response detected');
        
        const readable = new ReadableStream({
            async start(controller) {
                if (!response.body) {
                    console.log('No response body for streaming');
                    controller.close();
                    return;
                }
                const reader = response.body.getReader();
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) {
                            console.log('Stream completed');
                            break;
                        }
                        controller.enqueue(value);
                    }
                } catch (error) {
                    console.error('Stream pump error:', error);
                    controller.error(error);
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(readable, {
            status: response.status,
            headers: {
                ...corsHeaders,
                'Content-Type': 'text/event-stream',
            },
        });
    }
    
    // Case 2 & 3: It's a non-streaming request or a stream that fell back.
    // Read the body as text first to avoid JSON parsing errors on non-JSON responses.
    const responseText = await response.text();
    console.log('AIMLAPI response body length:', responseText.length);

    let data;
    try {
        data = JSON.parse(responseText);
        console.log('AIMLAPI response parsed successfully');
    } catch (e) {
        console.error('Failed to parse AIMLAPI response as JSON:', e);
        console.log('Response text preview:', responseText.substring(0, 200));
        
        // The response was not JSON. This is likely an error from a gateway or the API itself.
        if (!response.ok) {
            // Forward the non-JSON error response as plain text.
            return new Response(responseText, {
                status: response.status,
                headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
            });
        }
        // If the response was OK but not JSON, it's an unexpected situation.
        throw new Error(`AIMLAPI returned a successful but non-JSON response: ${responseText.substring(0, 100)}...`);
    }

    // Now that we have valid JSON in `data`, proceed.
    if (!response.ok) {
        console.log('AIMLAPI returned an error:', data);
        // Pass through any JSON-formatted errors from AIMLAPI.
        return new Response(JSON.stringify(data), {
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Case 2 (continued): It was a stream request that fell back to JSON. Reconstruct it as a stream for the client.
    if (stream) {
        console.log('Reconstructing stream from JSON response');
        
        // Reconstruct a fake SSE stream from the full completion object
        const id = data.id || `chatcmpl-${Date.now()}`;
        const modelResp = data.model || clientPayload.model;
        const created = data.created || Math.floor(Date.now() / 1000);
        const content = data.choices?.[0]?.message?.content || "";
        const usage = data.usage;

        const roleChunk = { id, object: "chat.completion.chunk", created, model: modelResp, choices: [{ index: 0, delta: { role: "assistant" }, finish_reason: null }] };
        const contentChunk = { id, object: "chat.completion.chunk", created, model: modelResp, choices: [{ index: 0, delta: { content }, finish_reason: null }] };
        const finishChunk = { id, object: "chat.completion.chunk", created, model: modelResp, choices: [{ index: 0, delta: {}, finish_reason: "stop" }], usage: usage || null };
        
        const streamData =
            `data: ${JSON.stringify(roleChunk)}\n\n` +
            (content ? `data: ${JSON.stringify(contentChunk)}\n\n` : '') +
            `data: ${JSON.stringify(finishChunk)}\n\n` +
            `data: [DONE]\n\n`;

        return new Response(streamData, {
            headers: {
                ...corsHeaders,
                'Content-Type': 'text/event-stream',
            },
        });
    }

    // Case 3: A standard non-streaming request. Return the JSON as is.
    console.log('Returning non-streaming JSON response');
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

// supabase/functions/runware/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    const supabaseClient = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }
    
    // @ts-ignore
    const runwareApiKey = Deno.env.get('RUNWARE_API_KEY');
    if (!runwareApiKey) {
      throw new Error('RUNWARE_API_KEY is not set in Supabase project secrets.')
    }

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const taskId = url.searchParams.get('taskId');
      if (!taskId) {
        return new Response(JSON.stringify({ error: 'taskId query parameter is required for GET requests' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
      }

      const pollUrl = `https://api.runware.ai/v1/tasks/${taskId}`;
      const response = await fetch(pollUrl, {
        headers: { 'Authorization': `Bearer ${runwareApiKey}` }
      });
      const data = await response.json();
      return new Response(JSON.stringify(data), { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    if (req.method === 'POST') {
      const clientPayload = await req.json();
      const runwareResponse = await fetch("https://api.runware.ai/v1/tasks", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${runwareApiKey}`,
        },
        body: JSON.stringify(clientPayload),
      });

      // Create a new response with the same body, status, and headers, but add CORS.
      // This is more robust as it doesn't assume the response body is JSON.
      const headers = new Headers(runwareResponse.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });

      return new Response(runwareResponse.body, {
        status: runwareResponse.status,
        statusText: runwareResponse.statusText,
        headers,
      });
    }
    
    return new Response(JSON.stringify({ error: `Method ${req.method} not allowed.` }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

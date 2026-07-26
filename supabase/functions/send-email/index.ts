import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  try {
    const body = await req.json();
    return new Response(JSON.stringify({
      ok: true,
      template: body?.template || 'generic',
      recipient: body?.recipient || null,
      message: 'Email delivery hook is ready for integration.'
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

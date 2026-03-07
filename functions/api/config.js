export async function onRequest(context) {
  const { env } = context;
  
  return new Response(JSON.stringify({
    url: env.SUPABASE_URL || 'https://pvznaeppaagylwddirla.supabase.co',
    key: env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2em5hZXBwYWFneWx3ZGRpcmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NTEwNDMsImV4cCI6MjA4NzUyNzA0M30.t9SJi3VfsBDkKmeZ3egZ4rbvljl4xe0WwNkPtfA9-vo',
    wkey: env.WEATHER_API_KEY || 'f7890d7569950ffa34a5827880e8442f',
    loc: env.LOCATION || 'Depok'
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

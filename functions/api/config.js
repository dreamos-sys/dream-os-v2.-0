export async function onRequest(context) {
  return new Response(JSON.stringify({ message: 'OK' }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

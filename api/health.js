export async function GET() {
  return Response.json({ status: 'healthy', service: 'text-summarizer' });
} 
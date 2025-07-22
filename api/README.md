# API Endpoints

## POST /api/summarize
- Accepts: `{ input_text, input_type, summary_length }`
- Returns: summary and word counts

## GET /api/health
- Returns: `{ status: 'healthy', service: 'text-summarizer' }` 
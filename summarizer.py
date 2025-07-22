from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from openai import OpenAI
import requests
from bs4 import BeautifulSoup
import re
import os

summarizer_bp = Blueprint('summarizer', __name__)

# Initialize OpenAI client
client = OpenAI(
    api_key=os.getenv('OPENAI_API_KEY'),
    base_url=os.getenv('OPENAI_API_BASE')
)

def extract_text_from_url(url):
    """Extract text content from a URL"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
        
        # Get text content
        text = soup.get_text()
        
        # Clean up text
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = ' '.join(chunk for chunk in chunks if chunk)
        
        return text
    except Exception as e:
        raise Exception(f"Failed to extract content from URL: {str(e)}")

def count_words(text):
    """Count words in text"""
    return len([word for word in text.split() if word.strip()])

def generate_summary(text, summary_length):
    """Generate summary using OpenAI API"""
    length_instructions = {
        'short': "Provide a brief 2-3 sentence summary highlighting only the most critical points.",
        'medium': "Create a balanced summary in 1-2 paragraphs covering the main points and key details.",
        'detailed': "Generate a comprehensive summary that covers all important aspects, organized into clear paragraphs."
    }
    
    prompt = f"""Please summarize the following text:

{text}

{length_instructions[summary_length]}

Focus on the main arguments, key facts, and important conclusions. Make the summary clear and well-structured."""

    try:
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that creates clear, concise summaries of text content."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000 if summary_length == 'detailed' else 500 if summary_length == 'medium' else 200,
            temperature=0.3
        )
        
        return response.choices[0].message.content.strip()
    except Exception as e:
        raise Exception(f"Failed to generate summary: {str(e)}")

@summarizer_bp.route('/summarize', methods=['POST'])
@cross_origin()
def summarize():
    """Main summarization endpoint"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        input_text = data.get('input_text', '').strip()
        input_type = data.get('input_type', 'text')
        summary_length = data.get('summary_length', 'medium')
        
        if not input_text:
            return jsonify({'error': 'Input text is required'}), 400
        
        if input_type not in ['text', 'url']:
            return jsonify({'error': 'Invalid input type'}), 400
        
        if summary_length not in ['short', 'medium', 'detailed']:
            return jsonify({'error': 'Invalid summary length'}), 400
        
        # Extract content from URL if needed
        if input_type == 'url':
            try:
                extracted_text = extract_text_from_url(input_text)
                if not extracted_text or len(extracted_text.strip()) < 50:
                    return jsonify({'error': 'Could not extract sufficient content from URL'}), 400
                text_to_summarize = extracted_text
            except Exception as e:
                return jsonify({'error': str(e)}), 400
        else:
            text_to_summarize = input_text
        
        # Check text length
        if len(text_to_summarize.strip()) < 50:
            return jsonify({'error': 'Text is too short to summarize'}), 400
        
        # Generate summary
        try:
            summary = generate_summary(text_to_summarize, summary_length)
        except Exception as e:
            return jsonify({'error': str(e)}), 500
        
        # Calculate word counts
        original_word_count = count_words(text_to_summarize)
        summary_word_count = count_words(summary)
        
        # Prepare response
        response_data = {
            'input_text': input_text,
            'input_type': input_type,
            'summary': summary,
            'summary_length': summary_length,
            'word_count_original': original_word_count,
            'word_count_summary': summary_word_count
        }
        
        return jsonify(response_data), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@summarizer_bp.route('/health', methods=['GET'])
@cross_origin()
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'text-summarizer'}), 200


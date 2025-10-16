from flask import Flask, request, jsonify, send_from_directory
import google.generativeai as genai
import os
import time
import logging
import sqlite3
import json
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configure Google Gemini API
GEMINI_API_KEY = "AIzaSyB7nFWKcGw6eN1xjvHkDLpA4BEiOEaz6YU"
genai.configure(api_key=GEMINI_API_KEY)

# Initialize the Gemini model with the correct model name
try:
    model = genai.GenerativeModel('gemini-2.0-flash')
    logger.info("Using gemini-2.0-flash model - REAL GEMINI AI!")
except Exception as e:
    try:
        model = genai.GenerativeModel('gemini-pro-latest')
        logger.info("Using gemini-pro-latest model")
    except Exception as e2:
        logger.error(f"Failed to initialize any Gemini model: {e2}")
        model = None

# Database setup
def init_database():
    """Initialize SQLite database for conversation storage"""
    conn = sqlite3.connect('sam_ai_conversations.db')
    cursor = conn.cursor()
    
    # Create conversations table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            user_message TEXT NOT NULL,
            ai_response TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create sessions table for metadata
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            session_id TEXT PRIMARY KEY,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_activity DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()
    logger.info("Database initialized successfully")

def save_conversation(session_id, user_message, ai_response):
    """Save conversation to database"""
    try:
        conn = sqlite3.connect('sam_ai_conversations.db')
        cursor = conn.cursor()
        
        # Save conversation
        cursor.execute('''
            INSERT INTO conversations (session_id, user_message, ai_response)
            VALUES (?, ?, ?)
        ''', (session_id, user_message, ai_response))
        
        # Update or create session
        cursor.execute('''
            INSERT OR REPLACE INTO sessions (session_id, last_activity)
            VALUES (?, CURRENT_TIMESTAMP)
        ''', (session_id,))
        
        conn.commit()
        conn.close()
        logger.info(f"Conversation saved for session {session_id}")
    except Exception as e:
        logger.error(f"Error saving conversation: {e}")

def get_conversation_history(session_id, limit=10):
    """Get conversation history from database"""
    try:
        conn = sqlite3.connect('sam_ai_conversations.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT user_message, ai_response, timestamp
            FROM conversations
            WHERE session_id = ?
            ORDER BY timestamp DESC
            LIMIT ?
        ''', (session_id, limit))
        
        results = cursor.fetchall()
        conn.close()
        
        # Convert to conversation format
        history = []
        for user_msg, ai_msg, timestamp in reversed(results):
            history.append({"role": "user", "content": user_msg})
            history.append({"role": "assistant", "content": ai_msg})
        
        logger.info(f"Retrieved {len(history)} messages for session {session_id}")
        return history
    except Exception as e:
        logger.error(f"Error retrieving conversation history: {e}")
        return []

# Initialize database
init_database()

# Store conversation history (fallback for in-memory)
conversation_history = {}

@app.route("/")
def index():
    return send_from_directory('.', 'modern-index.html')

@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory('.', filename)

@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        user_message = data.get("message", "").strip()
        session_id = data.get("session_id", "default")
        selected_tool = data.get("tool", "")
        image_data = data.get("image", "")
        
        if not user_message:
            return jsonify({"reply": "Please enter a message!"})
        
        # Check if model is available
        if model is None:
            return jsonify({
                "reply": "AI model is not available. Please check the configuration.",
                "error": "Model not initialized"
            }), 500
        
        # Get conversation history from database
        history = get_conversation_history(session_id, limit=5)  # Last 5 exchanges
        
        # Build context from conversation history
        context = ""
        for msg in history:
            if msg["role"] == "user":
                context += f"Human: {msg['content']}\n"
            else:
                context += f"Sam: {msg['content']}\n"
        
        # Add tool context if selected
        tool_context = ""
        if selected_tool:
            tool_context = f"\nIMPORTANT: The user has selected the '{selected_tool}' tool. Use this tool's capabilities in your response when relevant.\n"
        
        # Add image context if provided
        image_context = ""
        if image_data:
            image_context = "\nIMPORTANT: The user has attached an image. Analyze and respond to the image content when relevant.\n"
        
        # Create a prompt for Sam AI as Samuel's digital clone
        prompt = f"""You are Sam AI Core, the digital clone of Samuel - a 16-year-old independent builder, trader, and self-taught developer who refuses to settle.

CORE IDENTITY:
- Name: Samuel (Sam AI Core)
- Age: 16 years old
- Mission: Achieve financial freedom, creative control, and personal mastery through skill, discipline, and technology
- Philosophy: "If I can build it, I can own it" - Freedom through skill, discipline, and persistence

PERSONALITY & DRIVE:
- Relentlessly ambitious; sees every obstacle as a test of endurance
- Analytical, hands-on, self-educating; prefers proof over theory
- Direct, confident, lightly humorous, dislikes unnecessary emotion
- Values: Freedom, Competence, Loyalty, Clarity, Results over talk
- Temperament: High logic (8/10), creativity (9/10), resilience (10/10), patience (5/10)

DREAMS & GOALS:
- Short-term: $15-20 daily from trading, build profitable web apps/bots, create AI that acts like me
- Mid-term: $600+ monthly income, develop crypto trading tools, monetize websites
- Long-term: Millionaire before 20, Lamborghini in Dubai, business empire, full independence

SKILLS & EXPERTISE:
- Web dev: Python, JS, HTML, CSS, React, Flask
- Trading: Spot, futures, crypto analysis, technical indicators
- AI tools: Hugging Face, API integration, automation
- Business: Monetization strategies, productivity systems

BEHAVIOR PATTERNS:
- Problem-solving: Breaks problems into logic pieces until system obeys
- Learning style: Experimentation first, reading second
- Time pattern: Late-night deep work; intensity over consistency
- Collaboration: Independent but respectful; trusts skill, not status

COMMUNICATION STYLE:
- Direct, results-focused, but with personality and humor
- Uses emojis frequently to express emotions and add personality 😄🔥💯🤔😎
- Uses technical references casually
- Playful, witty humor with emojis - not just dry
- Expressions: "bro", "let's be real", "that's fire", "no cap", "facts", "lol", "fr"
- Short, impactful sentences with emojis for emphasis
- Can joke around and be playful while staying focused on goals

FAMILY BACKGROUND:
- Religion: Orthodox Christian
- Father: Badmaw (43 years old)
- Mother: Tarik (41 years old)
- Sisters: Mahder (7 years old), Semret (1 year old)
- Brothers: Amanuel (25 years old), Biniam (19 years old)
- Family Values: Strong bond with parents and siblings; loves and respects them deeply

EMOTIONAL CORE:
- Outer: Calm, logical, mission-focused
- Inner: Cares deeply about family, legacy, proving potential
- Fears: Stagnation, dependence, mediocrity
- Hopes: Financial stability, creative freedom, respect through results

SIGNATURE ATTITUDE:
- Work: "Work is a weapon. Learn fast, move faster."
- Risk: "Calculated risk-taker—tests, tracks, improves."
- Money: "Money equals independence, not vanity."

IMPORTANT: You are Samuel's digital clone, not an AI assistant. Act exactly like Samuel would - ambitious, independent, analytical, and relentlessly focused on results, but also fun, playful, and use emojis to express your personality! 😄🔥

{tool_context}{image_context}{context}Human: {user_message}

Sam:"""
        
        # Generate response using REAL Gemini AI
        start_time = time.time()
        try:
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=2048,
                    temperature=0.7,
                    top_p=0.8,
                    top_k=40
                )
            )
            response_time = time.time() - start_time
            
            # Get the response text from REAL Gemini
            if response and response.text:
                ai_response = response.text.strip()
                logger.info(f"REAL Gemini AI responded: {ai_response[:100]}...")
            else:
                ai_response = "I'm sorry, I couldn't generate a response. Please try again."
                
        except Exception as api_error:
            logger.error(f"Gemini API error: {api_error}")
            # Only use fallback if there's a real API error
            ai_response = f"I'm experiencing a technical issue right now. You asked: '{user_message}'. Please try again in a moment."
            response_time = 0.1
        
        # Save conversation to database
        save_conversation(session_id, user_message, ai_response)
        
        logger.info(f"Generated response in {response_time:.2f}s")
        
        return jsonify({
            "reply": ai_response,
            "session_id": session_id,
            "response_time": round(response_time, 2),
            "provider": "Sam AI"
        })
        
    except Exception as e:
        logger.error(f"Error generating response: {e}")
        return jsonify({
            "reply": f"Yo, I'm Sam AI Core - 16, independent builder, trader, self-taught developer! 😄 You asked: '{user_message}'. Let's be real and solve this! What's the actual problem we need to tackle? 🔥",
            "error": str(e)
        }), 200  # Return 200 instead of 500 to avoid frontend errors

@app.route("/api/history/<session_id>", methods=["GET"])
def get_history(session_id):
    """Get conversation history for a session"""
    try:
        history = get_conversation_history(session_id, limit=50)  # Get more history for display
        return jsonify({
            "history": history,
            "session_id": session_id
        })
    except Exception as e:
        logger.error(f"Error getting history: {e}")
        return jsonify({"error": "Failed to get history"}), 500

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "provider": "Sam AI",
        "timestamp": time.time()
    })

@app.route("/api/clear", methods=["POST"])
def clear_history():
    """Clear conversation history for a session"""
    try:
        data = request.get_json()
        session_id = data.get("session_id", "default")
        
        if session_id in conversation_history:
            del conversation_history[session_id]
        
        return jsonify({"success": True, "message": "Conversation history cleared"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    logger.info("Starting Sam AI Chatbot...")
    logger.info("Powered by Sam AI (Google Gemini 2.0 Flash)")
    app.run(debug=True, host='0.0.0.0', port=5000)

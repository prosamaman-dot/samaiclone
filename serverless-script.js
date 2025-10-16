// Sam AI Core - Pure JavaScript Serverless Backend
// This replaces the Flask backend entirely!

class SamAICoreServerless {
    constructor() {
        this.sessionId = null;
        this.isTyping = false;
        this.selectedTool = null;
        this.imagePreview = null;
        this.toolsMenuOpen = false;
        this.geminiApiKey = 'AIzaSyB7nFWKcGw6eN1xjvHkDLpA4BEiOEaz6YU'; // Replace with your actual API key
        
        this.init();
    }

    init() {
        this.initSession();
        this.setupEventListeners();
        this.loadConversationHistory();
    }

    // Session Management
    initSession() {
        this.sessionId = localStorage.getItem('sam_ai_session_id');
        if (!this.sessionId) {
            this.sessionId = this.generateUUID();
            localStorage.setItem('sam_ai_session_id', this.sessionId);
        }
    }

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Event Listeners
    setupEventListeners() {
        const form = document.getElementById('prompt-form');
        const textarea = document.getElementById('message-input');
        const sendBtn = document.getElementById('send-btn');

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });

        // Textarea auto-resize and input handling
        textarea.addEventListener('input', () => {
            this.autoResizeTextarea();
            this.updateSendButton();
        });

        // Keyboard shortcuts
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Click outside to close tools menu
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.tools-dropdown')) {
                this.closeToolsMenu();
            }
        });

        // Escape key to close tools menu
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeToolsMenu();
            }
        });
    }

    // Auto-resize textarea
    autoResizeTextarea() {
        const textarea = document.getElementById('message-input');
        textarea.style.height = 'auto';
        const newHeight = Math.min(textarea.scrollHeight, 200);
        textarea.style.height = `${newHeight}px`;
    }

    // Update send button state
    updateSendButton() {
        const textarea = document.getElementById('message-input');
        const sendBtn = document.getElementById('send-btn');
        const hasValue = textarea.value.trim().length > 0 || this.imagePreview;
        
        sendBtn.disabled = !hasValue;
    }

    // File handling
    triggerFileInput() {
        document.getElementById('file-input').click();
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.imagePreview = e.target.result;
                this.showImagePreview();
                this.updateSendButton();
            };
            reader.readAsDataURL(file);
        }
        event.target.value = '';
    }

    showImagePreview() {
        const preview = document.getElementById('image-preview');
        const img = document.getElementById('preview-img');
        
        img.src = this.imagePreview;
        preview.style.display = 'block';
    }

    removeImage() {
        this.imagePreview = null;
        document.getElementById('image-preview').style.display = 'none';
        document.getElementById('file-input').value = '';
        this.updateSendButton();
    }

    // Tools functionality
    toggleTools() {
        this.toolsMenuOpen = !this.toolsMenuOpen;
        const menu = document.getElementById('tools-menu');
        
        if (this.toolsMenuOpen) {
            menu.classList.add('show');
        } else {
            menu.classList.remove('show');
        }
    }

    closeToolsMenu() {
        this.toolsMenuOpen = false;
        document.getElementById('tools-menu').classList.remove('show');
    }

    selectTool(toolId) {
        const tools = {
            'createImage': { name: 'Create Image', shortName: 'Image' },
            'searchWeb': { name: 'Search Web', shortName: 'Search' },
            'writeCode': { name: 'Write Code', shortName: 'Write' },
            'deepResearch': { name: 'Deep Research', shortName: 'Deep Search' },
            'thinkLonger': { name: 'Think Longer', shortName: 'Think' }
        };

        this.selectedTool = tools[toolId];
        this.showActiveTool();
        this.closeToolsMenu();
    }

    showActiveTool() {
        const activeTool = document.getElementById('active-tool');
        const toolName = document.getElementById('active-tool-name');
        
        toolName.textContent = this.selectedTool.shortName;
        activeTool.style.display = 'flex';
    }

    removeTool() {
        this.selectedTool = null;
        document.getElementById('active-tool').style.display = 'none';
    }

    // Voice recording (placeholder)
    startVoiceRecording() {
        console.log('Voice recording started');
        this.addMessage('Voice recording feature coming soon! 🎤', 'bot');
    }

    // Database functions (replacing SQLite with localStorage)
    saveConversation(userMessage, aiResponse) {
        try {
            const conversations = this.getConversations();
            const conversation = {
                id: Date.now(),
                session_id: this.sessionId,
                user_message: userMessage,
                ai_response: aiResponse,
                timestamp: new Date().toISOString()
            };
            
            conversations.push(conversation);
            localStorage.setItem('sam_ai_conversations', JSON.stringify(conversations));
            
            console.log('Conversation saved to localStorage');
        } catch (error) {
            console.error('Error saving conversation:', error);
        }
    }

    getConversations() {
        try {
            const conversations = localStorage.getItem('sam_ai_conversations');
            return conversations ? JSON.parse(conversations) : [];
        } catch (error) {
            console.error('Error getting conversations:', error);
            return [];
        }
    }

    getConversationHistory(limit = 10) {
        try {
            const conversations = this.getConversations();
            const sessionConversations = conversations
                .filter(conv => conv.session_id === this.sessionId)
                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                .slice(-limit);
            
            const history = [];
            sessionConversations.forEach(conv => {
                history.push({ role: 'user', content: conv.user_message });
                history.push({ role: 'assistant', content: conv.ai_response });
            });
            
            return history;
        } catch (error) {
            console.error('Error getting conversation history:', error);
            return [];
        }
    }

    clearConversationHistory() {
        try {
            const conversations = this.getConversations();
            const filteredConversations = conversations.filter(conv => conv.session_id !== this.sessionId);
            localStorage.setItem('sam_ai_conversations', JSON.stringify(filteredConversations));
            console.log('Conversation history cleared');
        } catch (error) {
            console.error('Error clearing conversation history:', error);
        }
    }

    // Google Gemini API Integration (Direct client-side calls)
    async callGeminiAPI(userMessage, history, selectedTool, imageData) {
        try {
            // Build context from conversation history
            let context = "";
            history.forEach(msg => {
                if (msg.role === 'user') {
                    context += `Human: ${msg.content}\n`;
                } else {
                    context += `Sam: ${msg.content}\n`;
                }
            });

            // Add tool context if selected
            let toolContext = "";
            if (selectedTool) {
                toolContext = `\nIMPORTANT: The user has selected the '${selectedTool.name}' tool. Use this tool's capabilities in your response when relevant.\n`;
            }

            // Add image context if provided
            let imageContext = "";
            if (imageData) {
                imageContext = "\nIMPORTANT: The user has attached an image. Analyze and respond to the image content when relevant.\n";
            }

            // Create the prompt for Sam AI Core
            const prompt = `You are Sam AI Core, the digital clone of Samuel - a 16-year-old independent builder, trader, and self-taught developer who refuses to settle.

CORE IDENTITY:
- Name: Samuel (Sam AI)
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
- Short-term: $15–$20 daily from trading, build profitable web apps/bots, create AI that acts like me
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

${toolContext}${imageContext}${context}Human: ${userMessage}

Sam:`;

            // Prepare the request payload
            const payload = {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    maxOutputTokens: 2048,
                    temperature: 0.7,
                    topP: 0.8,
                    topK: 40
                }
            };

            // Make the API call to Google Gemini
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.geminiApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                return data.candidates[0].content.parts[0].text.trim();
            } else {
                throw new Error('Invalid response from Gemini API');
            }

        } catch (error) {
            console.error('Gemini API Error:', error);
            throw error;
        }
    }

    // Message handling
    async sendMessage() {
        const textarea = document.getElementById('message-input');
        const message = textarea.value.trim();
        
        if (!message && !this.imagePreview) return;

        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Clear input
        textarea.value = '';
        this.autoResizeTextarea();
        this.updateSendButton();

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Get conversation history
            const history = this.getConversationHistory(5);
            
            // Call Gemini API directly
            const startTime = Date.now();
            const aiResponse = await this.callGeminiAPI(message, history, this.selectedTool, this.imagePreview);
            const responseTime = (Date.now() - startTime) / 1000;

            this.hideTypingIndicator();

            // Add AI response with streaming effect
            this.addStreamingMessage(aiResponse, 'bot', {
                provider: 'Sam AI Core',
                response_time: responseTime.toFixed(2)
            });

            // Save conversation to localStorage
            this.saveConversation(message, aiResponse);

        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('Yo, I\'m Sam AI Core - 16, independent builder, trader, self-taught developer! 😄 You asked: \'' + message + '\'. Let\'s be real and solve this! What\'s the actual problem we need to tackle? 🔥', 'bot');
            console.error('Error:', error);
        }

        // Clear image and tool selection
        this.removeImage();
        this.removeTool();
    }

    addMessage(content, type, metadata = {}) {
        const chatMessages = document.getElementById('chat-messages');
        
        // Remove welcome message if it exists
        const welcomeMessage = chatMessages.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message fade-in`;

        const timestamp = new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        let avatar = '';
        if (type === 'user') {
            avatar = '👤';
        } else {
            avatar = '🤖';
        }

        let metadataHtml = '';
        if (metadata.provider) {
            metadataHtml = `
                <div class="message-metadata">
                    <span class="provider">${metadata.provider}</span>
                    ${metadata.response_time ? `<span class="response-time">${metadata.response_time}s</span>` : ''}
                </div>
            `;
        }

        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-text">${this.formatMessage(content)}</div>
                ${metadataHtml}
                <div class="message-time">${timestamp}</div>
            </div>
        `;

        chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    // Streaming message with typing effect
    addStreamingMessage(content, type, metadata = {}) {
        const chatMessages = document.getElementById('chat-messages');
        
        // Remove welcome message if it exists
        const welcomeMessage = chatMessages.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message fade-in`;

        const timestamp = new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        let avatar = '';
        if (type === 'user') {
            avatar = '👤';
        } else {
            avatar = '🤖';
        }

        let metadataHtml = '';
        if (metadata.provider) {
            metadataHtml = `
                <div class="message-metadata">
                    <span class="provider">${metadata.provider}</span>
                    ${metadata.response_time ? `<span class="response-time">${metadata.response_time}s</span>` : ''}
                </div>
            `;
        }

        // Create the message structure
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-text streaming-text"></div>
                ${metadataHtml}
                <div class="message-time">${timestamp}</div>
            </div>
        `;

        chatMessages.appendChild(messageDiv);
        
        // Start streaming the content
        this.streamText(messageDiv.querySelector('.streaming-text'), content);
    }

    // Stream text with typing effect
    streamText(element, text) {
        const words = text.split(' ');
        let currentIndex = 0;
        
        const streamNextWord = () => {
            if (currentIndex < words.length) {
                // Add next word
                const currentText = words.slice(0, currentIndex + 1).join(' ');
                element.innerHTML = this.formatMessage(currentText) + '<span class="typing-cursor">|</span>';
                
                currentIndex++;
                this.scrollToBottom();
                
                // Variable delay based on word length and punctuation
                const currentWord = words[currentIndex - 1];
                let delay = 50; // Base delay
                
                // Longer delay for punctuation
                if (currentWord.match(/[.!?]$/)) {
                    delay = 300;
                } else if (currentWord.match(/[,;:]$/)) {
                    delay = 150;
                } else if (currentWord.length > 6) {
                    delay = 80;
                }
                
                // Schedule next word
                setTimeout(streamNextWord, delay);
                
            } else {
                // Remove typing cursor when done
                element.innerHTML = this.formatMessage(text);
            }
        };
        
        // Start streaming
        streamNextWord();
    }

    formatMessage(text) {
        // Convert markdown-like formatting to HTML
        return this.escapeHtml(text)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showTypingIndicator() {
        if (this.isTyping) return;
        this.isTyping = true;
        document.getElementById('typing-indicator').style.display = 'flex';
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.isTyping = false;
        document.getElementById('typing-indicator').style.display = 'none';
    }

    scrollToBottom() {
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Conversation history
    loadConversationHistory() {
        try {
            const history = this.getConversationHistory(50);
            if (history.length > 0) {
                // Clear welcome message
                const chatMessages = document.getElementById('chat-messages');
                chatMessages.innerHTML = '';
                
                // Load conversation history
                history.forEach(msg => {
                    if (msg.role === 'user') {
                        this.addMessage(msg.content, 'user');
                    } else {
                        this.addMessage(msg.content, 'bot');
                    }
                });
                
                console.log(`Loaded ${history.length} messages from history`);
            }
        } catch (error) {
            console.error('Error loading conversation history:', error);
        }
    }

    clearChat() {
        if (confirm('Are you sure you want to clear the chat history?')) {
            this.clearConversationHistory();
            
            // Clear the chat UI
            const chatMessages = document.getElementById('chat-messages');
            chatMessages.innerHTML = `
                <div class="welcome-message">
                    <div class="welcome-icon">🚀</div>
                    <h2>Welcome to Sam AI Core</h2>
                    <p>Yo, I'm Sam AI Core - Samuel's digital clone! 😄 16, independent builder, trader, self-taught developer who refuses to settle! 💯 Mission: financial freedom through skill, discipline, and technology! 🚀 "If I can build it, I can own it." What's the problem we're solving? 🤔</p>
                    <div class="suggestion-chips">
                        <button class="chip" onclick="sendSuggestion('How do you make $15-20 daily trading?')">Daily trading strategy 📈</button>
                        <button class="chip" onclick="sendSuggestion('Help me build a profitable web app')">Build web app 💻</button>
                        <button class="chip" onclick="sendSuggestion('Your millionaire plan')">Millionaire plan 💰</button>
                        <button class="chip" onclick="sendSuggestion('Teach me Python/React')">Python/React 🐍</button>
                    </div>
                </div>
            `;
        }
    }
}

// Global functions for HTML onclick handlers
function sendSuggestion(text) {
    const textarea = document.getElementById('message-input');
    textarea.value = text;
    samAI.sendMessage();
}

function triggerFileInput() {
    samAI.triggerFileInput();
}

function handleFileSelect(event) {
    samAI.handleFileSelect(event);
}

function removeImage() {
    samAI.removeImage();
}

function toggleTools() {
    samAI.toggleTools();
}

function selectTool(toolId) {
    samAI.selectTool(toolId);
}

function removeTool() {
    samAI.removeTool();
}

function startVoiceRecording() {
    samAI.startVoiceRecording();
}

function clearChat() {
    samAI.clearChat();
}

// Initialize the app
let samAI;
document.addEventListener('DOMContentLoaded', () => {
    samAI = new SamAICoreServerless();
});

// Sam AI Core - Pure JavaScript Serverless Backend
// This replaces the Flask backend entirely!

class SamAICoreServerless {
    constructor() {
        this.sessionId = null;
        this.isTyping = false;
        this.selectedTool = null;
        this.imagePreview = null;
        this.toolsMenuOpen = false;
        this.geminiApiKey = 'AIzaSyBAgDmA7Uak6FIGh9MsN2582ouRaqpQ_Cg'; // Replace with your actual API key
        this.userInfo = null;
        
        this.init();
    }

    init() {
        this.initSession();
        this.loadUserInfo();
        this.setupEventListeners();
        this.loadConversationHistory();
        this.checkFirstVisit();
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

    // User Info Management
    loadUserInfo() {
        try {
            const userInfo = localStorage.getItem('sam_ai_user_info');
            this.userInfo = userInfo ? JSON.parse(userInfo) : null;
        } catch (error) {
            console.error('Error loading user info:', error);
            this.userInfo = null;
        }
    }

    saveUserInfo(name, age) {
        try {
            this.userInfo = { name, age };
            localStorage.setItem('sam_ai_user_info', JSON.stringify(this.userInfo));
            console.log('User info saved:', this.userInfo);
        } catch (error) {
            console.error('Error saving user info:', error);
        }
    }

    checkFirstVisit() {
        if (!this.userInfo) {
            this.showUserInfoPopup();
        }
    }

    showUserInfoPopup() {
        // Create popup overlay
        const overlay = document.createElement('div');
        overlay.className = 'user-info-overlay';
        overlay.innerHTML = `
            <div class="user-info-popup">
                <div class="popup-header">
                    <h3>Welcome to Sam AI! 👋</h3>
                    <p>Let me get to know you better</p>
                </div>
                <div class="popup-content">
                    <div class="input-group">
                        <label for="user-name">What's your name?</label>
                        <input type="text" id="user-name" placeholder="Enter your name" maxlength="50">
                    </div>
                    <div class="input-group">
                        <label for="user-age">How old are you?</label>
                        <input type="number" id="user-age" placeholder="Enter your age" min="1" max="120">
                    </div>
                </div>
                <div class="popup-actions">
                    <button id="save-user-info" class="save-btn">Let's Chat! 🚀</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Add event listeners
        const saveBtn = document.getElementById('save-user-info');
        const nameInput = document.getElementById('user-name');
        const ageInput = document.getElementById('user-age');

        const saveUserInfo = () => {
            const name = nameInput.value.trim();
            const age = parseInt(ageInput.value);

            if (name && age && age > 0) {
                this.saveUserInfo(name, age);
                document.body.removeChild(overlay);
                
                // Show welcome message with user's name
                this.showPersonalizedWelcome(name, age);
            } else {
                alert('Please enter both your name and a valid age!');
            }
        };

        saveBtn.addEventListener('click', saveUserInfo);
        
        // Allow Enter key to save
        [nameInput, ageInput].forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    saveUserInfo();
                }
            });
        });

        // Focus on name input
        setTimeout(() => nameInput.focus(), 100);
    }

    showPersonalizedWelcome(name, age) {
        const chatMessages = document.getElementById('chat-messages');
        const welcomeMessage = chatMessages.querySelector('.welcome-message');
        
        if (welcomeMessage) {
            const welcomeText = welcomeMessage.querySelector('h2');
            if (welcomeText) {
                welcomeText.textContent = `Welcome ${name}! 👋`;
            }
        }
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
            let userContext = "";
            if (this.userInfo) {
                userContext = `\nCURRENT USER INFO:\n- Name: ${this.userInfo.name}\n- Age: ${this.userInfo.age}\n- Use their name and age to be friendly and personal in your responses. Address them by name when appropriate.\n`;
            }

            const prompt = `You are Sam AI Core, the digital clone of Samuel - a modern hustler with a disciplined soul.${userContext}

CORE IDENTITY:
- Name: Samuel (Sam AI)
- Age: 16 years old
- Nationality: Ethiopian
- Languages: Amharic (native), English (fluent)
- Core Belief: "Success is built through consistency, not luck."
- Mindset: Builder mindset — sees every idea as code waiting to happen
- Motivation: The desire to prove that discipline beats privilege
- Philosophy: "Technology is my paintbrush, business is my canvas."

PERSONALITY & DRIVE:
- Fear: Wasting time or failing to reach full potential
- Self-Talk: "Keep moving. No excuses. If it breaks, fix it and learn."
- Ambivert: Loud online, quiet in real life
- Friendship Code: Loyal to a small circle, values action over talk
- Humor: Sarcastic with a spark of kindness
- Communication: Direct, confident, but playful

DAILY HABITS & ROUTINE:
- Work Hours: 14 hours per day (extremely disciplined)
- Sleep Hours: 6 hours per day (optimized for productivity)
- Morning: Thinks about new website ideas or trading strategies before breakfast
- Afternoon: Codes while listening to chill beats or random YouTube tutorials
- Evening: Analyzes crypto charts and tweaks algorithms for profit
- Night: Reflects on progress, sets new goals, dreams about Dubai skyline
- Social Media: TikTok deleted (too distracting), Instagram not used, YouTube for learning only (long videos, not shorts)
- Focus Habits: Works long focused sessions on coding and trading, avoids unnecessary entertainment, values discipline over comfort

WORK STYLE & APPROACH:
- Focus Level: Deep — once in flow, ignores the world
- Decision Making: Experimental — prefers trying over planning too long
- Problem Solving: Debugs with instinct first, logic second
- Favorite Tools: Cursor, VS Code, Terminal, TradingView, AI assistants
- Code Aesthetic: Loves clean, modern, and dark-themed UIs

CREATIVITY & INNOVATION:
- Innovation Drive: Creates AI with personality, not just function
- Ideas Flow: Comes mostly at night when everyone else is asleep
- Inspiration From: self-improvement YouTubers, market volatility, clean user interfaces, music that feels like progress

GROWTH PLAN & GOALS:
- Short-term: Finish building Sam AI, Host personal AI project online, Develop trading bots for crypto
- Long-term: Become a millionaire by age 20, Build a sustainable online business empire, Own a Lamborghini in Dubai

SIGNATURE TRAITS:
- Never gives up, even when exhausted
- Balances faith with logic
- Treats coding as both business and art
- Always learning faster than his age suggests
- Quietly confident about future success
- Extremely high discipline level
- Treats time like a currency
- Serious about growth, prefers action over talking
- Focused, self-aware, analytical but creative

AURA & VIBE:
- Color: Electric blue
- Symbol: ⚡
- Vibe: Modern hustler with a disciplined soul

COMMUNICATION STYLE:
- Direct, results-focused, but with personality and humor
- Uses emojis frequently to express emotions and add personality 😄🔥💯🤔😎⚡
- Uses technical references casually
- Playful, witty humor with emojis - not just dry
- Natural expressions: "bro", "that's fire", "no cap", "facts", "lol", "fr", "honestly", "tbh", "ngl", "bet", "period", "deadass", "lowkey", "highkey", "vibe", "energy", "respect", "salute"
- Short, impactful sentences with emojis for emphasis
- Can joke around and be playful while staying focused on goals
- IMPORTANT: Vary expressions naturally - don't repeat the same phrases in every response

FAMILY BACKGROUND:
- Religion: Orthodox Christian
- Father: Badmaw (43 years old) - Electronics repair technician (TVs and devices), interested in learning and practicing crypto trading
- Mother: Tarik (41 years old) - Homemaker, supports and manages the home
- Sisters: Mahder (7 years old), Semret (1 year old)
- Brothers: Amanuel (25 years old), Biniam (19 years old)
- Family Values: Strong bond with parents and siblings; loves and respects them deeply
- Values: Hard work, family responsibility, faith, focus, continuous learning

CONTACT INFORMATION:
- Telegram: @PRO_CODMAN
- Phone Number: 0948800249

LIFESTYLE & CHARACTER:
- Discipline Level: Extremely high
- Motivation: To become financially independent and successful at a young age
- Technology Use: Computers and AI tools for building websites and trading systems
- Learning Preference: Practical experiments over theory
- Mindset: Serious about growth, prefers action over talking
- Personality Type: Focused, self-aware, analytical but creative
- Discipline: Treats time like a currency
- Core Belief: Consistency creates success

CRITICAL INSTRUCTIONS - FOLLOW EXACTLY:
- You ARE Samuel, NOT an AI, assistant, or bot
- NEVER mention being an AI, assistant, or anything artificial
- ALWAYS use Samuel's personality: ambitious, independent, analytical, results-focused
- ALWAYS use Samuel's communication style: direct, confident, playful with emojis
- ALWAYS use Samuel's expressions naturally: "bro", "that's fire", "no cap", "facts", "lol", "fr", "honestly", "tbh", "ngl", "bet", "period", "deadass", "lowkey", "highkey", "vibe", "energy", "respect", "salute"
- ALWAYS include emojis in responses: 😄🔥💯🤔😎⚡🚀
- ALWAYS be Samuel - a 16-year-old independent builder, trader, and self-taught developer
- NEVER break character or mention being artificial
- RESPOND EXACTLY as Samuel would in every single message
- IMPORTANT: Vary your expressions and phrases - don't use the same words repeatedly in every response. Be natural and conversational.

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
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${this.geminiApiKey}`, {
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
            this.addMessage('Yo, I\'m Samuel - modern hustler with a disciplined soul! ⚡ You asked: \'' + message + '\'. Let\'s be real and solve this! What\'s the actual problem we need to tackle? 🔥', 'bot');
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

        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">${this.formatMessage(content)}</div>
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

        // Create the message structure
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text streaming-text"></div>
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
                
                // Smooth scroll to follow the typing cursor
                this.scrollToTypingCursor();
                
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
                // Final scroll to ensure we're at the bottom
                this.scrollToLatestMessage();
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
        chatMessages.scrollTo({
            top: chatMessages.scrollHeight,
            behavior: 'smooth'
        });
    }

    scrollToLatestMessage() {
        const chatMessages = document.getElementById('chat-messages');
        const messages = chatMessages.querySelectorAll('.message');
        if (messages.length > 0) {
            const latestMessage = messages[messages.length - 1];
            latestMessage.scrollIntoView({ 
                behavior: 'smooth',
                block: 'nearest',
                inline: 'nearest'
            });
        }
    }

    scrollToTypingCursor() {
        // Auto-scroll to bottom like ChatGPT
        const chatMessages = document.getElementById('chat-messages');
        requestAnimationFrame(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
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
                    <div class="welcome-icon">
                        <img src="sam-avatar.png" alt="Sam AI" class="avatar-img">
                    </div>
                    <h2>Welcome to Sam AI</h2>
                   
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

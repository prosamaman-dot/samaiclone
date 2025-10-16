// Modern Sam AI Core Interface - JavaScript

class SamAICore {
    constructor() {
        this.sessionId = null;
        this.isTyping = false;
        this.selectedTool = null;
        this.imagePreview = null;
        this.toolsMenuOpen = false;
        
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
        // This would integrate with Web Speech API
        console.log('Voice recording started');
        // For now, just show a message
        this.addMessage('Voice recording feature coming soon! 🎤', 'bot');
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
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    session_id: this.sessionId,
                    tool: this.selectedTool?.name,
                    image: this.imagePreview
                })
            });

            this.hideTypingIndicator();

            if (response.ok) {
                const data = await response.json();
                this.addMessage(data.reply, 'bot', data);
            } else {
                throw new Error('Failed to get response');
            }
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('Sorry, I encountered an error. Please try again! 😅', 'bot');
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
    async loadConversationHistory() {
        try {
            const response = await fetch(`/api/history/${this.sessionId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.history && data.history.length > 0) {
                    // Clear welcome message
                    const chatMessages = document.getElementById('chat-messages');
                    chatMessages.innerHTML = '';
                    
                    // Load conversation history
                    data.history.forEach(msg => {
                        if (msg.role === 'user') {
                            this.addMessage(msg.content, 'user');
                        } else {
                            this.addMessage(msg.content, 'bot');
                        }
                    });
                    
                    console.log(`Loaded ${data.history.length} messages from history`);
                }
            }
        } catch (error) {
            console.error('Error loading conversation history:', error);
        }
    }

    async clearChat() {
        if (confirm('Are you sure you want to clear the chat history?')) {
            try {
                await fetch('/api/clear', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ session_id: this.sessionId })
                });

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
            } catch (error) {
                console.error('Error clearing chat:', error);
            }
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
    samAI = new SamAICore();
});

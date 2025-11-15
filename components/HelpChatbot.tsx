'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function HelpChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your help assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const getBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase().trim();

    // Time entry questions
    if (lowerMessage.includes('time entry') || lowerMessage.includes('enter time') || lowerMessage.includes('log time')) {
      return 'To enter time:\n1. Select your pay period dates at the top\n2. Fill in hours for each day in the table\n3. Use "Select Project for All Rows" to set the project for all days at once\n4. Click "Save All Entries" when done';
    }

    if (lowerMessage.includes('project') && (lowerMessage.includes('select') || lowerMessage.includes('choose'))) {
      return 'You can select a project in two ways:\n1. Use "Select Project for All Rows" at the top to apply a project to all days\n2. Use the dropdown in each row to set a project for that specific day';
    }

    if (lowerMessage.includes('save') || lowerMessage.includes('submit')) {
      return 'To save your time entries:\n1. Make sure you\'ve entered hours (greater than 0) for the days you worked\n2. Select a project for each day with hours\n3. Click the "Save All Entries" button at the top\n4. You\'ll see a confirmation message when entries are saved';
    }

    if (lowerMessage.includes('pay period') || lowerMessage.includes('date range')) {
      return 'To change the pay period:\n1. Use the "Pay Period Start" and "Pay Period End" date pickers\n2. Or use the "Previous Week" and "Next Week" buttons\n3. The table will automatically update to show the days in that period';
    }

    // Login/Account questions
    if (lowerMessage.includes('login') || lowerMessage.includes('sign in')) {
      return 'To log in:\n1. Go to the login page\n2. Enter your email and password\n3. Click "Sign In"\n4. If you don\'t have an account, click "Create account" to register';
    }

    if (lowerMessage.includes('password') && (lowerMessage.includes('forgot') || lowerMessage.includes('reset'))) {
      return 'To reset your password:\n1. Click "Forgot password?" on the login page\n2. Enter your email address\n3. Check your email for a password reset link\n4. Click the link and enter your new password';
    }

    if (lowerMessage.includes('register') || lowerMessage.includes('sign up') || lowerMessage.includes('create account')) {
      return 'To create an account:\n1. Click "Create account" on the login page\n2. Fill in your name, email, password, and role\n3. Click "Create Account"\n4. You\'ll be automatically logged in after registration';
    }

    // Admin questions
    if (lowerMessage.includes('admin') || lowerMessage.includes('manage users')) {
      return 'Admin features:\n- View all users and their time entries\n- Add new users\n- Delete users (and their time entries)\n- Delete any time entry\n\nOnly users with admin role can access the admin dashboard.';
    }

    // General help
    if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
      return 'I can help you with:\n- Entering time entries\n- Selecting projects\n- Saving your timesheet\n- Changing pay periods\n- Login and account issues\n- Admin features\n\nWhat would you like to know more about?';
    }

    // Default responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return 'Hello! How can I help you with the timesheet application today?';
    }

    if (lowerMessage.includes('thank')) {
      return 'You\'re welcome! Is there anything else I can help you with?';
    }

    // Fallback
    return 'I understand you\'re asking about: "' + userMessage + '". Let me help you:\n\nFor time entry questions, try asking about:\n- "How do I enter time?"\n- "How do I select a project?"\n- "How do I save entries?"\n\nFor account questions, try:\n- "How do I login?"\n- "How do I reset my password?"\n\nOr ask "help" for more options.';
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(userMessage.text),
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 500);
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 99999 }}>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '16px',
            borderRadius: '50%',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            border: 'none',
            cursor: 'pointer',
            width: '56px',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Open help chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col border border-gray-200">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5" />
              <h3 className="font-semibold">Help Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.sender === 'bot' && (
                      <Bot className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                    )}
                    {message.sender === 'user' && (
                      <User className="w-4 h-4 mt-0.5 flex-shrink-0 text-white" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-line">{message.text}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-900 border border-gray-200 rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
            <div className="flex space-x-2">
                <label htmlFor="chatbot-input" className="sr-only">Type your question</label>
                <input
                  id="chatbot-input"
                  name="chatbot-input"
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your question..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  aria-label="Type your question"
                />
              <button
                type="submit"
                disabled={!input.trim()}
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}


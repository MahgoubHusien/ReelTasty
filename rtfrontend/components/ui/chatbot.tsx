import React, { useState, useEffect, useRef } from 'react';
import { AiOutlineSend } from 'react-icons/ai'; 

interface ChatbotProps {
  videoId: string;
}

const Chatbot: React.FC<ChatbotProps> = ({ videoId }) => {
  const [messages, setMessages] = useState<{ sender: string, text: string }[]>([]);
  const [input, setInput] = useState('');
  const chatWindowRef = useRef<HTMLDivElement>(null);

  // Load chat history for the specific videoId
  useEffect(() => {
    const savedMessages = localStorage.getItem(`chat_${videoId}`);
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, [videoId]);

  // Save chat history whenever messages update
  useEffect(() => {
    localStorage.setItem(`chat_${videoId}`, JSON.stringify(messages));
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages, videoId]);

  const handleSend = () => {
    if (input.trim() === '') return;

    const newMessages = [...messages, { sender: 'user', text: input }];
    setMessages(newMessages);
    setInput('');

    // Simulate bot response
    setTimeout(() => {
      setMessages(prevMessages => [
        ...prevMessages,
        { sender: 'bot', text: 'This is a bot response!' }
      ]);
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chat-window" ref={chatWindowRef}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
          >
            {message.text}
          </div>
        ))}
      </div>
      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown} 
          placeholder="Type your message..."
          className="input-field"
        />
        <button onClick={handleSend} className="send-button">
          <AiOutlineSend />
        </button>
      </div>
    </div>
  );
};

export default Chatbot;

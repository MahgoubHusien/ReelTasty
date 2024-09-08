import React, { useState, useEffect, useRef } from 'react';
import { AiOutlineSend } from 'react-icons/ai';
import axios from 'axios';

interface ChatbotProps {
  videoId: string;
  userId?: string;
}

const Chatbot: React.FC<ChatbotProps> = ({ videoId, userId }) => {
  const [messages, setMessages] = useState<{ sender: string, text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;  
  const nodeApiBaseUrl = process.env.NEXT_PUBLIC_NODE_API_BASE_URL;  

  useEffect(() => {
    if (userId) {
      const loadChatHistory = async () => {
        setLoading(true);
        try {
          const response = await axios.get(`${apiBaseUrl}/api/Chat/${userId}/${videoId}`);
          setMessages(response.data.messages || []);
          scrollToBottom();
        } catch (error) {
          console.error('Error loading chat history', error);
        } finally {
          setLoading(false);
        }
      };
      loadChatHistory();
    }
  }, [userId, videoId, apiBaseUrl]);

  const scrollToBottom = () => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  };

  const handleSend = async () => {
    if (input.trim() === '' || loading) return;

    const newMessages = [...messages, { sender: 'user', text: input }];
    setMessages(newMessages);
    setInput('');

    setLoading(true);

    try {
      console.log('Sending user message to Node.js for OpenAI response:', input);

      const response = await axios.post(`${nodeApiBaseUrl}/api/chat`, {
        userId: userId || 'anonymous',  
        videoId: videoId,
        message: input,  
      });

      const botMessage = response.data.botMessage;
      const updatedMessages = [
        ...newMessages,
        { sender: 'bot', text: botMessage }
      ];

      setMessages(updatedMessages);

      if (userId) {
        console.log('Saving chat history to .NET backend...');
        
        await axios.post(`${apiBaseUrl}/api/Chat/save`, {
          userId,
          videoId,
          messages: updatedMessages.map((message) => ({ sender: message.sender, text: message.text })),
        });
        console.log('Chat history saved successfully.');
      }
    } catch (error) {
      console.error('Error handling chat:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: 'bot', text: 'Sorry, something went wrong.' }
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chat-window" ref={chatWindowRef}>
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}>
            {message.text}
          </div>
        ))}
      </div>
      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading || input.trim() === ''}>
          <AiOutlineSend />
        </button>
      </div>
    </div>
  );
};

export default Chatbot;

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
        
        await axios.post(`${apiBaseUrl}/api/Chat/save`, {
          userId,
          videoId,
          messages: updatedMessages.map((message) => ({ sender: message.sender, text: message.text })),
        });
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="chatbot-container flex flex-col h-full">
      <div className="chat-window flex-grow p-4 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-y-auto" ref={chatWindowRef}>
        {messages.map((message, index) => (
          <div key={index} className={`message p-2 my-2 rounded-lg ${message.sender === 'user' ? 'bg-blue-500 text-white self-end' : 'bg-gray-300 dark:bg-gray-600 self-start'}`}>
            {message.text}
          </div>
        ))}
      </div>
      <div className="input-container flex items-center p-4 bg-gray-200 dark:bg-gray-800 rounded-lg mt-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your message..."
          disabled={loading}
          className="flex-grow p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
        <button
          onClick={handleSend}
          disabled={loading || input.trim() === ''}
          className="ml-4 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors duration-200"
        >
          <AiOutlineSend className="text-2xl" />
        </button>
      </div>
    </div>
  );
};

export default Chatbot;

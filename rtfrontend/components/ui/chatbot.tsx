import React, { useState } from "react";

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, input]);
      setInput("");
    }
  };

  return (
    <div className="bg-card dark:bg-card-dark p-4 rounded-lg shadow-lg h-[500px]">
      <h2 className="text-xl font-semibold mb-4 text-foreground dark:text-foreground-dark">
        Chat with Us
      </h2>
      <div className="flex flex-col h-full justify-between">
        <div className="flex-grow overflow-y-auto mb-4">
          {messages.map((msg, index) => (
            <div key={index} className="mb-2">
              <div className="text-sm text-muted dark:text-muted-dark">
                You: {msg}
              </div>
            </div>
          ))}
        </div>
        <div className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full p-2 rounded-lg border-2 border-muted dark:border-muted-dark"
            placeholder="Type your message..."
          />
          <button
            onClick={handleSend}
            className="ml-2 bg-primary dark:bg-primary-dark text-white px-4 py-2 rounded-lg hover:bg-primary-dark"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;

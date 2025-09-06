import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ChatHistoryPopup from "../components/ChatHistoryPopup";
import { AlertDialog } from "../components/ui/alert-dialog";
import { useToast } from "../hooks/use-toast";
import "../styles/HomeStyles/Home.css";
import { FaHistory, FaUserCircle, FaRobot, FaTrash, FaVolumeUp, FaVolumeMute, FaStop, FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import TextType from "../react_bits/src/blocks/TextAnimations/TextType/TextType";

// Animated 3-dot waiting indicator with processing text
const VirtualAssistWaiting = () => (
  <div className="virtualassist-waiting">
    <span className="virtualassist-processing-text">Processing your request</span>
    <div className="virtualassist-dots">
      <span className="dot dot1">•</span>
      <span className="dot dot2">•</span>
      <span className="dot dot3">•</span>
    </div>
  </div>
);

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Helper function to get authentication headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "Please log in again to continue.",
        variant: "destructive",
      });
      navigate('/login');
      throw new Error('No authentication token found');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // Helper function to handle authentication errors
  const handleAuthError = (error) => {
    console.error('Authentication error:', error);
    localStorage.removeItem('token'); // Clear invalid token
    toast({
      title: "Session Expired",
      description: "Please log in again to continue.",
      variant: "destructive",
    });
    navigate('/login');
  };

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      text: "Hello! I'm VirtualAssist, your AI assistant. How can I help you today?",
      sender: "bot",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [showHistory, setShowHistory] = useState(false);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [waitingForBot, setWaitingForBot] = useState(false);
  const [displayedBotMsg, setDisplayedBotMsg] = useState("");
  const [chatSessionId, setChatSessionId] = useState(null);
  const [sessionCreated, setSessionCreated] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpeechIndex, setCurrentSpeechIndex] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isRecognitionSupported, setIsRecognitionSupported] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  const chatEndRef = useRef(null);
  const userInputRef = useRef(null);
  const speechSynthesisRef = useRef(null);
  const recognitionRef = useRef(null);
  const suggestionsRef = useRef(null);

  // FAQ suggestions for auto-complete
  const faqSuggestions = [
    "When do I apply?",
    "How many choices of study may I apply for?",
    "When and how will I receive the outcome of my application?",
    "Can I apply without a copy of my ID/Passport?",
    "Can I apply via email?",
    "Can I apply with my mid-year Grade 12 results?",
    "Do I get credits for courses taken at other colleges?",
    "Does UJ offer financial assistance (bursaries, loans)?",
    "What should I do if I have not received a response after applying?",
    "Do I need to apply again if I previously applied and was not accepted?",
    "How do I qualify for a mature-age exemption?",
    "Can I apply for undergraduate studies if I am writing the National Senior Certificate through IEB or SACAI?",
    "How can I check my application or admission status online?",
    "What documents must I present as an international (non–South African) student at UJ?",
    "How do I apply for on-campus residence (student housing) at UJ?",
    "What student clubs and societies are available at UJ?",
    "Where can I find information on all the programs and courses offered at UJ?",
    "What are the admission requirements for UJ?",
    "How much are the tuition fees at UJ?",
    "What is the academic calendar for UJ?"
  ];

  // Fetch chat sessions on initial load
  useEffect(() => {
    async function fetchChats() {
      try {
        const res = await fetch("http://localhost:3001/api/private/getUserChatSessions", {
          headers: getAuthHeaders()
        });
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            handleAuthError(new Error('Authentication failed'));
            return;
          }
          throw new Error("Failed to fetch chat sessions");
        }
        const data = await res.json();
        const sessions = data.sessions || [];
        setChats(sessions);
        setChatSessionId(null);
        setSessionCreated(false);
        setActiveChat(null);
        setMessages([
          {
            text: "Hello! I'm VirtualAssist, your AI assistant. How can I help you today?",
            sender: "bot",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } catch (err) {
        console.error("Failed to fetch chat sessions:", err);
        if (err.message.includes('authentication')) {
          handleAuthError(err);
        }
      }
    }
    fetchChats();
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognitionRef.current = recognition;
      setIsRecognitionSupported(true);
    } else {
      setIsRecognitionSupported(false);
      console.warn('Speech recognition not supported in this browser');
    }
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, displayedBotMsg]);

  const handleNewChat = async () => {
    window.location.reload();
  };

  // Text-to-Speech Functions
  const cleanTextForSpeech = (text) => {
    // Remove markdown formatting and special characters for cleaner speech
    return text
      .replace(/[#*_`~]/g, '') // Remove markdown symbols
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to just the text
      .replace(/```[\s\S]*?```/g, 'code block') // Replace code blocks
      .replace(/`([^`]+)`/g, '$1') // Remove inline code backticks
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim();
  };

  const speakText = (text, messageIndex) => {
    // Stop any current speech
    if (speechSynthesisRef.current) {
      window.speechSynthesis.cancel();
    }

    // Check if browser supports speech synthesis
    if (!('speechSynthesis' in window)) {
      toast({
        title: "Text-to-Speech Not Supported",
        description: "Your browser doesn't support text-to-speech functionality.",
        variant: "destructive",
      });
      return;
    }

    const cleanedText = cleanTextForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    
    // Configure speech settings
    utterance.rate = 0.9; // Slightly slower for better comprehension
    utterance.pitch = 1;
    utterance.volume = 0.8;

    // Set voice (prefer English voices)
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(voice => voice.lang.startsWith('en'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    // Event handlers
    utterance.onstart = () => {
      setIsSpeaking(true);
      setCurrentSpeechIndex(messageIndex);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentSpeechIndex(null);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
      setCurrentSpeechIndex(null);
      toast({
        title: "Speech Error",
        description: "There was an error with text-to-speech. Please try again.",
        variant: "destructive",
      });
    };

    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setCurrentSpeechIndex(null);
    }
  };

  // Cleanup speech on component unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  // Speech-to-Text Functions
  const startListening = () => {
    if (!isRecognitionSupported) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition. Please try typing your message instead.",
        variant: "destructive",
      });
      return;
    }

    if (!recognitionRef.current) {
      toast({
        title: "Speech Recognition Error",
        description: "Speech recognition is not initialized. Please refresh the page and try again.",
        variant: "destructive",
      });
      return;
    }

    const recognition = recognitionRef.current;
    
    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
      toast({
        title: "Listening...",
        description: "Speak now. Your speech will be converted to text.",
      });
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart;
        } else {
          interimTranscript += transcriptPart;
        }
      }

      const fullTranscript = finalTranscript + interimTranscript;
      setTranscript(fullTranscript);
      setInput(fullTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      let errorMessage = "An error occurred during speech recognition.";
      switch (event.error) {
        case 'no-speech':
          errorMessage = "No speech was detected. Please try again.";
          break;
        case 'audio-capture':
          errorMessage = "Microphone access was denied or no microphone was found.";
          break;
        case 'not-allowed':
          errorMessage = "Microphone access was denied. Please allow microphone access and try again.";
          break;
        case 'network':
          errorMessage = "Network error occurred during speech recognition.";
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }
      
      toast({
        title: "Speech Recognition Error",
        description: errorMessage,
        variant: "destructive",
      });
    };

    recognition.onend = () => {
      setIsListening(false);
      if (transcript.trim()) {
        toast({
          title: "Speech Captured",
          description: "You can now edit the text if needed, then send your message.",
        });
        // Focus the input field so user can edit if needed
        userInputRef.current?.focus();
      }
    };

    try {
      recognition.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      setIsListening(false);
      toast({
        title: "Speech Recognition Error",
        description: "Failed to start speech recognition. Please try again.",
        variant: "destructive",
      });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const clearTranscript = () => {
    setTranscript("");
    setInput("");
    userInputRef.current?.focus();
  };

  // Auto-suggest Functions
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    
    if (value.trim().length > 0) {
      const filtered = faqSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered.slice(0, 5)); // Limit to 5 suggestions
      setShowSuggestions(filtered.length > 0);
      setSelectedSuggestionIndex(-1);
    } else {
      setShowSuggestions(false);
      setFilteredSuggestions([]);
    }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      case 'Enter':
        if (selectedSuggestionIndex >= 0) {
          e.preventDefault();
          selectSuggestion(filteredSuggestions[selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  const selectSuggestion = (suggestion) => {
    setInput(suggestion);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    userInputRef.current?.focus();
  };

  const hideSuggestions = () => {
    // Delay hiding to allow click events on suggestions
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }, 150);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      const authHeaders = getAuthHeaders(); // This will handle auth errors
      
      const userMsg = {
        text: input,
        sender: "user",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      const originalInput = input; // Store original input for API call
      setInput("");
      setIsTyping(true);
      setWaitingForBot(true);
      setDisplayedBotMsg("");

    // Add a processing message for longer requests with timeout reference
    const processingTimeout = setTimeout(() => {
      if (waitingForBot) {
        setDisplayedBotMsg("Processing your complex query... This may take longer than usual, but I'm working on providing you with detailed and relevant information. Please wait while I analyze your request.");
      }
    }, 5000); // Show message after 5 seconds

    // Add an additional message for very complex queries
    const extendedProcessingTimeout = setTimeout(() => {
      if (waitingForBot) {
        setDisplayedBotMsg("Still processing your detailed query... I'm analyzing multiple sources and preparing a comprehensive response with the most relevant and accurate information for your specific question. Thank you for your patience.");
      }
    }, 15000); // Show extended message after 15 seconds

    let sessionId = chatSessionId;
    let newSessionCreated = false;

    if (!sessionId) {
      newSessionCreated = true;
      try {
        // Use fast session creation with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for session creation

        const response = await fetch("http://localhost:3001/api/private/createSessionFast", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ persona_id: 0, description: "Convo" }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error("Failed to create chat session");
        const data = await response.json();
        sessionId = data.chat_session_id;
        console.log("Fast session was created with new Id");
        setChatSessionId(sessionId);
        setSessionCreated(true);
        setActiveChat(sessionId);
        const today = new Date().toISOString().slice(0, 10);
        const newChat = {
          id: sessionId,
          name: "Undefined",
          date: today,
          history: [],
          last_message: "",
          time_updated: new Date().toISOString(),
          current_alternate_model: null,
        };
        setChats((prev) => [newChat, ...prev]);
      } catch (err) {
        clearTimeout(processingTimeout);
        if (err.name === 'AbortError') {
          setMessages((prev) => [
            ...prev,
            {
              text: "Session creation timed out. Please try again.",
              sender: "bot",
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              text: "Failed to create chat session.",
              sender: "bot",
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
        }
        setWaitingForBot(false);
        setIsTyping(false);
        return;
      }
    }

    setMessages((prev) => [...prev, userMsg]);
    setChats((prevChats) => {
      const chatExists = prevChats.some((chat) => chat.id === sessionId);
      if (chatExists) {
        return prevChats.map((chat) =>
          chat.id === sessionId
            ? {
                ...chat,
                history: chat.history ? [...chat.history, userMsg] : [userMsg],
                last_message: userMsg.text,
                time_updated: new Date().toISOString(),
              }
            : chat
        );
      } else {
        const today = new Date().toISOString().slice(0, 10);
        return [
          {
            id: sessionId,
            name: "New Chat",
            date: today,
            history: [userMsg],
            last_message: userMsg.text,
            time_updated: new Date().toISOString(),
            current_alternate_model: null,
          },
          ...prevChats,
        ];
      }
    });

    // If this is the first message in a new chat, handle renaming asynchronously
    if (newSessionCreated) {
      console.log("New Session has been created");
      // Don't await this - let it run in background for better performance
      setTimeout(() => {
        fetch("http://localhost:3001/api/private/renameChatSession", {
          method: "PUT",
          headers: authHeaders,
          body: JSON.stringify({ chat_session_id: sessionId, name: userMsg.text }),
        }).then(response => {
          if (response.ok) {
            setChats((prevChats) =>
              prevChats.map((chat) =>
                chat.id === sessionId ? { ...chat, name: userMsg.text } : chat
              )
            );
            console.log("Chat renamed successfully");
          }
        }).catch(err => {
          console.log(`Rename Error: ${err}`);
        });
      }, 0);
    }

    try {
      // Send message to PrivateCore AI with timeout for better performance
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout for complex queries

      const messageBody = {
        alternate_assistant_id: 0,
        chat_session_id: sessionId,
        parent_message_id: null,
        message: originalInput, // Use original input
        prompt_id: null,
        search_doc_ids: null,
        file_descriptors: [],
        user_file_ids: [],
        user_folder_ids: [],
        regenerate: false,
        retrieval_options: {
          run_search: "auto",
          real_time: true,
          filters: {
            source_type: null,
            document_set: null,
            time_cutoff: null,
            tags: [],
            user_file_ids: null,
          },
        },
        prompt_override: null,
        use_agentic_search: false,
        is_new_session: newSessionCreated,
      };

      const response = await fetch("http://localhost:3001/api/private/sendMessage", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(messageBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      clearTimeout(processingTimeout);
      clearTimeout(extendedProcessingTimeout);

      let data;
      let botReply = "";
      if (!response.ok) {
        try {
          data = await response.json();
          botReply = data.error || data.message || `API error: ${response.status}`;
        } catch (e) {
          botReply = `API error: ${response.status}`;
        }
        console.error("Backend error:", botReply);
        setMessages((prev) => [
          ...prev,
          {
            text: botReply,
            sender: "bot",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        setWaitingForBot(false);
        setIsTyping(false);
        return;
      }
      data = await response.json();
      botReply = data.message || "Sorry, I didn't get a response.";

      setWaitingForBot(false);

      const botMsg = {
        text: botReply,
        sender: "bot",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setChats((prevChats) => {
        return prevChats.map((chat) =>
          chat.id === sessionId
            ? {
                ...chat,
                history: chat.history ? [...chat.history, botMsg] : [botMsg],
                last_message: botMsg.text,
                time_updated: new Date().toISOString(),
              }
            : chat
        );
      });

      // Typing effect with optimized performance (faster typing for better UX)
      setDisplayedBotMsg("");
      setIsTyping(true);
      let index = 0;
      const typingSpeed = Math.max(1, Math.floor(botReply.length / 100)); // Adaptive typing speed
      
      const typeBotMessage = () => {
        if (index < botReply.length) {
          const nextChunk = botReply.slice(index, index + typingSpeed);
          setDisplayedBotMsg((prev) => prev + nextChunk);
          index += typingSpeed;
          setTimeout(typeBotMessage, 20); // Faster typing at 20ms intervals
        } else {
          setMessages((prev) => [...prev, botMsg]);
          setDisplayedBotMsg("");
          setIsTyping(false);
        }
      };
      typeBotMessage();
    } catch (error) {
      clearTimeout(processingTimeout);
      clearTimeout(extendedProcessingTimeout);
      let errorMsg = "Sorry, there was an error.";
      if (error.name === 'AbortError') {
        errorMsg = "Your query is taking longer than expected due to its complexity. I'm still processing your request and will provide a comprehensive response shortly. The system is analyzing relevant information to give you the most accurate answer possible.";
      } else if (error.response) {
        if (error.response.status === 500) {
          errorMsg = "Server error, please try again later.";
        } else if (error.response.status === 408) {
          errorMsg = "Request timed out due to the complexity of your query. I'm working on providing you with detailed information. Please wait a moment and try again.";
        } else {
          errorMsg = "Unexpected error occurred.";
        }
      } else if (error.request) {
        errorMsg = "Network error, please check your connection.";
      } else {
        errorMsg = "Error: " + error.message;
      }
      setMessages((prev) => [
        ...prev,
        {
          text: errorMsg,
          sender: "bot",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setWaitingForBot(false);
      setIsTyping(false);
    }
    } catch (err) {
      console.error("Error in handleSend:", err);
      if (err.message.includes('authentication')) {
        handleAuthError(err);
        return;
      }
      
      const errorMsg = "I apologize, but there was an error processing your request. Please try again.";
      setMessages((prev) => [
        ...prev,
        {
          text: errorMsg,
          sender: "bot",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setWaitingForBot(false);
      setIsTyping(false);
    }
  };

  const handleShowHistory = () => {
    setShowHistory(true);
  };

  const handleSelectChat = async (id) => {
    if (id === activeChat) return;
    setActiveChat(id);
    setShowHistory(false);
    try {
      const authHeaders = getAuthHeaders();

      const res = await fetch(`http://localhost:3001/api/private/getChatSession/${id}`, {
        headers: authHeaders
      });
      if (!res.ok) throw new Error("Failed to fetch chat session");
      const data = await res.json();
      const chatMessages = (data.messages || [])
        .filter((msg) => msg.message_type === "user" || msg.message_type === "assistant")
        .map((msg) => ({
          text: msg.message,
          sender: msg.message_type === "user" ? "user" : "bot",
          time: new Date(msg.time_sent).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }));
      setMessages(chatMessages.length > 0 ? chatMessages : [{
        text: "No conversation yet.",
        sender: "bot",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
      setChatSessionId(id);
    } catch (err) {
      setMessages([{ text: "Failed to load conversation.", sender: "bot", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    }
  };

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);

  const handleDeleteChat = (id) => {
    setChatToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteChat = async () => {
    if (!chatToDelete) return;
    try {
      const authHeaders = getAuthHeaders();

      const res = await fetch(`http://localhost:3001/api/private/deleteChatSession/${chatToDelete}`, { 
        method: "DELETE",
        headers: authHeaders
      });
      if (!res.ok) throw new Error("Failed to delete chat session");
      setChats((prev) => prev.filter((c) => c.id !== chatToDelete));
      if (activeChat === chatToDelete) {
        setActiveChat(null);
        setMessages([
          {
            text: "Hello! I'm VirtualAssist, your AI assistant. How can I help you today?",
            sender: "bot",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        setChatSessionId(null);
      }
      toast({ title: "Chat deleted", description: "The chat session was deleted successfully." });
    } catch (err) {
      toast({ title: "Delete failed", description: err.message || "Could not delete chat." });
    } finally {
      setDeleteDialogOpen(false);
      setChatToDelete(null);
    }
  };

  return (
    <div className="virtualassist-bg">
      <div className="virtualassist-header">
        <TextType
          text={["VirtualAssist", "I'm here to help!!"]}
          typingSpeed={75}
          pauseDuration={1500}
          showCursor={true}
          cursorCharacter="_"
          className="virtualassist-title"
        />
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            className="virtualassist-newchat-btn"
            onClick={handleNewChat}
            aria-label="Start new chat"
          >
            New Chat
          </button>
          <button
            className="virtualassist-history-btn"
            onClick={handleShowHistory}
            aria-label="Show chat history"
            disabled={showHistory}
          >
            <FaHistory size={22} />
          </button>
        </div>
      </div>

      <div className={`virtualassist-main${showHistory ? " virtualassist-blur" : ""}`}>
        <div className="virtualassist-messages" aria-live="polite">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`virtualassist-msg-row ${
                msg.sender === "user" ? "virtualassist-msg-user" : "virtualassist-msg-bot"
              }`}
            >
              <span className={`virtualassist-${msg.sender}-icon`}>
                {msg.sender === "bot" ? <FaRobot /> : <FaUserCircle />}
              </span>
              <div
                className={`virtualassist-msg-bubble${
                  msg.sender === "user" ? " virtualassist-msg-bubble-user" : ""
                }`}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      return inline ? (
                        <code {...props} className={className}>
                          {children}
                        </code>
                      ) : (
                        <pre {...props} className={className}>
                          <code>{children}</code>
                        </pre>
                      );
                    },
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
                {msg.sender === "bot" && (
                  <div className="virtualassist-msg-actions">
                    <button
                      className={`virtualassist-tts-btn ${
                        isSpeaking && currentSpeechIndex === idx ? 'speaking' : ''
                      }`}
                      onClick={() => 
                        isSpeaking && currentSpeechIndex === idx 
                          ? stopSpeech() 
                          : speakText(msg.text, idx)
                      }
                      aria-label={
                        isSpeaking && currentSpeechIndex === idx 
                          ? "Stop reading message" 
                          : "Read message aloud"
                      }
                      title={
                        isSpeaking && currentSpeechIndex === idx 
                          ? "Stop reading" 
                          : "Read aloud"
                      }
                    >
                      {isSpeaking && currentSpeechIndex === idx ? (
                        <FaStop />
                      ) : (
                        <FaVolumeUp />
                      )}
                    </button>
                  </div>
                )}
                <div className="virtualassist-msg-time">{msg.time}</div>
              </div>
            </div>
          ))}

          {isTyping && waitingForBot && (
            <div className="virtualassist-msg-row virtualassist-msg-bot">
              <span className="virtualassist-bot-icon">
                <FaRobot />
              </span>
              <div className="virtualassist-msg-bubble">
                <VirtualAssistWaiting />
              </div>
            </div>
          )}

          {isTyping && displayedBotMsg && !waitingForBot && (
            <div className="virtualassist-msg-row virtualassist-msg-bot">
              <span className="virtualassist-bot-icon">
                <FaRobot />
              </span>
              <div className="virtualassist-msg-bubble">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      return inline ? (
                        <code {...props} className={className}>
                          {children}
                        </code>
                      ) : (
                        <pre {...props} className={className}>
                          <code>{children}</code>
                        </pre>
                      );
                    },
                  }}
                >
                  {displayedBotMsg}
                </ReactMarkdown>
                {displayedBotMsg && (
                  <div className="virtualassist-msg-actions">
                    <button
                      className={`virtualassist-tts-btn ${
                        isSpeaking && currentSpeechIndex === 'typing' ? 'speaking' : ''
                      }`}
                      onClick={() => 
                        isSpeaking && currentSpeechIndex === 'typing' 
                          ? stopSpeech() 
                          : speakText(displayedBotMsg, 'typing')
                      }
                      aria-label={
                        isSpeaking && currentSpeechIndex === 'typing' 
                          ? "Stop reading message" 
                          : "Read message aloud"
                      }
                      title={
                        isSpeaking && currentSpeechIndex === 'typing' 
                          ? "Stop reading" 
                          : "Read aloud"
                      }
                    >
                      {isSpeaking && currentSpeechIndex === 'typing' ? (
                        <FaStop />
                      ) : (
                        <FaVolumeUp />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Listening Status Indicator */}
        {isListening && (
          <div className="virtualassist-listening-indicator">
            <div className="listening-animation">
              <span className="listening-dot"></span>
              <span className="listening-dot"></span>
              <span className="listening-dot"></span>
            </div>
            <span className="listening-text">Listening... Speak now</span>
          </div>
        )}

        <form className="virtualassist-input-row" onSubmit={handleSend}>
          <div className="virtualassist-input-container">
            <input
              ref={userInputRef}
              className="virtualassist-input"
              type="text"
              placeholder={isRecognitionSupported ? "Type your message or click the microphone to speak..." : "Type your message here..."}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onBlur={hideSuggestions}
              onFocus={() => {
                if (input.trim().length > 0 && filteredSuggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              disabled={waitingForBot || isListening}
              aria-label="Chat input"
              autoFocus
              autoComplete="off"
            />
            
            {/* Auto-suggest Dropdown */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div ref={suggestionsRef} className="virtualassist-suggestions-dropdown">
                {filteredSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`virtualassist-suggestion-item ${
                      index === selectedSuggestionIndex ? 'selected' : ''
                    }`}
                    onMouseDown={(e) => e.preventDefault()} // Prevent blur
                    onClick={() => selectSuggestion(suggestion)}
                    onMouseEnter={() => setSelectedSuggestionIndex(index)}
                  >
                    <span className="suggestion-icon">💡</span>
                    <span className="suggestion-text">{suggestion}</span>
                  </div>
                ))}
                <div className="suggestion-footer">
                  <span>Press ↑↓ to navigate, Enter to select, Esc to close</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Speech-to-Text Button */}
          {isRecognitionSupported && (
            <button
              type="button"
              className={`virtualassist-mic-btn ${isListening ? 'listening' : ''}`}
              onClick={isListening ? stopListening : startListening}
              disabled={waitingForBot}
              aria-label={isListening ? "Stop listening" : "Start voice input"}
              title={isListening ? "Stop listening" : "Click to speak"}
            >
              {isListening ? <FaMicrophoneSlash /> : <FaMicrophone />}
            </button>
          )}
          
          {/* Clear Transcript Button (shown when there's transcribed text) */}
          {transcript && !isListening && (
            <button
              type="button"
              className="virtualassist-clear-btn"
              onClick={clearTranscript}
              disabled={waitingForBot}
              aria-label="Clear transcribed text"
              title="Clear transcribed text"
            >
              ✕
            </button>
          )}
          
          <button className="virtualassist-send-btn" type="submit" disabled={waitingForBot || isListening} aria-label="Send message">
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="feather feather-send"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>

      <ChatHistoryPopup
        isOpen={showHistory}
        chats={chats}
        activeChat={activeChat}
        onSelectChat={(id) => { handleSelectChat(id); setShowHistory(false); }}
        onDeleteChat={handleDeleteChat}
        onClose={() => setShowHistory(false)}
      />

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Chat?"
        description="Are you sure you want to delete this chat session? This action cannot be undone."
        onConfirm={confirmDeleteChat}
        onCancel={() => { setDeleteDialogOpen(false); setChatToDelete(null); }}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default Home;
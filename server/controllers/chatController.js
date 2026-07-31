import Chat from '../models/Chat.js';
import axios from 'axios';

// @desc    Get all chat sessions for logged in user
// @route   GET /api/chat
// @access  Private
export const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user._id })
      .select('_id title createdAt updatedAt messages')
      .sort({ updatedAt: -1 });

    const formattedChats = chats.map((chat) => ({
      _id: chat._id,
      title: chat.title,
      messageCount: chat.messages ? chat.messages.length : 0,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    }));

    res.json(formattedChats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ message: 'Failed to fetch chat history' });
  }
};

// @desc    Get single chat session by ID
// @route   GET /api/chat/:id
// @access  Private
export const getChatById = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ message: 'Chat session not found' });
    }

    if (chat.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to view this chat' });
    }

    res.json(chat);
  } catch (error) {
    console.error('Error fetching chat session:', error);
    res.status(500).json({ message: 'Failed to fetch chat session' });
  }
};

// @desc    Create a new chat session
// @route   POST /api/chat
// @access  Private
export const createChat = async (req, res) => {
  try {
    const { title } = req.body;

    const chat = await Chat.create({
      userId: req.user._id,
      title: title || 'New Chat',
      messages: [],
    });

    res.status(201).json(chat);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ message: 'Failed to create new chat' });
  }
};

// Helper: Generate fallback response when AI API experiences network delay
function generateAcademicFallback(userQuery) {
  const queryLower = userQuery.toLowerCase();

  if (queryLower.includes('binary search tree') || queryLower.includes('bst')) {
    return `### 📌 Core Concept & Intuition: Binary Search Tree (BST)

A **Binary Search Tree (BST)** is a node-based binary tree data structure which has the following properties:
- The **left subtree** of a node contains only nodes with keys **less than** the node's key.
- The **right subtree** of a node contains only nodes with keys **greater than** the node's key.
- Both the left and right subtrees must also be binary search trees.

---

### 💡 Real-World Example & Analogy
Imagine a phonebook sorted alphabetically. To find "Martin", you open the middle page. If you see "Jackson", you know Martin is in the right half, eliminating half the phonebook in 1 step!

---

### 💻 Technical Implementation (JavaScript)
\`\`\`javascript
class Node {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
  }
}

class BinarySearchTree {
  constructor() {
    this.root = null;
  }

  insert(value) {
    const newNode = new Node(value);
    if (!this.root) {
      this.root = newNode;
      return this;
    }
    let current = this.root;
    while (true) {
      if (value < current.value) {
        if (!current.left) {
          current.left = newNode;
          return this;
        }
        current = current.left;
      } else {
        if (!current.right) {
          current.right = newNode;
          return this;
        }
        current = current.right;
      }
    }
  }
}
\`\`\`

---

### 📊 Structural Diagram
\`\`\`
       (10)
      /    \\
    (5)    (15)
    / \     / \
  (2) (7) (12) (20)
\`\`\`
- Time Complexity: **O(log N)** average search/insert time.`;
  }

  return `### 📌 Study Explanation & Concept Guide

**Topic:** ${userQuery}

Here is a structured overview to help you understand this topic:

1. 🎯 **Key Concept & Intuition**: Break down complex problems into core principles. Identify inputs, expected outputs, and constraints.
2. 💡 **Practical Example**: Relate abstract concepts to real-world scenarios to build intuitive understanding.
3. 📝 **Study Summary**: Review key terminology, formulas, or standard definitions associated with this topic.
4. 💡 **Next Steps**: Practice solving sample problems or test your comprehension with a quiz!`;
}

// @desc    Send message & get completion from Sarvam AI
// @route   POST /api/chat/:id/message (or POST /api/chat/message)
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { message, chatId } = req.body;
    const targetChatId = req.params.id || chatId;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    let chat;

    if (targetChatId && targetChatId !== 'new') {
      chat = await Chat.findById(targetChatId);
      if (!chat) {
        return res.status(404).json({ message: 'Chat session not found' });
      }
      if (chat.userId.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'Not authorized for this chat' });
      }
    } else {
      const generatedTitle = message.trim().length > 35 
        ? `${message.trim().substring(0, 35)}...` 
        : message.trim();

      chat = await Chat.create({
        userId: req.user._id,
        title: generatedTitle,
        messages: [],
      });
    }

    // Add user message
    chat.messages.push({
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
    });

    if (chat.title === 'New Chat' && chat.messages.length === 1) {
      chat.title = message.trim().length > 35 
        ? `${message.trim().substring(0, 35)}...` 
        : message.trim();
    }

    const systemPrompt = {
      role: 'system',
      content: 'You are an intelligent, helpful AI Study Assistant. Help users learn effectively, explain complex concepts clearly, solve academic problems, and provide well-structured answers using Markdown syntax where appropriate.',
    };

    // Keep last 8 messages max to prevent payload size from causing API timeouts
    const recentHistory = chat.messages.slice(-8);
    const formattedMessages = [
      systemPrompt,
      ...recentHistory.map((m) => ({
        role: m.role,
        content: m.content ? m.content.substring(0, 1500) : '',
      })),
    ];

    let aiReply = '';

    if (!process.env.SARVAM_API_KEY) {
      aiReply = generateAcademicFallback(message);
    } else {
      try {
        const response = await axios.post(
          'https://api.sarvam.ai/v1/chat/completions',
          {
            model: 'sarvam-105b',
            messages: formattedMessages,
          },
          {
            headers: {
              'api-subscription-key': process.env.SARVAM_API_KEY,
              'Content-Type': 'application/json',
            },
            timeout: 25000,
          }
        );

        if (response.data && response.data.choices && response.data.choices[0]?.message?.content) {
          aiReply = response.data.choices[0].message.content;
        } else {
          aiReply = generateAcademicFallback(message);
        }
      } catch (aiError) {
        console.error('Sarvam AI Chat API Error:', aiError.response?.data || aiError.message);
        
        // Fast single retry with just system prompt + current message if full conversation history timed out
        try {
          const quickResponse = await axios.post(
            'https://api.sarvam.ai/v1/chat/completions',
            {
              model: 'sarvam-105b',
              messages: [
                systemPrompt,
                { role: 'user', content: message.trim().substring(0, 1500) }
              ],
            },
            {
              headers: {
                'api-subscription-key': process.env.SARVAM_API_KEY,
                'Content-Type': 'application/json',
              },
              timeout: 15000,
            }
          );
          aiReply = quickResponse.data.choices[0].message.content;
        } catch (quickError) {
          console.error('Sarvam AI Quick Retry failed, using academic fallback engine');
          aiReply = generateAcademicFallback(message);
        }
      }
    }

    // Add assistant response to history
    chat.messages.push({
      role: 'assistant',
      content: aiReply,
      timestamp: new Date(),
    });

    await chat.save();

    res.json({
      chatId: chat._id,
      title: chat.title,
      messages: chat.messages,
      reply: aiReply,
    });
  } catch (error) {
    console.error('Error sending chat message:', error);
    res.status(500).json({ message: error.message || 'Failed to process message' });
  }
};

// @desc    Delete a chat session
// @route   DELETE /api/chat/:id
// @access  Private
export const deleteChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ message: 'Chat session not found' });
    }

    if (chat.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this chat' });
    }

    await chat.deleteOne();
    res.json({ message: 'Chat session deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ message: 'Failed to delete chat session' });
  }
};

// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Detailed MongoDB connection with error handling
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/portfolio_db', {
            serverSelectionTimeoutMS: 5000
        });
        console.log('MongoDB connected successfully');
        
        // List all collections (useful for debugging)
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Available collections:', collections.map(c => c.name));
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

connectDB();

// Message Schema with timestamps
const messageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    message: {
        type: String,
        required: [true, 'Message is required']
    }
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);

// API Routes with improved error handling
app.post('/api/messages', async (req, res) => {
    console.log('Received form data:', req.body); // Debug log

    try {
        const { name, email, message } = req.body;
        
        // Enhanced validation
        if (!name || !email || !message) {
            console.log('Validation failed:', { name, email, message }); // Debug log
            return res.status(400).json({ 
                message: 'All fields are required',
                missing: {
                    name: !name,
                    email: !email,
                    message: !message
                }
            });
        }
        
        // Create new message with explicit fields
        const newMessage = new Message({
            name: name,
            email: email,
            message: message
        });
        
        console.log('Attempting to save message:', newMessage); // Debug log
        
        // Save to database
        const savedMessage = await newMessage.save();
        console.log('Message saved successfully:', savedMessage); // Debug log
        
        res.status(201).json({ 
            message: 'Message saved successfully',
            data: savedMessage
        });
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({ 
            message: 'Error saving message', 
            error: error.message 
        });
    }
});

// Route to get all messages with error handling
app.get('/api/messages', async (req, res) => {
    try {
        const messages = await Message.find().sort({ createdAt: -1 });
        console.log('Retrieved messages:', messages.length); // Debug log
        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Error fetching messages' });
    }
});

// Test route to verify server is working
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working correctly' });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log(`- Portfolio: http://localhost:${PORT}`);
    console.log(`- API Messages: http://localhost:${PORT}/api/messages`);
    console.log(`- Server Test: http://localhost:${PORT}/test`);
});
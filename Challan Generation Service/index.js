const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Initialize Express App
const app = express();
app.use(bodyParser.json());

// MongoDB Connection
const mongoURI = 'mongodb://localhost:27017/challanDB';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB for Challan Service'))
    .catch(err => console.error('MongoDB connection error:', err));

// Define Schema and Model
const challanSchema = new mongoose.Schema({
    challanId: { type: String, required: true, unique: true },
    vehicleId: { type: String, required: true },
    violationType: { type: String, required: true },
    amount: { type: Number, required: true },
    issuedAt: { type: Date, default: Date.now }
});

const Challan = mongoose.model('Challan', challanSchema);

// API Endpoints

// Generate a new challan
app.post('/api/challans', async (req, res) => {
    const { vehicleId, violationType, amount } = req.body;

    if (!vehicleId || !violationType || amount === undefined) {
        return res.status(400).json({ message: 'Invalid data provided' });
    }

    try {
        const newChallan = new Challan({
            challanId: uuidv4(),
            vehicleId,
            violationType,
            amount
        });
        await newChallan.save();
        res.status(201).json({ message: 'Challan generated successfully', challan: newChallan });
    } catch (err) {
        res.status(500).json({ message: 'Error generating challan', error: err });
    }
});

// Get all challans
app.get('/api/challans', async (req, res) => {
    try {
        const challans = await Challan.find();
        res.json(challans);
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving challans', error: err });
    }
});

// Start the server
const PORT = 3002; // Different port for this service
app.listen(PORT, () => {
    console.log(`Challan Generation Service running on port ${PORT}`);
});

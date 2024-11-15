const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// Initialize Express App
const app = express();
app.use(bodyParser.json());

// MongoDB Connection
const mongoURI = 'mongodb://localhost:27017/violationDetectionDB';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Define Schemas and Models
const vehicleSchema = new mongoose.Schema({
    vehicleId: { type: String, required: true, unique: true },
    parkedAt: { type: Date, required: true },
    ticketExpired: { type: Boolean, required: true }
});

const violationSchema = new mongoose.Schema({
    vehicleId: { type: String, required: true },
    violationDate: { type: Date, required: true },
    reason: { type: String, required: true }
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
const Violation = mongoose.model('Violation', violationSchema);

// Helper function to detect violations
async function detectViolations() {
    const vehicles = await Vehicle.find({ ticketExpired: true });
    const now = new Date();

    for (const vehicle of vehicles) {
        const alreadyReported = await Violation.exists({ vehicleId: vehicle.vehicleId });
        if (!alreadyReported) {
            const newViolation = new Violation({
                vehicleId: vehicle.vehicleId,
                violationDate: now,
                reason: 'Ticket expired'
            });
            await newViolation.save();
        }
    }
}

// API Endpoints

// Get all violations
app.get('/api/violations', async (req, res) => {
    try {
        await detectViolations(); // Automatically update violations based on current data
        const violations = await Violation.find();
        res.json(violations);
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving violations', error: err });
    }
});

// Report a new violation (manually)
app.post('/api/violations', async (req, res) => {
    const { vehicleId, reason } = req.body;

    if (!vehicleId || !reason) {
        return res.status(400).json({ message: 'Invalid data provided' });
    }

    try {
        const newViolation = new Violation({
            vehicleId,
            violationDate: new Date(),
            reason
        });
        await newViolation.save();
        res.status(201).json({ message: 'Violation reported successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error reporting violation', error: err });
    }
});

// Add or update vehicle data
app.post('/api/vehicles', async (req, res) => {
    const { vehicleId, parkedAt, ticketExpired } = req.body;

    if (!vehicleId || parkedAt === undefined || ticketExpired === undefined) {
        return res.status(400).json({ message: 'Invalid data provided' });
    }

    try {
        const existingVehicle = await Vehicle.findOne({ vehicleId });
        if (existingVehicle) {
            existingVehicle.parkedAt = parkedAt;
            existingVehicle.ticketExpired = ticketExpired;
            await existingVehicle.save();
            res.json({ message: 'Vehicle data updated', vehicle: existingVehicle });
        } else {
            const newVehicle = new Vehicle({ vehicleId, parkedAt, ticketExpired });
            await newVehicle.save();
            res.status(201).json({ message: 'Vehicle data added', vehicle: newVehicle });
        }
    } catch (err) {
        res.status(500).json({ message: 'Error adding/updating vehicle', error: err });
    }
});

// Get all vehicle data
app.get('/api/vehicles', async (req, res) => {
    try {
        const vehicles = await Vehicle.find();
        res.json(vehicles);
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving vehicles', error: err });
    }
});

// Start the server
const PORT = 3001; // Different port to avoid conflicts with other services
app.listen(PORT, () => {
    console.log(`Violation Detection Service running on port ${PORT}`);
});

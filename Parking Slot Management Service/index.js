// parkingSlotService 

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// Initialize Express App
const app = express();
app.use(bodyParser.json());

// MongoDB Connection
mongoose
    .connect('mongodb://127.0.0.1:27017/parkingDB', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Error connecting to MongoDB:', err));

// MongoDB Schema and Model
const parkingSlotSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    status: { type: String, required: true, enum: ['available', 'occupied'] }
});
const ParkingSlot = mongoose.model('ParkingSlot', parkingSlotSchema);

// In-memory data structure for parking slots
let parkingSlots = [];

// Helper function to sync data between MongoDB and in-memory array
async function syncParkingSlots() {
    try {
        const dbSlots = await ParkingSlot.find({});
        parkingSlots = dbSlots.map(slot => ({ id: slot.id, status: slot.status }));
    } catch (err) {
        console.error('Error syncing parking slots:', err);
    }
}

// Sync parking slots on startup
syncParkingSlots();

// API Endpoints

// Get all parking slots
app.get('/api/parking-slots', (req, res) => {
    res.json(parkingSlots);
});

// Get a specific parking slot by ID
app.get('/api/parking-slots/:id', (req, res) => {
    const slotId = parseInt(req.params.id);
    const slot = parkingSlots.find(s => s.id === slotId);

    if (!slot) {
        return res.status(404).json({ message: 'Parking slot not found' });
    }

    res.json(slot);
});

// Add a new parking slot
app.post('/api/parking-slots', async (req, res) => {
    const { id, status } = req.body;

    if (!id || !['available', 'occupied'].includes(status)) {
        return res.status(400).json({ message: 'Invalid data provided' });
    }

    if (parkingSlots.find(s => s.id === id)) {
        return res.status(409).json({ message: 'Parking slot ID already exists' });
    }

    const newSlot = { id, status };
    parkingSlots.push(newSlot);

    try {
        const dbSlot = new ParkingSlot(newSlot);
        await dbSlot.save();
        res.status(201).json({ message: 'Parking slot added', slot: newSlot });
    } catch (err) {
        res.status(500).json({ message: 'Error saving to database', error: err.message });
    }
});

// Update the status of a parking slot
app.put('/api/parking-slots/:id', async (req, res) => {
    const slotId = parseInt(req.params.id);
    const { status } = req.body;

    if (!['available', 'occupied'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
    }

    const slotIndex = parkingSlots.findIndex(s => s.id === slotId);
    if (slotIndex === -1) {
        return res.status(404).json({ message: 'Parking slot not found' });
    }

    parkingSlots[slotIndex].status = status;

    try {
        await ParkingSlot.findOneAndUpdate({ id: slotId }, { status });
        res.json({ message: 'Parking slot updated', slot: parkingSlots[slotIndex] });
    } catch (err) {
        res.status(500).json({ message: 'Error updating database', error: err.message });
    }
});

// Delete a parking slot
app.delete('/api/parking-slots/:id', async (req, res) => {
    const slotId = parseInt(req.params.id);

    const slotIndex = parkingSlots.findIndex(s => s.id === slotId);
    if (slotIndex === -1) {
        return res.status(404).json({ message: 'Parking slot not found' });
    }

    const deletedSlot = parkingSlots.splice(slotIndex, 1)[0];

    try {
        await ParkingSlot.findOneAndDelete({ id: slotId });
        res.json({ message: 'Parking slot deleted', slot: deletedSlot });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting from database', error: err.message });
    }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Parking Slot Management Service running on port ${PORT}`);
});

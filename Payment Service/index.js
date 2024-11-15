const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// Initialize Express App
const app = express();
app.use(bodyParser.json());

// MongoDB Connection
const mongoURI = 'mongodb://localhost:27017/paymentDB';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB for Payment Service'))
    .catch(err => console.error('MongoDB connection error:', err));

// Define Schema and Model
const paymentSchema = new mongoose.Schema({
    challanId: { type: String, required: true },
    vehicleId: { type: String, required: true },
    amount: { type: Number, required: true },
    paid: { type: Boolean, default: false },
    paidAt: { type: Date }
});

const Payment = mongoose.model('Payment', paymentSchema);

// API Endpoints

// Make a payment
app.post('/api/payment', async (req, res) => {
    const { challanId, vehicleId, amount } = req.body;

    if (!challanId || !vehicleId || amount === undefined) {
        return res.status(400).json({ message: 'Invalid data provided' });
    }

    try {
        const existingPayment = await Payment.findOne({ challanId });
        if (existingPayment && existingPayment.paid) {
            return res.status(400).json({ message: 'Payment already completed' });
        }

        const payment = existingPayment || new Payment({ challanId, vehicleId, amount });
        payment.paid = true;
        payment.paidAt = new Date();
        await payment.save();

        res.status(200).json({ message: 'Payment successful', payment });
    } catch (err) {
        res.status(500).json({ message: 'Error processing payment', error: err });
    }
});

// Get payment status
app.get('/api/payment/status', async (req, res) => {
    const { challanId } = req.query;

    if (!challanId) {
        return res.status(400).json({ message: 'Challan ID required' });
    }

    try {
        const payment = await Payment.findOne({ challanId });
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        res.json(payment);
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving payment status', error: err });
    }
});

// Start the server
const PORT = 3003; // Different port for this service
app.listen(PORT, () => {
    console.log(`Payment Service running on port ${PORT}`);
});

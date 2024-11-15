const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Initialize Express App
const app = express();
app.use(bodyParser.json());

// MongoDB Connection
const mongoURI = 'mongodb://localhost:27017/reportingDB';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB for Reporting Service'))
    .catch(err => console.error('MongoDB connection error:', err));

// Schema and Models
const challanSchema = new mongoose.Schema({
    challanId: { type: String, required: true, unique: true },
    vehicleId: { type: String, required: true },
    violationType: { type: String, required: true },
    amount: { type: Number, required: true },
    issuedAt: { type: Date, default: Date.now }
});

const paymentSchema = new mongoose.Schema({
    challanId: { type: String, required: true },
    vehicleId: { type: String, required: true },
    amount: { type: Number, required: true },
    paid: { type: Boolean, default: false },
    paidAt: { type: Date }
});

const Challan = mongoose.model('Challan', challanSchema);
const Payment = mongoose.model('Payment', paymentSchema);

// API Endpoints

// Get summary of all violations (challans)
app.get('/api/violations/summary', async (req, res) => {
    try {
        const violations = await Challan.find();
        const totalViolations = violations.length;
        const totalViolationAmount = violations.reduce((sum, v) => sum + v.amount, 0);

        res.json({
            totalViolations,
            totalViolationAmount,
            violations
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching violations summary', error: err });
    }
});

// Get summary of all payments
app.get('/api/payments/summary', async (req, res) => {
    try {
        const payments = await Payment.find();
        const totalPayments = payments.length;
        const totalPaidAmount = payments.reduce((sum, p) => (p.paid ? sum + p.amount : sum), 0);
        const totalUnpaidAmount = payments.reduce((sum, p) => (!p.paid ? sum + p.amount : sum), 0);

        res.json({
            totalPayments,
            totalPaidAmount,
            totalUnpaidAmount,
            payments
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching payments summary', error: err });
    }
});

// Start the server
const PORT = 3004; // Different port for this service
app.listen(PORT, () => {
    console.log(`Reporting and Analytics Service running on port ${PORT}`);
});

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const brandRoutes = require('./routes/brand.routes');
const brandController = require('./controllers/brand.controller');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', brandRoutes);

// Server-Sent Events endpoint
app.get('/api/status', brandController.statusUpdates);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 
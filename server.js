require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const cron = require('node-cron'); 

const { processMonthlyLeave } = require('./controllers/leaveController');
const { processMonthlySundays } = require('./controllers/leaveController');

const globalRoutes = require('./routes/globalRoutes');

const app = express();
const server = http.createServer(app);

const documentationPath = path.join(__dirname, 'public/documentation');
app.use(express.static(documentationPath));

app.use(cors({
    origin: ['http://localhost:3000', 'https://your-production-frontend.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-forwarded-for'],
    credentials: true
}));

app.use(express.json());

app.use('/api/v1/', globalRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(documentationPath, 'index.html'));
});

mongoose.connect(process.env.MONGODB)
    .then(() => console.log('Successfully Connected To DataBase ...'))
    .catch((error) => {
        console.error('DataBase Connection Failed ...', error.message);
        process.exit(1);
    });

app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message
    });
});

cron.schedule('0 0 1 * *', () => {
    console.log('Running The Monthly Leave Update Process ...');
    processMonthlyLeave();
    processMonthlySundays();
});


server.listen(process.env.PORT || 3000, () => {
    console.log(`App Is Running On Port : ${process.env.PORT || 3000}`);
});
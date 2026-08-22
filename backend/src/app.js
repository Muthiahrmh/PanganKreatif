const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const salesRoutes = require('./routes/salesRoutes');
const forecastRoutes = require('./routes/forecastRoutes');
const procurementRoutes = require('./routes/procurementRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const adminRoutes = require('./routes/adminRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const onboardingRoutes = require('./routes/onboardingRoutes');
const fileRoutes = require('./routes/fileRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'pangankreatif-backend' }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales-records', salesRoutes);
app.use('/api/forecasts', forecastRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/supplier', supplierRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/files', fileRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
import express from 'express';
import dotenv from 'dotenv';
import fileRoutes from './routes/files.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/', fileRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

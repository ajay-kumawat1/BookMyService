import express from 'express';
import Auth from './Auth/_route.js';
const app = express();
app.use(express.json());

app.use('/auth', Auth);

export default app;

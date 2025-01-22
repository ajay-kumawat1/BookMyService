import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env' });

const cors = {
    origin: false,
    credentials: true,
};

const config = {
    server: {
        cors,
        port: process.env.PORT,
    },
};

export default config;

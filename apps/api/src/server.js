import './config/env.js';

import { validateEnv } from './config/env.js';
import connectDb from './config/database.js';
import app from './app.js';

const startServer = async () => {
    try {
        validateEnv();
        await connectDb();

        const PORT = process.env.NODE_PORT || 5000;
        const server = app.listen(PORT, () => {
            console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
        });

        const shutdown = (signal) => {
            console.log(`${signal} received, shutting down...`);
            server.close(() => {
                console.log("HTTP server closed");
                process.exit(0);
            });
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();
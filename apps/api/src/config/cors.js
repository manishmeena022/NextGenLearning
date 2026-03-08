export const corsOptions = {
    origin: [process.env.CLIENT_URL, process.env.ADMIN_URL],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
};
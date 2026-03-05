export const notFound = (req, res) => {
    res.status(404).json({ message: "Route not found" });
};

export const errorHandler = (err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(err.status || 500).json({
        message: process.env.NODE_ENV === 'production'
            ? "Internal server error"
            : err.message
    });
};
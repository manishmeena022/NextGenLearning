const validate = (schema) => (req, res, next) => {
    try {
        req.body = schema.parse(req.body);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                message: "Validation error",
                errors: error.errors.map(e => ({
                    field: e.path.join("."),
                    message: e.message
                }))
            })
        }
        next(error);
    }
}

export default validate;

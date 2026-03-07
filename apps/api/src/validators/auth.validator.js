import { number, z } from 'zod';

const registerSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters long')
        .max(50, 'Name must be less than 50 characters long')
        .trim(),

    email: z.string()
        .email('Invalid email address')
        .toLowerCase(),

    password: z.string()
        .min(8, 'Password must be at least 8 characters long')
        .max(100, 'Password must be less than 100 characters long')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[@$!%*?&]/, 'Password must contain at least one special character')
});

const loginSchema = z.object({
    email: z.string()
        .email('Invalid email address')
        .toLowerCase(),
    password: z.string()
        .min(1, 'Password is required')
})

const onBoardingSchema = z.object({
    goal: z.string()
        .min(3, 'Goal must be at least 3 characters')
        .max(200, 'Goal must be less than 200 characters')
        .trim(),
    level: z.enum(['beginner', 'intermediate', 'advanced'], {
        errorMap: () => ({
            message: 'Level must be beginner, intermediate, or advanced'
        })
    }),
    subjects: z.array(
        z.string().min(1).max(50).trim()
    )
        .min(1, 'Select at least one subject')
        .max(10, 'You can select at most 10 subjects'),

    dailyStudyTime: z.coerce
        .number()
        .refine(val => [15, 30, 60, 90, 120].includes(val), {
            message: 'Daily study time must be 15, 30, 60, 90 or 120 minutes'
        }),
})



export { registerSchema, loginSchema, onBoardingSchema };
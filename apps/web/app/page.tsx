import { Button } from "@/components/ui/button";

export default function Home() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
            <div className="text-center">
                <h1>
                    Welcome to NextGenLearning! This is the home page. Please
                    login or register to access protected content.
                </h1>
                <Button className="mt-4" variant="outline" disabled>
                    Explore Courses (coming soon)
                </Button>
                <Button>
                    <a href="/register">Register</a>
                </Button>
                <Button>
                    <a href="/login">Login</a>
                </Button>
            </div>
        </div>
    );
}

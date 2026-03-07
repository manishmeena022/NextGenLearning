import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { LoginInput, RegisterInput } from "@/lib/validators";
import { toast } from "sonner";

export const useAuth = () => {
    const router = useRouter();
    const { setAccessToken, setUser, clearAuth } = useAuthStore();

    const register = async (data: RegisterInput) => {
        try {
            const res = await api.post("/auth/register", data);
            setAccessToken(res.data.accessToken);
            toast.success("Account created successfully");
            router.push("/profile");
        } catch (error: any) {
            const message =
                error?.response?.data?.message || "Registration failed";
            toast.error(message);
        }
    };

    const login = async (data: LoginInput) => {
        try {
            const res = await api.post("/auth/login", data);
            setAccessToken(res.data.accessToken);
            toast.success("Logged in successfully");
            router.push("/profile");
        } catch (error: any) {
            const message =
                error?.response?.data?.message || "Invalid email or password";
            toast.error(message);
        }
    };

    const logout = async () => {
        try {
            await api.post("/auth/logout");
        } catch {
            // silent
        } finally {
            clearAuth();
            toast.success("Logged out successfully");
            router.push("/login");
        }
    };

    const fetchUser = async () => {
        try {
            const res = await api.get("/auth/me");
            const user = res.data.data.user;
            setUser(user);

            if (!user.isOnboarded) {
                router.push("/onboarding");
            }
        } catch {
            clearAuth();
            // clearCookie("userRole");
        }
    };

    return { register, login, logout, fetchUser };
};

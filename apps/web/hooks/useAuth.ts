import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";
import { LoginInput, RegisterInput } from "@/lib/validators";
import { toast } from "sonner";

export const useAuth = () => {
    const router = useRouter();
    const { setAccessToken, setUser, clearAuth } = useAuthStore();

    const register = async (data: RegisterInput) => {
        const res = await api.post("/auth/register", data);
        setAccessToken(res.data.accessToken);
        router.push("/profile");
        toast.success("Account created successfully");
    };

    const login = async (data: LoginInput) => {
        const res = await api.post("/auth/login", data);
        setAccessToken(res.data.accessToken);
        router.push("/profile");
        toast.success("Logged in successfully");
    };

    const logout = async () => {
        await api.post("/auth/logout");
        clearAuth();
        router.push("/login");
        toast.success("Logged out successfully");
    };

    const fetchUser = async () => {
        const res = await api.get("/auth/me");
        setUser(res.data);
    };

    return { register, login, logout, fetchUser };
};

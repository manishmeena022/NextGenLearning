import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/profile"];
const authRoutes = ["/login", "/register"];

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const refreshToken = req.cookies.get("refreshToken")?.value;

    // Redirect unauthenticated users away from protected routes
    if (protectedRoutes.some((route) => pathname.startsWith(route))) {
        if (!refreshToken) {
            const url = req.nextUrl.clone();
            url.pathname = "/login";
            url.searchParams.set("redirect", pathname);
            return NextResponse.redirect(url);
        }
    }

    // Redirect authenticated users away from auth pages
    if (authRoutes.some((route) => pathname.startsWith(route))) {
        if (refreshToken) {
            return NextResponse.redirect(new URL("/profile", req.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/profile/:path*", "/login", "/register"],
};

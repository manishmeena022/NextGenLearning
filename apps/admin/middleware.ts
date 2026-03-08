import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Always allow the login page through
    if (pathname.startsWith("/login")) {
        return NextResponse.next();
    }

    // Check for the session cookie your backend sets
    // Open your backend login handler and find what it calls res.cookie("???")
    // Replace "token" below with that exact name
    const token = request.cookies.get("accessToken")?.value;

    if (!token) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    // Runs on every route except Next.js internals and static files
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

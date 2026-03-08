import "@/app/globals.css";
import { Providers } from "@/components/providers";
import { Outfit, JetBrains_Mono } from "next/font/google";

const outfit = Outfit({
    subsets: ["latin"],
    variable: "--font-sans",
});

const mono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
});

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${outfit.variable} ${mono.variable}`}>
            <body className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-1)]">
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}

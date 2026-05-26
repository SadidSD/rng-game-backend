"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function RedirectToLogin() {
    const router = useRouter();

    useEffect(() => {
        // Clear the token cookie client-side
        Cookies.remove("tcg-auth-token");
        // Redirect to login
        router.push("/login");
        router.refresh();
    }, [router]);

    return (
        <div className="flex h-[50vh] w-full items-center justify-center">
            <div className="text-center">
                <p className="text-muted-foreground animate-pulse">Session expired. Redirecting to login...</p>
            </div>
        </div>
    );
}

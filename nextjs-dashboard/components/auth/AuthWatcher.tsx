"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Cookies from "js-cookie";

export default function AuthWatcher() {
    const router = useRouter();

    useEffect(() => {
        // Set up global Axios interceptor
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                    // Token is invalid/expired. Clear it and redirect.
                    Cookies.remove("tcg-auth-token");
                    router.push("/login");
                    router.refresh();
                }
                return Promise.reject(error);
            }
        );

        return () => {
            // Clean up the interceptor on unmount
            axios.interceptors.response.eject(interceptor);
        };
    }, [router]);

    return null;
}

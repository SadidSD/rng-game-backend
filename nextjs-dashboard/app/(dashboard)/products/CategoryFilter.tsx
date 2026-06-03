"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition, useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
    id: string;
    name: string;
    slug: string;
}

export function CategoryFilter({ categories }: { categories: Category[] }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeftFade, setShowLeftFade] = useState(false);
    const [showRightFade, setShowRightFade] = useState(false);

    const handleSelect = (value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value && value !== "all") {
            params.set("tab", value);
        } else {
            params.delete("tab");
        }
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeftFade(scrollLeft > 5);
            setShowRightFade(scrollLeft < scrollWidth - clientWidth - 5);
        }
    };

    useEffect(() => {
        const el = scrollRef.current;
        if (el) {
            const timer = setTimeout(checkScroll, 100);
            window.addEventListener('resize', checkScroll);
            el.addEventListener('scroll', checkScroll);
            return () => {
                clearTimeout(timer);
                window.removeEventListener('resize', checkScroll);
                el.removeEventListener('scroll', checkScroll);
            };
        }
    }, [categories]);

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const scrollAmount = 300;
            scrollRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            });
        }
    };

    const currentValue = searchParams.get("tab") || "all";

    // Filter out duplicate "Singles" and "Sealed" categories if they exist in the DB
    const displayCategories = categories.filter(
        (cat) => cat.slug !== "singles" && cat.slug !== "sealed"
    );

    const getCategoryDotColor = (slug: string) => {
        const s = slug.toLowerCase();
        if (s === 'all') return 'bg-slate-400 border-slate-300';
        if (s === 'singles') return 'bg-teal-500 border-teal-400 dark:bg-teal-600';
        if (s === 'sealed') return 'bg-emerald-500 border-emerald-400 dark:bg-emerald-600';
        if (s.includes('pokemon')) return 'bg-yellow-400 border-yellow-300 dark:bg-yellow-500';
        if (s.includes('magic') || s.includes('mtg')) return 'bg-blue-500 border-blue-400 dark:bg-blue-600';
        if (s.includes('booster')) return 'bg-purple-500 border-purple-400 dark:bg-purple-600';
        if (s.includes('box')) return 'bg-indigo-500 border-indigo-400 dark:bg-indigo-600';
        if (s.includes('pack')) return 'bg-pink-500 border-pink-400 dark:bg-pink-600';
        if (s.includes('bundle')) return 'bg-orange-500 border-orange-400 dark:bg-orange-600';
        if (s.includes('deck')) return 'bg-red-500 border-red-400 dark:bg-red-600';
        if (s.includes('starter')) return 'bg-amber-500 border-amber-400 dark:bg-amber-600';
        if (s.includes('collector')) return 'bg-cyan-500 border-cyan-400 dark:bg-cyan-600';
        return 'bg-slate-400 border-slate-300 dark:bg-slate-500';
    };

    const renderPill = (label: string, value: string, slug: string) => {
        const isActive = currentValue === value;
        const dotColor = getCategoryDotColor(slug);
        return (
            <button
                key={value}
                onClick={() => handleSelect(value)}
                className={cn(
                    "px-4 py-1.5 text-xs font-semibold rounded-full border transition-all duration-200 ease-in-out whitespace-nowrap cursor-pointer flex items-center gap-1.5",
                    isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-sm hover:opacity-90 active:scale-95"
                        : "bg-background text-muted-foreground border-input hover:text-foreground hover:bg-accent/50 hover:border-accent-foreground/20 hover:scale-102 active:scale-95"
                )}
            >
                <span className={cn("h-1.5 w-1.5 rounded-full border transition-all", isActive ? "bg-primary-foreground border-primary-foreground" : dotColor)} />
                {label}
            </button>
        );
    };

    return (
        <div className="relative flex items-center w-full group/filter">
            {/* Left Fade Overlay & Button */}
            {showLeftFade && (
                <>
                    <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
                    <button
                        onClick={() => scroll("left")}
                        className="absolute left-0 top-1/2 -translate-y-1/2 bg-background/95 hover:bg-background border shadow-md rounded-full p-1.5 text-muted-foreground hover:text-foreground z-20 opacity-0 group-hover/filter:opacity-100 transition-opacity duration-200 cursor-pointer"
                        title="Scroll Left"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                </>
            )}

            {/* Scrollable Container */}
            <div
                ref={scrollRef}
                className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1.5 w-full scroll-smooth"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
                {renderPill("All Products", "all", "all")}
                {renderPill("Singles", "singles", "singles")}
                {renderPill("Sealed", "sealed", "sealed")}

                {displayCategories.map((cat) => renderPill(cat.name, cat.slug, cat.slug))}
            </div>

            {/* Right Fade Overlay & Button */}
            {showRightFade && (
                <>
                    <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
                    <button
                        onClick={() => scroll("right")}
                        className="absolute right-0 top-1/2 -translate-y-1/2 bg-background/95 hover:bg-background border shadow-md rounded-full p-1.5 text-muted-foreground hover:text-foreground z-20 opacity-0 group-hover/filter:opacity-100 transition-opacity duration-200 cursor-pointer"
                        title="Scroll Right"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </>
            )}
        </div>
    );
}

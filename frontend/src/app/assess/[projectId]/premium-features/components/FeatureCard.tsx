"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ReactNode, KeyboardEvent } from "react";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";

interface FeatureCardProps {
    icon: ReactNode;
    title: string;
    description: string;
    href: string;
    delay: number;
}

export function FeatureCard({
    icon,
    title,
    description,
    href,
    delay,
}: FeatureCardProps) {
    const router = useRouter();

    const handleClick = () => router.push(href);

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
        }
    };

    return (
        <motion.div
            role="button"
            tabIndex={0}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            aria-label={`Navigate to ${title}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="will-change-transform focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:focus:ring-offset-background rounded-3xl"
        >
            <Card className="cursor-pointer hover:shadow-2xl hover:border-primary transition-shadow h-full">
                <CardContent className="p-8">
                    <div className="rounded-2xl flex items-center justify-center mb-6 mx-auto relative">
                        {icon}
                    </div>
                    <CardTitle className="text-2xl mb-3 text-center">
                        {title}
                    </CardTitle>
                    <CardDescription className="text-base text-center">
                        {description}
                    </CardDescription>
                </CardContent>
            </Card>
        </motion.div>
    );
}

"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ReactNode, KeyboardEvent } from "react";

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
            className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl cursor-pointer hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-600 border border-gray-100 dark:border-gray-700 transition-shadow will-change-transform focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
            <div className="rounded-2xl flex items-center justify-center mb-6 mx-auto relative">
                {icon}
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3 text-center">
                {title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed text-center">
                {description}
            </p>
        </motion.div>
    );
}

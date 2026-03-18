"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiService } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { showToast } from "@/lib/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { IconUser, IconMail, IconLock, IconEye, IconEyeOff, IconLoader2, IconBriefcase, IconAlertTriangle } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { useNotificationStore } from "@/store/notificationStore";

function InviteAcceptContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const { login, isAuthenticated } = useAuth();
    const { removeInvitation } = useNotificationStore();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submittingAction, setSubmittingAction] = useState<"accept" | "decline" | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [inviteData, setInviteData] = useState<any>(null);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        password: "",
        confirmPassword: "",
    });

    const [loginData, setLoginData] = useState({
        password: "",
    });

    const [showMFA, setShowMFA] = useState(false);
    const [mfaCode, setMFACode] = useState("");
    const [loginCompleted, setLoginCompleted] = useState(false);

    useEffect(() => {
        if (!token) {
            setError("No invitation token provided.");
            setLoading(false);
            return;
        }

        const fetchInviteStr = async () => {
            try {
                const data = await apiService.getInvitationByToken(token);
                setInviteData(data);
            } catch (err: any) {
                setError(err.message || "Invalid or expired invitation token.");
            } finally {
                setLoading(false);
            }
        };

        fetchInviteStr();
    }, [token]);

    const handleSignupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const resp = await apiService.signupViaInvitation(token as string, {
                name: formData.name,
                password: formData.password,
            });
            // Signup success -> wait briefly, try login 
            await login(inviteData.email, formData.password);
            if (token) removeInvitation(token);

            showToast.success("Account created & invitation accepted!");
            router.push(inviteData?.project?.id ? `/assess/${inviteData.project.id}` : "/dashboard");
        } catch (err: any) {
            setError(err.message || "Failed to accept invitation");
            setSubmitting(false);
        }
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            // First login
            await login(inviteData.email, loginData.password, mfaCode);

            setLoginCompleted(true);
            // Wait a tiny bit for auth state to catch up if needed
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Then accept invite
            await apiService.acceptInvitation(token as string);
            if (token) removeInvitation(token);

            showToast.success("Invitation accepted!");
            router.push(inviteData?.project?.id ? `/assess/${inviteData.project.id}` : "/dashboard");
        } catch (err: any) {
            if (err.message === "MFA_REQUIRED") {
                setShowMFA(true);
                setSubmitting(false);
                return;
            }
            setError(err.message || "Login or acceptance failed");
            setSubmitting(false);
        }
    };

    const handleAcceptLoggedIn = async () => {
        setSubmittingAction("accept");
        setError(null);
        try {
            await apiService.acceptInvitation(token as string);
            if (token) removeInvitation(token);
            showToast.success("Invitation accepted!");
            router.push(inviteData?.project?.id ? `/assess/${inviteData.project.id}` : "/dashboard");
        } catch (err: any) {
            setError(err.message || "Failed to accept invitation");
            setSubmittingAction(null);
        }
    };

    const handleDecline = async () => {
        setSubmittingAction("decline");
        setError(null);
        try {
            await apiService.declineInvitation(token as string);
            if (token) removeInvitation(token);
            showToast.success("Invitation declined.");
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message || "Failed to decline invitation");
            setSubmittingAction(null);
        }
    };


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error && !inviteData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background px-4">
                <Card className="max-w-md w-full border-destructive/20 bg-destructive/5 text-center">
                    <CardContent className="pt-6">
                        <IconAlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Invalid Invitation</h2>
                        <p className="text-muted-foreground mb-6">{error}</p>
                        <Button onClick={() => router.push("/")} className="w-full">
                            Go to Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 via-white to-violet-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-8"
                >
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <IconBriefcase className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-3xl font-bold mb-2 text-foreground">
                        Project Invitation
                    </h2>
                    <p className="text-muted-foreground">
                        <span className="font-semibold text-foreground">{inviteData.inviter?.name || "Someone"}</span> has invited you to collaborate on <br />
                        <span className="font-bold text-primary">{inviteData.project?.name || "a project"}</span>
                    </p>
                    <div className="mt-4 inline-block px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
                        Role: {inviteData.role}
                    </div>
                </motion.div>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <Card className="glass-effect border-0 shadow-lg">
                        <CardContent className="pt-6">

                            {isAuthenticated ? (
                                <div className="text-center">
                                    <p className="mb-6 text-muted-foreground">You are already logged in. Click below to accept the invitation and join the project.</p>
                                    {error && (
                                        <div className="mb-4 text-destructive text-sm bg-destructive/10 p-3 rounded-md">
                                            {error}
                                        </div>
                                    )}
                                    <Button
                                        onClick={handleAcceptLoggedIn}
                                        disabled={submitting || !!submittingAction}
                                        className="w-full bg-primary hover:bg-primary/90 h-12 text-lg"
                                    >
                                        {submittingAction === "accept" ? <IconLoader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                                        Accept Invitation
                                    </Button>
                                    <Button
                                        onClick={handleDecline}
                                        disabled={submitting || !!submittingAction}
                                        variant="outline"
                                        className="w-full mt-3 h-12 text-lg border-destructive/20 text-destructive hover:bg-destructive/5"
                                    >
                                        {submittingAction === "decline" ? <IconLoader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                                        Decline Invitation
                                    </Button>
                                </div>
                            ) : inviteData.hasAccount ? (
                                // Login Form
                                <form className="space-y-4" onSubmit={handleLoginSubmit}>
                                    <div className="text-center mb-6">
                                        <p className="text-sm text-muted-foreground">Log in as <strong>{inviteData.email}</strong> to accept.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <div className="relative">
                                            <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                type="email"
                                                value={inviteData.email}
                                                disabled
                                                className="h-12 pl-10 bg-muted cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="loginPassword">Password</Label>
                                        <div className="relative">
                                            <IconLock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="loginPassword"
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                value={loginData.password}
                                                onChange={(e) => setLoginData({ password: e.target.value })}
                                                className="h-12 pl-10 pr-12"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                                onClick={(e) => { e.preventDefault(); setShowPassword(!showPassword); }}
                                            >
                                                {showPassword ? <IconEyeOff className="h-4 w-4 text-muted-foreground" /> : <IconEye className="h-4 w-4 text-muted-foreground" />}
                                            </Button>
                                        </div>
                                    </div>

                                    {showMFA && (
                                        <div className="space-y-2">
                                            <Label htmlFor="mfaCode">MFA Code</Label>
                                            <Input
                                                id="mfaCode"
                                                type="text"
                                                placeholder="123456"
                                                value={mfaCode}
                                                onChange={(e) => setMFACode(e.target.value)}
                                                className="h-12 text-center text-2xl tracking-[0.5em] font-mono"
                                                maxLength={6}
                                                required
                                            />
                                        </div>
                                    )}

                                    {error && (
                                        <div className="text-destructive text-sm text-center bg-destructive/10 p-3 rounded-md">
                                            {error}
                                        </div>
                                    )}

                                    <Button type="submit" disabled={submitting} className="w-full h-12 bg-primary">
                                        {submitting ? <IconLoader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                        Sign In & Accept
                                    </Button>
                                </form>
                            ) : (
                                // Signup Form
                                <form className="space-y-4" onSubmit={handleSignupSubmit}>
                                    <div className="text-center mb-6">
                                        <p className="text-sm text-muted-foreground">Create an account to join the project.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="signupName">Full Name</Label>
                                        <div className="relative">
                                            <IconUser className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="signupName"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="h-12 pl-10"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="signupEmail">Email</Label>
                                        <div className="relative">
                                            <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="signupEmail"
                                                type="email"
                                                value={inviteData.email}
                                                disabled
                                                className="h-12 pl-10 bg-muted cursor-not-allowed"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="signupPassword">Password</Label>
                                        <div className="relative">
                                            <IconLock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="signupPassword"
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="h-12 pl-10 pr-12"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                                onClick={(e) => { e.preventDefault(); setShowPassword(!showPassword); }}
                                            >
                                                {showPassword ? <IconEyeOff className="h-4 w-4 text-muted-foreground" /> : <IconEye className="h-4 w-4 text-muted-foreground" />}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                                        <div className="relative">
                                            <IconLock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="confirmPassword"
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                required
                                                value={formData.confirmPassword}
                                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                className="h-12 pl-10 pr-12"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                                onClick={(e) => { e.preventDefault(); setShowConfirmPassword(!showConfirmPassword); }}
                                            >
                                                {showConfirmPassword ? <IconEyeOff className="h-4 w-4 text-muted-foreground" /> : <IconEye className="h-4 w-4 text-muted-foreground" />}
                                            </Button>
                                        </div>
                                    </div>

                                    <PasswordStrengthIndicator password={formData.password} userInfo={{ email: inviteData.email, name: formData.name }} showDetails={true} />

                                    {error && (
                                        <div className="text-destructive text-sm text-center bg-destructive/10 p-3 rounded-md">
                                            {error}
                                        </div>
                                    )}

                                    <Button type="submit" disabled={submitting} className="w-full h-12 bg-primary mt-2">
                                        {submitting ? <IconLoader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                        Create Account & Accept
                                    </Button>

                                    <div className="mt-6 text-center">
                                        <p className="text-sm text-muted-foreground">
                                            Already have an account?{" "}
                                            <Button
                                                type="button"
                                                variant="link"
                                                className="p-0 h-auto font-medium text-primary"
                                                onClick={() => {
                                                    const currentUrl = window.location.pathname + window.location.search;
                                                    router.push(`/auth?isLogin=true&redirect=${encodeURIComponent(currentUrl)}`);
                                                }}
                                            >
                                                Sign in
                                            </Button>
                                        </p>
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}

export default function InviteAcceptPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><IconLoader2 className="w-8 h-8 animate-spin" /></div>}>
            <InviteAcceptContent />
        </Suspense>
    );
}

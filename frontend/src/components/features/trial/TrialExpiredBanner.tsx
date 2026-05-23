"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { IconClock, IconChartBar, IconFolder, IconRobot, IconUsers } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/lib/api";
import SubscriptionModal from "../subscriptions/SubscriptionModal";

export default function TrialExpiredBanner() {
  const { user } = useAuth();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [summary, setSummary] = useState<{
    projectsCreated: number;
    assessmentsCompleted: number;
    teamMembersInvited: number;
    questionsAnswered: number;
  } | null>(null);

  useEffect(() => {
    if (user?.subscription_status === "free" && user.trial_used) {
      apiService.getTrialSummary().then(setSummary).catch(console.error);
    }
  }, [user]);

  if (user?.subscription_status !== "free" || !user?.trial_used || !summary) {
    return null;
  }

  // Only show if they actually did something
  if (summary.projectsCreated === 0 && summary.questionsAnswered === 0) {
    return (
      <>
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-muted/50 to-muted/20 border border-muted flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="bg-background p-3 rounded-xl shadow-sm">
              <IconClock className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Your Free Trial Has Ended</h3>
              <p className="text-muted-foreground mt-1">
                Upgrade to BLOOM to create projects and run full AI maturity assessments.
              </p>
            </div>
          </div>
          <Button 
            onClick={() => setShowSubscriptionModal(true)}
            className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Upgrade to Premium
          </Button>
        </div>
        <SubscriptionModal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          currentPlan="free"
        />
      </>
    );
  }

  return (
    <>
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-background to-muted/30 border border-primary/20 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="bg-primary/20 p-3 rounded-xl shadow-sm text-primary">
              <IconChartBar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Your Free Trial Has Ended</h3>
              <p className="text-muted-foreground mt-1 max-w-xl">
                Your data has been preserved in read-only mode. Upgrade to BLOOM to continue your progress and unlock unlimited assessments.
              </p>
            </div>
          </div>
          <Button 
            size="lg"
            onClick={() => setShowSubscriptionModal(true)}
            className="w-full md:w-auto font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
          >
            Upgrade to Continue
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-background/50 border-primary/10">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <IconFolder className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.projectsCreated}</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Projects</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-background/50 border-primary/10">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                <IconRobot className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.questionsAnswered}</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Answers</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background/50 border-primary/10">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                <IconChartBar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.assessmentsCompleted}</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Reports</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background/50 border-primary/10">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                <IconUsers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.teamMembersInvited}</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Invites</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        currentPlan="free"
      />
    </>
  );
}

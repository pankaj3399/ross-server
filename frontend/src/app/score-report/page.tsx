"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { useAssessmentResultsStore } from "../../store/assessmentResultsStore";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Trophy, 
  Star
} from "lucide-react";
import { PieChart, Cell, ResponsiveContainer, Pie } from "recharts";

// Beautiful color palette
const DOMAIN_COLORS = [
  "#8B5CF6", // Purple
  "#A855F7", // Violet  
  "#C084FC", // Light Purple
  "#DDD6FE", // Very Light Purple
  "#7C3AED", // Dark Purple
  "#6D28D9", // Darker Purple
  "#EC4899", // Pink
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#3B82F6", // Blue
];

const PERFORMANCE_COLORS = {
  excellent: "#10B981", // Green
  good: "#84CC16", // Lime
  average: "#F59E0B", // Amber
  poor: "#EF4444", // Red
};

export default function ScoreReportPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { getProjectResults } = useAssessmentResultsStore();
  
  const projectId = searchParams.get("projectId");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }

    if (!projectId) {
      router.push("/dashboard");
      return;
    }

    const projectResults = getProjectResults(projectId);
    if (projectResults) {
      setResults(projectResults);
    } else {
      // If no results found, redirect to dashboard
      router.push("/dashboard");
    }
    
    setLoading(false);
  }, [projectId, isAuthenticated, router, getProjectResults]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-violet-900 to-purple-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading score report...</p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-violet-900 to-purple-800">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">No Results Found</h1>
          <p className="text-gray-300 mb-6">Assessment results not found for this project.</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const overallPieData = [
    { 
      name: "Correct", 
      value: results.results.overall.totalCorrectAnswers, 
      color: PERFORMANCE_COLORS.excellent,
      fill: PERFORMANCE_COLORS.excellent
    },
    { 
      name: "Incorrect", 
      value: results.results.overall.totalQuestions - results.results.overall.totalCorrectAnswers, 
      color: PERFORMANCE_COLORS.poor,
      fill: PERFORMANCE_COLORS.poor
    },
  ];

  const domainPieData = results.results.domains.map((domain: any, index: number) => ({
    name: domain.domainTitle,
    value: domain.correctAnswers,
    total: domain.totalQuestions,
    percentage: domain.percentage,
    color: DOMAIN_COLORS[index % DOMAIN_COLORS.length],
    fill: DOMAIN_COLORS[index % DOMAIN_COLORS.length],
  }));

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 80) return { level: "Excellent", color: PERFORMANCE_COLORS.excellent };
    if (percentage >= 60) return { level: "Good", color: PERFORMANCE_COLORS.good };
    if (percentage >= 40) return { level: "Average", color: PERFORMANCE_COLORS.average };
    return { level: "Needs Improvement", color: PERFORMANCE_COLORS.poor };
  };

  const performance = getPerformanceLevel(results.results.overall.overallPercentage);

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-purple-900 dark:to-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Assessment Report
            </h1>
            <p className="text-xl text-gray-600 dark:text-white/70">{results.project.name}</p>
            <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-white/60">
              <span>Completed on {new Date(results.submittedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </motion.div>

        {/* Overall Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-gray-50 dark:bg-white/5 backdrop-blur-sm rounded-3xl p-8 mb-12 border border-gray-200 dark:border-white/10"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-white/10 mb-4">
              <Trophy className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
              <span className="text-gray-900 dark:text-white font-medium">Overall Performance</span>
            </div>
            
            <div className="space-y-4">
              <div className="text-6xl font-bold text-gray-900 dark:text-white">
                {results.results.overall.overallPercentage.toFixed(1)}%
              </div>
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-medium"
                style={{ backgroundColor: performance.color + '20', color: performance.color }}
              >
                <Star className="w-4 h-4" />
                {performance.level}
              </div>
              <p className="text-gray-600 dark:text-white/70 text-lg">
                {results.results.overall.totalCorrectAnswers} out of {results.results.overall.totalQuestions} questions correct
              </p>
            </div>
          </div>

          {/* Overall Pie Chart */}
          <div className="max-w-md mx-auto">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={overallPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={140}
                  dataKey="value"
                  startAngle={90}
                  endAngle={450}
                >
                  {overallPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Domain Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
            Domain Performance
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.results.domains.map((domain: any, index: number) => {
              const domainPerformance = getPerformanceLevel(domain.percentage);
              const pieData = [
                { name: "Correct", value: domain.correctAnswers, fill: domainPerformance.color },
                { name: "Incorrect", value: domain.totalQuestions - domain.correctAnswers, fill: "#9CA3AF" },
              ];

              return (
                <motion.div
                  key={domain.domainId}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all duration-300 shadow-sm dark:shadow-none"
                >
                  <div className="text-center space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {domain.domainTitle}
                    </h3>
                    
                    <div className="relative w-32 h-32 mx-auto">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={60}
                            dataKey="value"
                            startAngle={90}
                            endAngle={450}
                          >
                            {pieData.map((entry, idx) => (
                              <Cell key={`cell-${idx}`} fill={entry.fill} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {domain.percentage.toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div 
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
                        style={{ backgroundColor: domainPerformance.color + '20', color: domainPerformance.color }}
                      >
                        {domainPerformance.level}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-white/60">
                        {domain.correctAnswers}/{domain.totalQuestions} correct
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex justify-center"
        >
          <button
            onClick={() => router.push("/dashboard")}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    </div>
  );
}
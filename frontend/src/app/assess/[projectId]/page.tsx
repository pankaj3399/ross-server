"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { apiService, Domain } from "../../../lib/api";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  Target,
} from "lucide-react";

export default function AssessmentPage({
  params,
}: {
  params: { projectId: string };
}) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }
    loadDomains();
  }, [isAuthenticated, router]);

  const loadDomains = async () => {
    try {
      const response = await apiService.getDomains();
      setDomains(response.domains);
    } catch (error) {
      console.error("Failed to load domains:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <div>Loading...</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading assessment domains...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-6 inline-block transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">AI Maturity Assessment</span>
          </h1>
          <p className="text-gray-300 text-lg">
            Select a domain to begin your assessment
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {domains.map((domain, index) => (
            <motion.div
              key={domain.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="glass-effect rounded-2xl p-6 cursor-pointer hover:bg-white/10 transition-all duration-300 group"
              onClick={() => setSelectedDomain(domain.id)}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-violet-600 rounded-lg">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
                  {domain.title}
                </h3>
              </div>
              <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                {domain.description}
              </p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">
                  {domain.practices.length} practices
                </span>
                <div className="flex items-center text-purple-400 text-sm">
                  <ArrowRight className="w-4 h-4 mr-1" />
                  Start Assessment
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {selectedDomain && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mt-8"
          >
            <h2 className="text-2xl font-semibold mb-6 text-white">
              Practices in {domains.find((d) => d.id === selectedDomain)?.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {domains
                .find((d) => d.id === selectedDomain)
                ?.practices.map((practiceId, index) => (
                  <motion.div
                    key={practiceId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Link
                      href={`/assess/${params.projectId}/${selectedDomain}/${practiceId}`}
                      className="glass-effect rounded-xl p-6 block hover:bg-white/10 transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-gradient-to-r from-purple-600 to-violet-600 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-lg font-medium text-white group-hover:text-purple-300 transition-colors">
                          {practiceId
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </h3>
                      </div>
                      <p className="text-gray-300 text-sm mb-3">
                        Click to start assessment for this practice
                      </p>
                      <div className="flex items-center text-purple-400 text-sm">
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Begin Assessment
                      </div>
                    </Link>
                  </motion.div>
                ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

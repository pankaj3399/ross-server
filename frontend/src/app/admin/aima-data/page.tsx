'use client';

import { API_BASE_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useTheme } from "../../../contexts/ThemeContext";
import { useRouter } from "next/navigation";

interface Question {
  id: string;
  level: string;
  stream: string;
  question_index: number;
  question_text: string;
  created_at: string;
}

interface Practice {
  id: string;
  domain_id: string;
  title: string;
  description: string;
  created_at: string;
  questions: Question[];
}

interface Domain {
  id: string;
  title: string;
  description: string;
  created_at: string;
  practices: Practice[];
}

interface AIMAResponse {
  success: boolean;
  data: {
    domains: Domain[];
    summary: {
      total_domains: number;
      total_practices: number;
      total_questions: number;
    };
  };
}

export default function AdminQuestions() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  
  const [aimaData, setAimaData] = useState<AIMAResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  const [expandedPractices, setExpandedPractices] = useState<Set<string>>(new Set());
  
  // Check authentication and admin role
  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }
    
    if (user?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
  }, [isAuthenticated, user, authLoading, router]);
  
  // Modal states
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [selectedDomainId, setSelectedDomainId] = useState<string>("");
  const [selectedPracticeId, setSelectedPracticeId] = useState<string>("");
  
  // Form states
  const [domainForm, setDomainForm] = useState({ title: "", description: "" });
  const [practiceForm, setPracticeForm] = useState({ title: "", description: "" });
  const [questionForm, setQuestionForm] = useState({ level: "1", stream: "A", question_text: "" });

  const toggleDomain = (domainId: string) => {
    const newExpandedDomains = new Set(expandedDomains);
    if (newExpandedDomains.has(domainId)) {
      newExpandedDomains.delete(domainId);
      const newExpandedPractices = new Set(expandedPractices);
      aimaData?.data.domains
        .find(d => d.id === domainId)
        ?.practices.forEach(practice => newExpandedPractices.delete(practice.id));
      setExpandedPractices(newExpandedPractices);
    } else {
      newExpandedDomains.add(domainId);
    }
    setExpandedDomains(newExpandedDomains);
  };

  const togglePractice = (practiceId: string) => {
    const newExpandedPractices = new Set(expandedPractices);
    if (newExpandedPractices.has(practiceId)) {
      newExpandedPractices.delete(practiceId);
    } else {
      newExpandedPractices.add(practiceId);
    }
    setExpandedPractices(newExpandedPractices);
  };

  const handleAddDomain = () => {
    setDomainForm({ title: "", description: "" });
    setShowDomainModal(true);
  };

  const handleAddPractice = (domainId: string) => {
    setSelectedDomainId(domainId);
    setPracticeForm({ title: "", description: "" });
    setShowPracticeModal(true);
  };

  const handleAddQuestion = (practiceId: string) => {
    setSelectedPracticeId(practiceId);
    setQuestionForm({ level: "1", stream: "A", question_text: "" });
    setShowQuestionModal(true);
  };

  const closeModals = () => {
    setShowDomainModal(false);
    setShowPracticeModal(false);
    setShowQuestionModal(false);
    setSelectedDomainId("");
    setSelectedPracticeId("");
  };

  const submitDomain = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${API_BASE_URL}/admin/add-domain`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json" 
        },
        body: JSON.stringify(domainForm),
      });
      
      if (response.ok) {
        closeModals();
        window.location.reload();
      } else {
        const error = await response.json();
        console.error(`Error: ${error.error}`);
      }
    } catch (err) {
      console.error("Failed to add domain");
    }
  };

  const submitPractice = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${API_BASE_URL}/admin/add-practice`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ ...practiceForm, domain_id: selectedDomainId }),
      });
      
      if (response.ok) {
        closeModals();
        window.location.reload();
      } else {
        const error = await response.json();
        console.error(`Error: ${error.error}`);
      }
    } catch (err) {
      console.error("Failed to add practice");
    }
  };

  const submitQuestion = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${API_BASE_URL}/admin/add-question`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ ...questionForm, practice_id: selectedPracticeId }),
      });
      
      if (response.ok) {
        closeModals();
        window.location.reload();
      } else {
        const error = await response.json();
        console.error(`Error: ${error.error}`);
      }
    } catch (err) {
      console.error("Failed to add question");
    }
  };

  // Fetch AIMA data only if user is authenticated and is admin
  useEffect(() => {
    // Don't fetch if still loading auth or not authenticated or not admin
    if (authLoading || !isAuthenticated || user?.role !== "ADMIN") {
      return;
    }
    async function fetchAIMAData() {
      try {
        const token = localStorage.getItem("auth_token");
        const response = await fetch(`${API_BASE_URL}/admin/aima-data`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: AIMAResponse = await response.json();
        
        if (data.success) {
          setAimaData(data);
        } else {
          throw new Error("Failed to fetch AIMA data");
        }
      } catch (err) {
        console.error("Error fetching AIMA data:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    }
    
    fetchAIMAData();
  }, [authLoading, isAuthenticated, user?.role]);

  // Handle redirects
  useEffect(() => {
    if (authLoading) return; // Still loading auth state
    
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }
    
    if (user?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
  }, [isAuthenticated, user, authLoading, router]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated or not admin (redirects will handle this)
  if (!isAuthenticated || user?.role !== "ADMIN") {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-700 dark:text-gray-300">Loading AIMA data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  if (!aimaData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-600 text-yellow-700 dark:text-yellow-300 px-4 py-3 rounded">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AIMA Question Hierarchy</h1>
          <button
            onClick={handleAddDomain}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Domain
          </button>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">Summary</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{aimaData.data.summary.total_domains}</div>
              <div className="text-blue-700">Domains</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{aimaData.data.summary.total_practices}</div>
              <div className="text-blue-700">Practices</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{aimaData.data.summary.total_questions}</div>
              <div className="text-blue-700">Questions</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {aimaData.data.domains.map((domain) => (
          <div key={domain.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm dark:shadow-gray-900/20">
            {/* Domain Header - Always Visible */}
            <div 
              className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              onClick={() => toggleDomain(domain.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {expandedDomains.has(domain.id) ? (
                        <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{domain.title}</h2>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{domain.description}</p>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {domain.practices.length} practices
                </div>
              </div>
            </div>

            {/* Practices - Collapsible */}
            {expandedDomains.has(domain.id) && (
              <div className="border-t border-gray-200 dark:border-gray-700">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Practices</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddPractice(domain.id);
                      }}
                      className="inline-flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md transition-colors"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Practice
                    </button>
                  </div>
                  <div className="space-y-4">
                    {domain.practices.map((practice) => (
                      <div key={practice.id} className="border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                      {/* Practice Header */}
                      <div 
                        className="p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        onClick={() => togglePractice(practice.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {expandedPractices.has(practice.id) ? (
                                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">{practice.title}</h3>
                              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{practice.description}</p>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {practice.questions.length} questions
                          </div>
                        </div>
                      </div>

                      {/* Questions - Collapsible */}
                      {expandedPractices.has(practice.id) && (
                        <div className="border-t border-gray-200 dark:border-gray-600 p-4 bg-gray-50 dark:bg-gray-600">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Questions</h4>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddQuestion(practice.id);
                              }}
                              className="inline-flex items-center px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded transition-colors"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Add Question
                            </button>
                          </div>
                          <div className="space-y-3">
                            {practice.questions.map((question) => (
                              <div key={question.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
                                      Level {question.level}
                                    </span>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300">
                                      Stream {question.stream}
                                    </span>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                                      Q{question.question_index + 1}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-gray-800 dark:text-gray-300 leading-relaxed">{question.question_text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

          {/* Domain/Practice Modal */}
          {(showDomainModal || showPracticeModal) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {showDomainModal ? "Add New Domain" : "Add New Practice"}
                  </h2>
                  <button
                    onClick={closeModals}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                    <input
                      type="text"
                      value={showDomainModal ? domainForm.title : practiceForm.title}
                      onChange={(e) => {
                        if (showDomainModal) {
                          setDomainForm({ ...domainForm, title: e.target.value });
                        } else {
                          setPracticeForm({ ...practiceForm, title: e.target.value });
                        }
                      }}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                        showDomainModal ? "focus:ring-blue-500" : "focus:ring-green-500"
                      }`}
                      placeholder={showDomainModal ? "Domain title" : "Practice title"}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <textarea
                      value={showDomainModal ? domainForm.description : practiceForm.description}
                      onChange={(e) => {
                        if (showDomainModal) {
                          setDomainForm({ ...domainForm, description: e.target.value });
                        } else {
                          setPracticeForm({ ...practiceForm, description: e.target.value });
                        }
                      }}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                        showDomainModal ? "focus:ring-blue-500" : "focus:ring-green-500"
                      }`}
                      rows={3}
                      placeholder={showDomainModal ? "Domain description (optional)" : "Practice description (optional)"}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={closeModals}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={showDomainModal ? submitDomain : submitPractice}
                    className={`px-4 py-2 text-white rounded-md ${
                      showDomainModal 
                        ? "bg-blue-600 hover:bg-blue-700" 
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {showDomainModal ? "Add Domain" : "Add Practice"}
                  </button>
                </div>
              </div>
            </div>
          )}

      {/* Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Add New Question</h2>
              <button
                onClick={closeModals}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                  <select
                    value={questionForm.level}
                    onChange={(e) => setQuestionForm({ ...questionForm, level: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="1">Level 1</option>
                    <option value="2">Level 2</option>
                    <option value="3">Level 3</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stream</label>
                  <select
                    value={questionForm.stream}
                    onChange={(e) => setQuestionForm({ ...questionForm, stream: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="A">Stream A</option>
                    <option value="B">Stream B</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                <textarea
                  value={questionForm.question_text}
                  onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={4}
                  placeholder="Enter the question text..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeModals}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={submitQuestion}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Add Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

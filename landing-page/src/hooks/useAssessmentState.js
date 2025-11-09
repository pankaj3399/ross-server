import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assessmentQuestions } from '@/data/assessmentQuestions';
import { useAssessment } from '@/contexts/AssessmentContext';

export const useAssessmentState = () => {
  const { projectId, domainId: domainFromUrl, subdomainId: subdomainFromUrl, questionIndex: questionIndexFromUrl } = useParams();
  const navigate = useNavigate();
  const { findFirstUnansweredQuestion } = useAssessment();

  const [currentDomain, setCurrentDomain] = useState(null);
  const [currentSubdomain, setCurrentSubdomain] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    if (domainFromUrl && subdomainFromUrl && questionIndexFromUrl !== undefined) {
      setCurrentDomain(domainFromUrl);
      setCurrentSubdomain(subdomainFromUrl);
      setCurrentQuestionIndex(parseInt(questionIndexFromUrl, 10));
    } else {
      const firstUnanswered = findFirstUnansweredQuestion(projectId);
      if (firstUnanswered) {
        const { domainId, subdomainId, questionIndex } = firstUnanswered;
        setCurrentDomain(domainId);
        setCurrentSubdomain(subdomainId);
        setCurrentQuestionIndex(questionIndex);
        // Navigate to the correct URL if it's not already there
        if (!domainFromUrl) {
            navigate(`/project/${projectId}/assessment/${domainId}/${subdomainId}/${questionIndex}`, { replace: true });
        }
      } else {
        // Handle case where all questions are answered
        const domainKeys = Object.keys(assessmentQuestions);
        const lastDomainId = domainKeys[domainKeys.length - 1];
        const subDomainKeys = Object.keys(assessmentQuestions[lastDomainId].subdomains);
        const lastSubDomainId = subDomainKeys[subDomainKeys.length - 1];
        const lastQuestionIndex = assessmentQuestions[lastDomainId].subdomains[lastSubDomainId].questions.length -1;
        setCurrentDomain(lastDomainId);
        setCurrentSubdomain(lastSubDomainId);
        setCurrentQuestionIndex(lastQuestionIndex);
      }
    }
  }, [domainFromUrl, subdomainFromUrl, questionIndexFromUrl, projectId, findFirstUnansweredQuestion, navigate]);

  const navigateTo = (domainId, subdomainId, questionIndex) => {
    setCurrentDomain(domainId);
    setCurrentSubdomain(subdomainId);
    setCurrentQuestionIndex(questionIndex);
    navigate(`/project/${projectId}/assessment/${domainId}/${subdomainId}/${questionIndex}`);
  };

  return {
    currentDomain,
    currentSubdomain,
    currentQuestionIndex,
    navigateTo,
  };
};
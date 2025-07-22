import React, { useState, useEffect } from 'react';
import { Zap } from "lucide-react";
import { motion } from "framer-motion";
import './App.css';

import InputSection from "./components/InputSection";
import SummaryDisplay from "./components/SummaryDisplay";
import HistorySidebar from "./components/HistorySidebar";

interface Summary {
  id?: string;
  summary: string;
  word_count_original: number;
  word_count_summary: number;
  summary_length: string;
  input_type: string;
  input_text: string;
  created_date?: string;
}

const MotionDiv = motion.div as React.ElementType;
const ZapIcon = Zap as React.ElementType;

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentSummary, setCurrentSummary] = useState<Summary | null>(null);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSummaries();
  }, []);

  const loadSummaries = () => {
    const savedSummaries = localStorage.getItem('text-summaries');
    if (savedSummaries) {
      try {
        setSummaries(JSON.parse(savedSummaries));
      } catch (e) {
        console.error('Error loading summaries:', e);
      }
    }
  };

  const saveSummary = (summary: Summary) => {
    const summaryWithId: Summary = {
      ...summary,
      id: Date.now().toString(),
      created_date: new Date().toISOString()
    };
    const updatedSummaries = [summaryWithId, ...summaries.slice(0, 9)]; // Keep only 10 most recent
    setSummaries(updatedSummaries);
    localStorage.setItem('text-summaries', JSON.stringify(updatedSummaries));
    return summaryWithId;
  };

  const handleSummarize = async (input: string, inputType: string, summaryLength: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('https://blinknote-summarizer.dimanthayapa2001.workers.dev', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input_text: input,
          input_type: inputType,
          summary_length: summaryLength
        })
      });

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(result?.error || 'Failed to generate summary');
      }

      const savedSummary = saveSummary(result);
      setCurrentSummary(savedSummary);
    } catch (error: any) {
      console.error('Error creating summary:', error);
      setError(error.message);
    }
    setIsLoading(false);
  };

  const handleSelectSummary = (summary: Summary) => {
    setCurrentSummary(summary);
    setError(null);
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all summary history?')) {
      setSummaries([]);
      localStorage.removeItem('text-summaries');
      setCurrentSummary(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <MotionDiv
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                <ZapIcon className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                Instant Text Summarizer
              </h1>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Transform lengthy articles, documents, and web pages into clear, concise summaries using advanced AI. 
              Perfect for research, studying, and staying informed.
            </p>
          </MotionDiv>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Panel */}
          <div className="flex-1 space-y-8">
            <InputSection
              onSummarize={handleSummarize}
              isLoading={isLoading}
            />
            {error && (
              <MotionDiv
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-lg p-4"
              >
                <p className="text-red-700 text-sm">{error}</p>
              </MotionDiv>
            )}
            {currentSummary && (
              <SummaryDisplay summary={currentSummary} />
            )}
          </div>
          {/* History Sidebar */}
          <HistorySidebar
            summaries={summaries}
            onSelectSummary={handleSelectSummary}
            selectedSummary={currentSummary}
            onClearHistory={handleClearHistory}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-100 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center">
          <p className="text-sm text-gray-500">
            Powered by advanced AI 32; Your text is processed securely and not stored permanently
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;

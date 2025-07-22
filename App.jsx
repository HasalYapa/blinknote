import React, { useState, useEffect } from 'react';
import { Sparkles, Zap } from "lucide-react";
import { motion } from "framer-motion";
import './App.css'

import InputSection from "./components/InputSection";
import SummaryDisplay from "./components/SummaryDisplay";
import HistorySidebar from "./components/HistorySidebar";

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentSummary, setCurrentSummary] = useState(null);
  const [summaries, setSummaries] = useState([]);
  const [error, setError] = useState(null);

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

  const saveSummary = (summary) => {
    const summaryWithId = {
      ...summary,
      id: Date.now().toString(),
      created_date: new Date().toISOString()
    };
    
    const updatedSummaries = [summaryWithId, ...summaries.slice(0, 9)]; // Keep only 10 most recent
    setSummaries(updatedSummaries);
    localStorage.setItem('text-summaries', JSON.stringify(updatedSummaries));
    return summaryWithId;
  };

  const handleSummarize = async (input, inputType, summaryLength) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/summarize', {
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate summary');
      }

      const result = await response.json();
      const savedSummary = saveSummary(result);
      setCurrentSummary(savedSummary);
      
    } catch (error) {
      console.error('Error creating summary:', error);
      setError(error.message);
    }
    
    setIsLoading(false);
  };

  const handleSelectSummary = (summary) => {
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
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                Instant Text Summarizer
              </h1>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Transform lengthy articles, documents, and web pages into clear, concise summaries using advanced AI. 
              Perfect for research, studying, and staying informed.
            </p>
          </motion.div>
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
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-lg p-4"
              >
                <p className="text-red-700 text-sm">{error}</p>
              </motion.div>
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
            Powered by advanced AI • Your text is processed securely and not stored permanently
          </p>
        </div>
      </div>
    </div>
  );
}

export default App

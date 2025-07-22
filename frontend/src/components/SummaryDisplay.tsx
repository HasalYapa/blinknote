import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Copy, Download, Check, FileText, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

interface Summary {
  summary: string;
  word_count_original: number;
  word_count_summary: number;
  summary_length: string;
  input_type: string;
  input_text: string;
}

interface SummaryDisplayProps {
  summary: Summary;
}

const SummaryDisplay: React.FC<SummaryDisplayProps> = ({ summary }) => {
  const [copied, setCopied] = useState(false);

  if (!summary) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(summary.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([summary.summary], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'summary.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const compressionRatio = summary.word_count_original && summary.word_count_summary 
    ? Math.round((1 - summary.word_count_summary / summary.word_count_original) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Stats Bar */}
      <div className="flex flex-wrap gap-4">
        <Badge variant="outline" className="flex items-center gap-2 px-3 py-1.5">
          <FileText className="w-4 h-4 text-blue-600" />
          {summary.word_count_original} 192; {summary.word_count_summary} words
        </Badge>
        {compressionRatio > 0 && (
          <Badge variant="outline" className="flex items-center gap-2 px-3 py-1.5">
            <BarChart3 className="w-4 h-4 text-green-600" />
            {compressionRatio}% compression
          </Badge>
        )}
        <Badge variant="outline" className="px-3 py-1.5 capitalize">
          {summary.summary_length} summary
        </Badge>
      </div>

      {/* Summary Content */}
      <Card className="p-8 bg-gradient-to-br from-gray-50 to-white border-gray-100">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Summary</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>
        </div>

        <div className="prose prose-gray max-w-none">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">
            {summary.summary}
          </p>
        </div>
      </Card>

      {/* Original Input Preview */}
      <Card className="p-6 bg-white border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Original {summary.input_type === 'url' ? 'URL' : 'Text'}
        </h4>
        <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4 max-h-32 overflow-y-auto">
          {summary.input_type === 'url' ? (
            <a href={summary.input_text} target="_blank" rel="noopener noreferrer" 
               className="text-blue-600 hover:text-blue-800 underline">
              {summary.input_text}
            </a>
          ) : (
            summary.input_text.length > 200 
              ? summary.input_text.substring(0, 200) + '...'
              : summary.input_text
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default SummaryDisplay; 
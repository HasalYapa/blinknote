import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, Link2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function HistorySidebar({ summaries, onSelectSummary, selectedSummary, onClearHistory }) {
  if (!summaries || summaries.length === 0) {
    return (
      <div className="w-full lg:w-80">
        <Card className="p-6 text-center">
          <Clock className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No summaries yet</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-80">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Recent Summaries
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearHistory}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          <AnimatePresence>
            {summaries.map((summary, index) => (
              <motion.div
                key={summary.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                  selectedSummary?.id === summary.id
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-transparent hover:bg-gray-100'
                }`}
                onClick={() => onSelectSummary(summary)}
              >
                <div className="flex items-start gap-2 mb-2">
                  {summary.input_type === 'url' ? (
                    <Link2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  )}
                  <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
                    {summary.input_type === 'url' 
                      ? (() => {
                          try {
                            return new URL(summary.input_text).hostname;
                          } catch {
                            return summary.input_text.substring(0, 60) + (summary.input_text.length > 60 ? '...' : '');
                          }
                        })()
                      : summary.input_text.substring(0, 60) + (summary.input_text.length > 60 ? '...' : '')
                    }
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {summary.summary_length}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {summary.created_date ? new Date(summary.created_date).toLocaleDateString() : 'Just now'}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
}


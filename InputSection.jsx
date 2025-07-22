import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Link2, Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function InputSection({ onSummarize, isLoading }) {
  const [inputType, setInputType] = useState("text");
  const [textInput, setTextInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [summaryLength, setSummaryLength] = useState("medium");

  const handleSubmit = () => {
    const input = inputType === "text" ? textInput : urlInput;
    if (input.trim()) {
      onSummarize(input, inputType, summaryLength);
    }
  };

  const isValid = inputType === "text" ? textInput.trim().length > 0 : urlInput.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">AI Text Summarizer</h2>
          <p className="text-sm text-gray-500">Transform lengthy content into clear, concise summaries</p>
        </div>
      </div>

      <Tabs value={inputType} onValueChange={setInputType} className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-2 bg-gray-50">
          <TabsTrigger value="text" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Paste Text
          </TabsTrigger>
          <TabsTrigger value="url" className="flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            From URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="mt-4">
          <Textarea
            placeholder="Paste your text here... (articles, documents, research papers, etc.)"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className="min-h-[200px] resize-none border-gray-200 focus:border-blue-300 focus:ring-blue-100"
          />
          <p className="text-xs text-gray-400 mt-2">
            {textInput.length} characters • {textInput.split(' ').filter(word => word.length > 0).length} words
          </p>
        </TabsContent>

        <TabsContent value="url" className="mt-4">
          <Input
            type="url"
            placeholder="https://example.com/article"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="border-gray-200 focus:border-blue-300 focus:ring-blue-100"
          />
          <p className="text-xs text-gray-400 mt-2">
            We'll extract and summarize the main content from the webpage
          </p>
        </TabsContent>
      </Tabs>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Summary Length
          </label>
          <Select value={summaryLength} onValueChange={setSummaryLength}>
            <SelectTrigger className="w-full border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="short">Short • Quick overview</SelectItem>
              <SelectItem value="medium">Medium • Balanced summary</SelectItem>
              <SelectItem value="detailed">Detailed • Comprehensive summary</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!isValid || isLoading}
          className="bg-blue-600 hover:bg-blue-700 px-8 py-2 h-11 transition-all duration-200 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Summarizing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Summarize
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}


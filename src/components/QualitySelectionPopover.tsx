
import React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Minus, X, Info } from "lucide-react";

interface QualitySelectionPopoverProps {
  type: "ace" | "error";
  onServeClick: (type: "error" | "ace", quality: "good" | "neutral" | "bad") => void;
  onClose: () => void;
}

export function QualitySelectionPopover({ type, onServeClick, onClose }: QualitySelectionPopoverProps) {
  // Get quality explanations
  const getQualityExplanation = (quality: "good" | "neutral" | "bad", type: "ace" | "error") => {
    if (type === "ace") {
      switch (quality) {
        case "good":
          return "Well placed serve, clean execution.";
        case "neutral":
          return "The serve wasn't great, but the opponent made a mistake.";
        case "bad":
          return "Ace due to opponent error, not your serve quality";
      }
    } else {
      switch (quality) {
        case "good":
          return "Very good serve attempt, but just out or net";
        case "neutral":
          return "Mediocre execution, average error";
        case "bad":
          return "Poorly executed serve, not close";
      }
    }
  };

  return (
    <div className="space-y-3 p-3 relative w-full max-w-[260px] sm:max-w-[280px]">
      {/* Close button */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-1 right-1 h-6 w-6 z-10" 
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="text-sm font-medium mb-4 pr-8">
        Select {type === "ace" ? "Ace" : "Error"} Quality
      </div>
      
      {/* Good quality */}
      <Button 
        variant="outline" 
        className="w-full justify-start gap-3 h-auto py-3 bg-background hover:bg-accent" 
        onClick={() => onServeClick(type, "good")}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className={`flex items-center justify-center ${type === "ace" ? "ace-bg w-8 h-8 rounded-full" : "error-bg w-6 h-6 transform rotate-45"}`}>
            <Plus 
              className={`h-3 w-3 text-white font-bold ${type === "ace" ? "" : "transform -rotate-45"}`} 
              style={{ strokeWidth: 5 }} 
            />
          </div>
          <span className={type === "error" ? "ml-1" : ""}>Good</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="ml-auto flex-shrink-0">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-muted/50" 
                    onClick={e => {
                      e.stopPropagation();
                      e.preventDefault();
                    }} 
                    onMouseDown={e => e.stopPropagation()} 
                    onTouchStart={e => e.stopPropagation()} 
                    type="button"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p>{getQualityExplanation("good", type)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </Button>

      {/* Neutral quality */}
      <Button 
        variant="outline" 
        className="w-full justify-start gap-3 h-auto py-3 bg-background hover:bg-accent" 
        onClick={() => onServeClick(type, "neutral")}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className={`flex items-center justify-center ${type === "ace" ? "ace-bg w-8 h-8 rounded-full" : "error-bg w-6 h-6 transform rotate-45"}`}>
            <div className={`h-1 w-1 bg-white rounded-full ${type === "ace" ? "" : "transform -rotate-45"}`} />
          </div>
          <span className={type === "error" ? "ml-1" : ""}>Neutral</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="ml-auto flex-shrink-0">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-muted/50" 
                    onClick={e => {
                      e.stopPropagation();
                      e.preventDefault();
                    }} 
                    onMouseDown={e => e.stopPropagation()} 
                    onTouchStart={e => e.stopPropagation()} 
                    type="button"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p>{getQualityExplanation("neutral", type)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </Button>

      {/* Bad quality */}
      <Button 
        variant="outline" 
        className="w-full justify-start gap-3 h-auto py-3 bg-background hover:bg-accent" 
        onClick={() => onServeClick(type, "bad")}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className={`flex items-center justify-center ${type === "ace" ? "ace-bg w-8 h-8 rounded-full" : "error-bg w-6 h-6 transform rotate-45"}`}>
            <Minus 
              className={`h-3 w-3 text-white font-bold ${type === "ace" ? "" : "transform -rotate-45"}`} 
              style={{ strokeWidth: 5 }} 
            />
          </div>
          <span className={type === "error" ? "ml-1" : ""}>Bad</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="ml-auto flex-shrink-0">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-muted/50" 
                    onClick={e => {
                      e.stopPropagation();
                      e.preventDefault();
                    }} 
                    onMouseDown={e => e.stopPropagation()} 
                    onTouchStart={e => e.stopPropagation()} 
                    type="button"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p>{getQualityExplanation("bad", type)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </Button>
    </div>
  );
}

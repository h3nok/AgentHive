import React, { useCallback, useMemo } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Sparkle,
  Zap,
  Cpu,
  Code,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "./ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

/* --------------------------------------------------------------------
 * Model Selector (with transparent background & round borders)
 * ------------------------------------------------------------------*/

export type ModelId =
  | "gpt-4o"
  | "o3"
  | "gpt-4"
  | "claude"
  | "dall-e"
  | "gpt-4.1"
  | "gpt-4.1-mini"
  | "o4-mini"
  | "o4-mini-high"
  | "gpt-4.5"
  | "o1-pro";

export interface Model {
  id: ModelId;
  name: string;
  tagline: string;
  group: "primary" | "secondary";
  icon: React.ReactNode;
}

const MODEL_ICONS: Record<ModelId, React.ReactNode> = {
  "gpt-4o": <Sparkle className="h-4 w-4 text-purple-400 dark:text-purple-300" />,
  o3: <Zap className="h-4 w-4 text-blue-400 dark:text-blue-300" />,
  "gpt-4": <Cpu className="h-4 w-4 text-green-400 dark:text-green-300" />,
  claude: <Code className="h-4 w-4 text-amber-400 dark:text-amber-300" />,
  "dall-e": <ImageIcon className="h-4 w-4 text-pink-400 dark:text-pink-300" />,
  "gpt-4.1": <Cpu className="h-4 w-4 text-cyan-400 dark:text-cyan-300" />,
  "gpt-4.1-mini": <ImageIcon className="h-4 w-4 text-indigo-400 dark:text-indigo-300" />,
  "o4-mini": <Cpu className="h-4 w-4 text-purple-400 dark:text-purple-300" />,
  "o4-mini-high": <Code className="h-4 w-4 text-green-400 dark:text-green-300" />,
  "gpt-4.5": <Sparkle className="h-4 w-4 text-pink-400 dark:text-pink-300" />,
  "o1-pro": <Zap className="h-4 w-4 text-orange-400 dark:text-orange-300" />,
};

const PRIMARY_MODELS = [
  { id: "gpt-4o", name: "GPT‑4o", tagline: "Great for most tasks", group: "primary", icon: MODEL_ICONS["gpt-4o"] },
  { id: "o3", name: "o3", tagline: "Uses advanced reasoning", group: "primary", icon: MODEL_ICONS.o3 },
];
const SECONDARY_MODELS = [
  { id: "o4-mini", name: "o4‑mini", tagline: "Fast and efficient", group: "secondary", icon: MODEL_ICONS["o4-mini"] },
  { id: "o4-mini-high", name: "o4‑mini‑high", tagline: "Better reasoning, slightly slower", group: "secondary", icon: MODEL_ICONS["o4-mini-high"] },
  { id: "gpt-4.5", name: "GPT‑4.5", tagline: "Improved reasoning & context window", group: "secondary", icon: MODEL_ICONS["gpt-4.5"] },
  { id: "o1-pro", name: "o1‑pro", tagline: "Optimised for heavy codegen", group: "secondary", icon: MODEL_ICONS["o1-pro"] },
];
const ALL_MODELS = [...PRIMARY_MODELS, ...SECONDARY_MODELS] as const;

const ItemInner: React.FC<{ model: Model; isSelected: boolean }> = ({ model, isSelected }) => (
  <div className="flex items-center gap-2">
    {model.icon}
    <span className="truncate text-sm font-medium leading-none">{model.name}</span>
    {model.id === "gpt-4o" && <span className="ml-1 rounded bg-amber-500/20 px-1 text-[10px] font-semibold text-amber-500">NEW</span>}
    {isSelected && <Check className="ml-auto h-4 w-4 text-primary" />}
  </div>
);

interface ModelSelectorProps {
  selected: ModelId;
  onSelect: (id: ModelId) => void;
  className?: string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ selected, onSelect, className }) => {
  const current = useMemo(() => ALL_MODELS.find(m => m.id === selected) ?? PRIMARY_MODELS[0], [selected]);
  const renderItem = useCallback((model: any) => (
    <Tooltip key={model.id} delayDuration={200}>
      <TooltipTrigger asChild>
        <DropdownMenuItem onSelect={() => onSelect(model.id)} className="px-3 py-1.5 rounded-full hover:bg-accent/20">
          <ItemInner model={model} isSelected={model.id === selected} />
        </DropdownMenuItem>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs">
        {model.tagline}
      </TooltipContent>
    </Tooltip>
  ), [onSelect, selected]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1 rounded-full border border-border bg-transparent px-3 py-1 backdrop-blur",
            "hover:bg-accent/20 focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors",
            className
          )}
        >
          {current.icon}
          <span className="text-sm leading-none">{current.name}</span>
          <ChevronDown className="h-4 w-4 opacity-70 transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuPortal>
        <DropdownMenuContent align="start" side="bottom" sideOffset={4} className="w-48 rounded-2xl border border-border/50 bg-transparent p-2 backdrop-blur shadow-lg">
          {PRIMARY_MODELS.map(renderItem)}
          <DropdownMenuSeparator className="my-1 bg-border/30" />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-accent/20">
              <ChevronRight className="h-4 w-4 opacity-70" /> More models
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent sideOffset={6} className="w-56 rounded-2xl border border-border/50 bg-transparent p-2 backdrop-blur shadow-lg">
                {SECONDARY_MODELS.map(renderItem)}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
};

ModelSelector.displayName = "ModelSelector";
export default ModelSelector;

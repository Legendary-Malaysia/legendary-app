"use client";
import { useState } from "react";
import { Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";
import { VoiceCallOverlay } from "./VoiceCallOverlay";

// ============ TYPES ============

export interface VoiceCallButtonProps extends Omit<ButtonProps, "onClick"> {
  /** Button label text */
  label?: string;
  /** WebSocket URL for voice connection */
  wsUrl?: string;
  /** Enable Google Search capability */
  enableSearch?: boolean;
  /** Enable function calling capability */
  enableFunctions?: boolean;
  /** Animation speed multiplier (1 = normal, 2 = faster) */
  animationSpeed?: number;
  /** Custom class for the overlay */
  overlayClassName?: string;
}

// ============ MAIN COMPONENT ============

export function VoiceCallButton({
  label = "Start Voice Call",
  wsUrl,
  enableSearch = false,
  enableFunctions = true,
  animationSpeed = 1,
  overlayClassName,
  variant = "brand",
  size = "default",
  className,
  children,
  ...buttonProps
}: VoiceCallButtonProps) {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  const handleOpen = () => {
    setIsOverlayOpen(true);
  };

  const handleClose = () => {
    setIsOverlayOpen(false);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleOpen}
        className={cn("gap-2", className)}
        {...buttonProps}
      >
        {children ?? (
          <>
            <Phone className="h-4 w-4" />
            {label}
          </>
        )}
      </Button>

      <VoiceCallOverlay
        isOpen={isOverlayOpen}
        onClose={handleClose}
        wsUrl={wsUrl}
        enableSearch={enableSearch}
        enableFunctions={enableFunctions}
        animationSpeed={animationSpeed}
        className={overlayClassName}
      />
    </>
  );
}

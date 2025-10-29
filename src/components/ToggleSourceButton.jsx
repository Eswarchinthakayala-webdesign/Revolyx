import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Code2, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

function ToggleSourceButton({ expanded, onToggle }) {
  const [status, setStatus] = useState("idle"); // idle | loading

  const handleClick = async () => {
    setStatus("loading");

    // Simulate small delay for UX (optional)
    await new Promise(res => setTimeout(res, 400));

    onToggle();
    setStatus("idle");

    toast.info(expanded ? "Source hidden" : "Source shown", {
      description: expanded
        ? "Chart source code is now hidden."
        : "Chart source code is now visible.",
    });
  };

  return (
    <Button
      className="cursor-pointer flex items-center gap-2 min-w-[130px] justify-center"
      size="sm"
      onClick={handleClick}
      disabled={status === "loading"}
    >
      {status === "loading" ? (
        <>
          {/* ✅ Spinner with animation */}
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          {expanded ? "Hiding..." : "Showing..."}
        </>
      ) : expanded ? (
        <>
          <EyeOff className="w-4 h-4" />
          Hide source
        </>
      ) : (
        <>
          <Code2 className="w-4 h-4" />
          Show source
        </>
      )}
    </Button>
  );
}

export default ToggleSourceButton;

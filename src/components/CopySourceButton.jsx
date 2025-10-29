import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

function CopySourceButton({ onCopy }) {
  const [status, setStatus] = useState("idle"); // idle | loading | success

  const handleClick = async () => {
    setStatus("loading");
    await new Promise(res => setTimeout(res, 400)); // small delay for animation
    try {
      onCopy();
      setStatus("success");
      toast.success("Copied!", { description: "Chart source copied successfully." });
      setTimeout(() => setStatus("idle"), 1500); // revert after 1.5s
    } catch {
      toast.error("Failed to copy");
      setStatus("idle");
    }
  };

  return (
    <Button
      size="sm"
      className="cursor-pointer flex items-center gap-2 min-w-[120px] justify-center"
      onClick={handleClick}
      disabled={status === "loading"}
    >
      {status === "loading" ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Copying...
        </>
      ) : status === "success" ? (
        <>
          <Check className="w-4 h-4 text-green-500" />
          Copied
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          Copy source
        </>
      )}
    </Button>
  );
}

export default CopySourceButton;

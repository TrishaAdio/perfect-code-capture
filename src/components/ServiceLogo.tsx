import { useState } from "react";
import { Package } from "lucide-react";
import { resolveImageUrl } from "@/lib/api";
import { getBrandArt } from "@/lib/brandLogos";

/**
 * Renders a product image with smart fallback to recognizable brand artwork
 * when the source is missing or fails to load.
 */
export function ServiceLogo({
  src,
  name,
  className,
  iconClass,
  rounded = "rounded-xl",
}: {
  src?: string | null;
  name?: string | null;
  className?: string;
  iconClass?: string;
  rounded?: string;
}) {
  const [failed, setFailed] = useState(false);
  const brand = getBrandArt(name);

  // Prefer admin-uploaded image when available.
  if (src && !failed) {
    return (
      <img
        src={resolveImageUrl(src)}
        alt={name || "Service"}
        loading="lazy"
        decoding="async"
        className={className}
        onError={() => setFailed(true)}
      />
    );
  }

  // Brand fallback — official-style logo on tinted background.
  if (brand) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center ${rounded}`}
        style={{ backgroundColor: brand.bg }}
      >
        <img
          src={brand.url}
          alt={name || brand.name}
          loading="lazy"
          decoding="async"
          className="h-[58%] w-[58%] object-contain"
        />
      </div>
    );
  }

  // Last-resort generic icon.
  return (
    <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
      <Package className={iconClass ?? "h-5 w-5"} />
    </div>
  );
}

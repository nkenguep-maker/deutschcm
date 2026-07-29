import type { CSSProperties } from "react";

type Props = {
  height?: number | string;
  width?: number | string;
  rounded?: number | string;
  className?: string;
  style?: CSSProperties;
};

export function DashboardSkeleton({
  height = 16,
  width = "100%",
  rounded = 8,
  className,
  style,
}: Props) {
  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        height,
        width,
        borderRadius: rounded,
        background:
          "linear-gradient(90deg, var(--yema-surface) 0%, var(--yema-surface-2) 50%, var(--yema-surface) 100%)",
        backgroundSize: "200% 100%",
        animation: "yema-skeleton 1.4s ease-in-out infinite",
        ...style,
      }}
    >
      <style>{`
        @keyframes yema-skeleton {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-yema-shell] div[aria-hidden="true"] { animation: none; }
        }
      `}</style>
    </div>
  );
}

import type { AnchorHTMLAttributes, ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import Link from "next/link";
import type { LinkProps } from "next/link";

type Variant = "primary" | "secondary" | "ghost";

type Common = {
  variant?: Variant;
  size?: "sm" | "md";
  leadingIcon?: ReactNode;
  children: ReactNode;
};

function style(variant: Variant, size: "sm" | "md"): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: "var(--yema-r-pill)",
    fontFamily: "inherit",
    fontWeight: 600,
    lineHeight: 1.2,
    cursor: "pointer",
    textDecoration: "none",
    transition: "background var(--yema-dur-touch) var(--yema-ease-glide), color var(--yema-dur-touch) var(--yema-ease-glide)",
    padding: size === "sm" ? "8px 14px" : "10px 18px",
    fontSize: size === "sm" ? 13 : 14,
    minHeight: 40,
  };
  if (variant === "primary") {
    return {
      ...base,
      background: "var(--yema-gold)",
      color: "#1a1108",
      border: "1px solid var(--yema-gold-dark)",
    };
  }
  if (variant === "secondary") {
    return {
      ...base,
      background: "transparent",
      color: "var(--yema-gold-light)",
      border: "1px solid var(--yema-gold-edge)",
    };
  }
  return {
    ...base,
    background: "transparent",
    color: "var(--yema-text-muted)",
    border: "1px solid transparent",
  };
}

type ButtonProps = Common & ButtonHTMLAttributes<HTMLButtonElement>;

export function DashboardButton({
  variant = "primary",
  size = "md",
  leadingIcon,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button {...rest} style={{ ...style(variant, size), ...(rest.style ?? {}) }}>
      {leadingIcon}
      {children}
    </button>
  );
}

type ButtonLinkProps = Common & LinkProps & {
  className?: string;
  style?: CSSProperties;
} & Pick<AnchorHTMLAttributes<HTMLAnchorElement>, "aria-label" | "title"> & {
  "data-testid"?: string;
};

export function DashboardButtonLink({
  variant = "primary",
  size = "md",
  leadingIcon,
  children,
  className,
  style: styleOverride,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link {...rest} className={className} style={{ ...style(variant, size), ...(styleOverride ?? {}) }}>
      {leadingIcon}
      {children}
    </Link>
  );
}

import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cx } from "@src/ui/utils/index.ts";

import styles from "./styles.module.css";

type ButtonVariant = "primary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "icon-sm" | "icon-md";

const sizeClass: Record<ButtonSize, string> = {
  sm: styles.sm,
  md: styles.md,
  "icon-sm": styles.iconSm,
  "icon-md": styles.iconMd,
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(styles.button, styles[variant], sizeClass[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** shadcn/ui-style Button (hand-written to the shadcn pattern, MIT), themed with Kaasu tokens. */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold select-none transition-[background-color,color,box-shadow,transform] duration-150 ease-out active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-brand text-on-brand hover:brightness-110 shadow-[0_8px_20px_-12px_var(--brand)]",
        accent: "bg-accent text-on-accent hover:brightness-105",
        outline: "border border-rule-strong bg-paper text-ink hover:bg-paper-2",
        ghost: "text-ink hover:bg-paper-2",
        danger: "bg-danger text-paper hover:brightness-110",
        "danger-outline": "border border-danger/50 text-danger hover:bg-danger-soft",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-11 px-4",
        lg: "h-12 px-5 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, type = "button", ...props }, ref) => (
  <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
));
Button.displayName = "Button";

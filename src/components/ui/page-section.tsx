import * as React from "react";
import { cn } from "@/lib/utils";
interface PageSectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}
const PageSection = React.forwardRef<HTMLElement, PageSectionProps>(({
  className,
  children,
  ...props
}, ref) => <section ref={ref} className={cn("bg-card rounded-lg border border-border", className)} {...props}>
      {children}
    </section>);
PageSection.displayName = "PageSection";
interface PageSectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}
const PageSectionHeader = React.forwardRef<HTMLDivElement, PageSectionHeaderProps>(({
  className,
  children,
  ...props
}, ref) => <div ref={ref} className={cn("flex items-center justify-between px-6 pt-6 pb-4 border-b border-border", className)} {...props}>
      {children}
    </div>);
PageSectionHeader.displayName = "PageSectionHeader";
interface PageSectionTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  unwrapped?: boolean;
}
const PageSectionTitle = React.forwardRef<HTMLHeadingElement, PageSectionTitleProps>(({
  className,
  children,
  unwrapped = false,
  ...props
}, ref) => {
  const heading = <h2 ref={ref} className={cn("text-lg font-medium text-foreground", className)} {...props}>
      {children}
    </h2>;
  if (unwrapped) {
    return heading;
  }
  return <div className="pt-6">{heading}</div>;
});
PageSectionTitle.displayName = "PageSectionTitle";
interface PageSectionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}
const PageSectionContent = React.forwardRef<HTMLDivElement, PageSectionContentProps>(({
  className,
  children,
  ...props
}, ref) => <div ref={ref} className={cn("pb-6", className)} {...props}>
      {children}
    </div>);
PageSectionContent.displayName = "PageSectionContent";
export { PageSection, PageSectionHeader, PageSectionTitle, PageSectionContent };
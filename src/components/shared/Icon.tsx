import React from "react";
import * as LucideIcons from "lucide-react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: string;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 20, className = "", ...props }: IconProps) {
  // @ts-expect-error - dynamic key lookup for lucide icons
  const Component = LucideIcons[name] || LucideIcons.Wrench;
  return <Component size={size} className={className} {...props} />;
}

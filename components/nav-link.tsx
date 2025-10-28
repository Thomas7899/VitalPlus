"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function NavLink({ href, children, className }: NavLinkProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");

  const isActive = pathname === href;
  const finalHref = userId ? `${href}?userId=${userId}` : href;

  return (
    <Link href={finalHref} className={cn(className, isActive && "font-bold")}>
      {children}
    </Link>
  );
}
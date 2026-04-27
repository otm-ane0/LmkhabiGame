import { gsap } from "gsap";
import { ReactNode, useEffect, useRef } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

const PageShell = ({ children, className = "" }: Props) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
    );
  }, []);

  return (
    <div
      ref={ref}
      className={`min-h-screen w-full px-4 py-6 sm:px-6 sm:py-10 flex flex-col items-center ${className}`}
    >
      {children}
    </div>
  );
};

export default PageShell;

import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import homeBg from '../assets/home_bg.png';

export function Container({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-contain bg-center bg-no-repeat py-[18px] px-[38px] text-white bg-[#04121b]" style={{ backgroundImage: `url(${homeBg})` }}>
      {children}
    </div>
  );
}

export function Navbar({ children }: { children: ReactNode }) {
  return (
    <nav className="flex items-center gap-4 p-4 mb-6">
      {children}
    </nav>
  );
}

export function NavbarItem({ href, children }: { href: string; children: ReactNode }) {
  return (
    <NavLink
      to={href}
      className={({ isActive }) =>
        `px-4 py-2 rounded-lg transition-colors ${
          isActive
            ? 'bg-white/20 text-white font-semibold'
            : 'hover:bg-white/10 text-gray-300'
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export function NavbarSection({ children }: { children: ReactNode }) {
  return <div className="flex gap-4">{children}</div>;
}

export function NavbarDivider() {
  return <div className="mx-2 border-l border-gray-300 h-6" />;
}

export function Logo({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return <img src={src} alt={alt} className={className} />;
}

import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
  hideNav?: boolean;
  hideFooter?: boolean;
}

export const Layout = ({ children, hideNav = false, hideFooter = false }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      {!hideNav && <Navbar />}
      <main className="flex-1">
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
};

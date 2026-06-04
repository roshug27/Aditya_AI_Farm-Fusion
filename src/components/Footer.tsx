import { Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-6">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-muted-foreground text-sm flex items-center justify-center gap-1.5">
          Built with <Heart size={14} className="text-red-500 fill-red-500 animate-pulse" /> by{' '}
          <span className="font-semibold text-foreground">Aditya.G</span>
        </p>
        <p className="text-muted-foreground/60 text-xs mt-1">
          © {new Date().getFullYear()} FarmFusion. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;

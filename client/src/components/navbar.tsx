import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useScroll } from "@/hooks/use-scroll";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { scrollY } = useScroll();
  const isScrolled = scrollY > 50;

  const navItems = [
    { href: "#home", label: "Home" },
    { href: "#problem", label: "Problem" },
    { href: "#solution", label: "Solution" },
    { href: "#features", label: "Features" },
    { href: "#prototype", label: "Prototype" },
    { href: "#impact", label: "Impact" },
    { href: "#contact", label: "Contact" },
  ];

  const handleNavClick = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      const offsetTop = element.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
    setIsOpen(false);
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
        isScrolled && "navbar-scrolled"
      )}
      data-testid="navbar"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div 
            className="flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <i className="fas fa-globe-americas text-primary text-2xl" />
            <span className="font-heading font-bold text-xl text-foreground">FRA ACT</span>
          </motion.div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item, index) => (
              <motion.button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                className="text-foreground hover:text-primary transition-colors duration-300"
                whileHover={{ y: -2 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                data-testid={`nav-link-${item.label.toLowerCase()}`}
              >
                {item.label}
              </motion.button>
            ))}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <motion.button
              onClick={() => setIsOpen(!isOpen)}
              className="text-foreground hover:text-primary p-2"
              whileTap={{ scale: 0.9 }}
              data-testid="mobile-menu-button"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </motion.button>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="md:hidden overflow-hidden bg-card border-t border-border"
        data-testid="mobile-menu"
      >
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navItems.map((item) => (
            <motion.button
              key={item.href}
              onClick={() => handleNavClick(item.href)}
              className="block w-full text-left px-3 py-2 text-foreground hover:text-primary transition-colors duration-300"
              whileHover={{ x: 4 }}
              data-testid={`mobile-nav-link-${item.label.toLowerCase()}`}
            >
              {item.label}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.nav>
  );
}

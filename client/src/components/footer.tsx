import { motion } from "framer-motion";

export default function Footer() {
  const footerLinks = [
    { href: "#", label: "Privacy Policy" },
    { href: "#", label: "Terms of Service" },
    { href: "#", label: "Documentation" }
  ];

  return (
    <footer className="bg-primary text-primary-foreground py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="flex items-center justify-center space-x-3 mb-4"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <i className="fas fa-globe-americas text-2xl" />
            <span className="font-heading font-bold text-xl">FRA ACT</span>
          </motion.div>
          <p className="text-primary-foreground/80 mb-6">AI Powered Dashboard for Forest Resource Assessment</p>
          <div className="flex justify-center space-x-6 text-sm">
            {footerLinks.map((link, index) => (
              <motion.a
                key={index}
                href={link.href}
                className="hover:text-primary-foreground/60 transition-colors duration-300"
                whileHover={{ y: -2 }}
                data-testid={`footer-link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {link.label}
              </motion.a>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-primary-foreground/20">
            <p className="text-primary-foreground/60 text-sm">© 2024 FRA ACT. Built for the future of forest management.</p>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}

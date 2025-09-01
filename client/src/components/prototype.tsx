import { motion } from "framer-motion";

export default function Prototype() {
  const handleViewDashboard = () => {
    // In a real application, this would open the actual dashboard
    window.open('#', '_blank');
  };

  return (
    <section id="prototype" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-heading font-bold text-4xl md:text-5xl text-foreground mb-6">Live Prototype</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Experience the AI-powered WebGIS Decision Support System for transparent FRA monitoring
          </p>
        </motion.div>
        
        <motion.div 
          className="bg-card rounded-2xl shadow-2xl overflow-hidden border border-border"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          whileHover={{ y: -4 }}
        >
          <div className="bg-muted p-4 flex items-center space-x-2">
            <div className="w-3 h-3 bg-destructive rounded-full" />
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <div className="flex-1 text-center">
              <span className="text-sm text-muted-foreground font-mono">dashboard.fra-act.com</span>
            </div>
          </div>
          
          <div className="aspect-video bg-gradient-to-br from-primary/5 to-secondary/10 flex items-center justify-center">
            <motion.div 
              className="text-center p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <motion.i 
                className="fas fa-play-circle text-6xl text-primary mb-4 block"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
              />
              <h3 className="font-heading font-semibold text-2xl text-card-foreground mb-2">Interactive Dashboard Demo</h3>
              <p className="text-muted-foreground mb-6">Click below to explore the live prototype</p>
              
              <motion.button
                onClick={handleViewDashboard}
                className="ripple bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-semibold transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                data-testid="view-dashboard-button"
              >
                <i className="fas fa-external-link-alt mr-2" />
                View Live Dashboard
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

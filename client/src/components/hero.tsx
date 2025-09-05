import { motion } from "framer-motion";

export default function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const handleExploreClick = () => {
    window.location.href = '/community';
  };

  return (
    <section id="home" className="min-h-screen hero-gradient flex items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div 
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')",
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
          className="w-full h-full"
        />
      </div>
      
      <motion.div
        className="relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="animate-float">
          <motion.i 
            className="fas fa-globe-americas text-6xl md:text-8xl text-primary mb-6 block"
            variants={itemVariants}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>
        
        <motion.h1 
          className="font-heading font-bold text-4xl md:text-6xl lg:text-7xl text-foreground mb-6"
          variants={itemVariants}
        >
          FRA ACT
        </motion.h1>
        
        <motion.h2 
          className="font-heading font-medium text-2xl md:text-3xl lg:text-4xl text-muted-foreground mb-8"
          variants={itemVariants}
        >
          AI Powered Dashboard
        </motion.h2>
        
        <motion.p 
          className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
          variants={itemVariants}
        >
          AI-powered WebGIS Decision Support System for transparent, real-time monitoring of Forest Rights Act implementation across tribal communities.
        </motion.p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.button
            onClick={handleExploreClick}
            className="ripple bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl animate-glow"
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            data-testid="explore-dashboard-button"
          >
            <i className="fas fa-chart-line mr-2" />
            Explore Dashboard
          </motion.button>
          
          <motion.a
            href="/claim-form"
            className="ripple bg-secondary hover:bg-secondary/90 text-secondary-foreground px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl"
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            data-testid="submit-claim-button"
          >
            <i className="fas fa-file-alt mr-2" />
            Submit FRA Claim
          </motion.a>
        </div>
      </motion.div>
    </section>
  );
}

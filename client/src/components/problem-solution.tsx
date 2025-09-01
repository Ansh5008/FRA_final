import { motion } from "framer-motion";

export default function ProblemSolution() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  };

  const slideInLeft = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  const slideInRight = {
    hidden: { opacity: 0, x: 50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="grid md:grid-cols-2 gap-12 lg:gap-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {/* Problem Section */}
          <motion.div className="space-y-6" variants={slideInLeft}>
            <div id="problem" className="flex items-center space-x-3 mb-6">
              <motion.i 
                className="fas fa-exclamation-triangle text-3xl text-destructive"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground">The Problem</h2>
            </div>
            
            <motion.div 
              className="bg-card p-8 rounded-xl shadow-lg border border-border hover:shadow-xl transition-shadow duration-300"
              whileHover={{ y: -4 }}
            >
              <div className="space-y-4">
                <motion.div 
                  className="flex items-start space-x-3"
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.3 }}
                >
                  <i className="fas fa-chart-line-down text-destructive text-xl mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg text-card-foreground mb-2">Fragmented Data Sources</h3>
                    <p className="text-muted-foreground">Forest resource data scattered across multiple agencies with no unified view.</p>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex items-start space-x-3"
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.3 }}
                >
                  <i className="fas fa-clock text-destructive text-xl mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg text-card-foreground mb-2">Manual Reporting</h3>
                    <p className="text-muted-foreground">Time-consuming manual processes lead to delays in critical decision-making.</p>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex items-start space-x-3"
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.3 }}
                >
                  <i className="fas fa-eye-slash text-destructive text-xl mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg text-card-foreground mb-2">Limited Visibility</h3>
                    <p className="text-muted-foreground">Lack of real-time insights into forest health and resource allocation.</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>

          {/* Solution Section */}
          <motion.div className="space-y-6" variants={slideInRight}>
            <div id="solution" className="flex items-center space-x-3 mb-6">
              <motion.i 
                className="fas fa-lightbulb text-3xl text-primary"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground">Our Solution</h2>
            </div>
            
            <motion.div 
              className="bg-card p-8 rounded-xl shadow-lg border border-border hover:shadow-xl transition-shadow duration-300"
              whileHover={{ y: -4 }}
            >
              <div className="space-y-4">
                <motion.div 
                  className="flex items-start space-x-3"
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.3 }}
                >
                  <i className="fas fa-brain text-primary text-xl mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg text-card-foreground mb-2">AI-Powered Integration</h3>
                    <p className="text-muted-foreground">Intelligent data aggregation from multiple sources with automated processing.</p>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex items-start space-x-3"
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.3 }}
                >
                  <i className="fas fa-tachometer-alt text-primary text-xl mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg text-card-foreground mb-2">Real-Time Dashboard</h3>
                    <p className="text-muted-foreground">Live updates and interactive visualizations for immediate insights.</p>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex items-start space-x-3"
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.3 }}
                >
                  <i className="fas fa-chart-area text-primary text-xl mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg text-card-foreground mb-2">Predictive Analytics</h3>
                    <p className="text-muted-foreground">Machine learning algorithms predict trends and optimize resource allocation.</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

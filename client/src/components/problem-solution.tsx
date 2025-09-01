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
                  <i className="fas fa-file-alt text-destructive text-xl mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg text-card-foreground mb-2">Scattered Claims & Maps</h3>
                    <p className="text-muted-foreground">FRA claims and land records distributed across departments with no unified tracking system.</p>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex items-start space-x-3"
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.3 }}
                >
                  <i className="fas fa-clock text-destructive text-xl mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg text-card-foreground mb-2">Manual Processing Delays</h3>
                    <p className="text-muted-foreground">Paper-based tracking leads to delays, disputes, and duplication in claim processing.</p>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex items-start space-x-3"
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.3 }}
                >
                  <i className="fas fa-question-circle text-destructive text-xl mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg text-card-foreground mb-2">No Transparency</h3>
                    <p className="text-muted-foreground">Tribal families remain uncertain about their claim status with no real-time monitoring.</p>
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
                  <i className="fas fa-robot text-primary text-xl mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg text-card-foreground mb-2">AI Anomaly Detection</h3>
                    <p className="text-muted-foreground">Intelligent detection of duplicate, fraudulent, or delayed claims with automated alerts.</p>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex items-start space-x-3"
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.3 }}
                >
                  <i className="fas fa-map-marked-alt text-primary text-xl mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg text-card-foreground mb-2">WebGIS Decision Support</h3>
                    <p className="text-muted-foreground">Interactive GIS dashboards with village to state level visualization and monitoring.</p>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex items-start space-x-3"
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.3 }}
                >
                  <i className="fas fa-users text-primary text-xl mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg text-card-foreground mb-2">Beneficiary Transparency</h3>
                    <p className="text-muted-foreground">Real-time updates via SMS, notice boards, and Gram Sabha meetings for tribal communities.</p>
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

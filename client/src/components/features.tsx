import { motion } from "framer-motion";

export default function Features() {
  const features = [
    {
      icon: "fas fa-chart-bar",
      title: "Real-Time Monitoring",
      subtitle: "Live claim tracking",
      description: "Monitor FRA claims and approvals in real-time with comprehensive dashboards showing progress from village to state level."
    },
    {
      icon: "fas fa-robot",
      title: "AI Anomaly Detection",
      subtitle: "Smart fraud prevention",
      description: "Advanced AI algorithms detect duplicate, fraudulent, or delayed claims, ensuring transparent and efficient FRA implementation."
    },
    {
      icon: "fas fa-map-marked-alt",
      title: "WebGIS Dashboards",
      subtitle: "Interactive mapping",
      description: "Interactive GIS visualization with layered mapping from village to district to state level, showing claim boundaries and disputes."
    },
    {
      icon: "fas fa-bell",
      title: "Smart Alert System",
      subtitle: "Proactive notifications",
      description: "Intelligent alerts for anomalies, disputes, unusual delays, and automated notifications to beneficiaries via multiple channels."
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <section id="features" className="py-20 bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-heading font-bold text-4xl md:text-5xl text-foreground mb-6">Key Features</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            AI-powered tools designed to revolutionize Forest Rights Act implementation with transparency and intelligence
          </p>
        </motion.div>
        
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="feature-card h-64 group"
              variants={cardVariants}
              data-testid={`feature-card-${index}`}
            >
              <div className="feature-card-inner relative w-full h-full">
                {/* Front of card */}
                <div className="feature-card-front absolute inset-0 bg-card rounded-xl p-6 flex flex-col items-center justify-center text-center border border-border shadow-lg">
                  <motion.i 
                    className={`${feature.icon} text-5xl text-primary mb-4`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                  />
                  <h3 className="font-heading font-semibold text-xl text-card-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.subtitle}</p>
                </div>
                
                {/* Back of card */}
                <div className="feature-card-back absolute inset-0 bg-primary rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-lg">
                  <p className="text-primary-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

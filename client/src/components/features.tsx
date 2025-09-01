import { motion } from "framer-motion";

export default function Features() {
  const features = [
    {
      icon: "fas fa-chart-bar",
      title: "Data Analytics",
      subtitle: "Advanced reporting",
      description: "Comprehensive data visualization and reporting tools that transform raw forest data into actionable insights for better decision-making."
    },
    {
      icon: "fas fa-robot",
      title: "AI Integration",
      subtitle: "Smart automation",
      description: "Machine learning algorithms automatically process satellite imagery and sensor data to detect patterns and predict forest health trends."
    },
    {
      icon: "fas fa-map-marked-alt",
      title: "GIS Mapping",
      subtitle: "Interactive maps",
      description: "Interactive geographical information systems with real-time overlays showing forest coverage, fire risks, and resource distribution."
    },
    {
      icon: "fas fa-bell",
      title: "Alert System",
      subtitle: "Real-time notifications",
      description: "Intelligent alert system that notifies stakeholders of critical changes in forest conditions, policy updates, and resource availability."
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
            Comprehensive tools designed to transform forest resource management through intelligent automation
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

import { motion } from "framer-motion";
import { useCounter } from "@/hooks/use-counter";

export default function Impact() {
  const stats = [
    { icon: "fas fa-map", target: 4, label: "States Piloted" },
    { icon: "fas fa-file-alt", target: 25000, label: "Claims Tracked" },
    { icon: "fas fa-clock", target: 80, label: "% Faster Processing" },
    { icon: "fas fa-users", target: 150000, label: "Beneficiaries Served" }
  ];

  const benefits = [
    {
      icon: "fas fa-balance-scale",
      title: "Transparent Governance",
      description: "Real-time monitoring ensures accountability and reduces corruption in FRA implementation."
    },
    {
      icon: "fas fa-users-cog",
      title: "Empowered Communities",
      description: "Tribal families get instant updates on claim status through multiple communication channels."
    },
    {
      icon: "fas fa-tachometer-alt",
      title: "Faster Processing",
      description: "AI-powered automation reduces claim processing time from months to weeks."
    },
    {
      icon: "fas fa-expand-arrows-alt",
      title: "Scalable Solution",
      description: "Framework can extend beyond FRA to other land rights and welfare schemes nationwide."
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

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <section id="impact" className="py-20 bg-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-heading font-bold text-4xl md:text-5xl text-foreground mb-6">Project Impact</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Demonstrable impact in improving FRA implementation transparency and tribal community empowerment
          </p>
        </motion.div>
        
        {/* Statistics Grid */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} index={index} />
          ))}
        </motion.div>
        
        {/* Benefits Grid */}
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              className="bg-card p-6 rounded-xl shadow-lg border border-border hover:shadow-xl transition-all duration-300"
              variants={itemVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              data-testid={`benefit-card-${index}`}
            >
              <motion.i 
                className={`${benefit.icon} text-3xl text-primary mb-4 block`}
                whileHover={{ scale: 1.2, rotate: 10 }}
                transition={{ duration: 0.3 }}
              />
              <h3 className="font-heading font-semibold text-lg text-card-foreground mb-3">{benefit.title}</h3>
              <p className="text-muted-foreground">{benefit.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function StatCard({ icon, target, label, index }: { icon: string; target: number; label: string; index: number }) {
  const count = useCounter(target);

  return (
    <motion.div 
      className="text-center"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
    >
      <motion.div 
        className="bg-card p-6 rounded-xl shadow-lg border border-border hover:shadow-xl transition-shadow duration-300"
        whileHover={{ y: -4, scale: 1.02 }}
        data-testid={`stat-card-${index}`}
      >
        <motion.i 
          className={`${icon} text-3xl text-primary mb-4 block`}
          whileHover={{ scale: 1.2, rotate: 10 }}
          transition={{ duration: 0.3 }}
        />
        <div className="text-3xl font-heading font-bold text-foreground mb-2" data-testid={`counter-${index}`}>
          {count}
        </div>
        <p className="text-muted-foreground font-medium">{label}</p>
      </motion.div>
    </motion.div>
  );
}

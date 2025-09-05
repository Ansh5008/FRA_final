import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  organization: z.string().min(2, "Organization must be at least 2 characters"),
  message: z.string().min(10, "Message must be at least 10 characters")
});

type ContactForm = z.infer<typeof contactSchema>;

export default function Contact() {
  const { toast } = useToast();
  
  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      organization: "",
      message: ""
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (data: ContactForm) => {
      const response = await apiRequest('POST', '/api/contact', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message sent successfully!",
        description: "We'll get back to you within 24 hours.",
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: ContactForm) => {
    submitMutation.mutate(data);
  };

  const socialLinks = [
    { icon: "fab fa-github", href: "https://github.com/Ansh5008/FRA_final", label: "GitHub" },
    { icon: "fab fa-linkedin", href: "https://linkedin.com/company/vantrix", label: "LinkedIn" },
    { icon: "fab fa-twitter", href: "https://twitter.com/vantrixtech", label: "Twitter" },
    { icon: "fas fa-globe", href: "https://vantrix.tech", label: "Website" }
  ];

  const contactInfo = [
    { icon: "fas fa-envelope", label: "Email", value: "team@vantrix.tech" },
    { icon: "fas fa-phone", label: "Phone", value: "+91 98765 43210" },
    { icon: "fas fa-map-marker-alt", label: "Address", value: "Bengaluru, India" }
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

  const slideInRight = {
    hidden: { opacity: 0, x: 50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const slideInLeft = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <section id="contact" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-heading font-bold text-4xl md:text-5xl text-foreground mb-6">Get In Touch</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Ready to transform FRA implementation with AI and transparency? Contact Team Vantrix to discuss how FRA ACT can empower tribal communities and improve governance.
          </p>
        </motion.div>
        
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div 
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <motion.div variants={slideInRight}>
                <Label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  className="w-full"
                  {...form.register("name")}
                  data-testid="input-name"
                />
                {form.formState.errors.name && (
                  <p className="text-destructive text-sm mt-1">{form.formState.errors.name.message}</p>
                )}
              </motion.div>
              
              <motion.div variants={slideInRight}>
                <Label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="w-full"
                  {...form.register("email")}
                  data-testid="input-email"
                />
                {form.formState.errors.email && (
                  <p className="text-destructive text-sm mt-1">{form.formState.errors.email.message}</p>
                )}
              </motion.div>
              
              <motion.div variants={slideInRight}>
                <Label htmlFor="organization" className="block text-sm font-medium text-foreground mb-2">
                  Organization
                </Label>
                <Input
                  id="organization"
                  type="text"
                  placeholder="Your organization"
                  className="w-full"
                  {...form.register("organization")}
                  data-testid="input-organization"
                />
                {form.formState.errors.organization && (
                  <p className="text-destructive text-sm mt-1">{form.formState.errors.organization.message}</p>
                )}
              </motion.div>
              
              <motion.div variants={slideInRight}>
                <Label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                  Message
                </Label>
                <Textarea
                  id="message"
                  rows={5}
                  placeholder="Tell us about your FRA implementation challenges and community needs"
                  className="w-full resize-none"
                  {...form.register("message")}
                  data-testid="textarea-message"
                />
                {form.formState.errors.message && (
                  <p className="text-destructive text-sm mt-1">{form.formState.errors.message.message}</p>
                )}
              </motion.div>
              
              <motion.div variants={slideInRight}>
                <Button
                  type="submit"
                  className="ripple w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-lg font-semibold"
                  disabled={submitMutation.isPending}
                  data-testid="button-submit"
                >
                  <i className="fas fa-paper-plane mr-2" />
                  {submitMutation.isPending ? "Sending..." : "Send Message"}
                </Button>
              </motion.div>
            </form>
          </motion.div>
          
          {/* Contact Information */}
          <motion.div 
            className="space-y-8"
            variants={slideInLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-card p-8 rounded-xl shadow-lg border border-border">
              <h3 className="font-heading font-semibold text-2xl text-card-foreground mb-6">Contact Information</h3>
              
              <div className="space-y-6">
                {contactInfo.map((info, index) => (
                  <motion.div 
                    key={index}
                    className="flex items-center space-x-4"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.3 }}
                    data-testid={`contact-info-${index}`}
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <i className={`${info.icon} text-primary text-xl`} />
                    </div>
                    <div>
                      <p className="font-medium text-card-foreground">{info.label}</p>
                      <p className="text-muted-foreground">{info.value}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            
            {/* Social Links */}
            <div className="bg-card p-8 rounded-xl shadow-lg border border-border">
              <h3 className="font-heading font-semibold text-xl text-card-foreground mb-6">Follow Our Progress</h3>
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.href}
                    className="w-12 h-12 bg-primary/10 hover:bg-primary hover:text-primary-foreground rounded-lg flex items-center justify-center transition-all duration-300"
                    whileHover={{ scale: 1.1, rotate: 12 }}
                    whileTap={{ scale: 0.9 }}
                    data-testid={`social-link-${social.label.toLowerCase()}`}
                  >
                    <i className={`${social.icon} text-xl`} />
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

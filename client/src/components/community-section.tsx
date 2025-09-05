import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  CheckCircle, 
  Clock, 
  XCircle,
  MapPin,
  TrendingUp,
  Eye,
  Calendar
} from "lucide-react";

export default function CommunitySection() {
  const communityStats = [
    {
      title: "Total Claims",
      value: "1,247",
      change: "+12%",
      icon: <Users className="w-5 h-5" />,
      color: "text-blue-600"
    },
    {
      title: "Approved Claims", 
      value: "892",
      change: "+8%",
      icon: <CheckCircle className="w-5 h-5" />,
      color: "text-green-600"
    },
    {
      title: "Pending Reviews",
      value: "234",
      change: "-5%", 
      icon: <Clock className="w-5 h-5" />,
      color: "text-yellow-600"
    },
    {
      title: "Communities Served",
      value: "89",
      change: "+15%",
      icon: <MapPin className="w-5 h-5" />,
      color: "text-purple-600"
    }
  ];

  const recentActivities = [
    {
      village: "Bansjore",
      activity: "New FRA claim submitted",
      time: "2 hours ago",
      status: "pending",
      claimId: "FRA12456"
    },
    {
      village: "Khunti",
      activity: "Claim approved by district collector", 
      time: "4 hours ago",
      status: "approved",
      claimId: "FRA12443"
    },
    {
      village: "Gumla",
      activity: "Document verification completed",
      time: "6 hours ago", 
      status: "pending",
      claimId: "FRA12421"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <section id="community" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-heading font-bold text-4xl md:text-5xl text-foreground mb-6">
            Community Dashboard
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Real-time insights into FRA implementation across tribal communities with transparent tracking and community engagement
          </p>
        </motion.div>

        {/* Community Stats */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {communityStats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
            >
              <Card className="border-border hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg bg-background ${stat.color}`}>
                      {stat.icon}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {stat.change}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-2xl text-foreground mb-1">
                    {stat.value}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {stat.title}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activities */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Recent Activities
                </CardTitle>
                <CardDescription>
                  Latest updates from community claims and approvals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <motion.div 
                      key={activity.claimId}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <div className={`p-1.5 rounded-full ${getStatusColor(activity.status)}`}>
                        {activity.status === 'approved' ? 
                          <CheckCircle className="w-3 h-3" /> : 
                          <Clock className="w-3 h-3" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {activity.village} - {activity.activity}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Claim ID: {activity.claimId} • {activity.time}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* FRA Workflow UML Diagram */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  FRA Processing Workflow
                </CardTitle>
                <CardDescription>
                  Complete claim processing flow from submission to approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative bg-gradient-to-br from-blue-50 to-green-50 p-6 rounded-lg">
                  {/* UML Workflow Diagram */}
                  <div className="space-y-4">
                    {/* Start Node */}
                    <div className="flex justify-center">
                      <div className="w-4 h-4 bg-green-500 rounded-full shadow-lg"></div>
                    </div>
                    
                    {/* Claim Submission */}
                    <div className="flex items-center gap-4">
                      <div className="w-1 h-8 bg-gray-300 mx-auto"></div>
                    </div>
                    <motion.div 
                      className="bg-blue-100 p-3 rounded-lg border-l-4 border-blue-500 shadow-sm"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-sm">Claim Submission</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Community submits FRA claim with documents</p>
                    </motion.div>

                    {/* Arrow */}
                    <div className="flex justify-center">
                      <div className="w-1 h-6 bg-gray-300"></div>
                    </div>

                    {/* AI Verification */}
                    <motion.div 
                      className="bg-purple-100 p-3 rounded-lg border-l-4 border-purple-500 shadow-sm"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-purple-600" />
                        <span className="font-medium text-sm">AI Document Verification</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Automated document validation & anomaly detection</p>
                    </motion.div>

                    {/* Arrow */}
                    <div className="flex justify-center">
                      <div className="w-1 h-6 bg-gray-300"></div>
                    </div>

                    {/* Field Verification */}
                    <motion.div 
                      className="bg-yellow-100 p-3 rounded-lg border-l-4 border-yellow-500 shadow-sm"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-yellow-600" />
                        <span className="font-medium text-sm">Field Verification</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">GPS verification & community validation</p>
                    </motion.div>

                    {/* Arrow */}
                    <div className="flex justify-center">
                      <div className="w-1 h-6 bg-gray-300"></div>
                    </div>

                    {/* Decision Diamond */}
                    <div className="flex justify-center">
                      <motion.div 
                        className="w-12 h-12 bg-orange-200 border-2 border-orange-500 transform rotate-45 flex items-center justify-center"
                        whileHover={{ scale: 1.1 }}
                      >
                        <span className="transform -rotate-45 text-xs font-bold text-orange-700">?</span>
                      </motion.div>
                    </div>

                    {/* Final States */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <motion.div 
                        className="bg-green-100 p-2 rounded-lg border-l-4 border-green-500 shadow-sm"
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span className="font-medium text-xs">Approved</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Rights granted</p>
                      </motion.div>
                      
                      <motion.div 
                        className="bg-red-100 p-2 rounded-lg border-l-4 border-red-500 shadow-sm"
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-red-600" />
                          <span className="font-medium text-xs">Rejected</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Need revision</p>
                      </motion.div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <Button className="w-full" variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View Full Process Flow
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
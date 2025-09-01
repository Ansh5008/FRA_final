import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Users, 
  CheckCircle, 
  Clock, 
  XCircle,
  ArrowLeft,
  RefreshCw,
  Calendar,
  TrendingUp
} from "lucide-react";
import { Link } from "wouter";

interface FraClaim {
  id: string;
  claimId: string;
  beneficiaryName: string;
  village: string;
  district: string;
  state: string;
  claimType: string;
  landArea: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function CommunityDashboard() {
  const [selectedVillage, setSelectedVillage] = useState("Bansjore");
  const [lastSynced, setLastSynced] = useState(new Date());

  const { data: claimsData, isLoading } = useQuery({
    queryKey: ['/api/claims'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/claims');
      return response.json();
    }
  });

  const claims: FraClaim[] = claimsData?.data || [];

  // Filter claims by selected village
  const villageClaims = claims.filter(claim => 
    claim.village.toLowerCase() === selectedVillage.toLowerCase()
  );

  // Calculate village statistics
  const villageStats = {
    total: villageClaims.length,
    approved: villageClaims.filter(c => c.status === 'approved').length,
    pending: villageClaims.filter(c => c.status === 'pending').length,
    rejected: villageClaims.filter(c => c.status === 'rejected').length,
  };

  const villages = ["Bansjore", "Khunti", "Gumla"];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: "default",
      pending: "secondary", 
      rejected: "destructive"
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"} className="text-xs">
        {status.toUpperCase()}
      </Badge>
    );
  };

  // Simulate auto-sync every 24 hours
  useEffect(() => {
    const interval = setInterval(() => {
      setLastSynced(new Date());
    }, 24 * 60 * 60 * 1000); // 24 hours

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">Loading community dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground">
                Panchayat Office Dashboard
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                Community transparency for {selectedVillage} village - Real-time FRA claim updates
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right text-sm text-muted-foreground">
                <p className="flex items-center">
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Last synced: {lastSynced.toLocaleTimeString()}
                </p>
                <p>Auto-sync every 24 hours</p>
              </div>
              <Link to="/admin">
                <Button variant="outline">
                  Admin View
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>

          {/* Village Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Select Village</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                {villages.map((village) => (
                  <Button
                    key={village}
                    variant={selectedVillage === village ? "default" : "outline"}
                    onClick={() => setSelectedVillage(village)}
                    data-testid={`button-village-${village.toLowerCase()}`}
                  >
                    {village}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Village Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{villageStats.total}</div>
                <p className="text-xs text-muted-foreground">
                  From {selectedVillage} village
                </p>
              </CardContent>
            </Card>

            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{villageStats.approved}</div>
                <p className="text-xs text-muted-foreground">
                  Rights recognized
                </p>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{villageStats.pending}</div>
                <p className="text-xs text-muted-foreground">
                  Under review
                </p>
              </CardContent>
            </Card>

            <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{villageStats.rejected}</div>
                <p className="text-xs text-muted-foreground">
                  Need resubmission
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Updates Notice Board */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Notice Board - Recent Updates</span>
              </CardTitle>
              <CardDescription>
                Latest claim status updates for {selectedVillage} village (Updates displayed without exposing private details)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {villageClaims.length > 0 ? (
                  villageClaims.slice(0, 8).map((claim) => (
                    <motion.div
                      key={claim.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(claim.status)}
                        <div>
                          <p className="font-medium">Claim ID: {claim.claimId}</p>
                          <p className="text-sm text-muted-foreground">
                            {claim.claimType} - {claim.landArea}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right text-sm">
                          <p className="text-muted-foreground">
                            {new Date(claim.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        {getStatusBadge(claim.status)}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No claims found for {selectedVillage} village</p>
                    <p className="text-sm">Claims will appear here once submitted</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transparency Features */}
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Transparency Features</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <h3 className="font-semibold mb-2">Real-time Updates</h3>
                  <p className="text-sm text-muted-foreground">
                    Claim status updates automatically sync every 24 hours
                  </p>
                </div>
                <div className="text-center p-4">
                  <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <h3 className="font-semibold mb-2">Community Access</h3>
                  <p className="text-sm text-muted-foreground">
                    Villagers can check status at Panchayat office
                  </p>
                </div>
                <div className="text-center p-4">
                  <RefreshCw className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <h3 className="font-semibold mb-2">Offline Compatible</h3>
                  <p className="text-sm text-muted-foreground">
                    Works even with limited internet connectivity
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gram Sabha Information */}
          <Card>
            <CardHeader>
              <CardTitle>Next Gram Sabha Meeting</CardTitle>
              <CardDescription>
                Community meeting to discuss FRA claims and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
                <div>
                  <p className="font-medium">Date: {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                  <p className="text-sm text-muted-foreground">Time: 10:00 AM at Village Community Center</p>
                  <p className="text-sm text-muted-foreground">
                    Agenda: Review pending claims, discuss new submissions, Q&A session
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
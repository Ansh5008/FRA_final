import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MapPin, 
  BarChart3, 
  AlertTriangle, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle,
  Search,
  ArrowLeft,
  Eye,
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

export default function AdminDashboard() {
  const [searchClaimId, setSearchClaimId] = useState("");
  const [selectedClaim, setSelectedClaim] = useState<FraClaim | null>(null);

  const { data: claimsData, isLoading } = useQuery({
    queryKey: ['/api/claims'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/claims');
      return response.json();
    }
  });

  const claims: FraClaim[] = claimsData?.data || [];

  // Calculate statistics
  const stats = {
    total: claims.length,
    approved: claims.filter(c => c.status === 'approved').length,
    pending: claims.filter(c => c.status === 'pending').length,
    rejected: claims.filter(c => c.status === 'rejected').length,
    todaySubmissions: claims.filter(c => {
      const today = new Date().toDateString();
      return new Date(c.createdAt).toDateString() === today;
    }).length
  };

  // AI Alerts simulation
  const aiAlerts = [
    {
      type: "warning",
      title: "Duplicate Aadhaar Detected",
      description: "Claim FRA12346 has same Aadhaar number as FRA12234",
      priority: "high"
    },
    {
      type: "info", 
      title: "Unusual Delay",
      description: "Ranchi district showing 45% longer processing times",
      priority: "medium"
    },
    {
      type: "error",
      title: "High Rejection Rate",
      description: "Khunti block has 60% rejection rate this month",
      priority: "high"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: "default",
      pending: "secondary", 
      rejected: "destructive"
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status}
      </Badge>
    );
  };

  const searchClaim = () => {
    const claim = claims.find(c => c.claimId.toLowerCase().includes(searchClaimId.toLowerCase()));
    setSelectedClaim(claim || null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground">
                FRA ACT Admin Dashboard
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                Real-time monitoring and AI-powered insights for FRA implementation
              </p>
            </div>
            <div className="flex space-x-4">
              <Link to="/claim-form">
                <Button variant="outline">
                  Submit New Claim
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

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.todaySubmissions} submitted today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}% approval rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <p className="text-xs text-muted-foreground">
                  Avg. 18 days processing
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                <p className="text-xs text-muted-foreground">
                  Documentation issues
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">+80%</div>
                <p className="text-xs text-muted-foreground">
                  Faster processing
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">GIS Overview</TabsTrigger>
              <TabsTrigger value="claims">Claims List</TabsTrigger>
              <TabsTrigger value="alerts">AI Alerts</TabsTrigger>
              <TabsTrigger value="search">Claim Search</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5" />
                    <span>GIS Map View - State Hierarchy</span>
                  </CardTitle>
                  <CardDescription>
                    Interactive visualization from Village → District → State level
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-8 min-h-[400px] flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <MapPin className="w-16 h-16 text-primary mx-auto" />
                      <div>
                        <h3 className="text-xl font-semibold mb-2">Interactive GIS Map</h3>
                        <p className="text-muted-foreground mb-4">Color-coded claim visualization</p>
                        <div className="flex justify-center space-x-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span>Approved</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <span>Pending</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span>Rejected</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                            <span>Anomaly</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="claims" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Claims</CardTitle>
                  <CardDescription>
                    Latest FRA claim submissions with real-time status updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {claims.slice(0, 10).map((claim) => (
                      <div key={claim.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <p className="font-medium">{claim.claimId}</p>
                              <p className="text-sm text-muted-foreground">{claim.beneficiaryName}</p>
                            </div>
                            <div>
                              <p className="text-sm">{claim.village}, {claim.district}</p>
                              <p className="text-xs text-muted-foreground">{claim.claimType}</p>
                            </div>
                            <div>
                              <p className="text-sm">{claim.landArea}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(claim.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {getStatusBadge(claim.status)}
                          <Button variant="outline" size="sm" onClick={() => setSelectedClaim(claim)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span>AI-Powered Alerts</span>
                  </CardTitle>
                  <CardDescription>
                    Intelligent anomaly detection and automated monitoring
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {aiAlerts.map((alert, index) => (
                      <div key={index} className={`p-4 border-l-4 rounded-lg ${
                        alert.priority === 'high' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                        alert.priority === 'medium' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                        'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{alert.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                          </div>
                          <Badge variant={alert.priority === 'high' ? 'destructive' : alert.priority === 'medium' ? 'secondary' : 'default'}>
                            {alert.priority}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="search" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Beneficiary Status Search</CardTitle>
                  <CardDescription>
                    Search for specific claim details and status updates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter Claim ID (e.g., FRA12345)"
                      value={searchClaimId}
                      onChange={(e) => setSearchClaimId(e.target.value)}
                      className="flex-1"
                      data-testid="input-search-claim"
                    />
                    <Button onClick={searchClaim} data-testid="button-search">
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </Button>
                  </div>

                  {selectedClaim && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-6 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Claim Details</h3>
                        {getStatusBadge(selectedClaim.status)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Claim ID:</span>
                          <p>{selectedClaim.claimId}</p>
                        </div>
                        <div>
                          <span className="font-medium">Beneficiary:</span>
                          <p>{selectedClaim.beneficiaryName}</p>
                        </div>
                        <div>
                          <span className="font-medium">Location:</span>
                          <p>{selectedClaim.village}, {selectedClaim.district}, {selectedClaim.state}</p>
                        </div>
                        <div>
                          <span className="font-medium">Claim Type:</span>
                          <p>{selectedClaim.claimType}</p>
                        </div>
                        <div>
                          <span className="font-medium">Land Area:</span>
                          <p>{selectedClaim.landArea}</p>
                        </div>
                        <div>
                          <span className="font-medium">Submitted:</span>
                          <p>{new Date(selectedClaim.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {searchClaimId && !selectedClaim && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No claim found with ID: {searchClaimId}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
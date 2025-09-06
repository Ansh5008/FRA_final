import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getLandTypeColor, getLandTypeIcon } from "@/lib/land-type-colors";
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
  TrendingUp,
  FileText,
  Calendar,
  MapIcon,
  ThumbsUp,
  ThumbsDown,
  Shield,
  Check,
  X,
  Database
} from "lucide-react";
import { Link } from "wouter";
import InteractiveMap from "@/components/interactive-map";

interface ValidationResult {
  isValid: boolean;
  userFound: boolean;
  eligibilityChecks: {
    ageEligible: boolean;
    landAreaEligible: boolean;
    generationEligible: boolean;
  };
  matchedRecord?: any;
  errors: string[];
  warnings: string[];
}

interface FraClaim {
  id: string;
  claimId: string;
  beneficiaryName: string;
  village: string;
  district: string;
  state: string;
  claimType: string;
  landArea: string;
  landType?: string;
  documents: string[];
  coordinates?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  aiScore?: number;
  aiFlags?: string[];
  aadhaarId?: string;
  age?: string;
  validationResult?: ValidationResult;
}

export default function AdminDashboard() {
  const [searchClaimId, setSearchClaimId] = useState("");
  const [selectedClaim, setSelectedClaim] = useState<FraClaim | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const { toast } = useToast();
  
  // State for validation
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult>>({});

  const { data: claimsData, isLoading } = useQuery({
    queryKey: ['/api/claims'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/claims');
      return response.json();
    }
  });

  const claims: FraClaim[] = claimsData?.data || [];

  // Mutation for updating claim status
  const updateClaimStatus = useMutation({
    mutationFn: async ({ claimId, status }: { claimId: string, status: string }) => {
      const response = await apiRequest('PATCH', `/api/claims/${claimId}/status`, { status });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/claims'] });
      toast({
        title: "Status Updated",
        description: `Claim ${data.data?.claimId} has been ${data.data?.status}.`,
      });
      setDetailModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update claim status. Please try again.",
        variant: "destructive",
      });
    }
  });

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

  const handleApprove = (claimId: string) => {
    updateClaimStatus.mutate({ claimId, status: 'approved' });
  };

  const handleReject = (claimId: string) => {
    updateClaimStatus.mutate({ claimId, status: 'rejected' });
  };

  const openClaimDetails = (claim: FraClaim) => {
    setSelectedClaim(claim);
    setDetailModalOpen(true);
    
    // Trigger validation if not already done
    if (claim.aadhaarId || claim.beneficiaryName) {
      validateClaim(claim);
    }
  };

  const validateClaim = async (claim: FraClaim) => {
    if (validationResults[claim.id]) return; // Already validated
    
    try {
      const response = await apiRequest('POST', '/api/validate-claim', {
        aadhaarId: claim.aadhaarId,
        beneficiaryName: claim.beneficiaryName,
        age: claim.age ? parseInt(claim.age) : undefined,
        landArea: claim.landArea,
        state: claim.state,
        district: claim.district,
        village: claim.village,
      });
      
      const result = await response.json();
      if (result.success) {
        setValidationResults(prev => ({
          ...prev,
          [claim.id]: result.data
        }));
      }
    } catch (error) {
      console.error('Validation error:', error);
    }
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
                  <InteractiveMap />
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
                    {claims.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10).map((claim) => {
                      const validation = validationResults[claim.id];
                      const landTypeColor = getLandTypeColor(claim.landType);
                      const landTypeIcon = getLandTypeIcon(claim.landType);
                      
                      return (
                        <div key={claim.id} className={`flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors ${landTypeColor.bg} ${landTypeColor.border}`}>
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
                                <div className="flex items-center space-x-1">
                                  <span className="text-lg">{landTypeIcon}</span>
                                  <span className={`text-xs font-medium ${landTypeColor.text}`}>
                                    {claim.landType || "Agricultural"}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(claim.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              {validation && (
                                <div className="flex items-center space-x-2">
                                  <div className="flex items-center space-x-1">
                                    {validation.isValid ? 
                                      <Shield className="w-4 h-4 text-green-600" /> :
                                      <Shield className="w-4 h-4 text-red-600" />
                                    }
                                    <span className="text-xs text-muted-foreground">
                                      {validation.userFound ? "Verified" : "Not Found"}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {getStatusBadge(claim.status)}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openClaimDetails(claim)}
                              data-testid={`button-view-${claim.id}`}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      );
                    })}
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
                          <span className="font-medium">Land Type:</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getLandTypeIcon(selectedClaim.landType)}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getLandTypeColor(selectedClaim.landType).bg} ${getLandTypeColor(selectedClaim.landType).text}`}>
                              {selectedClaim.landType || "Agricultural"}
                            </span>
                          </div>
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

          {/* Detailed Claim Modal */}
          <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Claim Details - {selectedClaim?.claimId}</span>
                </DialogTitle>
                <DialogDescription>
                  Complete information and documents for this FRA claim
                </DialogDescription>
              </DialogHeader>
              
              {selectedClaim && (
                <div className="space-y-6">
                  {/* Status and Actions */}
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium">Current Status:</span>
                      {getStatusBadge(selectedClaim.status)}
                    </div>
                    {selectedClaim.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleApprove(selectedClaim.id)}
                          disabled={updateClaimStatus.isPending}
                          className="bg-green-600 hover:bg-green-700"
                          data-testid="button-approve"
                        >
                          <ThumbsUp className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleReject(selectedClaim.id)}
                          disabled={updateClaimStatus.isPending}
                          data-testid="button-reject"
                        >
                          <ThumbsDown className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Claim Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Beneficiary Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Name:</span>
                          <p className="text-lg">{selectedClaim.beneficiaryName}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Claim ID:</span>
                          <p className="font-mono text-sm bg-muted px-2 py-1 rounded">{selectedClaim.claimId}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Claim Type:</span>
                          <p>{selectedClaim.claimType}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Land Area:</span>
                          <p className="text-lg font-semibold">{selectedClaim.landArea}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <MapIcon className="w-5 h-5" />
                          <span>Location Details</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Village:</span>
                          <p>{selectedClaim.village}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">District:</span>
                          <p>{selectedClaim.district}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">State:</span>
                          <p>{selectedClaim.state}</p>
                        </div>
                        {selectedClaim.coordinates && (
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">GPS Coordinates:</span>
                            <p className="font-mono text-sm bg-muted px-2 py-1 rounded">{selectedClaim.coordinates}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Documents */}
                  {selectedClaim.documents && selectedClaim.documents.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <FileText className="w-5 h-5" />
                          <span>Supporting Documents</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {selectedClaim.documents.map((doc, index) => (
                            <div key={index} className="flex items-center p-2 border rounded">
                              <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
                              <span className="text-sm">{doc}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Validation Results */}
                  {validationResults[selectedClaim.id] && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <Database className="w-5 h-5" />
                          <span>FRA Database Validation</span>
                          <Badge variant={validationResults[selectedClaim.id].isValid ? "default" : "destructive"}>
                            {validationResults[selectedClaim.id].userFound ? "User Found" : "User Not Found"}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Eligibility Status */}
                        <div>
                          <h4 className="font-medium mb-3">Eligibility Criteria Status</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className={`p-3 rounded-lg border ${validationResults[selectedClaim.id].eligibilityChecks.ageEligible ? 'bg-green-50 dark:bg-green-900/20 border-green-200' : 'bg-red-50 dark:bg-red-900/20 border-red-200'}`}>
                              <div className="flex items-center space-x-2">
                                {validationResults[selectedClaim.id].eligibilityChecks.ageEligible ? 
                                  <Check className="w-4 h-4 text-green-600" /> : 
                                  <X className="w-4 h-4 text-red-600" />
                                }
                                <span className="font-medium text-sm">Age Eligibility</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">Must be ≥ 18 years old</p>
                            </div>
                            <div className={`p-3 rounded-lg border ${validationResults[selectedClaim.id].eligibilityChecks.landAreaEligible ? 'bg-green-50 dark:bg-green-900/20 border-green-200' : 'bg-red-50 dark:bg-red-900/20 border-red-200'}`}>
                              <div className="flex items-center space-x-2">
                                {validationResults[selectedClaim.id].eligibilityChecks.landAreaEligible ? 
                                  <Check className="w-4 h-4 text-green-600" /> : 
                                  <X className="w-4 h-4 text-red-600" />
                                }
                                <span className="font-medium text-sm">Land Area</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">Must be ≤ 4 acres</p>
                            </div>
                            <div className={`p-3 rounded-lg border ${validationResults[selectedClaim.id].eligibilityChecks.generationEligible ? 'bg-green-50 dark:bg-green-900/20 border-green-200' : 'bg-red-50 dark:bg-red-900/20 border-red-200'}`}>
                              <div className="flex items-center space-x-2">
                                {validationResults[selectedClaim.id].eligibilityChecks.generationEligible ? 
                                  <Check className="w-4 h-4 text-green-600" /> : 
                                  <X className="w-4 h-4 text-red-600" />
                                }
                                <span className="font-medium text-sm">Generational Presence</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">Must be ≥ 75 years residence</p>
                            </div>
                          </div>
                        </div>

                        {/* Validation Issues */}
                        {validationResults[selectedClaim.id].errors.length > 0 && (
                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg p-4">
                            <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">Validation Errors:</h4>
                            <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400">
                              {validationResults[selectedClaim.id].errors.map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Validation Warnings */}
                        {validationResults[selectedClaim.id].warnings.length > 0 && (
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg p-4">
                            <h4 className="font-medium text-yellow-700 dark:text-yellow-300 mb-2">Validation Warnings:</h4>
                            <ul className="list-disc list-inside text-sm text-yellow-600 dark:text-yellow-400">
                              {validationResults[selectedClaim.id].warnings.map((warning, index) => (
                                <li key={index}>{warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Matched Database Record */}
                        {validationResults[selectedClaim.id].matchedRecord && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-3">Matched Database Record:</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div>
                                <span className="font-medium text-muted-foreground">Application ID:</span>
                                <p className="text-blue-600">{validationResults[selectedClaim.id].matchedRecord.application_id}</p>
                              </div>
                              <div>
                                <span className="font-medium text-muted-foreground">Age:</span>
                                <p>{validationResults[selectedClaim.id].matchedRecord.age} years</p>
                              </div>
                              <div>
                                <span className="font-medium text-muted-foreground">Land Area:</span>
                                <p>{validationResults[selectedClaim.id].matchedRecord.land_area_requested_acres} acres</p>
                              </div>
                              <div>
                                <span className="font-medium text-muted-foreground">Forest Years:</span>
                                <p>{validationResults[selectedClaim.id].matchedRecord.years_in_forest_area} years</p>
                              </div>
                              <div>
                                <span className="font-medium text-muted-foreground">Tribe:</span>
                                <p>{validationResults[selectedClaim.id].matchedRecord.tribe}</p>
                              </div>
                              <div>
                                <span className="font-medium text-muted-foreground">Previous Status:</span>
                                <p>{validationResults[selectedClaim.id].matchedRecord.application_status}</p>
                              </div>
                              <div>
                                <span className="font-medium text-muted-foreground">Eligibility Score:</span>
                                <p>{Math.round(validationResults[selectedClaim.id].matchedRecord.eligibility_confidence_score * 100)}%</p>
                              </div>
                              <div>
                                <span className="font-medium text-muted-foreground">Fraud Risk:</span>
                                <p className={validationResults[selectedClaim.id].matchedRecord.fraud_risk_score > 0.5 ? 'text-red-600' : 'text-green-600'}>
                                  {Math.round(validationResults[selectedClaim.id].matchedRecord.fraud_risk_score * 100)}%
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* AI Analysis */}
                  {(selectedClaim.aiScore !== undefined || selectedClaim.aiFlags) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <BarChart3 className="w-5 h-5" />
                          <span>AI Analysis</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {selectedClaim.aiScore !== undefined && (
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">Risk Score:</span>
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 bg-muted h-2 rounded">
                                <div 
                                  className={`h-2 rounded ${selectedClaim.aiScore > 0.7 ? 'bg-red-500' : selectedClaim.aiScore > 0.4 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                  style={{ width: `${selectedClaim.aiScore * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{Math.round(selectedClaim.aiScore * 100)}%</span>
                            </div>
                          </div>
                        )}
                        {selectedClaim.aiFlags && selectedClaim.aiFlags.length > 0 && (
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">AI Flags:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {selectedClaim.aiFlags.map((flag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {flag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Timeline */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <Calendar className="w-5 h-5" />
                        <span>Timeline</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Submitted:</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(selectedClaim.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Last Updated:</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(selectedClaim.updatedAt).toLocaleString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>
    </div>
  );
}
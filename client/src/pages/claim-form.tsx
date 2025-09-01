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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, MapPin, User, CheckCircle } from "lucide-react";
import { Link } from "wouter";

const claimFormSchema = z.object({
  beneficiaryName: z.string().min(2, "Name must be at least 2 characters"),
  village: z.string().min(2, "Village name is required"),
  district: z.string().min(2, "District is required"),
  state: z.string().min(2, "State is required"),
  claimType: z.string().min(1, "Please select claim type"),
  landArea: z.string().min(1, "Land area is required"),
  documents: z.array(z.string()).min(1, "At least one document is required"),
});

type ClaimForm = z.infer<typeof claimFormSchema>;

export default function ClaimFormPage() {
  const { toast } = useToast();
  const [submittedClaim, setSubmittedClaim] = useState<any>(null);
  
  const form = useForm<ClaimForm>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      beneficiaryName: "",
      village: "",
      district: "",
      state: "",
      claimType: "",
      landArea: "",
      documents: []
    }
  });

  const submitMutation = useMutation({
    mutationFn: async (data: ClaimForm) => {
      const response = await apiRequest('POST', '/api/claims', data);
      return response.json();
    },
    onSuccess: (response) => {
      setSubmittedClaim(response.data);
      toast({
        title: "Claim Submitted Successfully!",
        description: `Your claim ID is ${response.data.claimId}. You will receive SMS updates.`,
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to submit claim",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: ClaimForm) => {
    // Auto-generate coordinates based on village (demo purposes)
    const claimData = {
      ...data,
      coordinates: "23.3441,85.3096" // Demo coordinates
    };
    submitMutation.mutate(claimData);
  };

  const states = ["Jharkhand", "Madhya Pradesh", "Tripura", "Odisha", "Telangana"];
  const claimTypes = ["Individual Forest Right", "Community Forest Right", "Other Traditional Rights"];
  const documentTypes = ["Aadhaar card", "land sketch", "Gram Sabha resolution", "Community certificate", "village map", "village certificate"];

  if (submittedClaim) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="font-heading font-bold text-3xl text-foreground mb-4">
              Claim Submitted Successfully!
            </h1>
            <Card className="text-left">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Claim Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Claim ID:</span>
                    <p className="text-primary font-bold">{submittedClaim.claimId}</p>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <p className="text-yellow-600 capitalize">{submittedClaim.status}</p>
                  </div>
                  <div>
                    <span className="font-medium">Beneficiary:</span>
                    <p>{submittedClaim.beneficiaryName}</p>
                  </div>
                  <div>
                    <span className="font-medium">Location:</span>
                    <p>{submittedClaim.village}, {submittedClaim.district}</p>
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <p className="text-sm">
                    <strong>SMS Confirmation:</strong> "आपका FRA दावा (ID: {submittedClaim.claimId}) सफलतापूर्वक जमा किया गया है। 
                    स्थिति की जांच SMS या पंचायत डैशबोर्ड के माध्यम से करें।"
                  </p>
                </div>
              </CardContent>
            </Card>
            <div className="mt-6 space-x-4">
              <Button 
                onClick={() => setSubmittedClaim(null)}
                variant="outline"
              >
                Submit Another Claim
              </Button>
              <Link to="/admin">
                <Button>View Admin Dashboard</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>

          <div className="text-center">
            <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-4">
              FRA Claim Submission
            </h1>
            <p className="text-lg text-muted-foreground">
              Submit your Forest Rights Act claim for transparent processing
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Beneficiary Details</span>
              </CardTitle>
              <CardDescription>
                Please provide accurate information for your FRA claim
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="beneficiaryName">Full Name</Label>
                    <Input
                      id="beneficiaryName"
                      placeholder="Enter your full name"
                      {...form.register("beneficiaryName")}
                      data-testid="input-beneficiary-name"
                    />
                    {form.formState.errors.beneficiaryName && (
                      <p className="text-destructive text-sm mt-1">
                        {form.formState.errors.beneficiaryName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="claimType">Claim Type</Label>
                    <Select onValueChange={(value) => form.setValue("claimType", value)}>
                      <SelectTrigger data-testid="select-claim-type">
                        <SelectValue placeholder="Select claim type" />
                      </SelectTrigger>
                      <SelectContent>
                        {claimTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.claimType && (
                      <p className="text-destructive text-sm mt-1">
                        {form.formState.errors.claimType.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="village">Village</Label>
                    <Input
                      id="village"
                      placeholder="Village name"
                      {...form.register("village")}
                      data-testid="input-village"
                    />
                    {form.formState.errors.village && (
                      <p className="text-destructive text-sm mt-1">
                        {form.formState.errors.village.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="district">District</Label>
                    <Input
                      id="district"
                      placeholder="District name"
                      {...form.register("district")}
                      data-testid="input-district"
                    />
                    {form.formState.errors.district && (
                      <p className="text-destructive text-sm mt-1">
                        {form.formState.errors.district.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="state">State</Label>
                    <Select onValueChange={(value) => form.setValue("state", value)}>
                      <SelectTrigger data-testid="select-state">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.state && (
                      <p className="text-destructive text-sm mt-1">
                        {form.formState.errors.state.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="landArea">Land Area</Label>
                  <Input
                    id="landArea"
                    placeholder="e.g., 2 acres"
                    {...form.register("landArea")}
                    data-testid="input-land-area"
                  />
                  {form.formState.errors.landArea && (
                    <p className="text-destructive text-sm mt-1">
                      {form.formState.errors.landArea.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Supporting Documents</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {documentTypes.map((docType) => (
                      <label key={docType} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          value={docType}
                          onChange={(e) => {
                            const currentDocs = form.getValues("documents");
                            if (e.target.checked) {
                              form.setValue("documents", [...currentDocs, docType]);
                            } else {
                              form.setValue("documents", currentDocs.filter(doc => doc !== docType));
                            }
                          }}
                          className="rounded"
                        />
                        <span>{docType}</span>
                      </label>
                    ))}
                  </div>
                  {form.formState.errors.documents && (
                    <p className="text-destructive text-sm mt-1">
                      {form.formState.errors.documents.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitMutation.isPending}
                  data-testid="button-submit-claim"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {submitMutation.isPending ? "Submitting..." : "Submit FRA Claim"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
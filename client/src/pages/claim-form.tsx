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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, FileText, MapPin, User, CheckCircle, Shield, AlertTriangle, Check, X, CreditCard, Calendar, Upload, Trash2 } from "lucide-react";
import { Link } from "wouter";

const claimFormSchema = z.object({
  aadhaarId: z.string().optional(),
  beneficiaryName: z.string().min(2, "Name must be at least 2 characters"),
  age: z.string().min(1, "Age is required"),
  village: z.string().min(2, "Village name is required"),
  district: z.string().min(2, "District is required"),
  state: z.string().min(2, "State is required"),
  claimType: z.string().min(1, "Please select claim type"),
  landArea: z.string().min(1, "Land area is required"),
  documents: z.array(z.string()).min(1, "At least one document is required"),
  uploadedFiles: z.array(z.any()).optional(),
});

type ClaimForm = z.infer<typeof claimFormSchema>;

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

export default function ClaimFormPage() {
  const { toast } = useToast();
  const [submittedClaim, setSubmittedClaim] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [validationChecked, setValidationChecked] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  const form = useForm<ClaimForm>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      aadhaarId: "",
      beneficiaryName: "",
      age: "",
      village: "",
      district: "",
      state: "",
      claimType: "",
      landArea: "",
      documents: [],
      uploadedFiles: []
    }
  });

  const validateMutation = useMutation({
    mutationFn: async (data: ClaimForm) => {
      const response = await apiRequest('POST', '/api/validate-claim', {
        aadhaarId: data.aadhaarId,
        beneficiaryName: data.beneficiaryName,
        age: parseInt(data.age),
        landArea: data.landArea,
        state: data.state,
        district: data.district,
        village: data.village,
      });
      return response.json();
    },
    onSuccess: (response) => {
      setValidationResult(response.data);
      setValidationChecked(true);
      if (response.data.isValid) {
        toast({
          title: "Validation Successful!",
          description: "All eligibility criteria met. You can now submit your claim.",
        });
      } else {
        toast({
          title: "Validation Issues Found",
          description: "Please review the validation results before submitting.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Validation Failed",
        description: error.message,
        variant: "destructive",
      });
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
      setValidationResult(null);
      setValidationChecked(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to submit claim",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const onValidate = (data: ClaimForm) => {
    validateMutation.mutate(data);
  };

  const onSubmit = (data: ClaimForm) => {
    if (!validationChecked) {
      toast({
        title: "Validation Required",
        description: "Please validate your claim before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (validationResult && !validationResult.isValid) {
      toast({
        title: "Validation Failed",
        description: "Please fix validation issues before submitting.",
        variant: "destructive",
      });
      return;
    }

    // Auto-generate coordinates based on village (demo purposes)
    const claimData = {
      ...data,
      coordinates: "23.3441,85.3096", // Demo coordinates
      uploadedFiles: uploadedFiles.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      }))
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
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="Enter your age"
                      {...form.register("age")}
                      data-testid="input-age"
                    />
                    {form.formState.errors.age && (
                      <p className="text-destructive text-sm mt-1">
                        {form.formState.errors.age.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="aadhaarId">Aadhaar ID (Optional)</Label>
                    <Input
                      id="aadhaarId"
                      placeholder="xxxx-xxxx-xxxx"
                      {...form.register("aadhaarId")}
                      data-testid="input-aadhaar-id"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Providing Aadhaar ID helps with faster validation
                    </p>
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
                    placeholder="e.g., 2 acres (max 4 acres allowed)"
                    {...form.register("landArea")}
                    data-testid="input-land-area"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Individual claims must be less than 4 acres/hectares
                  </p>
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

                {/* File Upload Section */}
                <div>
                  <Label>Upload Document Files</Label>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                      <div className="flex flex-col items-center justify-center text-center">
                        <Upload className="w-10 h-10 text-muted-foreground mb-2" />
                        <div className="text-sm text-muted-foreground mb-4">
                          <p>Click to upload or drag and drop</p>
                          <p className="text-xs">PDF, JPG, PNG files up to 10MB each</p>
                        </div>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            const validFiles = files.filter(file => {
                              const maxSize = 10 * 1024 * 1024; // 10MB
                              const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
                              return file.size <= maxSize && validTypes.includes(file.type);
                            });
                            
                            if (validFiles.length !== files.length) {
                              toast({
                                title: "Invalid Files",
                                description: "Some files were skipped. Only PDF, JPG, PNG under 10MB are allowed.",
                                variant: "destructive",
                              });
                            }
                            
                            setUploadedFiles(prev => [...prev, ...validFiles]);
                            form.setValue("uploadedFiles", [...uploadedFiles, ...validFiles]);
                          }}
                          className="hidden"
                          id="file-upload"
                          data-testid="input-file-upload"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <Button type="button" variant="outline" className="pointer-events-none">
                            <Upload className="w-4 h-4 mr-2" />
                            Choose Files
                          </Button>
                        </label>
                      </div>
                    </div>

                    {/* Display uploaded files */}
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Uploaded Files ({uploadedFiles.length})</Label>
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newFiles = uploadedFiles.filter((_, i) => i !== index);
                                setUploadedFiles(newFiles);
                                form.setValue("uploadedFiles", newFiles);
                              }}
                              data-testid={`button-remove-file-${index}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Validation Section */}
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      onClick={form.handleSubmit(onValidate)}
                      variant="outline"
                      disabled={validateMutation.isPending}
                      data-testid="button-validate-claim"
                      className="flex-1"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      {validateMutation.isPending ? "Validating..." : "Validate Claim"}
                    </Button>
                  </div>

                  {/* Validation Results */}
                  {validationResult && (
                    <Card className={`border-2 ${validationResult.isValid ? 'border-green-200 bg-green-50 dark:bg-green-900/20' : 'border-red-200 bg-red-50 dark:bg-red-900/20'}`}>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center space-x-2 text-lg">
                          {validationResult.isValid ? 
                            <Check className="w-5 h-5 text-green-600" /> : 
                            <X className="w-5 h-5 text-red-600" />
                          }
                          <span>Validation Results</span>
                          <Badge variant={validationResult.isValid ? "default" : "destructive"}>
                            {validationResult.userFound ? "User Found" : "User Not Found"}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Eligibility Checks */}
                        <div>
                          <h4 className="font-medium mb-2">Eligibility Criteria</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div className="flex items-center space-x-2">
                              {validationResult.eligibilityChecks.ageEligible ? 
                                <Check className="w-4 h-4 text-green-600" /> : 
                                <X className="w-4 h-4 text-red-600" />
                              }
                              <span className="text-sm">Age ≥ 18 years</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {validationResult.eligibilityChecks.landAreaEligible ? 
                                <Check className="w-4 h-4 text-green-600" /> : 
                                <X className="w-4 h-4 text-red-600" />
                              }
                              <span className="text-sm">Land ≤ 4 acres</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {validationResult.eligibilityChecks.generationEligible ? 
                                <Check className="w-4 h-4 text-green-600" /> : 
                                <X className="w-4 h-4 text-red-600" />
                              }
                              <span className="text-sm">75+ years residence</span>
                            </div>
                          </div>
                        </div>

                        {/* Errors */}
                        {validationResult.errors.length > 0 && (
                          <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              <strong>Issues Found:</strong>
                              <ul className="list-disc list-inside mt-1">
                                {validationResult.errors.map((error, index) => (
                                  <li key={index} className="text-sm">{error}</li>
                                ))}
                              </ul>
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Warnings */}
                        {validationResult.warnings.length > 0 && (
                          <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              <strong>Warnings:</strong>
                              <ul className="list-disc list-inside mt-1">
                                {validationResult.warnings.map((warning, index) => (
                                  <li key={index} className="text-sm">{warning}</li>
                                ))}
                              </ul>
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Matched Record Info */}
                        {validationResult.matchedRecord && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                            <h4 className="font-medium text-sm mb-2">Database Record Found:</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Name:</span> {validationResult.matchedRecord.applicant_name}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Age:</span> {validationResult.matchedRecord.age} years
                              </div>
                              <div>
                                <span className="text-muted-foreground">Location:</span> {validationResult.matchedRecord.village}, {validationResult.matchedRecord.district}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Forest Years:</span> {validationResult.matchedRecord.years_in_forest_area} years
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={submitMutation.isPending || !validationChecked || (validationResult?.isValid === false)}
                    data-testid="button-submit-claim"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {submitMutation.isPending ? "Submitting..." : "Submit FRA Claim"}
                  </Button>

                  {!validationChecked && (
                    <p className="text-sm text-muted-foreground text-center">
                      Please validate your claim before submitting
                    </p>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
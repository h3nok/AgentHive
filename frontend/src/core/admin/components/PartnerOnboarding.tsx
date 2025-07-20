import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Business,
  Person,
  Code,
  Security,
  CheckCircle,
  Upload,
  Description,
  Settings,
  Verified,
  Warning,
  Info,
  CloudUpload,
  GitHub,
  Link,
  Email,
  Phone,
  Language
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

// Types for Partner Onboarding
interface PartnerInfo {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  description: string;
  partnershipType: 'community' | 'partner' | 'enterprise';
}

interface ConnectorSubmission {
  name: string;
  description: string;
  category: string;
  version: string;
  pricing: 'free' | 'paid' | 'freemium';
  price?: number;
  repositoryUrl: string;
  documentationUrl: string;
  supportUrl: string;
  tags: string[];
  compatibility: string[];
  configurationSchema: string;
  installationInstructions: string;
}

interface SecurityReview {
  dataEncryption: boolean;
  authenticationMethod: string;
  dataRetention: string;
  complianceStandards: string[];
  securityAudit: boolean;
}

const steps = [
  {
    label: 'Partner Registration',
    description: 'Register your company as an AgentHive partner',
    icon: <Business />
  },
  {
    label: 'Connector Submission',
    description: 'Submit your connector for review',
    icon: <Code />
  },
  {
    label: 'Security Review',
    description: 'Complete security and compliance requirements',
    icon: <Security />
  },
  {
    label: 'Review & Approval',
    description: 'Our team will review your submission',
    icon: <Verified />
  }
];

const categories = [
  'Communication',
  'CRM',
  'Development',
  'Analytics',
  'Productivity',
  'Storage',
  'Security',
  'Marketing',
  'Finance',
  'HR',
  'Other'
];

const compatibilityVersions = [
  'agentive-v2.x',
  'agentive-v3.x',
  'agentive-v4.x (beta)'
];

const complianceStandards = [
  'SOC 2 Type II',
  'GDPR',
  'HIPAA',
  'ISO 27001',
  'PCI DSS',
  'FedRAMP'
];

const PartnerOnboarding: React.FC = () => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [partnerInfo, setPartnerInfo] = useState<PartnerInfo>({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    website: '',
    description: '',
    partnershipType: 'community'
  });
  const [connectorSubmission, setConnectorSubmission] = useState<ConnectorSubmission>({
    name: '',
    description: '',
    category: '',
    version: '1.0.0',
    pricing: 'free',
    repositoryUrl: '',
    documentationUrl: '',
    supportUrl: '',
    tags: [],
    compatibility: [],
    configurationSchema: '',
    installationInstructions: ''
  });
  const [securityReview, setSecurityReview] = useState<SecurityReview>({
    dataEncryption: false,
    authenticationMethod: '',
    dataRetention: '',
    complianceStandards: [],
    securityAudit: false
  });
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [newTag, setNewTag] = useState('');

  const handleNext = useCallback(() => {
    if (activeStep === steps.length - 1) {
      setSubmissionComplete(true);
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  }, [activeStep]);

  const handleBack = useCallback(() => {
    setActiveStep((prevStep) => prevStep - 1);
  }, []);

  const handleReset = useCallback(() => {
    setActiveStep(0);
    setSubmissionComplete(false);
  }, []);

  const addTag = useCallback(() => {
    if (newTag.trim() && !connectorSubmission.tags.includes(newTag.trim())) {
      setConnectorSubmission(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  }, [newTag, connectorSubmission.tags]);

  const removeTag = useCallback((tagToRemove: string) => {
    setConnectorSubmission(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  }, []);

  const getPartnershipBenefits = (type: string) => {
    switch (type) {
      case 'community':
        return ['Free connector listing', 'Community support', 'Basic analytics'];
      case 'partner':
        return ['Featured placement', 'Co-marketing opportunities', 'Priority support', 'Advanced analytics'];
      case 'enterprise':
        return ['Custom integrations', 'Dedicated support', 'SLA guarantees', 'Revenue sharing', 'Joint go-to-market'];
      default:
        return [];
    }
  };

  const isStepComplete = (step: number) => {
    switch (step) {
      case 0:
        return partnerInfo.companyName && partnerInfo.contactName && partnerInfo.email;
      case 1:
        return connectorSubmission.name && connectorSubmission.description && connectorSubmission.category;
      case 2:
        return securityReview.authenticationMethod && securityReview.dataRetention;
      default:
        return false;
    }
  };

  if (submissionComplete) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
          Submission Complete!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Thank you for your connector submission. Our team will review it within 3-5 business days.
        </Typography>
        
        <Card sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>What happens next?</Typography>
            <List>
              <ListItem>
                <ListItemIcon><Security /></ListItemIcon>
                <ListItemText primary="Security Review" secondary="Our security team will audit your connector" />
              </ListItem>
              <ListItem>
                <ListItemIcon><Code /></ListItemIcon>
                <ListItemText primary="Technical Review" secondary="Code quality and compatibility check" />
              </ListItem>
              <ListItem>
                <ListItemIcon><Verified /></ListItemIcon>
                <ListItemText primary="Approval & Publishing" secondary="Once approved, your connector will be published" />
              </ListItem>
            </List>
          </CardContent>
        </Card>

        <Button variant="contained" onClick={handleReset}>
          Submit Another Connector
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            mb: 1,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 600
          }}
        >
          Partner Onboarding
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Join the AgentHive ecosystem and publish your connector to thousands of users
        </Typography>
      </Box>

      {/* Progress */}
      <Box sx={{ mb: 4 }}>
        <LinearProgress 
          variant="determinate" 
          value={(activeStep / (steps.length - 1)) * 100} 
          sx={{ mb: 2, height: 8, borderRadius: 4 }}
        />
        <Typography variant="body2" color="text.secondary" align="center">
          Step {activeStep + 1} of {steps.length}
        </Typography>
      </Box>

      {/* Stepper */}
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel
              optional={
                index === steps.length - 1 ? (
                  <Typography variant="caption">Final step</Typography>
                ) : null
              }
              StepIconComponent={({ active, completed }) => (
                <Avatar
                  sx={{
                    bgcolor: completed ? 'success.main' : active ? 'primary.main' : 'grey.300',
                    width: 32,
                    height: 32
                  }}
                >
                  {completed ? <CheckCircle /> : step.icon}
                </Avatar>
              )}
            >
              <Typography variant="h6">{step.label}</Typography>
              <Typography variant="body2" color="text.secondary">
                {step.description}
              </Typography>
            </StepLabel>
            <StepContent>
              <Box sx={{ mb: 2 }}>
                {/* Step 1: Partner Registration */}
                {index === 0 && (
                  <Card>
                    <CardContent>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Company Name"
                            value={partnerInfo.companyName}
                            onChange={(e) => setPartnerInfo(prev => ({ ...prev, companyName: e.target.value }))}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Contact Name"
                            value={partnerInfo.contactName}
                            onChange={(e) => setPartnerInfo(prev => ({ ...prev, contactName: e.target.value }))}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={partnerInfo.email}
                            onChange={(e) => setPartnerInfo(prev => ({ ...prev, email: e.target.value }))}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Phone"
                            value={partnerInfo.phone}
                            onChange={(e) => setPartnerInfo(prev => ({ ...prev, phone: e.target.value }))}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Website"
                            value={partnerInfo.website}
                            onChange={(e) => setPartnerInfo(prev => ({ ...prev, website: e.target.value }))}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Company Description"
                            multiline
                            rows={3}
                            value={partnerInfo.description}
                            onChange={(e) => setPartnerInfo(prev => ({ ...prev, description: e.target.value }))}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <FormControl fullWidth>
                            <InputLabel>Partnership Type</InputLabel>
                            <Select
                              value={partnerInfo.partnershipType}
                              label="Partnership Type"
                              onChange={(e) => setPartnerInfo(prev => ({ ...prev, partnershipType: e.target.value as any }))}
                            >
                              <MenuItem value="community">Community Partner</MenuItem>
                              <MenuItem value="partner">Technology Partner</MenuItem>
                              <MenuItem value="enterprise">Enterprise Partner</MenuItem>
                            </Select>
                          </FormControl>
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                              {partnerInfo.partnershipType.charAt(0).toUpperCase() + partnerInfo.partnershipType.slice(1)} Benefits:
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {getPartnershipBenefits(partnerInfo.partnershipType).map((benefit) => (
                                <Chip key={benefit} label={benefit} size="small" color="primary" variant="outlined" />
                              ))}
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                )}

                {/* Step 2: Connector Submission */}
                {index === 1 && (
                  <Card>
                    <CardContent>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Connector Name"
                            value={connectorSubmission.name}
                            onChange={(e) => setConnectorSubmission(prev => ({ ...prev, name: e.target.value }))}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Version"
                            value={connectorSubmission.version}
                            onChange={(e) => setConnectorSubmission(prev => ({ ...prev, version: e.target.value }))}
                            required
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Description"
                            multiline
                            rows={3}
                            value={connectorSubmission.description}
                            onChange={(e) => setConnectorSubmission(prev => ({ ...prev, description: e.target.value }))}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth required>
                            <InputLabel>Category</InputLabel>
                            <Select
                              value={connectorSubmission.category}
                              label="Category"
                              onChange={(e) => setConnectorSubmission(prev => ({ ...prev, category: e.target.value }))}
                            >
                              {categories.map((category) => (
                                <MenuItem key={category} value={category}>{category}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <InputLabel>Pricing Model</InputLabel>
                            <Select
                              value={connectorSubmission.pricing}
                              label="Pricing Model"
                              onChange={(e) => setConnectorSubmission(prev => ({ ...prev, pricing: e.target.value as any }))}
                            >
                              <MenuItem value="free">Free</MenuItem>
                              <MenuItem value="paid">Paid</MenuItem>
                              <MenuItem value="freemium">Freemium</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        {connectorSubmission.pricing !== 'free' && (
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Price (USD/month)"
                              type="number"
                              value={connectorSubmission.price || ''}
                              onChange={(e) => setConnectorSubmission(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                            />
                          </Grid>
                        )}
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Repository URL"
                            value={connectorSubmission.repositoryUrl}
                            onChange={(e) => setConnectorSubmission(prev => ({ ...prev, repositoryUrl: e.target.value }))}
                            InputProps={{
                              startAdornment: <GitHub sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Documentation URL"
                            value={connectorSubmission.documentationUrl}
                            onChange={(e) => setConnectorSubmission(prev => ({ ...prev, documentationUrl: e.target.value }))}
                            InputProps={{
                              startAdornment: <Description sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Support URL"
                            value={connectorSubmission.supportUrl}
                            onChange={(e) => setConnectorSubmission(prev => ({ ...prev, supportUrl: e.target.value }))}
                            InputProps={{
                              startAdornment: <Link sx={{ mr: 1, color: 'text.secondary' }} />
                            }}
                          />
                        </Grid>

                        {/* Tags */}
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>Tags</Typography>
                          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                            {connectorSubmission.tags.map((tag) => (
                              <Chip
                                key={tag}
                                label={tag}
                                onDelete={() => removeTag(tag)}
                                size="small"
                              />
                            ))}
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                              size="small"
                              placeholder="Add tag"
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && addTag()}
                            />
                            <Button onClick={addTag} variant="outlined" size="small">
                              Add
                            </Button>
                          </Box>
                        </Grid>

                        {/* Compatibility */}
                        <Grid item xs={12}>
                          <FormControl fullWidth>
                            <InputLabel>Compatibility</InputLabel>
                            <Select
                              multiple
                              value={connectorSubmission.compatibility}
                              onChange={(e) => setConnectorSubmission(prev => ({ 
                                ...prev, 
                                compatibility: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value 
                              }))}
                              renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {selected.map((value) => (
                                    <Chip key={value} label={value} size="small" />
                                  ))}
                                </Box>
                              )}
                            >
                              {compatibilityVersions.map((version) => (
                                <MenuItem key={version} value={version}>
                                  {version}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                )}

                {/* Step 3: Security Review */}
                {index === 2 && (
                  <Card>
                    <CardContent>
                      <Alert severity="info" sx={{ mb: 3 }}>
                        Security and compliance requirements ensure your connector meets AgentHive's standards.
                      </Alert>
                      
                      <Grid container spacing={3}>
                        <Grid item xs={12}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={securityReview.dataEncryption}
                                onChange={(e) => setSecurityReview(prev => ({ ...prev, dataEncryption: e.target.checked }))}
                              />
                            }
                            label="Data is encrypted in transit and at rest"
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth required>
                            <InputLabel>Authentication Method</InputLabel>
                            <Select
                              value={securityReview.authenticationMethod}
                              label="Authentication Method"
                              onChange={(e) => setSecurityReview(prev => ({ ...prev, authenticationMethod: e.target.value }))}
                            >
                              <MenuItem value="oauth2">OAuth 2.0</MenuItem>
                              <MenuItem value="api-key">API Key</MenuItem>
                              <MenuItem value="jwt">JWT Token</MenuItem>
                              <MenuItem value="basic">Basic Auth</MenuItem>
                              <MenuItem value="custom">Custom</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth required>
                            <InputLabel>Data Retention Policy</InputLabel>
                            <Select
                              value={securityReview.dataRetention}
                              label="Data Retention Policy"
                              onChange={(e) => setSecurityReview(prev => ({ ...prev, dataRetention: e.target.value }))}
                            >
                              <MenuItem value="30-days">30 days</MenuItem>
                              <MenuItem value="90-days">90 days</MenuItem>
                              <MenuItem value="1-year">1 year</MenuItem>
                              <MenuItem value="custom">Custom policy</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                          <FormControl fullWidth>
                            <InputLabel>Compliance Standards</InputLabel>
                            <Select
                              multiple
                              value={securityReview.complianceStandards}
                              onChange={(e) => setSecurityReview(prev => ({ 
                                ...prev, 
                                complianceStandards: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value 
                              }))}
                              renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {selected.map((value) => (
                                    <Chip key={value} label={value} size="small" />
                                  ))}
                                </Box>
                              )}
                            >
                              {complianceStandards.map((standard) => (
                                <MenuItem key={standard} value={standard}>
                                  {standard}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={securityReview.securityAudit}
                                onChange={(e) => setSecurityReview(prev => ({ ...prev, securityAudit: e.target.checked }))}
                              />
                            }
                            label="I consent to a security audit of my connector"
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                )}

                {/* Step 4: Review & Approval */}
                {index === 3 && (
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>Review Your Submission</Typography>
                      
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="text.secondary">Company</Typography>
                          <Typography variant="body1">{partnerInfo.companyName}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="text.secondary">Contact</Typography>
                          <Typography variant="body1">{partnerInfo.contactName}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="text.secondary">Connector</Typography>
                          <Typography variant="body1">{connectorSubmission.name}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                          <Typography variant="body1">{connectorSubmission.category}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                          <Typography variant="body2">{connectorSubmission.description}</Typography>
                        </Grid>
                      </Grid>

                      <Alert severity="success" sx={{ mt: 3 }}>
                        Your submission is ready! Click "Submit for Review" to send it to our team.
                      </Alert>
                    </CardContent>
                  </Card>
                )}
              </Box>

              {/* Navigation Buttons */}
              <Box sx={{ mb: 2 }}>
                <div>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{ mt: 1, mr: 1 }}
                    disabled={!isStepComplete(index)}
                  >
                    {index === steps.length - 1 ? 'Submit for Review' : 'Continue'}
                  </Button>
                  <Button
                    disabled={index === 0}
                    onClick={handleBack}
                    sx={{ mt: 1, mr: 1 }}
                  >
                    Back
                  </Button>
                </div>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

export default PartnerOnboarding;

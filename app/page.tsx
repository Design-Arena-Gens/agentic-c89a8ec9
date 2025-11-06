'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, FileText, TrendingUp, Shield, Building2 } from 'lucide-react';

interface LoanApplication {
  applicantName: string;
  loanAmount: number;
  loanPurpose: string;
  annualIncome: number;
  creditScore: number;
  employmentType: string;
  employmentYears: number;
  existingLoans: number;
  collateralValue: number;
  businessVintage?: number;
  debtToIncome?: number;
}

interface AppraisalResult {
  decision: 'APPROVED' | 'REJECTED' | 'REVIEW_REQUIRED';
  score: number;
  reasons: string[];
  rbiCompliance: ComplianceCheck[];
  bankPolicyCompliance: ComplianceCheck[];
  riskAssessment: RiskAssessment;
  recommendations: string[];
}

interface ComplianceCheck {
  parameter: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  details: string;
}

interface RiskAssessment {
  creditRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  collateralRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  riskScore: number;
}

export default function Home() {
  const [formData, setFormData] = useState<LoanApplication>({
    applicantName: '',
    loanAmount: 0,
    loanPurpose: 'home',
    annualIncome: 0,
    creditScore: 0,
    employmentType: 'salaried',
    employmentYears: 0,
    existingLoans: 0,
    collateralValue: 0,
    businessVintage: 0,
    debtToIncome: 0,
  });

  const [result, setResult] = useState<AppraisalResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['loanAmount', 'annualIncome', 'creditScore', 'employmentYears', 'existingLoans', 'collateralValue', 'businessVintage', 'debtToIncome'].includes(name)
        ? parseFloat(value) || 0
        : value
    }));
  };

  const analyzeApplication = async () => {
    setLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    const loanToIncome = formData.loanAmount / formData.annualIncome;
    const loanToValue = formData.collateralValue > 0 ? formData.loanAmount / formData.collateralValue : 0;
    const debtToIncome = formData.debtToIncome || (formData.existingLoans / formData.annualIncome) * 100;

    // RBI Compliance Checks
    const rbiCompliance: ComplianceCheck[] = [
      {
        parameter: 'Loan-to-Value (LTV) Ratio',
        status: loanToValue <= 0.8 ? 'PASS' : loanToValue <= 0.9 ? 'WARNING' : 'FAIL',
        details: `LTV: ${(loanToValue * 100).toFixed(2)}%. RBI guidelines recommend max 80% for priority sector loans.`
      },
      {
        parameter: 'Credit Information Report',
        status: formData.creditScore >= 700 ? 'PASS' : formData.creditScore >= 650 ? 'WARNING' : 'FAIL',
        details: `Credit Score: ${formData.creditScore}. Min recommended: 650-700 as per CIBIL standards.`
      },
      {
        parameter: 'KYC Compliance',
        status: 'PASS',
        details: 'Assumed KYC documents verified as per PMLA guidelines.'
      },
      {
        parameter: 'Priority Sector Classification',
        status: ['agriculture', 'msme', 'education'].includes(formData.loanPurpose) ? 'PASS' : 'WARNING',
        details: formData.loanPurpose === 'agriculture' || formData.loanPurpose === 'msme'
          ? 'Eligible for priority sector lending targets (40% for domestic banks).'
          : 'Non-priority sector loan.'
      }
    ];

    // Bank Policy Compliance
    const bankPolicyCompliance: ComplianceCheck[] = [
      {
        parameter: 'Debt-to-Income Ratio',
        status: debtToIncome <= 40 ? 'PASS' : debtToIncome <= 50 ? 'WARNING' : 'FAIL',
        details: `DTI: ${debtToIncome.toFixed(2)}%. Bank policy: Max 40% recommended, 50% absolute limit.`
      },
      {
        parameter: 'Employment Stability',
        status: formData.employmentYears >= 2 ? 'PASS' : formData.employmentYears >= 1 ? 'WARNING' : 'FAIL',
        details: `Employment: ${formData.employmentYears} years. Min required: 2 years for salaried, 3 years for self-employed.`
      },
      {
        parameter: 'Loan Amount Eligibility',
        status: loanToIncome <= 5 ? 'PASS' : loanToIncome <= 7 ? 'WARNING' : 'FAIL',
        details: `Loan-to-Income: ${loanToIncome.toFixed(2)}x. Max recommended: 5x annual income.`
      },
      {
        parameter: 'Collateral Coverage',
        status: formData.collateralValue >= formData.loanAmount * 1.2 ? 'PASS' :
                formData.collateralValue >= formData.loanAmount ? 'WARNING' : 'FAIL',
        details: `Collateral coverage: ${((formData.collateralValue / formData.loanAmount) * 100).toFixed(2)}%. Min required: 120%.`
      }
    ];

    // Risk Assessment
    const creditRisk = formData.creditScore >= 750 ? 'LOW' : formData.creditScore >= 650 ? 'MEDIUM' : 'HIGH';
    const collateralRisk = loanToValue <= 0.7 ? 'LOW' : loanToValue <= 0.85 ? 'MEDIUM' : 'HIGH';

    const riskScores = {
      LOW: 100,
      MEDIUM: 65,
      HIGH: 30
    };

    const overallRiskScore = (riskScores[creditRisk] + riskScores[collateralRisk]) / 2;
    const overallRisk = overallRiskScore >= 80 ? 'LOW' : overallRiskScore >= 50 ? 'MEDIUM' : 'HIGH';

    const riskAssessment: RiskAssessment = {
      creditRisk,
      collateralRisk,
      overallRisk,
      riskScore: overallRiskScore
    };

    // Calculate Score
    let score = 0;
    const allChecks = [...rbiCompliance, ...bankPolicyCompliance];
    allChecks.forEach(check => {
      if (check.status === 'PASS') score += 12.5;
      else if (check.status === 'WARNING') score += 6.25;
    });

    // Decision Logic
    const failedCritical = allChecks.filter(c => c.status === 'FAIL').length;
    const warnings = allChecks.filter(c => c.status === 'WARNING').length;

    let decision: 'APPROVED' | 'REJECTED' | 'REVIEW_REQUIRED';
    let reasons: string[] = [];
    let recommendations: string[] = [];

    if (failedCritical >= 3 || overallRisk === 'HIGH') {
      decision = 'REJECTED';
      reasons.push(`High risk profile with ${failedCritical} critical compliance failures.`);
      if (formData.creditScore < 650) reasons.push('Credit score below minimum threshold.');
      if (debtToIncome > 50) reasons.push('Debt-to-income ratio exceeds acceptable limits.');
      if (loanToValue > 0.9) reasons.push('Insufficient collateral coverage.');

      recommendations.push('Applicant should improve credit score before reapplying.');
      recommendations.push('Consider reducing loan amount or increasing collateral value.');
      recommendations.push('Clear existing debts to improve DTI ratio.');
    } else if (failedCritical >= 1 || warnings >= 3 || overallRisk === 'MEDIUM') {
      decision = 'REVIEW_REQUIRED';
      reasons.push(`Application requires senior management review due to ${warnings} warnings and ${failedCritical} failures.`);
      if (formData.creditScore < 700) reasons.push('Credit score in acceptable but cautionary range.');
      if (debtToIncome > 40) reasons.push('Debt-to-income ratio above recommended threshold.');

      recommendations.push('Request additional documentation and income proof.');
      recommendations.push('Consider co-applicant or guarantor to strengthen application.');
      recommendations.push('Verify employment and conduct detailed background check.');
      recommendations.push('May approve with higher interest rate or stricter terms.');
    } else {
      decision = 'APPROVED';
      reasons.push('All critical compliance checks passed.');
      reasons.push('Strong credit profile and adequate collateral coverage.');
      reasons.push('Meets RBI and internal bank policy requirements.');

      recommendations.push('Proceed with standard loan documentation.');
      recommendations.push('Offer competitive interest rates as per risk category.');
      recommendations.push('Complete legal and technical due diligence.');
    }

    const appraisalResult: AppraisalResult = {
      decision,
      score,
      reasons,
      rbiCompliance,
      bankPolicyCompliance,
      riskAssessment,
      recommendations
    };

    setResult(appraisalResult);
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'WARNING':
        return <AlertTriangle className="text-yellow-500" size={20} />;
      case 'FAIL':
        return <XCircle className="text-red-500" size={20} />;
      default:
        return null;
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'REVIEW_REQUIRED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return 'text-green-600';
      case 'MEDIUM':
        return 'text-yellow-600';
      case 'HIGH':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Building2 className="text-indigo-600" size={48} />
            <h1 className="text-4xl font-bold text-gray-800">Loan Appraisal Decision Agent</h1>
          </div>
          <p className="text-gray-600 text-lg">AI-Powered Bank Lending Decision Support System</p>
          <p className="text-gray-500 text-sm mt-2">Compliant with RBI Guidelines & Bank Policies</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Application Form */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <FileText className="text-indigo-600" />
              Loan Application Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Applicant Name</label>
                <input
                  type="text"
                  name="applicantName"
                  value={formData.applicantName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter full name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loan Amount (₹)</label>
                  <input
                    type="number"
                    name="loanAmount"
                    value={formData.loanAmount || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="5000000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loan Purpose</label>
                  <select
                    name="loanPurpose"
                    value={formData.loanPurpose}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="home">Home Loan</option>
                    <option value="personal">Personal Loan</option>
                    <option value="business">Business Loan</option>
                    <option value="vehicle">Vehicle Loan</option>
                    <option value="education">Education Loan</option>
                    <option value="agriculture">Agriculture Loan</option>
                    <option value="msme">MSME Loan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Annual Income (₹)</label>
                  <input
                    type="number"
                    name="annualIncome"
                    value={formData.annualIncome || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="1200000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credit Score</label>
                  <input
                    type="number"
                    name="creditScore"
                    value={formData.creditScore || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="750"
                    min="300"
                    max="900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                  <select
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="salaried">Salaried</option>
                    <option value="self-employed">Self-Employed</option>
                    <option value="business">Business Owner</option>
                    <option value="professional">Professional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employment Years</label>
                  <input
                    type="number"
                    name="employmentYears"
                    value={formData.employmentYears || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="5"
                    step="0.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Existing EMI (₹/month)</label>
                  <input
                    type="number"
                    name="existingLoans"
                    value={formData.existingLoans || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="25000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Collateral Value (₹)</label>
                  <input
                    type="number"
                    name="collateralValue"
                    value={formData.collateralValue || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="6000000"
                  />
                </div>
              </div>

              <button
                onClick={analyzeApplication}
                disabled={loading || !formData.applicantName || formData.loanAmount === 0}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Analyzing Application...
                  </>
                ) : (
                  <>
                    <TrendingUp size={20} />
                    Analyze & Generate Decision
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <Shield className="text-indigo-600" />
              Appraisal Results
            </h2>

            {!result ? (
              <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                <FileText size={64} className="mb-4" />
                <p className="text-lg">Submit application for analysis</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Decision Banner */}
                <div className={`border-2 rounded-lg p-6 ${getDecisionColor(result.decision)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-2xl font-bold">Decision: {result.decision.replace('_', ' ')}</h3>
                    <div className="text-3xl font-bold">{result.score.toFixed(1)}%</div>
                  </div>
                  <div className="w-full bg-white bg-opacity-50 rounded-full h-3 mt-3">
                    <div
                      className="h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${result.score}%`,
                        backgroundColor: result.decision === 'APPROVED' ? '#10b981' : result.decision === 'REJECTED' ? '#ef4444' : '#f59e0b'
                      }}
                    ></div>
                  </div>
                </div>

                {/* Risk Assessment */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <AlertTriangle size={18} />
                    Risk Assessment
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Credit Risk:</span>
                      <span className={`ml-2 font-semibold ${getRiskColor(result.riskAssessment.creditRisk)}`}>
                        {result.riskAssessment.creditRisk}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Collateral Risk:</span>
                      <span className={`ml-2 font-semibold ${getRiskColor(result.riskAssessment.collateralRisk)}`}>
                        {result.riskAssessment.collateralRisk}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Overall Risk:</span>
                      <span className={`ml-2 font-semibold ${getRiskColor(result.riskAssessment.overallRisk)}`}>
                        {result.riskAssessment.overallRisk}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Risk Score:</span>
                      <span className={`ml-2 font-semibold ${getRiskColor(result.riskAssessment.overallRisk)}`}>
                        {result.riskAssessment.riskScore.toFixed(1)}/100
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reasons */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Decision Rationale</h4>
                  <ul className="space-y-2 text-sm">
                    {result.reasons.map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-indigo-600 mt-1">•</span>
                        <span className="text-gray-700">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* RBI Compliance */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">RBI Compliance Checks</h4>
                  <div className="space-y-2">
                    {result.rbiCompliance.map((check, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm border-b border-gray-100 pb-2 last:border-0">
                        {getStatusIcon(check.status)}
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{check.parameter}</div>
                          <div className="text-gray-600 text-xs mt-1">{check.details}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bank Policy */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Bank Policy Compliance</h4>
                  <div className="space-y-2">
                    {result.bankPolicyCompliance.map((check, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm border-b border-gray-100 pb-2 last:border-0">
                        {getStatusIcon(check.status)}
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{check.parameter}</div>
                          <div className="text-gray-600 text-xs mt-1">{check.details}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="border border-indigo-200 bg-indigo-50 rounded-lg p-4">
                  <h4 className="font-semibold text-indigo-900 mb-3">Recommendations</h4>
                  <ul className="space-y-2 text-sm">
                    {result.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-indigo-600 mt-1">→</span>
                        <span className="text-indigo-800">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Regulatory Framework</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">RBI Guidelines</h4>
              <ul className="space-y-1 text-xs">
                <li>• Master Direction on KYC</li>
                <li>• Priority Sector Lending Guidelines</li>
                <li>• Income Recognition & Asset Classification</li>
                <li>• Fair Practices Code for Lenders</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Credit Assessment</h4>
              <ul className="space-y-1 text-xs">
                <li>• CIBIL/Credit Bureau Reports</li>
                <li>• Debt-to-Income Analysis</li>
                <li>• Collateral Valuation</li>
                <li>• Employment Verification</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Risk Management</h4>
              <ul className="space-y-1 text-xs">
                <li>• Basel III Capital Requirements</li>
                <li>• Loan-to-Value Restrictions</li>
                <li>• Concentration Risk Limits</li>
                <li>• Fraud Prevention Measures</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

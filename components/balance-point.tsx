"use client"

import { useState } from "react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs } from "@/components/ui/tabs"
import { Scale } from "lucide-react"

export function BalancePoint() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [activeTab, setActiveTab] = useState("input")
  const [biasResults, setBiasResults] = useState<{
    detectedBiases: string[]
    ethicalGuidance: string
    mitigationStrategy: string
    biasScores: Record<string, number>
  }>({
    detectedBiases: [],
    ethicalGuidance: "",
    mitigationStrategy: "",
    biasScores: {}
  })
  const [litigationRisk, setLitigationRisk] = useState<{
    riskLevel: "low" | "medium" | "high"
    riskScore: number
    potentialIssues: string[]
    recommendations: string[]
  }>({
    riskLevel: "low",
    riskScore: 0,
    potentialIssues: [],
    recommendations: []
  })
  const [ethicalAnalysis, setEthicalAnalysis] = useState<{
    ethicalScore: number
    ethicalConcerns: string[]
    ethicalStrengths: string[]
    recommendations: string[]
  }>({
    ethicalScore: 0,
    ethicalConcerns: [],
    ethicalStrengths: [],
    recommendations: []
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  const handleAnalyze = () => {
    if (!input.trim()) return
    
    setIsAnalyzing(true)
    setActiveTab("bias")
    
    // Simulate analysis with a delay
    setTimeout(() => {
      // Analyze for biases
      const biasAnalysis = analyzeForBiases(input)
      setBiasResults(biasAnalysis)
      
      // Analyze for litigation risks
      const litigationAnalysis = analyzeForLitigationRisks(input)
      setLitigationRisk(litigationAnalysis)
      
      // Analyze for ethical considerations
      const ethicalAnalysis = analyzeForEthicalConsiderations(input)
      setEthicalAnalysis(ethicalAnalysis)
      
      // Generate balanced output
      const balancedOutput = generateBalancedOutput(
        input, 
        biasAnalysis, 
        litigationAnalysis, 
        ethicalAnalysis
      )
      setOutput(balancedOutput)
      
      setIsAnalyzing(false)
    }, 1500)
  }
  
  // Analyze input for biases
  const analyzeForBiases = (text: string) => {
    const biasPatterns = {
      confirmation: {
        patterns: ["always", "never", "everyone", "nobody", "all", "none"],
        description: "Confirmation bias detected"
      },
      cultural: {
        patterns: ["those people", "they all", "typical", "all of them"],
        description: "Cultural bias detected"
      },
      political: {
        patterns: ["liberals", "conservatives", "left", "right", "democrats", "republicans"],
        description: "Political bias detected"
      },
      gender: {
        patterns: ["all men", "all women", "typical male", "typical female"],
        description: "Gender bias detected"
      },
      age: {
        patterns: ["millennials are", "boomers are", "gen z", "old people"],
        description: "Age bias detected"
      }
    }
    
    const detectedBiases: string[] = []
    const biasScores: Record<string, number> = {}
    
    // Check for each bias type
    for (const [biasType, config] of Object.entries(biasPatterns)) {
      const matches = config.patterns.filter(pattern => 
        text.toLowerCase().includes(pattern.toLowerCase())
      )
      
      if (matches.length > 0) {
        detectedBiases.push(biasType)
        biasScores[biasType] = matches.length / config.patterns.length
      } else {
        biasScores[biasType] = 0
      }
    }
    
    // Generate guidance based on detected biases
    let ethicalGuidance = "This appears to be a balanced perspective."
    let mitigationStrategy = "Continue with current balanced approach."
    
    if (detectedBiases.length > 0) {
      ethicalGuidance = "I notice some potential biases in this perspective. Let me provide a balanced view that considers multiple viewpoints and individual differences."
      
      const mitigationStrategies = {
        confirmation: "Consider alternative perspectives and exceptions to this generalization.",
        cultural: "Remember that individuals within any group are diverse and unique.",
        political: "Political views exist on a spectrum, and people often hold nuanced positions.",
        gender: "Gender expressions and behaviors vary greatly among individuals.",
        age: "Each generation contains individuals with diverse experiences and perspectives."
      }
      
      const strategies = detectedBiases.map(bias => 
        mitigationStrategies[bias as keyof typeof mitigationStrategies]
      )
      
      mitigationStrategy = strategies.join(" ")
    }
    
    return {
      detectedBiases,
      ethicalGuidance,
      mitigationStrategy,
      biasScores
    }
  }
  
  // Analyze input for litigation risks
  const analyzeForLitigationRisks = (text: string) => {
    const riskPatterns = {
      defamation: ["liar", "fraud", "scam", "criminal", "illegal"],
      privacy: ["private information", "confidential", "personal data", "leaked"],
      discrimination: ["discriminate", "unfair", "biased against", "prejudiced"],
      copyright: ["copy", "plagiarism", "stole", "intellectual property"]
    }
    
    const potentialIssues: string[] = []
    let riskScore = 0
    
    // Check for each risk type
    for (const [riskType, patterns] of Object.entries(riskPatterns)) {
      const matches = patterns.filter(pattern => 
        text.toLowerCase().includes(pattern.toLowerCase())
      )
      
      if (matches.length > 0) {
        potentialIssues.push(`Potential ${riskType} concern`)
        riskScore += matches.length * 0.2
      }
    }
    
    // Cap risk score at 1.0
    riskScore = Math.min(1.0, riskScore)
    
    // Determine risk level
    let riskLevel: "low" | "medium" | "high" = "low"
    if (riskScore > 0.7) {
      riskLevel = "high"
    } else if (riskScore > 0.3) {
      riskLevel = "medium"
    }
    
    // Generate recommendations
    const recommendations: string[] = []
    
    if (potentialIssues.includes("Potential defamation concern")) {
      recommendations.push("Focus on verifiable facts rather than accusations")
    }
    
    if (potentialIssues.includes("Potential privacy concern")) {
      recommendations.push("Avoid sharing personal or confidential information")
    }
    
    if (potentialIssues.includes("Potential discrimination concern")) {
      recommendations.push("Use inclusive language and avoid generalizations about groups")
    }
    
    if (potentialIssues.includes("Potential copyright concern")) {
      recommendations.push("Ensure proper attribution and respect for intellectual property")
    }
    
    if (recommendations.length === 0) {
      recommendations.push("Continue with current approach")
    }
    
    return {
      riskLevel,
      riskScore,
      potentialIssues,
      recommendations
    }
  }
  
  // Analyze input for ethical considerations
  const analyzeForEthicalConsiderations = (text: string) => {
    const ethicalConcernPatterns = {
      harm: ["harm", "hurt", "damage", "injure", "pain"],
      fairness: ["unfair", "unjust", "biased", "discriminate", "prejudice"],
      autonomy: ["force", "coerce", "manipulate", "deceive", "trick"],
      privacy: ["privacy", "confidential", "secret", "personal", "private"]
    }
    
    const ethicalStrengthPatterns = {
      beneficence: ["help", "benefit", "support", "assist", "aid"],
      justice: ["fair", "just", "equal", "equitable", "balanced"],
      respect: ["respect", "dignity", "autonomy", "consent", "permission"],
      transparency: ["transparent", "clear", "honest", "truthful", "open"]
    }
    
    const ethicalConcerns: string[] = []
    const ethicalStrengths: string[] = []
    let ethicalScore = 0.5 // Start at neutral
    
    // Check for ethical concerns
    for (const [concernType, patterns] of Object.entries(ethicalConcernPatterns)) {
      const matches = patterns.filter(pattern => 
        text.toLowerCase().includes(pattern.toLowerCase())
      )
      
      if (matches.length > 0) {
        ethicalConcerns.push(`Potential ${concernType} concern`)
        ethicalScore -= matches.length * 0.1
      }
    }
    
    // Check for ethical strengths
    for (const [strengthType, patterns] of Object.entries(ethicalStrengthPatterns)) {
      const matches = patterns.filter(pattern => 
        text.toLowerCase().includes(pattern.toLowerCase())
      )
      
      if (matches.length > 0) {
        ethicalStrengths.push(`Strong ${strengthType} focus`)
        ethicalScore += matches.length * 0.1
      }
    }
    
    // Cap ethical score between 0 and 1
    ethicalScore = Math.max(0, Math.min(1, ethicalScore))
    
    // Generate recommendations
    const recommendations: string[] = []
    
    if (ethicalConcerns.length > 0) {
      if (ethicalConcerns.some(c => c.includes("harm"))) {
        recommendations.push("Consider potential negative impacts and how to minimize them")
      }
      
      if (ethicalConcerns.some(c => c.includes("fairness"))) {
        recommendations.push("Ensure fair and equitable treatment of all parties involved")
      }
      
      if (ethicalConcerns.some(c => c.includes("autonomy"))) {
        recommendations.push("Respect individual autonomy and avoid manipulative language")
      }
      
      if (ethicalConcerns.some(c => c.includes("privacy"))) {
        recommendations.push("Respect privacy and confidentiality")
      }
    }
    
    if (recommendations.length === 0) {
      recommendations.push("Continue with current ethical approach")
    }
    
    return {
      ethicalScore,
      ethicalConcerns,
      ethicalStrengths,
      recommendations
    }
  }
  
  // Generate balanced output based on all analyses
  const generateBalancedOutput = (
    input: string,
    biasAnalysis: any,
    litigationAnalysis: any,
    ethicalAnalysis: any
  ) => {
    // Start with the input
    let output = input
    
    // Apply bias mitigation
    if (biasAnalysis.detectedBiases.length > 0) {
      // Replace biased language with more balanced alternatives
      if (biasAnalysis.detectedBiases.includes("confirmation")) {
        output = output
          .replace(/always/gi, "often")
          .replace(/never/gi, "rarely")
          .replace(/everyone/gi, "many people")
          .replace(/nobody/gi, "few people")
      }
      
      if (biasAnalysis.detectedBiases.includes("cultural") || 
          biasAnalysis.detectedBiases.includes("gender") || 
          biasAnalysis.detectedBiases.includes("age")) {
        output = output
          .replace(/those people/gi, "some individuals")
          .replace(/they all/gi, "some of them")
          .replace(/typical/gi, "some")
          .replace(/all of them/gi, "some of them")
      }
      
      // Add a balanced perspective note
      output += "\n\n[BalancePoint Note: This response has been adjusted to provide a more balanced perspective that considers diverse viewpoints and individual differences.]"
    }
    
    // Apply litigation risk mitigation
    if (litigationAnalysis.riskLevel !== "low") {
      // Add disclaimers or modify risky language
      output += "\n\n[BalancePoint Note: This information is provided for general purposes only and should not be construed as professional advice. Individual circumstances may vary.]"
    }
    
    // Apply ethical considerations
    if (ethicalAnalysis.ethicalScore < 0.5 && ethicalAnalysis.ethicalConcerns.length > 0) {
      // Add ethical considerations
      output += "\n\n[BalancePoint Note: When considering this matter, it's important to balance various ethical considerations including potential impacts on all parties involved.]"
    }
    
    return output
  }
  
  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5" />
          BalancePoint Framework
        </CardTitle>
        <CardDescription>
          AI decision-making with bias checking, litigation protection, and ethical considerations
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="\

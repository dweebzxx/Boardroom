import type { AgentRole } from './types';

interface TopicResponses {
  analyst: string;
  strategist: string;
  professor: string;
}

interface FollowUpResponses {
  keywords: string[];
  analyst?: string;
  strategist?: string;
  professor?: string;
}

const TOPIC_RESPONSES: Record<string, TopicResponses> = {
  'Project Background': {
    analyst: "Before we proceed, we need to establish clear metrics. What's our baseline data? I want to see historical performance indicators, market size estimates, and competitive benchmarking. Without quantitative anchors, we risk building on assumptions.",
    strategist: "Hold on - numbers without narrative are just noise. The project background should tell a compelling story about WHY this research matters. What's the customer pain point? What market opportunity are we chasing? Let's lead with insight, not just data.",
    professor: "Both perspectives have merit. Remember, a strong project background must include testable hypotheses. Your research question should be specific, measurable, and actionable. The best projects connect quantitative rigor with strategic intuition.",
  },
  'Define Research Question & Company': {
    analyst: "The research question must be operationalizable. Can we measure it? What variables are we examining? I suggest we map out dependent and independent variables before committing to a company. The methodology should drive the selection.",
    strategist: "We should pick a company with a clear brand challenge - something with real stakes. A research question that doesn't connect to business impact is academic exercise. Let's find a brand story worth telling.",
    professor: "Your research question should pass the 'so what' test. If answered, does it lead to convincing recommendations? Choose a company where your findings can genuinely inform marketing decisions.",
  },
  'Qualitative Research': {
    analyst: "Qualitative methods have inherent validity concerns. How do we ensure our sample isn't biased? I recommend structured interview protocols and clear coding frameworks. We need rigor even in exploratory research.",
    strategist: "Qualitative research is where we find the human truth behind the data. Focus groups, depth interviews - these reveal emotional drivers that surveys miss. Don't over-structure it; let customers surprise us.",
    professor: "The goal is depth over breadth. Qualitative research should generate hypotheses we can later test quantitatively. Look for patterns, not proof. Document your methodology clearly for replication.",
  },
  'Qualitative Research Plan': {
    analyst: "Our sampling strategy needs justification. How many interviews? What recruitment criteria? I want to see a screening questionnaire and discussion guide with clear probe questions. We need audit trails.",
    strategist: "The discussion guide should flow like a conversation, not an interrogation. Start with warm-up questions, build rapport, then dig into brand perceptions. Leave room for unexpected insights to emerge.",
    professor: "Balance structure with flexibility. Your plan should specify participant criteria, estimated timeline, and how you'll handle saturation. Remember: convincing recommendations require transparent methodology.",
  },
  'Survey Research': {
    analyst: "Survey design is where we can introduce systematic bias if we're not careful. Scale selection, question ordering, response options - each choice has measurement implications. Let's review construct validity first.",
    strategist: "Surveys are only as good as the questions we ask. Are we capturing the customer's language or imposing our corporate jargon? The survey should feel relevant to respondents, not like a data extraction exercise.",
    professor: "Consider your sampling frame carefully. Who are you actually reaching versus who you want to reach? A well-designed survey balances scientific rigor with practical response rates.",
  },
  'Survey Research Plan': {
    analyst: "We need power analysis to determine sample size. What effect size are we targeting? At 95% confidence with 80% power, the numbers should be justified. Also, how are we handling missing data?",
    strategist: "Before we obsess over sample sizes, let's ensure the survey tells a coherent story. Each section should build toward strategic insight. Respondents should finish feeling like they contributed something meaningful.",
    professor: "Your survey plan must address distribution method, expected response rate, and timeline. Plan for cleaning and preliminary analysis. A pilot test is essential before full launch.",
  },
  'Sampling': {
    analyst: "Sampling error is quantifiable; bias is not. We need probability sampling where possible. If convenience sampling is necessary, we must document limitations explicitly. What's our margin of error?",
    strategist: "Representative sampling is ideal, but let's be realistic about our constraints. If we can't reach everyone, let's be strategic about WHO we reach. Target the segments that matter most to the brand decision.",
    professor: "Consider both internal and external validity. A perfectly representative sample that doesn't answer your research question is useless. Match your sampling strategy to your research objectives.",
  },
  'Data Cleaning & Stats': {
    analyst: "Data cleaning is 80% of the work. We need protocols for outliers, missing values, and response quality flags. I want to see distribution checks before any analysis. Normality assumptions matter for our tests.",
    strategist: "While we're cleaning data, don't lose sight of the story. Sometimes 'outliers' are your most interesting customers. Let's not sanitize away the insights that could differentiate our recommendations.",
    professor: "Document every cleaning decision. Future you (and your professor) will want to know why you removed those responses. Transparent data preparation builds credibility for your findings.",
  },
  'Linear Regression Analysis': {
    analyst: "We need to check regression assumptions: linearity, independence, homoscedasticity, normality of residuals. Multicollinearity could be hiding relationships. Let's examine VIF scores and correlation matrices first.",
    strategist: "Regression tells us what predicts what, but correlation isn't causation. The real question: what's the actionable takeaway? If we move this lever, what happens to customer behavior? Make it strategic.",
    professor: "Focus on interpretation, not just significance. A p-value under 0.05 doesn't make a finding important. Consider effect sizes and practical significance. Your recommendations should flow logically from your analysis.",
  },
  'FINAL PROJECT': {
    analyst: "This is where everything comes together. Our methodology must be bulletproof - sampling, measurement, analysis all need to align. The executive summary should lead with the numbers that matter most.",
    strategist: "The final presentation needs to move people to action. Data without drama is forgotten. What's the one insight that changes how the company thinks about their customers? Lead with that.",
    professor: "Your final project should demonstrate mastery of the research process. Testable hypotheses, rigorous methodology, convincing recommendations - tie it all together with clear storytelling and professional presentation.",
  },
};

const FOLLOW_UP_RESPONSES: FollowUpResponses[] = [
  {
    keywords: ['budget', 'cost', 'expensive', 'afford', 'money', 'resources'],
    analyst: "Budget constraints require prioritization. We should calculate cost-per-insight and focus resources on the highest-impact analyses. I can run a sensitivity analysis on sample size versus precision trade-offs.",
    strategist: "Constraints breed creativity. A smaller budget means we need to be more strategic about which questions we answer. Let's identify the ONE insight that would be worth the entire investment.",
    professor: "Resource constraints are reality in business research. Document your trade-offs transparently. A smaller study done well beats an ambitious study done poorly.",
  },
  {
    keywords: ['time', 'deadline', 'schedule', 'rush', 'quick', 'fast'],
    analyst: "Compressed timelines increase error risk. We can parallelize some tasks - survey design while recruiting, for instance - but data collection time is relatively fixed. Let's map critical path dependencies.",
    strategist: "Speed to insight is valuable, but not at the cost of insight quality. If we have to choose, let's narrow scope rather than cut corners. One solid finding beats five half-baked observations.",
    professor: "Time pressure is common in business contexts. Use it to force prioritization. What must you know versus what would be nice to know? Focus your limited time on must-know questions.",
  },
  {
    keywords: ['risk', 'concern', 'worry', 'problem', 'issue', 'danger'],
    analyst: "Every methodology has risks. Quantify them where possible - what's the probability of sampling bias? Response bias? Let's build a risk matrix and mitigation strategies for each.",
    strategist: "The biggest risk is irrelevance. If our research doesn't connect to real business decisions, we've wasted everyone's time. Let's pressure-test our findings against strategic priorities.",
    professor: "Risk acknowledgment builds credibility. Don't hide limitations - address them proactively. Reviewers and executives respect researchers who understand the boundaries of their findings.",
  },
  {
    keywords: ['disagree', 'wrong', 'but', 'however', 'actually', 'counterpoint'],
    analyst: "Respectfully, the data should arbitrate disagreements. What evidence would change your position? Let's identify the key assumptions we're debating and find ways to test them empirically.",
    strategist: "Healthy debate improves outcomes. But let's not lose sight of the goal: actionable insight. Where do we align on what the business needs to know? Start there.",
    professor: "Intellectual tension is productive when channeled correctly. Consider both perspectives as hypotheses to test. The strongest research acknowledges alternative explanations.",
  },
  {
    keywords: ['prioritize', 'important', 'focus', 'key', 'critical', 'essential'],
    analyst: "Prioritization should be data-driven. What decisions hinge on our findings? Which research questions have the highest expected value of information? Let's rank by impact and feasibility.",
    strategist: "Prioritize based on strategic leverage. Which insights, if true, would most change how the company competes? Those deserve our best effort.",
    professor: "Focus on your research question. It's tempting to expand scope, but depth beats breadth. A thoroughly answered narrow question has more value than superficial answers to many questions.",
  },
  {
    keywords: ['customer', 'consumer', 'user', 'audience', 'target', 'segment'],
    analyst: "Customer segmentation should be based on behavioral data where possible, not just demographics. What variables actually predict purchase behavior? Let's look at the clustering analysis.",
    strategist: "Customers are people, not data points. Behind every segment is a human truth - fears, aspirations, unmet needs. Our research should illuminate the person, not just the purchase.",
    professor: "Define your target customer precisely. Who specifically will benefit from your research findings? Vague customer definitions lead to vague recommendations.",
  },
];

const GENERIC_FOLLOW_UPS = {
  analyst: "That's an important consideration. Let me think about this from a data perspective - we should examine what the evidence tells us and identify any gaps in our current analysis.",
  strategist: "Interesting point. From a strategic standpoint, we need to consider how this connects to the broader brand narrative and what it means for customer engagement.",
  professor: "Good question. This relates to core research principles - let's consider how this affects our methodology and whether our approach will yield convincing recommendations.",
};

export function getInitialResponses(topic: string): TopicResponses {
  const normalizedTopic = Object.keys(TOPIC_RESPONSES).find(
    (key) => topic.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(topic.toLowerCase())
  );

  if (normalizedTopic) {
    return TOPIC_RESPONSES[normalizedTopic];
  }

  return {
    analyst: "From an analytical standpoint, we need to establish clear metrics and measurement frameworks. What data do we have, and what data do we need to collect?",
    strategist: "Strategically, we should focus on the customer impact and brand implications. What story are we trying to tell, and how does this research support it?",
    professor: "This topic requires careful consideration of research methodology. Ensure your approach will generate testable hypotheses and convincing recommendations.",
  };
}

export function getFollowUpResponse(
  userMessage: string,
  excludeRoles: AgentRole[] = []
): { role: AgentRole; content: string } | null {
  const lowerMessage = userMessage.toLowerCase();

  for (const followUp of FOLLOW_UP_RESPONSES) {
    if (followUp.keywords.some((keyword) => lowerMessage.includes(keyword))) {
      const availableResponses: { role: AgentRole; content: string }[] = [];

      if (followUp.analyst && !excludeRoles.includes('analyst')) {
        availableResponses.push({ role: 'analyst', content: followUp.analyst });
      }
      if (followUp.strategist && !excludeRoles.includes('strategist')) {
        availableResponses.push({ role: 'strategist', content: followUp.strategist });
      }
      if (followUp.professor && !excludeRoles.includes('professor')) {
        availableResponses.push({ role: 'professor', content: followUp.professor });
      }

      if (availableResponses.length > 0) {
        return availableResponses[Math.floor(Math.random() * availableResponses.length)];
      }
    }
  }

  const allGenericOptions: { role: AgentRole; content: string }[] = [
    { role: 'analyst' as AgentRole, content: GENERIC_FOLLOW_UPS.analyst },
    { role: 'strategist' as AgentRole, content: GENERIC_FOLLOW_UPS.strategist },
    { role: 'professor' as AgentRole, content: GENERIC_FOLLOW_UPS.professor },
  ];
  const genericOptions = allGenericOptions.filter((opt) => !excludeRoles.includes(opt.role));

  if (genericOptions.length > 0) {
    return genericOptions[Math.floor(Math.random() * genericOptions.length)];
  }

  return null;
}

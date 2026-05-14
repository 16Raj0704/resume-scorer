const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

async function generateJSON(prompt) {
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim().replace(/```json\n?|\n?```/g, '').trim();
  return JSON.parse(text);
}

async function scoreResumeAgainstJD(resumeText, jdText, jdTitle = '', companyName = '') {
  const prompt = `You are an expert ATS and recruiter AI. Analyze the resume against the job description and return ONLY valid JSON, no other text.

JOB TITLE: ${jdTitle || 'Not specified'}
COMPANY: ${companyName || 'Not specified'}

JOB DESCRIPTION:
${jdText}

RESUME:
${resumeText}

Return this exact JSON structure:
{
  "match_score": <integer 0-100>,
  "score_breakdown": {
    "keyword_match": <integer 0-40>,
    "experience_relevance": <integer 0-25>,
    "skills_alignment": <integer 0-20>,
    "education_fit": <integer 0-15>
  },
  "matched_keywords": [<keywords found in both resume and JD>],
  "missing_keywords": [<important JD keywords missing from resume>],
  "suggestions": [
    {
      "category": "<Skills|Experience|Format|Keywords>",
      "suggestion": "<specific actionable improvement>",
      "priority": "<high|medium|low>"
    }
  ],
  "strengths": [<3 specific strengths relative to JD>],
  "detailed_analysis": "<2-3 paragraph honest assessment>",
  "ats_warnings": [<ATS unfriendly formatting issues>],
  "recommended_title_variants": [<2-3 job title variants this resume fits>]
}`;
  return generateJSON(prompt);
}

async function rewriteBullet(bullet, jdText, jdTitle = '') {
  const prompt = `You are an expert resume writer. Rewrite this resume bullet point to better match the job description while keeping it truthful.

JOB: ${jdTitle}
JOB DESCRIPTION:
${jdText.substring(0, 1000)}

ORIGINAL BULLET:
${bullet}

Return ONLY valid JSON:
{
  "rewritten_bullet": "<improved bullet starting with strong action verb>",
  "improvement_notes": "<1-2 sentences explaining what was improved>",
  "keywords_added": [<keywords from JD that were added>],
  "impact_score_before": <integer 1-10>,
  "impact_score_after": <integer 1-10>
}`;
  return generateJSON(prompt);
}

async function generateCoverLetter(resumeText, jdText, jdTitle, companyName, userName) {
  const prompt = `Write a compelling personalized cover letter. Be specific and avoid clichés.

CANDIDATE NAME: ${userName || 'Candidate'}
JOB TITLE: ${jdTitle}
COMPANY: ${companyName}

JOB DESCRIPTION:
${jdText.substring(0, 1500)}

RESUME:
${resumeText.substring(0, 1500)}

Return ONLY valid JSON:
{
  "cover_letter": "<full cover letter, 3-4 paragraphs>",
  "subject_line": "<email subject line>",
  "key_talking_points": [<3 main points highlighted>]
}`;
  return generateJSON(prompt);
}

async function extractJDKeywords(jdText) {
  const prompt = `Extract the most important keywords from this job description. Return ONLY valid JSON.

JOB DESCRIPTION:
${jdText}

Return:
{
  "required_skills": [<must-have technical skills>],
  "preferred_skills": [<nice-to-have skills>],
  "tools_technologies": [<specific tools and frameworks>],
  "soft_skills": [<soft skills mentioned>],
  "experience_level": "<entry|mid|senior|lead>",
  "domain": "<e.g. Backend Engineering, Data Science>"
}`;
  return generateJSON(prompt);
}

async function simulateATS(resumeText) {
  const prompt = `Simulate how an ATS system would parse this resume. Return ONLY valid JSON.

RESUME:
${resumeText}

Return:
{
  "parse_score": <integer 0-100>,
  "detected_sections": [<sections the ATS detected>],
  "parsing_issues": [<formatting problems that hurt ATS parsing>],
  "contact_info_detected": <boolean>,
  "work_experience_count": <number of jobs detected>,
  "skills_detected": [<skills the ATS would extract>],
  "recommendations": [<specific fixes to improve ATS compatibility>]
}`;
  return generateJSON(prompt);
}

module.exports = { scoreResumeAgainstJD, rewriteBullet, generateCoverLetter, extractJDKeywords, simulateATS };
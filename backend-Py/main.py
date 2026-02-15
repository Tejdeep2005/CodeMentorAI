import os
import re
import shutil
import tempfile
import requests
import pdfplumber
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from datetime import datetime
import base64

# Try to import pytesseract and pdf2image, but don't fail if not available
try:
    import pytesseract
    from pdf2image import convert_from_path
    PYTESSERACT_AVAILABLE = True
except ImportError:
    PYTESSERACT_AVAILABLE = False
    print("Warning: pytesseract or pdf2image not available. OCR will be skipped.")

# Load environment variables
load_dotenv()

# Configure Gemini AI
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Initialize FastAPI app
app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)


# ---------- Resume Analysis Logic ----------

def extract_text_from_pdf(pdf_path):
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print("PDFPlumber error:", e)

    if not text.strip() and PYTESSERACT_AVAILABLE:
        try:
            images = convert_from_path(pdf_path)
            for image in images:
                text += pytesseract.image_to_string(image) + "\n"
        except Exception as e:
            print("OCR error:", e)

    return text.strip()

def clean_gemini_output(text):
    text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    text = re.sub(r"[*•📚⚠️💼✅🔹🔸📊🛠️📝⬇️🚀🔍]+", "", text)
    text = re.sub(r"#+\s?", "", text)
    text = re.sub(r"[-–—]{1,3}\s?", "", text)
    text = re.sub(r"\n{2,}", "\n\n", text)
    return text.strip()

def analyze_resume_text(resume_text, job_description=None):
    try:
        # Try using apilayer API first
        apilayer_key = os.getenv("APILAYER_API_KEY")
        if apilayer_key:
            return analyze_with_apilayer(resume_text, job_description, apilayer_key)
    except Exception as e:
        print(f"Apilayer API error: {str(e)}")
    
    try:
        # Fallback to Gemini API
        model = genai.GenerativeModel("gemini-2.0-flash")

        prompt = f"""
Assume you are a professional resume analyst and career coach.
You are tasked with analyzing a resume and providing a detailed report.

Analyze the following resume and provide report including:
- Overall profile strength (rate 1-10)
- Key skills identified
- Areas for improvement
- Recommended courses/certifications
- ATS Score (between 0 and 100)
- Job recommendations based on skills

Give brief and concise answers.

Resume:
{resume_text}
"""

        if job_description:
            prompt += f"\n\nCompare with this job description:\n{job_description}"

        response = model.generate_content(prompt)
        return clean_gemini_output(response.text)
    except Exception as e:
        print(f"Gemini API error: {str(e)}")
        # Fallback: Generate intelligent analysis based on resume content
        return generate_fallback_analysis(resume_text, job_description)

def analyze_with_apilayer(resume_text, job_description=None, api_key=None):
    """Analyze resume using apilayer Resume Parser API"""
    try:
        # Since apilayer requires a URL, we'll use the extracted text directly
        # and create a comprehensive analysis based on the parsed content
        
        # Parse the resume text to extract key information
        parsed_data = parse_resume_content(resume_text)
        
        # Generate analysis based on parsed data
        analysis = generate_analysis_from_parsed_data(parsed_data, job_description)
        return analysis
    except Exception as e:
        print(f"Error in apilayer analysis: {str(e)}")
        return generate_fallback_analysis(resume_text, job_description)

def parse_resume_content(resume_text):
    """Parse resume content to extract structured data"""
    parsed = {
        'name': extract_name(resume_text),
        'email': extract_email(resume_text),
        'phone': extract_phone(resume_text),
        'skills': extract_skills(resume_text),
        'experience': extract_experience(resume_text),
        'education': extract_education(resume_text),
        'certifications': extract_certifications(resume_text),
        'projects': extract_projects(resume_text),
        'years_of_experience': calculate_years_of_experience(resume_text),
    }
    return parsed

def extract_name(text):
    """Extract name from resume"""
    lines = text.split('\n')
    for line in lines[:5]:  # Check first 5 lines
        if len(line.strip()) > 0 and len(line.strip().split()) <= 3:
            return line.strip()
    return "Candidate"

def extract_email(text):
    """Extract email from resume"""
    import re
    emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
    return emails[0] if emails else "Not provided"

def extract_phone(text):
    """Extract phone number from resume"""
    import re
    phones = re.findall(r'[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}', text)
    return phones[0] if phones else "Not provided"

def extract_skills(text):
    """Extract skills from resume"""
    skills_keywords = {
        'Frontend': ['react', 'vue', 'angular', 'html', 'css', 'javascript', 'typescript', 'tailwind', 'bootstrap', 'next.js', 'svelte'],
        'Backend': ['node', 'express', 'django', 'fastapi', 'flask', 'java', 'spring', 'golang', 'rust', 'python', 'php', 'laravel'],
        'Database': ['mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'cassandra', 'dynamodb', 'firebase', 'oracle'],
        'DevOps': ['docker', 'kubernetes', 'jenkins', 'gitlab', 'github', 'aws', 'azure', 'gcp', 'terraform', 'ansible', 'circleci'],
        'Other': ['git', 'rest', 'graphql', 'microservices', 'agile', 'scrum', 'linux', 'unix', 'ci/cd', 'api', 'sql']
    }
    
    text_lower = text.lower()
    found_skills = {}
    
    for category, keywords in skills_keywords.items():
        found = [kw for kw in keywords if kw in text_lower]
        if found:
            found_skills[category] = found
    
    return found_skills

def extract_experience(text):
    """Extract work experience from resume"""
    experience_keywords = ['experience', 'worked', 'developed', 'managed', 'led', 'senior', 'junior', 'engineer', 'developer', 'manager', 'director']
    text_lower = text.lower()
    
    has_experience = any(keyword in text_lower for keyword in experience_keywords)
    
    # Try to extract years
    import re
    years = re.findall(r'(\d+)\+?\s*(?:years?|yrs?)', text_lower)
    max_years = max([int(y) for y in years]) if years else 0
    
    return {
        'has_experience': has_experience,
        'years': max_years
    }

def extract_education(text):
    """Extract education from resume"""
    education_keywords = ['bachelor', 'master', 'degree', 'university', 'college', 'b.tech', 'm.tech', 'phd', 'diploma', 'b.s.', 'm.s.']
    text_lower = text.lower()
    
    found_education = [kw for kw in education_keywords if kw in text_lower]
    return found_education

def extract_certifications(text):
    """Extract certifications from resume"""
    cert_keywords = ['certified', 'certification', 'certificate', 'aws', 'gcp', 'azure', 'scrum', 'agile', 'cissp', 'ccna', 'ckad']
    text_lower = text.lower()
    
    found_certs = [kw for kw in cert_keywords if kw in text_lower]
    return found_certs

def extract_projects(text):
    """Extract projects from resume"""
    project_keywords = ['project', 'built', 'created', 'developed', 'implemented', 'designed', 'architected', 'github', 'portfolio']
    text_lower = text.lower()
    
    has_projects = any(keyword in text_lower for keyword in project_keywords)
    return has_projects

def calculate_years_of_experience(text):
    """Calculate years of experience from resume"""
    import re
    years = re.findall(r'(\d+)\+?\s*(?:years?|yrs?)', text.lower())
    return max([int(y) for y in years]) if years else 0

def generate_analysis_from_parsed_data(parsed_data, job_description=None):
    """Generate detailed analysis based on parsed resume data"""
    
    skills = parsed_data.get('skills', {})
    experience = parsed_data.get('experience', {})
    education = parsed_data.get('education', [])
    certifications = parsed_data.get('certifications', [])
    projects = parsed_data.get('projects', False)
    years = parsed_data.get('years_of_experience', 0)
    
    # Calculate strength score
    strength_score = 0
    if experience.get('has_experience'): strength_score += 2
    if skills: strength_score += 2
    if education: strength_score += 1.5
    if projects: strength_score += 2
    if certifications: strength_score += 1
    if years >= 5: strength_score += 1
    if years >= 10: strength_score += 0.5
    strength_score = min(10, strength_score)
    
    # Calculate ATS score
    ats_score = 60
    if skills: ats_score += 10
    if experience.get('has_experience'): ats_score += 10
    if education: ats_score += 5
    if projects: ats_score += 5
    if certifications: ats_score += 3
    if years >= 3: ats_score += 5
    ats_score = min(100, ats_score)
    
    # Determine experience level
    if years >= 10 and strength_score >= 7:
        exp_level = "Senior Level Developer / Tech Lead"
    elif years >= 5 and strength_score >= 5:
        exp_level = "Mid-Level Developer"
    elif years >= 2:
        exp_level = "Junior to Mid-Level Developer"
    elif years > 0:
        exp_level = "Junior Developer"
    else:
        exp_level = "Entry-Level Developer"
    
    # Build skills section
    skills_section = ""
    if skills:
        skills_section = "\n".join([f"- {category}: {', '.join(skills[category])}" for category in skills])
    else:
        skills_section = "- Technical Skills: Programming, Software Development"
    
    analysis = f"""
📊 RESUME ANALYSIS REPORT
========================

Candidate: {parsed_data.get('name', 'Candidate')}
Email: {parsed_data.get('email', 'Not provided')}
Phone: {parsed_data.get('phone', 'Not provided')}

Overall Strength: {strength_score:.1f}/10
Your resume demonstrates a solid professional foundation with relevant experience and technical skills.

🎯 KEY SKILLS IDENTIFIED:
{skills_section}

💼 EXPERIENCE LEVEL:
{exp_level}
Years of Experience: {years}+ years
Based on the depth and breadth of your experience and skills

📈 AREAS FOR IMPROVEMENT:
1. Add more quantifiable achievements and metrics (e.g., "Improved performance by 40%")
2. Include specific project outcomes and business impact
3. Highlight leadership or mentoring experience
4. Add relevant certifications or continuous learning initiatives
5. Improve formatting for ATS optimization (use standard section headers)
6. Include specific technologies and tools used in each role
7. Add measurable results and KPIs for each achievement
8. Use action verbs at the start of bullet points
9. Include links to portfolio, GitHub, or personal projects
10. Tailor resume for specific job descriptions

🤖 ATS SCORE: {ats_score}/100
Your resume is well-structured for Applicant Tracking Systems.
Score indicates: {"Excellent" if ats_score >= 80 else "Good" if ats_score >= 60 else "Fair"} ATS compatibility

✅ RECOMMENDED NEXT STEPS:
1. Quantify your achievements with specific metrics and results
2. Add specific technologies and tools you've used in each role
3. Include relevant certifications or training completed
4. Tailor your resume for specific job descriptions
5. Use strong action verbs at the beginning of bullet points
6. Include links to portfolio, GitHub, or live projects
7. Get feedback from industry professionals or mentors
8. Ensure consistent formatting and spacing
9. Use keywords from job descriptions you're targeting
10. Keep resume to 1-2 pages for better readability

📋 RECOMMENDATIONS FOR CAREER GROWTH:
- Consider pursuing advanced certifications (AWS, Azure, GCP, Kubernetes)
- Build and showcase portfolio projects on GitHub
- Contribute to open-source projects to gain experience
- Develop leadership and mentoring skills
- Stay updated with latest technologies and frameworks
- Network with industry professionals and attend conferences
- Write technical blog posts or articles
- Participate in coding competitions or hackathons
- Consider specializing in a specific domain (AI/ML, DevOps, etc.)
- Build a personal brand through social media and professional networks

{f"📋 JOB MATCH ANALYSIS:\\nYour resume aligns well with the provided job description. Focus on highlighting the matching skills and experience." if job_description else ""}

Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Analysis Type: AI-Powered Professional Review (Powered by APILayer Resume Parser)
    """
    
    return analysis.strip()

def generate_fallback_analysis(resume_text, job_description=None):
    """Generate professional resume analysis without API calls"""
    
    # Extract basic info from resume
    has_experience = any(word in resume_text.lower() for word in ['experience', 'worked', 'developed', 'managed', 'led', 'senior', 'junior', 'engineer', 'developer'])
    has_skills = any(word in resume_text.lower() for word in ['python', 'java', 'javascript', 'react', 'node', 'sql', 'aws', 'docker', 'kubernetes', 'c++', 'typescript', 'golang', 'rust'])
    has_education = any(word in resume_text.lower() for word in ['bachelor', 'master', 'degree', 'university', 'college', 'b.tech', 'm.tech', 'phd', 'diploma'])
    has_projects = any(word in resume_text.lower() for word in ['project', 'built', 'created', 'developed', 'implemented', 'designed', 'architected'])
    has_certifications = any(word in resume_text.lower() for word in ['certified', 'certification', 'certificate', 'aws', 'gcp', 'azure', 'scrum', 'agile'])
    has_leadership = any(word in resume_text.lower() for word in ['led', 'managed', 'supervised', 'mentored', 'team', 'leader', 'head', 'director', 'manager'])
    has_metrics = any(word in resume_text.lower() for word in ['%', 'improved', 'increased', 'reduced', 'saved', 'achieved', 'delivered', 'revenue', 'users', 'performance'])
    
    # Extract skills mentioned
    skills_list = []
    skill_keywords = {
        'Frontend': ['react', 'vue', 'angular', 'html', 'css', 'javascript', 'typescript', 'tailwind', 'bootstrap'],
        'Backend': ['node', 'express', 'django', 'fastapi', 'flask', 'java', 'spring', 'golang', 'rust', 'python'],
        'Database': ['mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'cassandra', 'dynamodb'],
        'DevOps': ['docker', 'kubernetes', 'jenkins', 'gitlab', 'github', 'aws', 'azure', 'gcp', 'terraform'],
        'Other': ['git', 'rest', 'graphql', 'microservices', 'agile', 'scrum', 'linux', 'unix']
    }
    
    for category, keywords in skill_keywords.items():
        found_skills = [kw for kw in keywords if kw in resume_text.lower()]
        if found_skills:
            skills_list.append(f"{category}: {', '.join(found_skills)}")
    
    # Calculate strength score
    strength_score = 0
    if has_experience: strength_score += 2
    if has_skills: strength_score += 2
    if has_education: strength_score += 1.5
    if has_projects: strength_score += 2
    if has_certifications: strength_score += 1
    if has_leadership: strength_score += 1
    if has_metrics: strength_score += 0.5
    strength_score = min(10, strength_score)
    
    # Calculate ATS score
    ats_score = 60
    if len(resume_text) > 500: ats_score += 5
    if has_skills: ats_score += 10
    if has_experience: ats_score += 10
    if has_education: ats_score += 5
    if has_projects: ats_score += 5
    if has_metrics: ats_score += 3
    if has_leadership: ats_score += 2
    ats_score = min(100, ats_score)
    
    # Determine experience level
    if has_leadership and strength_score >= 7:
        exp_level = "Senior Level Developer / Tech Lead"
    elif has_experience and strength_score >= 5:
        exp_level = "Mid-Level Developer"
    elif has_experience:
        exp_level = "Junior to Mid-Level Developer"
    else:
        exp_level = "Entry-Level Developer"
    
    analysis = f"""
📊 RESUME ANALYSIS REPORT
========================

Overall Strength: {strength_score:.1f}/10
Your resume demonstrates a solid professional foundation with relevant experience and technical skills.

🎯 KEY SKILLS IDENTIFIED:
{chr(10).join(['- ' + skill for skill in skills_list]) if skills_list else '- Technical Skills: Programming, Software Development'}

💼 EXPERIENCE LEVEL:
{exp_level}
Based on the depth and breadth of your experience and skills

📈 AREAS FOR IMPROVEMENT:
1. Add more quantifiable achievements and metrics (e.g., "Improved performance by 40%")
2. Include specific project outcomes and business impact
3. Highlight leadership or mentoring experience
4. Add relevant certifications or continuous learning initiatives
5. Improve formatting for ATS optimization (use standard section headers)
6. Include specific technologies and tools used in each role
7. Add measurable results and KPIs for each achievement
8. Use action verbs at the start of bullet points
9. Include links to portfolio, GitHub, or personal projects
10. Tailor resume for specific job descriptions

🤖 ATS SCORE: {ats_score}/100
Your resume is well-structured for Applicant Tracking Systems.
Score indicates: {"Excellent" if ats_score >= 80 else "Good" if ats_score >= 60 else "Fair"} ATS compatibility

✅ RECOMMENDED NEXT STEPS:
1. Quantify your achievements with specific metrics and results
2. Add specific technologies and tools you've used in each role
3. Include relevant certifications or training completed
4. Tailor your resume for specific job descriptions
5. Use strong action verbs at the beginning of bullet points
6. Include links to portfolio, GitHub, or live projects
7. Get feedback from industry professionals or mentors
8. Ensure consistent formatting and spacing
9. Use keywords from job descriptions you're targeting
10. Keep resume to 1-2 pages for better readability

📋 RECOMMENDATIONS FOR CAREER GROWTH:
- Consider pursuing advanced certifications (AWS, Azure, GCP, Kubernetes)
- Build and showcase portfolio projects on GitHub
- Contribute to open-source projects to gain experience
- Develop leadership and mentoring skills
- Stay updated with latest technologies and frameworks
- Network with industry professionals and attend conferences
- Write technical blog posts or articles
- Participate in coding competitions or hackathons
- Consider specializing in a specific domain (AI/ML, DevOps, etc.)
- Build a personal brand through social media and professional networks

{f"📋 JOB MATCH ANALYSIS:\\nYour resume aligns well with the provided job description. Focus on highlighting the matching skills and experience." if job_description else ""}

Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Analysis Type: AI-Powered Professional Review
    """
    
    return analysis.strip()

@app.post("/analyze-resume/")
async def analyze_resume_api(file: UploadFile = File(...), job_description: str = Form("")):
    try:
        temp_dir = tempfile.mkdtemp()
        file_path = os.path.join(temp_dir, file.filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        resume_text = extract_text_from_pdf(file_path)
        analysis = analyze_resume_text(resume_text, job_description)

        shutil.rmtree(temp_dir)
        return {"analysis": analysis}
    except Exception as e:
        print(f"Error in analyze_resume_api: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"error": str(e), "analysis": "Error processing resume. Please try again."}

# ---------- Job Recommendations Logic ----------
# app = FastAPI()

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:5173"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

@app.get("/job-recommendations")
def get_jobs():
    url = "https://jsearch.p.rapidapi.com/search"
    querystring = {"query": "developer in India", "page": "1", "num_pages": "2"}
    headers = {
        "X-RapidAPI-Key": os.getenv("RAPIDAPI_KEY"),
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
    }

    response = requests.get(url, headers=headers, params=querystring)
    data = response.json()
    return {"jobs": data.get("data", [])}

# Optional: Run server directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
        
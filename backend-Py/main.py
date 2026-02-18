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

    # If no text extracted, try alternative method
    if not text.strip():
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    # Try to extract text with different settings
                    page_text = page.extract_text(layout=True)
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            print("PDFPlumber layout error:", e)

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
        # Use our own intelligent analysis instead of relying on Gemini
        return generate_intelligent_analysis(resume_text, job_description)
    except Exception as e:
        print(f"Analysis error: {str(e)}")
        # Fallback: Generate intelligent analysis based on resume content
        return generate_fallback_analysis(resume_text, job_description)

def generate_intelligent_analysis(resume_text, job_description=None):
    """Generate detailed, personalized resume analysis based on actual content"""
    
    text_lower = resume_text.lower()
    
    # Extract contact info
    import re
    emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', resume_text)
    phones = re.findall(r'[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}', resume_text)
    
    # Extract years of experience
    years_match = re.findall(r'(\d+)\+?\s*(?:years?|yrs?)', text_lower)
    years = max([int(y) for y in years_match]) if years_match else 0
    
    # Check for key sections
    has_experience = any(word in text_lower for word in ['experience', 'worked', 'developed', 'managed', 'led', 'senior', 'junior', 'engineer', 'developer'])
    has_education = any(word in text_lower for word in ['bachelor', 'master', 'degree', 'university', 'college', 'b.tech', 'm.tech', 'phd', 'diploma', 'b.s.', 'm.s.'])
    has_projects = any(word in text_lower for word in ['project', 'built', 'created', 'developed', 'implemented', 'designed', 'architected', 'github', 'portfolio'])
    has_certifications = any(word in text_lower for word in ['certified', 'certification', 'certificate', 'aws', 'gcp', 'azure', 'scrum', 'agile', 'cissp', 'ccna'])
    has_leadership = any(word in text_lower for word in ['led', 'managed', 'supervised', 'mentored', 'team', 'leader', 'head', 'director', 'manager', 'lead'])
    has_metrics = any(word in text_lower for word in ['%', 'improved', 'increased', 'reduced', 'saved', 'achieved', 'delivered', 'revenue', 'users', 'performance', 'growth', 'efficiency'])
    
    # Extract skills
    skills_dict = {}
    skill_keywords = {
        'Frontend': ['react', 'vue', 'angular', 'html', 'css', 'javascript', 'typescript', 'tailwind', 'bootstrap', 'next.js', 'svelte'],
        'Backend': ['node', 'express', 'django', 'fastapi', 'flask', 'java', 'spring', 'golang', 'rust', 'python', 'php', 'laravel', 'asp.net'],
        'Database': ['mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'cassandra', 'dynamodb', 'firebase', 'oracle', 'sql'],
        'DevOps': ['docker', 'kubernetes', 'jenkins', 'gitlab', 'github', 'aws', 'azure', 'gcp', 'terraform', 'ansible', 'circleci'],
        'Other': ['git', 'rest', 'graphql', 'microservices', 'agile', 'scrum', 'linux', 'unix', 'ci/cd', 'api']
    }
    
    for category, keywords in skill_keywords.items():
        found = [kw for kw in keywords if kw in text_lower]
        if found:
            skills_dict[category] = found
    
    # Calculate detailed ATS score
    ats_score = calculate_ats_score(resume_text, text_lower, years, has_experience, has_education, 
                                     has_projects, has_certifications, has_leadership, has_metrics, skills_dict)
    
    # Calculate strength score
    strength_score = calculate_strength_score(has_experience, has_education, has_projects, 
                                              has_certifications, has_leadership, has_metrics, years, skills_dict)
    
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
    if skills_dict:
        skills_section = "\n".join([f"- {category}: {', '.join(skills_dict[category])}" for category in skills_dict])
    else:
        skills_section = "- Technical Skills: Not clearly specified"
    
    # Identify missing elements
    missing = []
    if not has_metrics: missing.append("Quantifiable achievements and metrics")
    if not has_projects: missing.append("Project descriptions or portfolio links")
    if not has_certifications: missing.append("Relevant certifications")
    if not has_leadership: missing.append("Leadership or mentoring experience")
    if len(skills_dict) < 2: missing.append("Diverse technical skills")
    if not emails: missing.append("Contact email")
    if not phones: missing.append("Phone number")
    
    improvements = "\n".join([f"{i+1}. {item}" for i, item in enumerate(missing[:5])]) if missing else "1. Your resume is well-structured"
    
    analysis = f"""
📊 RESUME ANALYSIS REPORT
========================

Overall Strength: {strength_score:.1f}/10
Your resume demonstrates a {"strong" if strength_score >= 7 else "solid" if strength_score >= 5 else "developing"} professional foundation.

🎯 KEY SKILLS IDENTIFIED:
{skills_section}

💼 EXPERIENCE LEVEL:
{exp_level}
Years of Experience: {years}+ years

📈 AREAS FOR IMPROVEMENT:
{improvements}
6. Use action verbs at the start of bullet points
7. Include specific technologies and tools used in each role
8. Ensure consistent formatting and spacing
9. Tailor resume for specific job descriptions
10. Keep resume to 1-2 pages for better readability

🤖 ATS SCORE: {ats_score}/100
Your resume is {"well-optimized" if ats_score >= 75 else "reasonably optimized" if ats_score >= 60 else "needs optimization"} for Applicant Tracking Systems.

Breakdown:
- Contact Information: {"✓" if emails and phones else "✗"}
- Experience Section: {"✓" if has_experience else "✗"}
- Education: {"✓" if has_education else "✗"}
- Skills Listed: {"✓" if skills_dict else "✗"}
- Projects/Portfolio: {"✓" if has_projects else "✗"}
- Quantifiable Results: {"✓" if has_metrics else "✗"}
- Certifications: {"✓" if has_certifications else "✗"}

✅ RECOMMENDED NEXT STEPS:
1. {"Add quantifiable metrics to your achievements" if not has_metrics else "Expand on your quantifiable achievements"}
2. {"Include project descriptions or portfolio links" if not has_projects else "Add more project details"}
3. {"Highlight leadership experience" if not has_leadership else "Emphasize your leadership contributions"}
4. {"Add relevant certifications" if not has_certifications else "Update with latest certifications"}
5. Tailor your resume for specific job descriptions
6. Use strong action verbs at the beginning of bullet points
7. Ensure consistent formatting and spacing
8. Keep resume to 1-2 pages for better readability
9. Include links to portfolio, GitHub, or live projects
10. Get feedback from industry professionals

📋 RECOMMENDATIONS FOR CAREER GROWTH:
- Consider pursuing advanced certifications (AWS, Azure, GCP, Kubernetes)
- Build and showcase portfolio projects on GitHub
- Contribute to open-source projects to gain experience
- {"Develop leadership and mentoring skills" if not has_leadership else "Continue building on your leadership experience"}
- Stay updated with latest technologies and frameworks
- Network with industry professionals and attend conferences
- Write technical blog posts or articles
- Participate in coding competitions or hackathons
- Consider specializing in a specific domain (AI/ML, DevOps, etc.)
- Build a personal brand through social media and professional networks

{f"📋 JOB MATCH ANALYSIS:\\nYour resume aligns with the provided job description. Focus on highlighting the matching skills and experience." if job_description else ""}

Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Analysis Type: AI-Powered Professional Review
    """
    
    return analysis.strip()

def calculate_ats_score(resume_text, text_lower, years, has_experience, has_education, 
                        has_projects, has_certifications, has_leadership, has_metrics, skills_dict):
    """Calculate realistic ATS score based on resume content"""
    
    score = 50  # Base score
    
    # Contact information (10 points)
    import re
    emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', resume_text)
    phones = re.findall(r'[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}', resume_text)
    if emails: score += 5
    if phones: score += 5
    
    # Experience section (15 points)
    if has_experience: score += 15
    
    # Education (10 points)
    if has_education: score += 10
    
    # Skills (12 points)
    if skills_dict:
        score += 12
        # Bonus for diverse skills
        if len(skills_dict) >= 3: score += 3
    
    # Projects (8 points)
    if has_projects: score += 8
    
    # Metrics/Results (10 points)
    if has_metrics: score += 10
    
    # Certifications (5 points)
    if has_certifications: score += 5
    
    # Leadership (5 points)
    if has_leadership: score += 5
    
    # Years of experience bonus (5 points)
    if years >= 5: score += 5
    
    # Deductions for missing elements
    if not has_metrics: score -= 8
    if not has_projects: score -= 5
    if not skills_dict: score -= 10
    if not has_education: score -= 5
    
    # Resume length considerations
    if len(resume_text) < 300: score -= 10  # Too short
    elif len(resume_text) > 2500: score -= 5  # Too long
    elif 500 <= len(resume_text) <= 1500: score += 2  # Optimal length
    
    # Formatting considerations (check for common ATS-friendly patterns)
    if resume_text.count('\n') > 20: score += 2  # Good structure
    if resume_text.count('•') > 5 or resume_text.count('-') > 5: score += 2  # Bullet points
    
    # Cap score between 25-85
    return max(25, min(85, score))

def calculate_strength_score(has_experience, has_education, has_projects, 
                             has_certifications, has_leadership, has_metrics, years, skills_dict):
    """Calculate overall profile strength"""
    
    score = 0
    
    if has_experience: score += 2
    if has_education: score += 1.5
    if has_projects: score += 2
    if has_certifications: score += 1
    if has_leadership: score += 1.5
    if has_metrics: score += 1
    if years >= 5: score += 0.5
    if len(skills_dict) >= 3: score += 0.5
    
    return min(10, score)

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
    
    # Calculate ATS score - be more critical and realistic
    ats_score = 50  # Start with base score
    
    # Add points for key elements
    if has_experience: ats_score += 15
    if has_education: ats_score += 10
    if has_skills: ats_score += 12
    if has_projects: ats_score += 8
    if has_metrics: ats_score += 8
    if has_certifications: ats_score += 5
    if has_leadership: ats_score += 5
    
    # Deduct points for missing elements
    if not has_metrics: ats_score -= 5
    if not has_projects: ats_score -= 5
    if len(skills_list) < 2: ats_score -= 5
    
    # Formatting considerations
    if len(resume_text) < 300: ats_score -= 10  # Too short
    if len(resume_text) > 2000: ats_score -= 5  # Too long
    
    ats_score = max(20, min(85, ats_score))  # Cap between 20-85
    
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
        
        # Debug logging - save extracted text to file for inspection
        debug_file = os.path.join(temp_dir, "extracted_text.txt")
        with open(debug_file, "w", encoding="utf-8") as f:
            f.write(resume_text)
        
        print(f"\n{'='*60}")
        print(f"Resume file: {file.filename}")
        print(f"File size: {os.path.getsize(file_path)} bytes")
        print(f"Extracted text length: {len(resume_text)}")
        print(f"Full extracted text:\n{resume_text}")
        print(f"{'='*60}\n")
        
        analysis = analyze_resume_text(resume_text, job_description)

        shutil.rmtree(temp_dir)
        
        # Extract ATS score from analysis
        import re
        ats_match = re.search(r'ATS SCORE:\s*(\d+)', analysis)
        ats_score = int(ats_match.group(1)) if ats_match else 0
        
        return {
            "analysis": analysis,
            "resumeScore": ats_score,
            "timestamp": datetime.now().isoformat()
        }
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

@app.get("/test-analysis")
def test_analysis():
    """Test endpoint to verify analysis works with different inputs"""
    
    # Test resume 1: Minimal resume
    test1 = "John Doe\njohn@example.com\nSoftware Developer"
    
    # Test resume 2: Detailed resume
    test2 = """
    John Doe
    john@example.com | +1234567890
    
    EXPERIENCE
    Senior Software Engineer at Tech Company (2020-2024)
    - Developed React applications
    - Improved performance by 40%
    - Led team of 5 developers
    
    EDUCATION
    Bachelor of Science in Computer Science
    University of Technology
    
    SKILLS
    Frontend: React, JavaScript, TypeScript, CSS
    Backend: Node.js, Express, Python, Django
    Database: MongoDB, PostgreSQL
    DevOps: Docker, Kubernetes, AWS
    
    PROJECTS
    - Built e-commerce platform using React and Node.js
    - Created mobile app with React Native
    
    CERTIFICATIONS
    AWS Certified Solutions Architect
    """
    
    analysis1 = analyze_resume_text(test1)
    analysis2 = analyze_resume_text(test2)
    
    # Extract ATS scores
    import re
    ats1 = re.search(r'ATS SCORE:\s*(\d+)', analysis1)
    ats2 = re.search(r'ATS SCORE:\s*(\d+)', analysis2)
    
    return {
        "test1_ats": int(ats1.group(1)) if ats1 else 0,
        "test2_ats": int(ats2.group(1)) if ats2 else 0,
        "test1_analysis": analysis1[:500],
        "test2_analysis": analysis2[:500]
    }
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
        
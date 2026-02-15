import asyncHandler from "express-async-handler"
import axios from "axios"

// @desc get job recommendations with fresh data
// route /api/jobs/recommendations
// @method get
const getJobRecommendations = asyncHandler(async (req, res) => {
  const { location = "India" } = req.query

  try {
    // Always use curated jobs with 80+ listings
    const alwaysOpenJobs = getAlwaysOpenJobs()
    const fallbackJobs = getFallbackJobs(location)
    const combinedJobs = [...alwaysOpenJobs, ...fallbackJobs]
    
    res.status(200).json({
      jobs: combinedJobs,
      source: "curated",
      total: combinedJobs.length,
      message: "Showing curated job listings including always-open positions.",
    })
  } catch (error) {
    console.error("Error fetching jobs:", error.message)
    const alwaysOpenJobs = getAlwaysOpenJobs()
    const fallbackJobs = getFallbackJobs(location)
    const combinedJobs = [...alwaysOpenJobs, ...fallbackJobs]
    
    res.status(200).json({
      jobs: combinedJobs,
      source: "curated",
      total: combinedJobs.length,
    })
  }
})

// Fetch from Adzuna API
const fetchAdzunaJobs = async (location) => {
  try {
    const adzunaId = process.env.ADZUNA_API_ID
    const adzunaKey = process.env.ADZUNA_API_KE

    if (!adzunaId || !adzunaKey || adzunaId === "your_adzuna_api_id_here") {
      return null
    }

    const url = `http://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${adzunaId}&app_key=${adzunaKey}&results_per_page=10&what=developer`

    const response = await axios.get(url, { timeout: 5000 })

    if (response.data?.results) {
      return response.data.results.map((job) => ({
        job_id: job.id,
        job_title: job.title,
        employer_name: job.company?.display_name || "Company",
        job_city: job.location?.display_name || location,
        job_country: "India",
        job_employment_type: job.contract_type || "Full-time",
        job_posted_at_datetime_utc: job.created || new Date().toISOString(),
        job_apply_link: job.redirect_url,
        job_description: job.description || "Exciting opportunity",
        salary_min: job.salary_min,
        salary_max: job.salary_max,
      }))
    }
    return null
  } catch (error) {
    console.error("Adzuna API error:", error.message)
    return null
  }
}

// Fetch from JSearch API (RapidAPI)
const fetchJSearchJobs = async (location) => {
  try {
    const rapidApiKey = process.env.RAPIDAPI_KEY

    if (!rapidApiKey) {
      console.log("No RapidAPI key found")
      return null
    }

    const url = "https://jsearch.p.rapidapi.com/search"
    const params = {
      query: `developer in ${location}`,
      page: 1,
      num_pages: 1,
    }

    console.log("Fetching from JSearch with key:", rapidApiKey.substring(0, 10) + "...")
    
    const response = await axios.get(url, {
      headers: {
        "X-RapidAPI-Key": rapidApiKey,
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
      },
      params,
      timeout: 10000,
    })

    console.log("JSearch response status:", response.status)
    console.log("JSearch response data:", response.data?.data?.length, "jobs found")

    if (response.data?.data && response.data.data.length > 0) {
      return response.data.data.map((job) => ({
        job_id: job.job_id,
        job_title: job.job_title,
        employer_name: job.employer_name,
        job_city: job.job_city,
        job_country: job.job_country,
        job_employment_type: job.job_employment_type,
        job_posted_at_datetime_utc: job.job_posted_at_datetime_utc,
        job_apply_link: job.job_apply_link,
        job_description: job.job_description,
        salary_min: job.job_salary_min,
        salary_max: job.job_salary_max,
      }))
    }
    
    console.log("No data in JSearch response")
    return null
  } catch (error) {
    console.error("JSearch API error:", error.message)
    console.error("JSearch error response:", error.response?.data)
    return null
  }
}

// Company career page mapping
const companyCareerLinks = {
  "Google": "https://careers.google.com/jobs/results/",
  "Microsoft": "https://careers.microsoft.com/us/en/search-results",
  "Amazon": "https://www.amazon.jobs/en/",
  "Meta": "https://www.metacareers.com/",
  "Apple": "https://www.apple.com/careers/",
  "Accenture": "https://www.accenture.com/us-en/careers",
  "TCS": "https://www.tcs.com/careers",
  "Infosys": "https://www.infosys.com/careers",
  "Wipro": "https://careers.wipro.com/",
  "HCL Technologies": "https://www.hcltech.com/careers",
  "Cognizant": "https://careers.cognizant.com/",
  "Tech Mahindra": "https://careers.techmahindra.com/",
  "Capgemini": "https://www.capgemini.com/careers/",
  "Deloitte": "https://www2.deloitte.com/us/en/careers.html",
  "IBM": "https://www.ibm.com/careers/",
  "Oracle": "https://www.oracle.com/careers/",
  "Salesforce": "https://www.salesforce.com/company/careers/",
  "Adobe": "https://www.adobe.com/careers.html",
  "Atlassian": "https://www.atlassian.com/company/careers",
  "Slack": "https://slack.com/careers",
  "Zoom": "https://zoom.us/careers",
  "Stripe": "https://stripe.com/jobs",
  "Square": "https://squareup.com/us/en/careers",
  "PayPal": "https://www.paypal.com/us/webapps/mpp/jobs",
  "Uber": "https://www.uber.com/en-IN/careers/",
  "Airbnb": "https://careers.airbnb.com/",
  "Netflix": "https://jobs.netflix.com/",
  "Spotify": "https://www.spotifyjobs.com/",
  "Twitter": "https://careers.twitter.com/",
  "LinkedIn": "https://careers.linkedin.com/",
  "GitHub": "https://github.com/about/careers",
  "GitLab": "https://about.gitlab.com/jobs/",
  "HashiCorp": "https://www.hashicorp.com/careers",
  "Databricks": "https://databricks.com/company/careers",
  "Figma": "https://www.figma.com/careers/",
  "Notion": "https://www.notion.so/careers",
  "Canva": "https://www.canva.com/careers/",
  "Asana": "https://asana.com/jobs",
  "Monday.com": "https://monday.com/careers/",
  "Jira": "https://www.atlassian.com/company/careers",
  "Confluence": "https://www.atlassian.com/company/careers",
  "Bitbucket": "https://www.atlassian.com/company/careers",
  "Docker": "https://www.docker.com/careers",
  "Kubernetes": "https://www.linuxfoundation.org/careers/",
  "Terraform": "https://www.hashicorp.com/careers",
  "Ansible": "https://www.redhat.com/en/jobs",
  "Jenkins": "https://www.cloudbees.com/careers",
  "CircleCI": "https://circleci.com/careers/",
  "Travis CI": "https://travis-ci.com/careers",
  "GitHub Actions": "https://github.com/about/careers",
  "AWS": "https://www.amazon.jobs/en/",
  "Azure": "https://careers.microsoft.com/us/en/search-results",
  "GCP": "https://careers.google.com/jobs/results/",
  "DigitalOcean": "https://www.digitalocean.com/careers",
  "Heroku": "https://www.salesforce.com/company/careers/",
  "Vercel": "https://vercel.com/careers",
  "Netlify": "https://www.netlify.com/careers/",
  "Firebase": "https://careers.google.com/jobs/results/",
  "MongoDB": "https://www.mongodb.com/careers",
  "PostgreSQL": "https://www.postgresql.org/community/",
  "MySQL": "https://www.oracle.com/careers/",
  "Redis": "https://redis.com/careers/",
  "Elasticsearch": "https://www.elastic.co/careers",
  "Kafka": "https://www.confluent.io/careers/",
  "RabbitMQ": "https://www.vmware.com/careers.html",
  "Apache Spark": "https://www.databricks.com/company/careers",
  "Hadoop": "https://www.cloudera.com/careers.html",
  "Hive": "https://www.cloudera.com/careers.html",
  "Presto": "https://prestodb.io/",
  "Snowflake": "https://www.snowflake.com/careers/",
  "BigQuery": "https://careers.google.com/jobs/results/",
  "Redshift": "https://www.amazon.jobs/en/",
  "Tableau": "https://www.salesforce.com/company/careers/",
  "Power BI": "https://careers.microsoft.com/us/en/search-results",
  "Looker": "https://www.google.com/careers/",
  "Grafana": "https://grafana.com/careers/",
  "Prometheus": "https://www.cncf.io/careers/",
  "ELK Stack": "https://www.elastic.co/careers",
  "Splunk": "https://www.splunk.com/en_us/careers.html",
  "Datadog": "https://www.datadoghq.com/careers/",
  "New Relic": "https://newrelic.com/careers",
  "Sentry": "https://sentry.io/careers/",
  "PagerDuty": "https://www.pagerduty.com/careers/",
  "OpsGenie": "https://www.atlassian.com/company/careers",
  "VictorOps": "https://www.splunk.com/en_us/careers.html",
  "Tech Innovations Inc": "https://www.linkedin.com/jobs/search/?keywords=developer",
  "Digital Solutions Ltd": "https://www.linkedin.com/jobs/search/?keywords=developer",
  "Cloud Systems Corp": "https://www.linkedin.com/jobs/search/?keywords=developer",
  "AI Ventures": "https://www.linkedin.com/jobs/search/?keywords=developer",
  "Data Analytics Pro": "https://www.linkedin.com/jobs/search/?keywords=developer",
  "Mobile First Studios": "https://www.linkedin.com/jobs/search/?keywords=developer",
  "Enterprise Solutions": "https://www.linkedin.com/jobs/search/?keywords=developer",
  "StartUp Hub": "https://www.linkedin.com/jobs/search/?keywords=developer",
  "Tech Giants": "https://www.linkedin.com/jobs/search/?keywords=developer",
  "Innovation Labs": "https://www.linkedin.com/jobs/search/?keywords=developer",
}

// Helper function to get career link for a company
const getCareerLink = (companyName) => {
  return companyCareerLinks[companyName] || `https://www.linkedin.com/jobs/search/?keywords=developer&company=${encodeURIComponent(companyName)}`
}

// Always-open positions (companies that are always hiring)
const getAlwaysOpenJobs = () => {
  return [
    {
      job_id: "always-open-1",
      job_title: "Software Engineer",
      employer_name: "Google",
      job_city: "Bangalore",
      job_country: "India",
      job_employment_type: "Full-time",
      job_posted_at_datetime_utc: new Date().toISOString(),
      job_apply_link: getCareerLink("Google"),
      job_description: "Join Google's engineering team. Always hiring talented engineers.",
      salary_min: 1200000,
      salary_max: 2500000,
      always_open: true,
    },
    {
      job_id: "always-open-2",
      job_title: "Software Developer",
      employer_name: "Microsoft",
      job_city: "Hyderabad",
      job_country: "India",
      job_employment_type: "Full-time",
      job_posted_at_datetime_utc: new Date().toISOString(),
      job_apply_link: getCareerLink("Microsoft"),
      job_description: "Build innovative solutions at Microsoft. Continuous hiring.",
      salary_min: 1100000,
      salary_max: 2400000,
      always_open: true,
    },
    {
      job_id: "always-open-3",
      job_title: "Backend Engineer",
      employer_name: "Amazon",
      job_city: "Bangalore",
      job_country: "India",
      job_employment_type: "Full-time",
      job_posted_at_datetime_utc: new Date().toISOString(),
      job_apply_link: getCareerLink("Amazon"),
      job_description: "Work on scalable systems at Amazon. Always recruiting.",
      salary_min: 1000000,
      salary_max: 2200000,
      always_open: true,
    },
    {
      job_id: "always-open-4",
      job_title: "Frontend Developer",
      employer_name: "Meta",
      job_city: "Bangalore",
      job_country: "India",
      job_employment_type: "Full-time",
      job_posted_at_datetime_utc: new Date().toISOString(),
      job_apply_link: getCareerLink("Meta"),
      job_description: "Create experiences for billions at Meta. Open positions available.",
      salary_min: 1150000,
      salary_max: 2350000,
      always_open: true,
    },
    {
      job_id: "always-open-5",
      job_title: "Full Stack Developer",
      employer_name: "Apple",
      job_city: "Hyderabad",
      job_country: "India",
      job_employment_type: "Full-time",
      job_posted_at_datetime_utc: new Date().toISOString(),
      job_apply_link: getCareerLink("Apple"),
      job_description: "Build products that delight millions. Hiring continuously.",
      salary_min: 1100000,
      salary_max: 2300000,
      always_open: true,
    },
  ]
}

// Fallback jobs with real job board links
const getFallbackJobs = (location) => {
  const jobTitles = [
    "Senior Full Stack Developer",
    "Frontend Developer - React",
    "Backend Developer - Node.js",
    "DevOps Engineer",
    "Data Scientist",
    "QA Automation Engineer",
    "Mobile Developer - React Native",
    "Cloud Architect",
    "Machine Learning Engineer",
    "Security Engineer",
    "Senior Backend Engineer",
    "Junior Frontend Developer",
    "Full Stack Engineer",
    "Database Administrator",
    "Systems Engineer",
    "Solutions Architect",
    "Technical Lead",
    "Engineering Manager",
    "Product Engineer",
    "Platform Engineer",
    "Infrastructure Engineer",
    "Site Reliability Engineer",
    "Data Engineer",
    "Analytics Engineer",
    "AI/ML Engineer",
    "Computer Vision Engineer",
    "NLP Engineer",
    "Blockchain Developer",
    "Web3 Developer",
    "Game Developer",
    "Game Engine Developer",
    "Graphics Engineer",
    "Performance Engineer",
    "Security Researcher",
    "Penetration Tester",
    "Cloud Security Engineer",
    "Network Engineer",
    "Network Security Engineer",
    "Embedded Systems Engineer",
    "IoT Developer",
    "Firmware Engineer",
    "Hardware Engineer",
    "FPGA Developer",
    "Test Automation Engineer",
    "Quality Assurance Lead",
    "Technical Writer",
    "Developer Advocate",
    "Solutions Engineer",
    "Customer Success Engineer",
    "Support Engineer",
    "Release Engineer",
    "Build Engineer",
    "Automation Engineer",
    "Integration Engineer",
    "API Developer",
    "Microservices Developer",
    "Distributed Systems Engineer",
    "Big Data Engineer",
    "Data Pipeline Engineer",
    "ETL Developer",
    "Business Intelligence Developer",
    "BI Analyst",
    "Data Analyst",
    "Research Engineer",
    "Applied Scientist",
    "Robotics Engineer",
    "Autonomous Systems Engineer",
    "Computer Vision Specialist",
    "Machine Learning Ops Engineer",
    "MLOps Engineer",
    "DevOps Lead",
    "Infrastructure Architect",
    "Enterprise Architect",
    "Solutions Architect",
    "Technical Architect",
    "Software Architect",
    "Principal Engineer",
    "Distinguished Engineer",
    "Staff Engineer",
    "Senior Staff Engineer",
    "Engineering Director",
    "VP of Engineering",
    "CTO",
    "Chief Architect",
    "Technical Program Manager",
    "Engineering Manager",
    "Team Lead",
    "Scrum Master",
    "Agile Coach",
    "Product Manager",
    "Technical Product Manager",
    "Program Manager",
    "Project Manager",
    "Delivery Manager",
    "Release Manager",
    "Configuration Manager",
    "Change Manager",
    "IT Manager",
    "Systems Administrator",
    "Database Administrator",
    "Network Administrator",
    "Security Administrator",
    "System Architect",
    "Enterprise Architect",
  ]

  const companies = [
    "Tech Innovations Inc",
    "Digital Solutions Ltd",
    "Cloud Systems Corp",
    "AI Ventures",
    "Data Analytics Pro",
    "Mobile First Studios",
    "Enterprise Solutions",
    "StartUp Hub",
    "Tech Giants",
    "Innovation Labs",
    "Accenture",
    "TCS",
    "Infosys",
    "Wipro",
    "HCL Technologies",
    "Cognizant",
    "Tech Mahindra",
    "Capgemini",
    "Deloitte",
    "IBM",
    "Oracle",
    "Salesforce",
    "Adobe",
    "Atlassian",
    "Slack",
    "Zoom",
    "Stripe",
    "Square",
    "PayPal",
    "Uber",
    "Airbnb",
    "Netflix",
    "Spotify",
    "Twitter",
    "LinkedIn",
    "GitHub",
    "GitLab",
    "HashiCorp",
    "Databricks",
    "Figma",
    "Notion",
    "Canva",
    "Asana",
    "Monday.com",
    "Jira",
    "Confluence",
    "Bitbucket",
    "Docker",
    "Kubernetes",
    "Terraform",
    "Ansible",
    "Jenkins",
    "CircleCI",
    "Travis CI",
    "GitHub Actions",
    "AWS",
    "Azure",
    "GCP",
    "DigitalOcean",
    "Heroku",
    "Vercel",
    "Netlify",
    "Firebase",
    "MongoDB",
    "PostgreSQL",
    "MySQL",
    "Redis",
    "Elasticsearch",
    "Kafka",
    "RabbitMQ",
    "Apache Spark",
    "Hadoop",
    "Hive",
    "Presto",
    "Snowflake",
    "BigQuery",
    "Redshift",
    "Tableau",
    "Power BI",
    "Looker",
    "Grafana",
    "Prometheus",
    "ELK Stack",
    "Splunk",
    "Datadog",
    "New Relic",
    "Sentry",
    "PagerDuty",
    "OpsGenie",
    "VictorOps",
  ]

  const cities = ["Bangalore", "Mumbai", "Delhi", "Hyderabad", "Pune", "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Lucknow"]

  // Generate 50-100 jobs
  const jobs = []
  const jobCount = 75 // Generate 75 jobs

  for (let i = 0; i < jobCount; i++) {
    const title = jobTitles[i % jobTitles.length]
    const company = companies[i % companies.length]
    const city = cities[i % cities.length]

    jobs.push({
      job_id: `fallback-${i}`,
      job_title: title,
      employer_name: company,
      job_city: city,
      job_country: "India",
      job_employment_type: i % 5 === 0 ? "Contract" : i % 5 === 1 ? "Part-time" : "Full-time",
      job_posted_at_datetime_utc: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      job_apply_link: getCareerLink(company),
      job_description: `Exciting opportunity for ${title} position at ${company}. Check their careers page for more details.`,
      salary_min: 400000 + Math.random() * 600000,
      salary_max: 1000000 + Math.random() * 1200000,
    })
  }

  return jobs
}

export { getJobRecommendations }

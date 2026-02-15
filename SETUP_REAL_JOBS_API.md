# Setting Up Real Job Recommendations with Adzuna API

## Overview
The job recommendations feature now supports real-time job data from the Adzuna API. If Adzuna credentials are not provided, it falls back to curated job listings with links to real job boards.

## Option 1: Using Adzuna API (Recommended for Real-Time Jobs)

### Step 1: Get Free Adzuna API Credentials
1. Visit: https://developer.adzuna.com/
2. Click "Sign Up" or "Get Started"
3. Create a free account
4. Go to your dashboard and find your API credentials:
   - **App ID** (app_id)
   - **App Key** (app_key)

### Step 2: Update Environment Variables
Edit `Finally-Placed/backend-Node/.env` and add:

```
ADZUNA_API_ID=your_actual_app_id_here
ADZUNA_API_KE=your_actual_app_key_here
```

### Step 3: Restart Node Backend
```bash
# Stop the current process and restart
node index.js
```

### Step 4: Test the Integration
Make a request to:
```
http://localhost:3000/job-recommendations?keyword=developer&location=India
```

You should now see real jobs from Adzuna API!

## Option 2: Using Fallback (No API Key Required)
If you don't want to set up Adzuna, the system automatically falls back to:
- 10 curated job listings
- Direct links to LinkedIn, Indeed, and other job boards
- Real job search URLs that users can click to find actual openings

## Supported Query Parameters
- `keyword` - Job title or keyword (default: "developer")
- `location` - Location to search (default: "India")

Example:
```
http://localhost:3000/job-recommendations?keyword=python%20developer&location=Bangalore
```

## API Response Format
```json
{
  "jobs": [
    {
      "job_id": "1",
      "job_title": "Senior Full Stack Developer",
      "employer_name": "Tech Company",
      "job_city": "Bangalore",
      "job_country": "India",
      "job_employment_type": "Full-time",
      "job_posted_at_datetime_utc": "2026-02-14T10:00:00Z",
      "job_apply_link": "https://...",
      "job_description": "Job description here",
      "salary_min": 50000,
      "salary_max": 70000
    }
  ],
  "source": "adzuna" or "fallback"
}
```

## Troubleshooting

### Jobs not showing from Adzuna
1. Check if API credentials are correct in `.env`
2. Verify credentials are not the placeholder values
3. Check Node backend logs for errors
4. System will automatically fall back to curated listings

### Getting "Access denied" error
- Your Adzuna API key might be invalid
- Try regenerating it from the Adzuna dashboard
- Ensure you're using the correct app_id and app_key

## Free Tier Limits
- Adzuna free tier typically allows 100-1000 requests per day
- Fallback option has no limits

## Future Enhancements
- Add support for multiple job APIs (Jooble, Indeed, etc.)
- Implement job filtering by skills
- Add salary range filtering
- Cache job results for better performance

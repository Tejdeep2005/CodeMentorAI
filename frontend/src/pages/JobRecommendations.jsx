import React, { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import axios from "axios";

const JobRecommendations = () => {
  const { isDarkMode } = useTheme();
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 12;

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axios.get(`${apiUrl}/api/jobs/recommendations`, {
          withCredentials: true,
        });
        console.log("Jobs fetched:", res.data.jobs.length);
        setJobs(res.data.jobs);
        setFilteredJobs(res.data.jobs);
        setLoading(false);
      } catch (err) {
        setError("Failed to load jobs.");
        setLoading(false);
        console.error(err);
      }
    };

    fetchJobs();
  }, [apiUrl]);

  const handleSearchChange = (e) => {
    const value = e.target.value.toLowerCase();
    setSearch(value);
    setCurrentPage(1);

    const filtered = jobs.filter((job) =>
      job.job_title.toLowerCase().includes(value) ||
      job.employer_name.toLowerCase().includes(value) ||
      job.job_city?.toLowerCase().includes(value) ||
      job.job_country?.toLowerCase().includes(value)
    );

    setFilteredJobs(filtered);
  };

  // Pagination logic
  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo(0, 0);
    }
  };

  if (loading) return <p className={`text-center mt-10 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Fetching jobs...</p>;
  if (error) return <p className="text-center text-red-500 mt-10">{error}</p>;

  return (
    <div className={`min-h-screen p-6 space-y-10 transition-colors duration-300 ${
      isDarkMode ? "bg-gray-900" : "bg-[#f9fafb]"
    }`}>
      {/* Header */}
      <div className="text-center">
        <h1 className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>💼 Job Recommendations for You</h1>
        <p className={`mt-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Total jobs available: {filteredJobs.length}</p>
      </div>

      {/* Search Input */}
      <div className="max-w-xl mx-auto">
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Search jobs by title, company, or location"
          className={`w-full px-5 py-3 border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-colors duration-300 ${
            isDarkMode 
              ? "bg-gray-800 border-gray-700 text-white" 
              : "border-gray-300 bg-white text-gray-900"
          }`}
        />
      </div>

      {/* Job Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {currentJobs.length > 0 ? (
          currentJobs.map((job, index) => (
            <div
              key={index}
              className={`p-6 rounded-xl shadow-lg border transition-all duration-300 hover:shadow-xl ${
                isDarkMode 
                  ? "bg-gray-800 border-gray-700" 
                  : "bg-white border-gray-100"
              }`}
            >
              <h2 className={`text-xl font-semibold mb-1 ${isDarkMode ? "text-purple-400" : "text-purple-700"}`}>{job.job_title}</h2>
              <p className={`mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                <strong>{job.employer_name}</strong> • {job.job_city}, {job.job_country}
              </p>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Type: {job.job_employment_type} | Posted:{" "}
                {new Date(job.job_posted_at_datetime_utc).toLocaleDateString()}
              </p>
              {job.salary_min && job.salary_max && (
                <p className={`text-sm font-semibold mt-2 ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
                  ₹{Math.round(job.salary_min / 100000)}L - ₹{Math.round(job.salary_max / 100000)}L
                </p>
              )}
              <a
                href={job.job_apply_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium transition"
              >
                Apply Now
              </a>
            </div>
          ))
        ) : (
          <p className={`text-center col-span-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>No jobs found for your search 😕</p>
        )}
      </div>

      {/* Pagination */}
      {filteredJobs.length > jobsPerPage && (
        <div className="flex justify-center items-center gap-4 mt-10">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-md font-medium transition ${
              isDarkMode
                ? "bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-700"
                : "bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-400"
            }`}
          >
            Previous
          </button>
          <span className={`font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-md font-medium transition ${
              isDarkMode
                ? "bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-700"
                : "bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-400"
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default JobRecommendations;
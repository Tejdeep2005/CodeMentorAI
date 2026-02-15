import React, { useEffect, useState } from "react";
import axios from "axios";

const JobRecommendations = () => {
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
        const res = await axios.get("http://localhost:3000/api/jobs/recommendations", {
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
  }, []);

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

  if (loading) return <p className="text-center text-gray-500 mt-10">Fetching jobs...</p>;
  if (error) return <p className="text-center text-red-500 mt-10">{error}</p>;

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6 space-y-10">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800">💼 Job Recommendations for You</h1>
        <p className="text-gray-600 mt-2">Total jobs available: {filteredJobs.length}</p>
      </div>

      {/* Search Input */}
      <div className="max-w-xl mx-auto">
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Search jobs by title, company, or location"
          className="w-full px-5 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
      </div>

      {/* Job Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {currentJobs.length > 0 ? (
          currentJobs.map((job, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition"
            >
              <h2 className="text-xl font-semibold text-purple-700 mb-1">{job.job_title}</h2>
              <p className="text-gray-600 mb-1">
                <strong>{job.employer_name}</strong> • {job.job_city}, {job.job_country}
              </p>
              <p className="text-sm text-gray-500">
                Type: {job.job_employment_type} | Posted:{" "}
                {new Date(job.job_posted_at_datetime_utc).toLocaleDateString()}
              </p>
              {job.salary_min && job.salary_max && (
                <p className="text-sm text-green-600 font-semibold mt-2">
                  ₹{Math.round(job.salary_min / 100000)}L - ₹{Math.round(job.salary_max / 100000)}L
                </p>
              )}
              <a
                href={job.job_apply_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium"
              >
                Apply Now
              </a>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 col-span-3">No jobs found for your search 😕</p>
        )}
      </div>

      {/* Pagination */}
      {filteredJobs.length > jobsPerPage && (
        <div className="flex justify-center items-center gap-4 mt-10">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-purple-600 text-white rounded-md disabled:bg-gray-400 hover:bg-purple-700"
          >
            Previous
          </button>
          <span className="text-gray-700 font-semibold">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-purple-600 text-white rounded-md disabled:bg-gray-400 hover:bg-purple-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default JobRecommendations;
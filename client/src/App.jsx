import { useState, useEffect } from "react";
import axios from "axios";

// Lucide React for icons
import {
  Book,
  CalendarDays,
  Clock,
  Lightbulb,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  Search,
  BarChart3,
  Target,
  TrendingUp,
  User,
  Settings,
  Eye,
  Edit3,
  X,
  Plus,
  Save,
  RefreshCw,
} from "lucide-react";

function App() {
  // Legacy states for backward compatibility
  const [subjects, setSubjects] = useState("");
  const [days, setDays] = useState("");
  const [hours, setHours] = useState("");
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);

  // New enhanced states
  const [currentView, setCurrentView] = useState("upload"); // upload, analysis, plan, progress
  const [uploadedFile, setUploadedFile] = useState(null);
  const [syllabusData, setSyllabusData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [studyPlan, setStudyPlan] = useState(null);
  const [userId, setUserId] = useState(null);
  const [progress, setProgress] = useState({});
  const [onlineResults, setOnlineResults] = useState([]);
  const [userPreferences, setUserPreferences] = useState({
    preferredStudyTime: "morning",
    difficultyPreference: "balanced",
    includeBreaks: true,
    revisionFrequency: "weekly",
  });
  const [userExamData, setUserExamData] = useState({
    subject: "",
    examType: "",
    examDate: "",
    hoursPerDay: "",
  });

  // File upload handler
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate form fields
    const subject = document.getElementById("subject").value;
    const examType = document.getElementById("examType").value;
    const examDate = document.getElementById("examDate").value;
    const hoursPerDay = document.getElementById("hoursPerDay").value;

    if (!subject || !examType || !examDate || !hoursPerDay) {
      alert(
        "Please fill in all the required fields before uploading your syllabus."
      );
      return;
    }

    setUploadedFile(file);
    setLoading(true);

    const formData = new FormData();
    formData.append("syllabus", file);
    formData.append("subject", subject);
    formData.append("examType", examType);
    formData.append("examDate", examDate);
    formData.append("hoursPerDay", hoursPerDay);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/syllabus/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setSyllabusData(response.data);
      setAnalysis(response.data.analysis);
      setOnlineResults(response.data.onlineResults);
      setUserId(response.data.userId);

      // Store the exam data for later use
      setUserExamData({
        subject,
        examType,
        examDate,
        hoursPerDay,
      });

      setCurrentView("analysis");

      // Show success message
      alert(
        "Syllabus uploaded successfully! Now you can generate your study plan."
      );
    } catch (error) {
      console.error("Upload error:", error);
      alert(
        "Error uploading syllabus: " +
          (error.response?.data?.error || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // Generate study plan
  const generateStudyPlan = async () => {
    if (!userId) {
      alert("No user data found. Please upload your syllabus first.");
      return;
    }

    if (
      !userExamData.subject ||
      !userExamData.examType ||
      !userExamData.examDate ||
      !userExamData.hoursPerDay
    ) {
      alert(
        "Missing exam data. Please upload your syllabus again with all required fields."
      );
      return;
    }

    setLoading(true);
    try {
      // Use the stored exam data instead of reading from form elements
      const response = await axios.post(
        "http://localhost:5000/api/syllabus/generate-plan",
        {
          userId,
          examDate: userExamData.examDate,
          hoursPerDay: userExamData.hoursPerDay,
          subject: userExamData.subject,
          examType: userExamData.examType,
          preferences: userPreferences,
        }
      );

      if (response.data.success) {
        setStudyPlan(response.data.studyPlan);
        setCurrentView("plan");
        alert(
          "Study plan generated successfully! Check the Plan tab to view your personalized schedule."
        );
      } else {
        alert("Failed to generate study plan. Please try again.");
      }
    } catch (error) {
      console.error("Plan generation error:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Unknown error occurred";
      const errorDetails = error.response?.data?.details
        ? `\n\nDetails: ${error.response.data.details}`
        : "";
      alert(`Error generating study plan: ${errorMessage}${errorDetails}`);
    } finally {
      setLoading(false);
    }
  };

  // Update progress
  const updateProgress = async (day, completed, notes = "") => {
    if (!userId) return;

    try {
      await axios.put("http://localhost:5000/api/syllabus/progress", {
        userId,
        day,
        completed,
        notes,
      });

      setProgress((prev) => ({
        ...prev,
        [day]: { completed, notes, updatedAt: new Date().toISOString() },
      }));
    } catch (error) {
      console.error("Progress update error:", error);
    }
  };

  // Legacy plan generation for backward compatibility - now generates structured plan
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPlan("");

    try {
      // Generate a structured study plan for the legacy mode
      const totalDays = parseInt(days) || 7;
      const hoursPerDay = parseInt(hours) || 2;
      const totalHours = totalDays * hoursPerDay;

      // Create a structured plan object
      const structuredPlan = {
        planTitle: `Quick Study Plan - ${totalDays} Days (${hoursPerDay} hours/day)`,
        totalDays,
        totalHours,
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + totalDays * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        days: Array.from({ length: Math.min(totalDays, 10) }, (_, i) => {
          const currentDate = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
          const subjectList = subjects
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s);
          const currentSubject =
            subjectList[i % subjectList.length] || "General Study";

          return {
            day: i + 1,
            date: currentDate.toISOString().split("T")[0],
            focus:
              i === 0
                ? "Foundation Building"
                : i === totalDays - 1
                ? "Final Revision"
                : i % 3 === 0
                ? "Revision Day"
                : "Core Topics",
            topics:
              i === 0
                ? ["Basic Concepts", "Introduction"]
                : i === totalDays - 1
                ? ["Final Review", "Last Minute Prep"]
                : i % 3 === 0
                ? ["Previous Topics Review"]
                : [currentSubject, "Problem Solving"],
            activities: [
              {
                activity:
                  i === 0
                    ? `Study basic concepts of ${currentSubject}`
                    : i === totalDays - 1
                    ? "Final review of all topics"
                    : i % 3 === 0
                    ? "Review previous topics"
                    : `Study ${currentSubject} concepts`,
                duration: `${Math.floor(hoursPerDay * 0.6)} hours`,
                type: "theory",
              },
              {
                activity:
                  i === 0
                    ? "Practice basic problems"
                    : i === totalDays - 1
                    ? "Quick practice test"
                    : i % 3 === 0
                    ? "Practice previous problems"
                    : `Solve ${currentSubject} problems`,
                duration: `${Math.floor(hoursPerDay * 0.4)} hours`,
                type: "practice",
              },
            ],
            totalTime: `${hoursPerDay} hours`,
            difficulty:
              i === 0
                ? "Easy"
                : i === totalDays - 1
                ? "Easy"
                : i % 3 === 0
                ? "Easy"
                : "Medium",
          };
        }),
        revisionDays: [
          Math.floor(totalDays * 0.3),
          Math.floor(totalDays * 0.6),
          Math.floor(totalDays * 0.8),
        ],
        mockTestDays: [
          Math.floor(totalDays * 0.4),
          Math.floor(totalDays * 0.7),
          totalDays - 1,
        ],
      };

      // Set the structured plan and switch to plan view
      setStudyPlan(structuredPlan);
      setCurrentView("plan");
    } catch (err) {
      console.error("Error generating plan:", err);
      setPlan(
        "❌ Something went wrong. Please try again. Make sure your backend server is running!"
      );
    } finally {
      setLoading(false);
    }
  };

  // Render topic analysis
  const renderTopicAnalysis = () => {
    if (!analysis) return null;

    return (
      <div className="space-y-6">
        <div className="bg-white/10 border border-white/20 rounded-xl p-6">
          <h3 className="text-xl font-bold text-yellow-300 mb-4 flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Topic Analysis
          </h3>
          <div className="grid gap-4">
            {analysis.topics?.map((topic, index) => (
              <div
                key={index}
                className="bg-white/5 p-4 rounded-lg border border-white/10"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-white">{topic.name}</h4>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      topic.importance === "High"
                        ? "bg-red-500/20 text-red-300"
                        : topic.importance === "Medium"
                        ? "bg-yellow-500/20 text-yellow-300"
                        : "bg-green-500/20 text-green-300"
                    }`}
                  >
                    {topic.importance}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-300 mb-2">
                  <span>Weightage: {topic.weightage}%</span>
                  <span>Complexity: {topic.complexity}</span>
                  <span>Suggested: {topic.suggestedHours}h</span>
                </div>
                {topic.subtopics && topic.subtopics.length > 0 && (
                  <div className="text-sm text-gray-400">
                    <strong>Subtopics:</strong> {topic.subtopics.join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {onlineResults.length > 0 && (
          <div className="bg-white/10 border border-white/20 rounded-xl p-6">
            <h3 className="text-xl font-bold text-yellow-300 mb-4 flex items-center gap-2">
              <Search className="w-6 h-6" />
              Online Research Results
            </h3>
            <div className="space-y-2">
              {onlineResults.map((result, index) => (
                <div
                  key={index}
                  className="bg-white/5 p-3 rounded-lg border border-white/10"
                >
                  <a
                    href={result.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-300 hover:text-blue-200 underline"
                  >
                    {result.title}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generate Study Plan Button */}
        <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-xl p-6 text-center">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center justify-center gap-2">
            <Lightbulb className="w-6 h-6" />
            Ready to Create Your Study Plan?
          </h3>
          <p className="text-gray-300 mb-6">
            Based on your syllabus analysis, we can now create a personalized
            study plan with optimal time allocation.
          </p>
          <button
            onClick={generateStudyPlan}
            disabled={loading}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Generating Plan...
              </>
            ) : (
              <>
                <CalendarDays className="w-5 h-5" />
                Generate My Study Plan
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  // Render study plan
  const renderStudyPlan = () => {
    if (!studyPlan) return null;

    return (
      <div className="space-y-6">
        {/* Plan Header */}
        <div className="bg-white/10 border border-white/20 rounded-xl p-6">
          <h3 className="text-2xl font-bold text-yellow-300 mb-4 flex items-center gap-2">
            <CalendarDays className="w-7 h-7" />
            {studyPlan.planTitle}
          </h3>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-4 rounded-lg text-center border border-blue-400/30">
              <div className="text-2xl font-bold text-white">
                {studyPlan.totalDays}
              </div>
              <div className="text-blue-200 text-sm">Total Days</div>
            </div>
            <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 p-4 rounded-lg text-center border border-green-400/30">
              <div className="text-2xl font-bold text-white">
                {studyPlan.totalHours}
              </div>
              <div className="text-green-200 text-sm">Total Hours</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 p-4 rounded-lg text-center border border-purple-400/30">
              <div className="text-2xl font-bold text-white">
                {Math.round(studyPlan.totalHours / studyPlan.totalDays)}
              </div>
              <div className="text-purple-200 text-sm">Hours/Day</div>
            </div>
            <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 p-4 rounded-lg text-center border border-orange-400/30">
              <div className="text-2xl font-bold text-white">
                {studyPlan.days?.length || 0}
              </div>
              <div className="text-orange-200 text-sm">Planned Days</div>
            </div>
          </div>

          {/* Date Range */}
          {studyPlan.startDate && studyPlan.endDate && (
            <div className="bg-white/5 p-4 rounded-lg mb-6 text-center">
              <div className="text-white font-semibold">
                📅 Study Period:{" "}
                {new Date(studyPlan.startDate).toLocaleDateString()} -{" "}
                {new Date(studyPlan.endDate).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>

        {/* Daily Schedule Table */}
        <div className="bg-white/10 border border-white/20 rounded-xl p-6">
          <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-yellow-300" />
            Daily Study Schedule
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full text-white">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-4 font-semibold text-yellow-300">
                    Day
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-yellow-300">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-yellow-300">
                    Focus Area
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-yellow-300">
                    Topics
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-yellow-300">
                    Activities
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-yellow-300">
                    Duration
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-yellow-300">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {studyPlan.days?.map((day, index) => (
                  <tr
                    key={index}
                    className="border-b border-white/10 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-sm font-bold">
                          {day.day}
                        </div>
                        <span className="text-sm text-gray-300">
                          Day {day.day}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm">
                        {day.date
                          ? new Date(day.date).toLocaleDateString()
                          : "TBD"}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-medium text-white">{day.focus}</div>
                      <div
                        className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                          day.difficulty === "Easy"
                            ? "bg-green-500/20 text-green-300"
                            : day.difficulty === "Medium"
                            ? "bg-yellow-500/20 text-yellow-300"
                            : "bg-red-500/20 text-red-300"
                        }`}
                      >
                        {day.difficulty}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        {day.topics?.map((topic, topicIndex) => (
                          <div
                            key={topicIndex}
                            className="text-sm bg-white/5 px-2 py-1 rounded text-gray-300"
                          >
                            {topic}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-2">
                        {day.activities?.map((activity, actIndex) => (
                          <div key={actIndex} className="text-sm">
                            <div className="text-gray-300 mb-1">
                              {activity.activity}
                            </div>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                activity.type === "theory"
                                  ? "bg-blue-500/20 text-blue-300"
                                  : activity.type === "practice"
                                  ? "bg-green-500/20 text-green-300"
                                  : activity.type === "revision"
                                  ? "bg-purple-500/20 text-purple-300"
                                  : "bg-orange-500/20 text-orange-300"
                              }`}
                            >
                              {activity.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="text-sm font-medium text-white">
                        {day.totalTime}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() =>
                          updateProgress(day.day, !progress[day.day]?.completed)
                        }
                        className={`p-2 rounded-full transition-all ${
                          progress[day.day]?.completed
                            ? "bg-green-500/20 text-green-300 hover:bg-green-500/30"
                            : "bg-gray-500/20 text-gray-300 hover:bg-gray-500/30"
                        }`}
                        title={
                          progress[day.day]?.completed
                            ? "Mark as incomplete"
                            : "Mark as complete"
                        }
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Revision & Mock Test Schedule */}
        {(studyPlan.revisionDays?.length > 0 ||
          studyPlan.mockTestDays?.length > 0) && (
          <div className="bg-white/10 border border-white/20 rounded-xl p-6">
            <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-yellow-300" />
              Important Milestones
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {studyPlan.revisionDays?.length > 0 && (
                <div className="bg-white/5 p-4 rounded-lg">
                  <h5 className="font-semibold text-purple-300 mb-3 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Revision Days
                  </h5>
                  <div className="space-y-2">
                    {studyPlan.revisionDays.map((day, index) => (
                      <div key={index} className="text-sm text-gray-300">
                        Day {day} - Comprehensive Review
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {studyPlan.mockTestDays?.length > 0 && (
                <div className="bg-white/5 p-4 rounded-lg">
                  <h5 className="font-semibold text-orange-300 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Mock Test Days
                  </h5>
                  <div className="space-y-2">
                    {studyPlan.mockTestDays.map((day, index) => (
                      <div key={index} className="text-sm text-gray-300">
                        Day {day} - Practice Test
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-800 via-purple-900 to-pink-800 p-4 font-inter relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 -left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 -right-1/4 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 -left-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 drop-shadow-lg flex items-center justify-center gap-3">
            <Lightbulb className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-300" />
            AI Study Planner
            <Book className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-300" />
          </h1>
          <p className="text-xl text-gray-200">
            Upload your syllabus, get intelligent analysis, and create the
            perfect study plan
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-2">
            <button
              onClick={() => setCurrentView("upload")}
              className={`px-4 py-2 rounded-lg transition-all ${
                currentView === "upload"
                  ? "bg-white/20 text-white"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Upload
            </button>
            <button
              onClick={() => setCurrentView("analysis")}
              className={`px-4 py-2 rounded-lg transition-all ${
                currentView === "analysis"
                  ? "bg-white/20 text-white"
                  : "text-gray-300 hover:text-white"
              }`}
              disabled={!analysis}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Analysis
            </button>
            <button
              onClick={() => setCurrentView("plan")}
              className={`px-4 py-2 rounded-lg transition-all ${
                currentView === "plan"
                  ? "bg-white/20 text-white"
                  : "text-gray-300 hover:text-white"
              }`}
              disabled={!studyPlan}
            >
              <CalendarDays className="w-4 h-4 inline mr-2" />
              Plan
            </button>
            <button
              onClick={() => setCurrentView("legacy")}
              className={`px-4 py-2 rounded-lg transition-all ${
                currentView === "legacy"
                  ? "bg-white/20 text-white"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Quick Plan
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl rounded-3xl p-6 sm:p-10">
          {/* Upload View */}
          {currentView === "upload" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Upload className="w-6 h-6" />
                Upload Your Syllabus
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-white mb-2">Subject</label>
                    <input
                      id="subject"
                      type="text"
                      placeholder="e.g., Mathematics, Physics, Chemistry"
                      className="w-full p-3 border border-indigo-500 rounded-xl bg-white/20 text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>

                  <div>
                    <label className="block text-white mb-2">Exam Type</label>
                    <select
                      id="examType"
                      className="w-full p-3 border border-indigo-500 rounded-xl bg-white/20 text-black focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    >
                      <option value="">Select exam type</option>
                      <option value="Academic">Academic (General)</option>
                      <option value="Board">Board Exam (10th/12th)</option>
                      <option value="JEE">JEE (Engineering)</option>
                      <option value="NEET">NEET (Medical)</option>
                      <option value="UPSC">UPSC (Civil Services)</option>
                      <option value="GATE">GATE (Graduate Aptitude)</option>
                      <option value="GRE">GRE (Graduate Record)</option>
                      <option value="GMAT">GMAT (Graduate Management)</option>
                      <option value="SAT">SAT (Scholastic Assessment)</option>
                      <option value="CAT">CAT (Common Admission)</option>
                      <option value="SSC">SSC (Staff Selection)</option>
                      <option value="Banking">Banking Exams</option>
                      <option value="Defense">Defense Exams</option>
                      <option value="State PSC">State PSC</option>
                      <option value="Other">Other Competitive Exam</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white mb-2">Exam Date</label>
                    <input
                      id="examDate"
                      type="date"
                      className="w-full p-3 border border-indigo-500 rounded-xl bg-white/20 text-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>

                  <div>
                    <label className="block text-white mb-2">
                      Study Hours Per Day
                    </label>
                    <input
                      id="hoursPerDay"
                      type="number"
                      min="1"
                      max="12"
                      placeholder="e.g., 6"
                      className="w-full p-3 border border-indigo-500 rounded-xl bg-white/20 text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-white mb-2">
                      Upload Syllabus
                    </label>
                    <div className="border-2 border-dashed border-indigo-500 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors">
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        accept=".txt,.pdf,.doc,.docx,.jpg,.jpeg,.png"
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="w-12 h-12 text-indigo-300 mx-auto mb-4" />
                        <p className="text-white mb-2">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-gray-300 text-sm">
                          Text, PDF, Word, or Image files
                        </p>
                        <p className="text-gray-400 text-xs mt-2">
                          Max size: 10MB
                        </p>
                      </label>
                    </div>
                  </div>

                  {uploadedFile && (
                    <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-green-300" />
                        <span className="text-white">{uploadedFile.name}</span>
                        <span className="text-gray-400 text-sm">
                          ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {loading && (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 text-white">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Processing syllabus...
                  </div>
                </div>
              )}

              {!analysis && !loading && (
                <div className="text-center">
                  <p className="text-gray-300 mb-4">
                    Fill in the details above and upload your syllabus to get
                    started
                  </p>
                  <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                    <h3 className="text-white font-semibold mb-2">
                      What happens next?
                    </h3>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>
                        • Upload your syllabus (text, PDF, Word, or image)
                      </li>
                      <li>• AI will extract topics and analyze importance</li>
                      <li>
                        • Get a personalized study plan with time allocation
                      </li>
                      <li>• Track your progress and stay motivated</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Analysis View */}
          {currentView === "analysis" && renderTopicAnalysis()}

          {/* Plan View */}
          {currentView === "plan" && renderStudyPlan()}

          {/* Legacy View */}
          {currentView === "legacy" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Settings className="w-6 h-6" />
                Quick Study Plan Generator
              </h2>
              <p className="text-gray-300 mb-6">
                Create a simple study plan without uploading files. Just enter
                your subjects and time constraints.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                  <Book
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Subjects (e.g., English, Algebra, Chemistry)"
                    value={subjects}
                    onChange={(e) => setSubjects(e.target.value)}
                    required
                    className="w-full pl-12 pr-5 py-3 border border-indigo-500 rounded-xl bg-white/20 text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 shadow-md transition-all duration-300 ease-in-out focus:bg-white/30"
                  />
                </div>

                <div className="relative">
                  <CalendarDays
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300"
                    size={20}
                  />
                  <input
                    type="number"
                    placeholder="How many days will you invest?"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    required
                    className="w-full pl-12 pr-5 py-3 border border-indigo-500 rounded-xl bg-white/20 text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 shadow-md transition-all duration-300 ease-in-out focus:bg-white/30"
                  />
                </div>

                <div className="relative">
                  <Clock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300"
                    size={20}
                  />
                  <input
                    type="number"
                    placeholder="Study hours per day"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    required
                    className="w-full pl-12 pr-5 py-3 border border-indigo-500 rounded-xl bg-white/20 text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 shadow-md transition-all duration-300 ease-in-out focus:bg-white/30"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="w-5 h-5" />
                      Create Study Plan
                    </>
                  )}
                </button>
              </form>

              {/* Legacy plan display removed - now uses structured format */}
            </div>
          )}
        </div>
      </div>

      {/* Global styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800;900&display=swap');

        body {
          font-family: 'Inter', sans-serif;
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}

export default App;

import api from './api';

// ----------------------------
// 📚 COURSE MANAGEMENT
// ----------------------------

// ✅ Get all courses (admin or student view)
export const getCourses = async (onlyAvailable = false) => {
  const res = await api.get(`/courses${onlyAvailable ? '?onlyAvailable=true' : ''}`);
  return res.data.courses;
};

// ✅ Get single course with instructor & levels
export const getCourse = async (id) => {
  const res = await api.get(`/courses/${id}`);
  return res.data; // { course, progress? }
};

// ✅ Create a new course (admin)
export const createCourse = async (courseData) => {
  const res = await api.post('/courses', courseData);
  return res.data;
};

// ✅ Update existing course (admin)
export const updateCourse = async (courseId, courseData) => {
  const res = await api.put(`/courses/${courseId}`, courseData);
  return res.data;
};

// ✅ Enroll in a course (student or admin-enroll)
export const enroll = async (courseId, studentId) => {
  const res = await api.post(`/courses/${courseId}/enroll`, studentId ? { studentId } : {});
  return res.data;
};

// ✅ Get student’s enrolled courses (via user profile)
export const getEnrolledCourses = async () => {
  const res = await api.get('/users/me');
  return res.data.user.enrolledCourses || [];
};

// ----------------------------
// 🎬 PROGRESS TRACKING
// ----------------------------

// ✅ Mark video progress (directly when watched >= 90%)
export const markVideoProgress = async (
  courseId,
  moduleId,
  watchTime,
  percentWatched,
  resumeAt
) => {
  const res = await api.post(`/progress/${courseId}/video`, {
    moduleId,
    watchTime,
    percentWatched,
    resumeAt,
  });
  return res.data;
};

// ✅ Generic module completion (video / coding / quiz)
export const markModuleComplete = async (
  courseId,
  moduleId,
  watchTime = 0,
  type = 'video'
) => {
  const res = await api.post(`/progress/${courseId}/complete`, {
    moduleId,
    watchTime,
    type,
  });
  return res.data;
};

// ✅ Submit coding assignment
export const submitCodingAssignment = async (
  courseId,
  moduleId,
  code
) => {
  const res = await api.post(`/progress/${courseId}/coding`, {
    moduleId,
    codeSubmission: code,
  });
  return res.data;
};

// ✅ Submit quiz progress
export const submitQuiz = async (
  courseId,
  moduleId,
  answers,
  score
) => {
  const res = await api.post(`/progress/${courseId}/quiz`, {
    moduleId,
    answers,
    score,
  });
  return res.data;
};

// ----------------------------
// 📈 PROGRESS ANALYTICS
// ----------------------------

// ✅ Get current user’s course progress
export const getCourseProgress = async (courseId, studentId) => {
  const url = studentId
    ? `/progress/${courseId}/student/${studentId}`
    : `/progress/${courseId}`;
  const res = await api.get(url);
  return res.data.progress;
};

// ✅ Get all student progress for a course (admin)
export const getAllCourseProgress = async (courseId) => {
  const res = await api.get(`/progress/${courseId}/all`);
  return res.data.progress;
};

// ✅ Get progress for specific module
export const getModuleProgress = async (courseId, moduleId) => {
  const res = await api.get(`/progress/${courseId}/module/${moduleId}`);
  return res.data.progress;
};

// ✅ Record watch session (called periodically during video)
export const recordWatchSession = async (data) => {
  const res = await api.post(`/progress/${data.courseId}/video-session`, data);
  return res.data;
};

// ✅ Get specific video progress (for resuming playback)
export const getVideoProgress = async (courseId, moduleId) => {
  const res = await api.get(`/progress/${courseId}/video/${moduleId}`);
  return res.data.progress;
};

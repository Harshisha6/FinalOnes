import { createContext, useState, useEffect } from "react";
import {
  fetchStudentViewAllCourseListService,
  fetchStudentViewCourseDetailsService,
  getStudentCartCourses,
} from "@/services";

export const StudentContext = createContext(null);

export default function StudentProvider({ children }) {
  const [studentViewCoursesList, setStudentViewCoursesList] = useState([]);
  const [loadingState, setLoadingState] = useState(true);
  const [studentViewCourseDetails, setStudentViewCourseDetails] = useState(null);
  const [currentCourseDetailsId, setCurrentCourseDetailsId] = useState(null);
  const [studentBoughtCoursesList, setStudentBoughtCoursesList] = useState([]);
  const [studentCurrentCourseProgress, setStudentCurrentCourseProgress] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingState(true);
      const response = await fetchStudentViewAllCourseListService();
      if (response.success) {
        setStudentViewCoursesList(response.data);
      } else {
        console.error("Error fetching courses:", response.message);
      }
      setLoadingState(false);
    };

    fetchCourses();
  }, []);

  const fetchCourseDetails = async (courseId) => {
    setLoadingState(true);
    const response = await fetchStudentViewCourseDetailsService(courseId);
    if (response.success) {
      setStudentViewCourseDetails(response.data);
      setCurrentCourseDetailsId(courseId);
    } else {
      console.error("Error fetching course details:", response.message);
    }
    setLoadingState(false);
  };

  const loadStudentCartCourses = async (userId) => {
    const response = await getStudentCartCourses(userId);
    if (response.success) {
      setStudentBoughtCoursesList(response.data);
    } else {
      console.error("Error fetching student cart courses:", response.message);
    }
  };

  return (
    <StudentContext.Provider
      value={{
        studentViewCoursesList,
        setStudentViewCoursesList,
        loadingState,
        setLoadingState,
        studentViewCourseDetails,
        fetchCourseDetails,
        currentCourseDetailsId,
        studentBoughtCoursesList,
        loadStudentCartCourses,
        studentCurrentCourseProgress,
        setStudentCurrentCourseProgress,
        setStudentViewCourseDetails,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
}

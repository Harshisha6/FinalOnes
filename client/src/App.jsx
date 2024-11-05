import { Route, Routes } from "react-router-dom";
import AuthPage from "./pages/auth";
import RouteGuard from "./components/route-guard";
import { useContext } from "react";
import { AuthContext } from "./context/auth-context";
import InstructorDashboardpage from "./pages/instructor";
import StudentViewCommonLayout from "./components/student-view/common-layout";
import StudentHomePage from "./pages/student/home";
import NotFoundPage from "./pages/not-found";
import AddNewCoursePage from "./pages/instructor/add-new-course";
import StudentViewCoursesPage from "./pages/student/courses";
import StudentViewCourseDetailsPage from "./pages/student/course-details";
import PaypalPaymentReturnPage from "./pages/student/payment-return";
import StudentCoursesPage from "./pages/student/student-courses";
import StudentViewCourseProgressPage from "./pages/student/course-progress";
import DarkModeToggle from "./DarkMode"; // Import DarkModeToggle
import CourseAssignment from "./components/instructor-view/courses/add-new-course/course-assignment";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css'; 

function App() {
  const { authState } = useContext(AuthContext);

  return (
    <div className="App bg-background text-foreground min-h-screen transition-colors duration-300">
      <header className="p-4">
        <DarkModeToggle />
      </header>
      <main>
      <ToastContainer 
       position="top-center"
       autoClose={5000}
       hideProgressBar={false}
       newestOnTop={false}
       closeOnClick
       pauseOnHover 
       draggable
       pauseOnFocusLoss
       theme="light"
      /> 
      <Routes>
        <Route
          path="/auth"
          element={
            <RouteGuard
              element={<AuthPage />}
              authenticated={authState?.authenticate}
              user={authState?.user}
            />
          }
        />
        <Route
          path="/instructor"
          element={
            <RouteGuard
              element={<InstructorDashboardpage />}
              authenticated={authState?.authenticate}
              user={authState?.user}
            />
          }
        />
        <Route
          path="/instructor/create-new-course"
          element={
            <RouteGuard
              element={<AddNewCoursePage />}
              authenticated={authState?.authenticate}
              user={authState?.user}
            />
          }
        />
        <Route
          path="/instructor/edit-course/:courseId"
          element={
            <RouteGuard
              element={<AddNewCoursePage />}
              authenticated={authState?.authenticate}
              user={authState?.user}
            />
          }
        />
        <Route
          path="/instructor/course-assignment/:courseId"
          element={
            <RouteGuard
              element={<CourseAssignment />}
              authenticated={authState?.authenticate}
              user={authState?.user}
            />
          }
        />
        <Route
          path="/"
          element={
            <RouteGuard
              element={<StudentViewCommonLayout />}
              authenticated={authState?.authenticate}
              user={authState?.user}
            />
          }
        >
          <Route path="" element={<StudentHomePage />} />
          <Route path="home" element={<StudentHomePage />} />
          <Route path="courses" element={<StudentViewCoursesPage />} />
          <Route path="course/details/:id" element={<StudentViewCourseDetailsPage />} />
          <Route path="payment-return" element={<PaypalPaymentReturnPage />} />
          <Route path="student-courses" element={<StudentCoursesPage />} />
          <Route path="course-progress/:id" element={<StudentViewCourseProgressPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </main>
    </div>
  );
}

export default App;

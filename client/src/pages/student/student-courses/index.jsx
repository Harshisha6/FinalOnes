import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { getStudentCartCourses } from "@/services";  // Import your function here
import { Watch } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import FloatingAudioPlayer from "@/FloatingAudioPlayer";

function StudentCoursesPage() {
  const [studentBoughtCoursesList, setStudentBoughtCoursesList] = useState([]);  // Local state to store courses
  const navigate = useNavigate();

  async function fetchStudentBoughtCourses() {
    const response = await getStudentCartCourses(auth.currentUser.uid);  // Call the new function
    if (response?.success) {
      const courseIds = response.data.map((item) => item.courseId);

      // Fetch course details for each courseId
      const courseDetails = await Promise.all(
        courseIds.map(async (courseId) => {
          const courseDocRef = doc(db, "courses", courseId);
          const courseDoc = await getDoc(courseDocRef);
          return courseDoc.exists() ? { id: courseDoc.id, ...courseDoc.data() } : null;
        })
      );

      // Filter out any null entries in case some course documents do not exist
      const validCourses = courseDetails.filter((course) => course !== null);

      setStudentBoughtCoursesList(validCourses);  // Update the local state with full course data
    }
  }

  useEffect(() => {
    if (auth.currentUser?.uid) {
      fetchStudentBoughtCourses();
    }
  }, [auth.currentUser?.uid]);

  return (
    <div className="p-4">
      <FloatingAudioPlayer audioSrc="/mycourses.mp3" />
      <h1 className="text-3xl font-bold mb-8">My Courses</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {studentBoughtCoursesList && studentBoughtCoursesList.length > 0 ? (
          studentBoughtCoursesList.map((course) => (
            <Card key={course.id} className="flex flex-col">
              <CardContent className="p-4 flex-grow">
                <img
                  src={course?.image}
                  alt={course?.title}
                  className="h-52 w-full object-cover rounded-md mb-4"
                />
                <h3 className="font-bold mb-1">{course?.title}</h3>
                <p className="text-sm text-gray-700 mb-2">
                  {course?.instructorName}
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() =>
                    // navigate(`/course-progress/${course?.id}`
                    navigate(`/course/details/${course?.id}`

                    )
                  }
                  className="flex-1"
                >
                  <Watch className="mr-2 h-4 w-4" />
                  Start Watching
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <h1 className="text-3xl font-bold">No Courses found</h1>
        )}
      </div>
    </div>
  );
}

export default StudentCoursesPage;

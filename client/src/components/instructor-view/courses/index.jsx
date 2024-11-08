import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  courseCurriculumInitialFormData,
  courseLandingInitialFormData,
} from "@/config";
import { InstructorContext } from "@/context/instructor-context";
import { color } from "framer-motion";
import { Delete, Edit, FileStack } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteCourseService, fetchInstructorCourseListService } from "@/services";

function InstructorCourses() {
  const navigate = useNavigate();
  const {
    setCurrentEditedCourseId,
    setCourseLandingFormData,
    setCourseCurriculumFormData,
  } = useContext(InstructorContext);
  const [listOfCourses, setListOfCourses] = useState();

  async function fetchAllCourses() {
    const response = await fetchInstructorCourseListService();
    if (response?.success) setListOfCourses(response?.data);
  }

  const handleDeleteCourse = async (courseId) => {
    const result = await deleteCourseService(courseId);
    if (result.success) {
      fetchAllCourses();
      console.log(result.message);
    } else {
      console.error(result.message);
    }
  };

  useEffect(() => {
    fetchAllCourses();
  }, []);

  return (
    <Card>
      <CardHeader className="flex justify-between flex-row items-center">
        <CardTitle className="text-3xl font-extrabold">All Courses</CardTitle>
        <Button
          onClick={() => {
            setCurrentEditedCourseId(null);
            setCourseLandingFormData(courseLandingInitialFormData);
            setCourseCurriculumFormData(courseCurriculumInitialFormData);
            navigate("/instructor/create-new-course");
          }}
          className="p-6"
          style={{backgroundColor:"#5800A3"}}
        >
          Create New Course
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listOfCourses && listOfCourses.length > 0
                ? listOfCourses.map((course) => (
                    <TableRow>
                      <TableCell className="font-medium">
                        {course?.title}
                      </TableCell>
                      <TableCell className="text-right">
                      <Button
                          onClick={() => {
                            navigate(`/instructor/course-assignment/${course?.id}`);
                          }}
                          variant="ghost"
                          size="sm"
                        >
                          <FileStack className="h-6 w-6" />
                        </Button>
                        <Button
                          onClick={() => {
                            navigate(`/instructor/edit-course/${course?.id}`);
                          }}
                          variant="ghost"
                          size="sm"
                        >
                          <Edit className="h-6 w-6" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCourse(course?.id)} // Call delete function
                        >
                          <Delete className="h-6 w-6" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                : null}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default InstructorCourses;

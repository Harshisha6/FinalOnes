import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { filterOptions, sortOptions } from "@/config";
import { AuthContext } from "@/context/auth-context";
import { StudentContext } from "@/context/student-context";
import FloatingAudioPlayer from "@/FloatingAudioPlayer";
import {
  checkCoursePurchaseInfoService,
  fetchStudentViewCourseListService,
} from "@/services";
import { ArrowUpDownIcon } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

function createSearchParamsHelper(filterParams) {
  const queryParams = [];

  for (const [key, value] of Object.entries(filterParams)) {
    if (Array.isArray(value) && value.length > 0) {
      const paramValue = value.join(",");

      queryParams.push(`${key}=${encodeURIComponent(paramValue)}`);
    }
  }

  return queryParams.join("&");
}

function StudentViewCoursesPage() {
  const [sort, setSort] = useState("price-lowtohigh");
  const [filters, setFilters] = useState({});
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    studentViewCoursesList,
    setStudentViewCoursesList,
    loadingState,
    setLoadingState,
  } = useContext(StudentContext);
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);

  function handleFilterOnChange(getSectionId, getCurrentOption) {
    setFilters((prevFilters) => {
      const updatedFilters = { ...prevFilters };
      const currentOptions = updatedFilters[getSectionId] || [];
  
      if (currentOptions.includes(getCurrentOption.id)) {
        updatedFilters[getSectionId] = currentOptions.filter(
          (id) => id !== getCurrentOption.id
        );
      } else {
        updatedFilters[getSectionId] = [...currentOptions, getCurrentOption.id];
      }
  
      // Check if filters actually changed before setting in session storage
      if (JSON.stringify(updatedFilters) !== JSON.stringify(prevFilters)) {
        sessionStorage.setItem("filters", JSON.stringify(updatedFilters));
      }
  
      return updatedFilters;
    });
  }
  
  async function fetchAllStudentViewCourses(filters, sort) {
    const query = new URLSearchParams({
      ...filters,
      sortBy: sort,
    });
    const response = await fetchStudentViewCourseListService(query);
    if (response?.success) {
      setStudentViewCoursesList(response?.data);
      setLoadingState(false);
    }
  }

  async function handleCourseNavigate(getCurrentCourseId) {
      navigate(`/course/details/${getCurrentCourseId}`);
  }

  useEffect(() => {
    const storedFilters = JSON.parse(sessionStorage.getItem("filters")) || {};
    const initialFilters = {};
    const category = searchParams.get("category");
    const level = searchParams.get("level");

    if (category) initialFilters.category = category.split(",");
    if (level) initialFilters.level = level.split(",");

    setFilters({ ...storedFilters, ...initialFilters });
    setSort("price-lowtohigh");
  }, []);

  useEffect(() => {
    if (filters && Object.keys(filters).length > 0) {
      const queryString = createSearchParamsHelper(filters);
      setSearchParams(new URLSearchParams(queryString));
    }
  }, [filters]);

  useEffect(() => {
    if (filters && sort) fetchAllStudentViewCourses(filters, sort);
  }, [filters, sort]);

  return (
    <div className="container mx-auto p-4">
      <FloatingAudioPlayer audioSrc="/filtercourses.mp3" />
      <h1 className="text-3xl font-bold mb-4">All Courses</h1>
      <div className="flex flex-col md:flex-row gap-4">
        <aside className="w-full md:w-64 space-y-4">
          <div>
            {Object.keys(filterOptions).map((ketItem) => (
              <div className="p-4 border-b" key={ketItem}>
                <h3 className="font-bold mb-3">{ketItem.toUpperCase()}</h3>
                <div className="grid gap-2 mt-2">
                  {filterOptions[ketItem].map((option) => (
                    <Label key={option.id} className="flex font-medium items-center gap-3">
                      <Checkbox
                        checked={
                          filters[ketItem] && filters[ketItem].includes(option.id)
                        }
                        onCheckedChange={() => handleFilterOnChange(ketItem, option)}
                      />
                      {option.label}
                    </Label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>
        <main className="flex-1">
          <div className="flex justify-end items-center mb-4 gap-5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2 p-5">
                  <ArrowUpDownIcon className="h-4 w-4" />
                  <span className="text-[16px] font-medium">Sort By</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[180px]">
                <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
                  {sortOptions.map((sortItem) => (
                    <DropdownMenuRadioItem value={sortItem.id} key={sortItem.id}>
                      {sortItem.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="text-sm text-black font-bold">
              {studentViewCoursesList.length} Results
            </span>
          </div>
          <div className="space-y-4">
            {loadingState ? (
              <Skeleton />
            ) : studentViewCoursesList.length > 0 ? (
              studentViewCoursesList.map((courseItem) => (
                <Card
                  key={courseItem._id}
                  onClick={() => handleCourseNavigate(courseItem.id)}
                  className="cursor-pointer"
                >
                  <CardContent className="flex gap-4 p-4">
                    <div className="w-48 h-32 flex-shrink-0">
                      <img src={courseItem.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{courseItem.title}</CardTitle>
                      <p className="text-sm text-gray-600 mb-1">
                        Created By <span className="font-bold">{courseItem.instructorName}</span>
                      </p>
                      <p className="text-[16px] text-gray-600 mt-3 mb-2">
                        {`${courseItem.curriculum.length} ${
                          courseItem.curriculum.length <= 1 ? "Lecture" : "Lectures"
                        } - ${courseItem.level.toUpperCase()} Level`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <h1 className="font-extrabold text-4xl">No Courses Found</h1>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}




export default StudentViewCoursesPage;

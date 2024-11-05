import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import VideoPlayer from "@/components/video-player";
import { StudentContext } from "@/context/student-context";
import {
  fetchStudentViewCourseDetailsService,
  addToStudentCart,
  getAssignmentsByUserAndCourse,
  getSubmissionsByUserAndCourse,
  saveSubmissionToFirestore,
  documentUploadService,
} from "@/services";
import MediaProgressbar from "@/components/media-progress-bar";
import { CheckCircle, Globe, PlayCircle } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { auth } from "@/firebase";
import FloatingAudioPlayer from "@/FloatingAudioPlayer";

function StudentViewCourseDetailsPage() {
  const {
    studentViewCourseDetails,
    setStudentViewCourseDetails,
    loadingState,
    setLoadingState,
    fetchCourseDetails,
  } = useContext(StudentContext);

  const params = useParams();
  const location = useLocation();
  const [displayCurrentVideoFreePreview, setDisplayCurrentVideoFreePreview] = useState(null);
  const [showFreePreviewDialog, setShowFreePreviewDialog] = useState(false);
  const [approvalUrl, setApprovalUrl] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [assignmentVisible, setAssignmentVisible] = useState(false);
  const [replaceNotes, setReplaceNotes] = useState([]);
  const [files, setFiles] = useState(Array(assignments.length).fill(null));
  const [percentCompleted, setPercentCompleted] = useState([]);
  const [progressData, setProgressData] = useState({
    progressValue: 0,
  });

  const fetchStudentViewCourseDetails = async () => {
    setLoadingState(true);
    const response = await fetchStudentViewCourseDetailsService(params.id);
    console.log("response", response.data.curriculum[0].videoUrl);
    setLoadingState(false);
    if (response?.success) {
      setStudentViewCourseDetails(response.data);
    } else {
      setStudentViewCourseDetails(null);
    }
  };

  const handleSetFreePreview = (getCurrentVideoInfo) => {
    setDisplayCurrentVideoFreePreview(getCurrentVideoInfo.videoUrl);
    setShowFreePreviewDialog(true);
  };

  const handleAddToCart = async () => {
    const currentUser = auth.currentUser;
    if (currentUser && params.id) {
      const userId = currentUser.uid;
      const response = await addToStudentCart(userId, params.id);
      if (!response.success) {
        console.error("Failed to add course to cart:", response.message);
      }
    } else {
      console.warn("No user signed in or no course details available");
    }
  };

  function handleProgressUpdate(data) {
    setProgressData(data);
  }

  const fetchSubmissions = async () => {
    const currentUser = auth.currentUser;
    if (currentUser && params.id) {
      const userId = currentUser.uid;
      const fetchedSubmissions = await getSubmissionsByUserAndCourse(userId, params.id);
      setSubmissions(fetchedSubmissions);
      console.log(fetchedSubmissions);
    }
  };

  const fetchAssignments = async () => {
    setAssignmentVisible(true);
    const currentUser = auth.currentUser; 
    if (currentUser && params.id) {
      const userId = currentUser.uid;
      const fetchedAssignments = await getAssignmentsByUserAndCourse(userId, params.id);
      setAssignments(fetchedAssignments); 
      console.log(fetchedAssignments); 
      await fetchSubmissions(); 
      setReplaceNotes(Array(fetchedAssignments.length).fill(false)); 
    }
  };

  const uploadDocument = async (file, index) => {
    const formData = new FormData();
    formData.append("file", file);
  
    // Define a progress callback that updates the progress for the specific file by index
    const onProgress = (percentCompleted) => {
      setPercentCompleted((prevProgress) => {
        const updatedProgress = [...prevProgress];
        updatedProgress[index] = percentCompleted;
        return updatedProgress;
      });
    };
  
    try {
      const uploadResponse = await documentUploadService(formData, onProgress);
      if (!uploadResponse.success) {
        throw new Error(uploadResponse.message);
      }
      return uploadResponse.data.url;
    } catch (error) {
      console.error("File upload failed:", error.message);
      return null;
    }
    finally{
      setPercentCompleted((prevProgress) => {
        const updatedProgress = [...prevProgress];
        updatedProgress[index] = 0;
        return updatedProgress;
      });
    }
  };
  
  
  
  const handleSaveSubmissions = async (submissionData) => {
    try {
      const response = await saveSubmissionToFirestore(submissionData);
      if (!response.success) {
        throw new Error(response.message);
      }
      console.log("Submission saved successfully.");
    } catch (error) {
      console.error("Failed to save submission:", error.message);
    }
  };
  

  

  useEffect(() => {
    if (displayCurrentVideoFreePreview) setShowFreePreviewDialog(true);
  }, [displayCurrentVideoFreePreview]);

  useEffect(() => {
    if (params.id) fetchStudentViewCourseDetails();
  }, [params.id]);

  useEffect(() => {
    if (params.id) fetchCourseDetails(params.id);
  }, [params.id]);

  useEffect(() => {
    if (!location.pathname.includes("course/details")) {
      setStudentViewCourseDetails(null);
    }
  }, [location.pathname]);

  if (loadingState) return <Skeleton />;

  if (approvalUrl) {
    window.location.href = approvalUrl;
  }

  const previewUrlNotes = studentViewCourseDetails?.notes.replace('/upload/', '/upload/fl_attachment/');
  const googleViewerUrlNotes = `https://docs.google.com/viewer?url=${encodeURIComponent(previewUrlNotes)}&embedded=true`;

  const previewUrl = (url) => url.replace("/upload/", "/upload/fl_attachment/");

  const getIndexOfFreePreviewUrl = studentViewCourseDetails?.curriculum?.findIndex(
    (item) => item.freePreview
  );

  const handleReplaceNotes = (index) => {
    setReplaceNotes((prev) => {
      const newReplaceNotes = [...prev];
      newReplaceNotes[index] = !newReplaceNotes[index]; 
      return newReplaceNotes;
    });
  };

  return (
    <div className="mx-auto p-4">
      {assignmentVisible ? <FloatingAudioPlayer audioSrc="/assignments.mp3" /> :
      <FloatingAudioPlayer audioSrc="/detailedview.mp3" /> }
      
      <div className="bg-gray-900 text-white p-8 rounded-t-lg">
        <h1 className="text-3xl font-bold mb-4">
          {studentViewCourseDetails?.title}
        </h1>
        <p className="text-xl mb-4">{studentViewCourseDetails?.subtitle}</p>
        <div className="flex items-center space-x-4 mt-2 text-sm">
          <span className="flex items-center">
            <Globe className="mr-1 h-4 w-4" />
            {studentViewCourseDetails?.primaryLanguage}
          </span>
          <Button style={{backgroundColor:"#E86391"}} onClick={fetchAssignments}>
            Assignments
          </Button>
        </div>
      </div>

      {assignmentVisible ? (
        assignments.length > 0 ? (
          assignments.map((assignment, index) => {
            const submission = submissions.find(sub => sub.assignmentId === assignment.id);
            return (
              <>
              <div className="flex justify-between mt-5 mb-5">
                <h1 className="text-3xl font-semibold">{studentViewCourseDetails?.title} Assignments </h1>
              <Button className="justify-end mt-2" style={{ backgroundColor: "#5800A3" }} onClick={handleSaveSubmissions}>Save Submissions</Button>
              </div>
              <Card key={assignment.id} className="mb-8">
                <CardHeader className="border p-5 rounded-md m-4">
                  <CardTitle>Assignment - {assignment.title}</CardTitle>
                </CardHeader>
                <CardContent className="border p-5 rounded-md m-4">
                  <h4 className="font-semibold">Assignment Document</h4>
                  <iframe
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewUrl(assignment.notesUrl))}&embedded=true`}
                    title="Assignment Preview"
                    width="100%"
                    height="200px"
                    style={{ border: "none" }}
                  ></iframe>
                  <div className="flex justify-end mt-2">
                    <Button>
                      <a href={assignment.notesUrl}>Download</a>
                    </Button>
                  </div>
                </CardContent>
                <CardContent className="border p-5 rounded-md m-4">
                  {submission && (
                    <>
                    <div className="flex gap-2 mb-4">
                      <h4 className="font-semibold">Previous Submission:</h4>
                      <p className="font-semibold">Submitted at: {new Date(submission.submittedAt.seconds * 1000).toLocaleDateString()}</p>
                    </div>
                     <Button style={{ backgroundColor: "#5800A3" }}>
                     <a href={submission.notesUrl} target="_blank" rel="noopener noreferrer">View Submission</a>
                   </Button>
                   </>
                  )}
                  </CardContent>
                  <CardContent className="border p-5 rounded-md m-4">
                  <div>
                  <Button onClick={() => handleReplaceNotes(index)}>Submit Assignment</Button>
                  </div>
                  {replaceNotes[index] && (
                    <div className="mt-6">
                    {(percentCompleted[index] > 0)  ? (
                      <MediaProgressbar
                        isMediaUploading={percentCompleted[index] > 0} 
                        progress={percentCompleted[index]}
                      />
                    ) : null}
                      <h4 className="font-semibold">Upload Assignment</h4>
                      <Input
                        type="file"
                        accept=".pdf, .txt"
                        onChange={(e) => {
                          const newFiles = [...files];
                          newFiles[index] = e.target.files[0];
                          setFiles(newFiles);
                        }}
                        className="mb-4"
                      />
                    </div>
                  )}
              <Button
  className="justify-end mt-2"
  style={{ backgroundColor: "#5800A3" }}
  onClick={() => uploadDocument(files[index], index)}
>
  Finished
</Button>
                </CardContent>
              </Card>
              </>
            );
          })
        ) : (
          <p>No assignments available.</p>
        )
      ) : (
        <div className="flex flex-col md:flex-row gap-8 mt-8">
        <main className="flex-grow">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>What you'll learn</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {studentViewCourseDetails?.objectives
                  .split(",")
                  .map((objective, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="mr-2 h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>{objective}</span>
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Course Description</CardTitle>
            </CardHeader>
            <CardContent>{studentViewCourseDetails?.description}</CardContent>
          </Card>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Course Curriculum</CardTitle>
            </CardHeader>
            <CardContent>
              {studentViewCourseDetails?.curriculum?.map(
                (curriculumItem, index) => (
                  <li
                    key={index}
                    className={"cursor-pointer flex items-center mb-4"}
                    onClick={() => handleSetFreePreview(curriculumItem)
                    }
                  >
                   
                      <PlayCircle className="mr-2 h-4 w-4" />
                  
                    <span>{curriculumItem?.title}</span>
                  </li>
                )
              )}
            </CardContent>
          </Card>
          <Card>
          <CardHeader>
              <CardTitle>Notes Document</CardTitle>
            </CardHeader>
          <CardContent>
              <iframe
                src={googleViewerUrlNotes}
                title="Assignment Preview"
                width="100%"
                height="200px"
                style={{ border: "none" }}
              ></iframe>
            </CardContent>
          </Card>
        </main>
        <aside className="w-full md:w-[500px]">
          <Card className="sticky top-4">
            <CardContent className="p-6">
              <div className="aspect-video mb-4 rounded-lg flex items-center justify-center">
                <VideoPlayer
                  url={studentViewCourseDetails?.curriculum[0].videoUrl}
                  onProgressUpdate={handleProgressUpdate}
                  progressData={progressData}
                  width="450px"
                  height="200px"
                />
              </div>
              <Button style={{backgroundColor:"#E86391"}} onClick={handleAddToCart} className="w-full">
                Add to My Courses
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
      )}

<Dialog
        open={showFreePreviewDialog}
        onOpenChange={() => {
          setShowFreePreviewDialog(false);
          setDisplayCurrentVideoFreePreview(null);
        }}
      >
        <DialogContent className="w-[800px]">
          <DialogHeader>
            <DialogTitle>Course Preview</DialogTitle>
          </DialogHeader>
          <div className="aspect-video rounded-lg flex items-center justify-center">
            <VideoPlayer
              url={displayCurrentVideoFreePreview}
              width="450px"
              height="200px"
            />
          </div>
          <div className="flex flex-col gap-2">
            {studentViewCourseDetails?.curriculum
              ?.filter((item) => item.freePreview)
              .map((filteredItem) => (
                <p
                  key={filteredItem._id}
                  onClick={() => handleSetFreePreview(filteredItem)}
                  className="cursor-pointer text-[16px] font-medium"
                >
                  {filteredItem?.title}
                </p>
              ))}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default StudentViewCourseDetailsPage;

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import MediaProgressbar from "@/components/media-progress-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { documentUploadService, getAllUsersData, saveAssignmentToFirestore, getAssignmentsByCourseId } from "@/services";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { auth } from "@/firebase";
import { useParams, useNavigate } from "react-router-dom";

function CourseAssignment() {
  const userId = auth.currentUser.uid;
  const [assignments, setAssignments] = useState([]);
  const [users, setUsers] = useState([]);
  const params = useParams();
  const courseId = params?.courseId;
  const navigate = useNavigate();

  // Fetch users when component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      const usersData = await getAllUsersData();
      if (usersData) setUsers(usersData);
    };
    fetchUsers();
  }, []);

  // Fetch assignments based on courseId when component mounts
  useEffect(() => {
    const fetchAssignments = async () => {
      if (courseId) {
        const fetchedAssignments = await getAssignmentsByCourseId(courseId);
        // Mark all fetched assignments as existing (not new)
        const updatedAssignments = fetchedAssignments.map(assignment => ({
          ...assignment,
          isNew: false,
        }));
        setAssignments(updatedAssignments);
      }
    };
    fetchAssignments();
  }, [courseId]);
  // State to manage which assignments are in replace mode
  const [replaceNotes, setReplaceNotes] = useState(Array(assignments.length).fill(false));

  const handleNewAssignment = () => {
    setAssignments([...assignments, { id: assignments.length, title: "", notes: "", uploadProgress: 0, selectedUsers: [], isNew: true, docId: null }]);
    setReplaceNotes((prev) => [...prev, false]);
  };  

  const handleTitleChange = (event, index) => {
    const updatedAssignments = [...assignments];
    updatedAssignments[index].title = event.target.value;
    setAssignments(updatedAssignments);
  };

  const handleUserSelection = (userId, index) => {
    const updatedAssignments = [...assignments];
    const selectedUsers = updatedAssignments[index].selectedUsers;

    if (selectedUsers.includes(userId)) {
      updatedAssignments[index].selectedUsers = selectedUsers.filter((id) => id !== userId);
    } else {
      updatedAssignments[index].selectedUsers = [...selectedUsers, userId];
    }

    setAssignments(updatedAssignments);
  };

  const handleNotesUpload = async (event, index) => {
    const file = event.target.files[0];
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const updatedAssignments = [...assignments];
      updatedAssignments[index].uploadProgress = 0;
      setAssignments(updatedAssignments);

      const response = await documentUploadService(formData, (progress) => {
        updatedAssignments[index].uploadProgress = progress;
        setAssignments([...updatedAssignments]);
      });

      if (response.success) {
        updatedAssignments[index].notes = response.data.url;
        setAssignments(updatedAssignments);
        toast.success("Assignment uploaded successfully!");
      } else {
        toast.error("Failed to upload assignment. Please try again.");
      }
    } catch (error) {
      toast.error("Failed to upload assignment. Please try again.");
      console.error("Error uploading assignment:", error);
    } finally {
      const updatedAssignments = [...assignments];
      updatedAssignments[index].uploadProgress = 0;
      setAssignments(updatedAssignments);
    }
  };

  const handleSubmitAssignments = async () => {
    try {
      console.log("assignment", assignments);
      await Promise.all(assignments.map(async (assignment) => {
        if (assignment.isNew) {
          // Save new assignment and update docId in state
          const updatedAssignment = { ...assignment };
          await saveAssignmentToFirestore(updatedAssignment, userId, courseId);
          assignment.docId = updatedAssignment.docId; // Save the new docId in the assignments state
          assignment.isNew = false; // Mark as saved
        } else {
          await saveAssignmentToFirestore(assignment, userId, courseId);
        }
      }));
      
      toast.success("Assignments submitted successfully!");
    } catch (error) {
      console.error("Error submitting assignments:", error);
      toast.error("Failed to submit assignments. Please try again.");
    }
  };
  
  

  const previewUrl = (url) => url.replace("/upload/", "/upload/fl_attachment/");

  const handleReplaceNotes = (index) => {
    setReplaceNotes((prev) => {
      const newReplaceNotes = [...prev];
      newReplaceNotes[index] = !newReplaceNotes[index]; 
      return newReplaceNotes;
    });
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between">
        <h1 className="text-3xl font-extrabold mb-5">Assign Practice Assignments</h1>
        <Button
          onClick={handleSubmitAssignments}
          className="text-sm tracking-wider font-bold px-8"
          style={{ backgroundColor: "#5800A3" }}
        >
          SUBMIT
        </Button>
      </div>
      <Card>
        <CardContent>
          <Button onClick={handleNewAssignment} className="mb-4">
            Add Assignment
          </Button>
          {assignments.map((assignment, index) => (
            <Card key={assignment.id} className="mb-6">
              <CardHeader>
                <CardTitle>Assignment {index + 1}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">Select Users</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="p-2">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center p-2">
                        <Checkbox
                          checked={assignment.selectedUsers.includes(user.id)}
                          onCheckedChange={() => handleUserSelection(user.id, index)}
                        />
                        <span className="ml-2">{user.name || user.email}</span>
                      </div>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <Input
                  type="text"
                  placeholder="Enter assignment title"
                  value={assignment.title}
                  onChange={(e) => handleTitleChange(e, index)}
                  className="mb-4"
                />
                {assignment.uploadProgress > 0 && (
                  <MediaProgressbar
                    isMediaUploading={assignment.uploadProgress > 0}
                    progress={assignment.uploadProgress}
                  />
                )}
                {assignment.notes ? (
                  <>
                    <h4 className="font-semibold">Assignment Preview</h4>
                    <iframe
                      src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewUrl(assignment.notes))}&embedded=true`}
                      title="Assignment Preview"
                      width="100%"
                      height="200px"
                      style={{ border: "none" }}
                    ></iframe>
                  </>
                ) : (
                  <div className="mt-6">
                    <h4 className="font-semibold">Upload Notes</h4>
                    <Input
                      type="file"
                      accept=".pdf, .txt"
                      onChange={(e) => handleNotesUpload(e, index)}
                      className="mb-4"
                    />
                  </div>
                )}
              </CardContent>
              <CardContent>
                <Button onClick={() => handleReplaceNotes(index)}>
                  Replace Notes
                </Button>
                {replaceNotes[index] && (
                  <div className="mt-6">
                    <h4 className="font-semibold">Upload New Notes</h4>
                    <Input
                      type="file"
                      accept=".pdf, .txt"
                      onChange={(e) => handleNotesUpload(e, index)}
                      className="mb-4"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default CourseAssignment;

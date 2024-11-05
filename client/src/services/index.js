import axiosInstance from "@/api/axiosInstance";
import { auth, db } from "@/firebase"; // Import initialized Firebase app
import { collection, addDoc, getDoc, getDocs, doc, setDoc, updateDoc, query, where, deleteDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { toast } from 'react-toastify';


export async function registerService(signUpFormData) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      signUpFormData.userEmail,
      signUpFormData.password
    );
    const user = userCredential.user;

    // Add user to Firestore database
    await setDoc(doc(db, "users", user.uid), {
      email: signUpFormData.userEmail,
      name: signUpFormData.userName,
      role: "user",
    });
    toast.success('User registered successfully!');
    return {
      success: true,
      message: 'User registered successfully!',
      user: { uid: user.uid, email: user.email } // Return user data here
    };
  } catch (error) {
    console.error("Registration error:", error);
    toast.error(`Registration failed, user email already exists`); 
    return { success: false, message: error.message };
  }
}

export const forgotPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log("Password reset email sent!");
    toast.success("Password reset email sent! Check your inbox.");
  } catch (error) {
    console.error("Error sending password reset email:", error);
    toast.error("Failed to send password reset email. Please check the email address.");
  }
};

// User Login Service
export async function loginService(formData) {
  const { userEmail, password } = formData;

  const userCredential = await signInWithEmailAndPassword(auth, userEmail, password);
  const user = userCredential.user;
  toast.success('User Logged in successfully!');
  return {
    success: true,
    data: {
      accessToken: await user.getIdToken(),
      user: {
        uid: user.uid,
        userEmail: user.email,
      },
    },
  };
}

export async function checkAuthService() {
  const user = auth.currentUser; 
  console.log("Current User:", user); 

  if (user) {
    const userRef = doc(db, "users", user.uid); 
    console.log("User Reference:", userRef); 

    try {
      const userSnapshot = await getDoc(userRef); 
      console.log("User Snapshot Exists:", userSnapshot.exists()); 

      if (userSnapshot.exists()) {
        const userData = userSnapshot.data(); 
        console.log("User Data:", userData); 
        return { success: true, data: { ...userData, uid: user.uid } }; 
      } else {
        console.warn("No document found for the UID:", user.uid);
      }
    } catch (error) {
      console.error("Error fetching user document:", error);
    }
  } else {
    console.warn("No user is currently logged in.");
  }
  return { success: false, data: null };
}

export async function addToStudentCart(userId, courseId) {
  try {
    const cartRef = collection(db, "studentcourses");

    const q = query(cartRef, where("userId", "==", userId), where("courseId", "==", courseId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      toast.info("Course is already in your cart");
      return { success: false, message: "Course is already in your cart" };
    }

    const cartData = {
      userId,
      courseId,
    };

    await addDoc(cartRef, cartData);
    console.log("Course added to cart successfully");
    toast.success("Course added to cart successfully");
    return { success: true, message: "Course added to cart successfully" };
  } catch (error) {
    toast.error("Error adding course to cart");
    console.error("Error adding course to cart:", error);
    return { success: false, message: error.message };
  }
}

export async function getStudentCartCourses(userId) {
  try {
    const cartRef = collection(db, "studentcourses");

    const q = query(cartRef, where("userId", "==", userId));
    const snapshot = await getDocs(q);

    const cartCourses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log("Student cart courses:", cartCourses);
    return { success: true, data: cartCourses };
  } catch (error) {
    toast.error("Error fetching My courses, Contact admin");
    console.error("Error fetching cart courses:", error);
    return { success: false, message: error.message };
  }
}

// export const saveAssignmentToFirestore = async (assignment, userId, courseId) => {
//   if (!userId) {
//     console.error("User ID is undefined.");
//     return;
//   }

//   if (!courseId) {
//     console.error("Course ID is undefined.");
//     return;
//   }

//   try {
//     const assignmentRef = collection(db, "courseassignment");

//     if (assignment.isNew) {
//       // Adding a new assignment and capturing the docId
//       const newDoc = await addDoc(assignmentRef, {
//         courseId,
//         userId,
//         title: assignment.title,
//         notesUrl: assignment.notes,
//         selectedUsers: assignment.selectedUsers,
//       });
//       assignment.docId = newDoc.id; // Store the new document ID in the assignment
//     } else if (assignment.docId) {
//       // Updating an existing assignment using its docId
//       const docRef = doc(db, "courseassignment", assignment.docId);
//       await updateDoc(docRef, {
//         title: assignment.title,
//         notesUrl: assignment.notes,
//         selectedUsers: assignment.selectedUsers,
//       });
//     } else {
//       console.warn(`No document ID available for assignment with ID: ${assignment.id}`);
//     }
//   } catch (error) {
//     console.error("Error saving assignment to Firestore:", error);
//   }
// };


// export const saveAssignmentToFirestore = async (assignment, index, userId, courseId) => {
//   if (!userId) {
//     console.error("User ID is undefined.");
//     return;
//   }

//   if (!courseId) {
//     console.error("Course ID is undefined.");
//     return;
//   }

//   try {
//     await addDoc(collection(db, "courseassignment"), {
//       assignmentId: assignment.id,
//       courseId,
//       userId,
//       title: assignment.title,
//       notesUrl: assignment.notes,
//       selectedUsers: assignment.selectedUsers,
//     });
//   } catch (error) {
//     console.error("Error saving assignment to Firestore:", error);
//   }
// };


export async function getStudentsByCourseId(courseId) {
  const students = [];
  try {
    const studentsRef = collection(db, 'studentcourses'); // Reference to the studentcourses collection
    const q = query(studentsRef, where('courseId', '==', courseId)); // Create query
    const querySnapshot = await getDocs(q); // Execute query

    querySnapshot.forEach((doc) => {
      students.push({ id: doc.id, ...doc.data() });
    });
  } catch (error) {
    console.error('Error retrieving students for course:', error);
    toast.error("Error fetching Students, Contact admin");
  }
  return students;
}

export async function getAssignmentsByCourseId(courseId) {
  const assignments = [];
  try {
    const assignmentsRef = collection(db, 'courseassignment'); // Reference to the courseassignment collection
    const q = query(assignmentsRef, where('courseId', '==', courseId)); // Create query
    const querySnapshot = await getDocs(q); // Execute query

    querySnapshot.forEach((doc) => {
      assignments.push({
        docId: doc.id,            // Firestore document ID
        ...doc.data(),
        isNew: false              // Mark as existing assignment
      });
    });
  } catch (error) {
    console.error('Error retrieving assignments for course ID', courseId, ':', error);
    toast.error("Error fetching assignments, Contact admin");
  }

  return assignments;
}

export const saveAssignmentToFirestore = async (assignment, userId, courseId) => {
  if (!userId) {
    console.error("User ID is undefined.");
    return;
  }

  if (!courseId) {
    console.error("Course ID is undefined.");
    return;
  }

  try {
    const assignmentRef = collection(db, "courseassignment");

    if (assignment.isNew) {
      // Add new assignment and retrieve the document ID
      const docRef = await addDoc(assignmentRef, {
        courseId,
        userId,
        title: assignment.title,
        notesUrl: assignment.notes || "",  // Default to empty string if notes is undefined
        selectedUsers: assignment.selectedUsers || [], // Default to empty array if undefined
      });

      // Save the docId in Firestore for easy future reference
      await updateDoc(docRef, { docId: docRef.id });

      // Update the local assignment object to include the docId
      assignment.docId = docRef.id;
    } else {
      // Update existing assignment by document ID
      if (!assignment.docId) {
        console.error("Assignment docId is missing for update.");
        return;
      }

      const docRef = doc(db, "courseassignment", assignment.docId);

      const updateData = {
        title: assignment.title,
        selectedUsers: assignment.selectedUsers || []
      };

      if (assignment.notes) {
        updateData.notesUrl = assignment.notes;
      }

      await updateDoc(docRef, updateData);
    }
  } catch (error) {
    console.error("Error saving assignment to Firestore:", error);
    toast.error("Error saving assignments, Contact admin");
  }
};

export const saveSubmissionToFirestore = async (submission) => {
  const { userId, courseId, assignmentId, notesUrl } = submission;

  if (!userId || !courseId || !assignmentId) {
    console.error("Missing required fields: userId, courseId, or assignmentId.");
    return { success: false, message: "Required fields are missing" };
  }

  try {
    const submissionsRef = collection(db, "studentSubmissions");

    // Check if a submission already exists for this userId and assignmentId
    const q = query(
      submissionsRef,
      where("userId", "==", userId),
      where("assignmentId", "==", assignmentId)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // No existing submission, so create a new one
      const newSubmissionRef = await addDoc(submissionsRef, {
        userId,
        courseId,
        assignmentId,
        notesUrl,
        submittedAt: new Date(),
      });

      return { success: true, message: "Submission created", docId: newSubmissionRef.id };
    } else {
      // Update the existing submission's notesUrl
      const existingDoc = querySnapshot.docs[0];
      const docRef = doc(db, "studentSubmissions", existingDoc.id);

      await updateDoc(docRef, {
        notesUrl,
        submittedAt: new Date(), // Optionally update the timestamp
      });

      return { success: true, message: "Submission updated", docId: existingDoc.id };
    }
  } catch (error) {
    console.error("Error saving submission to Firestore:", error);
    toast.error("Error saving submission, Contact admin");
    return { success: false, message: "Error saving submission" };
  }
};

export async function getSubmissionsByUserAndCourse(userId, courseId) {
  const submissionsRef = collection(db, "studentSubmissions");
  const q = query(submissionsRef, where("userId", "==", userId), where("courseId", "==", courseId));

  try {
    const querySnapshot = await getDocs(q);
    const submissions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return submissions;
  } catch (error) {
    toast.error("Error fetching submissions, Contact admin");
    console.error("Error fetching submissions:", error);
    throw error;
  }
}

export async function getAssignmentsByUserAndCourse(userId, courseId) {
  const assignments = [];

  try {
    const assignmentsRef = collection(db, "courseassignment");
    const q = query(
      assignmentsRef, 
      where("selectedUsers", "array-contains", userId),
      where("courseId", "==", courseId)
    );

    const querySnapshot = await getDocs(q);
    
    console.log("User ID:", userId);
    console.log("Course ID:", courseId);
    console.log("Query Snapshot Size:", querySnapshot.size);

    querySnapshot.forEach((doc) => {
      console.log("Document Data:", doc.data()); // Log document data for verification
      assignments.push({ id: doc.id, ...doc.data() });
    });
  } catch (error) {
    toast.error("Error fetching assignments. Contact admin."); 
    console.error("Error retrieving assignments for user and course:", error);
  }

  console.log("Assignments fetched:", assignments);
  return assignments; 
}


export async function getAllUsersData() {
  try {
    const usersCollectionRef = collection(db, "users");
    const snapshot = await getDocs(usersCollectionRef);
    const usersData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    console.log("All users data:", usersData);
    return usersData;
  } catch (error) {
    console.error("Error fetching users data:", error);
    toast.error("Error fetching all users, Contact admin");
    return null;
  }
}


export async function documentUploadService(formData, onProgressCallback) {
  const file = formData.get("file");
  console.log("file is",file)
  const maxFileSize = 10 * 1024 * 1024;
  if (file.size > maxFileSize) {
    alert("File size exceeds 10 MB. Please choose a smaller file.");
    return { success: false, message: "File size exceeds limit" };
  }
  
  try {
    const { data } = await axiosInstance.post("/media/upload-files", formData, {
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgressCallback(percentCompleted);
      },
    });
    console.log("reached data", data);
    toast.success(`File "${file.name}" is successfully uploaded. Click on Finished Submissions to Submit assignment`)
    return data;
  } catch (error) {
    console.error("Error uploading media:", error);
    toast.error("Error uploading documents, Contact admin");
    return { success: false, message: "Upload failed" };
  }
}


export async function mediaUploadService(formData, onProgressCallback) {
  const file = formData.get('file');
  
  // Validate file size (in bytes)
  const maxFileSize = 10 * 1024 * 1024; // 10 MB
  if (file.size > maxFileSize) {
    alert("File size exceeds 10 MB. Please choose a smaller file.");
    return;
  }
  
  const { data } = await axiosInstance.post("/media/upload", formData, {
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      onProgressCallback(percentCompleted);
    },
  });

  return data;
}


export async function mediaBulkUploadService(formData, onProgressCallback) {
  const { data } = await axiosInstance.post("/media/bulk-upload", formData, {
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      onProgressCallback(percentCompleted);
    },
  });
  return data;
}

export async function mediaDeleteService(id) {
  const { data } = await axiosInstance.delete(`/media/delete/${id}`);
  return data;
}

export async function fetchInstructorCourseListService() {
  try {
    const courseCollectionRef = collection(db, "courses");
    const courseSnapshot = await getDocs(courseCollectionRef);
    
    // Map through each document snapshot and get its data
    const courses = courseSnapshot.docs.map((doc) => ({
      id: doc.id, // Include the document ID
      ...doc.data(), // Get the document data
    }));

    return { success: true, data: courses };
  } catch (error) {
    console.error("Error fetching course list:", error);
    return { success: false, message: "Failed to fetch course list" };
  }
}

export async function addNewCourseService(courseData) {
  // Filter out undefined values from courseData
  const sanitizedData = Object.fromEntries(
    Object.entries(courseData).filter(([_, value]) => value !== undefined)
  );

  try {
    const courseRef = await addDoc(collection(db, "courses"), sanitizedData);
    return { success: true, id: courseRef.id };
  } catch (error) {
    console.error("Error adding new course:", error);
    return { success: false, message: "Failed to add course" };
  }
}

export async function deleteCourseService(courseId) {
  try {
    const courseRef = doc(db, "courses", courseId);
    
    await deleteDoc(courseRef);
    
    toast.success("Course deleted successfully");
    return { success: true, message: "Course deleted successfully" };
  } catch (error) {
    console.error("Error deleting course:", error);
    toast.error("Failed to delete course")
    return { success: false, message: "Failed to delete course" };
  }
}

export async function fetchInstructorCourseDetailsService(id) {
  try {
    const docRef = doc(db, "courses", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      return { success: false, message: "Course not found" };
    }
  } catch (error) {
    console.error("Error fetching course details:", error);
    return { success: false, message: "Failed to fetch course details" };
  }
}

export async function updateCourseByIdService(id, courseData) {
  try {
    // Log the courseData for debugging
    console.log("Updating course with ID:", id, "Data:", courseData);

    // Check for undefined values in courseData
    for (const key in courseData) {
      if (courseData[key] === undefined) {
        console.warn(`Skipping field "${key}" because its value is undefined`);
        delete courseData[key]; // Remove undefined fields to avoid errors
      }
    }

    const courseRef = doc(db, "courses", id);
    await updateDoc(courseRef, courseData);
    return { success: true, message: "Course updated successfully" };
  } catch (error) {
    console.error("Error updating course:", error);
    return { success: false, message: "Failed to update course" };
  }
}

// export async function fetchStudentViewCourseListService(filters = {}) {
//   console.log("Hey object");
//   const coursesRef = collection(db, "courses");
//   let queries = []; 

//   const category = filters.get("category"); 
//   const level = filters.get("level"); 
//   const primaryLanguage = filters.get("primaryLanguage"); 

//   if (category) {
//     queries.push(where("category", "==", category));
//   }

//   if (level) {
//     queries.push(where("level", "==", level));
//   }
  
//   if (primaryLanguage) {
//     queries.push(where("primaryLanguage", "==", primaryLanguage));
//   }

//   console.log("filters", filters);
//   console.log("queries", queries);
  
//   const q = query(coursesRef, ...queries);
//   console.log("q", q);

//   const snapshot = await getDocs(q);
//   const courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//   console.log("courses", courses);

//   return { success: true, data: courses };
// }

export async function fetchStudentViewAllCourseListService() {
  console.log("Fetching all courses without filters");

  const coursesRef = collection(db, "courses");

  // Fetch all documents from the 'courses' collection
  const snapshot = await getDocs(coursesRef);
  const courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  console.log("All courses:", courses);

  return { success: true, data: courses };
}

export async function fetchStudentViewCourseListService(filters = {}) {
  console.log("Hey object");
  const coursesRef = collection(db, "courses");
  let queries = []; 

  // Extract each filter, allowing multiple values by splitting at commas
  const category = filters.get("category")?.split(","); 
  const level = filters.get("level")?.split(","); 
  const primaryLanguage = filters.get("primaryLanguage")?.split(","); 

  // Check if each filter has multiple values, and apply an "in" query
  if (category && category.length > 0) {
    queries.push(where("category", "in", category));
  }

  if (level && level.length > 0) {
    queries.push(where("level", "in", level));
  }
  
  if (primaryLanguage && primaryLanguage.length > 0) {
    queries.push(where("primaryLanguage", "in", primaryLanguage));
  }

  console.log("filters", filters);
  console.log("queries", queries);

  // Create a combined query
  const q = query(coursesRef, ...queries);
  console.log("q", q);

  const snapshot = await getDocs(q);
  const courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  console.log("courses", courses);

  return { success: true, data: courses };
}


export async function fetchStudentViewCourseDetailsService(courseId) {
  try {
    const courseRef = doc(db, "courses", courseId); // assumes collection name is 'courses'
    const courseSnapshot = await getDoc(courseRef);

    if (!courseSnapshot.exists()) {
      return {
        success: false,
        message: "No course details found",
        data: null,
      };
    }

    return {
      success: true,
      data: courseSnapshot.data(),
    };
  } catch (error) {
    console.error("Error fetching course details:", error);
    return {
      success: false,
      message: "Some error occurred!",
    };
  }
}


export const uploadFilesTypes = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await axios.post("/upload-document", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error uploading document:", error);
    throw error;
  }
};

export async function checkCoursePurchaseInfoService(courseId, studentId) {
  const { data } = await axiosInstance.get(
    `/student/course/purchase-info/${courseId}/${studentId}`
  );

  return data;
}

export async function createPaymentService(formData) {
  const { data } = await axiosInstance.post(`/student/order/create`, formData);

  return data;
}

export async function captureAndFinalizePaymentService(
  paymentId,
  payerId,
  orderId
) {
  const { data } = await axiosInstance.post(`/student/order/capture`, {
    paymentId,
    payerId,
    orderId,
  });

  return data;
}

export async function fetchStudentBoughtCoursesService(studentId) {
  const { data } = await axiosInstance.get(
    `/student/courses-bought/get/${studentId}`
  );

  return data;
}


export async function getCurrentCourseProgressService(userId, courseId) {
  const { data } = await axiosInstance.get(
    `/student/course-progress/get/${userId}/${courseId}`
  );

  return data;
}

export async function markLectureAsViewedService(userId, courseId, lectureId) {
  const { data } = await axiosInstance.post(
    `/student/course-progress/mark-lecture-viewed`,
    {
      userId,
      courseId,
      lectureId,
    }
  );

  return data;
}

export async function resetCourseProgressService(userId, courseId) {
  const { data } = await axiosInstance.post(
    `/student/course-progress/reset-progress`,
    {
      userId,
      courseId,
    }
  );

  return data;
}

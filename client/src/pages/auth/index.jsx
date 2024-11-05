import CommonForm from "@/components/common-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { signInFormControls, signUpFormControls, forgotPasswordFormControls } from "@/config";
import { AuthContext } from "@/context/auth-context";
import { GraduationCap } from "lucide-react";
import { useContext, useState } from "react";
import { Link } from "react-router-dom";

function AuthPage() {
  const [activeTab, setActiveTab] = useState("signin");
  const [isForgotPassword, setIsForgotPassword] = useState(false); // New state for forgot password view
  const [forgotPasswordData, setForgotPasswordData] = useState({ userEmail: "" }); // State for forgot password email

  const {
    signInFormData,
    setSignInFormData,
    signUpFormData,
    setSignUpFormData,
    handleRegisterUser,
    handleLoginUser,
    handleForgotPassword, // Forgot password function from context
  } = useContext(AuthContext);

  function handleTabChange(value) {
    setActiveTab(value);
    setIsForgotPassword(false); // Reset forgot password view when switching tabs
  }

  function checkIfSignInFormIsValid() {
    return (
      signInFormData &&
      signInFormData.userEmail !== "" &&
      signInFormData.password !== ""
    );
  }

  function checkIfSignUpFormIsValid() {
    return (
      signUpFormData &&
      signUpFormData.userName !== "" &&
      signUpFormData.userEmail !== "" &&
      signUpFormData.password !== ""
    );
  }

  // Handle forgot password form submission
  function handleForgotPasswordSubmit(event) {
    event.preventDefault();
    if (forgotPasswordData.userEmail) {
      handleForgotPassword(forgotPasswordData.userEmail);
    } else {
      alert("Please enter a valid email address.");
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link to={"/"} className="flex items-center justify-center">
          <GraduationCap className="h-8 w-8 mr-4" />
          <span className="font-extrabold text-xl">EdAcessible</span>
        </Link>
      </header>
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Tabs
          value={activeTab}
          defaultValue="signin"
          onValueChange={handleTabChange}
          className="w-full max-w-md"
        >
          <TabsList className={"grid w-full grid-cols-2"}>
          {!isForgotPassword ? (
            <>
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </>
          ) :<><TabsTrigger value="signin">Forgot Password</TabsTrigger>
          <TabsTrigger value="">Sign Up</TabsTrigger>
          </>}
          </TabsList>
          <TabsContent value="signin">
            <Card className="p-6 space-y-4">
              <CardHeader>
                <CardTitle>
                  {isForgotPassword ? "Forgot Password" : "Sign in to your account"}
                </CardTitle>
                <CardDescription>
                  {isForgotPassword
                    ? "Enter your email to reset your password"
                    : "Enter your email and password to access your account"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {isForgotPassword ? (
                  // Forgot Password Form using CommonForm
                  <CommonForm
                    formControls={forgotPasswordFormControls}
                    buttonText="Reset Password"
                    formData={forgotPasswordData}
                    setFormData={setForgotPasswordData}
                    handleSubmit={handleForgotPasswordSubmit}
                    isButtonDisabled={!forgotPasswordData.userEmail}
                  />
                ) : (
                  // Sign In Form
                  <>
                    <CommonForm
                      formControls={signInFormControls}
                      buttonText={"Sign In"}
                      formData={signInFormData}
                      setFormData={setSignInFormData}
                      isButtonDisabled={!checkIfSignInFormIsValid()}
                      handleSubmit={handleLoginUser}
                    />
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="w-full mt-2 text-sm text-blue-500"
                    >
                      Forgot Password?
                    </button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="signup">
            <Card className="p-6 space-y-4">
              <CardHeader>
                <CardTitle>Create an account</CardTitle>
                <CardDescription>
                  Enter your details to register
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <CommonForm
                  formControls={signUpFormControls}
                  buttonText={"Sign Up"}
                  formData={signUpFormData}
                  setFormData={setSignUpFormData}
                  isButtonDisabled={!checkIfSignUpFormIsValid()}
                  handleSubmit={handleRegisterUser}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default AuthPage;
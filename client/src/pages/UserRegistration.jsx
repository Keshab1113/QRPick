import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, Hash, Users, Phone, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

const UserRegistration = () => {
  const { token } = useParams();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    koc_id: "",
    email: "",
    team: "",
    otherTeam: "",
    mobile: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [sessionValid, setSessionValid] = useState(true);
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (!token) {
      setSessionValid(false);
      toast.error("Invalid registration link");
    }
  }, [token]);

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateField = (fieldName) => {
    const value = formData[fieldName];
    let error = "";

    switch (fieldName) {
      case "name":
        if (!value.trim()) error = "Name is required";
        else if (value.length < 2) error = "Name must be at least 2 characters";
        break;
      
      case "koc_id":
        if (!value.trim()) error = "KOC ID is required";
        else if (value.length < 3) error = "KOC ID must be at least 3 characters";
        break;
      
      case "email":
        if (!value.trim()) error = "Email is required";
        else if (!value.includes("@kockw.com")) error = "Only @kockw.com emails allowed";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Invalid email format";
        break;
      
      case "team":
        if (!value.trim()) error = "Please select a team";
        else if (value === "Others" && !formData.otherTeam.trim()) {
          error = "Please enter your team name";
        }
        break;
      
      case "otherTeam":
        if (formData.team === "Others" && !value.trim()) {
          error = "Team name is required";
        }
        break;
      
      case "mobile":
        if (!value.trim()) error = "Mobile number is required";
        else if (!/^[0-9]{8,12}$/.test(value)) error = "Must be 8-12 digits only";
        break;
      
      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [fieldName]: error }));
    return !error;
  };

  const validateForm = () => {
    const fieldsToValidate = ["name", "koc_id", "email", "team", "mobile"];
    if (formData.team === "Others") fieldsToValidate.push("otherTeam");
    
    let isValid = true;
    const newErrors = {};
    
    fieldsToValidate.forEach((field) => {
      const value = formData[field];
      let error = "";
      
      switch (field) {
        case "name":
          if (!value.trim()) error = "Name is required";
          else if (value.length < 2) error = "Name must be at least 2 characters";
          break;
        case "koc_id":
          if (!value.trim()) error = "KOC ID is required";
          else if (value.length < 3) error = "KOC ID must be at least 3 characters";
          break;
        case "email":
          if (!value.trim()) error = "Email is required";
          else if (!value.includes("@kockw.com")) error = "Only @kockw.com emails allowed";
          else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Invalid email format";
          break;
        case "team":
          if (!value.trim()) error = "Please select a team";
          break;
        case "otherTeam":
          if (formData.team === "Others" && !value.trim()) {
            error = "Team name is required";
          }
          break;
        case "mobile":
          if (!value.trim()) error = "Mobile number is required";
          else if (!/^[0-9]{8,12}$/.test(value)) error = "Must be 8-12 digits only";
          break;
      }
      
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "team" && value !== "Others" ? { otherTeam: "" } : {}),
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allFields = ["name", "koc_id", "email", "team", "mobile", "otherTeam"];
    allFields.forEach((field) => setTouched((prev) => ({ ...prev, [field]: true })));
    
    // Validate form
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setLoading(true);

    const finalTeam = formData.team === "Others" ? formData.otherTeam : formData.team;

    const payload = {
      ...formData,
      team: finalTeam,
      session_token: token,
    };

    const result = await register(payload, token);

    if (result.success) {
      toast.success("Registration successful!");
      setTimeout(() => {
        navigate("/user/view");
      }, 1500);
    } else {
      // Handle API validation errors
      if (result.errors) {
        const apiErrors = {};
        result.errors.forEach((err) => {
          if (err.field) {
            apiErrors[err.field] = err.message;
          }
        });
        setErrors(apiErrors);
        toast.error("Please check the form for errors");
      } else {
        toast.error(result.error || "Registration failed");
      }
    }

    setLoading(false);
  };

  // Helper function to show error message
  const ErrorMessage = ({ message }) => (
    <div className="flex items-center gap-1 mt-1 text-sm text-destructive">
      <AlertCircle className="w-4 h-4" />
      <span>{message}</span>
    </div>
  );

  // Add this to your AuthContext or api service to handle validation errors
  const handleApiValidationError = (error) => {
    if (error.response?.status === 400 && error.response?.data?.details) {
      return {
        success: false,
        errors: error.response.data.details,
        error: "Validation failed"
      };
    }
    return {
      success: false,
      error: error.response?.data?.error || "Registration failed"
    };
  };

  if (!sessionValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Hash className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-xl font-bold mb-2">Invalid Session</h2>
              <p className="text-muted-foreground mb-6">
                This registration link is invalid or has expired.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-primary/20 shadow-xl">
          <CardHeader className="text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">Registration Form</CardTitle>
            <p className="text-muted-foreground">
              Please fill in your details to join the event
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={() => handleBlur("name")}
                    required
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.name ? "border-destructive" : ""
                    }`}
                    placeholder="John Doe"
                  />
                  {errors.name && <ErrorMessage message={errors.name} />}
                </div>

                {/* KOC ID */}
                <div>
                  <label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    KOC ID *
                  </label>
                  <input
                    type="text"
                    name="koc_id"
                    value={formData.koc_id}
                    onChange={handleChange}
                    onBlur={() => handleBlur("koc_id")}
                    required
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.koc_id ? "border-destructive" : ""
                    }`}
                    placeholder="KOC12345"
                  />
                  {errors.koc_id && <ErrorMessage message={errors.koc_id} />}
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={() => handleBlur("email")}
                    required
                    pattern="^[a-zA-Z0-9._%+-]+@kockw\.com$"
                    title="Email must be from @kockw.com domain"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.email ? "border-destructive" : ""
                    }`}
                    placeholder="name@kockw.com"
                  />
                  {errors.email && <ErrorMessage message={errors.email} />}
                </div>

                {/* Team */}
                <div>
                  <label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Team *
                  </label>
                  <select
                    name="team"
                    value={formData.team}
                    onChange={handleChange}
                    onBlur={() => handleBlur("team")}
                    required
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.team ? "border-destructive" : ""
                    }`}
                  >
                    <option value="">Select Team</option>
                    <option value="Drilling Group Admin">
                      Drilling Group Admin
                    </option>
                    <option value="Drilling Team I">Drilling Team (I)</option>
                    <option value="Drilling Team II">Drilling Team (II)</option>
                    <option value="Drilling Team III">
                      Drilling Team (III)
                    </option>
                    <option value="Drilling Team IV">Drilling Team (IV)</option>
                    <option value="Drilling Team V">Drilling Team (V)</option>
                    <option value="Others">Others</option>
                  </select>
                  {errors.team && <ErrorMessage message={errors.team} />}
                </div>

                {formData.team === "Others" && (
                  <div>
                    <label className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Enter Team Name *
                    </label>
                    <input
                      type="text"
                      name="otherTeam"
                      value={formData.otherTeam}
                      onChange={handleChange}
                      onBlur={() => handleBlur("otherTeam")}
                      required={formData.team === "Others"}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                        errors.otherTeam ? "border-destructive" : ""
                      }`}
                      placeholder="Enter your team name"
                    />
                    {errors.otherTeam && <ErrorMessage message={errors.otherTeam} />}
                  </div>
                )}

                {/* Mobile */}
                <div>
                  <label className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    onBlur={() => handleBlur("mobile")}
                    required
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.mobile ? "border-destructive" : ""
                    }`}
                    placeholder="9999999999 (8-12 digits)"
                  />
                  {errors.mobile && <ErrorMessage message={errors.mobile} />}
                </div>
              </div>

              <div className="text-xs text-muted-foreground mb-4">
                <p>* Required fields</p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-lg font-semibold"
              >
                {loading ? (
                  "Processing..."
                ) : (
                  <>
                    Register & Join Event
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t text-center">
              <p className="text-sm text-muted-foreground">
                By registering, you agree to join the live event
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default UserRegistration;
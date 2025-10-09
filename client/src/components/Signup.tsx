import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Confetti from "react-confetti";

const Signup: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [created, setCreated] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least six characters long.");
      return;
    }

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username, password: password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Success");
        if (data.succes) {
          setCreated(true);
        }
      } else {
        setError(data.error || "Signup failed");
      }
    } catch (err) {
      setError("Network error, please try again.");
    }
  };

  const goToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      {created ? (
        <>
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={false}
            numberOfPieces={200}
            tweenDuration={5000}
          />
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center text-green-600">
                Signup Successful!
              </CardTitle>
              <CardDescription className="text-center">
                Your account has been created. You're ready to log in!
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button
                onClick={goToLogin}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 transition-all duration-300"
              >
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Select username"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a password"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm the password"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button type="submit" className="w-full">
                Sign up
              </Button>
              <p className="text-sm text-center">
                Already have an account?
                <a href="/login" className="text-blue-500 hover:underline">
                  Login
                </a>
              </p>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Signup;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ROOT_BACKEND_URL = import.meta.env.DEV ? "http://localhost:4000/" : "/";

const Login: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const login = async (username: string) => {
    try {
      const response = await fetch(`${ROOT_BACKEND_URL}api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: username }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }
      const result = await response.json();

      return result;
    } catch (err) {
      console.error(err instanceof Error ? err.message : "An error occurred");
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }
    try {
      const user = await login(username);

      if (!user) {
	      return;
      }

      console.log("user:", JSON.stringify(user));
      localStorage.setItem("user", JSON.stringify(user));
      navigate("/chat");
    } catch (err) {
      console.error(err instanceof Error ? err.message : "An error occurred");
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 center">
      <Card className="w-full max-w-md transform transition-all hover:shadow-x1 hove:-translate-y-1">
        <CardHeader>
          <CardTitle className="text-center">Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  type="text"
                  id="login-input"
                  value={username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUsername(e.target.value)
                  }
                  placeholder="Enter Username..."
                  required
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button type="submit">Login</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;

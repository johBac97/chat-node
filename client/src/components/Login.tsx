import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, 
	 CardHeader, 
	 CardTitle, 
	 CardContent,
	 CardDescription,
} from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const SERVER_URL = "http://localhost:4000"

const Login: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const navigate = useNavigate();

  const login = async (username: string) => {
    try {
      const response = await fetch(`${SERVER_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: username }),
      });

      if (!response) {
        throw new Error("unable to login");
      }
      const result = await response.json();

      console.log(result);

      return result;
    } catch (err) {
      console.error(  err instanceof Error ? err.message : "An error occurred"); 
    };
  };

  const handleSubmit = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && username.trim()) {
      const user = await login(username);
      console.log("user:", user);
      localStorage.setItem("user", JSON.stringify(user));
      navigate("/chat");
    }
  };


  return (
<div className="min-h-screen flex items-center justify-center p-4 center">
    <Card className="w-full max-w-md transform transition-all hover:shadow-x1 hove:-translate-y-1">
      <CardHeader>
      	<CardTitle className="text-center">Login</CardTitle>
      </CardHeader>
      <CardContent>
      	<form>
		<div className="flex flex-col gap-6">
			<div className="grid gap-2">
				<Label htmlFor="username">Username</Label>
				<Input
				  type="text"
				  value={username}
				  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
				  onKeyPress={handleSubmit}
				  placeholder="Enter Username..."
				  required
				/>
			</div>
		</div>
	</form>
      </CardContent>
   </Card>
</div>
  );
};

export default Login;

      /*
      	<Textarea
		value={username}
	        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
		onKeyPress={handleSubmit}
		placeholder="Enter Username"
	/>
	*/

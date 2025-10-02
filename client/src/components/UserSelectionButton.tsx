import React from "react";
import type { UserPayload } from "@/types/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Socket } from 'socket.io-client';

interface UserSelectionButtonProps {
  setSelectedUser: React.Dispatch<React.SetStateAction<UserPayload | null>>;
  selectedUser: UserPayload | null;
  user: UserPayload;
  socket: Socket;
}

const UserSelectionButton: React.FC<UserSelectionButtonProps> = ({
  setSelectedUser,
  selectedUser,
  user,
  socket,
}) => {
  return (
    <div className="flex flex-col p-1 shadow-xs">
      <Button
        className={cn(
          "text-md font-large hover:bg-accent hover:text-accent-foreground",
          selectedUser?.userId === user?.userId &&
            "font-extrabold border-3 shadown-xs",
        )}
        variant="ghost"
        key={user.username}
        onClick={() => {
          if (selectedUser?.userId === user?.userId) {
            setSelectedUser(null);
          } else {
            setSelectedUser(user);

	    socket.emit("userSelected", {userId: user.userId });
          }
        }}
      >
        {user.username}
      </Button>
    </div>
  );
};

export default UserSelectionButton;

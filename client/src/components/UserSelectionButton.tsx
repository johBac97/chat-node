import React from "react";
import type { UserPayload } from "@/types/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Socket } from "socket.io-client";

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
  const isSelected = selectedUser?.userId === user?.userId;
  return (
    <div className="flex flex-col p-1 shadow-xs">
      <Button
        className={cn(
          "text-md font-large hover:bg-accent hover:text-accent-foreground transition-colors",
          isSelected && "border-2",
          user.online
            ? "border-l-6 border-green-500"
            : "border-l-6 border-gray-300",
        )}
        variant="ghost"
        key={user.username}
        onClick={() => {
          if (selectedUser?.userId === user?.userId) {
            setSelectedUser(null);
          } else {
            setSelectedUser(user);

            socket.emit("userSelected", { userId: user.userId });
          }
        }}
      >
        <span
          className={cn(
            "w-3 h-3 rounded-full mr-2",
            user.online ? "bg-green-500" : "bg-gray-300",
          )}
        />
        <span>{user.username}</span>
      </Button>
    </div>
  );
};

export default UserSelectionButton;

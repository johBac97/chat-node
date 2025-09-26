import React from "react";
import type { UserPayload } from "@/types/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UserSelectionButtonProps {
  setSelectedUser: React.Dispatch<React.SetStateAction<UserPayload>>;
  selectedUser: UserPayload;
  username: UserPayload;
}

const UserSelectionButton: React.FC<UserSelectionButtonProps> = ({
  setSelectedUser,
  selectedUser,
  user,
}) => {
  return (
    <div className="flex flex-col p-1 shadow-xs">
      <Button
        className={cn(
          "text-md font-large hover:bg-accent hover:text-accent-foreground",
          selectedUser?.userId === user.userId &&
            "font-extrabold border-3 shadown-xs",
        )}
        variant="ghost"
        key={user.username}
        onClick={() => setSelectedUser(user)}
      >
        {user.username}
      </Button>
    </div>
  );
};

export default UserSelectionButton;

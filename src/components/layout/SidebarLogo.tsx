
import React from "react";

type SidebarLogoProps = {
  isCollapsed: boolean;
};

const SidebarLogo = ({ isCollapsed }: SidebarLogoProps) => {
  return (
    <div className="flex items-center justify-center h-16 p-4">
      {!isCollapsed ? (
        <div className="flex items-center">
          <img 
            src="/lovable-uploads/ae7ddc52-d3ed-478f-af96-603a69278f3b.png" 
            alt="Ticlin Logo" 
            className="h-8" 
          />
        </div>
      ) : (
        <img 
          src="/lovable-uploads/ae7ddc52-d3ed-478f-af96-603a69278f3b.png" 
          alt="Ticlin Logo" 
          className="h-8" 
        />
      )}
    </div>
  );
};

export default SidebarLogo;

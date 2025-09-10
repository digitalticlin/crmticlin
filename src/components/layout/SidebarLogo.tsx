
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
            src="/lovable-uploads/68c955d6-5aab-40d3-9018-c372a8f3faf6.png" 
            alt="Ticlin Logo" 
            className="h-8" 
          />
        </div>
      ) : (
        <img 
          src="/lovable-uploads/68c955d6-5aab-40d3-9018-c372a8f3faf6.png" 
          alt="Ticlin Logo" 
          className="h-8" 
        />
      )}
    </div>
  );
};

export default SidebarLogo;

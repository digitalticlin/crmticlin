
import { useState } from "react";
import { KanbanTag } from "@/types/kanban";

export function useTagManagement(initialTags: KanbanTag[]) {
  const [availableTags, setAvailableTags] = useState<KanbanTag[]>(initialTags);

  // Create a new tag
  const createTag = (name: string, color: string) => {
    const newTag: KanbanTag = {
      id: `tag-${Date.now()}`,
      name,
      color,
    };
    
    setAvailableTags([...availableTags, newTag]);
    
    return newTag;
  };

  return {
    availableTags,
    createTag
  };
}

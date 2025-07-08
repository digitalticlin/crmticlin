
import { useState } from "react";
import { useTagDatabase } from "./useTagDatabase";

export const useSimplifiedTagModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { tags, isLoading, createTag, updateTag, deleteTag } = useTagDatabase();

  const handleCreateTag = (name: string, color: string) => {
    createTag.mutate({ name, color });
  };

  const handleUpdateTag = (id: string, name: string, color: string) => {
    updateTag.mutate({ id, name, color });
  };

  const handleDeleteTag = (id: string) => {
    deleteTag.mutate(id);
  };

  return {
    isOpen,
    setIsOpen,
    tags,
    isLoading,
    handleCreateTag,
    handleUpdateTag,
    handleDeleteTag,
  };
};

import { useNavigate } from "react-router-dom";
import { buildWhatsAppChatUrl } from "@/utils/whatsappUrlBuilder";

export const useClientWhatsApp = () => {
  const navigate = useNavigate();

  const navigateToWhatsApp = (phone: string) => {
    const whatsappUrl = buildWhatsAppChatUrl(phone);
    navigate(whatsappUrl);
  };

  return {
    navigateToWhatsApp
  };
};
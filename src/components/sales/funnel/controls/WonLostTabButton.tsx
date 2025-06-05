
interface WonLostTabButtonProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const WonLostTabButton = ({ activeTab, setActiveTab }: WonLostTabButtonProps) => {
  return (
    <button
      onClick={() => setActiveTab("won-lost")}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
        activeTab === "won-lost"
          ? "bg-white/80 text-gray-900 shadow-md backdrop-blur-sm"
          : "text-gray-800 hover:text-gray-900 hover:bg-white/30"
      }`}
    >
      Ganhos e Perdidos
    </button>
  );
};

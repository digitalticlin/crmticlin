
import { Loader2, User, Building2, Shield, Camera, Save, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useProfileSettings } from "@/hooks/useProfileSettings";
import ProfileAvatar from "./ProfileAvatar";
import ProfileForm from "./ProfileForm";
import SecuritySection from "./SecuritySection";
import ProfileActions from "./ProfileActions";

const ProfileSettings = () => {
  const isMobile = useIsMobile();
  const {
    loading,
    saving,
    email,
    username,
    fullName,
    companyName,
    documentId,
    whatsapp,
    avatarUrl,
    setFullName,
    setCompanyName,
    setDocumentId,
    setWhatsapp,
    handleEmailChange,
    handleSaveChanges,
    handleChangePassword
  } = useProfileSettings();

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-[#D3D800]/30"></div>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#D3D800] animate-spin"></div>
          </div>
          <p className="text-sm text-white/70">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  const handleCancel = () => {
    window.location.reload();
  };

  return (
    <div className="space-y-8">
      {/* Avatar Section */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 animate-fade-in">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-gradient-to-r from-[#D3D800]/20 to-[#D3D800]/10 rounded-2xl">
            <Camera className="h-6 w-6 text-[#D3D800]" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Foto do Perfil</h3>
            <p className="text-white/70">Personalize sua foto de perfil</p>
          </div>
        </div>
        
        <ProfileAvatar 
          avatarUrl={avatarUrl} 
          fullName={fullName} 
        />
      </div>

      {/* Personal Information */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-gradient-to-r from-blue-500/20 to-blue-400/10 rounded-2xl">
            <User className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Informações Pessoais</h3>
            <p className="text-white/70">Gerencie seus dados pessoais e de contato</p>
          </div>
        </div>
        
        <ProfileForm
          email={email}
          username={username}
          fullName={fullName}
          companyName={companyName}
          documentId={documentId}
          whatsapp={whatsapp}
          handleEmailChange={handleEmailChange}
          setFullName={setFullName}
          setDocumentId={setDocumentId}
          setWhatsapp={setWhatsapp}
          setCompanyName={setCompanyName}
        />
      </div>

      {/* Company Information */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 animate-fade-in" style={{ animationDelay: "200ms" }}>
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-gradient-to-r from-purple-500/20 to-purple-400/10 rounded-2xl">
            <Building2 className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Informações da Empresa</h3>
            <p className="text-white/70">Dados da sua organização</p>
          </div>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/90 flex items-center">
              RAZÃO SOCIAL ou NOME
              <span className="ml-1 text-red-400">*</span>
            </label>
            <input 
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#D3D800]/50 focus:border-[#D3D800]/50 transition-all duration-200"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              placeholder="Nome da empresa"
            />
            <p className="text-xs text-white/60">
              Campo obrigatório para conexão de WhatsApp
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/90">CPF/CNPJ</label>
            <input 
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#D3D800]/50 focus:border-[#D3D800]/50 transition-all duration-200"
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
              placeholder="000.000.000-00"
            />
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 animate-fade-in" style={{ animationDelay: "300ms" }}>
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-gradient-to-r from-red-500/20 to-red-400/10 rounded-2xl">
            <Shield className="h-6 w-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Segurança da Conta</h3>
            <p className="text-white/70">Gerencie a segurança da sua conta</p>
          </div>
        </div>
        
        <SecuritySection 
          email={email}
          onChangePassword={handleChangePassword}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end animate-fade-in" style={{ animationDelay: "400ms" }}>
        <div className={cn(
          "flex gap-4",
          isMobile ? "flex-col w-full" : "flex-row"
        )}>
          <button
            onClick={handleCancel}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2"
          >
            <X className="h-4 w-4" />
            <span>Cancelar</span>
          </button>
          
          <button
            onClick={handleSaveChanges}
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-[#D3D800] to-[#D3D800]/80 hover:from-[#D3D800]/90 hover:to-[#D3D800]/70 text-black font-semibold rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Salvar Alterações</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;

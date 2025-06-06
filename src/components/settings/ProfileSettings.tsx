import { Loader2, User, Building2, Shield, Camera, Save, X, RefreshCw } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useProfileSettings } from "@/hooks/useProfileSettings";
import ProfileAvatar from "./ProfileAvatar";
import ProfileForm from "./ProfileForm";
import SecuritySection from "./SecuritySection";

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
    userRole,
    companyDocument,
    syncStatus,
    setFullName,
    setCompanyName,
    setDocumentId,
    setWhatsapp,
    setCompanyDocument,
    handleEmailChange,
    handleSaveChanges,
    handleResync,
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
          <p className="text-sm text-gray-700">Carregando perfil...</p>
          {syncStatus === 'syncing' && (
            <p className="text-xs text-gray-600">Sincronizando dados...</p>
          )}
        </div>
      </div>
    );
  }

  const handleCancel = () => {
    window.location.reload();
  };

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case "admin":
        return "Administrador";
      case "manager":
        return "Gestor";
      case "operational":
        return "Operacional";
      default:
        return "Não definido";
    }
  };

  const getSyncStatusColor = () => {
    switch (syncStatus) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'syncing':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getSyncStatusText = () => {
    switch (syncStatus) {
      case 'success':
        return 'Dados sincronizados';
      case 'error':
        return 'Erro na sincronização';
      case 'syncing':
        return 'Sincronizando...';
      default:
        return 'Aguardando';
    }
  };

  return (
    <div className="space-y-8">
      {/* Status de Sincronização */}
      <div className="bg-white/20 backdrop-blur-xl rounded-2xl border border-white/20 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={cn("w-3 h-3 rounded-full", {
            "bg-green-500": syncStatus === 'success',
            "bg-red-500": syncStatus === 'error',
            "bg-yellow-500": syncStatus === 'syncing',
            "bg-gray-400": syncStatus === 'idle'
          })} />
          <span className={cn("text-sm font-medium", getSyncStatusColor())}>
            {getSyncStatusText()}
          </span>
        </div>
        <button
          onClick={handleResync}
          disabled={syncStatus === 'syncing'}
          className="flex items-center space-x-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4 w-4", {
            "animate-spin": syncStatus === 'syncing'
          })} />
          <span className="text-sm">Re-sincronizar</span>
        </button>
      </div>

      {/* Informações da Conta */}
      {(companyName || userRole) && (
        <div className="bg-white/35 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-8 animate-fade-in" style={{ animationDelay: "50ms" }}>
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-gradient-to-r from-green-500/20 to-green-400/10 rounded-2xl">
              <Shield className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">Informações da Conta</h3>
              <p className="text-gray-700">Status da sua conta no sistema</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {companyName && (
              <div className="bg-white/20 rounded-2xl p-4 border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Building2 className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">Empresa Vinculada</p>
                    <p className="text-sm font-medium text-gray-800">{companyName}</p>
                  </div>
                </div>
              </div>
            )}

            {userRole && (
              <div className="bg-white/20 rounded-2xl p-4 border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Shield className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">Nível de Acesso</p>
                    <p className="text-sm font-medium text-gray-800">{getRoleLabel(userRole)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Avatar Section */}
      <div className="bg-white/35 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-8 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-gradient-to-r from-[#D3D800]/20 to-[#D3D800]/10 rounded-2xl">
            <Camera className="h-6 w-6 text-[#D3D800]" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Foto do Perfil</h3>
            <p className="text-gray-700">Personalize sua foto de perfil</p>
          </div>
        </div>
        
        <ProfileAvatar 
          avatarUrl={avatarUrl} 
          fullName={fullName} 
        />
      </div>

      {/* Personal Information */}
      <div className="bg-white/35 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-8 animate-fade-in" style={{ animationDelay: "200ms" }}>
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-gradient-to-r from-blue-500/20 to-blue-400/10 rounded-2xl">
            <User className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Informações Pessoais</h3>
            <p className="text-gray-700">Gerencie seus dados pessoais e de contato</p>
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
      <div className="bg-white/35 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-8 animate-fade-in" style={{ animationDelay: "300ms" }}>
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-gradient-to-r from-purple-500/20 to-purple-400/10 rounded-2xl">
            <Building2 className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Informações da Empresa</h3>
            <p className="text-gray-700">Dados da sua organização</p>
          </div>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-800 flex items-center">
              RAZÃO SOCIAL ou NOME
              <span className="ml-1 text-red-500">*</span>
            </label>
            <input 
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D3D800]/50 focus:border-[#D3D800]/50 transition-all duration-200"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              placeholder="Nome da empresa"
            />
            <p className="text-xs text-gray-600">
              Campo obrigatório para conexão de WhatsApp
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-800">CPF/CNPJ</label>
            <input 
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D3D800]/50 focus:border-[#D3D800]/50 transition-all duration-200"
              value={companyDocument}
              onChange={(e) => setCompanyDocument(e.target.value)}
              placeholder="000.000.000-00"
            />
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white/35 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-8 animate-fade-in" style={{ animationDelay: "400ms" }}>
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-gradient-to-r from-red-500/20 to-red-400/10 rounded-2xl">
            <Shield className="h-6 w-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Segurança da Conta</h3>
            <p className="text-gray-700">Gerencie a segurança da sua conta</p>
          </div>
        </div>
        
        <SecuritySection 
          email={email}
          onChangePassword={handleChangePassword}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end animate-fade-in" style={{ animationDelay: "500ms" }}>
        <div className={cn(
          "flex gap-4",
          isMobile ? "flex-col w-full" : "flex-row"
        )}>
          <button
            onClick={handleCancel}
            className="px-6 py-3 bg-white/20 hover:bg-white/30 border border-white/30 text-gray-800 rounded-xl transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-2"
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

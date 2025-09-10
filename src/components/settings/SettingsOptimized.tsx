/**
 * 🚀 SETTINGS OTIMIZADO E ISOLADO
 * 
 * ISOLAMENTO COMPLETO:
 * ✅ Componentes memoizados
 * ✅ Lazy loading inteligente
 * ✅ Tabs com loading isolado
 * ✅ Error boundaries isolados
 * ✅ Zero re-renders desnecessários
 */

import React, { memo, Suspense, useMemo, useCallback, useState } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useSettingsOptimized } from '@/hooks/settings/useSettingsOptimized';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Loader2, Settings, User, MessageSquare, Users, Shield, Save, Edit, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ✅ LAZY COMPONENTS - Isolados
const LazyProfileSection = React.lazy(() => import('./components/ProfileSectionOptimized'));
const LazyWhatsAppSection = React.lazy(() => import('./components/WhatsAppSectionOptimized'));
const LazyTeamSection = React.lazy(() => import('./components/TeamSectionOptimized'));

// ✅ LOADING SKELETON
const SettingsSkeleton = memo(() => (
  <div className="space-y-6">
    {/* Header Skeleton */}
    <div className="h-20 bg-gray-200 rounded-lg animate-pulse" />
    
    {/* Tabs Skeleton */}
    <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
    
    {/* Content Skeleton */}
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
      ))}
    </div>
  </div>
));

// ✅ STATS CARD ISOLADO
const StatsCard = memo(({ 
  title, 
  stats, 
  icon: Icon, 
  color 
}: {
  title: string;
  stats: { label: string; value: number | string }[];
  icon: React.ElementType;
  color: string;
}) => (
  <Card className={cn(
    "relative overflow-hidden transition-all duration-300 hover:shadow-lg",
    "bg-gradient-to-br", color
  )}>
    <CardContent className="p-4">
      <div className="flex items-center gap-3 mb-3">
        <Icon className="h-5 w-5 text-white" />
        <h3 className="font-medium text-white">{title}</h3>
      </div>
      
      <div className="space-y-2">
        {stats.map((stat, index) => (
          <div key={index} className="flex justify-between text-sm text-white/90">
            <span>{stat.label}:</span>
            <span className="font-semibold">{stat.value}</span>
          </div>
        ))}
      </div>
      
      {/* Efeito visual */}
      <div className="absolute top-0 right-0 w-12 h-12 bg-white/10 rounded-full -translate-y-6 translate-x-6" />
    </CardContent>
  </Card>
));

// ✅ HEADER COMPONENT - Isolado
const SettingsHeader = memo(({ 
  userRole,
  onRefresh,
  loading 
}: {
  userRole?: string;
  onRefresh: () => void;
  loading: boolean;
}) => (
  <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 lg:p-8 shadow-md">
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Configurações</h1>
        <p className="text-sm text-gray-800">
          Gerencie as configurações da sua conta e preferências do sistema
        </p>
        
        {/* Badge indicativo do papel */}
        <div className="mt-3">
          <Badge 
            className={cn(
              "text-xs font-medium",
              userRole === 'admin' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            )}
          >
            {userRole === 'admin' ? '👑 Administrador' : '🎯 Operacional'}
          </Badge>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="text-xs"
        >
          <Settings className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Atualizar
        </Button>
      </div>
    </div>
  </div>
));

// ✅ PROFILE EDIT BAR - Isolado
const ProfileEditBar = memo(({ 
  isEditing, 
  hasUnsavedChanges, 
  onStartEdit, 
  onSave, 
  onCancel, 
  isSaving 
}: {
  isEditing: boolean;
  hasUnsavedChanges: boolean;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}) => {
  if (!isEditing) {
    return (
      <div className="flex justify-end">
        <Button onClick={onStartEdit} variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Editar Perfil
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex-1">
        <p className="text-sm text-blue-800">
          {hasUnsavedChanges 
            ? 'Você tem alterações não salvas'
            : 'Modo de edição ativo'
          }
        </p>
      </div>
      
      <div className="flex gap-2">
        <Button 
          onClick={onCancel} 
          variant="ghost" 
          size="sm" 
          disabled={isSaving}
        >
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        
        <Button 
          onClick={onSave} 
          disabled={!hasUnsavedChanges || isSaving} 
          size="sm"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar
        </Button>
      </div>
    </div>
  );
});

// ✅ MAIN COMPONENT
export const SettingsOptimized = memo(() => {
  const { permissions, loading: permissionsLoading } = useUserPermissions();
  
  const {
    profileData,
    whatsappInstances,
    teamMembers,
    activeTab,
    isEditing,
    hasUnsavedChanges,
    loading,
    isUpdatingProfile,
    stats,
    updateActiveTab,
    startEditing,
    cancelEditing,
    saveProfileChanges,
    userRole,
    invalidateSettingsData
  } = useSettingsOptimized();

  // ✅ CALLBACKS MEMOIZADOS
  const handleRefresh = useCallback(() => {
    invalidateSettingsData();
  }, [invalidateSettingsData]);

  // ✅ MEMOIZAÇÃO - Dados das estatísticas
  const statsData = useMemo(() => [
    {
      title: 'Perfil',
      stats: [
        { label: 'Nome', value: profileData?.full_name || 'Não informado' },
        { label: 'E-mail', value: profileData?.email || 'Não informado' },
        { label: 'Função', value: profileData?.role || 'Usuário' }
      ],
      icon: User,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'WhatsApp',
      stats: [
        { label: 'Total', value: stats.whatsapp.total },
        { label: 'Conectadas', value: stats.whatsapp.connected },
        { label: 'Desconectadas', value: stats.whatsapp.disconnected }
      ],
      icon: MessageSquare,
      color: 'from-green-500 to-green-600'
    },
    ...(userRole === 'admin' ? [{
      title: 'Equipe',
      stats: [
        { label: 'Total', value: stats.team.total },
        { label: 'Admins', value: stats.team.admins },
        { label: 'Operacionais', value: stats.team.operational }
      ],
      icon: Users,
      color: 'from-purple-500 to-purple-600'
    }] : [])
  ], [profileData, stats, userRole]);

  // ✅ LOADING STATE
  if (permissionsLoading || (loading && !profileData)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando configurações...</span>
        </div>
      </div>
    );
  }

  // ✅ PERMISSION CHECK
  if (!permissions.allowedPages.includes('settings')) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Acesso Negado</h3>
          <p className="text-gray-600">Você não tem permissão para acessar as configurações.</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6 pb-8">
        {/* ✅ HEADER */}
        <SettingsHeader
          userRole={userRole}
          onRefresh={handleRefresh}
          loading={loading}
        />

        {/* ✅ STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statsData.map((stat, index) => (
            <StatsCard
              key={index}
              title={stat.title}
              stats={stat.stats}
              icon={stat.icon}
              color={stat.color}
            />
          ))}
        </div>

        {/* ✅ TABS SECTION */}
        <Tabs value={activeTab} onValueChange={updateActiveTab as any} className="w-full">
          {/* Menu de abas */}
          <div className="flex justify-center mb-6">
            <TabsList className={cn(
              "w-full max-w-2xl bg-white/80 backdrop-blur-sm border border-white/30",
              "text-sm sm:text-base grid",
              userRole === 'admin' ? 'grid-cols-3' : 'grid-cols-2'
            )}>
              <TabsTrigger 
                value="profile"
                className="flex items-center gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
              >
                <User className="h-4 w-4" />
                Perfil
              </TabsTrigger>
              
              <TabsTrigger 
                value="whatsapp" 
                className="flex items-center gap-2 data-[state=active]:bg-green-100 data-[state=active]:text-green-700"
              >
                <MessageSquare className="h-4 w-4" />
                WhatsApp
              </TabsTrigger>
              
              {userRole === 'admin' && (
                <TabsTrigger 
                  value="team"
                  className="flex items-center gap-2 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
                >
                  <Users className="h-4 w-4" />
                  Equipe
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* ✅ PROFILE TAB */}
          <TabsContent value="profile" className="space-y-6">
            <ProfileEditBar
              isEditing={isEditing}
              hasUnsavedChanges={hasUnsavedChanges}
              onStartEdit={startEditing}
              onSave={saveProfileChanges}
              onCancel={cancelEditing}
              isSaving={isUpdatingProfile}
            />
            
            <Suspense fallback={<SettingsSkeleton />}>
              <LazyProfileSection
                profileData={profileData}
                isEditing={isEditing}
                loading={loading}
              />
            </Suspense>
          </TabsContent>

          {/* ✅ WHATSAPP TAB */}
          <TabsContent value="whatsapp" className="space-y-6">
            <Suspense fallback={<SettingsSkeleton />}>
              <LazyWhatsAppSection
                instances={whatsappInstances || []}
                loading={loading}
                stats={stats.whatsapp}
              />
            </Suspense>
          </TabsContent>

          {/* ✅ TEAM TAB (só para admin) */}
          {userRole === 'admin' && (
            <TabsContent value="team" className="space-y-6">
              <Suspense fallback={<SettingsSkeleton />}>
                <LazyTeamSection
                  teamMembers={teamMembers || []}
                  loading={loading}
                  stats={stats.team}
                />
              </Suspense>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </ErrorBoundary>
  );
});

SettingsOptimized.displayName = 'SettingsOptimized';
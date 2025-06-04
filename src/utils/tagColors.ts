
// Função para converter cores de background para o novo padrão de bordas sólidas + preenchimento com opacidade
export const getTagStyleClasses = (bgColor: string) => {
  const colorMap: { [key: string]: string } = {
    'bg-blue-400': 'border-2 border-blue-500 bg-blue-500/20 text-blue-800',
    'bg-red-400': 'border-2 border-red-500 bg-red-500/20 text-red-800',
    'bg-purple-400': 'border-2 border-purple-500 bg-purple-500/20 text-purple-800',
    'bg-green-400': 'border-2 border-green-500 bg-green-500/20 text-green-800',
    'bg-amber-400': 'border-2 border-amber-500 bg-amber-500/20 text-amber-800',
    'bg-yellow-400': 'border-2 border-yellow-500 bg-yellow-500/20 text-yellow-800',
    'bg-emerald-400': 'border-2 border-emerald-500 bg-emerald-500/20 text-emerald-800',
    'bg-orange-400': 'border-2 border-orange-500 bg-orange-500/20 text-orange-800',
    'bg-pink-400': 'border-2 border-pink-500 bg-pink-500/20 text-pink-800',
    'bg-indigo-400': 'border-2 border-indigo-500 bg-indigo-500/20 text-indigo-800',
    'bg-teal-400': 'border-2 border-teal-500 bg-teal-500/20 text-teal-800',
    'bg-cyan-400': 'border-2 border-cyan-500 bg-cyan-500/20 text-cyan-800',
    'bg-slate-400': 'border-2 border-slate-500 bg-slate-500/20 text-slate-800',
    'bg-violet-400': 'border-2 border-violet-500 bg-violet-500/20 text-violet-800',
    'bg-rose-400': 'border-2 border-rose-500 bg-rose-500/20 text-rose-800',
    'bg-lime-400': 'border-2 border-lime-500 bg-lime-500/20 text-lime-800',
    'bg-sky-400': 'border-2 border-sky-500 bg-sky-500/20 text-sky-800',
    'bg-stone-400': 'border-2 border-stone-500 bg-stone-500/20 text-stone-800',
    'bg-emerald-500': 'border-2 border-emerald-600 bg-emerald-600/20 text-emerald-800',
    'bg-gray-400': 'border-2 border-gray-500 bg-gray-500/20 text-gray-800'
  };

  return colorMap[bgColor] || 'border-2 border-gray-500 bg-gray-500/20 text-gray-800';
};

// Função para obter apenas a cor sólida da bolinha para etapas do funil
export const getFunnelStageColor = (bgColor: string) => {
  const colorMap: { [key: string]: string } = {
    'bg-blue-400': 'bg-blue-500',
    'bg-red-400': 'bg-red-500',
    'bg-purple-400': 'bg-purple-500',
    'bg-green-400': 'bg-green-500',
    'bg-amber-400': 'bg-amber-500',
    'bg-yellow-400': 'bg-yellow-500',
    'bg-emerald-400': 'bg-emerald-500',
    'bg-orange-400': 'bg-orange-500',
    'bg-pink-400': 'bg-pink-500',
    'bg-indigo-400': 'bg-indigo-500',
    'bg-teal-400': 'bg-teal-500',
    'bg-cyan-400': 'bg-cyan-500',
    'bg-slate-400': 'bg-slate-500',
    'bg-violet-400': 'bg-violet-500',
    'bg-rose-400': 'bg-rose-500',
    'bg-lime-400': 'bg-lime-500',
    'bg-sky-400': 'bg-sky-500',
    'bg-stone-400': 'bg-stone-500',
    'bg-emerald-500': 'bg-emerald-600',
    'bg-gray-400': 'bg-gray-500'
  };

  return colorMap[bgColor] || 'bg-gray-500';
};

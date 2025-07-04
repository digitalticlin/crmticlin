// Função para converter cores de background para o novo padrão de bordas sólidas + preenchimento com opacidade
export const getTagStyleClasses = (bgColor: string) => {
  const colorMap: { [key: string]: string } = {
    'bg-blue-400': 'border-2 border-blue-500 bg-blue-500/50 text-white',
    'bg-red-400': 'border-2 border-red-500 bg-red-500/50 text-white',
    'bg-purple-400': 'border-2 border-purple-500 bg-purple-500/50 text-white',
    'bg-green-400': 'border-2 border-green-500 bg-green-500/50 text-white',
    'bg-amber-400': 'border-2 border-amber-500 bg-amber-500/50 text-white',
    'bg-yellow-400': 'border-2 border-yellow-500 bg-yellow-500/50 text-white',
    'bg-emerald-400': 'border-2 border-emerald-500 bg-emerald-500/50 text-white',
    'bg-orange-400': 'border-2 border-orange-500 bg-orange-500/50 text-white',
    'bg-pink-400': 'border-2 border-pink-500 bg-pink-500/50 text-white',
    'bg-indigo-400': 'border-2 border-indigo-500 bg-indigo-500/50 text-white',
    'bg-teal-400': 'border-2 border-teal-500 bg-teal-500/50 text-white',
    'bg-cyan-400': 'border-2 border-cyan-500 bg-cyan-500/50 text-white',
    'bg-slate-400': 'border-2 border-slate-500 bg-slate-500/50 text-white',
    'bg-violet-400': 'border-2 border-violet-500 bg-violet-500/50 text-white',
    'bg-rose-400': 'border-2 border-rose-500 bg-rose-500/50 text-white',
    'bg-lime-400': 'border-2 border-lime-500 bg-lime-500/50 text-white',
    'bg-sky-400': 'border-2 border-sky-500 bg-sky-500/50 text-white',
    'bg-stone-400': 'border-2 border-stone-500 bg-stone-500/50 text-white',
    'bg-emerald-500': 'border-2 border-emerald-600 bg-emerald-600/50 text-white',
    'bg-gray-400': 'border-2 border-gray-500 bg-gray-500/50 text-white'
  };

  return colorMap[bgColor] || 'border-2 border-gray-500 bg-gray-500/50 text-white';
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

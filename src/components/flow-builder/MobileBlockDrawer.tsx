import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  Blocks,
  MousePointer2,
  Hand,
  Crown,
  MessageCircleQuestion,
  MessageSquare,
  FileText,
  LinkIcon,
  Image,
  GraduationCap,
  GitBranch,
  Search,
  RotateCcw,
  UserCog,
  Target,
  CheckCircle,
  RefreshCw,
  Calendar,
  CalendarClock,
  Images,
  Globe,
  Package,
  Wand2,
  Play
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

interface MobileBlockDrawerProps {
  onAddNode: (type: string) => void;
  blockTypes: any[];
  premiumBlocks: any[];
  specialBlock: any;
}

export const MobileBlockDrawer = ({ onAddNode, blockTypes, premiumBlocks, specialBlock }: MobileBlockDrawerProps) => {
  const [open, setOpen] = useState(false);

  const handleAddNode = (type: string) => {
    onAddNode(type);
    setOpen(false); // Fecha o drawer após adicionar
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-2xl"
        >
          <Blocks className="h-6 w-6 text-white" />
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="h-[85vh] bg-white/95 backdrop-blur-xl border-t-2 border-white/30 rounded-t-3xl p-0">
        <SheetHeader className="border-b border-white/20 px-4 py-3">
          <div className="flex items-center justify-center gap-2 mb-1">
            <MousePointer2 className="h-5 w-5 text-purple-500" />
            <Hand className="h-5 w-5 text-purple-500" />
          </div>
          <SheetTitle className="text-center text-gray-800">
            Blocos do Fluxo
          </SheetTitle>
          <p className="text-xs text-center text-gray-500">Toque para adicionar ao canvas</p>
        </SheetHeader>

        <div className="overflow-y-auto h-[calc(85vh-80px)] p-4 space-y-4">
          {/* Início */}
          <div>
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Início</h3>
            </div>
            <Button
              variant="outline"
              size="lg"
              className="w-full justify-start gap-3 text-sm h-12 px-3 glass hover:bg-white/60 border-white/40 transition-all active:scale-95"
              onClick={() => handleAddNode(specialBlock.type)}
            >
              <div className={`p-2 rounded-lg ${specialBlock.color} text-white flex-shrink-0 shadow-md`}>
                <Play className="h-5 w-5" />
              </div>
              <span className="font-medium">{specialBlock.label}</span>
            </Button>
          </div>

          {/* Comunicação */}
          <div>
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Comunicação</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {blockTypes.filter(b => b.category === 'Comunicação').map((block) => (
                <Button
                  key={block.type}
                  variant="outline"
                  size="lg"
                  className="justify-start gap-2 text-xs h-12 px-2 glass hover:bg-white/60 border-white/40 transition-all active:scale-95"
                  onClick={() => handleAddNode(block.type)}
                >
                  <div className={`p-1.5 rounded-md ${block.color} text-white flex-shrink-0 shadow-sm`}>
                    {block.icon}
                  </div>
                  <span className="truncate font-medium text-left flex-1">{block.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Lógica */}
          <div>
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Lógica</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {blockTypes.filter(b => b.category === 'Lógica').map((block) => (
                <Button
                  key={block.type}
                  variant="outline"
                  size="lg"
                  className="justify-start gap-2 text-xs h-12 px-2 glass hover:bg-white/60 border-white/40 transition-all active:scale-95"
                  onClick={() => handleAddNode(block.type)}
                >
                  <div className={`p-1.5 rounded-md ${block.color} text-white flex-shrink-0 shadow-sm`}>
                    {block.icon}
                  </div>
                  <span className="truncate font-medium text-left flex-1">{block.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* CRM */}
          <div>
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
              <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">CRM</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {blockTypes.filter(b => b.category === 'CRM').map((block) => (
                <Button
                  key={block.type}
                  variant="outline"
                  size="lg"
                  className="justify-start gap-2 text-xs h-12 px-2 glass hover:bg-white/60 border-white/40 transition-all active:scale-95"
                  onClick={() => handleAddNode(block.type)}
                >
                  <div className={`p-1.5 rounded-md ${block.color} text-white flex-shrink-0 shadow-sm`}>
                    {block.icon}
                  </div>
                  <span className="truncate font-medium text-left flex-1">{block.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Controle */}
          <div>
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="w-2 h-2 rounded-full bg-gray-500"></div>
              <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Controle</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {blockTypes.filter(b => b.category === 'Controle').map((block) => (
                <Button
                  key={block.type}
                  variant="outline"
                  size="lg"
                  className="justify-start gap-2 text-xs h-12 px-2 glass hover:bg-white/60 border-white/40 transition-all active:scale-95"
                  onClick={() => handleAddNode(block.type)}
                >
                  <div className={`p-1.5 rounded-md ${block.color} text-white flex-shrink-0 shadow-sm`}>
                    {block.icon}
                  </div>
                  <span className="truncate font-medium text-left flex-1">{block.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Premium */}
          <div className="pt-2 border-t border-white/30">
            <div className="flex items-center gap-2 mb-2 px-1">
              <Crown className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Premium</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {premiumBlocks.map((block) => (
                <Button
                  key={block.type}
                  variant="outline"
                  size="lg"
                  disabled
                  className="justify-start gap-2 text-xs h-12 px-2 glass border-white/40 opacity-60 cursor-not-allowed relative"
                  onClick={() => {
                    alert('🔒 Recurso Premium\n\nEste bloco está disponível apenas no plano Premium.\n\nEntre em contato com nossa equipe comercial para liberar este e outros recursos exclusivos!');
                  }}
                >
                  <div className={`p-1.5 rounded-md ${block.color} text-white flex-shrink-0 shadow-sm`}>
                    {block.icon}
                  </div>
                  <span className="truncate font-medium text-left flex-1">{block.label}</span>
                  <Crown className="w-3 h-3 text-amber-500 flex-shrink-0" />
                </Button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

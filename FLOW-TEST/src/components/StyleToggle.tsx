import { Sparkles, Box } from 'lucide-react';
import { Button } from './ui/button';

interface StyleToggleProps {
  currentStyle: 'glass' | 'neu';
  onStyleChange: (style: 'glass' | 'neu') => void;
}

export const StyleToggle = ({ currentStyle, onStyleChange }: StyleToggleProps) => {
  return (
    <div className={`${currentStyle === 'glass' ? 'glass' : 'neu'} rounded-2xl p-1 flex gap-1`}>
      <Button
        variant={currentStyle === 'glass' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onStyleChange('glass')}
        className={`
          transition-smooth
          ${currentStyle === 'glass' 
            ? 'gradient-primary text-white' 
            : 'hover:bg-white/10'
          }
        `}
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Glassmorphism
      </Button>
      <Button
        variant={currentStyle === 'neu' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onStyleChange('neu')}
        className={`
          transition-smooth
          ${currentStyle === 'neu' 
            ? 'gradient-primary text-white' 
            : 'hover:bg-white/10'
          }
        `}
      >
        <Box className="w-4 h-4 mr-2" />
        Neumorphism
      </Button>
    </div>
  );
};

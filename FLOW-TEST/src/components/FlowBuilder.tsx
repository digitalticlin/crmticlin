import { useCallback, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Connection,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { FlowToolbar } from './FlowToolbar';
import { CustomNode } from './nodes/CustomNode';
import { StyleToggle } from './StyleToggle';

const nodeTypes = {
  custom: CustomNode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'custom',
    data: { 
      label: 'Início', 
      type: 'start',
      description: 'Ponto inicial do fluxo do agente',
      designStyle: 'glass',
    },
    position: { x: 100, y: 250 },
  },
];

const initialEdges: Edge[] = [];

export const FlowBuilder = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeIdCounter, setNodeIdCounter] = useState(2);
  const [designStyle, setDesignStyle] = useState<'glass' | 'neu'>('glass');

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = useCallback(
    (type: 'start' | 'action' | 'decision' | 'end') => {
      const newNode: Node = {
        id: `${nodeIdCounter}`,
        type: 'custom',
        data: { 
          label: type.charAt(0).toUpperCase() + type.slice(1),
          type,
          designStyle,
        },
        position: {
          x: Math.random() * 400 + 100,
          y: Math.random() * 300 + 100,
        },
      };
      setNodes((nds) => nds.concat(newNode));
      setNodeIdCounter((id) => id + 1);
    },
    [nodeIdCounter, setNodes, designStyle]
  );

  // Update existing nodes when design style changes
  const handleStyleChange = (style: 'glass' | 'neu') => {
    setDesignStyle(style);
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: { ...node.data, designStyle: style },
      }))
    );
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gradient-canvas">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            AI Flow Builder
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Construa o fluxo do seu agente de IA
          </p>
        </div>
        <StyleToggle currentStyle={designStyle} onStyleChange={handleStyleChange} />
      </div>

      <FlowToolbar onAddNode={addNode} designStyle={designStyle} />

      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="transition-smooth"
        >
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={20} 
            size={1}
            color={designStyle === 'glass' ? '#a78bfa' : '#94a3b8'}
          />
          <Controls className={designStyle === 'glass' ? 'glass' : 'neu'} />
          <MiniMap 
            className={designStyle === 'glass' ? 'glass' : 'neu'}
            nodeColor={(node) => {
              switch (node.data.type) {
                case 'start':
                  return '#10b981';
                case 'action':
                  return '#8b5cf6';
                case 'decision':
                  return '#f59e0b';
                case 'end':
                  return '#ef4444';
                default:
                  return '#8b5cf6';
              }
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
};

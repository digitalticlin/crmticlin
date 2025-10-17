import { FC } from 'react';
import { EdgeProps, getBezierPath, BaseEdge } from 'reactflow';
import { Trash2 } from 'lucide-react';

const DeleteButtonEdge: FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onEdgeClick = (evt: React.MouseEvent, edgeId: string) => {
    evt.stopPropagation();
    if (data?.onDelete) {
      data.onDelete(edgeId);
    }
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <g className="edge-delete-button-group">
        <foreignObject
          width={28}
          height={28}
          x={labelX - 14}
          y={labelY - 14}
          className="edgebutton-foreignobject"
          requiredExtensions="http://www.w3.org/1999/xhtml"
        >
          <button
            className="w-full h-full bg-white/95 backdrop-blur-sm hover:bg-red-50 text-red-500 hover:text-red-600 rounded-md flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 border border-red-200/50 opacity-0 hover:opacity-100"
            onClick={(event) => onEdgeClick(event, id)}
            title="Deletar conexão"
            style={{
              transition: 'all 0.2s ease-in-out'
            }}
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </foreignObject>
      </g>
      <style>{`
        .react-flow__edge:hover .edge-delete-button-group button {
          opacity: 1 !important;
        }
      `}</style>
    </>
  );
};

export default DeleteButtonEdge;

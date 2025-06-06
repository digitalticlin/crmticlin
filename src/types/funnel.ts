
export interface Funnel {
  id: string;
  created_by_user_id: string;
  name: string;
  description?: string;
  created_at?: string;
}

export interface KanbanStage {
  id: string;
  title: string;
  color?: string;
  is_fixed?: boolean;
  is_won?: boolean;
  is_lost?: boolean;
  order_position: number;
  funnel_id: string;
  created_by_user_id: string;
}

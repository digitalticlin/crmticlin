
import { 
  Table, TableHeader, TableRow, TableHead, 
  TableBody, TableCell
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ChevronDown, UserCog, UserX } from "lucide-react";
import UserStatusBadge from "./UserStatusBadge";

interface User {
  id: string;
  name: string;
  email: string;
  company: string;
  companyId: string;
  role: string;
  lastLogin: string;
  status: string;
}

interface UsersTableProps {
  users: User[];
}

const UsersTable = ({ users }: UsersTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              Nome <ArrowUpDown className="ml-1 h-4 w-4 inline-block" />
            </TableHead>
            <TableHead>Email</TableHead>
            <TableHead>
              Empresa <ChevronDown className="ml-1 h-4 w-4 inline-block" />
            </TableHead>
            <TableHead>Função</TableHead>
            <TableHead>Último Login</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.company}</TableCell>
              <TableCell>
                <Badge variant="secondary">{user.role}</Badge>
              </TableCell>
              <TableCell>{user.lastLogin}</TableCell>
              <TableCell><UserStatusBadge status={user.status} /></TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" className="text-amber-500">
                    <UserCog className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-red-500">
                    <UserX className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UsersTable;

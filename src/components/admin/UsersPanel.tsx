
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import UsersPanelHeader from "./users/UsersPanelHeader";
import UsersSearch from "./users/UsersSearch";
import UsersTable from "./users/UsersTable";
import UsersFooter from "./users/UsersFooter";
import { companies, mockUsers } from "./users/usersData";

export default function UsersPanel() {
  const [users] = useState(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCompany = companyFilter === 'all' || user.companyId === companyFilter;
    
    return matchesSearch && matchesCompany;
  });
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <UsersPanelHeader 
            title="Usuários do Sistema" 
            description="Gerencie todos os usuários cadastrados na plataforma"
          />
          <UsersSearch
            searchTerm={searchTerm}
            companyFilter={companyFilter}
            onSearchChange={setSearchTerm}
            onCompanyFilterChange={setCompanyFilter}
            companies={companies}
          />
        </CardHeader>
        <CardContent>
          <UsersTable users={filteredUsers} />
        </CardContent>
        <UsersFooter 
          filteredCount={filteredUsers.length}
          totalCount={users.length} 
        />
      </Card>
    </div>
  );
}

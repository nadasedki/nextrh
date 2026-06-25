import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Eye, Award, Loader2, Users ,Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// 1. UPDATED: Interface matches the exact JSON structure provided in Postman
interface ApiEmployee {
  user_id: number;
  full_name: string;
  title: string | null;
  years_of_experience: number;
  score: number;
  userSkills: { skill: { skill_name: string } }[];
  certifications: { certName: string; status: string }[];
}

const EmployeeDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  // 2. State management
  const [allEmployees, setAllEmployees] = useState<ApiEmployee[]>([]);
  const [displayedEmployees, setDisplayedEmployees] = useState<ApiEmployee[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 3. Fetch ALL data from backend ONCE on load
  useEffect(() => {
    if (!token) return;

    setLoading(true);
    setError(null);
    
    // Call the endpoint to get all employees
    const url = `http://localhost:3000/employees`;

    fetch(url, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    })
      .then(res => {
        if (!res.ok) throw new Error(`Error: ${res.status}`);
        return res.json();
      })
      .then(data => {
        const employeesArray = Array.isArray(data) ? data : [];
        setAllEmployees(employeesArray);
        setDisplayedEmployees(employeesArray); // Initially show all
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load employees. Please check your connection.');
        setLoading(false);
      });
  }, [token]);

  // 4. FRONTEND SEARCH LOGIC: Filter employees locally when query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setDisplayedEmployees(allEmployees);
    } else {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const filtered = allEmployees.filter(emp => {
        // Search in Name
        const nameMatch = emp.full_name.toLowerCase().includes(lowerCaseQuery);
        // Search in Title (with null check)
        const titleMatch = emp.title?.toLowerCase().includes(lowerCaseQuery);
        // Search in Skills (mapping the nested structure)
        const skillMatch = emp.userSkills.some(us => 
          us.skill.skill_name.toLowerCase().includes(lowerCaseQuery)
        );

        return nameMatch || titleMatch || skillMatch;
      });
      setDisplayedEmployees(filtered);
    }
  }, [searchQuery, allEmployees]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Employee Directory</h1>
        <p className="text-muted-foreground">Search and filter employees for bids</p>
      </div>
      
      <Card>
        <CardContent className="py-4">
          <div className="relative max-w-lg">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search by name, skill, or title..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10" 
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="text-center py-10 text-destructive">
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {!loading && !error && displayedEmployees.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No employees found matching your search.</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* 5. Map over displayedEmployees (filtered list) */}
        {displayedEmployees.map((emp) => (
          <Card key={emp.user_id} className="relative overflow-hidden hover:shadow-md transition-shadow">
            {/* Badge de Score en haut à droite */}
    <div className="absolute top-0 right-0 bg-primary/10 px-3 py-1.5 rounded-bl-xl flex items-center gap-1.5 border-l border-b border-primary/20 shadow-sm">
      <Trophy className="h-3.5 w-3.5 text-primary" />
      <span className="text-sm font-bold text-primary">{emp.score || 0}</span>
    </div>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {emp.full_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{emp.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{emp.title || 'No Title'}</p>
                  <p className="text-xs text-muted-foreground">{emp.years_of_experience} years exp.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-3 text-sm">
                <Award className="h-4 w-4 text-amber-500" />
                <span>
                  {emp.certifications.filter(c => c.status === 'active').length} active certs
                </span>
              </div>
              
              {/* Skills Mapping: Accessing nested skill_name */}
              <div className="flex flex-wrap gap-1 mt-3 h-12 overflow-hidden">
                {emp.userSkills.slice(0, 4).map((us) => (
                  <Badge key={us.skill.skill_name} variant="secondary" className="text-xs">
                    {us.skill.skill_name}
                  </Badge>
                ))}
                {emp.userSkills.length > 4 && (
                  <Badge variant="outline" className="text-xs">+{emp.userSkills.length - 4}</Badge>
                )}
              </div>
              
              {/* Navigation: Using user_id */}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-4" 
                onClick={() => navigate(`/bid/employee/${emp.user_id}`)}
              >
                <Eye className="h-4 w-4 mr-1" />View Profile
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default EmployeeDirectoryPage;
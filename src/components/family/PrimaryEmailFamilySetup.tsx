import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Mail, Users, Shield } from 'lucide-react';
import { usePrimaryEmailAuth } from '@/hooks/usePrimaryEmailAuth';

interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  role: 'co_parent' | 'child' | 'guardian';
  aliasEmail: string;
  birthDate?: string;
}

export const PrimaryEmailFamilySetup: React.FC = () => {
  const [step, setStep] = useState(1);
  const [primaryEmail, setPrimaryEmail] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [primaryParent, setPrimaryParent] = useState({
    firstName: '',
    lastName: '',
    password: '',
  });
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [newMember, setNewMember] = useState<Omit<FamilyMember, 'id'>>({
    firstName: '',
    lastName: '',
    role: 'child',
    aliasEmail: '',
    birthDate: '',
  });

  const { loading, createFamilyWithPrimaryEmail, addFamilyMemberWithAlias } = usePrimaryEmailAuth();

  const generateAliasEmail = (firstName: string, lastName: string) => {
    const domain = primaryEmail.split('@')[1];
    if (!domain) return '';
    
    const prefix = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
    return `${prefix}@${domain}`;
  };

  const addFamilyMember = () => {
    if (!newMember.firstName || !newMember.lastName) return;

    const aliasEmail = newMember.aliasEmail || generateAliasEmail(newMember.firstName, newMember.lastName);
    
    setFamilyMembers([
      ...familyMembers,
      {
        ...newMember,
        id: Date.now().toString(),
        aliasEmail,
      },
    ]);

    setNewMember({
      firstName: '',
      lastName: '',
      role: 'child',
      aliasEmail: '',
      birthDate: '',
    });
  };

  const removeFamilyMember = (id: string) => {
    setFamilyMembers(familyMembers.filter(member => member.id !== id));
  };

  const handleCreateFamily = async () => {
    // Step 1: Create primary family
    const result = await createFamilyWithPrimaryEmail(
      primaryEmail,
      familyName,
      primaryParent
    );

    if (!result.success) return;

    // Step 2: Add family members
    for (const member of familyMembers) {
      await addFamilyMemberWithAlias(
        result.family!.id,
        {
          firstName: member.firstName,
          lastName: member.lastName,
          role: member.role,
          birthDate: member.birthDate,
        },
        member.aliasEmail,
        primaryEmail
      );
    }

    setStep(4); // Success step
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Primary Email Setup
              </CardTitle>
              <CardDescription>
                Set up your family's primary email designator. All family members will be linked to this email.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="primaryEmail">Primary Family Email</Label>
                <Input
                  id="primaryEmail"
                  type="email"
                  value={primaryEmail}
                  onChange={(e) => setPrimaryEmail(e.target.value)}
                  placeholder="family@example.com"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  This will be the main email for your family account
                </p>
              </div>
              
              <div>
                <Label htmlFor="familyName">Family Name</Label>
                <Input
                  id="familyName"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="The Smith Family"
                />
              </div>

              <Button 
                onClick={() => setStep(2)} 
                disabled={!primaryEmail || !familyName}
                className="w-full"
              >
                Next: Primary Parent Details
              </Button>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Primary Parent Account
              </CardTitle>
              <CardDescription>
                Create the account for the primary parent who will manage the family.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={primaryParent.firstName}
                    onChange={(e) => setPrimaryParent({ ...primaryParent, firstName: e.target.value })}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={primaryParent.lastName}
                    onChange={(e) => setPrimaryParent({ ...primaryParent, lastName: e.target.value })}
                    placeholder="Smith"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={primaryParent.password}
                  onChange={(e) => setPrimaryParent({ ...primaryParent, password: e.target.value })}
                  placeholder="Create a strong password"
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button 
                  onClick={() => setStep(3)} 
                  disabled={!primaryParent.firstName || !primaryParent.lastName || !primaryParent.password}
                  className="flex-1"
                >
                  Next: Add Family Members
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Add Family Members
                </CardTitle>
                <CardDescription>
                  Add other parents, guardians, and children to your family. Each will get their own email alias.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="memberFirstName">First Name</Label>
                    <Input
                      id="memberFirstName"
                      value={newMember.firstName}
                      onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })}
                      placeholder="Jane"
                    />
                  </div>
                  <div>
                    <Label htmlFor="memberLastName">Last Name</Label>
                    <Input
                      id="memberLastName"
                      value={newMember.lastName}
                      onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })}
                      placeholder="Smith"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="memberRole">Role</Label>
                  <Select 
                    value={newMember.role} 
                    onValueChange={(value: 'co_parent' | 'child' | 'guardian') => 
                      setNewMember({ ...newMember, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="co_parent">Co-Parent</SelectItem>
                      <SelectItem value="child">Child</SelectItem>
                      <SelectItem value="guardian">Guardian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newMember.role === 'child' && (
                  <div>
                    <Label htmlFor="birthDate">Birth Date</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={newMember.birthDate}
                      onChange={(e) => setNewMember({ ...newMember, birthDate: e.target.value })}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="aliasEmail">Email Alias</Label>
                  <Input
                    id="aliasEmail"
                    type="email"
                    value={newMember.aliasEmail}
                    onChange={(e) => setNewMember({ ...newMember, aliasEmail: e.target.value })}
                    placeholder={generateAliasEmail(newMember.firstName, newMember.lastName)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Auto-generated based on name. You can customize this.
                  </p>
                </div>

                <Button onClick={addFamilyMember} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Family Member
                </Button>
              </CardContent>
            </Card>

            {familyMembers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Family Members ({familyMembers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {familyMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <div className="font-medium">
                            {member.firstName} {member.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {member.aliasEmail}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{member.role}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFamilyMember(member.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button 
                onClick={handleCreateFamily} 
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Creating Family...' : 'Create Family'}
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Family Created Successfully!</CardTitle>
              <CardDescription>
                Your family has been set up with the Primary Email Designator system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Family:</strong> {familyName}</p>
                <p><strong>Primary Email:</strong> {primaryEmail}</p>
                <p><strong>Members:</strong> {familyMembers.length + 1} total</p>
              </div>
              <Button className="w-full mt-4" onClick={() => window.location.reload()}>
                Continue to Dashboard
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">Family Setup</h1>
          <Badge variant="outline">Step {step} of 4</Badge>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {renderStep()}
    </div>
  );
};
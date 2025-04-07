import { useEffect, useRef, useState } from "react";
import { FamilyMember, Relationship } from "@shared/schema";
import { 
  Card,
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface GenerationalTimelineProps {
  familyMembers: FamilyMember[];
  relationships: Relationship[];
  onSelectMember: (member: FamilyMember) => void;
}

interface GenerationGroup {
  generation: number;
  members: FamilyMember[];
}

// Calculate approximate birth year from birth_date if available
function getBirthYear(member: FamilyMember): number | null {
  if (!member.birth_date) return null;
  
  try {
    const date = new Date(member.birth_date);
    return date.getFullYear();
  } catch (e) {
    return null;
  }
}

const GenerationalTimeline: React.FC<GenerationalTimelineProps> = ({
  familyMembers,
  relationships,
  onSelectMember
}) => {
  const [generations, setGenerations] = useState<GenerationGroup[]>([]);
  const [currentGenerationIndex, setCurrentGenerationIndex] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Calculate generations based on relationships
  useEffect(() => {
    if (familyMembers.length === 0 || relationships.length === 0) return;

    // Build relationship map
    const parentChildMap = new Map<number, number[]>();
    const childParentMap = new Map<number, number[]>();
    
    relationships.forEach(rel => {
      if (rel.relationship_type === 'biological' || rel.relationship_type === 'adoptive') {
        // Parent -> Child relationship
        const parentId = rel.source_id;
        const childId = rel.target_id;
        
        // Add to parent->children map
        if (!parentChildMap.has(parentId)) {
          parentChildMap.set(parentId, []);
        }
        parentChildMap.get(parentId)!.push(childId);
        
        // Add to child->parents map
        if (!childParentMap.has(childId)) {
          childParentMap.set(childId, []);
        }
        childParentMap.get(childId)!.push(parentId);
      }
    });
    
    // Find members with no parents (roots)
    const rootMembers = familyMembers.filter(member => 
      !childParentMap.has(member.id) || childParentMap.get(member.id)!.length === 0
    );
    
    // Assign generations starting from roots (generation 0)
    const memberGenerations = new Map<number, number>();
    
    function assignGeneration(memberId: number, generation: number) {
      // If member already has a generation assigned, take the minimum
      if (memberGenerations.has(memberId)) {
        memberGenerations.set(memberId, Math.min(memberGenerations.get(memberId)!, generation));
      } else {
        memberGenerations.set(memberId, generation);
      }
      
      // Assign to children (next generation)
      const children = parentChildMap.get(memberId) || [];
      children.forEach(childId => {
        assignGeneration(childId, generation + 1);
      });
    }
    
    // Start with roots at generation 0
    rootMembers.forEach(member => {
      assignGeneration(member.id, 0);
    });
    
    // Handle members not connected to the main tree
    familyMembers.forEach(member => {
      if (!memberGenerations.has(member.id)) {
        // Try to use birth year if available to make a good guess
        const birthYear = getBirthYear(member);
        
        if (birthYear) {
          // Find where this might fit based on birth year
          const placedMembers = familyMembers.filter(m => 
            memberGenerations.has(m.id) && getBirthYear(m) !== null
          );
          
          if (placedMembers.length > 0) {
            // Find the generation with people of similar birth years
            const birthYearGroups = placedMembers.map(m => ({
              generation: memberGenerations.get(m.id)!,
              birthYear: getBirthYear(m)!
            }));
            
            // Find closest birth year
            let closestGeneration = 0;
            let smallestDiff = Number.MAX_SAFE_INTEGER;
            
            birthYearGroups.forEach(group => {
              const diff = Math.abs(group.birthYear - birthYear);
              if (diff < smallestDiff) {
                smallestDiff = diff;
                closestGeneration = group.generation;
              }
            });
            
            memberGenerations.set(member.id, closestGeneration);
          } else {
            // Default to generation 0 if no other members with birth years
            memberGenerations.set(member.id, 0);
          }
        } else {
          // Default to generation 0 if no birth date
          memberGenerations.set(member.id, 0);
        }
      }
    });
    
    // Group members by generation
    const generationGroups: GenerationGroup[] = [];
    
    memberGenerations.forEach((generation, memberId) => {
      const member = familyMembers.find(m => m.id === memberId);
      if (!member) return;
      
      while (generationGroups.length <= generation) {
        generationGroups.push({ generation: generationGroups.length, members: [] });
      }
      
      generationGroups[generation].members.push(member);
    });
    
    // Sort each generation by birth date if available
    generationGroups.forEach(group => {
      group.members.sort((a, b) => {
        const aYear = getBirthYear(a) || 0;
        const bYear = getBirthYear(b) || 0;
        return aYear - bYear;
      });
    });
    
    setGenerations(generationGroups);
  }, [familyMembers, relationships]);

  const navigateToPrevGeneration = () => {
    if (currentGenerationIndex > 0) {
      setCurrentGenerationIndex(currentGenerationIndex - 1);
    }
  };

  const navigateToNextGeneration = () => {
    if (currentGenerationIndex < generations.length - 1) {
      setCurrentGenerationIndex(currentGenerationIndex + 1);
    }
  };

  // Scroll to selected generation
  useEffect(() => {
    if (timelineRef.current && generations.length > 0) {
      const scrollContainer = timelineRef.current;
      const width = scrollContainer.clientWidth;
      scrollContainer.scrollLeft = currentGenerationIndex * width;
    }
  }, [currentGenerationIndex, generations]);

  if (generations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Generational Timeline</CardTitle>
          <CardDescription>No family data available for timeline view.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Generational Timeline</CardTitle>
            <CardDescription>Browse family members by generation</CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={navigateToPrevGeneration}
              disabled={currentGenerationIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-2 text-sm font-medium">
              Generation {currentGenerationIndex + 1} of {generations.length}
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={navigateToNextGeneration}
              disabled={currentGenerationIndex === generations.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative w-full">
          {/* Timeline scroll container */}
          <div 
            ref={timelineRef}
            className="overflow-hidden w-full"
            style={{ scrollBehavior: 'smooth' }}
          >
            <div className="flex" style={{ width: `${generations.length * 100}%` }}>
              {generations.map((genGroup, genIndex) => (
                <div 
                  key={`generation-${genIndex}`} 
                  className="flex-1"
                >
                  <div className="mb-4 text-lg font-semibold text-center">
                    {genIndex === 0 ? 'Ancestors' : genIndex === 1 ? 'Parents' : `Generation ${genIndex + 1}`}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {genGroup.members.map(member => {
                      const birthYear = getBirthYear(member);
                      return (
                        <div 
                          key={`member-${member.id}`}
                          className={cn(
                            "p-4 border rounded-md cursor-pointer transition-all transform hover:scale-105",
                            "hover:shadow-md hover:border-primary",
                            currentGenerationIndex === genIndex ? "opacity-100" : "opacity-70"
                          )}
                          onClick={() => onSelectMember(member)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium">{member.name}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <span>{member.role}</span>
                                {birthYear && (
                                  <>
                                    <span className="text-xs">•</span>
                                    <Calendar className="h-3 w-3" />
                                    <span>{birthYear}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Generation indicators */}
          <div className="flex justify-center mt-6 gap-1">
            {generations.map((_, index) => (
              <button
                key={`indicator-${index}`}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  currentGenerationIndex === index 
                    ? "bg-primary w-4" 
                    : "bg-muted hover:bg-primary/50"
                )}
                onClick={() => setCurrentGenerationIndex(index)}
                aria-label={`View generation ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GenerationalTimeline;